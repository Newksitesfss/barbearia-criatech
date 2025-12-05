import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["user", "admin"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  salt: varchar("salt", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userRelations = relations(users, ({ many }) => ({
  barbers: many(barbers),
  haircuts: many(haircuts),
  appointments: many(appointments),
}));

/**
 * Tabela de barbeiros
 */
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }), // Chave estrangeira para o usuário proprietário
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  active: integer("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;

export const barberRelations = relations(barbers, ({ one, many }) => ({
  user: one(users, {
    fields: [barbers.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

/**
 * Tabela de tipos de cortes
 */
export const haircuts = pgTable("haircuts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }), // Chave estrangeira para o usuário proprietário
  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(), // Preço em centavos para evitar problemas com decimais
  description: text("description"),
  active: integer("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Haircut = typeof haircuts.$inferSelect;
export type InsertHaircut = typeof haircuts.$inferInsert;

export const haircutRelations = relations(haircuts, ({ one, many }) => ({
  user: one(users, {
    fields: [haircuts.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

/**
 * Tabela de atendimentos
 */
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }), // Chave estrangeira para o usuário proprietário
  barberId: integer("barberId").notNull().references(() => barbers.id, { onDelete: "cascade" }),
  haircutId: integer("haircutId").notNull().references(() => haircuts.id, { onDelete: "cascade" }),
  appointmentDate: timestamp("appointmentDate").notNull(), // Data e hora do atendimento
  pricePaid: integer("pricePaid").notNull(), // Valor pago em centavos
  notes: text("notes"), // Observações sobre o atendimento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

export const appointmentRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  barber: one(barbers, {
    fields: [appointments.barberId],
    references: [barbers.id],
  }),
  haircut: one(haircuts, {
    fields: [appointments.haircutId],
    references: [haircuts.id],
  }),
}));
