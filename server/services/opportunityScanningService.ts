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


/**
 * Adaptive Rate Limiting Configuration
 */
interface RateLimitConfig {
  currentRate: number;        // Current requests/hour (500, 750, 1000, 1250, 1500)
  targetRate: number;         // Target for next hour
  minRate: number;            // Minimum rate (500)
  maxRate: number;            // Maximum rate (1500)
  rateIncrement: number;      // Increment per hour (250)
  batchSize: number;          // Tickers per batch (50)
  hoursSinceStart: number;    // Hours elapsed
  errorDetected: boolean;     // Whether rate limit error found
  lastStableRate: number;     // Rate before error
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: string): boolean {
  const rateLimitPatterns = [
    /too many requests/i,
    /rate limit/i,
    /429/,
    /403/,
    /999/,
    /throttle/i,
    /exceeded/i,
  ];

  return rateLimitPatterns.some((pattern) => pattern.test(error));
}

/**
 * Delay utility function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get all US stock tickers
 */
async function getAllUSStockTickers(): Promise<string[]> {
  const database = await ensureDb();
  const allTickers = await database.select({ symbol: tickers.symbol }).from(tickers);
  return allTickers.map((t) => t.symbol);
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

    let successCount = 0;
    let failureCount = 0;
    let rateLimitErrorCount = 0;

    // Initialize rate limiting config
    const rateLimitConfig: RateLimitConfig = {
      currentRate: 500,        // Start at 500/hr
      targetRate: 500,
      minRate: 500,
      maxRate: 1500,
      rateIncrement: 250,
      batchSize: 50,
      hoursSinceStart: 0,
      errorDetected: false,
      lastStableRate: 500,
    };

    const BATCH_SIZE = rateLimitConfig.batchSize;
    const refreshStartTime = new Date();
    let lastRateIncreaseTime = new Date();

    // Import batch fetching function
    const { getStockDataBatch } = await import("./realFinancialData");

    // Process in batches
    for (let i = 0; i < allTickers.length; i += BATCH_SIZE) {
      // Check if we should increase rate (every hour)
      const currentTime = new Date();
      const hoursSinceStart =
        (currentTime.getTime() - refreshStartTime.getTime()) / (1000 * 60 * 60);
      const hoursSinceLastIncrease =
        (currentTime.getTime() - lastRateIncreaseTime.getTime()) / (1000 * 60 * 60);

      if (
        hoursSinceLastIncrease >= 1 &&
        !rateLimitConfig.errorDetected &&
        rateLimitConfig.currentRate < rateLimitConfig.maxRate
      ) {
        // Increase rate
        rateLimitConfig.lastStableRate = rateLimitConfig.currentRate;
        rateLimitConfig.currentRate = Math.min(
          rateLimitConfig.currentRate + rateLimitConfig.rateIncrement,
          rateLimitConfig.maxRate
        );
        lastRateIncreaseTime = new Date();

        console.log(
          `[RefreshJob] 📈 Rate increased to ${rateLimitConfig.currentRate}/hr`
        );

        // Rate limit tracking would be in separate table
        console.log(`Rate: ${rateLimitConfig.currentRate}/hr`);
      }

      const batch = allTickers.slice(i, i + BATCH_SIZE);

      try {
        // Calculate delay based on current rate
        const delayBetweenBatches = (3600 * 1000) / (rateLimitConfig.currentRate / BATCH_SIZE);

        // Fetch batch from yfinance
        const batchData = await getStockDataBatch(batch);

        // Process each stock in batch
        for (const ticker in batchData) {
          const data = batchData[ticker];

          if ("error" in data) {
            // Check if it's a rate limit error
            if (isRateLimitError(data.error)) {
              rateLimitErrorCount++;
              failureCount++;

              // Detect rate limit error
              if (!rateLimitConfig.errorDetected) {
                console.warn(
                  `⚠️ [RefreshJob] Rate limit error detected at ${rateLimitConfig.currentRate}/hr`
                );

                rateLimitConfig.errorDetected = true;
                rateLimitConfig.currentRate = rateLimitConfig.lastStableRate;

                // Update database with error
                await database
                  .update(scanJobs)
                  .set({
                    errorMessage: `Rate limit error detected, reverted to ${rateLimitConfig.currentRate}/hr`,
                  })
                  .where(eq(scanJobs.id, refreshJobId));
              }
            } else {
              failureCount++;
            }
            continue;
          }

          // Store in cache (simplified - would store all fields in real implementation)
          // This is a placeholder - actual implementation would store all financial metrics
          successCount++;
        }

        // Update progress
        await database
          .update(scanJobs)
          .set({
            processedStocks: i + batch.length,
            opportunitiesFound: successCount,
          })
          .where(eq(scanJobs.id, refreshJobId));

        // Rate limiting: wait before next batch
        if (i + BATCH_SIZE < allTickers.length) {
          console.log(
            `[RefreshJob] Waiting ${(delayBetweenBatches / 1000).toFixed(1)}s before next batch (Rate: ${rateLimitConfig.currentRate}/hr)`
          );
          await delay(delayBetweenBatches);
        }
      } catch (error) {
        failureCount += batch.length;
        console.error(`[RefreshJob] Failed to fetch batch ${i / BATCH_SIZE + 1}:`, error);

        // Update progress
        await database
          .update(scanJobs)
          .set({
            processedStocks: i + batch.length,
            opportunitiesFound: successCount,
          })
          .where(eq(scanJobs.id, refreshJobId));
      }
    }

    // Phase 2: LLM Analysis for top 50 opportunities (if this is a scan job)
    if (refreshJobId > 0) {
      console.log(`[RefreshJob] 🤖 Starting Phase 2: LLM Analysis for top opportunities`);
      
      await database
        .update(scanJobs)
        .set({
          phase: "llm_analysis",
        })
        .where(eq(scanJobs.id, refreshJobId));

      // Get top 50 opportunities for this scan
      const topOpportunities = await database
        .select({
          id: scanOpportunities.id,
          tickerId: scanOpportunities.tickerId,
          personaId: scanOpportunities.personaId,
          metricsJson: scanOpportunities.metricsJson,
        })
        .from(scanOpportunities)
        .where(eq(scanOpportunities.scanJobId, refreshJobId))
        .orderBy(desc(scanOpportunities.score))
        .limit(50);

      // Generate LLM analysis for each opportunity
      let llmAnalysesCompleted = 0;
      for (const opp of topOpportunities) {
        try {
          // Get ticker symbol from tickerId
          const ticker = await database
            .select({ symbol: tickers.symbol, name: tickers.companyName })
            .from(tickers)
            .where(eq(tickers.id, opp.tickerId))
            .limit(1);

          if (ticker && ticker[0]) {
            // Generate LLM analysis
            await generateLLMAnalysisForOpportunity(
              opp.id,
              opp.personaId,
              ticker[0].symbol,
              ticker[0].name || '',
              opp.metricsJson as Record<string, any>
            );

            llmAnalysesCompleted++;

            // Update progress
            await database
              .update(scanJobs)
              .set({
                llmAnalysesCompleted,
              })
              .where(eq(scanJobs.id, refreshJobId));
          }
        } catch (error) {
          console.error(`[RefreshJob] Error generating LLM analysis for opportunity ${opp.id}:`, error);
          // Continue with next opportunity
        }
      }

      console.log(`[RefreshJob] ✅ Completed LLM analysis for ${llmAnalysesCompleted} opportunities`);
    }

    // Mark as completed
    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - refreshStartTime.getTime()) / (1000 * 60)
    );

    console.log(
      `[RefreshJob] ✅ Completed in ${durationMinutes} minutes. Success: ${successCount}, Failures: ${failureCount}, Rate Limit Errors: ${rateLimitErrorCount}`
    );

    await database
      .update(scanJobs)
      .set({
        status: "completed",
        phase: "aggregation",
        completedAt: endTime,
      })
      .where(eq(scanJobs.id, refreshJobId));
  } catch (error) {
    console.error("[RefreshJob] Error:", error);

    await database
      .update(scanJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      })
      .where(eq(scanJobs.id, refreshJobId));
  }
}


