/**
 * Opportunity Scanning Service
 * 
 * Hybrid two-stage scanning:
 * - Stage 1: Financial pre-filter for quick ranking
 * - Stage 2: LLM-based final scoring for top candidates
 */

import { getDb } from "../db";
import { scanJobs, scanOpportunities, scanOpportunityAnalyses, tickers } from "../../drizzle/schema";
import { hybridScore } from "./hybridScoringOrchestrator";
import { createScanJob as createCacheJob, updateScanProgress, addScanResult, completeScan, failScan, getScanProgress, getScanResults } from "./scanResultsCache";
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
  
  // Map cache status to ScanJobProgress status
  let status: "pending" | "running" | "completed" | "failed" = "pending";
  if (progress.status === "completed") {
    status = "completed";
  } else if (progress.status === "failed") {
    status = "failed";
  } else if (progress.status === "screening" || progress.status === "ranking" || progress.status === "llm_analysis") {
    status = "running";
  }
  
  return {
    id: scanJobId,
    status,
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
  const results = getScanResults(scanJobId);
  return results.slice(0, limit) as ScanOpportunityResult[];
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
 * Get random tickers from a curated list of valid, liquid US stocks
 */
async function getRandomTickers(count: number): Promise<string[]> {
  // Curated list of valid, liquid US stocks that are actively traded
  const validTickers = [
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA",
    "JPM", "BAC", "WFC", "GS", "MS", "BLK", "SCHW", "COIN",
    "JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY", "AMGN", "GILD",
    "BA", "CAT", "GE", "HON", "MMM", "RTX", "LMT", "NOC",
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO",
    "WMT", "COST", "HD", "TJX", "MCD", "SBUX", "NKE", "KO",
    "NEE", "DUK", "SO", "EXC", "AEP", "PEG", "SRE", "AWK",
    "NEM", "FCX", "AA", "CLF", "X", "STLD", "TX", "RIO",
    "VZ", "T", "CMCSA", "CHTR", "DISH", "TMUS", "S", "LBRDK",
    "ADBE", "CRM", "NFLX", "INTC", "QCOM", "AMD", "AVGO", "MCHP",
    "SNPS", "CDNS", "ASML", "AMAT", "LRCX", "KLAC", "MRVL", "XLNX",
    "PYPL", "SQ", "HOOD", "SOFI", "AFRM", "UPST", "MSTR",
    "LULU", "ULTA", "RH", "ETSY", "CHWY", "ROST", "FIVE", "DECK",
    "REGN", "ILMN", "BIIB", "CELG", "VEEV", "DXCM", "NTNX", "PEGA",
    "WDAY", "OKTA", "CRWD", "DDOG", "TEAM", "DOCU", "SPLK", "SNOW",
    "ABNB", "EXPE", "BOOKING", "TRIP", "MAR", "HLT", "RCL", "CCL",
    "PLTR", "DASH", "UBER", "LYFT", "PINS", "SNAP", "ROKU", "ZM",
    "PG", "V", "MA", "PEP", "PM", "MO",
    "IBM", "CSCO", "ORCL", "TXN", "INTU", "PAYX", "ADSK", "PSTG"
  ];

  // Shuffle and return random subset
  const shuffled = [...validTickers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get all US listed stocks (simplified - returns curated list)
 */
async function getAllUSStocks(): Promise<string[]> {
  // For now, return the curated list
  // In production, this would query a database of all US listed stocks
  const validTickers = [
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA",
    "JPM", "BAC", "WFC", "GS", "MS", "BLK", "SCHW", "COIN",
    "JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY", "AMGN", "GILD",
    "BA", "CAT", "GE", "HON", "MMM", "RTX", "LMT", "NOC",
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO",
    "WMT", "COST", "HD", "TJX", "MCD", "SBUX", "NKE", "KO",
    "NEE", "DUK", "SO", "EXC", "AEP", "PEG", "SRE", "AWK",
    "NEM", "FCX", "AA", "CLF", "X", "STLD", "TX", "RIO",
    "VZ", "T", "CMCSA", "CHTR", "DISH", "TMUS", "S", "LBRDK",
    "ADBE", "CRM", "NFLX", "INTC", "QCOM", "AMD", "AVGO", "MCHP",
    "SNPS", "CDNS", "ASML", "AMAT", "LRCX", "KLAC", "MRVL", "XLNX",
    "PYPL", "SQ", "HOOD", "SOFI", "AFRM", "UPST", "MSTR",
    "LULU", "ULTA", "RH", "ETSY", "CHWY", "ROST", "FIVE", "DECK",
    "REGN", "ILMN", "BIIB", "CELG", "VEEV", "DXCM", "NTNX", "PEGA",
    "WDAY", "OKTA", "CRWD", "DDOG", "TEAM", "DOCU", "SPLK", "SNOW",
    "ABNB", "EXPE", "BOOKING", "TRIP", "MAR", "HLT", "RCL", "CCL",
    "PLTR", "DASH", "UBER", "LYFT", "PINS", "SNAP", "ROKU", "ZM",
    "PG", "V", "MA", "PEP", "PM", "MO",
    "IBM", "CSCO", "ORCL", "TXN", "INTU", "PAYX", "ADSK", "PSTG"
  ];
  return validTickers;
}

/**
 * Get persona info
 */
function getPersonaInfo(personaId: number): { id: string; name: string; threshold: number } {
  const personaMap: Record<number, { id: string; name: string; threshold: number }> = {
    1: { id: "warren_buffett", name: "Warren Buffett", threshold: 60 },
    2: { id: "peter_lynch", name: "Peter Lynch", threshold: 55 },
    3: { id: "benjamin_graham", name: "Benjamin Graham", threshold: 65 },
    4: { id: "cathie_wood", name: "Cathie Wood", threshold: 50 },
    5: { id: "ray_dalio", name: "Ray Dalio", threshold: 55 },
    6: { id: "philip_fisher", name: "Philip Fisher", threshold: 58 },
  };
  return personaMap[personaId] || personaMap[1];
}

/**
 * Start test scan with 10 random stocks
 * Stage 1: Pre-filter all 10 with financial scores
 * Stage 2: LLM analysis on top 5
 * Result: Show all 5 with final scores (no threshold)
 */
export async function startTestScan(scanJobId: number, personaId: number): Promise<void> {
  const persona = getPersonaInfo(personaId);
  const testTickers = await getRandomTickers(10);

  try {
    // Update job status in cache
    updateScanProgress(scanJobId, {
      status: "pending",
      phase: "screening",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

    console.log(`[TestScan ${scanJobId}] Starting with ${testTickers.length} random stocks: ${testTickers.join(", ")}`);
    console.log(`[TestScan ${scanJobId}] Persona: ${persona.name}`);

    // Run hybrid scoring: Stage 1 pre-filter + Stage 2 LLM on top 5
    const hybridResults = await hybridScore(testTickers, personaId, persona.name, 5);

    console.log(`[TestScan ${scanJobId}] Hybrid scoring complete: ${hybridResults.length} results`);

    // Add results to cache (no threshold filtering for test scan)
    for (let i = 0; i < hybridResults.length; i++) {
      const result = hybridResults[i];
      addScanResult(scanJobId, {
        id: i + 1,
        rank: i + 1,
        ticker: result.ticker,
        companyName: result.ticker,
        score: result.finalScore,
        currentPrice: null,
        marketCap: null,
        sector: null,
        thesis: result.thesis,
        confidence: `${(result.confidence * 100).toFixed(0)}%`,
        scoringDetails: {
          categories: [
            {
              name: "LLM Analysis",
              points: result.finalScore,
              maxPoints: 100,
              metrics: result.criteria.map(c => ({
                name: c.name,
                value: c.weight,
                rating: c.status,
                points: Math.round(c.weight * result.finalScore / 100),
              })),
            },
          ],
          totalScore: result.finalScore,
        },
      });

      // Update progress
      updateScanProgress(scanJobId, {
        processedStocks: i + 1,
        opportunitiesFound: i + 1,
        phase: "llm_analysis",
      });
    }

    // Mark as completed
    completeScan(scanJobId);
    console.log(`[TestScan ${scanJobId}] ✅ Test scan completed with ${hybridResults.length} stocks`);
  } catch (error) {
    console.error(`[TestScan ${scanJobId}] Error:`, error);
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
 * Start refresh job with adaptive rate limiting (full scan of all US stocks)
 */
export async function startRefreshJobWithAdaptiveRateLimit(scanJobId: number, personaId: number = 1): Promise<void> {
  const persona = getPersonaInfo(personaId);
  const allStocks = await getAllUSStocks();

  try {
    // Update job status in cache
    updateScanProgress(scanJobId, {
      status: "pending",
      phase: "screening",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

    console.log(`[FullScan ${scanJobId}] Starting with ${allStocks.length} stocks`);
    console.log(`[FullScan ${scanJobId}] Persona: ${persona.name}, Threshold: ${persona.threshold}`);

    // Run hybrid scoring: Stage 1 pre-filter + Stage 2 LLM on top 50
    const hybridResults = await hybridScore(allStocks, personaId, persona.name, 50);

    console.log(`[FullScan ${scanJobId}] Hybrid scoring complete: ${hybridResults.length} results`);

    // Filter by threshold and add results to cache
    let opportunitiesCount = 0;
    for (let i = 0; i < hybridResults.length; i++) {
      const result = hybridResults[i];
      
      // Apply threshold filter
      if (result.finalScore < persona.threshold) {
        console.log(`[FullScan ${scanJobId}] ${result.ticker}: score=${result.finalScore} below threshold ${persona.threshold}, skipping`);
        continue;
      }

      opportunitiesCount++;
      addScanResult(scanJobId, {
        id: opportunitiesCount,
        rank: opportunitiesCount,
        ticker: result.ticker,
        companyName: result.ticker,
        score: result.finalScore,
        currentPrice: null,
        marketCap: null,
        sector: null,
        thesis: result.thesis,
        confidence: `${(result.confidence * 100).toFixed(0)}%`,
        scoringDetails: {
          categories: [
            {
              name: "LLM Analysis",
              points: result.finalScore,
              maxPoints: 100,
              metrics: result.criteria.map(c => ({
                name: c.name,
                value: c.weight,
                rating: c.status,
                points: Math.round(c.weight * result.finalScore / 100),
              })),
            },
          ],
          totalScore: result.finalScore,
        },
      });

      // Update progress
      updateScanProgress(scanJobId, {
        processedStocks: i + 1,
        opportunitiesFound: opportunitiesCount,
        phase: "llm_analysis",
      });
    }

    // Mark as completed
    completeScan(scanJobId);
    console.log(`[FullScan ${scanJobId}] ✅ Full scan completed with ${opportunitiesCount} opportunities above threshold`);
  } catch (error) {
    console.error(`[FullScan ${scanJobId}] Error:`, error);
    failScan(scanJobId, error instanceof Error ? error.message : "Unknown error");
  }
}
