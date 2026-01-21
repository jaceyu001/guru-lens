import { describe, it, expect, beforeEach } from "vitest";
import { calculateEPV, calculateNormalizedNOPAT } from "./epvCalculator";
import type { FinancialData } from "../../shared/types";

describe("EPV Calculator", () => {
  let mockFinancialData: FinancialData;

  beforeEach(() => {
    mockFinancialData = {
      profile: {
        symbol: "TEST",
        companyName: "Test Company",
        sector: "Technology",
        industry: "Software",
        description: "Test company",
        marketCap: 10000,
      },
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
        changePercent: 1,
        timestamp: new Date(),
      },
      financials: [
        {
          period: "2024",
          periodType: "annual",
          fiscalYear: 2024,
          revenue: 1000,
          costOfRevenue: 600,
          grossProfit: 400,
          operatingExpenses: 200,
          operatingIncome: 200,
          netIncome: 150,
          eps: 1.5,
          ebitda: 250,
          freeCashFlow: 100,
          totalAssets: 5000,
          totalLiabilities: 2000,
          shareholderEquity: 3000,
          cashAndEquivalents: 500,
          totalDebt: 1000,
        },
        {
          period: "2023",
          periodType: "annual",
          fiscalYear: 2023,
          revenue: 900,
          costOfRevenue: 540,
          grossProfit: 360,
          operatingExpenses: 180,
          operatingIncome: 180,
          netIncome: 135,
          eps: 1.35,
          ebitda: 225,
          freeCashFlow: 90,
          totalAssets: 4500,
          totalLiabilities: 1800,
          shareholderEquity: 2700,
          cashAndEquivalents: 450,
          totalDebt: 900,
        },
        {
          period: "2022",
          periodType: "annual",
          fiscalYear: 2022,
          revenue: 800,
          costOfRevenue: 480,
          grossProfit: 320,
          operatingExpenses: 160,
          operatingIncome: 160,
          netIncome: 120,
          eps: 1.2,
          ebitda: 200,
          freeCashFlow: 80,
          totalAssets: 4000,
          totalLiabilities: 1600,
          shareholderEquity: 2400,
          cashAndEquivalents: 400,
          totalDebt: 800,
        },
      ],
      quarterlyFinancials: [
        {
          period: "Q1 2025",
          quarter: 1,
          fiscalYear: 2025,
          revenue: 260,
          netIncome: 40,
          eps: 0.4,
          operatingIncome: 52,
          freeCashFlow: 30,
          operatingCashFlow: 50,
        },
        {
          period: "Q4 2024",
          quarter: 4,
          fiscalYear: 2024,
          revenue: 250,
          netIncome: 38,
          eps: 0.38,
          operatingIncome: 50,
          freeCashFlow: 28,
          operatingCashFlow: 48,
        },
        {
          period: "Q3 2024",
          quarter: 3,
          fiscalYear: 2024,
          revenue: 245,
          netIncome: 37,
          eps: 0.37,
          operatingIncome: 49,
          freeCashFlow: 27,
          operatingCashFlow: 47,
        },
        {
          period: "Q2 2024",
          quarter: 2,
          fiscalYear: 2024,
          revenue: 245,
          netIncome: 37,
          eps: 0.37,
          operatingIncome: 49,
          freeCashFlow: 27,
          operatingCashFlow: 47,
        },
      ],
      ratios: {
        symbol: "TEST",
        peRatio: 66.67,
        pbRatio: 3.33,
        psRatio: 10,
        netMargin: 15,
        operatingMargin: 20,
        grossMargin: 40,
        roe: 5,
        roic: 6.67,
        roa: 3,
        debtToEquity: 33.33,
        currentRatio: 1.5,
        interestCoverage: 10,
        dividendYield: 0,
      },
    };
  });

  describe("calculateNormalizedNOPAT", () => {
    it("should calculate normalized NOPAT from financial data", () => {
      const result = calculateNormalizedNOPAT(mockFinancialData);

      expect(result.dataPoints).toBeGreaterThan(0);
      expect(result.nopat).toBeGreaterThan(0);
      expect(result.dataAvailability).toContain("years");
    });
  });

  describe("calculateEPV", () => {
    it("should return EPV valuation with dual scenarios", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["analyst consensus"],
          reasoning: "Based on industry growth trends",
        }
      );

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.baseCase).toBeDefined();
      expect(result.scenarios.conservative).toBeDefined();
      expect(result.valuationRange).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it("should cap growth rate at 8% (WACC - 1%)", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        15,
        {
          growthRate: 15,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(result.assumptions.marketGrowthRate).toBeLessThanOrEqual(8);
    });

    it("should include LLM growth rate info in output", () => {
      const llmInfo = {
        growthRate: 5,
        confidence: "high" as const,
        sources: ["analyst consensus", "company guidance"],
        reasoning: "Based on historical growth and market trends",
        caveats: "Assumes stable market conditions",
      };

      const result = calculateEPV(mockFinancialData, 100, 5, llmInfo);

      expect(result.llmGrowthRateInfo).toEqual(llmInfo);
    });

    it("should provide detailed assumptions", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(result.assumptions.wacc).toBe(9);
      expect(result.assumptions.normalizedNopat).toBeGreaterThan(0);
      expect(result.assumptions.taxRate).toBe(15);
      expect(result.assumptions.dataAvailability).toBeDefined();
    });

    it("should include limitations in output", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(result.limitations.length).toBeGreaterThan(0);
      expect(Array.isArray(result.limitations)).toBe(true);
    });

    it("should have valid assessment values", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      const validAssessments = ["UNDERVALUED", "FAIRLY_VALUED", "OVERVALUED", "UNABLE_TO_VALUE"];
      expect(validAssessments).toContain(result.scenarios.baseCase.assessment);
      expect(validAssessments).toContain(result.scenarios.conservative.assessment);
    });

    it("should adjust confidence based on LLM confidence", () => {
      const highConfidenceResult = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      const lowConfidenceResult = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "low",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(highConfidenceResult.confidence).toBeGreaterThan(lowConfidenceResult.confidence);
    });

    it("should calculate valuation range", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(result.valuationRange.low).toBeLessThanOrEqual(result.valuationRange.midpoint);
      expect(result.valuationRange.midpoint).toBeLessThanOrEqual(result.valuationRange.high);
    });

    it("should generate narrative summary", () => {
      const result = calculateEPV(
        mockFinancialData,
        100,
        5,
        {
          growthRate: 5,
          confidence: "high",
          sources: ["test"],
          reasoning: "test",
        }
      );

      expect(result.narrative).toBeDefined();
      expect(result.narrative.length).toBeGreaterThan(0);
    });
  });
});
