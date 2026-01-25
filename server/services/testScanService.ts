/**
 * Test Scan Service
 * 
 * Provides a test mode for scanning 10 stocks to verify the entire pipeline
 * before scaling to 5,500 stocks
 */

import { getDb } from "../db";
import { scanJobs, scanOpportunities, scanOpportunityAnalyses, tickers } from "../../drizzle/schema";
import { calculatePersonaScore, getPersonaMinThreshold } from "./personaScoringEngine";
import { generateLLMAnalysisForOpportunity } from "./opportunityScanningService";
import { getStockDataBatch } from "./realFinancialData";
import { eq } from "drizzle-orm";

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

/**
 * Test scan with 10 stocks to verify the entire pipeline
 * Phase 1: Financial screening of 10 stocks
 * Phase 1.5: Ranking and filtering to top 5
 * Phase 2: LLM analysis for top 5
 */
export async function startTestScan(
  scanJobId: number,
  personaId: number
): Promise<void> {
  const database = await ensureDb();

  // Test tickers - diverse sectors, well-known stocks
  const testTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JNJ", "V", "WMT", "KO", "PG"];

  try {
    // Update job status
    await database
      .update(scanJobs)
      .set({
        status: "running",
        phase: "data_collection",
        startedAt: new Date(),
      })
      .where(eq(scanJobs.id, scanJobId));

    console.log(`[TestScan] Starting test scan with ${testTickers.length} stocks for persona ${personaId}`);

    // Phase 1: Financial Screening
    console.log(`[TestScan] Phase 1: Financial Screening`);
    const financialDataCache = new Map<string, any>();
    let processedCount = 0;

    // Fetch data in batches of 5 for testing
    for (let i = 0; i < testTickers.length; i += 5) {
      const batch = testTickers.slice(i, i + 5);
      console.log(`[TestScan] Fetching batch: ${batch.join(", ")}`);

      try {
        const batchData = await getStockDataBatch(batch);
        
        for (const ticker of batch) {
          if (batchData[ticker]) {
            financialDataCache.set(ticker, batchData[ticker]);
            processedCount++;
          }
        }

        // Update progress
        await database
          .update(scanJobs)
          .set({
            processedStocks: processedCount,
          })
          .where(eq(scanJobs.id, scanJobId));
      } catch (error) {
        console.error(`[TestScan] Error fetching batch:`, error);
      }
    }

    console.log(`[TestScan] Phase 1 complete: Fetched ${processedCount} stocks`);

    // Phase 1.5: Ranking & Filtering (keep top 5)
    console.log(`[TestScan] Phase 1.5: Ranking & Filtering to top 5`);
    const scoredOpportunities: any[] = [];

    for (const [ticker, financialData] of Array.from(financialDataCache.entries())) {
      // Get ticker info
      const tickerRecord = await database
        .select({ id: tickers.id, companyName: tickers.companyName, sector: tickers.sector })
        .from(tickers)
        .where(eq(tickers.symbol, ticker))
        .limit(1);

      if (!tickerRecord || !tickerRecord[0]) {
        console.warn(`[TestScan] Ticker not found in database: ${ticker}`);
        continue;
      }

      // Calculate score - need to convert personaId number to string
      const personaIdMap: Record<number, string> = {
        1: "warren_buffett",
        2: "peter_lynch",
        3: "benjamin_graham",
        4: "cathie_wood",
        5: "ray_dalio",
        6: "philip_fisher",
      };
      const personaIdStr = personaIdMap[personaId] || "warren_buffett";
      const score = calculatePersonaScore(financialData as any, personaIdStr) ?? 0;

      // For testing, lower the threshold to 40 (normally 60+)
      const testThreshold = 40;

      if (score >= testThreshold) {
        scoredOpportunities.push({
          tickerId: tickerRecord[0].id,
          ticker,
          companyName: tickerRecord[0].companyName,
          sector: tickerRecord[0].sector,
          score,
          financialData,
        });
      }
    }

    // Sort by score and keep top 5
    scoredOpportunities.sort((a, b) => b.score - a.score);
    const topOpportunities = scoredOpportunities.slice(0, 5);

    console.log(`[TestScan] Phase 1.5 complete: Selected top 5 from ${scoredOpportunities.length} qualified`);
    console.log(`[TestScan] Top opportunities:`, topOpportunities.map(o => `${o.ticker}(${o.score.toFixed(0)})`).join(", "));

    // Store opportunities in database
    for (let rank = 0; rank < topOpportunities.length; rank++) {
      const opp = topOpportunities[rank];
      
      await database
        .insert(scanOpportunities)
        .values({
          scanJobId,
          tickerId: opp.tickerId,
          personaId,
          rank: rank + 1,
          score: Math.round(opp.score),
          metricsJson: opp.financialData,
          currentPrice: opp.financialData.currentPrice ? String(opp.financialData.currentPrice) : null,
          marketCap: opp.financialData.marketCap ? String(Math.round(opp.financialData.marketCap)) : null,
          sector: opp.sector,
        });

      console.log(`[TestScan] Stored opportunity: ${opp.ticker} (rank ${rank + 1})`);
    }

    // Phase 2: LLM Analysis
    console.log(`[TestScan] Phase 2: LLM Analysis for top 5 opportunities`);

    await database
      .update(scanJobs)
      .set({
        phase: "llm_analysis",
      })
      .where(eq(scanJobs.id, scanJobId));

    let llmAnalysesCompleted = 0;
    for (const opp of topOpportunities) {
      try {
        // Get the stored opportunity ID
        const storedOppList = await database
          .select({ id: scanOpportunities.id, tickerId: scanOpportunities.tickerId })
          .from(scanOpportunities)
          .where(eq(scanOpportunities.scanJobId, scanJobId));

        const storedOpp = storedOppList.find((o) => o.tickerId === opp.tickerId);

        if (storedOpp) {
          await generateLLMAnalysisForOpportunity(
            storedOpp.id,
            personaId,
            opp.ticker,
            opp.companyName,
            opp.financialData
          );

          llmAnalysesCompleted++;

          // Update progress
          await database
            .update(scanJobs)
            .set({
              llmAnalysesCompleted,
            })
            .where(eq(scanJobs.id, scanJobId));

          console.log(`[TestScan] Generated LLM analysis for ${opp.ticker} (${llmAnalysesCompleted}/5)`);
        }
      } catch (error) {
        console.error(`[TestScan] Error generating LLM analysis for ${opp.ticker}:`, error);
      }
    }

    console.log(`[TestScan] Phase 2 complete: Generated ${llmAnalysesCompleted} analyses`);

    // Mark as completed
    const endTime = new Date();
    await database
      .update(scanJobs)
      .set({
        status: "completed",
        phase: "aggregation",
        completedAt: endTime,
      })
      .where(eq(scanJobs.id, scanJobId));

    console.log(`[TestScan] Test scan completed successfully!`);
  } catch (error) {
    console.error(`[TestScan] Test scan failed:`, error);
    await database
      .update(scanJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(scanJobs.id, scanJobId));
  }
}
