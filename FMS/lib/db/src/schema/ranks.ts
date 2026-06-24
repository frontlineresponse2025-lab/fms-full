import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ranksTable = pgTable("ranks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  description: text("description"),
  color: text("color"),
  discordRoleId: text("discord_role_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRankSchema = createInsertSchema(ranksTable).omit({ id: true, createdAt: true });
export type InsertRank = z.infer<typeof insertRankSchema>;
export type Rank = typeof ranksTable.$inferSelect;
