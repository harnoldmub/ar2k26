import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Veuillez entrer une adresse email valide").optional().or(z.literal('')),
  partySize: z.number().int().min(1).max(2, "Sélectionnez Solo (1) ou Couple (2)"),
  availability: z.enum(['19-march', '21-march', 'both', 'unavailable', 'pending'], {
    errorMap: () => ({ message: "Veuillez sélectionner une option" })
  }),
});

export const updateRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Veuillez entrer une adresse email valide").nullable().optional().or(z.literal('')),
  partySize: z.number().int().min(1).max(2, "Sélectionnez Solo (1) ou Couple (2)"),
  availability: z.enum(['19-march', '21-march', 'both', 'unavailable', 'pending'], {
    errorMap: () => ({ message: "Veuillez sélectionner une option" })
  }),
  tableNumber: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type InsertRsvpResponse = z.infer<typeof insertRsvpResponseSchema>;
export type UpdateRsvpResponse = z.infer<typeof updateRsvpResponseSchema>;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  rsvpResponses: many(rsvpResponses),
}));

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  assignedBy: one(users),
}));
