// @ts-nocheck
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  personas,
  tickers,
  analyses,
  opportunities,
  watchlistTickers,
  watchlistOpportunities,
  alerts,
  financialDataCache,
  jobs,
  type Persona,
  type Ticker,
  type Analysis,
  type Opportunity,
  type InsertPersona,
  type InsertTicker,
  type InsertAnalysis,
  type InsertOpportunity,
  type InsertWatchlistTicker,
  type InsertAlert,
  type InsertFinancialDataCache,
  type InsertJob,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User Operations
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Persona Operations
// ============================================================================

export async function getAllPersonas(): Promise<Persona[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return db.select().from(personas).limit(100);
  } catch (error) {
    console.warn("[Database] Failed to get personas:", error);
    return [];
  }
}

export async function getPersonaById(id: number): Promise<Persona | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.warn("[Database] Failed to get persona by id:", error);
    return undefined;
  }
}

export async function getPersonaByPersonaId(personaId: string): Promise<Persona | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(personas).where(eq(personas.personaId, personaId)).limit(1);
    return result[0];
  } catch (error) {
    console.warn("[Database] Failed to get persona by personaId:", error);
    return undefined;
  }
}

export async function createPersona(persona: InsertPersona): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(personas).values(persona) as any;
  return Number(result.insertId);
}

// ============================================================================
// Ticker Operations
// ============================================================================

export async function getTickerBySymbol(symbol: string): Promise<Ticker | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tickers).where(eq(tickers.symbol, symbol.toUpperCase())).limit(1);
  return result[0];
}

export async function upsertTicker(ticker: InsertTicker): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getTickerBySymbol(ticker.symbol);
  if (existing) {
    await db.update(tickers).set(ticker).where(eq(tickers.id, existing.id));
    return existing.id;
  }
  
  const result = await db.insert(tickers).values(ticker) as any;
  return Number(result.insertId);
}

