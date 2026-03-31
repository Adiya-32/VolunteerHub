import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pendingActionsTable = pgTable("pending_actions", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(),
  targetId: text("target_id").notNull(),
  targetName: text("target_name").notNull(),
  requestedByEmail: text("requested_by_email").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PendingAction = typeof pendingActionsTable.$inferSelect;
