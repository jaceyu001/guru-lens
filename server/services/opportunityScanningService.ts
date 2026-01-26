/**
 * Opportunity Scanning Service
 * 
 * Scans all US stocks to find opportunities matching persona criteria.
 * Uses the shared persona scoring engine to ensure consistency with individual analysis.
 */

import { getDb } from "../db";
import { scanJobs, scanOpportunities, scanOpportunityAnalyses, tickers } from "../../drizzle/schema";
import { calculatePersonaScore, getPersonaMinThreshold, calculateDetailedScoringBreakdown } from "./personaScoringEngine";
import { invokeLLM } from "../_core/llm";
import { PERSONA_PROMPTS } from "./personaPrompts";
import { fetchRealKeyRatios } from "./realFinancialDataFetcher";
import { createScanJob as createCacheJob, updateScanProgress, addScanResult, completeScan, failScan, getScanProgress, getScanResults } from "./scanResultsCache";
import type { KeyRatios } from "../../shared/types";
import { eq, desc } from "drizzle-orm";

let db: Awaited<ReturnType<typeof getDb>> | null = null;

async function ensureDb() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

export interface ScanJobProgress {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  phase: "data_collection" | "ranking" | "llm_analysis" | "aggregation";
  startedAt: Date | null;
  completedAt: Date | null;
  totalStocks: number;
  processedStocks: number;
  opportunitiesFound: number;
  llmAnalysesCompleted: number;
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
  scoringDetails?: {
    categories: Array<{
      name: string;
      points: number;
      maxPoints: number;
      metrics: Array<{
        name: string;
        value: number;
        rating: string;
        points: number;
      }>;
    }>;
    totalScore: number;
  };
}

/**
 * Get all US stock tickers from the database
 */
export async function getAllUSStockTickers(): Promise<string[]> {
  const database = (await ensureDb())!;
  const allTickers = await database
    .select({ symbol: tickers.symbol })
    .from(tickers);
  return allTickers.map((t) => t.symbol);
}

/**
 * Create a new scan job
 */
export async function createScanJob(personaId: number): Promise<number> {
  const database = (await ensureDb())!;

  const result = await database.insert(scanJobs).values({
    personaId,
    status: "pending",
    phase: "data_collection",
    totalStocks: 5500,
    processedStocks: 0,
    opportunitiesFound: 0,
    llmAnalysesCompleted: 0,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
  });

  return Number(result[0]?.insertId || 0);
}

/**
 * Get scan job progress
 */
export async function getScanJobProgress(scanJobId: number): Promise<ScanJobProgress> {
  const progress = getScanProgress(scanJobId);
  
  return {
    id: scanJobId,
    status: progress.status as "pending" | "running" | "completed" | "failed",
    phase: progress.phase as "data_collection" | "ranking" | "llm_analysis" | "aggregation",
    startedAt: new Date(),
    completedAt: null,
    totalStocks: 10,
    processedStocks: progress.processedStocks,
    opportunitiesFound: progress.opportunitiesFound,
    llmAnalysesCompleted: 0,
    errorMessage: null,
  };
}

/**
 * Get opportunities for a scan
 */
export async function getOpportunitiesForScan(
  scanJobId: number,
  limit: number = 50
): Promise<ScanOpportunityResult[]> {
  const results = getScanResults(scanJobId, limit);
  return results.map(r => ({
    id: r.id,
    rank: r.rank,
    ticker: r.ticker,
    companyName: r.companyName,
    score: r.score,
    metrics: {},
    currentPrice: r.currentPrice,
    marketCap: r.marketCap,
    sector: r.sector,
    thesis: r.thesis,
    confidence: r.confidence,
    scoringDetails: r.scoringDetails,
  }));
}

/**
 * Get data status
 */
export async function getDataStatus(): Promise<{
  lastUpdated: Date | null;
  stocksCached: number;
}> {
  const database = (await ensureDb())!;

  const cachedStocks = await database
    .select({ id: tickers.id })
    .from(tickers);

  return {
    lastUpdated: new Date(),
    stocksCached: cachedStocks.length,
  };
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
  const database = (await ensureDb())!;

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

    // Calculate detailed scoring breakdown
    const scoringDetails = calculateDetailedScoringBreakdown(financialData as any, personaIdStr);

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
      scoringDetails: scoringDetails || undefined,
      analysisDate: new Date(),
    });

    console.log(`[LLM Analysis] ✅ Generated analysis for ${ticker}`);
  } catch (error) {
    console.error(`[LLM Analysis] Error for ${ticker}:`, error);
    // Don't throw - continue processing other opportunities
  }
}

/**
 * Start test scan with 10 stocks
 */
