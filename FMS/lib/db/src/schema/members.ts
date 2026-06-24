import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id"),
  discordUsername: text("discord_username").notNull(),
  callsign: text("callsign"),
  characterName: text("character_name"),
  rankId: integer("rank_id"),
  departmentId: integer("department_id"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, joinedAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
