import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disciplinaryTable = pgTable("disciplinary", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(),
  reason: text("reason").notNull(),
  issuedBy: text("issued_by"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
});

export const insertDisciplinarySchema = createInsertSchema(disciplinaryTable).omit({ id: true, issuedAt: true });
export type InsertDisciplinary = z.infer<typeof insertDisciplinarySchema>;
export type Disciplinary = typeof disciplinaryTable.$inferSelect;
