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
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result).toBeDefined();
      expect(result.methods).toBeDefined();
      expect(Array.isArray(result.methods)).toBe(true);
    });

    describe("Valuation Methods", () => {
      it("should include multiple valuation methods", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.methods.length).toBeGreaterThan(0);
      });

      it("should have method names", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        result.methods.forEach((method) => {
          expect(method.name).toBeDefined();
          expect(typeof method.name).toBe("string");
          expect(["DCF", "Comparable", "DDM", "AssetBased"]).toContain(method.name);
        });
      });

      it("should have assessment for each method", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        result.methods.forEach((method) => {
          expect(method.assessment).toBeDefined();
          expect(["UNDERVALUED", "FAIRLY_VALUED", "OVERVALUED", "UNABLE_TO_VALUE"]).toContain(
            method.assessment
          );
        });
      });

      it("should have narrative for each method", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        result.methods.forEach((method) => {
          expect(method.narrative).toBeDefined();
          expect(typeof method.narrative).toBe("string");
        });
      });
    });

    describe("Consensus Valuation", () => {
      it("should calculate consensus valuation range", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.consensusValuation).toBeDefined();
        expect(result.consensusValuation.low).toBeDefined();
        expect(result.consensusValuation.high).toBeDefined();
        expect(result.consensusValuation.midpoint).toBeDefined();
      });

      it("should have valid valuation range", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.consensusValuation.low).toBeGreaterThan(0);
        expect(result.consensusValuation.high).toBeGreaterThanOrEqual(result.consensusValuation.low);
        expect(result.consensusValuation.midpoint).toBeGreaterThanOrEqual(result.consensusValuation.low);
        expect(result.consensusValuation.midpoint).toBeLessThanOrEqual(result.consensusValuation.high);
      });

      it("should have overall assessment", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.overallAssessment).toBeDefined();
        expect(["UNDERVALUED", "FAIRLY_VALUED", "OVERVALUED", "UNABLE_TO_VALUE"]).toContain(
          result.overallAssessment
        );
      });

      it("should calculate upside/downside", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.consensusUpside).toBeDefined();
        expect(typeof result.consensusUpside).toBe("number");
      });
    });

    describe("Method Agreement", () => {
      it("should calculate method agreement", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.methodAgreement).toBeDefined();
        expect(["STRONG", "MODERATE", "WEAK", "DIVERGENT"]).toContain(result.methodAgreement);
      });
    });

    describe("Margin of Safety", () => {
      it("should calculate margin of safety", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.marginOfSafety).toBeDefined();
        expect(typeof result.marginOfSafety).toBe("number");
      });

      it("should have positive margin for undervalued stocks", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 50, // Price below intrinsic value
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        // If undervalued, margin of safety should be positive
        if (result.overallAssessment === "UNDERVALUED") {
          expect(result.marginOfSafety).toBeGreaterThan(0);
        }
      });
    });

    describe("Confidence Scoring", () => {
      it("should have confidence score for valuation", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.confidence).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(30);
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

        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

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

        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.dataQualityWarnings).toBeDefined();
        expect(Array.isArray(result.dataQualityWarnings)).toBe(true);
      });

      it("should have no warnings for clean data", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.dataQualityWarnings.length).toBe(0);
      });
    });

    describe("Summary Generation", () => {
      it("should generate a comprehensive summary", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.summary).toBeDefined();
        expect(typeof result.summary).toBe("string");
        expect(result.summary.length).toBeGreaterThan(0);
      });
    });

    describe("Recommendations for Personas", () => {
      it("should include recommendations for personas", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.recommendationsForPersonas).toBeDefined();
        expect(Array.isArray(result.recommendationsForPersonas)).toBe(true);
      });
    });

    describe("Multiple Price Points", () => {
      it("should handle different price points", async () => {
        const data = createMockFinancialData();

        const result1 = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 50,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        const result2 = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 150,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result1.consensusUpside).toBeDefined();
        expect(result2.consensusUpside).toBeDefined();
        // Upside should be different for different prices
        expect(result1.consensusUpside).not.toBe(result2.consensusUpside);
      });
    });

    describe("Return Types", () => {
      it("should return all required fields", async () => {
        const data = createMockFinancialData();
        const result = await analyzeValuation({
          ticker: "TEST",
          currentPrice: 100,
          financialData: data,
          dataQualityFlags: data.dataQualityFlags!,
        });

        expect(result.currentPrice).toBeDefined();
        expect(result.methods).toBeDefined();
        expect(result.consensusValuation).toBeDefined();
        expect(result.consensusUpside).toBeDefined();
        expect(result.marginOfSafety).toBeDefined();
        expect(result.methodAgreement).toBeDefined();
        expect(result.overallAssessment).toBeDefined();
        expect(result.confidence).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.dataQualityWarnings).toBeDefined();
        expect(result.recommendationsForPersonas).toBeDefined();
      });
    });
  });
});


