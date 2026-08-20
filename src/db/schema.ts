import { pgTable, pgEnum, varchar, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["user", "assistant", "system"]);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  contactName: varchar("contact_name", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_phone_number_idx").on(table.phoneNumber),
]);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: varchar("session_id", { length: 255 })
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("session_id_created_at_idx").on(table.sessionId, table.createdAt),
  ]
);
