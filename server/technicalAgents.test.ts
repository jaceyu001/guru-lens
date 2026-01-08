import { describe, it, expect } from "vitest";
import * as technicalAgents from "./services/technicalAgents";
import type { FinancialData } from "@shared/types";

describe("Technical Agents", () => {
  const mockFinancialData: FinancialData = {
    symbol: "AAPL",
    price: {
      symbol: "AAPL",
      current: 180,
      open: 175,
      high: 182,
      low: 174,
      close: 180,
      volume: 50000000,
      previousClose: 178,
      change: 2,
      changePercent: 1.12,
      timestamp: new Date(),
    },
    profile: {
      symbol: "AAPL",
      companyName: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      description: "Apple is a technology company",
      employees: 161000,
      website: "https://www.apple.com",
      marketCap: 2800000000000,
    },
    financials: [
      {
        period: "Q3 2024",
        periodType: "quarterly",
        fiscalYear: 2024,
        revenue: 93000000000,
        costOfRevenue: 55000000000,
        grossProfit: 38000000000,
        operatingExpenses: 15000000000,
        operatingIncome: 23000000000,
        netIncome: 20000000000,
        eps: 1.27,
        ebitda: 28000000000,
        freeCashFlow: 18000000000,
        totalAssets: 350000000000,
        totalLiabilities: 120000000000,
        shareholderEquity: 230000000000,
        cashAndEquivalents: 40000000000,
        totalDebt: 100000000000,
      },
    ],
    ratios: {
      symbol: "AAPL",
      peRatio: 30.5,
      pbRatio: 48.3,
      psRatio: 7.2,
      pegRatio: 1.8,
      dividendYield: 0.4,
      payoutRatio: 0.15,
      roe: 0.087,
      roa: 0.057,
      roic: 0.095,
      currentRatio: 1.1,
      quickRatio: 0.9,
      debtToEquity: 0.43,
      interestCoverage: 25,
      grossMargin: 0.408,
      operatingMargin: 0.247,
      netMargin: 0.215,
      assetTurnover: 0.266,
      inventoryTurnover: 40,
    },
  };

  describe("Valuation Agent", () => {
    it("should analyze valuation metrics", async () => {
      const result = await technicalAgents.analyzeValuation(mockFinancialData);
      expect(result).toBeDefined();
      expect(result.recommendation).toMatch(/BUY|SELL|HOLD/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.intrinsicValue).toBeGreaterThan(0);
      expect(result.keyMetrics).toBeDefined();
    });

    it("should provide reasoning for valuation", async () => {
      const result = await technicalAgents.analyzeValuation(mockFinancialData);
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe("Sentiment Agent", () => {
    it("should analyze market sentiment", async () => {
      const result = await technicalAgents.analyzeSentiment(mockFinancialData);
      expect(result).toBeDefined();
      expect(result.recommendation).toMatch(/BUY|SELL|HOLD/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.sentimentScore).toBeGreaterThanOrEqual(-1);
      expect(result.sentimentScore).toBeLessThanOrEqual(1);
    });

    it("should provide sentiment breakdown", async () => {
      const result = await technicalAgents.analyzeSentiment(mockFinancialData);
      expect(result.sentimentBreakdown).toBeDefined();
      expect(result.sentimentBreakdown.news).toBeDefined();
      expect(result.sentimentBreakdown.social).toBeDefined();
      expect(result.sentimentBreakdown.analyst).toBeDefined();
    });
  });

  describe("Fundamentals Agent", () => {
    it("should analyze financial fundamentals", async () => {
      const result = await technicalAgents.analyzeFundamentals(mockFinancialData);
      expect(result).toBeDefined();
      expect(result.recommendation).toMatch(/BUY|SELL|HOLD/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.earningsQuality).toBeDefined();
      expect(result.growthTrend).toBeDefined();
    });

    it("should evaluate earnings quality", async () => {
      const result = await technicalAgents.analyzeFundamentals(mockFinancialData);
      expect(result.earningsQuality).toMatch(/high|medium|low/i);
    });
  });

  describe("Technicals Agent", () => {
    it("should analyze technical indicators", async () => {
      const result = await technicalAgents.analyzeTechnicals(mockFinancialData);
      expect(result).toBeDefined();
      expect(result.recommendation).toMatch(/BUY|SELL|HOLD/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.indicators).toBeDefined();
    });

    it("should provide technical signals", async () => {
      const result = await technicalAgents.analyzeTechnicals(mockFinancialData);
      expect(result.signals).toBeDefined();
      expect(Array.isArray(result.signals)).toBe(true);
    });
  });
});
