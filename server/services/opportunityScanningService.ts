/**
 * Opportunity Scanning Service
 * 
 * Hybrid two-stage scanning:
 * - Stage 1: Financial pre-filter for quick ranking
 * - Stage 2: LLM-based final scoring for top candidates
 */

import { getDb, getTickerBySymbol, upsertTicker, createAnalysis, createOpportunity } from "../db";
import { scanJobs, scanOpportunities, scanOpportunityAnalyses, tickers } from "../../drizzle/schema";
import { hybridScore } from "./hybridScoringOrchestrator";
import { createScanJob as createCacheJob, updateScanProgress, addScanResult, completeScan, failScan, getScanProgress, getScanResults, getScanJob } from "./scanResultsCache";
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

/**
 * Create a new scan job
 */
export async function createScanJob(personaId: number): Promise<number> {
  return createCacheJob(personaId);
}

/**
 * Get scan job progress
 */
export async function getScanJobProgress(scanJobId: number): Promise<ScanJobProgress> {
  const job = getScanJob(scanJobId);
  if (!job) {
    return {
      id: scanJobId,
      status: "pending",
      phase: "data_collection",
      startedAt: new Date(),
      completedAt: null,
      totalStocks: 10,
      processedStocks: 0,
      opportunitiesFound: 0,
      llmAnalysesCompleted: 0,
      errorMessage: null,
    };
  }
  
  // Map cache status to API status
  let status: "pending" | "running" | "completed" | "failed" = "pending";
  if (job.status === "completed") {
    status = "completed";
  } else if (job.status === "failed") {
    status = "failed";
  } else if (job.status === "screening" || job.status === "ranking" || job.status === "llm_analysis") {
    status = "running";
  }
  
  return {
    id: scanJobId,
    status,
    phase: job.phase as "data_collection" | "ranking" | "llm_analysis" | "aggregation",
    startedAt: job.createdAt,
    completedAt: job.completedAt || null,
    totalStocks: 10,
    processedStocks: job.processedStocks,
    opportunitiesFound: job.opportunitiesFound,
    llmAnalysesCompleted: 0,
    errorMessage: job.error || null,
  };
}

/**
 * Get opportunities for a scan - reads from database first, then cache
 */
export async function getOpportunitiesForScan(
  scanJobId: number,
  limit: number = 50
): Promise<any[]> {
  // First try to get from database
  const database = await ensureDb();
  if (database) {
    try {
      // Get the scan job to find the persona ID
      const job = getScanJob(scanJobId);
      if (job) {
        const { getLatestOpportunitiesForPersona } = await import("../db");
        const dbOpportunities = await getLatestOpportunitiesForPersona(job.personaId, limit);
        if (dbOpportunities.length > 0) {
          return dbOpportunities.map((opp: any) => ({
            id: opp.id,
            scanJobId,
            ticker: opp.ticker?.symbol || "",
            company: opp.ticker?.companyName || "",
            score: opp.analysis?.score || 0,
            finalScore: opp.analysis?.score || 0,
            preliminaryScore: opp.analysis?.preliminaryScore,
            price: null,
            marketCap: null,
            sector: opp.ticker?.sector,
            thesis: opp.analysis?.summaryBullets?.[0] || "",
            confidence: opp.analysis?.confidence || 0,
            verdict: opp.analysis?.verdict,
            criteria: opp.analysis?.criteria,
            keyRisks: opp.analysis?.keyRisks,
            whatWouldChangeMind: opp.analysis?.whatWouldChangeMind,
            summaryBullets: opp.analysis?.summaryBullets,
            strengths: opp.analysis?.strengths,
            financialMetrics: opp.analysis?.financialMetrics,
            dataUsed: opp.analysis?.dataUsed,
            scoringDetails: {
              categories: [],
              totalScore: opp.analysis?.score || 0,
            },
          }));
        }
      }
    } catch (error) {
      console.warn("[getOpportunitiesForScan] Failed to read from database:", error);
    }
  }
  
  // Fall back to cache
  const results = getScanResults(scanJobId);
  return results.slice(0, limit).map((r) => ({
    id: r.id,
    scanJobId,
    ticker: r.ticker,
    company: r.companyName,
    score: r.score,
    finalScore: r.score,
    preliminaryScore: r.preliminaryScore,
    price: r.currentPrice,
    marketCap: r.marketCap,
    sector: r.sector,
    thesis: r.thesis,
    confidence: r.confidence,
    verdict: r.verdict,
    criteria: r.criteria,
    keyRisks: r.keyRisks,
    whatWouldChangeMind: r.whatWouldChangeMind,
    summaryBullets: r.summaryBullets,
    strengths: r.strengths,
    financialMetrics: r.financialMetrics,
    dataUsed: r.dataUsed,
    scoringDetails: r.scoringDetails,
  }));
}