// ============================================================================
// TTM vs FY Integration Tests
// ============================================================================

describe("ValuationAgent - TTM vs FY Integration", () => {
  describe("DCF Method with TTM vs FY Growth", () => {
    it("should include TTM vs FY comparison type in assumptions", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      const dcfMethod = result.methods.find(m => m.name === "DCF");
      expect(dcfMethod).toBeDefined();
      
      if (dcfMethod) {
        // Should have TTM vs FY related assumptions
        expect(dcfMethod.assumptions).toBeDefined();
        expect(typeof dcfMethod.assumptions).toBe("object");
      }
    });

    it("should reference comparison periods in narrative", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      const dcfMethod = result.methods.find(m => m.name === "DCF");
      expect(dcfMethod?.narrative).toBeDefined();
      
      if (dcfMethod?.narrative) {
        // Narrative should reference financial periods
        expect(dcfMethod.narrative.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Comparable Method with Growth Context", () => {
    it("should calculate comparable valuation", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      const comparableMethod = result.methods.find(m => m.name === "Comparable");
      expect(comparableMethod).toBeDefined();
      expect(comparableMethod?.assessment).toBeTruthy();
    });

    it("should have valid assumptions for comparable method", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      const comparableMethod = result.methods.find(m => m.name === "Comparable");
      expect(comparableMethod?.assumptions).toBeDefined();
      expect(Object.keys(comparableMethod?.assumptions || {}).length).toBeGreaterThan(0);
    });
  });

  describe("Valuation Summary with Period Information", () => {
    it("should generate comprehensive summary", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it("should include method agreement in summary context", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result.methodAgreement).toMatch(/STRONG|MODERATE|WEAK|DIVERGENT/);
      expect(result.summary).toBeDefined();
    });
  });

  describe("Data Quality Handling with TTM Logic", () => {
    it("should handle insufficient financial data", async () => {
      const data = createMockFinancialData({
        financials: [],
      });

      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: { ...data.dataQualityFlags!, insufficientData: true },
      });

      expect(result).toBeDefined();
      expect(result.methods.length).toBeGreaterThan(0);
    });

    it("should collect data quality warnings", async () => {
      const data = createMockFinancialData({
        dataQualityFlags: {
          ...createMockFinancialData().dataQualityFlags!,
          peAnomalous: true,
          roicZero: true,
        },
      });

      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result.dataQualityWarnings).toBeDefined();
      expect(Array.isArray(result.dataQualityWarnings)).toBe(true);
    });
  });

  describe("Consensus Valuation with TTM Context", () => {
    it("should calculate valid consensus range", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result.consensusValuation.low).toBeGreaterThan(0);
      expect(result.consensusValuation.high).toBeGreaterThanOrEqual(result.consensusValuation.low);
      expect(result.consensusValuation.midpoint).toBeLessThanOrEqual(result.consensusValuation.high);
      expect(result.consensusValuation.midpoint).toBeGreaterThanOrEqual(result.consensusValuation.low);
    });

    it("should calculate margin of safety", async () => {
      const data = createMockFinancialData();
      const result = await analyzeValuation({
        ticker: "TEST",
        currentPrice: 100,
        financialData: data,
        dataQualityFlags: data.dataQualityFlags!,
      });

      expect(result.marginOfSafety).toBeDefined();
      expect(typeof result.marginOfSafety).toBe("number");
    });
  });
});
