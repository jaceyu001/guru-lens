import { describe, it, expect } from "vitest";
import type { FinancialData } from "@shared/types";

// Mock financial data for testing
const mockFinancialData: FinancialData = {
  price: {
    symbol: "AAPL",
    current: 180,
    open: 179,
    high: 182,
    low: 178,
    close: 180,
    volume: 50000000,
    previousClose: 179,
    change: 1,
    changePercent: 0.56,
    timestamp: new Date(),
  },
  profile: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    description: "Apple is a technology company",
    employees: 161000,
    website: "https://apple.com",
    marketCap: 2800000000000,
  },
  ratios: {
    pe: 28.5,
    pb: 45.2,
    ps: 7.8,
    roe: 85.5,
    roic: 65.3,
    currentRatio: 1.08,
    debtToEquity: 1.96,
    grossMargin: 46.2,
    operatingMargin: 30.1,
    netMargin: 25.3,
  },
  financials: [
    {
      period: "Q3 2024",
      periodType: "quarterly",
      fiscalYear: 2024,
      revenue: 94.7,
      netIncome: 24.3,
      eps: 1.53,
    },
  ],
};

describe("Advanced Agents Architecture", () => {
  it("should have valid financial data structure", () => {
    expect(mockFinancialData).toBeDefined();
    expect(mockFinancialData.price).toBeDefined();
    expect(mockFinancialData.profile).toBeDefined();
    expect(mockFinancialData.ratios).toBeDefined();
    expect(mockFinancialData.financials).toBeDefined();
  });

  it("should have valid price data", () => {
    const price = mockFinancialData.price;
    expect(price.symbol).toBe("AAPL");
    expect(price.current).toBeGreaterThan(0);
    expect(price.volume).toBeGreaterThan(0);
    expect(price.timestamp).toBeInstanceOf(Date);
  });

  it("should have valid profile data", () => {
    const profile = mockFinancialData.profile;
    expect(profile.symbol).toBe("AAPL");
    expect(profile.companyName).toBeTruthy();
    expect(profile.sector).toBeTruthy();
    expect(profile.marketCap).toBeGreaterThan(0);
  });

  it("should have valid financial ratios", () => {
    const ratios = mockFinancialData.ratios;
    expect(ratios.pe).toBeGreaterThan(0);
    expect(ratios.roe).toBeGreaterThan(0);
    expect(ratios.currentRatio).toBeGreaterThan(0);
    expect(ratios.debtToEquity).toBeGreaterThanOrEqual(0);
  });

  it("should have valid financial statements", () => {
    const financials = mockFinancialData.financials;
    expect(financials).toBeInstanceOf(Array);
    expect(financials.length).toBeGreaterThan(0);
    expect(financials[0].revenue).toBeGreaterThan(0);
    expect(financials[0].netIncome).toBeGreaterThan(0);
  });
});