export async function startTestScan(scanJobId: number, personaId: number): Promise<void> {
  const database = (await ensureDb())!;
  const testTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JNJ", "V", "WMT", "KO", "PG"];

  try {
    // Update job status
    await database
      .update(scanJobs)
      .set({
        status: "running",
        phase: "data_collection",
        startedAt: new Date(),
        totalStocks: testTickers.length,
      })
      .where(eq(scanJobs.id, scanJobId));

    console.log(`[TestScan ${scanJobId}] Starting test scan with ${testTickers.length} stocks`);

    // Get persona threshold
    const personaIdMap: Record<number, string> = {
      1: "warren_buffett",
      2: "peter_lynch",
      3: "benjamin_graham",
      4: "cathie_wood",
      5: "ray_dalio",
      6: "philip_fisher",
    };
    const personaIdStr = personaIdMap[personaId] || "warren_buffett";
    const minThreshold = getPersonaMinThreshold(personaIdStr);
    console.log(`[TestScan ${scanJobId}] Persona ${personaIdStr} min threshold: ${minThreshold}`);

    // Phase 1: Screen all test stocks
    let opportunitiesCount = 0;
    const scoredStocks: Array<{ ticker: string; score: number; data: any; tickerId: number }> = [];

    for (let i = 0; i < testTickers.length; i++) {
      const ticker = testTickers[i];
      
      try {
        // Get ticker record
        const tickerRecord = await database
          .select()
          .from(tickers)
          .where(eq(tickers.symbol, ticker))
          .limit(1);

        if (!tickerRecord || !tickerRecord[0]) {
          console.warn(`[TestScan ${scanJobId}] Ticker not found: ${ticker}`);
          continue;
        }

        const tickerId = tickerRecord[0].id;

        // Fetch real financial data from yfinance
        const financialData = await fetchRealKeyRatios(ticker);
        
        if (!financialData) {
          console.warn(`[TestScan ${scanJobId}] Failed to fetch real data for ${ticker}`);
          continue;
        }

        // Score against persona
        const scoreResult = calculatePersonaScore(financialData as any, personaIdStr);
        const score = typeof scoreResult === 'number' ? scoreResult : 0;
        
        if (score >= minThreshold) {
          scoredStocks.push({
            ticker,
            score,
            data: financialData,
            tickerId,
          });
          opportunitiesCount++;
        }

        // Update progress
        await database
          .update(scanJobs)
          .set({
            processedStocks: i + 1,
            opportunitiesFound: opportunitiesCount,
          })
          .where(eq(scanJobs.id, scanJobId));

        console.log(`[TestScan ${scanJobId}] Processed ${ticker}: score=${score.toFixed(1)}`);
      } catch (error) {
        console.error(`[TestScan ${scanJobId}] Error processing ${ticker}:`, error);
      }
    }

    // Phase 1.5: Rank and filter to top opportunities
    const topOpportunities = scoredStocks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 50);

    console.log(`[TestScan ${scanJobId}] Found ${topOpportunities.length} opportunities, starting LLM analysis`);

    // Phase 2: Generate LLM analysis
    await database
      .update(scanJobs)
      .set({
        phase: "llm_analysis",
      })
      .where(eq(scanJobs.id, scanJobId));

    for (let i = 0; i < topOpportunities.length; i++) {
      const opp = topOpportunities[i];

      try {
        // Store opportunity
        const oppResult = await database.insert(scanOpportunities).values({
          scanJobId,
          personaId,
          tickerId: opp.tickerId,
          score: Math.round(opp.score || 0),
          rank: i + 1,
          currentPrice: null,
          marketCap: null,
          sector: null,
          metricsJson: opp.data,
        });

        const opportunityId = Number(oppResult[0]?.insertId || 0);

        // Generate LLM analysis
        if (opportunityId) {
          await generateLLMAnalysisForOpportunity(
            opportunityId,
            personaId,
            opp.ticker,
            opp.ticker,
            opp.data
          );
        }

        // Update progress
        await database
          .update(scanJobs)
          .set({
            llmAnalysesCompleted: i + 1,
          })
          .where(eq(scanJobs.id, scanJobId));

        console.log(`[TestScan ${scanJobId}] Generated analysis for ${opp.ticker}`);
      } catch (error) {
        console.error(`[TestScan ${scanJobId}] Error analyzing ${opp.ticker}:`, error);
      }
    }

    // Mark as completed
    await database
      .update(scanJobs)
      .set({
        status: "completed",
        phase: "aggregation",
        completedAt: new Date(),
      })
      .where(eq(scanJobs.id, scanJobId));

    console.log(`[TestScan ${scanJobId}] ✅ Test scan completed`);
  } catch (error) {
    console.error(`[TestScan ${scanJobId}] Error:`, error);
    await database
      .update(scanJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(scanJobs.id, scanJobId));
  }
}

/**
 * Start refresh job with adaptive rate limiting
 */
export async function startRefreshJobWithAdaptiveRateLimit(scanJobId: number): Promise<void> {
  // TODO: Implement full 5,500 stock scanning with adaptive rate limiting
  console.log(`[Refresh Job ${scanJobId}] TODO: Implement full scanning`);
}
