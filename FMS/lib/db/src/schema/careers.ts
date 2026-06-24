import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const careersTable = pgTable("careers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id"),
  description: text("description"),
  requirements: text("requirements"),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCareerSchema = createInsertSchema(careersTable).omit({ id: true, createdAt: true });
export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careersTable.$inferSelect;
