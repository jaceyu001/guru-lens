/**
 * Edge Cases and Data Quality Tests
 * 
 * Tests for growthCalculator handling of edge cases, missing data,
 * and data quality issues
 */

import { describe, it, expect } from "vitest";
import { calculateGrowth } from "./growthCalculator";
import { detectDataAvailability } from "./dataAvailabilityDetector";
import {
  biduQ3Fixture,
  aaplQ4Fixture,
  msftQ1Fixture,
} from "./growthCalculator.fixtures";

describe("growthCalculator - Edge Cases and Data Quality", () => {
  describe("Missing Quarterly Data", () => {
    it("should handle missing Q2 in middle of year", () => {
      const incompleteQuarters = biduQ3Fixture.quarterlyFinancials.filter(
        (q) => q.quarter !== "2025-Q2"
      );

      const result = calculateGrowth(
        "revenue",
        incompleteQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.missingQuarters).toBe(true);
      expect(result.dataQualityFlags.ttmPartial).toBe(true);
      expect(result.ttmValue).toBeDefined();
    });

    it("should handle only 2 quarters available", () => {
      const twoQuarters = biduQ3Fixture.quarterlyFinancials.slice(0, 2);

      const result = calculateGrowth(
        "revenue",
        twoQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.ttmPartial).toBe(true);
      expect(result.dataQualityFlags.limitedQuarters).toBe(true);
    });

    it("should handle only 1 quarter available", () => {
      const oneQuarter = [biduQ3Fixture.quarterlyFinancials[0]];

      const result = calculateGrowth(
        "revenue",
        oneQuarter,
        biduQ3Fixture.financials
      );

      expect(result.comparisonType).toBe("FY_VS_FY");
      expect(result.dataQualityFlags.q1Only).toBe(true);
    });

    it("should handle empty quarterly data", () => {
      const result = calculateGrowth("revenue", [], biduQ3Fixture.financials);

      expect(result.comparisonType).toBe("INSUFFICIENT_DATA");
      expect(result.dataQualityFlags.insufficientData).toBe(true);
    });
  });

  describe("Anomalous Values", () => {
    it("should flag zero revenue in quarter", () => {
      const anomalousQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, revenue: 0 } : q
      );

      const result = calculateGrowth(
        "revenue",
        anomalousQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should flag negative revenue", () => {
      const anomalousQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, revenue: -1000000000 } : q
      );

      const result = calculateGrowth(
        "revenue",
        anomalousQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should flag negative net income", () => {
      const anomalousQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, netIncome: -5000000000 } : q
      );

      const result = calculateGrowth(
        "netIncome",
        anomalousQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should flag extremely large values", () => {
      const anomalousQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q3"
          ? { ...q, revenue: 1000000000000 } // 1 trillion
          : q
      );

      const result = calculateGrowth(
        "revenue",
        anomalousQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should handle inconsistent quarter ordering", () => {
      // Quarters not in chronological order
      const unorderedQuarters = [
        biduQ3Fixture.quarterlyFinancials[1],
        biduQ3Fixture.quarterlyFinancials[0],
        biduQ3Fixture.quarterlyFinancials[2],
      ];

      const result = calculateGrowth(
        "revenue",
        unorderedQuarters,
        biduQ3Fixture.financials
      );

      // Should still calculate correctly despite ordering
      expect(result.ttmValue).toBeDefined();
    });
  });

  describe("Missing Annual Data", () => {
    it("should handle missing prior year financial data", () => {
      const noPriorYear = [biduQ3Fixture.financials[0]]; // Only 2024 FY

      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        noPriorYear
      );

      expect(result.dataQualityFlags.missingPriorYear).toBe(true);
      expect(result.growthRate).toBe(0); // Cannot calculate growth
    });

    it("should handle empty annual data", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        []
      );

      expect(result.dataQualityFlags.missingPriorYear).toBe(true);
    });

    it("should handle zero prior year revenue", () => {
      const zeroPriorYear = [
        {
          ...biduQ3Fixture.financials[0],
          revenue: 0,
        },
      ];

      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        zeroPriorYear
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
      expect(Number.isFinite(result.growthRate)).toBe(false);
    });
  });

  describe("Data Quality Flags", () => {
    it("should set ttmComplete flag when 4 quarters available", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.dataQualityFlags.ttmComplete).toBe(true);
      expect(result.dataQualityFlags.ttmPartial).toBe(false);
    });

    it("should set ttmPartial flag when < 4 quarters available", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.ttmPartial).toBe(true);
      expect(result.dataQualityFlags.ttmComplete).toBe(false);
    });

    it("should set q1Only flag when only Q1 data available", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.dataQualityFlags.q1Only).toBe(true);
    });

    it("should set insufficientData flag when no quarters available", () => {
      const result = calculateGrowth("revenue", [], biduQ3Fixture.financials);

      expect(result.dataQualityFlags.insufficientData).toBe(true);
    });

    it("should combine multiple flags when multiple issues exist", () => {
      const problematicQuarters = biduQ3Fixture.quarterlyFinancials
        .slice(0, 1)
        .map((q) => ({ ...q, revenue: 0 }));

      const result = calculateGrowth(
        "revenue",
        problematicQuarters,
        []
      );

      expect(result.dataQualityFlags.q1Only).toBe(true);
      expect(result.dataQualityFlags.anomalousValues).toBe(true);
      expect(result.dataQualityFlags.missingPriorYear).toBe(true);
    });
  });

  describe("Boundary Conditions", () => {
    it("should handle year boundary (Q4 to Q1)", () => {
      const yearBoundaryQuarters = [
        biduQ3Fixture.quarterlyFinancials[3], // 2024-Q4
        biduQ3Fixture.quarterlyFinancials[2], // 2025-Q1
      ];

      const result = calculateGrowth(
        "revenue",
        yearBoundaryQuarters,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBeDefined();
      expect(result.dataQualityFlags.ttmPartial).toBe(true);
    });

    it("should handle fiscal year end (Q4)", () => {
      const result = calculateGrowth(
        "revenue",
        aaplQ4Fixture.quarterlyFinancials,
        aaplQ4Fixture.financials
      );

      expect(result.comparisonType).toBe("TTM_VS_FY");
      expect(result.ttmValue).toBe(aaplQ4Fixture.financials[0].revenue);
    });

    it("should handle fiscal year start (Q1)", () => {
      const result = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(result.comparisonType).toBe("FY_VS_FY");
      expect(result.dataQualityFlags.q1Only).toBe(true);
    });
  });

  describe("Data Consistency Checks", () => {
    it("should verify TTM is sum of quarters", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const expectedTTM =
        biduQ3Fixture.quarterlyFinancials[0].revenue +
        biduQ3Fixture.quarterlyFinancials[1].revenue +
        biduQ3Fixture.quarterlyFinancials[2].revenue +
        biduQ3Fixture.quarterlyFinancials[3].revenue;

      expect(result.ttmValue).toBe(expectedTTM);
    });

    it("should verify growth rate formula", () => {
      const result = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const expectedGrowth =
        ((result.ttmValue - result.currentValue) / result.currentValue) * 100;

      expect(Math.abs(result.growthRate - expectedGrowth)).toBeLessThan(0.01);
    });

    it("should ensure period labels match comparison type", () => {
      const ttmResult = calculateGrowth(
        "revenue",
        biduQ3Fixture.quarterlyFinancials,
        biduQ3Fixture.financials
      );

      const fyResult = calculateGrowth(
        "revenue",
        msftQ1Fixture.quarterlyFinancials,
        msftQ1Fixture.financials
      );

      expect(ttmResult.periodLabel).toContain("TTM");
      expect(fyResult.periodLabel).not.toContain("TTM");
    });
  });

  describe("Metric-Specific Edge Cases", () => {
    it("should handle zero free cash flow", () => {
      const zeroFCFQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, freeCashFlow: 0 } : q
      );

      const result = calculateGrowth(
        "freeCashFlow",
        zeroFCFQuarters,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBeDefined();
      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should handle negative operating income", () => {
      const negativeOpIncomeQuarters = biduQ3Fixture.quarterlyFinancials.map(
        (q) =>
          q.quarter === "2025-Q1"
            ? { ...q, operatingIncome: -1000000000 }
            : q
      );

      const result = calculateGrowth(
        "operatingIncome",
        negativeOpIncomeQuarters,
        biduQ3Fixture.financials
      );

      expect(result.dataQualityFlags.anomalousValues).toBe(true);
    });

    it("should handle very small EPS values", () => {
      const smallEPSQuarters = biduQ3Fixture.quarterlyFinancials.map((q) =>
        q.quarter === "2025-Q1" ? { ...q, eps: 0.001 } : q
      );

      const result = calculateGrowth(
        "eps",
        smallEPSQuarters,
        biduQ3Fixture.financials
      );

      expect(result.ttmValue).toBeDefined();
      expect(Number.isFinite(result.ttmValue)).toBe(true);
    });
  });
});
