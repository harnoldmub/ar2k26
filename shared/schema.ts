import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// RSVP Responses table
export const rsvpResponses = pgTable("rsvp_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  partySize: integer("party_size").notNull().default(1), // 1 for Solo, 2 for Couple
  availability: varchar("availability", { length: 50 }).notNull().default('pending'), // '19-march', '21-march', 'both', 'unavailable', 'pending'
  tableNumber: integer("table_number"), // For seat assignment
  notes: text("notes"),

  // Guest Management Fields
  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'pending', 'confirmed', 'declined'
  qrToken: varchar("qr_token").unique(), // Unique token for QR Code
  phone: varchar("phone", { length: 50 }), // International format

  // Invitation type: 1 = full programme, 2 = bénédiction + soirée, 3 = soirée only
  invitationType: integer("invitation_type").notNull().default(1),

  // Brunch invitation (Sunday 22/03 - KAUA, St Job Uccle)
  brunchInvited: boolean("brunch_invited").notNull().default(false),

  // Seating plan confirmed (admin tracking)
  seatingConfirmed: boolean("seating_confirmed").notNull().default(false),

  // Tracking
  invitationViewedAt: timestamp("invitation_viewed_at"),

  // Timestamps
  invitationSentAt: timestamp("invitation_sent_at"),
  invitation21SentAt: timestamp("invitation_21_sent_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  whatsappInvitationSentAt: timestamp("whatsapp_invitation_sent_at"),
  confirmedAt: timestamp("confirmed_at"),
  checkedInAt: timestamp("checked_in_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().optional().nullable()
    .transform(val => !val || val === '' ? null : val)
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: "Veuillez entrer une adresse email valide"
    }),
  partySize: z.number().int().min(1).max(10, "Maximum 10 personnes"),
  availability: z.enum(['19-march', '21-march', 'both', 'unavailable', 'pending'], {
    errorMap: () => ({ message: "Veuillez sélectionner une option" })
  }),
  phone: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
  notes: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
});

export const updateRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().optional().nullable()
    .transform(val => !val || val === '' ? null : val)
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: "Veuillez entrer une adresse email valide"
    }),
  partySize: z.number().int().min(1).max(5, "Maximum 5 personnes"),
  availability: z.enum(['19-march', '21-march', 'both', 'unavailable', 'pending'], {
    errorMap: () => ({ message: "Veuillez sélectionner une option" })
  }),
  tableNumber: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  invitationType: z.number().int().min(1).max(4).optional(),
  notes: z.string().nullable().optional(),
  // Admin fields - accept strings and convert to dates
  status: z.string().optional(),
  phone: z.string().optional().nullable(),
  qrToken: z.string().optional().nullable(),
  invitationViewedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  invitationSentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  invitation21SentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  reminderSentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  whatsappInvitationSentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  confirmedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  checkedInAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  brunchInvited: z.boolean().optional(),
});

export type InsertRsvpResponse = z.infer<typeof insertRsvpResponseSchema>;
export type UpdateRsvpResponse = z.infer<typeof updateRsvpResponseSchema>;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;

// Wedding Contributions table
export const contributions = pgTable("contributions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  donorName: varchar("donor_name", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).notNull().default('eur'),
  message: text("message"), // Optional message from donor
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertContributionSchema = z.object({
  donorName: z.string().min(1, "Le nom est requis"),
  amount: z.number().int().min(100, "Le montant minimum est de 1 euro"), // Min 1 EUR (100 cents)
  message: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
});

export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

// Guestbook entries table
export const guestbookEntries = pgTable("guestbook_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestbookEntrySchema = z.object({
  authorName: z.string().min(2, "Veuillez entrer votre nom").max(255, "Maximum 255 caractères"),
  message: z.string().min(8, "Votre message doit contenir au moins 8 caractères").max(1200, "Maximum 1200 caractères"),
});

export type InsertGuestbookEntry = z.infer<typeof insertGuestbookEntrySchema>;
export type GuestbookEntry = typeof guestbookEntries.$inferSelect;

// Gift List Signups table
export const giftListSignups = pgTable("gift_list_signups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  position: integer("position").notNull().default(0),
  isRecorded: boolean("is_recorded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiftListSignupSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
});

export type InsertGiftListSignup = z.infer<typeof insertGiftListSignupSchema>;
export type GiftListSignup = typeof giftListSignups.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  rsvpResponses: many(rsvpResponses),
}));

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  assignedBy: one(users),
}));