export async function searchTickers(query: string, limit: number = 10): Promise<Ticker[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query.toUpperCase()}%`;
  return db.select().from(tickers)
    .where(
      sql`${tickers.symbol} LIKE ${searchPattern}`
    )
    .limit(limit);
}

// ============================================================================
// Analysis Operations
// ============================================================================

export async function createAnalysis(analysis: InsertAnalysis): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(analyses).values(analysis) as any;
  return Number(result.insertId);
}

export async function getLatestAnalysis(tickerId: number, personaId: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(analyses)
      .where(and(eq(analyses.tickerId, tickerId), eq(analyses.personaId, personaId)))
      .orderBy(desc(analyses.createdAt))
      .limit(1);
    
    return result[0];
  } catch (error) {
    console.warn("[Database] Failed to get latest analysis:", error);
    return undefined;
  }
}

export async function getLatestAnalysesForTicker(tickerId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // Get all analyses for this ticker and filter to latest per persona
    const allAnalyses = await db.select().from(analyses)
      .where(eq(analyses.tickerId, tickerId))
      .orderBy(desc(analyses.createdAt));
    
    // Group by persona and keep only the latest
    const latestByPersona = new Map<number, Analysis>();
    for (const analysis of allAnalyses) {
      const personaId = analysis.personaId || 0;
      if (!latestByPersona.has(personaId)) {
        latestByPersona.set(personaId, analysis);
      }
    }
    
    return Array.from(latestByPersona.values());
  } catch (error) {
    console.warn("[Database] Failed to get latest analyses for ticker:", error);
    return [];
  }
}

export async function getAnalysisByRunId(runId: string): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(analyses).where(eq(analyses.runId, runId)).limit(1);
  return result[0];
}

// ============================================================================
// Opportunity Operations
// ============================================================================

export async function createOpportunity(opportunity: InsertOpportunity): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(opportunities).values(opportunity) as any;
  return Number(result.insertId);
}

export async function getOpportunitiesForPersona(
  personaId: number,
  scanDate: Date,
  limit: number = 50
): Promise<Array<Opportunity & { ticker: Ticker; analysis: Analysis }>> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    opportunity: opportunities,
    ticker: tickers,
    analysis: analyses,
  })
  .from(opportunities)
  .innerJoin(tickers, eq(opportunities.tickerId, tickers.id))
  .innerJoin(analyses, eq(opportunities.analysisId, analyses.id))
  .where(and(
    eq(opportunities.personaId, personaId),
    eq(opportunities.scanDate, scanDate)
  ))
  .orderBy(opportunities.rank)
  .limit(limit);
  
  return result.map(r => ({ ...r.opportunity, ticker: r.ticker, analysis: r.analysis }));
}

export async function getLatestOpportunitiesForPersona(
  personaId: number,
  limit: number = 50
): Promise<Array<Opportunity & { ticker: Ticker; analysis: Analysis }>> {
  const db = await getDb();
  if (!db) return [];
  
  // Get the latest scan date for this persona
  const latestScan = await db.select({ scanDate: opportunities.scanDate })
    .from(opportunities)
    .where(eq(opportunities.personaId, personaId))
    .orderBy(desc(opportunities.scanDate))
    .limit(1);
  
  if (latestScan.length === 0) return [];
  
  return getOpportunitiesForPersona(personaId, latestScan[0].scanDate, limit);
}

// ============================================================================
// Watchlist Operations
// ============================================================================

export async function addTickerToWatchlist(data: InsertWatchlistTicker): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(watchlistTickers).values(data) as any;
  return Number(result.insertId);
}

export async function removeTickerFromWatchlist(userId: number, tickerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(watchlistTickers).where(
    and(eq(watchlistTickers.userId, userId), eq(watchlistTickers.tickerId, tickerId))
  );
}

export async function getUserWatchlistTickers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    watchlistItem: watchlistTickers,
    ticker: tickers,
  })
  .from(watchlistTickers)
  .innerJoin(tickers, eq(watchlistTickers.tickerId, tickers.id))
  .where(eq(watchlistTickers.userId, userId))
  .orderBy(desc(watchlistTickers.createdAt));
  
  return result;
}

export async function isTickerInWatchlist(userId: number, tickerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(watchlistTickers)
    .where(and(eq(watchlistTickers.userId, userId), eq(watchlistTickers.tickerId, tickerId)))
    .limit(1);
  
  return result.length > 0;
}

// ============================================================================
// Alert Operations
// ============================================================================

export async function createAlert(alert: InsertAlert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(alerts).values(alert) as any;
  return Number(result.insertId);
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.isActive, true)))
    .orderBy(desc(alerts.createdAt));
}

export async function deleteAlert(userId: number, alertId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(alerts).where(
    and(eq(alerts.id, alertId), eq(alerts.userId, userId))
  );
}

// ============================================================================
// Financial Data Cache Operations
// ============================================================================

export async function getCachedData(
  tickerId: number,
  dataType: string,
  dataKey: string
): Promise<any | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(financialDataCache)
    .where(and(
      eq(financialDataCache.tickerId, tickerId),
      eq(financialDataCache.dataType, dataType),
      eq(financialDataCache.dataKey, dataKey),
      gte(financialDataCache.expiresAt, new Date())
    ))
    .limit(1);
  
  return result[0]?.data;
}

export async function setCachedData(data: InsertFinancialDataCache): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(financialDataCache).values(data)
    .onDuplicateKeyUpdate({
      set: {
        data: data.data,
        fetchedAt: data.fetchedAt,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      }
    });
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(financialDataCache).where(lte(financialDataCache.expiresAt, new Date()));
}

// ============================================================================
// Job Operations
// ============================================================================

export async function createJob(job: InsertJob): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobs).values(job) as any;
  return Number(result.insertId);
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function updateJobStatus(
  id: number,
  status: "pending" | "running" | "completed" | "failed",
  updates: Partial<{
    progress: number;
    statusMessage: string;
    errorMessage: string;
    resultId: string;
    startedAt: Date;
    completedAt: Date;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobs).set({ status, ...updates, updatedAt: new Date() }).where(eq(jobs.id, id));
}

export async function getPendingJobs(jobType?: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(jobs.status, "pending")];
  if (jobType) {
    conditions.push(eq(jobs.jobType, jobType as any));
  }
  
  return db.select().from(jobs)
    .where(and(...conditions))
    .orderBy(jobs.createdAt)
    .limit(limit);
}
