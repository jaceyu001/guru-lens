/**
 * Comprehensive tests for balance sheet integration in valuation methods
 * Tests: DCF (real FCF), Comparable (real P/B), Asset-Based (tangible book value)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculateDCF, calculateComparable, calculateAssetBased } from './valuationAgent';
import type { FinancialData, DataQualityFlags } from '../shared/types';

// ============================================================================
// Test Fixtures: Real Financial Data with Balance Sheet
// ============================================================================

const createMockFinancialData = (overrides?: Partial<FinancialData>): FinancialData => ({
  symbol: 'AAPL',
  sharesOutstanding: 16.2, // millions
  price: {
    current: 195.5,
    change: 2.5,
    changePercent: 1.3,
    open: 193.0,
    high: 196.5,
    low: 192.0,
    volume: 52000000,
    timestamp: new Date(),
  },
  profile: {
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc.',
  },
  financials: [
    {
      revenue: 383285000000, // $383.3B
      netIncome: 96995000000, // $97B
      eps: 6.05,
      period: '2024',
      fiscalYear: 2024,
      operatingIncome: 120233000000,
      freeCashFlow: 110543000000, // $110.5B
    },
    {
      revenue: 394328000000,
      netIncome: 99803000000,
      eps: 6.16,
      period: '2023',
      fiscalYear: 2023,
      operatingIncome: 119437000000,
      freeCashFlow: 110543000000,
    },
  ],
  quarterlyFinancials: [
    {
      revenue: 95736000000,
      netIncome: 25104000000,
      eps: 1.55,
      period: '2025-Q1',
      quarter: 'Q1',
      fiscalYear: 2025,
      freeCashFlow: 28000000000,
    },
    {
      revenue: 91494000000,
      netIncome: 23660000000,
      eps: 1.46,
      period: '2024-Q4',
      quarter: 'Q4',
      fiscalYear: 2024,
      freeCashFlow: 27000000000,
    },
  ],
  ratios: {
    pe: 32.3,
    pb: 45.8,
    ps: 8.9,
    roe: 0.95, // 95% ROE
    roic: 0.85,
    debtToEquity: 1.2,
    currentRatio: 0.92,
    grossMargin: 0.46,
    operatingMargin: 0.31,
    netMargin: 0.25,
  },
  balanceSheet: {
    totalAssets: 352755000000, // $352.8B
    totalLiabilities: 279097000000, // $279.1B
    totalEquity: 73658000000, // $73.7B
    bookValuePerShare: 4.55,
    tangibleBookValuePerShare: 3.64,
  },
  ...overrides,
});

const mockDataQualityFlags: DataQualityFlags = {
  debtToEquityAnomalous: false,
  roicZero: false,
  interestCoverageZero: false,
  peNegative: false,
  marketCapZero: false,
  pbAnomalous: false,
  peAnomalous: false,
  roeNegative: false,
  currentRatioAnomalous: false,
  leverageTrend: 'STABLE',
  liquidityTrend: 'STABLE',
  revenueDecline: false,
  earningsCollapse: false,
};

// ============================================================================
// DCF Method Tests: Real FCF Data
// ============================================================================

describe('DCF Valuation with Real FCF Data', () => {
  it('should calculate DCF with real FCF from financials', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateDCF(financialData, mockDataQualityFlags);

    expect(result.name).toBe('DCF');
    expect(result.intrinsicValue).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.5); // Should have reasonable confidence
    expect(result.assessment).toBe('UNDERVALUED' || 'FAIRLY_VALUED' || 'OVERVALUED');
    expect(result.narrative).toContain('DCF');
  });

  it('should use WACC of 9% as hardcoded discount rate', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateDCF(financialData, mockDataQualityFlags);

    // WACC should be reflected in assumptions
    expect(result.assumptions).toBeDefined();
    expect(result.assumptions.wacc).toBe('9.0%');
  });

  it('should extract FCF from quarterly financials for TTM calculation', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateDCF(financialData, mockDataQualityFlags);

    // TTM FCF should be calculated from quarterly data
    expect(result.assumptions.ttmFreeCashFlow).toBeDefined();
    expect(result.narrative).toContain('TTM');
  });

  it('should handle missing FCF gracefully', async () => {
    const financialData = createMockFinancialData({
      financials: [
        {
          revenue: 383285000000,
          netIncome: 96995000000,
          eps: 6.05,
          period: '2024',
          fiscalYear: 2024,
          operatingIncome: 120233000000,
          // freeCashFlow missing
        },
      ],
    });

    const result = await calculateDCF(financialData, mockDataQualityFlags);
    expect(result.assessment).toBe('UNABLE_TO_VALUE');
    expect(result.limitations).toContain('No FCF data available');
  });
});

// ============================================================================
// Comparable Method Tests: Real P/B from Balance Sheet
// ============================================================================

describe('Comparable Valuation with Real P/B', () => {
  it('should calculate P/B using balance sheet data', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateComparable(financialData, mockDataQualityFlags);

    expect(result.name).toBe('Comparable');
    expect(result.intrinsicValue).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.narrative).toContain('P/B');
  });

  it('should use dynamic multiples based on ROE', async () => {
    const financialData = createMockFinancialData({
      ratios: {
        ...createMockFinancialData().ratios,
        roe: 0.95, // 95% ROE - very high
      },
    });

    const result = await calculateComparable(financialData, mockDataQualityFlags);

    // High ROE should result in premium multiples
    expect(result.assumptions.peMultiple).toBeGreaterThan(20);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should apply growth adjustment to multiples', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateComparable(financialData, mockDataQualityFlags);

    // Should have growth adjustment in assumptions
    expect(result.assumptions.growthAdjustment).toBeDefined();
    expect(result.narrative).toContain('growth');
  });

  it('should handle negative ROE with discount', async () => {
    const financialData = createMockFinancialData({
      ratios: {
        ...createMockFinancialData().ratios,
        roe: -0.1, // Negative ROE
      },
    });

    const result = await calculateComparable(financialData, mockDataQualityFlags);

    // Negative ROE should result in lower multiples and confidence
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.narrative).toContain('negative');
  });
});

// ============================================================================
// Asset-Based Method Tests: Balance Sheet Data
// ============================================================================

describe('Asset-Based Valuation with Balance Sheet', () => {
  it('should calculate intrinsic value using tangible book value', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateAssetBased(financialData, mockDataQualityFlags);

    expect(result.name).toBe('AssetBased');
    expect(result.intrinsicValue).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.narrative).toContain('tangible book value');
  });

  it('should use tangible book value per share from balance sheet', async () => {
    const financialData = createMockFinancialData();
    const result = await calculateAssetBased(financialData, mockDataQualityFlags);

    // Intrinsic value should be close to tangible book value per share
    const expectedValue = (financialData.balanceSheet?.tangibleBookValuePerShare || 0);
    expect(Math.abs(result.intrinsicValue - expectedValue) / expectedValue).toBeLessThan(0.1);
  });

  it('should adjust confidence based on ROE', async () => {
    const highROEData = createMockFinancialData({
      ratios: {
        ...createMockFinancialData().ratios,
        roe: 0.25, // 25% ROE - very strong
      },
    });

    const result = await calculateAssetBased(highROEData, mockDataQualityFlags);
    expect(result.confidence).toBeGreaterThan(0.6); // Higher confidence for strong ROE
  });

  it('should return UNABLE_TO_VALUE for negative equity', async () => {
    const financialData = createMockFinancialData({
      balanceSheet: {
        totalAssets: 100000000000,
        totalLiabilities: 150000000000, // Greater than assets
        totalEquity: -50000000000, // Negative equity
        bookValuePerShare: -3.09,
        tangibleBookValuePerShare: -2.47,
      },
    });

    const result = await calculateAssetBased(financialData, mockDataQualityFlags);
    expect(result.assessment).toBe('UNABLE_TO_VALUE');
    expect(result.limitations).toContain('Negative equity');
  });

  it('should handle missing balance sheet data', async () => {
    const financialData = createMockFinancialData({
      balanceSheet: undefined,
    });

    const result = await calculateAssetBased(financialData, mockDataQualityFlags);
    expect(result.assessment).toBe('UNABLE_TO_VALUE');
    expect(result.limitations).toContain('No balance sheet data');
  });

  it('should calculate upside based on intrinsic value vs current price', async () => {
    const financialData = createMockFinancialData({
      price: {
        current: 50, // Low price relative to book value
        change: 0,
        changePercent: 0,
        open: 50,
        high: 50,
        low: 50,
        volume: 0,
        timestamp: new Date(),
      },
    });

    const result = await calculateAssetBased(financialData, mockDataQualityFlags);
    expect(result.upside).toBeGreaterThan(0); // Should show upside
    expect(result.assessment).toBe('UNDERVALUED');
  });
});

// ============================================================================
// Integration Tests: All Methods with Real Data
// ============================================================================

describe('Valuation Methods Integration', () => {
  it('should handle high-quality financial data across all methods', async () => {
    const financialData = createMockFinancialData();

    const dcfResult = await calculateDCF(financialData, mockDataQualityFlags);
    const comparableResult = await calculateComparable(financialData, mockDataQualityFlags);
    const assetBasedResult = await calculateAssetBased(financialData, mockDataQualityFlags);

    // All should return valid results
    expect(dcfResult.intrinsicValue).toBeGreaterThan(0);
    expect(comparableResult.intrinsicValue).toBeGreaterThan(0);
    expect(assetBasedResult.intrinsicValue).toBeGreaterThan(0);

    // All should have reasonable confidence
    expect(dcfResult.confidence).toBeGreaterThan(0.3);
    expect(comparableResult.confidence).toBeGreaterThan(0.3);
    expect(assetBasedResult.confidence).toBeGreaterThan(0.3);
  });

  it('should provide consistent narratives with period information', async () => {
    const financialData = createMockFinancialData();

    const dcfResult = await calculateDCF(financialData, mockDataQualityFlags);
    const comparableResult = await calculateComparable(financialData, mockDataQualityFlags);
    const assetBasedResult = await calculateAssetBased(financialData, mockDataQualityFlags);

    // All narratives should reference comparison periods
    expect(dcfResult.narrative).toContain('TTM' || 'FY');
    expect(comparableResult.narrative).toContain('TTM' || 'FY');
    expect(assetBasedResult.narrative).toContain('TTM' || 'FY');
  });
});
