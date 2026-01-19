import { describe, it, expect, beforeEach } from "vitest";
import { analyzeValuation } from "./valuationAgent";
import type { FinancialData } from "@/shared/types";

describe("Dynamic Multiples Calculation (Comparable Method)", () => {
  let mockFinancialData: FinancialData;

  beforeEach(() => {
    mockFinancialData = {
      symbol: "TEST",
      sharesOutstanding: 1000, // millions
      price: 100,
      marketCap: 100000, // millions
      financials: [
        {
          period: "2025-09-30",
          fiscalYear: 2025,
          revenue: 50000, // millions
          netIncome: 5000,
          operatingIncome: 7500,
          eps: 5.0,
          freeCashFlow: 4000,
        },
        {
          period: "2024-09-30",
          fiscalYear: 2024,
          revenue: 45000,
          netIncome: 4000,
          operatingIncome: 6750,
          eps: 4.0,
          freeCashFlow: 3500,
        },
        {
          period: "2023-09-30",
          fiscalYear: 2023,
          revenue: 40000,
          netIncome: 3000,
          operatingIncome: 6000,
          eps: 3.0,
          freeCashFlow: 3000,
        },
      ],
      quarterlyFinancials: [],
      ratios: {
        pe: 20,
        pb: 3.0,
        ps: 2.0,
        currentRatio: 1.5,
        debtToEquity: 0.5,
        roe: 25, // High ROE should trigger growth premium
        roic: 20,
        grossMargin: 40,
        operatingMargin: 15,
        netMargin: 10,
        dividendYield: 2,
        revenueGrowth: 0.125, // 12.5% growth
        earningsGrowth: 0.667, // 66.7% growth
      },
      dataQualityFlags: {
        debtToEquityAnomalous: false,
        roicZero: false,
        interestCoverageZero: false,
        peNegative: false,
        marketCapZero: false,
        pbAnomalous: false,
        peAnomalous: false,
        roeNegative: false,
        currentRatioAnomalous: false,
      },
    };
  });

  it("should calculate dynamic P/E multiple based on historical data", async () => {
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    expect(comparableMethod).toBeDefined();
    expect(comparableMethod?.assessment).not.toBe("UNABLE_TO_VALUE");

    // Should have dynamic P/E in assumptions
    const peAssumption = comparableMethod?.assumptions.dynamicPE as string;
    expect(peAssumption).toMatch(/\d+\.\d+x/);
    console.log("Dynamic P/E:", peAssumption);
  });

  it("should apply growth premium for high ROE companies", async () => {
    // High ROE (25%) should trigger 15% premium
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    const growthAdj = comparableMethod?.assumptions.growthAdjustment as string;
    expect(growthAdj).toMatch(/115%/); // 15% premium
    console.log("Growth adjustment (high ROE):", growthAdj);
  });

  it("should apply discount for low ROE companies", async () => {
    mockFinancialData.ratios!.roe = 5; // Low ROE
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    const growthAdj = comparableMethod?.assumptions.growthAdjustment as string;
    expect(growthAdj).toMatch(/90%/); // 10% discount
    console.log("Growth adjustment (low ROE):", growthAdj);
  });

  it("should apply discount for negative ROE companies", async () => {
    mockFinancialData.ratios!.roe = -10; // Negative ROE
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    const growthAdj = comparableMethod?.assumptions.growthAdjustment as string;
    expect(growthAdj).toMatch(/75%/); // 25% discount
    console.log("Growth adjustment (negative ROE):", growthAdj);
  });

  it("should use multiple valuation methods (P/E, P/B, P/S)", async () => {
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    const methodsApplied = comparableMethod?.assumptions.methodsApplied as number;
    expect(methodsApplied).toBeGreaterThanOrEqual(2);
    console.log("Methods applied:", methodsApplied);
  });

  it("should not use hardcoded industry multiples", async () => {
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    const narrative = comparableMethod?.narrative || "";

    // Should NOT mention hardcoded values like "20x", "3.0x", "2.0x"
    expect(narrative).not.toMatch(/industry average/i);
    expect(narrative).toMatch(/historical data/i);
    expect(narrative).toMatch(/growth profile/i);
    console.log("Narrative:", narrative);
  });

  it("should handle missing historical data gracefully", async () => {
    mockFinancialData.financials = []; // No historical data
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    expect(comparableMethod?.assessment).toBe("UNABLE_TO_VALUE");
    console.log("Assessment with no data:", comparableMethod?.assessment);
  });

  it("should produce reasonable valuation ranges", async () => {
    const result = await analyzeValuation({
      ticker: "TEST",
      currentPrice: 100,
      financialData: mockFinancialData,
      dataQualityFlags: mockFinancialData.dataQualityFlags!,
    });

    const comparableMethod = result.methods.find((m) => m.name === "Comparable");
    if (comparableMethod?.assessment !== "UNABLE_TO_VALUE") {
      // Valuation should be within reasonable range (0.5x to 5x current price)
      expect(comparableMethod!.intrinsicValue).toBeGreaterThan(50);
      expect(comparableMethod!.intrinsicValue).toBeLessThan(500);
      console.log("Intrinsic value:", comparableMethod!.intrinsicValue);
    }
  });
});
