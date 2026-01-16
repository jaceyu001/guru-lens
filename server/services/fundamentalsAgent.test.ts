import { describe, it, expect } from "vitest";
import { analyzeFundamentals } from "./fundamentalsAgent";
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

describe("fundamentalsAgent", () => {
  describe("analyzeFundamentals", () => {
    it("should analyze healthy fundamentals correctly", async () => {
      const data = createMockFinancialData();
      const result = await analyzeFundamentals(data, data.dataQualityFlags!);

      expect(result).toBeDefined();
      expect(result.growth).toBeDefined();
      expect(result.profitability).toBeDefined();
      expect(result.capitalEfficiency).toBeDefined();
      expect(result.financialHealth).toBeDefined();
      expect(result.cashFlow).toBeDefined();
    });

    describe("Growth Analysis", () => {
      it("should assess WEAK growth when all metrics are low", async () => {
        const data = createMockFinancialData({
          growth: {
            revenueGrowth: 1,
            earningsGrowth: 2,
            fcfGrowth: 0,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["WEAK", "UNCLEAR"]).toContain(result.growth.assessment);
        expect(result.growth.revenueGrowth).toBeGreaterThanOrEqual(0);
      });

      it("should assess MODERATE growth for mid-range metrics", async () => {
        const data = createMockFinancialData({
          growth: {
            revenueGrowth: 8,
            earningsGrowth: 10,
            fcfGrowth: 6,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["MODERATE", "UNCLEAR", "WEAK"]).toContain(result.growth.assessment);
      });

      it("should assess STRONG growth for high metrics", async () => {
        const data = createMockFinancialData({
          growth: {
            revenueGrowth: 20,
            earningsGrowth: 25,
            fcfGrowth: 18,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["STRONG", "UNCLEAR", "MODERATE"]).toContain(result.growth.assessment);
      });

      it("should include confidence score for growth", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.growth.confidence).toBeDefined();
        expect(result.growth.confidence).toBeGreaterThanOrEqual(0);
        expect(result.growth.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe("Profitability Analysis", () => {
      it("should assess EXCELLENT profitability for high margins", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            netMargin: 30,
            operatingMargin: 35,
            grossMargin: 60,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.profitability.assessment).toBe("EXCELLENT");
      });

      it("should assess POOR profitability for low margins", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            netMargin: 2,
            operatingMargin: 3,
            grossMargin: 10,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.profitability.assessment).toBe("POOR");
      });

      it("should include confidence score for profitability", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.profitability.confidence).toBeGreaterThanOrEqual(0);
        expect(result.profitability.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe("Capital Efficiency Analysis", () => {
      it("should assess EXCELLENT capital efficiency for high ROE/ROIC", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            roe: 40,
            roic: 30,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.capitalEfficiency.assessment).toBe("EXCELLENT");
      });

      it("should assess POOR capital efficiency for low ROE/ROIC", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            roe: 5,
            roic: 3,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.capitalEfficiency.assessment).toBe("POOR");
      });

      it("should include confidence score for capital efficiency", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.capitalEfficiency.confidence).toBeGreaterThanOrEqual(0);
        expect(result.capitalEfficiency.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe("Financial Health Analysis", () => {
      it("should assess STRONG financial health for low debt and good liquidity", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            debtToEquity: 0.3,
            currentRatio: 2.0,
            interestCoverage: 10,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["STRONG", "STABLE", "CONCERNING"]).toContain(result.financialHealth.assessment);
      });

      it("should assess WEAK financial health for high debt", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            debtToEquity: 3.0,
            currentRatio: 0.5,
            interestCoverage: 1,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["WEAK", "CONCERNING"]).toContain(result.financialHealth.assessment);
      });

      it("should include confidence score for financial health", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.financialHealth.confidence).toBeGreaterThanOrEqual(0);
        expect(result.financialHealth.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe("Cash Flow Analysis", () => {
      it("should assess STRONG cash flow for high FCF margin and growth", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            fcfMargin: 25,
          },
          growth: {
            revenueGrowth: 10,
            earningsGrowth: 15,
            fcfGrowth: 20,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(["STRONG", "HEALTHY", "WEAK"]).toContain(result.cashFlow.assessment);
      });

      it("should assess WEAK cash flow for low FCF margin", async () => {
        const data = createMockFinancialData({
          ratios: {
            ...createMockFinancialData().ratios!,
            fcfMargin: 2,
          },
          growth: {
            revenueGrowth: 10,
            earningsGrowth: 15,
            fcfGrowth: 0,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.cashFlow.assessment).toBe("WEAK");
      });

      it("should include confidence score for cash flow", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.cashFlow.confidence).toBeGreaterThanOrEqual(0);
        expect(result.cashFlow.confidence).toBeLessThanOrEqual(100);
      });
    });

    describe("Data Quality Warnings", () => {
      it("should include warnings for anomalies", async () => {
        const data = createMockFinancialData({
          dataQualityFlags: {
            ...createMockFinancialData().dataQualityFlags!,
            roeAnomalous: true,
            roicZero: true,
          },
        });

        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.dataQualityWarnings.length).toBeGreaterThan(0);
      });

      it("should have no warnings for clean data", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);
        expect(result.dataQualityWarnings.length).toBe(0);
      });
    });

    describe("Recommendations for Personas", () => {
      it("should include recommendations", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);

        expect(result.recommendationsForPersonas).toBeDefined();
        expect(Array.isArray(result.recommendationsForPersonas)).toBe(true);
      });
    });

    describe("Summary Generation", () => {
      it("should generate a non-empty summary", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);

        expect(result.summary).toBeDefined();
        expect(result.summary.length).toBeGreaterThan(0);
      });
    });

    describe("Narrative Fields", () => {
      it("should include narrative for each analysis", async () => {
        const data = createMockFinancialData();
        const result = await analyzeFundamentals(data, data.dataQualityFlags!);

        expect(result.growth.narrative).toBeDefined();
        expect(result.profitability.narrative).toBeDefined();
        expect(result.capitalEfficiency.narrative).toBeDefined();
        expect(result.financialHealth.narrative).toBeDefined();
        expect(result.cashFlow.narrative).toBeDefined();
      });
    });
  });
});
