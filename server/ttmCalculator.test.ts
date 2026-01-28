import { describe, it, expect } from 'vitest';
import {
  calculateTTM,
  calculateGrowthRate,
  getLatestFullYear,
  hasSufficient2025Data,
  getTTMConfidence,
  type FinancialReport,
} from './services/ttmCalculator';

describe('TTM Calculator', () => {
  // Sample 2025 quarterly data
  const sample2025Q3: FinancialReport = {
    fiscalDateEnding: '2025-09-30',
    totalRevenue: 24567000000,
    netIncome: 5678000000,
    operatingIncome: 7456000000,
    operatingCashFlow: 9169000000,
    capitalExpenditures: 788000000,
    grossProfit: 17234000000,
  };

  const sample2025Q2: FinancialReport = {
    fiscalDateEnding: '2025-06-30',
    totalRevenue: 23456000000,
    netIncome: 5234000000,
    operatingIncome: 7123000000,
    operatingCashFlow: 3878000000,
    capitalExpenditures: 1398000000,
    grossProfit: 16456000000,
  };

  const sample2025Q1: FinancialReport = {
    fiscalDateEnding: '2025-03-31',
    totalRevenue: 23876000000,
    netIncome: 5456000000,
    operatingIncome: 7234000000,
    operatingCashFlow: 7123000000,
    capitalExpenditures: 1234000000,
    grossProfit: 16789000000,
  };

  const sample2024Q4: FinancialReport = {
    fiscalDateEnding: '2024-12-31',
    totalRevenue: 23876000000,
    netIncome: 5088000000,
    operatingIncome: 7132000000,
    operatingCashFlow: 8286000000,
    capitalExpenditures: 1234000000,
    grossProfit: 16755000000,
  };

  const sample2024FY: FinancialReport = {
    fiscalDateEnding: '2024-12-31',
    totalRevenue: 95775000000,
    netIncome: 21456000000,
    operatingIncome: 28945000000,
    operatingCashFlow: 28456000000,
    capitalExpenditures: 5234000000,
    grossProfit: 67234000000,
  };

  describe('calculateTTM', () => {
    it('should calculate TTM correctly with 2025 Q1, Q2, Q3 + 2024 Q4', () => {
      const quarterlyReports = [sample2025Q3, sample2025Q2, sample2025Q1, sample2024Q4];
      const ttm = calculateTTM(quarterlyReports);

      // TTM should sum all 4 quarters
      expect(ttm.revenue).toBe(95775000000);
      expect(ttm.netIncome).toBe(21456000000);
      expect(ttm.operatingIncome).toBe(28945000000);
      expect(ttm.operatingCashFlow).toBe(28456000000);
      expect(ttm.freeCashFlow).toBe(28456000000 - (788000000 + 1398000000 + 1234000000 + 1234000000));
      expect(ttm.dataPoints).toBe(4);
    });

    it('should calculate TTM with partial 2025 data', () => {
      const quarterlyReports = [sample2025Q2, sample2025Q1, sample2024Q4];
      const ttm = calculateTTM(quarterlyReports);

      // Should sum available quarters
      expect(ttm.revenue).toBeGreaterThan(0);
      expect(ttm.dataPoints).toBe(3);
    });

    it('should return zero values for empty data', () => {
      const ttm = calculateTTM([]);

      expect(ttm.revenue).toBe(0);
      expect(ttm.netIncome).toBe(0);
      expect(ttm.operatingIncome).toBe(0);
      expect(ttm.operatingCashFlow).toBe(0);
      expect(ttm.dataPoints).toBe(0);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth correctly', () => {
      const ttmValue = 95775000000;
      const fyValue = 93775000000;
      const growth = calculateGrowthRate(ttmValue, fyValue);

      expect(growth).toBeCloseTo(2.13, 1);
    });

    it('should calculate negative growth correctly', () => {
      const ttmValue = 90000000000;
      const fyValue = 95775000000;
      const growth = calculateGrowthRate(ttmValue, fyValue);

      expect(growth).toBeLessThan(0);
    });

    it('should return 0 for zero FY value', () => {
      const growth = calculateGrowthRate(100000000, 0);
      expect(growth).toBe(0);
    });
  });

  describe('hasSufficient2025Data', () => {
    it('should return true with Q1 and Q2 2025 data', () => {
      const quarterlyReports = [sample2025Q2, sample2025Q1, sample2024Q4];
      expect(hasSufficient2025Data(quarterlyReports)).toBe(true);
    });

    it('should return true with all three quarters 2025 data', () => {
      const quarterlyReports = [sample2025Q3, sample2025Q2, sample2025Q1];
      expect(hasSufficient2025Data(quarterlyReports)).toBe(true);
    });

    it('should return false with only Q1 2025 data', () => {
      const quarterlyReports = [sample2025Q1, sample2024Q4];
      expect(hasSufficient2025Data(quarterlyReports)).toBe(false);
    });

    it('should return false with no 2025 data', () => {
      const quarterlyReports = [sample2024Q4];
      expect(hasSufficient2025Data(quarterlyReports)).toBe(false);
    });
  });

  describe('getTTMConfidence', () => {
    it('should return 95 confidence with complete TTM', () => {
      const quarterlyReports = [sample2025Q3, sample2025Q2, sample2025Q1, sample2024Q4];
      const result = getTTMConfidence(quarterlyReports);

      expect(result.confidence).toBe(95);
      expect(result.reason).toContain('Complete TTM');
    });

    it('should return 85 confidence with three quarters 2025', () => {
      const quarterlyReports = [sample2025Q3, sample2025Q2, sample2025Q1];
      const result = getTTMConfidence(quarterlyReports);

      expect(result.confidence).toBe(85);
      expect(result.reason).toContain('Three quarters');
    });

    it('should return 70 confidence with two quarters 2025', () => {
      const quarterlyReports = [sample2025Q2, sample2025Q1, sample2024Q4];
      const result = getTTMConfidence(quarterlyReports);

      expect(result.confidence).toBe(70);
      expect(result.reason).toContain('Two quarters');
    });

    it('should return 50 confidence with only Q1 2025', () => {
      const quarterlyReports = [sample2025Q1, sample2024Q4];
      const result = getTTMConfidence(quarterlyReports);

      expect(result.confidence).toBe(50);
      expect(result.reason).toContain('Only Q1');
    });
  });

  describe('getLatestFullYear', () => {
    it('should return the most recent full year', () => {
      const annualReports = [sample2024FY];
      const result = getLatestFullYear(annualReports);

      expect(result).toEqual(sample2024FY);
    });

    it('should return null for empty data', () => {
      const result = getLatestFullYear([]);
      expect(result).toBeNull();
    });
  });

  describe('TTM vs FY Growth Calculation', () => {
    it('should calculate 2025 TTM vs 2024 FY growth correctly', () => {
      const quarterlyReports = [sample2025Q3, sample2025Q2, sample2025Q1, sample2024Q4];
      const ttm = calculateTTM(quarterlyReports);

      const fyValue = sample2024FY.totalRevenue || 0;
      const growth = calculateGrowthRate(ttm.revenue, fyValue);

      // TTM 2025: 95.775B vs FY 2024: 95.775B = 0% growth
      // (This is expected since our sample data is the same)
      expect(growth).toBeCloseTo(0, 1);
    });
  });
});
