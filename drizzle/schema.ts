import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

/**
 * Investor personas (Warren Buffett, Peter Lynch, etc.)
 */
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  personaId: varchar("personaId", { length: 64 }).notNull().unique(), // e.g., "warren_buffett"
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Warren Buffett"
  description: text("description"),
  investmentPhilosophy: text("investmentPhilosophy"),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

/**
 * Stock ticker information and metadata
 */
export const tickers = mysqlTable("tickers", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull().unique(), // e.g., "AAPL"
  companyName: varchar("companyName", { length: 255 }),
  sector: varchar("sector", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  marketCap: decimal("marketCap", { precision: 20, scale: 2 }),
  exchange: varchar("exchange", { length: 50 }), // NYSE, NASDAQ, AMEX
  description: text("description"),
  lastDataUpdate: timestamp("lastDataUpdate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  symbolIdx: index("symbol_idx").on(table.symbol),
}));

export type Ticker = typeof tickers.$inferSelect;
export type InsertTicker = typeof tickers.$inferInsert;

/**
 * Analysis runs for ticker + persona combinations
 * Stores structured persona output and run metadata
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  tickerId: int("tickerId").notNull().references(() => tickers.id),
  personaId: int("personaId").notNull().references(() => personas.id),
  runId: varchar("runId", { length: 64 }).notNull().unique(), // Unique identifier for this analysis run
  
  // Structured persona output
  score: int("score").notNull(), // 0-100
  verdict: mysqlEnum("verdict", ["Strong Fit", "Fit", "Borderline", "Not a Fit", "Insufficient Data"]).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
  summaryBullets: json("summaryBullets").$type<string[]>().notNull(), // 2-4 bullets
  
  // Criteria breakdown
  criteria: json("criteria").$type<Array<{
    name: string;
    weight: number;
    status: "pass" | "fail" | "partial";
    metricsUsed: string[];
    explanation: string;
  }>>().notNull(),
  
  keyRisks: json("keyRisks").$type<string[]>().notNull(),
  whatWouldChangeMind: json("whatWouldChangeMind").$type<string[]>().notNull(),
  
  // Data provenance
  dataUsed: json("dataUsed").$type<Array<{
    source: string;
    endpoint: string;
    timestamp: number;
  }>>().notNull(),
  
  citations: json("citations").$type<Array<{
    type: string;
    reference: string;
    url?: string;
  }>>(),
  
  // Run metadata
  runMetadata: json("runMetadata").$type<{
    model: string;
    version: string;
    runTime: number; // milliseconds
    inputsHash: string;
    mode: "quick" | "deep";
  }>().notNull(),
  
  runTimestamp: timestamp("runTimestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tickerPersonaIdx: index("ticker_persona_idx").on(table.tickerId, table.personaId),
  runTimestampIdx: index("run_timestamp_idx").on(table.runTimestamp),
}));

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Daily opportunity scans per persona
 * Market-wide scans that surface top candidates
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull().references(() => personas.id),
  tickerId: int("tickerId").notNull().references(() => tickers.id),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  
  scanDate: timestamp("scanDate").notNull(), // Date of the scan (normalized to midnight)
  rank: int("rank").notNull(), // Ranking within this persona's scan
  
  // Why now explanation
  whyNow: json("whyNow").$type<string[]>().notNull(), // 2-4 data-driven bullets
  
  // Key metrics snapshot
  keyMetrics: json("keyMetrics").$type<Record<string, number | string>>().notNull(),
  
  // Change tracking
  changeStatus: mysqlEnum("changeStatus", ["new", "improved", "unchanged", "dropped"]).notNull(),
  previousScore: int("previousScore"), // Score from previous scan (if exists)
  
  scanTimestamp: timestamp("scanTimestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  personaScanDateIdx: index("persona_scan_date_idx").on(table.personaId, table.scanDate),
  scanDateIdx: index("scan_date_idx").on(table.scanDate),
  uniquePersonaTickerDate: unique("unique_persona_ticker_date").on(table.personaId, table.tickerId, table.scanDate),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * User watchlists for tracking tickers
 */
export const watchlistTickers = mysqlTable("watchlistTickers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tickerId: int("tickerId").notNull().references(() => tickers.id),
  
  // Snapshot when added
  snapshotScore: int("snapshotScore"), // Average score across personas when added
  snapshotData: json("snapshotData").$type<Record<string, any>>(),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userTickerIdx: unique("user_ticker_idx").on(table.userId, table.tickerId),
}));

export type WatchlistTicker = typeof watchlistTickers.$inferSelect;
export type InsertWatchlistTicker = typeof watchlistTickers.$inferInsert;

/**
 * User watchlists for tracking opportunities
 */
export const watchlistOpportunities = mysqlTable("watchlistOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  opportunityId: int("opportunityId").notNull().references(() => opportunities.id),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userOpportunityIdx: unique("user_opportunity_idx").on(table.userId, table.opportunityId),
}));

export type WatchlistOpportunity = typeof watchlistOpportunities.$inferSelect;
export type InsertWatchlistOpportunity = typeof watchlistOpportunities.$inferInsert;

/**
 * User alerts for score thresholds and new opportunities
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  alertType: mysqlEnum("alertType", ["score_threshold", "new_opportunity"]).notNull(),
  
  // For score_threshold alerts
  tickerId: int("tickerId").references(() => tickers.id),
  personaId: int("personaId").references(() => personas.id),
  thresholdScore: int("thresholdScore"),
  thresholdDirection: mysqlEnum("thresholdDirection", ["above", "below"]),
  
  // For new_opportunity alerts (persona-level)
  // Uses personaId field above
  
  isActive: boolean("isActive").default(true).notNull(),
  lastTriggered: timestamp("lastTriggered"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userActiveIdx: index("user_active_idx").on(table.userId, table.isActive),
}));

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Cache for financial data to reduce API calls
 */
