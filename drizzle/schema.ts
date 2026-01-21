// @ts-nocheck
import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


// Stub tables for future use
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  investmentPhilosophy: text("investmentPhilosophy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

export const tickers = mysqlTable("tickers", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Ticker = typeof tickers.$inferSelect;
export type InsertTicker = typeof tickers.$inferInsert;

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  tickerId: int("tickerId").notNull(),
  personaId: int("personaId"),
  runId: varchar("runId", { length: 64 }).unique(),
  runTimestamp: timestamp("runTimestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull(),
  tickerId: int("tickerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  investmentPhilosophy: text("investmentPhilosophy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

export const watchlistTickers = mysqlTable("watchlistTickers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tickerId: int("tickerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InsertWatchlistTicker = typeof watchlistTickers.$inferInsert;

export const watchlistOpportunities = mysqlTable("watchlistOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tickerId: int("tickerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InsertAlert = typeof alerts.$inferInsert;

export const financialDataCache = mysqlTable("financialDataCache", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InsertFinancialDataCache = typeof financialDataCache.$inferInsert;

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InsertJob = typeof jobs.$inferInsert;
