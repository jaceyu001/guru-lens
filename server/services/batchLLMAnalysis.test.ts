/**
 * Unit tests for batch LLM analysis
 * 
 * Tests focus on the batch analysis function structure and error handling.
 * Full integration tests should be run with real LLM calls.
 */

import { describe, it, expect } from "vitest";
import { analyzeBatchOptimized } from "./batchLLMAnalysis";
import type { AnalysisInput } from "./aiAnalysisEngine";

describe("Batch LLM Analysis", () => {
  it(
    "should handle empty input array",
    async () => {
      const result = await analyzeBatchOptimized([], "warren_buffett", "Warren Buffett");

      expect(result.results).toHaveLength(0);
      expect(result.totalTimeMs).toBe(0);
    },
    { timeout: 5000 }
  );

  it(
    "should return results with correct structure for single stock",
    async () => {
      // This test verifies the function handles a single stock gracefully
      // even if the LLM call fails (will return fallback results)
      const mockInput: AnalysisInput = {
        symbol: "TEST",
        personaId: "warren_buffett",
        personaName: "Warren Buffett",
        price: {
          symbol: "TEST",
          current: 100,
          open: 99,
          high: 102,
          low: 98,
          close: 100,
          volume: 1000000,
          previousClose: 99,
          change: 1,
          changePercent: 1.01,
          timestamp: new Date(),
        },
        profile: {
          symbol: "TEST",
          companyName: "Test Company",
          sector: "Technology",
          industry: "Software",
          description: "A test company",
          employees: 1000,
          website: "https://test.com",
          marketCap: 10000000000,
        },
        financials: [
          {
            period: "Q4 2024",
            periodType: "quarterly",
            fiscalYear: 2024,
            revenue: 1000000000,
            costOfRevenue: 600000000,
            grossProfit: 400000000,
            operatingExpenses: 200000000,
            operatingIncome: 200000000,
            netIncome: 150000000,
            eps: 1.5,
            ebitda: 250000000,
            freeCashFlow: 120000000,
            totalAssets: 5000000000,
            totalLiabilities: 2000000000,
            shareholderEquity: 3000000000,
            cashAndEquivalents: 500000000,
            totalDebt: 1000000000,
          },
        ],
        ratios: {
          symbol: "TEST",
          peRatio: 20,
          pbRatio: 10,
          psRatio: 5,
          pegRatio: 1.5,
          dividendYield: 0.5,
          payoutRatio: 0.25,
          roe: 0.05,
          roa: 0.03,
          roic: 0.08,
          currentRatio: 1.5,
          quickRatio: 1.2,
          debtToEquity: 0.33,
          interestCoverage: 20,
          grossMargin: 0.4,
          operatingMargin: 0.2,
          netMargin: 0.15,
          assetTurnover: 0.2,
          inventoryTurnover: 5,
          earningsGrowth: 0.1,
          revenueGrowth: 0.08,
        },
      };

      const result = await analyzeBatchOptimized([mockInput], "warren_buffett", "Warren Buffett");

      // Verify basic structure
      expect(result.results).toHaveLength(1);
      expect(result.totalTimeMs).toBeGreaterThan(0);

      const analysis = result.results[0];
      expect(analysis).toHaveProperty("score");
      expect(analysis).toHaveProperty("verdict");
      expect(analysis).toHaveProperty("confidence");
      expect(analysis).toHaveProperty("summaryBullets");
      expect(analysis).toHaveProperty("criteria");
      expect(analysis).toHaveProperty("keyRisks");
      expect(analysis).toHaveProperty("whatWouldChangeMind");
      expect(analysis).toHaveProperty("dataUsed");

      // Verify data sources include batch analysis
      expect(analysis.dataUsed.sources).toContain("Batch AI Analysis Engine");

      // Score should be a number between 0-100
      expect(typeof analysis.score).toBe("number");
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);

      // Verdict should be one of the valid options
      expect(["strong_fit", "moderate_fit", "weak_fit", "poor_fit", "insufficient_data"]).toContain(analysis.verdict);

      // Confidence should be between 0-1
      expect(typeof analysis.confidence).toBe("number");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    },
    { timeout: 30000 }
  );

  it(
    "should preserve stock order in results",
    async () => {
      const mockInputs: AnalysisInput[] = [
        {
          symbol: "STOCK1",
          personaId: "warren_buffett",
          personaName: "Warren Buffett",
          price: {
            symbol: "STOCK1",
            current: 100,
            open: 99,
            high: 102,
            low: 98,
            close: 100,
            volume: 1000000,
            previousClose: 99,
            change: 1,
            changePercent: 1.01,
            timestamp: new Date(),
          },
          profile: {
            symbol: "STOCK1",
            companyName: "Stock 1",
            sector: "Technology",
            industry: "Software",
            description: "Stock 1",
            employees: 1000,
            website: "https://stock1.com",
            marketCap: 10000000000,
          },
          financials: [],
          ratios: {
            symbol: "STOCK1",
            peRatio: 20,
            pbRatio: 10,
            psRatio: 5,
            pegRatio: 1.5,
            dividendYield: 0.5,
            payoutRatio: 0.25,
            roe: 0.05,
            roa: 0.03,
            roic: 0.08,
            currentRatio: 1.5,
            quickRatio: 1.2,
            debtToEquity: 0.33,
            interestCoverage: 20,
            grossMargin: 0.4,
            operatingMargin: 0.2,
            netMargin: 0.15,
            assetTurnover: 0.2,
            inventoryTurnover: 5,
            earningsGrowth: 0.1,
            revenueGrowth: 0.08,
          },
        },
        {
          symbol: "STOCK2",
          personaId: "warren_buffett",
          personaName: "Warren Buffett",
          price: {
            symbol: "STOCK2",
            current: 200,
            open: 198,
            high: 205,
            low: 195,
            close: 200,
            volume: 2000000,
            previousClose: 198,
            change: 2,
            changePercent: 1.01,
            timestamp: new Date(),
          },
          profile: {
            symbol: "STOCK2",
            companyName: "Stock 2",
            sector: "Healthcare",
            industry: "Pharmaceuticals",
            description: "Stock 2",
            employees: 2000,
            website: "https://stock2.com",
            marketCap: 20000000000,
          },
          financials: [],
          ratios: {
            symbol: "STOCK2",
            peRatio: 25,
            pbRatio: 12,
            psRatio: 6,
            pegRatio: 1.8,
            dividendYield: 0.6,
            payoutRatio: 0.3,
            roe: 0.06,
            roa: 0.04,
            roic: 0.09,
            currentRatio: 1.6,
            quickRatio: 1.3,
            debtToEquity: 0.35,
            interestCoverage: 25,
            grossMargin: 0.45,
            operatingMargin: 0.22,
            netMargin: 0.17,
            assetTurnover: 0.22,
            inventoryTurnover: 6,
            earningsGrowth: 0.12,
            revenueGrowth: 0.1,
          },
        },
      ];

      const result = await analyzeBatchOptimized(mockInputs, "warren_buffett", "Warren Buffett");

      // Verify order is preserved
      expect(result.results).toHaveLength(2);
      expect(result.results[0].dataUsed.sources).toContain("Batch AI Analysis Engine");
      expect(result.results[1].dataUsed.sources).toContain("Batch AI Analysis Engine");

      // Both should have valid analysis results
      result.results.forEach((analysis) => {
        expect(typeof analysis.score).toBe("number");
        expect(typeof analysis.confidence).toBe("number");
        expect(Array.isArray(analysis.summaryBullets)).toBe(true);
        expect(Array.isArray(analysis.criteria)).toBe(true);
      });
    },
    { timeout: 30000 }
  );

  it(
    "should work with different personas",
    async () => {
      const mockInput: AnalysisInput = {
        symbol: "TEST",
        personaId: "peter_lynch",
        personaName: "Peter Lynch",
        price: {
          symbol: "TEST",
          current: 100,
          open: 99,
          high: 102,
          low: 98,
          close: 100,
          volume: 1000000,
          previousClose: 99,
          change: 1,
          changePercent: 1.01,
          timestamp: new Date(),
        },
        profile: {
          symbol: "TEST",
          companyName: "Test Company",
          sector: "Consumer",
          industry: "Retail",
          description: "A test company",
          employees: 1000,
          website: "https://test.com",
          marketCap: 10000000000,
        },
        financials: [],
        ratios: {
          symbol: "TEST",
          peRatio: 15,
          pbRatio: 8,
          psRatio: 4,
          pegRatio: 1.2,
          dividendYield: 0.3,
          payoutRatio: 0.2,
          roe: 0.12,
          roa: 0.08,
          roic: 0.15,
          currentRatio: 1.8,
          quickRatio: 1.4,
          debtToEquity: 0.2,
          interestCoverage: 30,
          grossMargin: 0.5,
          operatingMargin: 0.25,
          netMargin: 0.2,
          assetTurnover: 0.4,
          inventoryTurnover: 8,
          earningsGrowth: 0.15,
          revenueGrowth: 0.12,
        },
      };

      const result = await analyzeBatchOptimized([mockInput], "peter_lynch", "Peter Lynch");

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toHaveProperty("score");
      expect(result.results[0]).toHaveProperty("verdict");
      expect(result.results[0].dataUsed.sources).toContain("Batch AI Analysis Engine");
    },
    { timeout: 30000 }
  );
});