/**
 * Get opportunities for a completed scan
 */
export async function getOpportunitiesForScan(
  scanJobId: number,
  limit: number = 50
): Promise<ScanOpportunityResult[]> {
  const database = await ensureDb();

  const opportunities = await database
    .select({
      id: scanOpportunities.id,
      rank: scanOpportunities.rank,
      tickerId: scanOpportunities.tickerId,
      score: scanOpportunities.score,
      metricsJson: scanOpportunities.metricsJson,
      currentPrice: scanOpportunities.currentPrice,
      marketCap: scanOpportunities.marketCap,
      sector: scanOpportunities.sector,
      thesis: scanOpportunityAnalyses.investmentThesis,
      strengths: scanOpportunityAnalyses.keyStrengths,
      risks: scanOpportunityAnalyses.keyRisks,
      catalysts: scanOpportunityAnalyses.catalystAnalysis,
      confidence: scanOpportunityAnalyses.confidenceLevel,
    })
    .from(scanOpportunities)
    .leftJoin(
      scanOpportunityAnalyses,
      eq(scanOpportunities.id, scanOpportunityAnalyses.opportunityId)
    )
    .where(eq(scanOpportunities.scanJobId, scanJobId))
    .orderBy(desc(scanOpportunities.score))
    .limit(limit);

  // Map to result format
  return opportunities.map((opp: any) => ({
    id: opp.id,
    rank: opp.rank || 0,
    ticker: '',
    companyName: '',
    score: opp.score,
    metrics: opp.metricsJson || {},
    currentPrice: opp.currentPrice ? Number(opp.currentPrice) : null,
    marketCap: opp.marketCap ? Number(opp.marketCap) : null,
    sector: opp.sector,
    thesis: opp.thesis,
    strengths: opp.strengths || [],
    risks: opp.risks || [],
    catalysts: opp.catalysts || [],
    confidence: opp.confidence,
  })) as any;
}

