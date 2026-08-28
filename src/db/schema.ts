import { pgTable, pgEnum, varchar, text, timestamp, uuid, jsonb, index, serial } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["user", "assistant", "system"]);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
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

export const knowledge = pgTable("knowledge", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  pdfText: text("pdf_text").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  botName: varchar("bot_name", { length: 100 }).default("Asisten AI").notNull(),
  persona: varchar("persona", { length: 50 }).default("friendly").notNull(), // friendly | professional
  welcomeMessage: text("welcome_message").default("Halo! Ada yang bisa saya bantu hari ini?").notNull(),
  suggestions: jsonb("suggestions")
    .default('["Layanan TCU apa saja?", "Alamat TCU di mana?", "Jam operasional?", "Biaya konseling?", "Saya mau daftar layanan"]')
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

