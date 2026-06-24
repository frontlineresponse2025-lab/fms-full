import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicantName: text("applicant_name").notNull(),
  discordId: text("discord_id"),
  discordUsername: text("discord_username"),
  type: text("type").notNull().default("join"),
  careerId: integer("career_id"),
  status: text("status").notNull().default("pending"),
  answers: text("answers"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, submittedAt: true, reviewedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