/**
 * Get full details for a single opportunity
 */
export async function getOpportunityDetails(
  opportunityId: number
): Promise<(ScanOpportunityResult & { fullMetrics: Record<string, any> }) | null> {
  const database = await ensureDb();

  const opportunity = await database
    .select({
      id: scanOpportunities.id,
      rank: scanOpportunities.rank,
      tickerId: scanOpportunities.tickerId,
      score: scanOpportunities.score,
      metricsJson: scanOpportunities.metricsJson,
      currentPrice: scanOpportunities.currentPrice,
      marketCap: scanOpportunities.marketCap,
      sector: scanOpportunities.sector,
      thesis: scanOpportunityAnalyses.investmentThesis,
      strengths: scanOpportunityAnalyses.keyStrengths,
      risks: scanOpportunityAnalyses.keyRisks,
      catalysts: scanOpportunityAnalyses.catalystAnalysis,
      confidence: scanOpportunityAnalyses.confidenceLevel,
    })
    .from(scanOpportunities)
    .leftJoin(
      scanOpportunityAnalyses,
      eq(scanOpportunities.id, scanOpportunityAnalyses.opportunityId)
    )
    .where(eq(scanOpportunities.id, opportunityId))
    .limit(1);

  if (!opportunity || opportunity.length === 0) {
    return null;
  }

  const result = opportunity[0] as any;
  return {
    id: result.id,
    rank: result.rank || 0,
    ticker: '',
    companyName: '',
    score: result.score,
    metrics: result.metricsJson || {},
    currentPrice: result.currentPrice ? Number(result.currentPrice) : null,
    marketCap: result.marketCap ? Number(result.marketCap) : null,
    sector: result.sector,
    thesis: result.thesis,
    strengths: result.strengths || [],
    risks: result.risks || [],
    catalysts: result.catalysts || [],
    confidence: result.confidence,
    fullMetrics: (result.metricsJson as Record<string, any>) || {},
  } as any;
}

