import { describe, it, expect } from "vitest";
import {
  calculateROIC,
  calculatePayoutRatio,
  calculateDividendGrowth,
  calculateDerivedMetricsForPeriod,
} from "./derivedMetricsCalculator";

describe("Derived Metrics Calculator", () => {
  describe("calculateROIC", () => {
    it("should calculate ROIC correctly with valid data", () => {
      // JNJ example: Operating Income = $25.6B, Total Assets = $200B, Current Liabilities = $50B
      const result = calculateROIC(25600, 200000, 50000, 0.15);
      
      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
      
      // Manual calculation:
      // NOPAT = 25600 * (1 - 0.15) = 21760
      // Invested Capital = 200000 - 50000 = 150000
      // ROIC = (21760 / 150000) * 100 = 14.51%
      expect(result.roic).toBeCloseTo(14.51, 1);
    });

    it("should return null when operating income is zero", () => {
      const result = calculateROIC(0, 200000, 50000, 0.15);
      
      expect(result.roic).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("Operating income is zero or missing");
    });

    it("should return null when total assets is zero", () => {
      const result = calculateROIC(25600, 0, 50000, 0.15);
      
      expect(result.roic).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("Total assets is zero or missing");
    });

    it("should handle missing current liabilities gracefully", () => {
      const result = calculateROIC(25600, 200000, 0, 0.15);
      
      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.9); // Lower confidence
      expect(result.notes).toContain("Current liabilities is zero or missing");
    });

    it("should handle negative operating income", () => {
      const result = calculateROIC(-5000, 200000, 50000, 0.15);
      
      // Negative NOPAT should result in negative ROIC
      expect(result.roic).toBeLessThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should flag extreme ROIC values", () => {
      // Very small invested capital leading to extreme ROIC
      const result = calculateROIC(25600, 200000, 199000, 0.15);
      
      expect(result.roic).toBeDefined();
      if (result.roic && result.roic > 500) {
        expect(result.confidence).toBeLessThan(0.9);
        expect(result.notes.some(n => n.includes("extreme"))).toBe(true);
      }
    });
  });

  describe("calculatePayoutRatio", () => {
    it("should calculate payout ratio correctly with valid data", () => {
      // JNJ example: DPS = $5.14, EPS = $11.02
      const result = calculatePayoutRatio(5.14, 11.02);
      
      expect(result.payoutRatio).toBeDefined();
      expect(result.payoutRatio).toBeGreaterThan(0);
      expect(result.payoutRatio).toBeLessThan(100);
      expect(result.confidence).toBeGreaterThan(0.9);
      
      // Manual calculation: (5.14 / 11.02) * 100 = 46.6%
      expect(result.payoutRatio).toBeCloseTo(46.6, 1);
      
      // Retention ratio should be 100 - payout
      expect(result.retentionRatio).toBeCloseTo(53.4, 1);
    });

    it("should return 0 payout ratio when company doesn't pay dividends", () => {
      const result = calculatePayoutRatio(0, 11.02);
      
      expect(result.payoutRatio).toBe(0);
      expect(result.retentionRatio).toBe(100);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.notes).toContain("Company does not pay dividends");
    });

    it("should return null when dividend data is missing", () => {
      const result = calculatePayoutRatio(null, 11.02);
      
      expect(result.payoutRatio).toBeNull();
      expect(result.retentionRatio).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("Dividend per share is not available");
    });

    it("should return null when EPS is zero", () => {
      const result = calculatePayoutRatio(5.14, 0);
      
      expect(result.payoutRatio).toBeNull();
      expect(result.retentionRatio).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("EPS is zero or missing");
    });

    it("should return null when EPS is negative", () => {
      const result = calculatePayoutRatio(5.14, -2.0);
      
      expect(result.payoutRatio).toBeNull();
      expect(result.retentionRatio).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("EPS is negative");
    });

    it("should flag unsustainable payout ratio (>100%)", () => {
      // Company paying out more than it earns
      const result = calculatePayoutRatio(15.0, 10.0);
      
      expect(result.payoutRatio).toBeCloseTo(150, 0);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.notes.some(n => n.includes("exceeds 100%"))).toBe(true);
    });

    it("should handle very small EPS values", () => {
      const result = calculatePayoutRatio(0.5, 0.01);
      
      expect(result.payoutRatio).toBeCloseTo(5000, 0); // 5000%
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe("calculateDividendGrowth", () => {
    it("should calculate dividend growth correctly", () => {
      // Example: DPS grew from $4.50 to $5.14
      const result = calculateDividendGrowth(5.14, 4.50);
      
      expect(result.growth).toBeDefined();
      expect(result.growth).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
      
      // Manual: ((5.14 - 4.50) / 4.50) * 100 = 14.2%
      expect(result.growth).toBeCloseTo(14.2, 1);
    });

    it("should handle dividend cuts (negative growth)", () => {
      const result = calculateDividendGrowth(4.0, 5.0);
      
      expect(result.growth).toBeLessThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
      
      // Manual: ((4.0 - 5.0) / 5.0) * 100 = -20%
      expect(result.growth).toBeCloseTo(-20, 1);
    });

    it("should return null when current DPS is missing", () => {
      const result = calculateDividendGrowth(null, 4.50);
      
      expect(result.growth).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it("should return null when previous DPS is missing", () => {
      const result = calculateDividendGrowth(5.14, null);
      
      expect(result.growth).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it("should return null when previous DPS is zero", () => {
      const result = calculateDividendGrowth(5.14, 0);
      
      expect(result.growth).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain("Previous dividend was zero");
    });

    it("should flag extreme dividend growth", () => {
      // Dividend increased 10x
      const result = calculateDividendGrowth(50.0, 5.0);
      
      expect(result.growth).toBeCloseTo(900, 0);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.notes.some(n => n.includes("extreme"))).toBe(true);
    });
  });

  describe("calculateDerivedMetricsForPeriod", () => {
    it("should calculate all metrics for a period", () => {
      // JNJ-like data
      const result = calculateDerivedMetricsForPeriod(
        25600, // Operating Income
        200000, // Total Assets
        50000, // Current Liabilities
        5.14, // Dividend Per Share
        11.02, // EPS
        0.15 // Tax Rate
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(0);
      
      expect(result.payoutRatio).toBeDefined();
      expect(result.payoutRatio).toBeGreaterThan(0);
      expect(result.payoutRatio).toBeLessThan(100);
      
      expect(result.retentionRatio).toBeDefined();
      expect(result.retentionRatio).toBeGreaterThan(0);
      
      expect(result.confidence.roic).toBeGreaterThan(0.8);
      expect(result.confidence.payoutRatio).toBeGreaterThan(0.9);
    });

    it("should handle partial data gracefully", () => {
      const result = calculateDerivedMetricsForPeriod(
        25600, // Operating Income
        200000, // Total Assets
        null, // Current Liabilities missing
        5.14, // Dividend Per Share
        11.02, // EPS
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.confidence.roic).toBeLessThan(0.9); // Lower confidence
      
      expect(result.payoutRatio).toBeDefined();
      expect(result.confidence.payoutRatio).toBeGreaterThan(0.9);
    });

    it("should handle zero dividend companies", () => {
      const result = calculateDerivedMetricsForPeriod(
        25600, // Operating Income
        200000, // Total Assets
        50000, // Current Liabilities
        0, // No dividend
        11.02, // EPS
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(0);
      
      expect(result.payoutRatio).toBe(0);
      expect(result.retentionRatio).toBe(100);
    });

    it("should handle unprofitable companies", () => {
      const result = calculateDerivedMetricsForPeriod(
        -5000, // Negative Operating Income
        200000, // Total Assets
        50000, // Current Liabilities
        0, // No dividend
        -1.5, // Negative EPS
        0.15
      );

      expect(result.roic).toBeLessThan(0);
      expect(result.payoutRatio).toBeNull();
      expect(result.notes.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle NaN values", () => {
      const result = calculateROIC(NaN, 200000, 50000, 0.15);
      
      expect(result.roic).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it("should handle Infinity values", () => {
      const result = calculateROIC(Infinity, 200000, 50000, 0.15);
      
      expect(result.roic).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it("should handle very large numbers", () => {
      // Apple-scale numbers (in millions)
      const result = calculateROIC(
        120000, // Operating Income (120B)
        350000, // Total Assets (350B)
        100000, // Current Liabilities (100B)
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should handle very small numbers", () => {
      const result = calculatePayoutRatio(0.001, 0.002);
      
      expect(result.payoutRatio).toBeCloseTo(50, 0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe("Real-World Examples", () => {
    it("should calculate metrics for Apple-like company", () => {
      // AAPL-like: Operating Income $120B, Assets $350B, Current Liabilities $100B, DPS $0.24, EPS $6.05
      const result = calculateDerivedMetricsForPeriod(
        120000,
        350000,
        100000,
        0.24,
        6.05,
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(20); // Apple typically has high ROIC
      
      expect(result.payoutRatio).toBeDefined();
      expect(result.payoutRatio).toBeLessThan(10); // Apple has low payout ratio
      
      expect(result.retentionRatio).toBeGreaterThan(90);
    });

    it("should calculate metrics for utility-like company", () => {
      // Utility-like: Operating Income $10B, Assets $100B, Current Liabilities $20B, DPS $3.50, EPS $5.00
      const result = calculateDerivedMetricsForPeriod(
        10000,
        100000,
        20000,
        3.50,
        5.00,
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeLessThan(15); // Utilities have lower ROIC
      
      expect(result.payoutRatio).toBeDefined();
      expect(result.payoutRatio).toBeGreaterThan(60); // Utilities have high payout
      
      expect(result.retentionRatio).toBeLessThan(40);
    });

    it("should calculate metrics for growth company", () => {
      // Growth company: Operating Income $5B, Assets $50B, Current Liabilities $10B, DPS $0, EPS $2.50
      const result = calculateDerivedMetricsForPeriod(
        5000,
        50000,
        10000,
        0,
        2.50,
        0.15
      );

      expect(result.roic).toBeDefined();
      expect(result.roic).toBeGreaterThan(10);
      
      expect(result.payoutRatio).toBe(0); // No dividend
      expect(result.retentionRatio).toBe(100); // Reinvest all earnings
    });
  });
});
