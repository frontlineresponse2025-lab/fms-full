import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patrolLogsTable = pgTable("patrol_logs", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  server: text("server"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatrolLogSchema = createInsertSchema(patrolLogsTable).omit({ id: true, createdAt: true });
export type InsertPatrolLog = z.infer<typeof insertPatrolLogSchema>;
export type PatrolLog = typeof patrolLogsTable.$inferSelect;
