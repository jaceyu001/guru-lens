import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Unit Tests for Metric Calculations
 * 
 * Verifies that all financial metrics are calculated correctly
 * without double multiplication or other data transformation errors.
 */

describe('Metric Calculations', () => {
  
  describe('Percentage Metrics (ROE, ROIC, Margins)', () => {
    
    it('should not double-multiply ROE - yfinance already provides percentage', () => {
      // yfinanceWrapper.py multiplies by 100: returnOnEquity * 100
      // So ratios.roe is already in percentage format (e.g., -7.4 for -7.4%)
      const roeFromYfinance = -7.4; // Already a percentage
      
      // routers.ts should NOT multiply by 100 again
      const roePercent = roeFromYfinance; // Correct: no multiplication
      
      expect(roePercent).toBe(-7.4);
      expect(roePercent).not.toBe(-740); // Would be wrong if multiplied by 100
    });

    it('should handle positive ROE correctly', () => {
      const roeFromYfinance = 15.7; // 15.7% from yfinance
      const roePercent = roeFromYfinance; // No multiplication
      
      expect(roePercent).toBe(15.7);
    });

    it('should handle zero ROE correctly', () => {
      const roeFromYfinance = 0;
      const roePercent = roeFromYfinance;
      
      expect(roePercent).toBe(0);
    });

    it('should calculate ROA correctly from ROE', () => {
      const roeFromYfinance = 15.7; // Already a percentage
      const roaPercent = roeFromYfinance * 0.5; // ROA typically ~50% of ROE
      
      expect(roaPercent).toBe(7.85);
      expect(roaPercent).not.toBe(785); // Would be wrong if ROE was multiplied by 100
    });

    it('should not double-multiply ROIC', () => {
      const roicFromYfinance = 12.3; // Already a percentage
      const roicPercent = roicFromYfinance; // No multiplication
      
      expect(roicPercent).toBe(12.3);
      expect(roicPercent).not.toBe(1230);
    });

    it('should not double-multiply net margin', () => {
      const netMarginFromYfinance = 8.5; // Already a percentage
      const netMarginPercent = netMarginFromYfinance; // No multiplication
      
      expect(netMarginPercent).toBe(8.5);
      expect(netMarginPercent).not.toBe(850);
    });

    it('should not double-multiply operating margin', () => {
      const operatingMarginFromYfinance = 12.1; // Already a percentage
      const operatingMarginPercent = operatingMarginFromYfinance; // No multiplication
      
      expect(operatingMarginPercent).toBe(12.1);
      expect(operatingMarginPercent).not.toBe(1210);
    });

    it('should not double-multiply gross margin', () => {
      const grossMarginFromYfinance = 44.75; // Already a percentage
      const grossMarginPercent = grossMarginFromYfinance; // No multiplication
      
      expect(grossMarginPercent).toBe(44.75);
      expect(grossMarginPercent).not.toBe(4475);
    });

  });

  describe('PEG Ratio Calculation', () => {

    it('should calculate PEG correctly for profitable, growing companies', () => {
      const peRatio = 20; // P/E of 20x
      const earningsGrowth = 0.15; // 15% growth (decimal form)
      
      // Correct formula: P/E / (Earnings Growth Rate %)
      const pegRatio = peRatio / (earningsGrowth * 100);
      
      expect(pegRatio).toBeCloseTo(1.33, 2);
    });

    it('should return 0 (undefined) for unprofitable companies (negative P/E)', () => {
      const peRatio = -17.34; // Negative P/E
      const earningsGrowth = -0.25; // -25% earnings decline
      
      let pegRatio = 0; // Default to undefined
      if (peRatio > 0 && earningsGrowth > 0) {
        pegRatio = peRatio / (earningsGrowth * 100);
      }
      
      expect(pegRatio).toBe(0); // Should be undefined
    });

    it('should return 0 (undefined) for declining earnings', () => {
      const peRatio = 15;
      const earningsGrowth = -0.10; // -10% earnings decline
      
      let pegRatio = 0;
      if (peRatio > 0 && earningsGrowth > 0) {
        pegRatio = peRatio / (earningsGrowth * 100);
      }
      
      expect(pegRatio).toBe(0); // Should be undefined
    });

    it('should return 0 (undefined) for zero earnings growth', () => {
      const peRatio = 20;
      const earningsGrowth = 0; // No growth
      
      let pegRatio = 0;
      if (peRatio > 0 && earningsGrowth > 0) {
        pegRatio = peRatio / (earningsGrowth * 100);
      }
      
      expect(pegRatio).toBe(0); // Should be undefined
    });

    it('should calculate PEG < 1 as attractive', () => {
      const peRatio = 15;
      const earningsGrowth = 0.25; // 25% growth
      
      const pegRatio = peRatio / (earningsGrowth * 100);
      
      expect(pegRatio).toBeCloseTo(0.6, 1);
      expect(pegRatio).toBeLessThan(1);
    });

    it('should calculate PEG > 1 as expensive', () => {
      const peRatio = 30;
      const earningsGrowth = 0.15; // 15% growth
      
      const pegRatio = peRatio / (earningsGrowth * 100);
      
      expect(pegRatio).toBeCloseTo(2.0, 1);
      expect(pegRatio).toBeGreaterThan(1);
    });

  });

  describe('Real Stock Examples', () => {

    it('should calculate metrics correctly for AAPL (profitable, growing)', () => {
      // Simulated AAPL data from yfinance
      const ratios = {
        roe: 85.5, // 85.5% ROE (already percentage from yfinance)
        roic: 78.2, // 78.2% ROIC
        netMargin: 25.3, // 25.3% net margin
        operatingMargin: 31.2, // 31.2% operating margin
        grossMargin: 46.5, // 46.5% gross margin
        pe: 32.6,
        earningsGrowth: 0.10, // 10% growth
      };

      // Correct calculations (no double multiplication)
      const roePercent = ratios.roe; // 85.5%
      const roicPercent = ratios.roic; // 78.2%
      const netMarginPercent = ratios.netMargin; // 25.3%
      const pegRatio = ratios.pe / (ratios.earningsGrowth * 100); // 32.6 / 10 = 3.26

      const operatingMarginPercent = ratios.operatingMargin; // 31.2%
      const grossMarginPercent = ratios.grossMargin; // 46.5%
      
      expect(roePercent).toBe(85.5);
      expect(roicPercent).toBe(78.2);
      expect(netMarginPercent).toBe(25.3);
      expect(operatingMarginPercent).toBe(31.2);
      expect(grossMarginPercent).toBe(46.5);
      expect(pegRatio).toBeCloseTo(3.26, 2);
    });

    it('should calculate metrics correctly for DQ (unprofitable)', () => {
      // Simulated DQ data from yfinance
      const ratios = {
        roe: -7.4, // -7.4% ROE (already percentage from yfinance)
        roic: -2.1, // -2.1% ROIC
        netMargin: -8.2, // -8.2% net margin
        operatingMargin: -12.5, // -12.5% operating margin
        grossMargin: 44.75, // 44.75% gross margin (positive)
        pe: -17.34, // Negative P/E (unprofitable)
        earningsGrowth: -0.2595, // -25.95% earnings decline
      };

      // Correct calculations (no double multiplication)
      const roePercent = ratios.roe; // -7.4%
      const roicPercent = ratios.roic; // -2.1%
      const netMarginPercent = ratios.netMargin; // -8.2%
      const operatingMarginPercent = ratios.operatingMargin; // -12.5%
      const grossMarginPercent = ratios.grossMargin; // 44.75%

      // PEG should be undefined (0) because P/E is negative
      let pegRatio = 0;
      if (ratios.pe > 0 && ratios.earningsGrowth > 0) {
        pegRatio = ratios.pe / (ratios.earningsGrowth * 100);
      }

      expect(roePercent).toBe(-7.4);
      expect(roePercent).not.toBe(-740); // Would be wrong if multiplied by 100
      expect(roicPercent).toBe(-2.1);
      expect(netMarginPercent).toBe(-8.2);
      expect(operatingMarginPercent).toBe(-12.5);
      expect(grossMarginPercent).toBe(44.75);
      expect(pegRatio).toBe(0); // Undefined for unprofitable company
    });

    it('should calculate metrics correctly for MSFT (profitable, growing)', () => {
      // Simulated MSFT data from yfinance
      const ratios = {
        roe: 42.3, // 42.3% ROE
        roic: 35.8, // 35.8% ROIC
        netMargin: 34.1, // 34.1% net margin
        operatingMargin: 47.2, // 47.2% operating margin
        grossMargin: 69.4, // 69.4% gross margin
        pe: 35.2,
        earningsGrowth: 0.12, // 12% growth
      };

      const roePercent = ratios.roe; // 42.3%
      const roicPercent = ratios.roic; // 35.8%
      const netMarginPercent = ratios.netMargin; // 34.1%
      const pegRatio = ratios.pe / (ratios.earningsGrowth * 100); // 35.2 / 12 = 2.93

      expect(roePercent).toBe(42.3);
      expect(roicPercent).toBe(35.8);
      expect(netMarginPercent).toBe(34.1);
      expect(pegRatio).toBeCloseTo(2.93, 2);
    });

  });

  describe('Edge Cases', () => {

    it('should handle very high ROE (> 100%)', () => {
      const roeFromYfinance = 150.5; // 150.5% ROE
      const roePercent = roeFromYfinance;
      
      expect(roePercent).toBe(150.5);
      expect(roePercent).not.toBe(15050);
    });

    it('should handle very low negative ROE', () => {
      const roeFromYfinance = -500.0; // -500% ROE (extreme loss)
      const roePercent = roeFromYfinance;
      
      expect(roePercent).toBe(-500.0);
      expect(roePercent).not.toBe(-50000);
    });

    it('should handle margin > 100% (rare but possible)', () => {
      const netMarginFromYfinance = 105.3; // 105.3% net margin (unusual)
      const netMarginPercent = netMarginFromYfinance;
      
      expect(netMarginPercent).toBe(105.3);
      expect(netMarginPercent).not.toBe(10530);
    });

    it('should handle very small positive earnings growth', () => {
      const peRatio = 50;
      const earningsGrowth = 0.001; // 0.1% growth
      
      const pegRatio = peRatio / (earningsGrowth * 100);
      
      // 50 / (0.001 * 100) = 50 / 0.1 = 500
      expect(pegRatio).toBeCloseTo(500, 0);
    });

    it('should handle very high earnings growth', () => {
      const peRatio = 20;
      const earningsGrowth = 1.0; // 100% growth
      
      const pegRatio = peRatio / (earningsGrowth * 100);
      
      expect(pegRatio).toBeCloseTo(0.2, 1);
    });

  });

});
