/**
 * Opportunity Scanning Service
 * 
 * Scans all US stocks to find opportunities matching persona criteria.
 * Uses the shared persona scoring engine to ensure consistency with individual analysis.
 */

import { getDb } from "../db";
import { scanJobs, scanOpportunities, scanOpportunityAnalyses, tickers } from "../../drizzle/schema";
import { calculatePersonaScore, getPersonaMinThreshold } from "./personaScoringEngine";
import { invokeLLM } from "../_core/llm";
import { PERSONA_PROMPTS } from "./personaPrompts";
import type { KeyRatios } from "../../shared/types";
import { eq, desc } from "drizzle-orm";

let db: Awaited<ReturnType<typeof getDb>> | null = null;

async function ensureDb() {
  if (!db) {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  }
  return db;
}

export interface ScanJobProgress {
  scanJobId: number;
  status: "pending" | "running" | "completed" | "failed";
  phase: "init" | "data_collection" | "llm_analysis" | "aggregation";
  progress: number; // 0-100
  processedStocks: number;
  totalStocks: number;
  opportunitiesFound: number;
  llmAnalysesCompleted: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface ScanOpportunityResult {
  id: number;
  rank: number;
  ticker: string;
  companyName: string;
  score: number;
  metrics: Record<string, number | string | null>;
  currentPrice: number | null;
  marketCap: number | null;
  sector: string | null;
  thesis?: string;
  confidence?: string;
}

/**
 * Get all US stock tickers from the database
 */
export async function getAllUSStockTickers(): Promise<string[]> {
  const database = await ensureDb();
  const allTickers = await database
    .select({ symbol: tickers.symbol })
    .from(tickers);
  return allTickers.map((t) => t.symbol);
}

/**
 * Create a new scan job
 */
export async function createScanJob(personaId: number): Promise<number> {
  const database = await ensureDb();

  const result = await database.insert(scanJobs).values({
    personaId,
    status: "pending",
    phase: "init",
    processedStocks: 0,
    totalStocks: 0,
    opportunitiesFound: 0,
    llmAnalysesCompleted: 0,
  });

  return Number(result[0]?.insertId || 0);
}

/**
 * Get scan job progress
 */
export async function getScanJobProgress(scanJobId: number): Promise<ScanJobProgress> {
  const database = await ensureDb();

  const job = await database
    .select()
    .from(scanJobs)
    .where(eq(scanJobs.id, scanJobId))
    .limit(1);

  if (!job || !job[0]) {
    throw new Error(`Scan job not found: ${scanJobId}`);
  }

  const j = job[0];

  return {
    scanJobId: j.id,
    status: j.status as any,
    phase: j.phase as any,
    progress: j.totalStocks > 0 ? Math.round((j.processedStocks / j.totalStocks) * 100) : 0,
    processedStocks: j.processedStocks,
    totalStocks: j.totalStocks,
    opportunitiesFound: j.opportunitiesFound,
    llmAnalysesCompleted: j.llmAnalysesCompleted,
    startedAt: j.startedAt,
    completedAt: j.completedAt,
    errorMessage: j.errorMessage,
  };
}

/**
 * Get opportunities for a scan
 */
export async function getOpportunitiesForScan(
  scanJobId: number,
  limit: number = 50
): Promise<ScanOpportunityResult[]> {
  const database = await ensureDb();

  const opportunities = await database
    .select()
    .from(scanOpportunities)
    .where(eq(scanOpportunities.scanJobId, scanJobId))
    .orderBy(desc(scanOpportunities.score))
    .limit(limit);

  const results: ScanOpportunityResult[] = [];

  for (const opp of opportunities) {
    const tickerRecord = await database
      .select({ symbol: tickers.symbol, companyName: tickers.companyName })
      .from(tickers)
      .where(eq(tickers.id, opp.tickerId))
      .limit(1);

    if (!tickerRecord || !tickerRecord[0]) continue;

    const analysis = await database
      .select()
      .from(scanOpportunityAnalyses)
      .where(eq(scanOpportunityAnalyses.opportunityId, opp.id))
      .limit(1);

    results.push({
      id: opp.id,
      rank: opp.rank || 0,
      ticker: tickerRecord[0].symbol,
      companyName: tickerRecord[0].companyName || "",
      score: opp.score,
      metrics: (opp.metricsJson as Record<string, number | string | null>) || {},
      currentPrice: opp.currentPrice ? Number(opp.currentPrice) : null,
      marketCap: opp.marketCap ? Number(opp.marketCap) : null,
      sector: opp.sector,
      thesis: analysis?.[0]?.investmentThesis || undefined,
      confidence: analysis?.[0]?.confidenceLevel || undefined,
    });
  }

  return results;
}

/**
 * Get data status
 */
export async function getDataStatus(): Promise<{
  lastUpdated: Date | null;
  stocksCached: number;
}> {
  const database = await ensureDb();

  const cachedStocks = await database
    .select({ id: tickers.id })
    .from(tickers)
    .limit(1);

  // For now, return basic status
  // In a real implementation, you'd track cache refresh timestamps
  return {
    lastUpdated: null,
    stocksCached: 0,
  };
}

/**
 * Start refresh job with adaptive rate limiting and batch fetching
 */
export async function startRefreshJobWithAdaptiveRateLimit(
  refreshJobId: number
): Promise<void> {
  const database = await ensureDb();

  try {
    // Update job status
    await database
      .update(scanJobs)
      .set({
        status: "running",
        phase: "data_collection",
        startedAt: new Date(),
      })
      .where(eq(scanJobs.id, refreshJobId));

    // Get all US stock tickers
    const allTickers = await getAllUSStockTickers();
    console.log(`[RefreshJob] Starting refresh for ${allTickers.length} stocks`);

    // TODO: Implement batch fetching with adaptive rate limiting
    // This is a placeholder for the full implementation

    await database
      .update(scanJobs)
      .set({
        status: "completed",
        phase: "aggregation",
        completedAt: new Date(),
      })
      .where(eq(scanJobs.id, refreshJobId));

    console.log(`[RefreshJob] Refresh completed`);
  } catch (error) {
    console.error(`[RefreshJob] Error:`, error);
    await database
      .update(scanJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(scanJobs.id, refreshJobId));
  }
}

/**
 * Generate LLM analysis for an opportunity
 */
export async function generateLLMAnalysisForOpportunity(
  opportunityId: number,
  personaId: number,
  ticker: string,
  companyName: string,
  financialData: any
): Promise<void> {
  const database = await ensureDb();

  try {
    // Get persona prompt
    const personaIdMap: Record<number, string> = {
      1: "warren_buffett",
      2: "peter_lynch",
      3: "benjamin_graham",
      4: "cathie_wood",
      5: "ray_dalio",
      6: "philip_fisher",
    };

    const personaIdStr = personaIdMap[personaId] || "warren_buffett";
    const personaPrompt = PERSONA_PROMPTS[personaIdStr];

    if (!personaPrompt) {
      console.warn(`[LLM Analysis] Unknown persona: ${personaIdStr}`);
      return;
    }

    // Build LLM prompt
    const llmPrompt = `${personaPrompt.systemPrompt}

Analyze ${ticker} (${companyName}) for ${personaIdStr}:

${personaPrompt.analysisTemplate}

Financial Data:
${JSON.stringify(financialData, null, 2)}

Provide a JSON response with:
- investmentThesis (2-3 paragraphs)
- keyStrengths (3-5 bullets)
- keyRisks (2-3 bullets)
- catalystAnalysis (2-3 bullets)
- confidenceLevel (low/medium/high)
- recommendedAction (buy/hold/watch)`;

    // Call LLM
    const response = await invokeLLM({
      messages: [
        { role: "system", content: personaPrompt.systemPrompt },
        { role: "user", content: llmPrompt },
      ],
    });

    // Parse response
    const contentRaw = response.choices?.[0]?.message?.content || "{}";
    const content = typeof contentRaw === "string" ? contentRaw : JSON.stringify(contentRaw);
    let analysis: any = {};

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn(`[LLM Analysis] Failed to parse JSON response for ${ticker}`);
      analysis = {
        investmentThesis: content,
        keyStrengths: [],
        keyRisks: [],
        catalystAnalysis: [],
        confidenceLevel: "medium",
        recommendedAction: "watch",
      };
    }

    // Store analysis
    await database.insert(scanOpportunityAnalyses).values({
      opportunityId,
      personaId,
      investmentThesis: analysis.investmentThesis,
      keyStrengths: analysis.keyStrengths,
      keyRisks: analysis.keyRisks,
      catalystAnalysis: analysis.catalystAnalysis,
      confidenceLevel: analysis.confidenceLevel as "low" | "medium" | "high",
      recommendedAction: analysis.recommendedAction,
      analysisDate: new Date(),
    });

    console.log(`[LLM Analysis] ✅ Generated analysis for ${ticker}`);
  } catch (error) {
    console.error(`[LLM Analysis] Error for ${ticker}:`, error);
    // Don't throw - continue processing other opportunities
  }
}