/**
 * Get data status (cache info)
 */
export async function getDataStatus(): Promise<any> {
  try {
    const database = await ensureDb();
    if (!database) {
      return {
        status: "no_cache",
        lastUpdated: null,
        stocksCached: 0,
      };
    }
    
    return {
      status: "cached",
      lastUpdated: new Date(),
      stocksCached: 25, // TODO: Get actual count from database
    };
  } catch (error) {
    console.error("[getDataStatus] Error:", error);
    return {
      status: "error",
      lastUpdated: null,
      stocksCached: 0,
    };
  }
}

/**
 * Get persona info
 */
function getPersonaInfo(personaId: number): { name: string; description: string } {
  const personas: Record<number, { name: string; description: string }> = {
    1: { name: "Warren Buffett", description: "Value investing legend" },
    2: { name: "Peter Lynch", description: "Growth at reasonable price" },
    3: { name: "Benjamin Graham", description: "Value investing father" },
    4: { name: "Cathie Wood", description: "Disruptive innovation" },
    5: { name: "Ray Dalio", description: "Macroeconomic investor" },
    6: { name: "Philip Fisher", description: "Growth investor" },
  };
  
  return personas[personaId] || { name: "Unknown", description: "" };
}

/**
 * Get random tickers for test scan
 */
async function getRandomTickers(count: number): Promise<string[]> {
  const testTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JNJ", "V", "WMT", "KO", "PG"];
  return testTickers.slice(0, count);
}

/**
 * Start test scan (10 stocks)
 */
