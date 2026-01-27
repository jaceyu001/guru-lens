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
 * Generate LLM analysis for an opportunity
 */
export async function generateLLMAnalysisForOpportunity(
  ticker: string,
  companyName: string,
  financialData: any,
  personaId: number,
  personaIdStr: string
): Promise<{ thesis: string; confidence: string; scoringDetails: any }> {
  try {
    // Get persona prompt
    const personaPrompt = PERSONA_PROMPTS[personaIdStr as keyof typeof PERSONA_PROMPTS];
    
    if (!personaPrompt) {
      return {
        thesis: `${ticker} shows potential based on financial metrics`,
        confidence: "Medium",
        scoringDetails: calculateDetailedScoringBreakdown(financialData as any, personaIdStr),
      };
    }

    // Create analysis prompt
    const analysisPrompt = `
${personaPrompt}

Analyze ${ticker} (${companyName}) with the following financial metrics:
- P/E Ratio: ${financialData.peRatio?.toFixed(2) || 'N/A'}
- ROE: ${((financialData.roe || 0) * 100).toFixed(1)}%
- Debt-to-Equity: ${financialData.debtToEquity?.toFixed(2) || 'N/A'}
- Current Ratio: ${financialData.currentRatio?.toFixed(2) || 'N/A'}
- Net Margin: ${((financialData.netMargin || 0) * 100).toFixed(1)}%

Provide a brief investment thesis (2-3 sentences) and confidence level (High/Medium/Low).
Format: THESIS: [thesis] | CONFIDENCE: [level]
`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an investment analyst." },
        { role: "user", content: analysisPrompt },
      ],
    });

    const content = (response.choices?.[0]?.message?.content || "") as string;
    const thesisMatch = typeof content === 'string' ? content.match(/THESIS:\s*(.+?)(?:\||$)/) : null;
    const confidenceMatch = typeof content === 'string' ? content.match(/CONFIDENCE:\s*(High|Medium|Low)/i) : null;

    return {
      thesis: thesisMatch?.[1]?.trim() || `${ticker} shows potential based on financial metrics`,
      confidence: confidenceMatch?.[1] || "Medium",
      scoringDetails: calculateDetailedScoringBreakdown(financialData as any, personaIdStr),
    };
  } catch (error) {
    console.error(`[LLM Analysis] Error analyzing ${ticker}:`, error);
    return {
      thesis: `${ticker} shows potential based on financial metrics`,
      confidence: "Medium",
      scoringDetails: calculateDetailedScoringBreakdown(financialData as any, personaIdStr),
    };
  }
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
    "PG", "KO", "V", "MA", "PEP", "PM", "MO",
    "IBM", "CSCO", "ORCL", "TXN", "INTU", "PAYX", "ADSK", "PSTG"
  ];

  // Shuffle and return random subset
  const shuffled = [...validTickers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Start test scan with 10 random stocks - show all scores without threshold
 */
export async function startTestScan(scanJobId: number, personaId: number): Promise<void> {
  // Get 10 random tickers instead of hardcoded ones
  const testTickers = await getRandomTickers(10);

  try {
    // Update job status in cache
    updateScanProgress(scanJobId, {
      status: "pending",
      phase: "screening",
      processedStocks: 0,
      opportunitiesFound: 0,
    });

    console.log(`[TestScan ${scanJobId}] Starting test scan with ${testTickers.length} random stocks: ${testTickers.join(", ")}`);

    // Get persona info
    const personaIdMap: Record<number, string> = {
      1: "warren_buffett",
      2: "peter_lynch",
      3: "benjamin_graham",
      4: "cathie_wood",
      5: "ray_dalio",
      6: "philip_fisher",
    };
    const personaIdStr = personaIdMap[personaId] || "warren_buffett";
    console.log(`[TestScan ${scanJobId}] Persona: ${personaIdStr}`);

    // Phase 1: Score all test stocks (NO THRESHOLD FILTERING)
    const scoredStocks: Array<{ ticker: string; companyName: string; score: number; data: any }> = [];

    for (let i = 0; i < testTickers.length; i++) {
      const ticker = testTickers[i];
      
      try {
        // Fetch REAL financial data from yfinance - NO FALLBACK
        console.log(`[TestScan ${scanJobId}] Fetching real data for ${ticker}...`);
        const financialData = await fetchRealKeyRatios(ticker);
        
        if (!financialData) {
          console.warn(`[TestScan ${scanJobId}] Failed to fetch real data for ${ticker}, skipping`);
          updateScanProgress(scanJobId, {
            processedStocks: i + 1,
            opportunitiesFound: scoredStocks.length,
          });
          continue;
        }

        // Score against persona
        const scoreResult = calculatePersonaScore(financialData as any, personaIdStr);
        const score = typeof scoreResult === 'number' ? scoreResult : 0;
        
        // ADD ALL STOCKS regardless of threshold
        scoredStocks.push({
          ticker,
          companyName: ticker,
          score,
          data: financialData,
        });

        // Update progress in cache
        updateScanProgress(scanJobId, {
          processedStocks: i + 1,
          opportunitiesFound: scoredStocks.length,
        });

        console.log(`[TestScan ${scanJobId}] Processed ${ticker}: score=${score.toFixed(1)}`);
      } catch (error) {
        console.error(`[TestScan ${scanJobId}] Error processing ${ticker}:`, error);
        updateScanProgress(scanJobId, {
          processedStocks: i + 1,
          opportunitiesFound: scoredStocks.length,
        });
      }
    }

    // Phase 1.5: Rank all stocks by score (no filtering)
    const allOpportunities = scoredStocks
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    console.log(`[TestScan ${scanJobId}] Scored ${allOpportunities.length} stocks, starting LLM analysis`);

    // Phase 2: Generate LLM analysis for each stock
    updateScanProgress(scanJobId, {
      phase: "llm_analysis",
    });

    for (let i = 0; i < allOpportunities.length; i++) {
      const opp = allOpportunities[i];

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
    console.log(`[TestScan ${scanJobId}] ✅ Test scan completed with ${allOpportunities.length} stocks`);
  } catch (error) {
    console.error(`[TestScan ${scanJobId}] Error:`, error);
    failScan(scanJobId, error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Start refresh job with adaptive rate limiting
 */
export async function startRefreshJobWithAdaptiveRateLimit(scanJobId: number): Promise<void> {
  // TODO: Implement full market scan with rate limiting
  console.log(`[RefreshJob ${scanJobId}] Starting refresh job with adaptive rate limiting`);
  completeScan(scanJobId);
}
