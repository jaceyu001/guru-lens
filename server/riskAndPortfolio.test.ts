import { describe, it, expect } from "vitest";
import * as riskManager from "./services/riskManager";
import * as portfolioManager from "./services/portfolioManager";
import type { FinancialData } from "@shared/types";

describe("Risk Manager", () => {
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

  describe("Risk Assessment", () => {
    it("should calculate risk metrics", async () => {
      const result = await riskManager.assessRisk(mockFinancialData);
      expect(result).toBeDefined();
      expect(result.riskRating).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
      expect(result.volatility).toBeGreaterThanOrEqual(0);
      expect(result.beta).toBeGreaterThan(0);
      expect(result.sharpeRatio).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
    });

    it("should provide position sizing recommendations", async () => {
      const result = await riskManager.assessRisk(mockFinancialData);
      expect(result.positionSizing).toBeDefined();
      expect(result.positionSizing.recommendedSize).toBeGreaterThan(0);
      expect(result.positionSizing.recommendedSize).toBeLessThanOrEqual(100);
      expect(result.positionSizing.stopLoss).toBeDefined();
      expect(result.positionSizing.takeProfit).toBeDefined();
    });

    it("should calculate VaR and CVaR", async () => {
      const result = await riskManager.assessRisk(mockFinancialData);
      expect(result.valueAtRisk).toBeDefined();
      expect(result.conditionalVaR).toBeDefined();
      expect(result.valueAtRisk).toBeGreaterThanOrEqual(0);
      expect(result.conditionalVaR).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Portfolio Constraints", () => {
    it("should define portfolio constraints", async () => {
      const result = await riskManager.assessRisk(mockFinancialData);
      expect(result.portfolioConstraints).toBeDefined();
      expect(Array.isArray(result.portfolioConstraints)).toBe(true);
      expect(result.portfolioConstraints.length).toBeGreaterThan(0);
    });

    it("should provide hedging strategies", async () => {
      const result = await riskManager.assessRisk(mockFinancialData);
      expect(result.hedgingStrategies).toBeDefined();
      expect(Array.isArray(result.hedgingStrategies)).toBe(true);
    });
  });
});

describe("Portfolio Manager", () => {
  const mockAgentVotes = [
    { agentName: "Warren Buffett", recommendation: "BUY", confidence: 85 },
    { agentName: "Peter Lynch", recommendation: "BUY", confidence: 78 },
    { agentName: "Benjamin Graham", recommendation: "HOLD", confidence: 60 },
    { agentName: "Cathie Wood", recommendation: "BUY", confidence: 92 },
    { agentName: "Ray Dalio", recommendation: "BUY", confidence: 75 },
    { agentName: "Philip Fisher", recommendation: "BUY", confidence: 88 },
    { agentName: "Valuation Agent", recommendation: "HOLD", confidence: 70 },
    { agentName: "Sentiment Agent", recommendation: "BUY", confidence: 82 },
    { agentName: "Fundamentals Agent", recommendation: "BUY", confidence: 79 },
    { agentName: "Technicals Agent", recommendation: "SELL", confidence: 65 },
  ];

  describe("Consensus Voting", () => {
    it("should aggregate agent votes", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result).toBeDefined();
      expect(result.finalRecommendation).toMatch(/BUY|SELL|HOLD|AVOID/);
      expect(result.consensusScore).toBeGreaterThanOrEqual(0);
      expect(result.consensusScore).toBeLessThanOrEqual(100);
    });

    it("should calculate voting breakdown", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result.votingBreakdown).toBeDefined();
      expect(result.votingBreakdown.buyVotes).toBeGreaterThanOrEqual(0);
      expect(result.votingBreakdown.sellVotes).toBeGreaterThanOrEqual(0);
      expect(result.votingBreakdown.holdVotes).toBeGreaterThanOrEqual(0);
    });

    it("should identify dissenting opinions", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result.dissentingOpinions).toBeDefined();
      expect(Array.isArray(result.dissentingOpinions)).toBe(true);
    });

    it("should provide key insights", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result.keyInsights).toBeDefined();
      expect(Array.isArray(result.keyInsights)).toBe(true);
      expect(result.keyInsights.length).toBeGreaterThan(0);
    });
  });

  describe("Recommendation Strength", () => {
    it("should rate recommendation confidence", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result.recommendationStrength).toMatch(/strong|moderate|weak/i);
    });

    it("should provide action items", async () => {
      const result = await portfolioManager.generateConsensus(mockAgentVotes);
      expect(result.actionItems).toBeDefined();
      expect(Array.isArray(result.actionItems)).toBe(true);
    });
  });
});
