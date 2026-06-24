import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whitelistTable = pgTable("whitelist", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  discordUsername: text("discord_username"),
  characterName: text("character_name"),
  status: text("status").notNull().default("approved"),
  addedBy: text("added_by"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertWhitelistSchema = createInsertSchema(whitelistTable).omit({ id: true, addedAt: true });
export type InsertWhitelist = z.infer<typeof insertWhitelistSchema>;
export type Whitelist = typeof whitelistTable.$inferSelect;
