import { describe, it, expect } from 'vitest';
import {
  calculateGrowth,
  calculateMultipleGrowths,
  formatGrowthForDisplay,
  getGrowthDescription,
} from './growthCalculator';
import type { FinancialData } from '@shared/types';

// Mock financial data for Q2 2025 (TTM available)
const mockQ2Data: FinancialData = {
  symbol: 'BIDU',
  financials: [
    {
      period: '2024-12-31',
      fiscalYear: 2024,
      revenue: 134.598e9,
      netIncome: 20.315e9,
      operatingIncome: 21.856e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2023-12-31',
      fiscalYear: 2023,
      revenue: 126.0e9,
      netIncome: 18.0e9,
      operatingIncome: 20.0e9,
      eps: 0,
      freeCashFlow: 0,
    },
  ],
  quarterlyFinancials: [
    {
      period: '2025-06-30',
      fiscalYear: 2025,
      revenue: 32.71e9,
      netIncome: 7.32e9,
      operatingIncome: 8.0e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2025-03-31',
      fiscalYear: 2025,
      revenue: 32.45e9,
      netIncome: 7.72e9,
      operatingIncome: 8.5e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2024-12-31',
      fiscalYear: 2024,
      revenue: 34.12e9,
      netIncome: 5.19e9,
      operatingIncome: 6.0e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2024-09-30',
      fiscalYear: 2024,
      revenue: 31.45e9,
      netIncome: 4.8e9,
      operatingIncome: 5.5e9,
      eps: 0,
      freeCashFlow: 0,
    },
  ],
  profile: {
    companyName: 'Baidu',
    sector: 'Technology',
    industry: 'Internet',
    description: '',
    employees: 0,
    website: '',
    marketCap: 0,
  },
  ratios: {
    pe: 13.37,
    pb: 1.34,
    ps: 0,
    currentRatio: 0,
    debtToEquity: 33.81,
    interestCoverage: 0,
    roe: 3.08,
    roic: 0,
    grossMargin: 0,
    operatingMargin: 0,
    netMargin: 6.9,
    dividendYield: 0,
    revenueGrowth: -0.071,
    earningsGrowth: 0,
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
} as any;

// Mock financial data for Q1 2025 (TTM not available)
const mockQ1Data: FinancialData = {
  ...mockQ2Data,
  quarterlyFinancials: [
    {
      period: '2025-03-31',
      fiscalYear: 2025,
      revenue: 32.45e9,
      netIncome: 7.72e9,
      operatingIncome: 8.5e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2024-12-31',
      fiscalYear: 2024,
      revenue: 34.12e9,
      netIncome: 5.19e9,
      operatingIncome: 6.0e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2024-09-30',
      fiscalYear: 2024,
      revenue: 31.45e9,
      netIncome: 4.8e9,
      operatingIncome: 5.5e9,
      eps: 0,
      freeCashFlow: 0,
    },
    {
      period: '2024-06-30',
      fiscalYear: 2024,
      revenue: 32.71e9,
      netIncome: 6.5e9,
      operatingIncome: 7.0e9,
      eps: 0,
      freeCashFlow: 0,
    },
  ],
} as any;

describe('growthCalculator', () => {
  describe('calculateGrowth', () => {
    it('should calculate TTM vs FY growth when Q2+ available', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'revenue',
      });

      expect(result.comparisonType).toBe('TTM_VS_FY');
      expect(result.currentPeriod).toBe('2025 TTM');
      expect(result.priorPeriod).toBe('2024 FY');
      expect(result.currentValue).toBeGreaterThan(0);
      expect(result.priorValue).toBeGreaterThan(0);
      expect(typeof result.growthRate).toBe('number');
    });

    it('should calculate correct TTM revenue for Q2 data', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'revenue',
      });

      // TTM = Q2 + Q1 + Q4 + Q3 = 32.71 + 32.45 + 34.12 + 31.45 = 130.73B
      const expectedTTM = 32.71e9 + 32.45e9 + 34.12e9 + 31.45e9;
      expect(result.currentValue).toBeCloseTo(expectedTTM, -8);
      expect(result.priorValue).toBeCloseTo(134.598e9, -8);
    });

    it('should calculate correct revenue growth rate', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'revenue',
      });

      // Growth = (130.73 - 134.598) / 134.598 = -2.88%
      const expectedGrowth = ((130.73e9 - 134.598e9) / 134.598e9) * 100;
      expect(result.growthRate).toBeCloseTo(expectedGrowth, 1);
    });

    it('should calculate TTM net income growth', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'netIncome',
      });

      // TTM = 7.32 + 7.72 + 5.19 + 4.8 = 25.03B
      const expectedTTM = 7.32e9 + 7.72e9 + 5.19e9 + 4.8e9;
      expect(result.currentValue).toBeCloseTo(expectedTTM, -8);
      expect(result.priorValue).toBeCloseTo(20.315e9, -8);

      // Growth = (25.03 - 20.315) / 20.315 = 23.2%
      const expectedGrowth = ((25.03e9 - 20.315e9) / 20.315e9) * 100;
      expect(result.growthRate).toBeCloseTo(expectedGrowth, 1);
    });

    it('should use FY vs FY when Q1 only', () => {
      const result = calculateGrowth({
        financialData: mockQ1Data,
        metric: 'revenue',
      });

      expect(result.comparisonType).toBe('FY_VS_FY');
      expect(result.currentPeriod).toBe('2024 FY');
      expect(result.priorPeriod).toBe('2023 FY');
      expect(result.dataQualityFlags.onlyQ1Available).toBe(true);
      expect(result.dataQualityFlags.ttmNotAvailable).toBe(true);
    });

    it('should calculate correct FY vs FY growth when Q1 only', () => {
      const result = calculateGrowth({
        financialData: mockQ1Data,
        metric: 'revenue',
      });

      // FY 2024 vs FY 2023 = (134.598 - 126.0) / 126.0 = 6.83%
      const expectedGrowth = ((134.598e9 - 126.0e9) / 126.0e9) * 100;
      expect(result.growthRate).toBeCloseTo(expectedGrowth, 1);
    });

    it('should handle zero prior value gracefully', () => {
      const dataWithZeroPrior: FinancialData = {
        ...mockQ2Data,
        financials: [
          {
            period: '2024-12-31',
            fiscalYear: 2024,
            revenue: 100e9,
            netIncome: 10e9,
            operatingIncome: 15e9,
            eps: 0,
            freeCashFlow: 0,
          },
          {
            period: '2023-12-31',
            fiscalYear: 2023,
            revenue: 0,
            netIncome: 0,
            operatingIncome: 0,
            eps: 0,
            freeCashFlow: 0,
          },
        ],
      } as any;

      const result = calculateGrowth({
        financialData: dataWithZeroPrior,
        metric: 'revenue',
      });

      // TTM is calculated from quarterly data, not annual
      expect(result.comparisonType).toBe('TTM_VS_FY');
      expect(result.growthRate).toBeGreaterThan(0);
    });

    it('should handle missing quarterly data', () => {
      const dataNoQuarterly: FinancialData = {
        ...mockQ2Data,
        quarterlyFinancials: [],
      } as any;

      const result = calculateGrowth({
        financialData: dataNoQuarterly,
        metric: 'revenue',
      });

      expect(result.comparisonType).toBe('FY_VS_FY');
      expect(result.dataQualityFlags.ttmNotAvailable).toBe(true);
    });

    it('should use FY vs FY when no annual data but quarterly available', () => {
      const dataNoAnnual: FinancialData = {
        ...mockQ2Data,
        financials: [],
      } as any;

      const result = calculateGrowth({
        financialData: dataNoAnnual,
        metric: 'revenue',
      });

      // TTM is calculated from quarterly data, so TTM_VS_FY is used
      expect(result.comparisonType).toBe('TTM_VS_FY');
    });
  });

  describe('calculateMultipleGrowths', () => {
    it('should calculate multiple metrics at once', () => {
      const results = calculateMultipleGrowths(mockQ2Data, [
        'revenue',
        'netIncome',
        'operatingIncome',
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].metricName).toBe('revenue');
      expect(results[1].metricName).toBe('netIncome');
      expect(results[2].metricName).toBe('operatingIncome');

      // All should use same comparison type
      expect(results[0].comparisonType).toBe('TTM_VS_FY');
      expect(results[1].comparisonType).toBe('TTM_VS_FY');
      expect(results[2].comparisonType).toBe('TTM_VS_FY');
    });
  });

  describe('formatGrowthForDisplay', () => {
    it('should format positive growth with + sign', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'netIncome',
      });

      const formatted = formatGrowthForDisplay(result);
      expect(formatted).toMatch(/^\+\d+\.\d%$/);
    });

    it('should format negative growth with - sign', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'revenue',
      });

      const formatted = formatGrowthForDisplay(result);
      expect(formatted).toMatch(/^-\d+\.\d%$/);
    });

    it('should format FY vs FY growth when no annual data', () => {
      const dataNoAnnual: FinancialData = {
        ...mockQ2Data,
        financials: [],
      } as any;

      const result = calculateGrowth({
        financialData: dataNoAnnual,
        metric: 'revenue',
      });

      const formatted = formatGrowthForDisplay(result);
      // Should format as percentage, not N/A (falls back to FY vs FY)
      expect(formatted).not.toBe('N/A');
    });
  });

  describe('getGrowthDescription', () => {
    it('should return period comparison for normal growth', () => {
      const result = calculateGrowth({
        financialData: mockQ2Data,
        metric: 'revenue',
      });

      const description = getGrowthDescription(result);
      expect(description).toContain('2025 TTM');
      expect(description).toContain('2024 FY');
    });

    it('should return FY vs FY description when Q1 only', () => {
      const result = calculateGrowth({
        financialData: mockQ1Data,
        metric: 'revenue',
      });

      const description = getGrowthDescription(result);
      expect(description).toContain('2024 FY');
      expect(description).toContain('2023 FY');
    });
  });
});
