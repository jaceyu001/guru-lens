import { describe, it, expect } from "vitest";
import { analyzeValuation } from "./valuationAgent";
import type { FinancialData } from "../../shared/types";

// Mock financial data for testing
const createMockFinancialData = (overrides?: Partial<FinancialData>): FinancialData => ({
  ticker: "TEST",
  currentPrice: 100,
  sharesOutstanding: 1000, // millions
  financials: [
    {
      revenue: 50000, // millions
      netIncome: 10000,
      operatingIncome: 12000,
      grossProfit: 25000,
      eps: 10,
      fcf: 8000,
    },
  ],
  ratios: {
    pe: 10,
    pb: 2,
    ps: 5,
    roe: 50,
    roic: 25,
    debtToEquity: 0.5,
    currentRatio: 1.5,
    interestCoverage: 5,
    fcfMargin: 16,
    netMargin: 20,
    operatingMargin: 24,
    grossMargin: 50,
  },
  growth: {
    revenueGrowth: 10,
    earningsGrowth: 15,
    fcfGrowth: 12,
  },
  dataQualityFlags: {
    peAnomalous: false,
    pbAnomalous: false,
    psAnomalous: false,
    roeAnomalous: false,
    roicZero: false,
    debtToEquityAnomalous: false,
    currentRatioAnomalous: false,
    interestCoverageZero: false,
    fcfMarginAnomalous: false,
    netMarginAnomalous: false,
  },
  ...overrides,
});

describe("valuationAgent", () => {
  describe("analyzeValuation", () => {
    it("should analyze valuation correctly", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

      expect(result).toBeDefined();
      expect(result.methods).toBeDefined();
      expect(Array.isArray(result.methods)).toBe(true);
    });

    describe("Valuation Methods", () => {
      it("should include multiple valuation methods", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.methods.length).toBeGreaterThan(0);
      });

      it("should have method names", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        result.methods.forEach((method) => {
          expect(method.name).toBeDefined();
          expect(typeof method.name).toBe("string");
        });
      });

      it("should have assessment for each method", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        result.methods.forEach((method) => {
          expect(method.assessment).toBeDefined();
        });
      });
    });

    describe("Consensus Valuation", () => {
      it("should calculate consensus valuation", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.consensusValuation).toBeDefined();
        expect(result.consensusValuation.intrinsicValue).toBeDefined();
        expect(typeof result.consensusValuation.intrinsicValue).toBe("number");
      });

      it("should have valuation assessment", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.consensusValuation.assessment).toBeDefined();
        expect(["OVERVALUED", "UNDERVALUED", "FAIRLY_VALUED"]).toContain(
          result.consensusValuation.assessment
        );
      });

      it("should calculate upside/downside", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.consensusValuation.upside).toBeDefined();
        expect(typeof result.consensusValuation.upside).toBe("number");
      });
    });

    describe("Method Agreement", () => {
      it("should calculate method agreement score", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.methodAgreement).toBeDefined();
        expect(result.methodAgreement.score).toBeGreaterThanOrEqual(0);
        expect(result.methodAgreement.score).toBeLessThanOrEqual(100);
      });

      it("should have assessment for method agreement", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.methodAgreement.assessment).toBeDefined();
        expect(["STRONG", "MODERATE", "WEAK", "DIVERGENT"]).toContain(
          result.methodAgreement.assessment
        );
      });
    });

    describe("Margin of Safety", () => {
      it("should calculate margin of safety", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.marginOfSafety).toBeDefined();
        expect(result.marginOfSafety.percentage).toBeDefined();
        expect(typeof result.marginOfSafety.percentage).toBe("number");
      });

      it("should have assessment for margin of safety", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.marginOfSafety.assessment).toBeDefined();
        expect(["High", "Moderate", "Low", "Negative"]).toContain(
          result.marginOfSafety.assessment
        );
      });
    });

    describe("Confidence Scoring", () => {
      it("should have confidence score for valuation", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.confidence).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      });

      it("should have lower confidence for data with anomalies", async () => {
        const data = createMockFinancialData({
          dataQualityFlags: {
            ...createMockFinancialData().dataQualityFlags!,
            peAnomalous: true,
            pbAnomalous: true,
          },
        });

        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);
        expect(result.confidence).toBeLessThan(100);
      });
    });

    describe("Data Quality Warnings", () => {
      it("should include data quality warnings array", async () => {
        const data = createMockFinancialData({
          dataQualityFlags: {
            ...createMockFinancialData().dataQualityFlags!,
            peAnomalous: true,
          },
        });

        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);
        expect(result.dataQualityWarnings).toBeDefined();
        expect(Array.isArray(result.dataQualityWarnings)).toBe(true);
      });

      it("should have no warnings for clean data", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.dataQualityWarnings.length).toBe(0);
      });
    });

    describe("Summary Generation", () => {
      it("should generate a comprehensive summary", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.summary).toBeDefined();
        expect(typeof result.summary).toBe("string");
        expect(result.summary.length).toBeGreaterThan(0);
      });
    });

    describe("Recommendations for Personas", () => {
      it("should include recommendations for personas", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.recommendationsForPersonas).toBeDefined();
        expect(result.recommendationsForPersonas.strengths).toBeDefined();
        expect(result.recommendationsForPersonas.concerns).toBeDefined();
      });

      it("should have arrays for strengths and concerns", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(Array.isArray(result.recommendationsForPersonas.strengths)).toBe(true);
        expect(Array.isArray(result.recommendationsForPersonas.concerns)).toBe(true);
      });
    });

    describe("Multiple Stocks", () => {
      it("should handle different price points", async () => {
        const data = createMockFinancialData();

        const result1 = await analyzeValuation(data, data.dataQualityFlags!, 50);
        const result2 = await analyzeValuation(data, data.dataQualityFlags!, 150);

        expect(result1.consensusValuation).toBeDefined();
        expect(result2.consensusValuation).toBeDefined();
      });
    });

    describe("Intrinsic Value Calculations", () => {
      it("should produce reasonable intrinsic values", async () => {
        const data = createMockFinancialData({
          currentPrice: 100,
          sharesOutstanding: 1000,
          financials: [
            {
              revenue: 50000,
              netIncome: 10000,
              operatingIncome: 12000,
              grossProfit: 25000,
              eps: 10,
              fcf: 8000,
            },
          ],
        });

        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        // Intrinsic value should be reasonable (not 0 or extremely high)
        expect(result.consensusValuation.intrinsicValue).toBeGreaterThan(0);
        expect(result.consensusValuation.intrinsicValue).toBeLessThan(100000);
      });
    });

    describe("Return Types", () => {
      it("should return all required fields", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation(data, data.dataQualityFlags!, 100);

        expect(result.methods).toBeDefined();
        expect(result.consensusValuation).toBeDefined();
        expect(result.methodAgreement).toBeDefined();
        expect(result.marginOfSafety).toBeDefined();
        expect(result.confidence).toBeDefined();
        expect(result.dataQualityWarnings).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.recommendationsForPersonas).toBeDefined();
      });
    });
  });
});
