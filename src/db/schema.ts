import { pgTable, pgEnum, varchar, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["user", "assistant", "system"]);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  pdfName: varchar("pdf_name", { length: 255 }),
  pdfText: text("pdf_text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