export const financialDataCache = mysqlTable("financialDataCache", {
  id: int("id").autoincrement().primaryKey(),
  tickerId: int("tickerId").notNull().references(() => tickers.id),
  
  dataType: varchar("dataType", { length: 50 }).notNull(), // "price", "financials", "ratios", "filings"
  dataKey: varchar("dataKey", { length: 100 }).notNull(), // Specific key within type
  
  data: json("data").$type<Record<string, any>>().notNull(),
  
  fetchedAt: timestamp("fetchedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tickerDataTypeKeyIdx: unique("ticker_data_type_key_idx").on(table.tickerId, table.dataType, table.dataKey),
  expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
}));

export type FinancialDataCache = typeof financialDataCache.$inferSelect;
export type InsertFinancialDataCache = typeof financialDataCache.$inferInsert;

/**
 * Job queue for async analysis runs and scans
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobType: mysqlEnum("jobType", ["ticker_analysis", "daily_scan", "deep_analysis"]).notNull(),
  
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  
  // Job parameters
  params: json("params").$type<Record<string, any>>().notNull(),
  
  // Result reference
  resultId: varchar("resultId", { length: 64 }), // Points to analysis.runId or scan batch ID
  
  // Progress tracking
  progress: int("progress").default(0).notNull(), // 0-100
  statusMessage: text("statusMessage"),
  
  // Timing
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Error handling
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  jobTypeStatusIdx: index("job_type_status_idx").on(table.jobType, table.status),
}));

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;


/**
 * On-demand opportunity scans
 * Tracks scan jobs for finding opportunities across all US stocks
 */
export const scanJobs = mysqlTable("scanJobs", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull().references(() => personas.id),
  
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  phase: mysqlEnum("phase", ["init", "data_collection", "llm_analysis", "aggregation"]).default("init").notNull(),
  
  totalStocks: int("totalStocks").default(5500).notNull(),
  processedStocks: int("processedStocks").default(0).notNull(),
  opportunitiesFound: int("opportunitiesFound").default(0).notNull(),
  llmAnalysesCompleted: int("llmAnalysesCompleted").default(0).notNull(),
  
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  personaStatusIdx: index("persona_status_idx").on(table.personaId, table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type ScanJob = typeof scanJobs.$inferSelect;
export type InsertScanJob = typeof scanJobs.$inferInsert;

/**
 * Qualified opportunities from scans
 * Stores stocks that meet persona criteria (score >= minimum threshold)
 */
export const scanOpportunities = mysqlTable("scanOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  scanJobId: int("scanJobId").notNull().references(() => scanJobs.id, { onDelete: "cascade" }),
  personaId: int("personaId").notNull().references(() => personas.id),
  tickerId: int("tickerId").notNull().references(() => tickers.id),
  
  score: int("score").notNull(), // 0-100, absolute score
  rank: int("rank"), // Ranking within this scan (1, 2, 3, etc.)
  
  // Metrics snapshot at time of scan
  metricsJson: json("metricsJson").$type<Record<string, number | string | null>>().notNull(),
  currentPrice: decimal("currentPrice", { precision: 10, scale: 2 }),
  marketCap: decimal("marketCap", { precision: 20, scale: 0 }),
  sector: varchar("sector", { length: 100 }),
  
  status: mysqlEnum("status", ["new", "watched", "purchased", "dismissed"]).default("new").notNull(),
  llmAnalysisGenerated: boolean("llmAnalysisGenerated").default(false).notNull(),
  
  dismissedAt: timestamp("dismissedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scanJobIdIdx: index("scan_job_id_idx").on(table.scanJobId),
  personaScoreIdx: index("persona_score_idx").on(table.personaId, table.score),
  scanRankIdx: index("scan_rank_idx").on(table.scanJobId, table.rank),
  uniqueScanTicker: unique("unique_scan_ticker").on(table.scanJobId, table.tickerId),
}));

export type ScanOpportunity = typeof scanOpportunities.$inferSelect;
export type InsertScanOpportunity = typeof scanOpportunities.$inferInsert;

/**
 * LLM-generated analysis for opportunities
 * Stores investment thesis, strengths, risks, catalysts for each opportunity
 */
export const scanOpportunityAnalyses = mysqlTable("scanOpportunityAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull().references(() => scanOpportunities.id, { onDelete: "cascade" }),
  personaId: int("personaId").notNull().references(() => personas.id),
  
  investmentThesis: text("investmentThesis").notNull(),
  keyStrengths: json("keyStrengths").$type<string[]>().notNull(),
  keyRisks: json("keyRisks").$type<string[]>().notNull(),
  catalystAnalysis: json("catalystAnalysis").$type<string[]>().notNull(),
  
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).default("medium").notNull(),
  recommendedAction: varchar("recommendedAction", { length: 255 }),
  
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  opportunityIdIdx: index("opportunity_id_idx").on(table.opportunityId),
  personaIdIdx: index("persona_id_idx").on(table.personaId),
}));

export type ScanOpportunityAnalysis = typeof scanOpportunityAnalyses.$inferSelect;
export type InsertScanOpportunityAnalysis = typeof scanOpportunityAnalyses.$inferInsert;
