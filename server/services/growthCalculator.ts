/**
 * Growth Calculator Service
 * 
 * Centralized service for calculating growth rates using TTM vs Full Year logic.
 * Intelligently chooses comparison periods based on data availability.
 */

import {
  detectDataAvailability,
  determineComparisonType,
  getDataQualityFlags,
} from './dataAvailabilityDetector';
import type { FinancialData } from '@shared/types';

export type GrowthMetric = 'revenue' | 'netIncome' | 'operatingIncome' | 'freeCashFlow' | 'operatingCashFlow';
export type ComparisonType = 'TTM_VS_FY' | 'FY_VS_FY' | 'INSUFFICIENT_DATA';

export interface GrowthCalculationInput {
  financialData: FinancialData;
  metric: GrowthMetric;
  includeMetadata?: boolean;
}

export interface GrowthCalculationResult {
  growthRate: number; // Percentage
  currentValue: number;
  priorValue: number;
  currentPeriod: string; // "2025 TTM" or "2024 FY"
  priorPeriod: string; // "2024 FY"
  comparisonType: ComparisonType;
  metricName: GrowthMetric;
  dataQualityFlags: {
    onlyQ1Available?: boolean;
    ttmNotAvailable?: boolean;
    negativeComparison?: boolean;
    insufficientData?: boolean;
  };
}

/**
 * Calculate growth rate using TTM vs FY logic
 * 
 * @param input - Growth calculation input with financial data and metric
 * @returns Growth calculation result with rate, periods, and metadata
 */
export function calculateGrowth(input: GrowthCalculationInput): GrowthCalculationResult {
  const { financialData, metric } = input;

  // Detect data availability
  const availability = detectDataAvailability(financialData);

  // Determine comparison type
  const comparison = determineComparisonType(availability);

  // Get data quality flags
  const qualityFlags = getDataQualityFlags(availability);

  let currentValue = 0;
  let priorValue = 0;
  let growthRate = 0;

  if (comparison.type === 'TTM_VS_FY') {
    // Use TTM vs Full Year
    currentValue = getTTMValue(financialData, metric);
    priorValue = getFullYearValue(financialData, metric, availability.ttmYear - 1);
  } else if (comparison.type === 'FY_VS_FY') {
    // Use Full Year vs Full Year
    currentValue = getFullYearValue(
      financialData,
      metric,
      availability.latestQuarterlyYear - 1
    );
    priorValue = getFullYearValue(
      financialData,
      metric,
      availability.latestQuarterlyYear - 2
    );
  } else {
    // Insufficient data
    return {
      growthRate: 0,
      currentValue: 0,
      priorValue: 0,
      currentPeriod: 'N/A',
      priorPeriod: 'N/A',
      comparisonType: 'INSUFFICIENT_DATA',
      metricName: metric,
      dataQualityFlags: {
        insufficientData: true,
      },
    };
  }

  // Calculate growth rate
  if (priorValue !== 0) {
    growthRate = ((currentValue - priorValue) / Math.abs(priorValue)) * 100;
  }

  // Check for negative comparison (company swung from loss to profit)
  const negativeComparison = priorValue < 0 && currentValue > 0;

  return {
    growthRate,
    currentValue,
    priorValue,
    currentPeriod: comparison.currentPeriod,
    priorPeriod: comparison.priorPeriod,
    comparisonType: comparison.type,
    metricName: metric,
    dataQualityFlags: {
      onlyQ1Available: qualityFlags.onlyQ1Available,
      ttmNotAvailable: qualityFlags.ttmNotAvailable,
      negativeComparison,
    },
  };
}

/**
 * Get TTM (Trailing Twelve Months) value for a metric
 * Sums the last 4 quarters of quarterly financial data
 * 
 * @param financialData - Financial data object
 * @param metric - Metric to calculate TTM for
 * @returns TTM value
 */
function getTTMValue(financialData: FinancialData, metric: GrowthMetric): number {
  const quarterlyData = (financialData as any).quarterlyFinancials || [];

  if (quarterlyData.length < 4) {
    return 0;
  }

  // Sum last 4 quarters
  let ttmValue = 0;
  for (let i = 0; i < Math.min(4, quarterlyData.length); i++) {
    const quarter = quarterlyData[i];
    const value = getMetricValue(quarter, metric);
    ttmValue += value;
  }

  return ttmValue;
}

/**
 * Get full year value for a metric
 * 
 * @param financialData - Financial data object
 * @param metric - Metric to get
 * @param year - Fiscal year
 * @returns Full year value for the metric
 */
function getFullYearValue(
  financialData: FinancialData,
  metric: GrowthMetric,
  year: number
): number {
  const annualData = financialData.financials || [];

  // Find the annual data for the specified year
  const annual = annualData.find((f: any) => f.fiscalYear === year);

  if (!annual) {
    return 0;
  }

  return getMetricValue(annual, metric);
}

/**
 * Extract metric value from financial data object
 * 
 * @param data - Financial data object (annual or quarterly)
 * @param metric - Metric name
 * @returns Metric value
 */
function getMetricValue(
  data: any,
  metric: GrowthMetric
): number {
  const metricMap: Record<GrowthMetric, string> = {
    revenue: 'revenue',
    netIncome: 'netIncome',
    operatingIncome: 'operatingIncome',
    freeCashFlow: 'freeCashFlow',
    operatingCashFlow: 'operatingCashFlow',
  };

  const key = metricMap[metric];
  const value = data[key];

  return typeof value === 'number' ? value : 0;
}

/**
 * Calculate multiple growth metrics at once
 * Useful for calculating revenue, earnings, and FCF growth in one call
 * 
 * @param financialData - Financial data object
 * @param metrics - Array of metrics to calculate
 * @returns Array of growth calculation results
 */
export function calculateMultipleGrowths(
  financialData: FinancialData,
  metrics: GrowthMetric[]
): GrowthCalculationResult[] {
  return metrics.map((metric) =>
    calculateGrowth({
      financialData,
      metric,
      includeMetadata: true,
    })
  );
}

/**
 * Format growth result for display
 * 
 * @param result - Growth calculation result
 * @returns Formatted string for display
 */
export function formatGrowthForDisplay(result: GrowthCalculationResult): string {
  if (result.comparisonType === 'INSUFFICIENT_DATA') {
    return 'N/A';
  }

  const sign = result.growthRate >= 0 ? '+' : '';
  return `${sign}${result.growthRate.toFixed(1)}%`;
}

/**
 * Get human-readable description of growth comparison
 * 
 * @param result - Growth calculation result
 * @returns Description string
 */
export function getGrowthDescription(result: GrowthCalculationResult): string {
  if (result.comparisonType === 'INSUFFICIENT_DATA') {
    return 'Insufficient data for growth comparison';
  }

  if (result.dataQualityFlags.negativeComparison) {
    return `Company returned to profitability: ${result.currentPeriod} vs ${result.priorPeriod}`;
  }

  return `${result.currentPeriod} vs ${result.priorPeriod}`;
}