/**
 * Get current data cache status
 */
export async function getDataStatus(): Promise<{
  lastUpdated: Date | null;
  stocksCached: number;
  nextRefreshTime: string | null;
}> {
  const database = await ensureDb();

  // Get most recent successful refresh
  const lastRefresh = await database
    .select({
      completedAt: scanJobs.completedAt,
    })
    .from(scanJobs)
    .where(eq(scanJobs.status, "completed"))
    .orderBy(desc(scanJobs.completedAt))
    .limit(1);

  const lastUpdated = lastRefresh[0]?.completedAt || null;

  // Count cached stocks (simplified - would count from financialDataCache table)
  // For now, return placeholder
  const stocksCached = 5500;

  return {
    lastUpdated,
    stocksCached,
    nextRefreshTime: null, // Would be set if scheduled
  };
}

/**
 * Create a new refresh job (for data cache refresh)
 */
export async function createRefreshJob(): Promise<number> {
  const database = await ensureDb();

  // Create a special scan job for refresh (personaId = 0 means data refresh)
  const result = await database.insert(scanJobs).values({
    personaId: 0, // Special ID for data refresh
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
 * Generate LLM analysis for a qualified opportunity
 * Uses existing persona prompts to generate investment thesis
 */
export async function generateLLMAnalysisForOpportunity(
  opportunityId: number,
  personaId: number,
  ticker: string,
  companyName: string,
  financialData: Record<string, any>
): Promise<void> {
  const database = await ensureDb();

  try {
    // Get persona prompt
    const { PERSONA_PROMPTS } = await import('./personaPrompts');
    const personaKey = Object.keys(PERSONA_PROMPTS)[personaId - 1]; // Assuming personaId 1-6 maps to prompts
    
    if (!personaKey || !PERSONA_PROMPTS[personaKey]) {
      console.warn(`[LLM Analysis] No prompt found for persona ${personaId}`);
      return;
    }

    const personaPrompt = PERSONA_PROMPTS[personaKey];

    // Build LLM prompt with financial data
    const userPrompt = `
Analyze ${ticker} (${companyName}) for opportunity investment.

Financial Metrics:
- Current Price: $${financialData.price?.current || 'N/A'}
- P/E Ratio: ${financialData.ratios?.pe || 'N/A'}
- ROE: ${financialData.ratios?.roe || 'N/A'}%
- Profit Margin: ${financialData.ratios?.netMargin || 'N/A'}%
- Debt/Equity: ${financialData.ratios?.debtToEquity || 'N/A'}
- Current Ratio: ${financialData.ratios?.currentRatio || 'N/A'}
- Market Cap: ${financialData.profile?.marketCap || 'N/A'}
- Sector: ${financialData.profile?.sector || 'N/A'}

Provide a JSON response with:
{
  "investmentThesis": "2-3 paragraph analysis of why this stock fits the persona's criteria",
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "keyRisks": ["risk 1", "risk 2"],
  "catalystAnalysis": ["catalyst 1", "catalyst 2"],
  "confidenceLevel": "low|medium|high",
  "recommendedAction": "buy|hold|watch"
}

Be concise and specific. Reference the financial metrics provided.`;

    // Call LLM
    const { invokeLLM } = await import('../_core/llm');
    const response = await invokeLLM({
      messages: [
        { role: "system", content: personaPrompt.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "opportunity_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              investmentThesis: { type: "string" },
              keyStrengths: { type: "array", items: { type: "string" } },
              keyRisks: { type: "array", items: { type: "string" } },
              catalystAnalysis: { type: "array", items: { type: "string" } },
              confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
              recommendedAction: { type: "string", enum: ["buy", "hold", "watch"] },
            },
            required: [
              "investmentThesis",
              "keyStrengths",
              "keyRisks",
              "catalystAnalysis",
              "confidenceLevel",
              "recommendedAction",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn(`[LLM Analysis] No content in LLM response for ${ticker}`);
      return;
    }

    const analysis = typeof content === "string" ? JSON.parse(content) : content;

    // Store analysis in database
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
