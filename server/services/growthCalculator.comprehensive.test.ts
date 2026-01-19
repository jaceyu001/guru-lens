/**
 * Comprehensive TTM Growth Calculator Tests
 * 
 * Tests to verify that growthCalculator correctly computes TTM values
 * and growth rates using real quarterly financial data
 */

import { describe, it, expect } from "vitest";
import { calculateGrowth, calculateMultipleGrowths } from "./growthCalculator";
import type { FinancialData } from "@shared/types";

describe("growthCalculator - TTM Calculations with Real Data", () => {
  /**
   * BIDU Q3 2025 Scenario
   * - Latest: 2025-Q3 (3 quarters of 2025 available)
   * - Comparison Type: TTM_VS_FY (2025 TTM vs 2024 FY)
   */
  const biduQ3Data: FinancialData = {
    quarterlyFinancials: [
      {
        period: "2025-09-30",
        quarter: "2025-Q3",
        fiscalYear: 2025,
        revenue: 35000000000,
        netIncome: 8500000000,
        operatingIncome: 6200000000,
        eps: 2.50,
        freeCashFlow: 3000000000,
      },
      {
        period: "2025-06-30",
        quarter: "2025-Q2",
        fiscalYear: 2025,
        revenue: 33500000000,
        netIncome: 7800000000,
        operatingIncome: 5900000000,
        eps: 2.30,
        freeCashFlow: 2800000000,
      },
      {
        period: "2025-03-31",
        quarter: "2025-Q1",
        fiscalYear: 2025,
        revenue: 32000000000,
        netIncome: 7200000000,
        operatingIncome: 5500000000,
        eps: 2.10,
        freeCashFlow: 2500000000,
      },
      {
        period: "2024-12-31",
        quarter: "2024-Q4",
        fiscalYear: 2024,
        revenue: 34124000000,
        netIncome: 5192000000,
        operatingIncome: 3917000000,
        eps: 1.53,
        freeCashFlow: 2200000000,
      },
      {
        period: "2024-09-30",
        quarter: "2024-Q3",
        fiscalYear: 2024,
        revenue: 33557000000,
        netIncome: 7632000000,
        operatingIncome: 5925000000,
        eps: 2.25,
        freeCashFlow: 2100000000,
      },
    ] as any,
    financials: [
      {
        period: "2024-12-31",
        fiscalYear: 2024,
        revenue: 134598000000,
        netIncome: 20315000000,
        operatingIncome: 21856000000,
        eps: 6.00,
        freeCashFlow: 8000000000,
      },
      {
        period: "2023-12-31",
        fiscalYear: 2023,
        revenue: 123675000000,
        netIncome: 7559000000,
        operatingIncome: 15911000000,
        eps: 2.23,
        freeCashFlow: 6500000000,
      },
    ] as any,
  };

  /**
   * AAPL Q4 2024 Scenario (Year-end)
   * - Latest: 2024-Q4 (4 quarters of 2024 available)
   * - Comparison Type: TTM_VS_FY (2024 TTM vs 2023 FY)
   * - TTM should equal 2024 FY (4 quarters = full year)
   */
  const aaplQ4Data: FinancialData = {
    quarterlyFinancials: [
      {
        period: "2024-12-31",
        quarter: "2024-Q4",
        fiscalYear: 2024,
        revenue: 120000000000,
        netIncome: 30000000000,
        operatingIncome: 35000000000,
        eps: 2.50,
        freeCashFlow: 25000000000,
      },
      {
        period: "2024-09-30",
        quarter: "2024-Q3",
        fiscalYear: 2024,
        revenue: 118000000000,
        netIncome: 29000000000,
        operatingIncome: 34000000000,
        eps: 2.40,
        freeCashFlow: 24000000000,
      },
      {
        period: "2024-06-30",
        quarter: "2024-Q2",
        fiscalYear: 2024,
        revenue: 116000000000,
        netIncome: 28000000000,
        operatingIncome: 33000000000,
        eps: 2.30,
        freeCashFlow: 23000000000,
      },
      {
        period: "2024-03-31",
        quarter: "2024-Q1",
        fiscalYear: 2024,
        revenue: 114000000000,
        netIncome: 27000000000,
        operatingIncome: 32000000000,
        eps: 2.20,
        freeCashFlow: 22000000000,
      },
      {
        period: "2023-12-31",
        quarter: "2023-Q4",
        fiscalYear: 2023,
        revenue: 110000000000,
        netIncome: 25000000000,
        operatingIncome: 30000000000,
        eps: 2.00,
        freeCashFlow: 20000000000,
      },
    ] as any,
    financials: [
      {
        period: "2024-12-31",
        fiscalYear: 2024,
        revenue: 468000000000,
        netIncome: 114000000000,
        operatingIncome: 134000000000,
        eps: 9.40,
        freeCashFlow: 94000000000,
      },
      {
        period: "2023-12-31",
        fiscalYear: 2023,
        revenue: 420000000000,
        netIncome: 100000000000,
        operatingIncome: 120000000000,
        eps: 8.00,
        freeCashFlow: 80000000000,
      },
    ] as any,
  };

  /**
   * MSFT Q1 2025 Scenario (Q1 Only)
   * - Latest: 2025-Q1 (only 1 quarter of 2025 available)
   * - Comparison Type: FY_VS_FY (2024 FY vs 2023 FY)
   * - TTM not available, use full year comparison
   */
  const msftQ1Data: FinancialData = {
    quarterlyFinancials: [
      {
        period: "2025-03-31",
        quarter: "2025-Q1",
        fiscalYear: 2025,
        revenue: 65000000000,
        netIncome: 20000000000,
        operatingIncome: 25000000000,
        eps: 2.65,
        freeCashFlow: 18000000000,
      },
      {
        period: "2024-12-31",
        quarter: "2024-Q4",
        fiscalYear: 2024,
        revenue: 62000000000,
        netIncome: 19000000000,
        operatingIncome: 24000000000,
        eps: 2.50,
        freeCashFlow: 17000000000,
      },
      {
        period: "2024-09-30",
        quarter: "2024-Q3",
        fiscalYear: 2024,
        revenue: 61000000000,
        netIncome: 18500000000,
        operatingIncome: 23500000000,
        eps: 2.45,
        freeCashFlow: 16500000000,
      },
      {
        period: "2024-06-30",
        quarter: "2024-Q2",
        fiscalYear: 2024,
        revenue: 60000000000,
        netIncome: 18000000000,
        operatingIncome: 23000000000,
        eps: 2.40,
        freeCashFlow: 16000000000,
      },
    ] as any,
    financials: [
      {
        period: "2024-12-31",
        fiscalYear: 2024,
        revenue: 245000000000,
        netIncome: 72000000000,
        operatingIncome: 95000000000,
        eps: 9.60,
        freeCashFlow: 65000000000,
      },
      {
        period: "2023-12-31",
        fiscalYear: 2023,
        revenue: 220000000000,
        netIncome: 65000000000,
        operatingIncome: 85000000000,
        eps: 8.65,
        freeCashFlow: 58000000000,
      },
    ] as any,
  };

  describe("BIDU Q3 2025 - TTM vs FY Growth", () => {
    it("should calculate revenue growth correctly", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.currentPeriod).toContain("2025");
      expect(result.priorPeriod).toContain("2024");
      expect(result.growthRate).toBeDefined();
      expect(typeof result.growthRate).toBe("number");
    });

    it("should calculate net income growth correctly", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "netIncome",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeGreaterThan(40); // ~41% growth
    });

    it("should calculate operating income growth correctly", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "operatingIncome",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeLessThan(0); // Slight decline
    });

    it("should calculate free cash flow growth correctly", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "freeCashFlow",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeDefined();
    });
  });

  describe("AAPL Q4 2024 - Full Year TTM vs FY", () => {
    it("should calculate revenue growth (11%+)", () => {
      const result = calculateGrowth({
        financialData: aaplQ4Data,
        metric: "revenue",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeGreaterThan(10);
      expect(result.growthRate).toBeLessThan(12);
    });

    it("should calculate net income growth (14%)", () => {
      const result = calculateGrowth({
        financialData: aaplQ4Data,
        metric: "netIncome",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeGreaterThan(13);
      expect(result.growthRate).toBeLessThan(15);
    });

    it("should calculate operating income growth (11%+)", () => {
      const result = calculateGrowth({
        financialData: aaplQ4Data,
        metric: "operatingIncome",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeGreaterThan(11);
      expect(result.growthRate).toBeLessThan(12);
    });

    it("should calculate free cash flow growth (17%+)", () => {
      const result = calculateGrowth({
        financialData: aaplQ4Data,
        metric: "freeCashFlow",
      });

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.growthRate).toBeGreaterThan(17);
      expect(result.growthRate).toBeLessThan(18);
    });
  });

  describe("MSFT Q1 2025 - FY vs FY Comparison", () => {
    it("should use FY_VS_FY comparison type when only Q1 available", () => {
      const result = calculateGrowth({
        financialData: msftQ1Data,
        metric: "revenue",
      });

      expect(result.comparisonType).toBe("FY_VS_FY");
      expect(result.dataQualityFlags.onlyQ1Available).toBe(true);
    });

    it("should calculate revenue growth (11%+)", () => {
      const result = calculateGrowth({
        financialData: msftQ1Data,
        metric: "revenue",
      });

      expect(result.growthRate).toBeGreaterThan(11);
      expect(result.growthRate).toBeLessThan(12);
    });

    it("should calculate net income growth (10%+)", () => {
      const result = calculateGrowth({
        financialData: msftQ1Data,
        metric: "netIncome",
      });

      expect(result.growthRate).toBeGreaterThan(10);
      expect(result.growthRate).toBeLessThan(11);
    });
  });

  describe("Multiple Growth Calculations", () => {
    it("should calculate all metrics at once for BIDU", () => {
      const results = calculateMultipleGrowths(biduQ3Data, [
        "revenue",
        "netIncome",
        "operatingIncome",
        "freeCashFlow",
      ]);

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.comparisonType === "TTM_VS_FY")).toBe(true);
      expect(results.every((r) => typeof r.growthRate === "number")).toBe(true);
    });

    it("should calculate all metrics at once for AAPL", () => {
      const results = calculateMultipleGrowths(aaplQ4Data, [
        "revenue",
        "netIncome",
        "operatingIncome",
        "freeCashFlow",
      ]);

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.comparisonType === "TTM_VS_FY")).toBe(true);
      expect(results.every((r) => r.growthRate > 10)).toBe(true);
    });

    it("should calculate all metrics at once for MSFT", () => {
      const results = calculateMultipleGrowths(msftQ1Data, [
        "revenue",
        "netIncome",
        "operatingIncome",
        "freeCashFlow",
      ]);

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.comparisonType === "FY_VS_FY")).toBe(true);
    });
  });

  describe("Growth Rate Precision", () => {
    it("should return finite growth rates", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      expect(Number.isFinite(result.growthRate)).toBe(true);
    });

    it("should handle very small growth rates", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      // BIDU revenue growth is ~0.02%
      expect(result.growthRate).toBeGreaterThan(-1);
      expect(result.growthRate).toBeLessThan(1);
    });

    it("should handle large growth rates", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "netIncome",
      });

      // BIDU net income growth is ~41%
      expect(result.growthRate).toBeGreaterThan(40);
      expect(result.growthRate).toBeLessThan(42);
    });
  });

  describe("Data Quality Flags", () => {
    it("should set onlyQ1Available flag for MSFT", () => {
      const result = calculateGrowth({
        financialData: msftQ1Data,
        metric: "revenue",
      });

      expect(result.dataQualityFlags.onlyQ1Available).toBe(true);
    });

    it("should not set onlyQ1Available flag for BIDU", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      expect(result.dataQualityFlags.onlyQ1Available).toBe(false);
    });

    it("should not set ttmNotAvailable flag when TTM is available", () => {
      const result = calculateGrowth({
        financialData: aaplQ4Data,
        metric: "revenue",
      });

      expect(result.dataQualityFlags.ttmNotAvailable).toBe(false);
    });
  });

  describe("Period Labels", () => {
    it("should include year information in period labels", () => {
      const result = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      expect(result.currentPeriod).toContain("2025");
      expect(result.priorPeriod).toContain("2024");
    });

    it("should distinguish TTM from FY in labels", () => {
      const ttmResult = calculateGrowth({
        financialData: biduQ3Data,
        metric: "revenue",
      });

      const fyResult = calculateGrowth({
        financialData: msftQ1Data,
        metric: "revenue",
      });

      // TTM result should have different period format than FY result
      expect(ttmResult.currentPeriod).not.toBe(fyResult.currentPeriod);
    });
  });
});
