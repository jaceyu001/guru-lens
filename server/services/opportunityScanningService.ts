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
  thesis: string | null;
  strengths: string[];
  risks: string[];
  catalysts: string[];
  confidence: "low" | "medium" | "high" | null;
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
    totalStocks: 5500,
    processedStocks: 0,
    opportunitiesFound: 0,
    llmAnalysesCompleted: 0,
  });

  return (result as any).insertId as number;
}

/**
 * Get scan job progress
 */
export async function getScanJobProgress(scanJobId: number): Promise<ScanJobProgress | null> {
  const database = await ensureDb();
  const jobRecords = await database
    .select()
    .from(scanJobs)
    .where(eq(scanJobs.id, scanJobId))
    .limit(1);
  const job = jobRecords[0];

  if (!job) {
    return null;
  }

  const progress = job.totalStocks > 0 ? (job.processedStocks / job.totalStocks) * 100 : 0;

  return {
    scanJobId: job.id,
    status: job.status,
    phase: job.phase,
    progress,
    processedStocks: job.processedStocks,
    totalStocks: job.totalStocks,
    opportunitiesFound: job.opportunitiesFound,
    llmAnalysesCompleted: job.llmAnalysesCompleted,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    errorMessage: job.errorMessage,
  };
}

/**
 * Update scan job progress
 */
export async function updateScanJobProgress(
  scanJobId: number,
  updates: Partial<{
    status: "pending" | "running" | "completed" | "failed";
    phase: "init" | "data_collection" | "llm_analysis" | "aggregation";
    processedStocks: number;
    opportunitiesFound: number;
    llmAnalysesCompleted: number;
    startedAt: Date;
    completedAt: Date;
    errorMessage: string;
  }>
): Promise<void> {
  const database = await ensureDb();
  const updateSet: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateSet[key] = value;
    }
  });
  await database.update(scanJobs).set(updateSet).where(eq(scanJobs.id, scanJobId));
}

/**
 * Get all opportunities from a scan
 */
export async function getScanOpportunities(
  scanJobId: number,
  limit: number = 10,
  offset: number = 0
): Promise<ScanOpportunityResult[]> {
  const database = await ensureDb();
  const opportunities = await database
    .select()
    .from(scanOpportunities)
    .where(eq(scanOpportunities.scanJobId, scanJobId))
    .orderBy(desc(scanOpportunities.score))
    .limit(limit)
    .offset(offset);

  const results: ScanOpportunityResult[] = [];

  for (const opp of opportunities) {
    const tickerRecords = await database
      .select()
      .from(tickers)
      .where(eq(tickers.id, opp.tickerId))
      .limit(1);
    const ticker = tickerRecords[0];

    const analysisRecords = await database
      .select()
      .from(scanOpportunityAnalyses)
      .where(eq(scanOpportunityAnalyses.opportunityId, opp.id))
      .limit(1);
    const analysis = analysisRecords[0];

    results.push({
      id: opp.id,
      rank: opp.rank || 0,
      ticker: ticker?.symbol || "N/A",
      companyName: ticker?.companyName || "N/A",
      score: opp.score,
      metrics: opp.metricsJson,
      currentPrice: opp.currentPrice ? Number(opp.currentPrice) : null,
      marketCap: opp.marketCap ? Number(opp.marketCap) : null,
      sector: opp.sector,
      thesis: analysis?.investmentThesis || null,
      strengths: analysis?.keyStrengths || [],
      risks: analysis?.keyRisks || [],
      catalysts: analysis?.catalystAnalysis || [],
      confidence: analysis?.confidenceLevel || null,
    });
  }

  return results;
}

/**
 * Get full analysis for an opportunity
 */
export async function getOpportunityAnalysis(opportunityId: number): Promise<ScanOpportunityResult | null> {
  const database = await ensureDb();
  const oppRecords = await database
    .select()
    .from(scanOpportunities)
    .where(eq(scanOpportunities.id, opportunityId))
    .limit(1);
  const opp = oppRecords[0];

  if (!opp) {
    return null;
  }

  const tickerRecords = await database
    .select()
    .from(tickers)
    .where(eq(tickers.id, opp.tickerId))
    .limit(1);
  const tickerRecord = tickerRecords[0];

  const analysisRecords = await database
    .select()
    .from(scanOpportunityAnalyses)
    .where(eq(scanOpportunityAnalyses.opportunityId, opportunityId))
    .limit(1);
  const analysis = analysisRecords[0];

  return {
    id: opp.id,
    rank: opp.rank || 0,
    ticker: tickerRecord?.symbol || "N/A",
    companyName: tickerRecord?.companyName || "N/A",
    score: opp.score,
    metrics: opp.metricsJson,
    currentPrice: opp.currentPrice ? Number(opp.currentPrice) : null,
    marketCap: opp.marketCap ? Number(opp.marketCap) : null,
    sector: opp.sector,
    thesis: analysis?.investmentThesis || null,
    strengths: analysis?.keyStrengths || [],
    risks: analysis?.keyRisks || [],
    catalysts: analysis?.catalystAnalysis || [],
    confidence: analysis?.confidenceLevel || null,
  };
}

