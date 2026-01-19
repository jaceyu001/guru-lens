/**
 * TTM Calculation Verification Tests
 * 
 * Tests to verify that growthCalculator correctly computes TTM values
 * from quarterly financial data
 */

import { describe, it, expect } from "vitest";
import { calculateGrowth } from "./growthCalculator";
import { detectDataAvailability } from "./dataAvailabilityDetector";
import {
  biduQ3Fixture,
  aaplQ4Fixture,
  msftQ1Fixture,
  expectedTTMValues,
} from "./growthCalculator.fixtures";

describe("growthCalculator - TTM Calculations", () => {
  describe("BIDU Q3 2025 Scenario (3 quarters available)", () => {
    it("should correctly detect TTM_VS_FY comparison type", () => {
      const availability = detectDataAvailability(
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(availability.comparisonType).toBe("TTM_VS_FY");
      expect(availability.ttmAvailable).toBe(true);
      expect(availability.latestQuarter).toBe("2025-Q3");
    });

    it("should calculate TTM revenue correctly (sum of last 4 quarters)", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.bidu.revenue);
      expect(result.comparisonType).toBe("TTM_VS_FY");
    });

    it("should calculate TTM net income correctly", () => {
      const result = calculateGrowth(
        "netIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.bidu.netIncome);
    });

    it("should calculate TTM operating income correctly", () => {
      const result = calculateGrowth(
        "operatingIncome",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.bidu.operatingIncome);
    });

    it("should calculate TTM free cash flow correctly", () => {
      const result = calculateGrowth(
        "freeCashFlow",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.bidu.freeCashFlow);
    });

    it("should include period labels in result", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.periodLabel).toContain("2025 TTM");
      expect(result.periodLabel).toContain("2024 FY");
    });

    it("should include data quality flags", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags).toBeDefined();
      expect(result.dataQualityFlags.ttmPartial).toBe(true); // Only 3 quarters
      expect(result.dataQualityFlags.q1Only).toBe(false);
    });
  });

  describe("AAPL Q4 2024 Scenario (Full year available)", () => {
    it("should correctly detect TTM_VS_FY comparison type", () => {
      const availability = detectDataAvailability(
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(availability.comparisonType).toBe("TTM_VS_FY");
      expect(availability.ttmAvailable).toBe(true);
      expect(availability.latestQuarter).toBe("2024-Q4");
    });

    it("should calculate TTM revenue correctly (equals full year)", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.aapl.revenue);
      // TTM should equal 2024 FY when Q4 is latest
      expect(result.ttmValue).toBe(aaplQ4Fixture.financials[0].revenue);
    });

    it("should calculate TTM net income correctly", () => {
      const result = calculateGrowth(
        "netIncome",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.aapl.netIncome);
      expect(result.ttmValue).toBe(aaplQ4Fixture.financials[0].netIncome);
    });

    it("should mark TTM as complete (4 quarters)", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.dataQualityFlags.ttmPartial).toBe(false);
      expect(result.dataQualityFlags.ttmComplete).toBe(true);
    });

    it("should include complete year period label", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.periodLabel).toContain("2024 TTM");
      expect(result.periodLabel).toContain("2023 FY");
    });
  });

  describe("MSFT Q1 2025 Scenario (Q1 only available)", () => {
    it("should correctly detect FY_VS_FY comparison type", () => {
      const availability = detectDataAvailability(
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(availability.comparisonType).toBe("FY_VS_FY");
      expect(availability.ttmAvailable).toBe(false);
      expect(availability.latestQuarter).toBe("2025-Q1");
    });

    it("should use prior FY values when only Q1 available", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.comparisonType).toBe("FY_VS_FY");
      // Should use 2024 FY value, not TTM
      expect(result.currentValue).toBe(msftQ1Fixture.financials[0].revenue);
    });

    it("should set q1Only flag when only Q1 available", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.dataQualityFlags.q1Only).toBe(true);
      expect(result.dataQualityFlags.ttmAvailable).toBe(false);
    });

    it("should include FY vs FY period label", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.periodLabel).toContain("2024 FY");
      expect(result.periodLabel).toContain("2023 FY");
    });
  });

  describe("TTM Calculation Edge Cases", () => {
    it("should handle missing quarters gracefully", () => {
      // Remove Q2 from BIDU fixture
      const incompleteQuarters = biduQ3Fixture.quarterlyFinancials.filter(
        (q) => q.quarter !== "2025-Q2"
      );

      const result = calculateGrowth(
        "revenue",
        incompleteQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.ttmPartial).toBe(true);
      expect(result.dataQualityFlags.missingQuarters).toBe(true);
    });

    it("should handle zero values in quarters", () => {
      const quartersWithZero = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, revenue: 0 } : q
      );

      const result = calculateGrowth(
        "revenue",
        quartersWithZero,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBeDefined();
      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should handle negative values in quarters", () => {
      const quartersWithNegative = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, netIncome: -1000000000 } : q
      );

      const result = calculateGrowth(
        "netIncome",
        quartersWithNegative,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });
  });

  describe("TTM Precision and Accuracy", () => {
    it("should calculate TTM within acceptable tolerance", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const tolerance = 0.01; // 0.01% tolerance
      const expectedValue = expectedTTMValues.bidu.revenue;
      const difference = Math.abs(result.ttmValue - expectedValue);
      const percentDifference = (difference / expectedValue) * 100;

      expect(percentDifference).toBeLessThan(tolerance);
    });

    it("should maintain precision with large numbers", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      // AAPL has large revenue numbers (billions)
      expect(result.ttmValue).toBe(expectedTTMValues.aapl.revenue);
      expect(Number.isFinite(result.ttmValue)).toBe(true);
    });

    it("should maintain precision with small numbers", () => {
      const result = calculateGrowth(
        "freeCashFlow",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBe(expectedTTMValues.bidu.freeCashFlow);
      expect(Number.isFinite(result.ttmValue)).toBe(true);
    });
  });
});
