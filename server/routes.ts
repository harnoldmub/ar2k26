import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { getSession } from "./replitAuth";
import { setupLocalAuth, isLocallyAuthenticated } from "./localAuth";
import { insertRsvpResponseSchema, updateRsvpResponseSchema, insertContributionSchema, rsvpResponses, giftListSignups, insertGiftListSignupSchema, insertGuestbookEntrySchema } from "@shared/schema";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "./db";
import { sendRsvpConfirmationEmail, sendPersonalizedInvitation, sendGuestConfirmationEmail, sendContributionNotification, sendContributorThankYou, sendDateChangeApologyEmail, sendGalaInvitationEmail, sendInvitation21Email, buildGalaEmailHtml, buildInvitation21EmailHtml, sendReminderEmail, buildReminderEmailHtml } from "./email";
import passport from "passport";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

/** Mirror of client-side buildInvitationName — keeps solo/couple naming consistent */
function buildInvitationName(firstName: string, lastName: string, partySize: number): string {
  const isCouple = partySize >= 2;
  const alreadyCouple = firstName.toLowerCase().startsWith("couple");
  if (isCouple && !alreadyCouple) return `Couple ${lastName}`.trim();
  if (isCouple && alreadyCouple) return firstName.trim();
  return `${firstName} ${lastName}`.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Local auth setup
  setupLocalAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return null if not authenticated instead of 401
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.json(null);
      }

      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  // RSVP routes
  app.post("/api/rsvp", async (req, res) => {
    try {
      console.log("POST /api/rsvp - Request body:", JSON.stringify(req.body, null, 2));
      const validated = insertRsvpResponseSchema.parse(req.body);
      console.log("POST /api/rsvp - Validated data:", JSON.stringify(validated, null, 2));

      // Check for duplicates (same email + firstname)
      if (validated.email) {
        const existing = await storage.getRsvpByEmailAndFirstName(validated.email, validated.firstName);
        if (existing) {
          return res.status(409).json({
            message: "Vous êtes déjà inscrit avec cette adresse email et ce prénom."
          });
        }
      }

      const response = await storage.createRsvpResponse(validated);

      // Send email confirmation to couple (non-blocking)
      sendRsvpConfirmationEmail({
        firstName: response.firstName,
        lastName: response.lastName,
        availability: response.availability,
      }).catch(err => {
        console.error("Failed to send RSVP confirmation email:", err);
      });

      // Send confirmation email to guest if they provided an email (non-blocking)
      if (response.email) {
        sendGuestConfirmationEmail({
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          availability: response.availability,
        }).catch(err => {
          console.error("Failed to send guest confirmation email:", err);
        });
      }

      res.json(response);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      // If it's a Zod error, log the issues
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Zod validation issues:", JSON.stringify((error as any).issues, null, 2));
        return res.status(400).json({
          message: "Données invalides",
          details: (error as any).issues
        });
      }
      res.status(400).json({ message: "Données de requête invalides" });
    }
  });

  app.get("/api/rsvp", isLocallyAuthenticated, async (req, res) => {
    try {
      const responses = await storage.getAllRsvpResponses();
      res.json(responses);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des RSVP" });
    }
  });

  app.patch("/api/rsvp/:id", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tableNumber, invitationType } = req.body;
      if (invitationType !== undefined) {
        const parsed = parseInt(invitationType);
        if ([1, 2, 3, 4].includes(parsed)) {
          const [response] = await db
            .update(rsvpResponses)
            .set({ invitationType: parsed })
            .where(eq(rsvpResponses.id, id))
            .returning();
          return res.json(response);
        }
        return res.status(400).json({ message: "Type d'invitation invalide (1, 2, 3 ou 4)" });
      }
      const response = await storage.updateRsvpTableNumber(id, tableNumber);
      res.json(response);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du RSVP" });
    }
  });

  app.delete("/api/rsvp/:id", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRsvpResponse(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting RSVP:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du RSVP" });
    }
  });

  app.put("/api/rsvp/:id", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("PUT /api/rsvp/:id - Request body:", JSON.stringify(req.body, null, 2));
      
      // Get the current guest data before update to detect availability changes
      const currentGuest = await storage.getRsvpResponse(id);
      const previousAvailability = currentGuest?.availability;
      
      const validated = updateRsvpResponseSchema.parse(req.body);
      console.log("PUT /api/rsvp/:id - Validated data:", JSON.stringify(validated, null, 2));

      // Auto-sync: if admin sets availability to "unavailable", force status to "declined"
      // If admin sets availability to an attending value and status was "declined", reset to "pending"
      if (validated.availability === "unavailable" && validated.status !== "declined") {
        validated.status = "declined";
      } else if (
        validated.availability &&
        validated.availability !== "unavailable" &&
        validated.status === "declined"
      ) {
        validated.status = "pending";
      }

      const response = await storage.updateRsvpResponse(id, validated);
      
      // Check if availability changed from "both" to "21-march" only
      const newAvailability = validated.availability;
      if (previousAvailability === 'both' && newAvailability === '21-march') {
        // Send apology email if the guest has an email
        if (response && response.email) {
          try {
            await sendDateChangeApologyEmail({
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
            });
            console.log(`Date change apology email sent to ${response.email}`);
          } catch (emailError) {
            console.error("Failed to send date change apology email:", emailError);
            // Don't fail the update if email fails
          }
        }
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      // If it's a Zod error, log the issues
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Zod validation issues:", JSON.stringify((error as any).issues, null, 2));
      }
      res.status(400).json({
        message: "Données de requête invalides",
        error: error instanceof Error ? error.message : String(error),
        details: error && typeof error === 'object' && 'issues' in error ? (error as any).issues : undefined
      });
    }
  });
  // Bulk Confirm Route
  app.post("/api/rsvp/bulk-confirm", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "Liste d'identifiants requise" });
      }

      for (const id of ids) {
        const guest = await storage.getRsvpResponse(id);
        if (guest) {
          // Update status and confirmedAt
          await storage.updateRsvpResponse(id, {
            firstName: guest.firstName,
            lastName: guest.lastName,
            partySize: guest.partySize,
            availability: guest.availability,
            status: 'confirmed',
            confirmedAt: new Date()
          } as any);
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error bulk confirming:", error);
      res.status(500).json({ message: "Erreur lors de la confirmation" });
    }
  });

  // Bulk Update Invitation Type
  app.post("/api/rsvp/bulk-invitation-type", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids, invitationType } = req.body;
      if (!Array.isArray(ids) || ![1, 2, 3, 4].includes(invitationType)) {
        return res.status(400).json({ message: "Liste d'identifiants et type d'invitation (1, 2, 3 ou 4) requis" });
      }

      for (const id of ids) {
        await db
          .update(rsvpResponses)
          .set({ invitationType })
          .where(eq(rsvpResponses.id, id));
      }
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error bulk updating invitation type:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du type d'invitation" });
    }
  });

  // Bulk Send Invitation Route
  app.post("/api/rsvp/bulk-send-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "Liste d'identifiants requise" });
      }

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          let guest = await storage.getRsvpResponse(id);
          if (!guest) {
            errors.push(`Invité ${id} non trouvé`);
            failCount++;
            continue;
          }
          if (!guest.email) {
            errors.push(`${guest.firstName} ${guest.lastName}: pas d'email`);
            failCount++;
            continue;
          }

          // Generate token if missing
          let qrToken = guest.qrToken;
          if (!qrToken) {
            qrToken = crypto.randomUUID();
            guest = await storage.updateRsvpResponse(id, {
              ...guest,
              qrToken
            } as any);
          }

          await sendPersonalizedInvitation({
            id: guest.id,
            email: guest.email!,
            firstName: guest.firstName,
            lastName: guest.lastName,
            qrToken: qrToken
          });

          // Update Timestamp and set status to confirmed
          await storage.updateRsvpResponse(id, {
            ...guest,
            invitationSentAt: new Date(),
            status: 'confirmed'
          } as any);

          successCount++;
        } catch (err) {
          console.error(`Error sending invitation to ${id}:`, err);
          failCount++;
        }
      }

      res.json({ success: true, sent: successCount, failed: failCount, errors });
    } catch (error) {
      console.error("Error bulk sending invitations:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi des invitations" });
    }
  });

  // Bulk Resend Confirmation Route
  app.post("/api/rsvp/bulk-resend-confirmation", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "Liste d'identifiants requise" });
      }

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const guest = await storage.getRsvpResponse(id);
          if (!guest) {
            errors.push(`Invité ${id} non trouvé`);
            failCount++;
            continue;
          }
          if (!guest.email) {
            errors.push(`${guest.firstName} ${guest.lastName}: pas d'email`);
            failCount++;
            continue;
          }
          if (!guest.availability || guest.availability === 'pending') {
            errors.push(`${guest.firstName} ${guest.lastName}: n'a pas encore répondu`);
            failCount++;
            continue;
          }

          await sendGuestConfirmationEmail({
            email: guest.email,
            firstName: guest.firstName,
            lastName: guest.lastName,
            availability: guest.availability
          });

          successCount++;
        } catch (err) {
          console.error(`Error sending confirmation to ${id}:`, err);
          failCount++;
        }
      }

      res.json({ success: true, sent: successCount, failed: failCount, errors });
    } catch (error) {
      console.error("Error bulk sending confirmations:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi des confirmations" });
    }
  });

  // Site Configuration (for frontend to get production URL)
  app.get("/api/site-config", (req, res) => {
    const siteUrl = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
    res.json({ siteUrl });
  });

  app.get("/api/settings/cagnotte-visible", async (_req, res) => {
    try {
      const result = await db.execute(sql`SELECT value FROM app_settings WHERE key = 'cagnotte_visible'`);
      const value = (result.rows[0] as any)?.value ?? 'true';
      res.json({ visible: value === 'true' });
    } catch {
      res.json({ visible: true });
    }
  });

  app.post("/api/settings/cagnotte-visible", isLocallyAuthenticated, async (req, res) => {
    try {
      const { visible } = req.body as { visible: boolean };
      await db.execute(sql`INSERT INTO app_settings (key, value) VALUES ('cagnotte_visible', ${String(visible)}) ON CONFLICT (key) DO UPDATE SET value = ${String(visible)}`);
      res.json({ visible });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Decline Invitation Route — public, no auth required
  app.get("/api/rsvp/decline/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.redirect("/decline-confirmed?status=error");

      const guest = await storage.getRsvpResponseByQrToken(token);
      if (!guest) return res.redirect("/decline-confirmed?status=error");

      // Already declined — do not process again
      if (guest.status === "declined") {
        return res.redirect(`/decline-confirmed?name=${encodeURIComponent(guest.firstName)}&status=already`);
      }

      await storage.updateRsvpResponse(guest.id, {
        ...guest,
        availability: "unavailable",
        status: "declined",
      } as any);

      return res.redirect(`/decline-confirmed?name=${encodeURIComponent(guest.firstName)}`);
    } catch (err) {
      console.error("Error processing decline:", err);
      return res.redirect("/decline-confirmed?status=error");
    }
  });

  // Confirm attendance via token link (from reminder email)
  app.get("/api/rsvp/confirm/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.redirect("/rsvp-confirmed?status=error");

      const guest = await storage.getRsvpResponseByQrToken(token);
      if (!guest) return res.redirect("/rsvp-confirmed?status=error");

      // Already confirmed — do not process again
      if (guest.status === "confirmed") {
        return res.redirect(`/rsvp-confirmed?name=${encodeURIComponent(guest.firstName)}&status=already`);
      }

      // "Both" availability guests → ask which date(s) they're confirming
      if (guest.availability === "both") {
        return res.redirect(
          `/rsvp-confirm-choice?token=${encodeURIComponent(token)}&name=${encodeURIComponent(guest.firstName)}`
        );
      }

      // Single date guests → confirm directly
      await storage.updateRsvpResponse(guest.id, {
        ...guest,
        status: "confirmed",
        confirmedAt: new Date(),
      } as any);

      return res.redirect(`/rsvp-confirmed?name=${encodeURIComponent(guest.firstName)}`);
    } catch (err) {
      console.error("Error processing confirm:", err);
      return res.redirect("/rsvp-confirmed?status=error");
    }
  });

  // Confirm choice for "both" availability guests
  app.get("/api/rsvp/confirm-choice/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const choice = req.query.choice as string;

      if (!token || !choice) return res.redirect("/rsvp-confirmed?status=error");
      if (!["both", "19-march", "21-march"].includes(choice)) return res.redirect("/rsvp-confirmed?status=error");

      const guest = await storage.getRsvpResponseByQrToken(token);
      if (!guest) return res.redirect("/rsvp-confirmed?status=error");

      // Already confirmed — do not process again
      if (guest.status === "confirmed") {
        return res.redirect(`/rsvp-confirmed?name=${encodeURIComponent(guest.firstName)}&status=already`);
      }

      await storage.updateRsvpResponse(guest.id, {
        ...guest,
        availability: choice,
        status: "confirmed",
        confirmedAt: new Date(),
      } as any);

      return res.redirect(`/rsvp-confirmed?name=${encodeURIComponent(guest.firstName)}&choice=${choice}`);
    } catch (err) {
      console.error("Error processing confirm-choice:", err);
      return res.redirect("/rsvp-confirmed?status=error");
    }
  });

  // Send reminder email to a single guest
  app.post("/api/rsvp/:id/send-reminder", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ error: "Invité non trouvé" });
      if (!guest.email) return res.status(400).json({ error: "Cet invité n'a pas d'email" });

      // Ensure qrToken exists
      let token = guest.qrToken;
      if (!token) {
        token = crypto.randomUUID();
        await storage.updateRsvpResponse(id, { ...guest, qrToken: token } as any);
      }

      await sendReminderEmail({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        availability: guest.availability || "both",
        qrToken: token,
      });

      await storage.updateRsvpResponse(id, { ...guest, qrToken: token, reminderSentAt: new Date() } as any);

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error sending reminder:", err);
      res.status(500).json({ error: err.message || "Erreur lors de l'envoi" });
    }
  });

  // Bulk send reminder emails
  app.post("/api/rsvp/bulk-send-reminder", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "Aucun invité sélectionné" });

      let sent = 0;
      let failed = 0;

      for (const id of ids) {
        try {
          const guest = await storage.getRsvpResponse(id);
          if (!guest || !guest.email) { failed++; continue; }

          let token = guest.qrToken;
          if (!token) {
            token = crypto.randomUUID();
          }

          await sendReminderEmail({
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            availability: guest.availability || "both",
            qrToken: token,
          });

          await storage.updateRsvpResponse(id, { ...guest, qrToken: token, reminderSentAt: new Date() } as any);
          sent++;
        } catch {
          failed++;
        }
      }

      res.json({ sent, failed });
    } catch (err: any) {
      console.error("Error bulk sending reminders:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Reminder email preview — admin only
  app.get("/api/rsvp/:id/reminder-preview", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).send("<h1>Invité non trouvé</h1>");

      const domain = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
      const confirmLink = guest.qrToken ? `${domain}/api/rsvp/confirm/${guest.qrToken}` : "#(lien-après-envoi)";
      const declineLink = guest.qrToken ? `${domain}/api/rsvp/decline/${guest.qrToken}` : "#(lien-après-envoi)";

      const now = new Date();
      const date19 = new Date("2026-03-19T00:00:00Z");
      const date21 = new Date("2026-03-21T00:00:00Z");
      const targetDate = guest.availability === "21-march" ? date21 : date19;
      const weddingDateLabel = guest.availability === "21-march" ? "21 mars 2026" : "19 mars 2026";
      const daysUntil = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const html = buildReminderEmailHtml({ firstName: guest.firstName, daysUntil, weddingDateLabel, confirmLink, declineLink });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      res.status(500).send("<h1>Erreur</h1>");
    }
  });

  // Email Preview Route — admin only
  app.get("/api/rsvp/:id/email-preview", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const type = req.query.type as string || "21";
      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).send("<h1>Invité non trouvé</h1>");

      const domain = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
      const declineLink = guest.qrToken ? `${domain}/api/rsvp/decline/${guest.qrToken}` : "#(lien-après-envoi)";

      let html: string;
      if (type === "gala") {
        const invName = buildInvitationName(guest.firstName, guest.lastName, guest.partySize || 1);
        const tableParam = guest.tableNumber ? `&table=${guest.tableNumber}` : "";
        const galaLink = `${domain}/gala/${encodeURIComponent(invName)}?type=${guest.invitationType || 1}${tableParam}`;
        html = buildGalaEmailHtml({ firstName: guest.firstName, galaLink, declineLink });
      } else {
        const invitationLink = `${domain}/guest/${guest.id}`;
        html = buildInvitation21EmailHtml({ firstName: guest.firstName, invitationLink, declineLink });
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error("Error generating email preview:", err);
      res.status(500).send("<h1>Erreur</h1>");
    }
  });

  // Check-in Route
  app.get("/api/checkin", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token requis" });
      }

      const guest = await storage.getRsvpResponseByQrToken(token);
      if (!guest) {
        return res.status(404).json({ message: "Invité non trouvé ou token invalide" });
      }

      res.json({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        partySize: guest.partySize,
        tableNumber: guest.tableNumber,
        status: guest.status,
        availability: guest.availability,
        checkedInAt: guest.checkedInAt,
        groupType: guest.partySize > 1 ? 'Couple' : 'Solo'
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Mark Guest as Checked In
  app.post("/api/checkin/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      await storage.updateRsvpResponse(id, {
        ...guest,
        checkedInAt: new Date(),
        status: 'confirmed' // Ensure they are confirmed if checking in
      } as any);

      res.json({ success: true });
    } catch (error) {
      console.error("Check-in confirmation error:", error);
      res.status(500).json({ message: "Erreur lors de l'enregistrement" });
    }
  });

  // Remove check-in
  app.delete("/api/checkin/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.update(rsvpResponses)
        .set({ checkedInAt: null })
        .where(eq(rsvpResponses.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Accueil agents - public guest list (limited fields)
  app.get("/api/accueil/guests", async (req, res) => {
    try {
      const guests = await storage.getAllRsvpResponses();
      const limited = guests.map(g => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        partySize: g.partySize,
        tableNumber: g.tableNumber,
        availability: g.availability,
        checkedInAt: g.checkedInAt,
      }));
      res.json(limited);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Bulk assign table to multiple guests
  app.post("/api/rsvp/bulk-assign-table", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids, tableNumber } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Liste d'IDs requise" });
      }
      for (const id of ids) {
        const guest = await storage.getRsvpResponse(id);
        if (guest) {
          await storage.updateRsvpResponse(id, { ...guest, tableNumber: tableNumber ?? null } as any);
        }
      }
      res.json({ success: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Send Invitation (Email) - Specific Guest
  app.post("/api/rsvp/:id/send-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      if (!guest.email) return res.status(400).json({ message: "Email manquant pour cet invité" });

      // Generate token if missing
      let qrToken = guest.qrToken;
      if (!qrToken) {
        qrToken = crypto.randomUUID();
        guest = await storage.updateRsvpResponse(id, {
          ...guest,
          qrToken
        } as any);
      }

      // Send Email
      if (!guest.email) {
        // Should not happen as we checked before, but after update guest is refreshed
        return res.status(400).json({ message: "Email manquant" });
      }

      await sendPersonalizedInvitation({
        id: guest.id,
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        qrToken: qrToken
      });

      // Update Timestamp and set status to confirmed
      await storage.updateRsvpResponse(id, {
        ...guest,
        invitationSentAt: new Date(),
        status: 'confirmed'
      } as any);

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation" });
    }
  });

  // Send Invitation 21 Email - Specific Guest
  app.post("/api/rsvp/:id/send-invitation-21", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });
      if (!guest.email) return res.status(400).json({ message: "Email manquant pour cet invité" });

      let qrToken = guest.qrToken;
      if (!qrToken) {
        qrToken = crypto.randomUUID();
        guest = await storage.updateRsvpResponse(id, { ...guest, qrToken } as any);
      }

      await sendInvitation21Email({
        id: guest.id,
        email: guest.email!,
        firstName: guest.firstName,
        lastName: guest.lastName,
        qrToken: qrToken!,
      });

      await db
        .update(rsvpResponses)
        .set({ invitation21SentAt: new Date() })
        .where(eq(rsvpResponses.id, id));

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation 21" });
    }
  });

  // Bulk Send Invitation 21 Email
  app.post("/api/rsvp/bulk-send-invitation-21", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "Liste d'identifiants requise" });
      }

      let successCount = 0;
      let errorCount = 0;

      for (const id of ids) {
        try {
          const guest = await storage.getRsvpResponse(id);
          if (!guest || !guest.email) {
            errorCount++;
            continue;
          }

          await sendInvitation21Email({
            id: guest.id,
            email: guest.email,
            firstName: guest.firstName,
            lastName: guest.lastName,
            qrToken: guest.qrToken ?? undefined,
          });

          await db
            .update(rsvpResponses)
            .set({ invitation21SentAt: new Date() })
            .where(eq(rsvpResponses.id, id));

          successCount++;
        } catch (err) {
          console.error(`Error sending invitation 21 to guest ${id}:`, err);
          errorCount++;
        }
      }

      res.json({ success: true, successCount, errorCount });
    } catch (error) {
      console.error("Error bulk sending invitation 21:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi groupé" });
    }
  });

  // Smart Send Invitation - sends DOT19, Gala 21, or both based on availability
  app.post("/api/rsvp/:id/send-smart-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });
      if (!guest.email) return res.status(400).json({ message: "Email manquant pour cet invité" });

      const avail = guest.availability;
      const sent: string[] = [];

      if (avail === "19-march" || avail === "both") {
        let qrToken = guest.qrToken;
        if (!qrToken) {
          qrToken = crypto.randomUUID();
          guest = await storage.updateRsvpResponse(id, { ...guest, qrToken } as any);
        }
        await sendPersonalizedInvitation({
          id: guest.id,
          email: guest.email!,
          firstName: guest.firstName,
          lastName: guest.lastName,
          qrToken: qrToken!,
        });
        await storage.updateRsvpResponse(id, { ...guest, invitationSentAt: new Date(), status: "confirmed" } as any);
        sent.push("19");
      }

      if (avail === "21-march" || avail === "both") {
        // Ensure qrToken exists (may have been set in 19-march branch above)
        let qrToken21 = guest.qrToken;
        if (!qrToken21) {
          qrToken21 = crypto.randomUUID();
          guest = await storage.updateRsvpResponse(id, { ...guest, qrToken: qrToken21 } as any);
        }
        await sendInvitation21Email({
          id: guest.id,
          email: guest.email!,
          firstName: guest.firstName,
          lastName: guest.lastName,
          qrToken: qrToken21!,
        });
        await db.update(rsvpResponses).set({ invitation21SentAt: new Date() }).where(eq(rsvpResponses.id, id));
        sent.push("21");
      }

      res.json({ success: true, sent });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation" });
    }
  });

  // Bulk Smart Send Invitation
  app.post("/api/rsvp/bulk-send-smart-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ message: "Liste d'identifiants requise" });

      let successCount = 0;
      let errorCount = 0;

      for (const id of ids) {
        try {
          let guest = await storage.getRsvpResponse(id);
          if (!guest || !guest.email) { errorCount++; continue; }

          const avail = guest.availability;

          if (avail === "19-march" || avail === "both") {
            let qrToken = guest.qrToken;
            if (!qrToken) {
              qrToken = crypto.randomUUID();
              guest = await storage.updateRsvpResponse(id, { ...guest, qrToken } as any);
            }
            await sendPersonalizedInvitation({
              id: guest.id,
              email: guest.email!,
              firstName: guest.firstName,
              lastName: guest.lastName,
              qrToken: qrToken!,
            });
            await storage.updateRsvpResponse(id, { ...guest, invitationSentAt: new Date(), status: "confirmed" } as any);
          }

          if (avail === "21-march" || avail === "both") {
            let qrToken21 = guest.qrToken;
            if (!qrToken21) {
              qrToken21 = crypto.randomUUID();
              guest = await storage.updateRsvpResponse(id, { ...guest, qrToken: qrToken21 } as any);
            }
            await sendInvitation21Email({
              id: guest.id,
              email: guest.email!,
              firstName: guest.firstName,
              lastName: guest.lastName,
              qrToken: qrToken21!,
            });
            await db.update(rsvpResponses).set({ invitation21SentAt: new Date() }).where(eq(rsvpResponses.id, id));
          }

          successCount++;
        } catch (err) {
          console.error(`Error sending smart invitation to guest ${id}:`, err);
          errorCount++;
        }
      }

      res.json({ success: true, successCount, errorCount });
    } catch (error) {
      console.error("Error bulk sending smart invitations:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi groupé" });
    }
  });

  // Resend Confirmation Email - Specific Guest
  app.post("/api/rsvp/:id/resend-confirmation", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      if (!guest.email) return res.status(400).json({ message: "Email manquant pour cet invité" });

      if (!guest.availability || guest.availability === 'pending') {
        return res.status(400).json({ message: "Cet invité n'a pas encore répondu au RSVP" });
      }

      await sendGuestConfirmationEmail({
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        availability: guest.availability
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'envoi du mail de confirmation" });
    }
  });

  // Send Gala Invitation Email
  app.post("/api/rsvp/:id/send-gala-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });
      if (!guest.email) return res.status(400).json({ message: "Email manquant pour cet invité" });

      let qrToken = guest.qrToken;
      if (!qrToken) {
        qrToken = crypto.randomUUID();
        guest = await storage.updateRsvpResponse(id, { ...guest, qrToken } as any);
      }

      const domain = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
      const invName = buildInvitationName(guest.firstName, guest.lastName, guest.partySize || 1);
      const tableParam = guest.tableNumber ? `&table=${guest.tableNumber}` : "";
      const galaLink = `${domain}/gala/${encodeURIComponent(invName)}?type=${guest.invitationType || 1}${tableParam}`;

      await sendGalaInvitationEmail({
        email: guest.email!,
        firstName: guest.firstName,
        lastName: guest.lastName,
        galaLink,
        qrToken: qrToken!,
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation gala" });
    }
  });

  // WhatsApp Log Route
  app.post("/api/rsvp/:id/whatsapp-log", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      // Generate token if missing
      let qrToken = guest.qrToken;
      if (!qrToken) {
        qrToken = crypto.randomUUID();
        guest = await storage.updateRsvpResponse(id, {
          ...guest,
          qrToken
        } as any);
      }

      // Update Timestamp
      await storage.updateRsvpResponse(id, {
        ...guest,
        whatsappInvitationSentAt: new Date()
      } as any);

      res.json({
        success: true,
        phone: guest.phone,
        qrToken
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'enregistrement WhatsApp" });
    }
  });

  // Public Guest Lookup (for Invitation)
  app.get("/api/guests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Identifiant invalide" });
      }

      const response = await storage.getRsvpResponse(id);

      // Check if guest exists
      if (!response) {
        return res.status(404).json({ message: "Invité non trouvé" });
      }

      // Check if table is assigned (Confirmation logic) - DISABLED per user request
      /* if (!response.tableNumber) {
        return res.status(403).json({ message: "Votre invitation est en cours de traitement. Veuillez réessayer plus tard." });
      } */

      // Return public info only
      res.json({
        firstName: response.firstName,
        lastName: response.lastName,
        tableNumber: response.tableNumber,
        partySize: response.partySize,
        availability: response.availability
      });
    } catch (error) {
      console.error("Error fetching guest:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Bulk Import Route
  app.post("/api/rsvp/bulk", isLocallyAuthenticated, async (req, res) => {
    try {
      const guests = req.body;
      if (!Array.isArray(guests)) {
        return res.status(400).json({ message: "L'entrée doit être un tableau" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const guest of guests) {
        try {
          const guestData = {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email || null,
            phone: guest.phone || null,
            partySize: guest.partySize || 1,
            availability: guest.availability || 'pending',
            notes: guest.notes || null,
          };

          await storage.createRsvpResponse(guestData);
          results.success++;
        } catch (error: any) {
          console.error("Error importing guest:", guest, error);
          results.failed++;
          results.errors.push(`Guest ${guest.firstName} ${guest.lastName}: ${error.message}`);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error in bulk import:", error);
      res.status(500).json({ message: "Erreur lors de l'import en masse" });
    }
  });

  // CSV export route with filtering support
  app.get("/api/rsvp/export/csv", isLocallyAuthenticated, async (req, res) => {
    try {
      const searchQuery = (req.query.search as string) || '';
      const availabilityFilter = (req.query.availability as string) || '';
      
      let responses = await storage.getAllRsvpResponses();

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        responses = responses.filter(r => 
          r.firstName.toLowerCase().includes(query) ||
          r.lastName.toLowerCase().includes(query) ||
          (r.email && r.email.toLowerCase().includes(query))
        );
      }

      // Apply availability filter
      if (availabilityFilter) {
        responses = responses.filter(r => {
          if (availabilityFilter === '19-march') {
            return r.availability === '19-march' || r.availability === 'both';
          }
          if (availabilityFilter === '21-march') {
            return r.availability === '21-march' || r.availability === 'both';
          }
          return r.availability === availabilityFilter;
        });
      }

      // Create CSV content with Personne and Statut columns
      const headers = ['ID', 'Prénom', 'Nom', 'Personne', 'Statut', 'Disponibilité', 'Numéro de table', 'Date de réponse'];
      const csvRows = [headers.join(',')];

      responses.forEach(response => {
        const availabilityText = {
          '19-march': '19 mars',
          '21-march': '21 mars',
          'both': 'Les deux dates',
          'unavailable': 'Pas disponible'
        }[response.availability] || response.availability;

        const statusText = {
          'pending': 'En attente',
          'confirmed': 'Confirmé',
          'cancelled': 'Annulé'
        }[response.status || 'pending'] || response.status || 'En attente';

        const row = [
          response.id,
          `"${response.firstName}"`,
          `"${response.lastName}"`,
          response.partySize || 1,
          `"${statusText}"`,
          `"${availabilityText}"`,
          response.tableNumber || '',
          response.createdAt ? new Date(response.createdAt).toLocaleDateString('fr-FR') : ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rsvp-golden-love-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 support
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Erreur lors de l'export CSV" });
    }
  });

  // Guest invitation page - get guest data and matching PDF
  app.post("/api/invitation/guest/:id/track-view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalide" });

      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      await db
        .update(rsvpResponses)
        .set({ invitationViewedAt: new Date() })
        .where(eq(rsvpResponses.id, id));

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/rsvp/:id/toggle-seating", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalide" });

      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      const [updated] = await db
        .update(rsvpResponses)
        .set({ seatingConfirmed: !guest.seatingConfirmed })
        .where(eq(rsvpResponses.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/rsvp/:id/toggle-brunch", isLocallyAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalide" });

      const guest = await storage.getRsvpResponse(id);
      if (!guest) return res.status(404).json({ message: "Invité non trouvé" });

      const [updated] = await db
        .update(rsvpResponses)
        .set({ brunchInvited: !guest.brunchInvited })
        .where(eq(rsvpResponses.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/invitation/guest/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const response = await storage.getRsvpResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Invité non trouvé" });
      }

      // Find matching PDF in invitations_dot folder
      const fs = await import('fs');
      const path = await import('path');
      const dotFolder = path.join(process.cwd(), 'client', 'public', 'invitations_dot');
      
      // Helper function to normalize text (trim, remove accents, lowercase)
      const normalizeText = (text: string): string => {
        return text
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
          .replace(/\s+/g, '_')
          .toLowerCase();
      };
      
      let pdfUrl: string | null = null;
      
      if (fs.existsSync(dotFolder)) {
        const files = fs.readdirSync(dotFolder);
        
        // Build the expected filename following the exact naming convention:
        // 1. Base name: "{firstName} {lastName}"
        // 2. If partySize = 2 and "Couple" not already in firstName: add "Couple " prefix
        // 3. Replace spaces with underscores
        // 4. Add "Invitation_" prefix and ".pdf" suffix
        
        const firstNameRaw = response.firstName.trim();
        const lastNameRaw = response.lastName.trim();
        const isCouple = response.partySize >= 2;
        const hasCouplePrefixAlready = firstNameRaw.toLowerCase().startsWith('couple');
        
        let baseName: string;
        if (isCouple && !hasCouplePrefixAlready) {
          // Add "Couple" prefix for couples that don't have it
          baseName = `Couple ${firstNameRaw} ${lastNameRaw}`;
        } else {
          // Solo or couple with "Couple" already in name
          baseName = `${firstNameRaw} ${lastNameRaw}`;
        }
        
        // Build expected filename (normalize for comparison)
        const expectedFilename = `invitation_${normalizeText(baseName)}.pdf`;
        
        console.log(`Guest: "${firstNameRaw} ${lastNameRaw}", partySize=${response.partySize}, hasCouple=${hasCouplePrefixAlready}`);
        console.log(`Expected filename: ${expectedFilename}`);
        
        // Try exact match first
        for (const file of files) {
          const fileNormalized = normalizeText(file);
          if (fileNormalized === expectedFilename) {
            pdfUrl = `/invitations_dot/${file}`;
            console.log(`Found exact match: ${file}`);
            break;
          }
        }
        
        // Fallback 1: Try without Couple prefix (in case partySize is wrong in DB)
        if (!pdfUrl && isCouple && !hasCouplePrefixAlready) {
          const fallbackName = `invitation_${normalizeText(`${firstNameRaw} ${lastNameRaw}`)}.pdf`;
          for (const file of files) {
            const fileNormalized = normalizeText(file);
            if (fileNormalized === fallbackName) {
              pdfUrl = `/invitations_dot/${file}`;
              console.log(`Found fallback (no Couple): ${file}`);
              break;
            }
          }
        }
        
        // Fallback 2: Try with Couple prefix (in case partySize is wrong in DB)
        if (!pdfUrl && !isCouple) {
          const fallbackName = `invitation_${normalizeText(`Couple ${firstNameRaw} ${lastNameRaw}`)}.pdf`;
          for (const file of files) {
            const fileNormalized = normalizeText(file);
            if (fileNormalized === fallbackName) {
              pdfUrl = `/invitations_dot/${file}`;
              console.log(`Found fallback (with Couple): ${file}`);
              break;
            }
          }
        }
        
        // Fallback 3: Search by firstName AND lastName anywhere in filename
        if (!pdfUrl) {
          const firstNameNorm = normalizeText(firstNameRaw);
          const lastNameNorm = normalizeText(lastNameRaw);
          for (const file of files) {
            const fileNormalized = normalizeText(file);
            if (fileNormalized.includes(firstNameNorm) && fileNormalized.includes(lastNameNorm)) {
              pdfUrl = `/invitations_dot/${file}`;
              console.log(`Found by name search: ${file}`);
              break;
            }
          }
        }
        
        console.log(`Final PDF result: ${pdfUrl || 'NOT FOUND'}`);
      }

      res.json({
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName,
        availability: response.availability,
        partySize: response.partySize || 1,
        invitationType: response.invitationType || 1,
        tableNumber: response.tableNumber || null,
        brunchInvited: response.brunchInvited ?? false,
        pdfUrl,
      });
    } catch (error) {
      console.error("Error fetching dot guest:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'invité" });
    }
  });

  // Send invitation email route (Legacy or Generic)
  app.post("/api/send-invitation", isLocallyAuthenticated, async (req, res) => {
    try {
      const { email, firstName, lastName, message } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, prénom et nom requis" });
      }

      await sendPersonalizedInvitation({
        email,
        firstName,
        lastName,
        message,
      });

      res.json({ success: true, message: "Invitation envoyée avec succès" });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Échec de l'envoi de l'invitation" });
    }
  });

  // Stripe Contribution Routes
  
  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la configuration Stripe" });
    }
  });

  // Create checkout session for wedding contribution
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { donorName, amount, message } = req.body;
      
      // Validate input
      const validated = insertContributionSchema.parse({ donorName, amount, message });
      
      const stripe = await getUncachableStripeClient();
      
      // Get the base URL for success/cancel redirects
      const baseUrl = process.env.SITE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      // Create Stripe Checkout session with price_data for one-time contributions
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Cagnotte Mariage Ruth & Arnold',
              description: `Contribution de ${validated.donorName}`,
            },
            unit_amount: validated.amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/contribution/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cagnotte`,
        metadata: {
          donorName: validated.donorName,
          message: validated.message || '',
        },
        // Collect customer email for thank you email
        customer_creation: 'if_required',
        billing_address_collection: 'auto',
      });

      // Store contribution in database with pending status
      await storage.createContribution({
        donorName: validated.donorName,
        amount: validated.amount,
        message: validated.message,
        stripeSessionId: session.id,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      if (error.issues) {
        return res.status(400).json({ message: "Données invalides", details: error.issues });
      }
      res.status(500).json({ message: "Erreur lors de la création de la session de paiement" });
    }
  });

  // Verify payment and get contribution details (for thank you page)
  app.get("/api/contribution/verify", async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID requis" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Get contribution details
      const contribution = await storage.getContributionBySessionId(sessionId);
      
      if (session.payment_status === 'paid') {
        // Only update and send emails if not already completed
        if (contribution && contribution.status !== 'completed') {
          const donorName = session.metadata?.donorName || contribution.donorName;
          const amount = session.amount_total || contribution.amount;
          const currency = session.currency || 'eur';
          
          // Try to send email notification to couple
          try {
            await sendContributionNotification({
              donorName,
              amount,
              currency,
              message: contribution.message,
            });
          } catch (emailError) {
            console.error("Failed to send contribution notification email:", emailError);
          }
          
          // Try to send thank you email to contributor if we have their email
          const customerEmail = session.customer_details?.email;
          if (customerEmail) {
            try {
              await sendContributorThankYou({
                email: customerEmail,
                donorName,
                amount,
                currency,
              });
            } catch (emailError) {
              console.error("Failed to send contributor thank you email:", emailError);
            }
          }
          
          // Update contribution status after email attempts
          await storage.updateContributionStatus(
            sessionId, 
            'completed',
            session.payment_intent as string
          );
        }
      }
      
      res.json({
        success: session.payment_status === 'paid',
        donorName: session.metadata?.donorName || contribution?.donorName,
        amount: session.amount_total,
        currency: session.currency,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Erreur lors de la vérification du paiement" });
    }
  });

  // Get total contributions (public endpoint for showing on landing page)
  app.get("/api/contributions/total", async (req, res) => {
    try {
      const total = await storage.getTotalContributions();
      res.json({ total, currency: 'eur' });
    } catch (error) {
      console.error("Error getting total contributions:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du total" });
    }
  });

  app.get("/api/contributions/confirmed", async (req, res) => {
    try {
      const contributions = await storage.getCompletedContributions();
      res.json(contributions);
    } catch (error) {
      console.error("Error getting confirmed contributions:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
  });

  app.get("/api/guestbook/messages", async (_req, res) => {
    try {
      const [guestbookMessages, contributionMessages] = await Promise.all([
        storage.getGuestbookEntries(),
        storage.getCompletedContributions(),
      ]);

      const normalizedMessages = [
        ...guestbookMessages.map((entry) => ({
          id: `guestbook-${entry.id}`,
          authorName: entry.authorName,
          message: entry.message,
          createdAt: entry.createdAt,
          source: "guestbook" as const,
        })),
        ...contributionMessages
          .filter((entry) => entry.message && entry.message.trim().length > 0)
          .map((entry) => ({
            id: `contribution-${entry.id}`,
            authorName: entry.donorName,
            message: entry.message!.trim(),
            createdAt: entry.completedAt ?? entry.createdAt,
            source: "contribution" as const,
          })),
      ].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(normalizedMessages);
    } catch (error) {
      console.error("Error getting guestbook messages:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du livre d'or" });
    }
  });

  app.post("/api/guestbook/messages", async (req, res) => {
    try {
      const validated = insertGuestbookEntrySchema.parse(req.body);
      const entry = await storage.createGuestbookEntry({
        authorName: validated.authorName.trim(),
        message: validated.message.trim(),
      });

      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Error creating guestbook entry:", error);
      if (error.issues) {
        return res.status(400).json({ message: "Données invalides", details: error.issues });
      }
      res.status(500).json({ message: "Erreur lors de l'enregistrement du message" });
    }
  });

  // Get live contribution data (for live display during wedding)
  app.get("/api/contributions/live", async (req, res) => {
    try {
      const total = await storage.getTotalContributions();
      const latest = await storage.getLatestContribution();
      const recent = await storage.getRecentContributions(10);
      res.json({ 
        total, 
        currency: 'eur',
        latest: latest || null,
        recent
      });
    } catch (error) {
      console.error("Error getting live contributions:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des contributions" });
    }
  });

  // GET invitation PDF (public link for email sharing)
  app.get("/api/invitations/:id/pdf", async (req, res) => {
    try {
      const { generateInvitationPDF } = await import("./invitation-service");
      const id = parseInt(req.params.id);

      const response = await storage.getRsvpResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Invitation non trouvée" });
      }

      const pdfBuffer = await generateInvitationPDF({
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName,
        tableNumber: response.tableNumber,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="invitation-${response.firstName}-${response.lastName}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error getting invitation PDF:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'invitation" });
    }
  });

  // Generate invitation PDF (admin)
  app.post("/api/invitation/generate/:id", isLocallyAuthenticated, async (req, res) => {
    try {
      const { generateInvitationPDF } = await import("./invitation-service");
      const id = parseInt(req.params.id);
      const type = req.query.type as '19' | '21' | undefined; // Get type from query

      const response = await storage.getRsvpResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Guest not found" });
      }

      const pdfBuffer = await generateInvitationPDF({
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName,
        tableNumber: response.tableNumber,
        type // Pass to service
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="invitation-${response.firstName}-${response.lastName}-${type || 'full'}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating invitation:", error);
      res.status(500).json({ message: "Erreur lors de la génération de l'invitation" });
    }
  });

  // ─── Gift List Routes ───────────────────────────────────────────
  app.get("/api/gift-list", async (_req, res) => {
    try {
      const list = await db.select().from(giftListSignups).orderBy(asc(giftListSignups.position), asc(giftListSignups.createdAt));
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/gift-list", async (req, res) => {
    try {
      const parsed = insertGiftListSignupSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Nom requis" });
      const existing = await db.select().from(giftListSignups).orderBy(asc(giftListSignups.position));
      const maxPos = existing.length > 0 ? Math.max(...existing.map(e => e.position)) : -1;
      const [created] = await db.insert(giftListSignups).values({ name: parsed.data.name.trim(), position: maxPos + 1 }).returning();
      res.json(created);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/gift-list/reorder", async (req, res) => {
    try {
      const { order } = req.body as { order: { id: number; position: number }[] };
      if (!Array.isArray(order)) return res.status(400).json({ message: "Format invalide" });
      for (const item of order) {
        await db.update(giftListSignups).set({ position: item.position }).where(eq(giftListSignups.id, item.id));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/gift-list/:id/recorded", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isRecorded } = req.body as { isRecorded: boolean };
      const [updated] = await db.update(giftListSignups).set({ isRecorded }).where(eq(giftListSignups.id, id)).returning();
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/gift-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(giftListSignups).where(eq(giftListSignups.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
