/**
 * Growth Rate Calculation Tests
 * 
 * Tests to verify that growthCalculator correctly computes growth rates
 * using TTM vs FY and FY vs FY comparisons
 */

import { describe, it, expect } from "vitest";
import { calculateGrowth } from "./growthCalculator";
import {
  biduQ3Fixture,
  aaplQ4Fixture,
  msftQ1Fixture,
  expectedGrowthRates,
} from "./growthCalculator.fixtures";

describe("growthCalculator - Growth Rate Calculations", () => {
  describe("BIDU Q3 2025 - TTM vs FY Growth", () => {
    it("should calculate revenue growth (TTM vs 2024 FY) correctly", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.bidu.revenueGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1); // Within 0.1%
    });

    it("should calculate net income growth (TTM vs 2024 FY) correctly", () => {
      const result = calculateGrowth(
        "netIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.bidu.netIncomeGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should calculate operating income growth (TTM vs 2024 FY) correctly", () => {
      const result = calculateGrowth(
        "operatingIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.bidu.operatingIncomeGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should return positive growth for net income (41%+)", () => {
      const result = calculateGrowth(
        "netIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.growthRate).toBeGreaterThan(40);
      expect(result.growthRate).toBeLessThan(42);
    });

    it("should return negative growth for operating income (-2%)", () => {
      const result = calculateGrowth(
        "operatingIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.growthRate).toBeLessThan(0);
      expect(result.growthRate).toBeGreaterThan(-2);
    });

    it("should include growth direction indicator", () => {
      const revenueResult = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const netIncomeResult = calculateGrowth(
        "netIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(revenueResult.growthDirection).toBeDefined();
      expect(netIncomeResult.growthDirection).toBe("positive");
    });
  });

  describe("AAPL Q4 2024 - TTM vs FY Growth (Full Year)", () => {
    it("should calculate revenue growth (2024 TTM vs 2023 FY) correctly", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.aapl.revenueGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should calculate net income growth (2024 TTM vs 2023 FY) correctly", () => {
      const result = calculateGrowth(
        "netIncome",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.aapl.netIncomeGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should calculate operating income growth (2024 TTM vs 2023 FY) correctly", () => {
      const result = calculateGrowth(
        "operatingIncome",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.aapl.operatingIncomeGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should show double-digit growth for all metrics", () => {
      const revenueResult = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      const netIncomeResult = calculateGrowth(
        "netIncome",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      const operatingResult = calculateGrowth(
        "operatingIncome",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(revenueResult.growthRate).toBeGreaterThan(10);
      expect(netIncomeResult.growthRate).toBeGreaterThan(10);
      expect(operatingResult.growthRate).toBeGreaterThan(10);
    });
  });

  describe("MSFT Q1 2025 - FY vs FY Growth (Q1 Only)", () => {
    it("should calculate revenue growth (2024 FY vs 2023 FY) correctly", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.msft.revenueGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should calculate net income growth (2024 FY vs 2023 FY) correctly", () => {
      const result = calculateGrowth(
        "netIncome",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      const expectedGrowth = expectedGrowthRates.msft.netIncomeGrowth;
      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.1);
    });

    it("should use prior FY for comparison when only Q1 available", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.comparisonType).toBe("FY_VS_FY");
      expect(result.periodLabel).toContain("2024 FY");
      expect(result.periodLabel).toContain("2023 FY");
    });

    it("should include warning flag for Q1-only comparison", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.dataQualityFlags.q1Only).toBe(true);
      expect(result.dataQualityFlags.ttmAvailable).toBe(false);
    });
  });

  describe("Growth Rate Edge Cases", () => {
    it("should handle zero growth correctly", () => {
      // Create fixture with identical TTM and prior FY
      const zeroGrowthQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q3"
          ? { ...q, revenue: 33549500000 } // Adjusted to make TTM = prior FY
          : q
      );

      const result = calculateGrowth(
        "revenue",
        zeroGrowthQuarters,
        biduQ3Fixture.financials
      );

      expect(Math.abs(result.growthRate)).toBeLessThan(0.1);
    });

    it("should handle negative growth correctly", () => {
      // Create fixture with declining revenue
      const declineQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q3" ? { ...q, revenue: 30000000000 } : q
      );

      const result = calculateGrowth(
        "revenue",
        declineQuarters,
        biduQ3Fixture.financials
      );

      expect(result.growthRate).toBeLessThan(0);
      expect(result.growthDirection).toBe("negative");
    });

    it("should handle very high growth correctly", () => {
      // Create fixture with high growth
      const highGrowthQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q3" ? { ...q, revenue: 50000000000 } : q
      );

      const result = calculateGrowth(
        "revenue",
        highGrowthQuarters,
        biduQ3Fixture.financials
      );

      expect(result.growthRate).toBeGreaterThan(0);
      expect(result.growthDirection).toBe("positive");
    });

    it("should handle division by zero gracefully", () => {
      // Create fixture where prior FY is zero
      const zeroPriorFY = [
        {
          period: "2024-12-31",
          fiscalYear: 2024,
          revenue: 0,
          netIncome: 0,
          operatingIncome: 0,
          eps: 0,
          freeCashFlow: 0,
        },
      ];

      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        zeroPriorFY
      );

      expect(Number.isFinite(result.growthRate)).toBe(false);
      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });
  });

  describe("Growth Rate Precision", () => {
    it("should calculate growth rates with 2 decimal precision", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const decimalPlaces = (result.growthRate.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("should handle very small growth rates", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      // BIDU revenue growth is ~0.02%
      expect(result.growthRate).toBeGreaterThan(-0.1);
      expect(result.growthRate).toBeLessThan(0.1);
    });

    it("should handle large growth rates", () => {
      const result = calculateGrowth(
        "netIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      // BIDU net income growth is ~41%
      expect(result.growthRate).toBeGreaterThan(40);
      expect(result.growthRate).toBeLessThan(42);
    });
  });

  describe("Growth Rate Comparison Types", () => {
    it("should label TTM_VS_FY comparisons correctly", () => {
      const biduResult = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(biduResult.comparisonType).toBe("TTM_VS_FY");
      expect(biduResult.periodLabel).toMatch(/TTM.*vs.*FY/i);
    });

    it("should label FY_VS_FY comparisons correctly", () => {
      const msftResult = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(msftResult.comparisonType).toBe("FY_VS_FY");
      expect(msftResult.periodLabel).toMatch(/FY.*vs.*FY/i);
    });

    it("should include year information in period labels", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.periodLabel).toContain("2025");
      expect(result.periodLabel).toContain("2024");
    });
  });
});