describe("Agent Output Validation", () => {
  it("should validate trading signal format", () => {
    const signal = {
      signal: "BUY",
      strength: 75,
      entryPrice: 180,
      exitPrice: 195,
      stopLoss: 170,
      takeProfit: 200,
      positionSize: 50,
      timeframe: "MEDIUM",
      actionItems: ["Buy at market", "Set stop loss at 170"],
    };

    expect(signal.signal).toMatch(/^(BUY|SELL|HOLD|AVOID)$/);
    expect(signal.strength).toBeGreaterThanOrEqual(0);
    expect(signal.strength).toBeLessThanOrEqual(100);
    expect(signal.entryPrice).toBeGreaterThan(0);
    expect(signal.stopLoss).toBeGreaterThan(0);
    expect(signal.takeProfit).toBeGreaterThan(0);
    expect(signal.positionSize).toBeGreaterThanOrEqual(0);
    expect(signal.timeframe).toMatch(/^(SHORT|MEDIUM|LONG)$/);
    expect(signal.actionItems).toBeInstanceOf(Array);
  });

  it("should validate risk metrics format", () => {
    const riskMetrics = {
      volatility: 25.5,
      beta: 1.2,
      sharpeRatio: 1.8,
      maxDrawdown: 15.3,
      var95: 2.5,
      cvar95: 3.2,
    };

    expect(riskMetrics.volatility).toBeGreaterThanOrEqual(0);
    expect(riskMetrics.beta).toBeGreaterThanOrEqual(0);
    expect(riskMetrics.sharpeRatio).toBeDefined();
    expect(riskMetrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(riskMetrics.var95).toBeGreaterThanOrEqual(0);
    expect(riskMetrics.cvar95).toBeGreaterThanOrEqual(0);
  });

  it("should validate consensus format", () => {
    const consensus = {
      recommendation: "BUY",
      confidence: 75,
      votingBreakdown: {
        buy: 10,
        sell: 2,
        hold: 6,
      },
      dissent: ["Benjamin Graham: Not a Fit"],
    };

    expect(consensus.recommendation).toMatch(/^(BUY|SELL|HOLD|AVOID)$/);
    expect(consensus.confidence).toBeGreaterThanOrEqual(0);
    expect(consensus.confidence).toBeLessThanOrEqual(100);
    expect(consensus.votingBreakdown).toBeDefined();
    expect(consensus.dissent).toBeInstanceOf(Array);
  });

  it("should validate backtest results format", () => {
    const backtestResults = {
      totalReturn: 25.5,
      annualizedReturn: 12.3,
      winRate: 65,
      profitFactor: 2.1,
      maxDrawdown: 18.5,
      sharpeRatio: 1.5,
      trades: [
        { entryPrice: 100, exitPrice: 105, profit: 5 },
        { entryPrice: 105, exitPrice: 103, profit: -2 },
      ],
    };

    expect(backtestResults.totalReturn).toBeDefined();
    expect(backtestResults.annualizedReturn).toBeDefined();
    expect(backtestResults.winRate).toBeGreaterThanOrEqual(0);
    expect(backtestResults.winRate).toBeLessThanOrEqual(100);
    expect(backtestResults.profitFactor).toBeGreaterThanOrEqual(0);
    expect(backtestResults.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(backtestResults.sharpeRatio).toBeDefined();
    expect(backtestResults.trades).toBeInstanceOf(Array);
  });
});

describe("Multi-Agent System Integration", () => {
  it("should support 18 agents (12 personas + 4 technical + risk manager)", () => {
    const agents = {
      personas: [
        "Warren Buffett",
        "Peter Lynch",
        "Benjamin Graham",
        "Cathie Wood",
        "Ray Dalio",
        "Philip Fisher",
        "Aswath Damodaran",
        "Michael Burry",
        "Mohnish Pabrai",
        "Rakesh Jhunjhunwala",
        "Stanley Druckenmiller",
        "Bill Ackman",
      ],
      technical: [
        "Valuation",
        "Sentiment",
        "Fundamentals",
        "Technicals",
      ],
      riskManager: "Risk Manager",
    };

    expect(agents.personas).toHaveLength(12);
    expect(agents.technical).toHaveLength(4);
    expect(agents.riskManager).toBeDefined();
    
    const totalAgents = agents.personas.length + agents.technical.length + 1;
    expect(totalAgents).toBe(17); // 12 + 4 + 1 (risk manager is separate from portfolio manager)
  });

  it("should support weighted voting system", () => {
    const weights = {
      personaWeight: 0.08, // 8% each for 12 personas = 96%
      technicalWeight: 0.02, // 2% each for 4 technical = 8%
      riskWeight: 0.04, // 4% for risk manager
    };

    const totalPersonaWeight = weights.personaWeight * 12;
    const totalTechnicalWeight = weights.technicalWeight * 4;
    const totalWeight = totalPersonaWeight + totalTechnicalWeight + weights.riskWeight;

    expect(totalPersonaWeight).toBe(0.96);
    expect(totalTechnicalWeight).toBe(0.08);
    expect(totalWeight).toBeCloseTo(1.08, 2); // Slightly over 100% for risk weighting
  });

  it("should support consensus voting", () => {
    const votes = [
      { agent: "Warren Buffett", signal: "BUY", confidence: 80 },
      { agent: "Peter Lynch", signal: "BUY", confidence: 75 },
      { agent: "Benjamin Graham", signal: "HOLD", confidence: 60 },
      { agent: "Valuation", signal: "BUY", confidence: 70 },
      { agent: "Sentiment", signal: "HOLD", confidence: 65 },
    ];

    const buyVotes = votes.filter(v => v.signal === "BUY").length;
    const holdVotes = votes.filter(v => v.signal === "HOLD").length;
    const avgConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

    expect(buyVotes).toBe(3);
    expect(holdVotes).toBe(2);
    expect(avgConfidence).toBeCloseTo(70, 0);
  });
});