/**
 * Store a qualified opportunity
 */
export async function storeOpportunity(
  scanJobId: number,
  personaId: number,
  tickerId: number,
  score: number,
  rank: number,
  metrics: Record<string, number | string | null>,
  currentPrice: number | null,
  marketCap: number | null,
  sector: string | null
): Promise<number> {
  const database = await ensureDb();
  const result = await database.insert(scanOpportunities).values({
    scanJobId,
    personaId,
    tickerId,
    score,
    rank,
    metricsJson: metrics,
    currentPrice: currentPrice ? String(currentPrice) : null,
    marketCap: marketCap ? String(marketCap) : null,
    sector,
    status: "new",
    llmAnalysisGenerated: false,
  });

  return (result as any).insertId as number;
}

/**
 * Store LLM analysis for an opportunity
 */
export async function storeOpportunityAnalysis(
  opportunityId: number,
  personaId: number,
  analysis: {
    investmentThesis: string;
    keyStrengths: string[];
    keyRisks: string[];
    catalystAnalysis: string[];
    confidenceLevel: "low" | "medium" | "high";
    recommendedAction: string;
  }
): Promise<void> {
  const database = await ensureDb();
  await database.insert(scanOpportunityAnalyses).values({
    opportunityId,
    personaId,
    investmentThesis: analysis.investmentThesis,
    keyStrengths: analysis.keyStrengths,
    keyRisks: analysis.keyRisks,
    catalystAnalysis: analysis.catalystAnalysis,
    confidenceLevel: analysis.confidenceLevel,
    recommendedAction: analysis.recommendedAction,
  });

  // Mark opportunity as having LLM analysis
  await database
    .update(scanOpportunities)
    .set({ llmAnalysisGenerated: true })
    .where(eq(scanOpportunities.id, opportunityId));
}

/**
 * Dismiss an opportunity
 */
export async function dismissOpportunity(opportunityId: number): Promise<void> {
  const database = await ensureDb();
  await database
    .update(scanOpportunities)
    .set({
      status: "dismissed",
      dismissedAt: new Date(),
    })
    .where(eq(scanOpportunities.id, opportunityId));
}

/**
 * Add opportunity to watchlist
 */
export async function addOpportunityToWatchlist(opportunityId: number): Promise<void> {
  const database = await ensureDb();
  await database
    .update(scanOpportunities)
    .set({
      status: "watched",
    })
    .where(eq(scanOpportunities.id, opportunityId));
}

/**
 * Calculate metrics for a stock (stub - will be implemented with actual data fetching)
 */
export async function calculateStockMetrics(ticker: string): Promise<Partial<KeyRatios> | null> {
  // This will be implemented to fetch real financial data
  // For now, returning null as placeholder
  return null;
}

/**
 * Generate LLM analysis for an opportunity
 */
export async function generateOpportunityAnalysis(
  ticker: string,
  companyName: string,
  personaName: string,
  metrics: Record<string, number | string | null>,
  score: number
): Promise<{
  investmentThesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  catalystAnalysis: string[];
  confidenceLevel: "low" | "medium" | "high";
  recommendedAction: string;
} | null> {
  try {
    const prompt = `You are ${personaName}, analyzing ${ticker} (${companyName}) as a potential investment opportunity.

Score: ${score}/100

Key Metrics:
${Object.entries(metrics)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Provide a brief investment analysis in JSON format with:
- investmentThesis: 2-3 sentence thesis (why this stock qualifies)
- keyStrengths: 3-5 key strengths with metrics
- keyRisks: 2-3 key risks to monitor
- catalystAnalysis: 2-3 upcoming catalysts
- confidenceLevel: "low", "medium", or "high"
- recommendedAction: "Buy", "Watch", or "Pass"

Return ONLY valid JSON, no other text.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are ${personaName}, a legendary investor providing analysis for stock opportunities.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    if (!response.choices?.[0]?.message?.content) {
      return null;
    }

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      return null;
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      investmentThesis: analysis.investmentThesis || "",
      keyStrengths: Array.isArray(analysis.keyStrengths) ? analysis.keyStrengths : [],
      keyRisks: Array.isArray(analysis.keyRisks) ? analysis.keyRisks : [],
      catalystAnalysis: Array.isArray(analysis.catalystAnalysis) ? analysis.catalystAnalysis : [],
      confidenceLevel: ["low", "medium", "high"].includes(analysis.confidenceLevel) ? analysis.confidenceLevel : "medium",
      recommendedAction: analysis.recommendedAction || "Watch",
    };
  } catch (error) {
    console.error("Error generating LLM analysis:", error);
    return null;
  }
}

/**
 * Check if a stock qualifies as an opportunity for a persona
 */
export function isQualifiedOpportunity(ratios: Partial<KeyRatios>, personaId: string): boolean {
  const score = calculatePersonaScore(ratios, personaId);
  if (score === null) {
    return false;
  }

  const minThreshold = getPersonaMinThreshold(personaId);
  return score >= minThreshold;
}

/**
 * Calculate score for a stock
 */
export function calculateScore(ratios: Partial<KeyRatios>, personaId: string): number | null {
  return calculatePersonaScore(ratios, personaId);
}
