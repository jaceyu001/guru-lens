import { describe, it, expect } from 'vitest';
import {
  detectDataAvailability,
  determineComparisonType,
  getDataQualityFlags,
} from './dataAvailabilityDetector';

describe('dataAvailabilityDetector', () => {
  describe('detectDataAvailability', () => {
    it('should detect Q2 2025 with TTM available', () => {
      const financialData = {
        financials: [
          { fiscalYear: 2024, revenue: 134.6e9 },
          { fiscalYear: 2023, revenue: 126.0e9 },
        ],
        quarterlyFinancials: [
          { period: '2025-06-30', revenue: 32.71e9 }, // Q2 2025
          { period: '2025-03-31', revenue: 32.45e9 }, // Q1 2025
          { period: '2024-12-31', revenue: 34.12e9 }, // Q4 2024
          { period: '2024-09-30', revenue: 31.45e9 }, // Q3 2024
        ],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestAnnualYear).toBe(2024);
      expect(result.latestQuarterlyYear).toBe(2025);
      expect(result.latestQuarterlyQ).toBe('Q2');
      expect(result.ttmAvailable).toBe(true);
      expect(result.ttmYear).toBe(2025);
      expect(result.currentYearQuartersCount).toBe(2);
      expect(result.quartersAvailable).toEqual(['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3']);
    });

    it('should detect Q1 2025 with TTM not available', () => {
      const financialData = {
        financials: [
          { fiscalYear: 2024, revenue: 134.6e9 },
          { fiscalYear: 2023, revenue: 126.0e9 },
        ],
        quarterlyFinancials: [
          { period: '2025-03-31', revenue: 32.45e9 }, // Q1 2025 only
          { period: '2024-12-31', revenue: 34.12e9 }, // Q4 2024
          { period: '2024-09-30', revenue: 31.45e9 }, // Q3 2024
          { period: '2024-06-30', revenue: 32.71e9 }, // Q2 2024
        ],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestQuarterlyYear).toBe(2025);
      expect(result.latestQuarterlyQ).toBe('Q1');
      expect(result.ttmAvailable).toBe(false);
      expect(result.ttmYear).toBe(2024); // Falls back to previous year
      expect(result.currentYearQuartersCount).toBe(1);
    });

    it('should detect Q4 2024 (full year) with TTM available', () => {
      const financialData = {
        financials: [
          { fiscalYear: 2024, revenue: 133.125e9 },
          { fiscalYear: 2023, revenue: 134.598e9 },
        ],
        quarterlyFinancials: [
          { period: '2024-12-31', revenue: 34.12e9 }, // Q4 2024
          { period: '2024-09-30', revenue: 31.45e9 }, // Q3 2024
          { period: '2024-06-30', revenue: 32.71e9 }, // Q2 2024
          { period: '2024-03-31', revenue: 32.45e9 }, // Q1 2024
        ],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestQuarterlyYear).toBe(2024);
      expect(result.latestQuarterlyQ).toBe('Q4');
      expect(result.ttmAvailable).toBe(true);
      expect(result.ttmYear).toBe(2024);
      expect(result.currentYearQuartersCount).toBe(4);
    });

    it('should handle missing quarterly data', () => {
      const financialData = {
        financials: [
          { fiscalYear: 2024, revenue: 134.6e9 },
          { fiscalYear: 2023, revenue: 126.0e9 },
        ],
        quarterlyFinancials: [],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestQuarterlyYear).toBe(2024);
      expect(result.latestQuarterlyQ).toBe('Q1');
      expect(result.ttmAvailable).toBe(false);
      expect(result.quartersAvailable).toEqual([]);
    });

    it('should handle missing annual data', () => {
      const financialData = {
        financials: [],
        quarterlyFinancials: [
          { period: '2025-06-30', revenue: 32.71e9 },
          { period: '2025-03-31', revenue: 32.45e9 },
        ],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestAnnualYear).toBe(new Date().getFullYear() - 1);
      expect(result.latestQuarterlyYear).toBe(2025);
      expect(result.latestQuarterlyQ).toBe('Q2');
    });

    it('should detect Q3 2025 with TTM available', () => {
      const financialData = {
        financials: [
          { fiscalYear: 2024, revenue: 134.6e9 },
        ],
        quarterlyFinancials: [
          { period: '2025-09-30', revenue: 31.17e9 }, // Q3 2025
          { period: '2025-06-30', revenue: 32.71e9 }, // Q2 2025
          { period: '2025-03-31', revenue: 32.45e9 }, // Q1 2025
          { period: '2024-12-31', revenue: 34.12e9 }, // Q4 2024
        ],
      };

      const result = detectDataAvailability(financialData);

      expect(result.latestQuarterlyQ).toBe('Q3');
      expect(result.ttmAvailable).toBe(true);
      expect(result.currentYearQuartersCount).toBe(3);
    });
  });

  describe('determineComparisonType', () => {
    it('should use TTM_VS_FY when Q2+ and TTM available', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2025,
        latestQuarterlyQ: 'Q2' as const,
        quartersAvailable: ['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3'],
        ttmAvailable: true,
        ttmYear: 2025,
        currentYearQuartersCount: 2,
      };

      const result = determineComparisonType(availability);

      expect(result.type).toBe('TTM_VS_FY');
      expect(result.currentPeriod).toBe('2025 TTM');
      expect(result.priorPeriod).toBe('2024 FY');
    });

    it('should use FY_VS_FY when Q1 only', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2025,
        latestQuarterlyQ: 'Q1' as const,
        quartersAvailable: ['2025-Q1', '2024-Q4', '2024-Q3', '2024-Q2'],
        ttmAvailable: false,
        ttmYear: 2024,
        currentYearQuartersCount: 1,
      };

      const result = determineComparisonType(availability);

      expect(result.type).toBe('FY_VS_FY');
      expect(result.currentPeriod).toBe('2024 FY');
      expect(result.priorPeriod).toBe('2023 FY');
    });

    it('should use TTM_VS_FY when Q3 and TTM available', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2025,
        latestQuarterlyQ: 'Q3' as const,
        quartersAvailable: ['2025-Q3', '2025-Q2', '2025-Q1', '2024-Q4'],
        ttmAvailable: true,
        ttmYear: 2025,
        currentYearQuartersCount: 3,
      };

      const result = determineComparisonType(availability);

      expect(result.type).toBe('TTM_VS_FY');
      expect(result.currentPeriod).toBe('2025 TTM');
      expect(result.priorPeriod).toBe('2024 FY');
    });

    it('should use TTM_VS_FY when Q4 (full year)', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2024,
        latestQuarterlyQ: 'Q4' as const,
        quartersAvailable: ['2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1'],
        ttmAvailable: true,
        ttmYear: 2024,
        currentYearQuartersCount: 4,
      };

      const result = determineComparisonType(availability);

      expect(result.type).toBe('TTM_VS_FY');
      expect(result.currentPeriod).toBe('2024 TTM');
      expect(result.priorPeriod).toBe('2023 FY');
    });
  });

  describe('getDataQualityFlags', () => {
    it('should flag Q1 only', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2025,
        latestQuarterlyQ: 'Q1' as const,
        quartersAvailable: ['2025-Q1'],
        ttmAvailable: false,
        ttmYear: 2024,
        currentYearQuartersCount: 1,
      };

      const flags = getDataQualityFlags(availability);

      expect(flags.onlyQ1Available).toBe(true);
      expect(flags.ttmNotAvailable).toBe(true);
      expect(flags.singleQuarterAvailable).toBe(true);
    });

    it('should not flag Q2+ with TTM available', () => {
      const availability = {
        latestAnnualYear: 2024,
        latestAnnualComplete: true,
        latestQuarterlyYear: 2025,
        latestQuarterlyQ: 'Q2' as const,
        quartersAvailable: ['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3'],
        ttmAvailable: true,
        ttmYear: 2025,
        currentYearQuartersCount: 2,
      };

      const flags = getDataQualityFlags(availability);

      expect(flags.onlyQ1Available).toBe(false);
      expect(flags.ttmNotAvailable).toBe(false);
      expect(flags.singleQuarterAvailable).toBe(false);
    });
  });
});