export async function startTestScan(scanJobId: number, personaId: number): Promise<void> {
  console.log(`[TestScan ${scanJobId}] Starting test scan...`);
  const persona = getPersonaInfo(personaId);
  const testTickers = await getRandomTickers(10);
  const database = await ensureDb();

  try {
    // Update job status in cache
    updateScanProgress(scanJobId, {
      status: "screening",
      phase: "screening",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

    console.log(`[TestScan ${scanJobId}] Starting with ${testTickers.length} random stocks: ${testTickers.join(", ")}`);
    console.log(`[TestScan ${scanJobId}] Persona: ${persona.name}`);

    // Run hybrid scoring: Stage 1 pre-filter + Stage 2 LLM on top 5
    const hybridResults = await hybridScore(testTickers, personaId, persona.name, 5);

    console.log(`[TestScan ${scanJobId}] Hybrid scoring complete: ${hybridResults.length} results`);
    console.log(`[TestScan ${scanJobId}] Adding ${hybridResults.length} results to cache...`);

    // Add results to in-memory cache
    const scanDate = new Date();
    scanDate.setHours(0, 0, 0, 0); // Normalize to midnight
    
    for (let i = 0; i < hybridResults.length; i++) {
      const result = hybridResults[i];
      const cacheResult = {
        id: i + 1,
        rank: i + 1,
        ticker: result.ticker,
        company: result.ticker,
        companyName: result.ticker,
        score: result.finalScore,
        currentPrice: null,
        marketCap: null,
        sector: null,
        thesis: result.thesis,
        confidence: `${(result.confidence * 100).toFixed(0)}%`,
        verdict: result.verdict || "strong_fit",
        summaryBullets: result.summaryBullets || [],
        criteria: result.criteria || [],
        strengths: result.summaryBullets || [],
        keyRisks: result.keyRisks || [],
        whatWouldChangeMind: result.whatWouldChangeMind || [],
        financialMetrics: result.financialMetrics || {},
        dataUsed: {
          sources: result.dataUsed?.sources || ["Batch AI Analysis Engine"],
          timestamp: new Date().toISOString(),
        },
        scoringDetails: {
          categories: [
            {
              name: "LLM Analysis",
              points: result.finalScore,
              maxPoints: 100,
              metrics: result.criteria.map((c: any) => ({
                name: c.name,
                value: c.weight,
                rating: c.status,
                points: Math.round(c.weight * result.finalScore / 100),
              })),
            },
          ],
          totalScore: result.finalScore,
        },
      };
      
      console.log(`[TestScan ${scanJobId}] Adding result ${i + 1}/${hybridResults.length}: ${result.ticker}`);
      // Add to in-memory cache (primary storage)
      addScanResult(scanJobId, cacheResult);
      // Note: Database persistence disabled for now - using in-memory cache as primary storage

      // Update progress
      updateScanProgress(scanJobId, {
        processedStocks: i + 1,
        opportunitiesFound: i + 1,
        phase: "llm_analysis",
      });
    }

    console.log(`[TestScan ${scanJobId}] Marking scan as completed...`);
    // Mark as completed
    completeScan(scanJobId);
    console.log(`[TestScan ${scanJobId}] Test scan completed with ${hybridResults.length} stocks`);
  } catch (error) {
    console.error(`[TestScan ${scanJobId}] Error during scan:`, error);
    failScan(scanJobId, error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Start full scan with all US stocks (alias for startRefreshJobWithAdaptiveRateLimit)
 * Stage 1: Pre-filter all 5,500 with financial scores
 * Stage 2: LLM analysis on top 50
 * Result: Show only winners above threshold with final scores
 */
export async function startFullScan(scanJobId: number, personaId: number): Promise<void> {
  return startRefreshJobWithAdaptiveRateLimit(scanJobId, personaId);
}

/**
 * Full scan implementation with cache-first strategy
 */
export async function startRefreshJobWithAdaptiveRateLimit(scanJobId: number, personaId: number): Promise<void> {
  console.log(`[FullScan ${scanJobId}] Starting full scan with cache-first strategy...`);
  const persona = getPersonaInfo(personaId);
  const database = await ensureDb();

  try {
    // Import dependencies
    const { getStockUniverse } = await import("./stockUniverse");
    const { getFinancialDataBatchWithFallback } = await import("./cacheFirstDataFetcher");

    // Update job status
    updateScanProgress(scanJobId, {
      status: "screening",
      phase: "data_collection",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

    console.log(`[FullScan ${scanJobId}] Persona: ${persona.name}`);

    // Phase 1: Get stock universe and fetch financial data with cache-first strategy
    console.log(`[FullScan ${scanJobId}] Phase 1: Fetching financial data for stock universe...`);
    const allStocks = getStockUniverse();
    console.log(`[FullScan ${scanJobId}] Stock universe size: ${allStocks.length}`);

    // Batch fetch with cache-first strategy
    const startPhase1 = Date.now();
    const dataMap = await getFinancialDataBatchWithFallback(allStocks);
    const phase1TimeMs = Date.now() - startPhase1;
    console.log(`[FullScan ${scanJobId}] Phase 1 completed in ${phase1TimeMs}ms`);
    console.log(`[FullScan ${scanJobId}] Retrieved data for ${dataMap.size} stocks`);

    // Update progress
    updateScanProgress(scanJobId, {
      phase: "ranking",
      processedStocks: allStocks.length,
    });

    // Phase 2: Pre-filter and select top 50 for LLM analysis
    console.log(`[FullScan ${scanJobId}] Phase 2: Pre-filtering and selecting top 50 candidates...`);
    const startPhase2 = Date.now();
    const tickers = Array.from(dataMap.keys());
    const hybridResults = await hybridScore(tickers, personaId, persona.name, 50, scanJobId);
    const phase2TimeMs = Date.now() - startPhase2;
    console.log(`[FullScan ${scanJobId}] Phase 2 completed in ${phase2TimeMs}ms`);
    console.log(`[FullScan ${scanJobId}] Hybrid scoring produced ${hybridResults.length} results`);

    // Update progress
    updateScanProgress(scanJobId, {
      phase: "llm_analysis",
      opportunitiesFound: hybridResults.length,
    });

    // Phase 3: Apply threshold filtering and store results
    console.log(`[FullScan ${scanJobId}] Phase 3: Applying threshold filtering and storing results...`);
    const startPhase3 = Date.now();
    const thresholds = getPersonaThresholds(personaId);
    const scanDate = new Date();
    scanDate.setHours(0, 0, 0, 0);

    let resultsStored = 0;
    for (let i = 0; i < hybridResults.length; i++) {
      const result = hybridResults[i];

      // Check if meets threshold
      if (result.finalScore >= thresholds.minScore) {
        const cacheResult = {
          id: resultsStored + 1,
          rank: resultsStored + 1,
          ticker: result.ticker,
          company: result.ticker,
          companyName: result.ticker,
          score: result.finalScore,
          preliminaryScore: result.preliminaryScore,
          currentPrice: null,
          marketCap: null,
          sector: null,
          thesis: result.thesis,
          confidence: `${(result.confidence * 100).toFixed(0)}%`,
          verdict: result.verdict || "strong_fit",
          summaryBullets: result.summaryBullets || [],
          criteria: result.criteria || [],
          strengths: result.strengths || [],
          keyRisks: result.keyRisks || [],
          whatWouldChangeMind: result.whatWouldChangeMind || [],
          financialMetrics: result.financialMetrics || {},
          dataUsed: result.dataUsed || {
            sources: ["Alpha Vantage API", "Batch AI Analysis Engine"],
            timestamp: new Date().toISOString(),
          },
          scoringDetails: {
            categories: [
              {
                name: "LLM Analysis",
                points: result.finalScore,
                maxPoints: 100,
                metrics: result.criteria.map((c: any) => ({
                  name: c.name,
                  value: c.weight,
                  rating: c.status,
                  points: Math.round(c.weight * result.finalScore / 100),
                })),
              },
            ],
            totalScore: result.finalScore,
          },
        };

        // Add to in-memory cache
        addScanResult(scanJobId, cacheResult);
        resultsStored++;

        console.log(`[FullScan ${scanJobId}] Added result ${resultsStored}/${hybridResults.length}: ${result.ticker} (score: ${result.finalScore})`);
      } else {
        console.log(`[FullScan ${scanJobId}] Skipped ${result.ticker}: score ${result.finalScore} below threshold ${thresholds.minScore}`);
      }

      // Update progress
      updateScanProgress(scanJobId, {
        opportunitiesFound: resultsStored,
      });
    }

    const phase3TimeMs = Date.now() - startPhase3;
    console.log(`[FullScan ${scanJobId}] Phase 3 completed in ${phase3TimeMs}ms`);

    // Mark as completed
    completeScan(scanJobId);
    console.log(`[FullScan ${scanJobId}] Full scan completed: ${resultsStored} opportunities found`);
    console.log(`[FullScan ${scanJobId}] Total time: ${(phase1TimeMs + phase2TimeMs + phase3TimeMs) / 1000}s`);
  } catch (error) {
    console.error(`[FullScan ${scanJobId}] Error during scan:`, error);
    failScan(scanJobId, error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Get persona-specific thresholds for filtering results
 */
function getPersonaThresholds(personaId: number): { minScore: number; maxScore: number } {
  const thresholds: Record<number, { minScore: number; maxScore: number }> = {
    1: { minScore: 65, maxScore: 100 }, // Warren Buffett - conservative
    2: { minScore: 60, maxScore: 100 }, // Peter Lynch - moderate
    3: { minScore: 70, maxScore: 100 }, // Benjamin Graham - very conservative
    4: { minScore: 55, maxScore: 100 }, // Cathie Wood - aggressive
    5: { minScore: 60, maxScore: 100 }, // Ray Dalio - balanced
    6: { minScore: 58, maxScore: 100 }, // Philip Fisher - growth-focused
  };

  return thresholds[personaId] || { minScore: 60, maxScore: 100 };
}
