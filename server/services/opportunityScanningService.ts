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

interface ScanJobProgress {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  phase: "data_collection" | "ranking" | "llm_analysis" | "aggregation";
  startedAt: Date;
  completedAt: Date | null;
  totalStocks: number;
  processedStocks: number;
  opportunitiesFound: number;
  llmAnalysesCompleted: number;
  errorMessage: string | null;
}

interface ScanOpportunityResult {
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
  scoringDetails?: any;
}

/**
 * Create a new scan job
 */
export async function createScanJob(personaId: number): Promise<number> {
  const scanJobId = createCacheJob(personaId);
  console.log(`[ScanJob] Created scan job ${scanJobId} for persona ${personaId}`);
  return scanJobId;
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
  return {
    lastUpdated: new Date(),
    stocksCached: 25,
  };
}

/**
 * Generate LLM analysis for an opportunity
 */
export async function generateLLMAnalysisForOpportunity(
  ticker: string,
  companyName: string,
  financialData: KeyRatios,
  personaId: number,
  personaIdStr: string
): Promise<{ thesis: string; confidence: string; scoringDetails: any }> {
  try {
    const personaPrompt = PERSONA_PROMPTS[personaIdStr as keyof typeof PERSONA_PROMPTS];
    if (!personaPrompt) {
      console.warn(`[LLM Analysis] Unknown persona: ${personaIdStr}`);
      return {
        thesis: `${companyName} is a potential opportunity based on financial metrics.`,
        confidence: "medium",
        scoringDetails: calculateDetailedScoringBreakdown(financialData as any, personaIdStr),
      };
    }

    const llmPrompt = `Analyze ${ticker} (${companyName}) as an investment opportunity.

Persona: ${personaIdStr}
Investment Style: Value investing

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

    console.log(`[LLM Analysis] ✅ Generated analysis for ${ticker}`);
    
    return {
      thesis: analysis.investmentThesis || "Analysis pending",
      confidence: analysis.confidenceLevel || "medium",
      scoringDetails,
    };
  } catch (error) {
    console.error(`[LLM Analysis] Error for ${ticker}:`, error);
    return {
      thesis: `${companyName} meets the investment criteria.`,
      confidence: "medium",
      scoringDetails: calculateDetailedScoringBreakdown(financialData as any, personaIdStr),
    };
  }
}

/**
 * Start test scan with 10 stocks
 */
export async function startTestScan(scanJobId: number, personaId: number): Promise<void> {
  const testTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JNJ", "V", "WMT", "KO", "PG"];

  try {
    // Update job status in cache
    updateScanProgress(scanJobId, {
      status: "pending",
      phase: "screening",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

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
    const scoredStocks: Array<{ ticker: string; companyName: string; score: number; data: any }> = [];

    for (let i = 0; i < testTickers.length; i++) {
      const ticker = testTickers[i];
      
      try {
        // Fetch real financial data from yfinance
        const financialData = await fetchRealKeyRatios(ticker);
        
        if (!financialData) {
          console.warn(`[TestScan ${scanJobId}] Failed to fetch real data for ${ticker}`);
          updateScanProgress(scanJobId, {
            processedStocks: i + 1,
            opportunitiesFound: opportunitiesCount,
          });
          continue;
        }

        // Score against persona
        const scoreResult = calculatePersonaScore(financialData as any, personaIdStr);
        const score = typeof scoreResult === 'number' ? scoreResult : 0;
        
        if (score >= minThreshold) {
          scoredStocks.push({
            ticker,
            companyName: ticker,
            score,
            data: financialData,
          });
          opportunitiesCount++;
        }

        // Update progress in cache
        updateScanProgress(scanJobId, {
          processedStocks: i + 1,
          opportunitiesFound: opportunitiesCount,
        });

        console.log(`[TestScan ${scanJobId}] Processed ${ticker}: score=${score.toFixed(1)}`);
      } catch (error) {
        console.error(`[TestScan ${scanJobId}] Error processing ${ticker}:`, error);
        updateScanProgress(scanJobId, {
          processedStocks: i + 1,
        });
      }
    }

    // Phase 1.5: Rank and filter to top opportunities
    const topOpportunities = scoredStocks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 50);

    console.log(`[TestScan ${scanJobId}] Found ${topOpportunities.length} opportunities, starting LLM analysis`);

    // Phase 2: Generate LLM analysis
    updateScanProgress(scanJobId, {
      phase: "llm_analysis",
    });

    for (let i = 0; i < topOpportunities.length; i++) {
      const opp = topOpportunities[i];

      try {
        // Generate LLM analysis
        const analysis = await generateLLMAnalysisForOpportunity(
          opp.ticker,
          opp.companyName,
          opp.data,
          personaId,
          personaIdStr
        );

        // Add result to cache
        addScanResult(scanJobId, {
          id: i + 1,
          rank: i + 1,
          ticker: opp.ticker,
          companyName: opp.companyName,
          score: Math.round(opp.score || 0),
          currentPrice: null,
          marketCap: null,
          sector: null,
          thesis: analysis.thesis,
          confidence: analysis.confidence,
          scoringDetails: analysis.scoringDetails,
        });

        console.log(`[TestScan ${scanJobId}] Generated analysis for ${opp.ticker}`);
      } catch (error) {
        console.error(`[TestScan ${scanJobId}] Error analyzing ${opp.ticker}:`, error);
      }
    }

    // Mark as completed
    completeScan(scanJobId);
    console.log(`[TestScan ${scanJobId}] ✅ Test scan completed`);
  } catch (error) {
    console.error(`[TestScan ${scanJobId}] Error:`, error);
    failScan(scanJobId, error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Start refresh job with adaptive rate limiting
 */
export async function startRefreshJobWithAdaptiveRateLimit(scanJobId: number): Promise<void> {
  // TODO: Implement full 5,500 stock scanning with adaptive rate limiting
  console.log(`[Refresh Job ${scanJobId}] TODO: Implement full scanning`);
}
