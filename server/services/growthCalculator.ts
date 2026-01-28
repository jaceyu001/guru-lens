/**
 * Growth Calculator Service
 * 
 * Calculates growth rates using intelligent strategy selection:
 * Strategy 1: TTM vs Prior Year FY (when Q2+ available)
 * Strategy 2: TTM vs Prior Year TTM (when Q1+ available with prior year quarters)
 * Strategy 3: FY vs FY (fallback)
 */

import type { FinancialData } from '@shared/types';

export type GrowthMetric = 'revenue' | 'netIncome' | 'operatingIncome' | 'freeCashFlow' | 'operatingCashFlow';
export type ComparisonType = 'TTM_VS_FY' | 'TTM_VS_TTM' | 'FY_VS_FY' | 'INSUFFICIENT_DATA';

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
  priorPeriod: string; // "2024 FY" or "2024 TTM"
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
 * Calculate growth rate using intelligent strategy selection
 */
export function calculateGrowth(input: GrowthCalculationInput): GrowthCalculationResult {
  const { financialData, metric } = input;
  
  // Handle both old format (quarterlyFinancials/financials arrays) and new format (financials.quarterlyReports/annualReports)
  let quarterlyData = (financialData as any).quarterlyFinancials || [];
  let annualData = financialData.financials || [];
  
  // Ensure both are arrays (not objects)
  if (!Array.isArray(quarterlyData)) {
    quarterlyData = [];
  }
  if (!Array.isArray(annualData)) {
    annualData = [];
  }
  
  // If using new Alpha Vantage format, extract from nested structure
  if (quarterlyData.length === 0) {
    const qReports = (financialData as any).financials?.quarterlyReports;
    quarterlyData = Array.isArray(qReports) ? qReports : [];
  }
  if (annualData.length === 0) {
    const aReports = (financialData as any).financials?.annualReports;
    annualData = Array.isArray(aReports) ? aReports : [];
  }
  


  // Detect current year and quarter
  const latestQuarter = quarterlyData[0];
  if (!latestQuarter) {
    return createInsufficientDataResult(metric);
  }

  // Extract fiscal year from fiscalDateEnding (e.g., "2025-03-31" -> 2025)
  const currentYear = latestQuarter.fiscalYear || new Date(latestQuarter.fiscalDateEnding).getFullYear();
  const currentQuarter = getQuarterFromPeriod(latestQuarter.period || latestQuarter.fiscalDateEnding);
  const currentYearQuartersCount = quarterlyData.filter((q: any) => q.fiscalYear === currentYear).length;

  // Strategy 1: TTM vs Prior Year FY (when Q2+ available)
  if (currentQuarter !== 'Q1' && currentYearQuartersCount >= 2) {
    const ttmValue = getTTMValue(quarterlyData, metric);
    const priorFYValue = getFullYearValue(annualData, metric, currentYear - 1);

    
    if (ttmValue !== 0 && priorFYValue !== 0) {
      const growthRate = ((ttmValue - priorFYValue) / Math.abs(priorFYValue)) * 100;
      return {
        growthRate,
        currentValue: ttmValue,
        priorValue: priorFYValue,
        currentPeriod: `${currentYear} TTM`,
        priorPeriod: `${currentYear - 1} FY`,
        comparisonType: 'TTM_VS_FY',
        metricName: metric,
        dataQualityFlags: {},
      };
    }
  }

  // Strategy 2: TTM vs Prior Year TTM (when Q1+ available with prior year quarters)
  if (currentYearQuartersCount >= 1) {
    const ttmValue = getTTMValue(quarterlyData, metric);
    const priorYearTTM = getPriorYearTTMValue(quarterlyData, annualData, metric, currentYear);

    
    if (ttmValue !== 0 && priorYearTTM !== 0) {
      const growthRate = ((ttmValue - priorYearTTM) / Math.abs(priorYearTTM)) * 100;
      return {
        growthRate,
        currentValue: ttmValue,
        priorValue: priorYearTTM,
        currentPeriod: `${currentYear} TTM`,
        priorPeriod: `${currentYear - 1} TTM`,
        comparisonType: 'TTM_VS_TTM',
        metricName: metric,
        dataQualityFlags: {
          onlyQ1Available: currentQuarter === 'Q1',
          ttmNotAvailable: currentYearQuartersCount < 4,
        },
      };
    }
  }

  // Strategy 3: FY vs FY (fallback)
  const currentFYValue = getFullYearValue(annualData, metric, currentYear - 1);
  const priorFYValue = getFullYearValue(annualData, metric, currentYear - 2);

  
  if (currentFYValue !== 0 && priorFYValue !== 0) {
    const growthRate = ((currentFYValue - priorFYValue) / Math.abs(priorFYValue)) * 100;
    return {
      growthRate,
      currentValue: currentFYValue,
      priorValue: priorFYValue,
      currentPeriod: `${currentYear - 1} FY`,
      priorPeriod: `${currentYear - 2} FY`,
      comparisonType: 'FY_VS_FY',
      metricName: metric,
      dataQualityFlags: {
        onlyQ1Available: currentQuarter === 'Q1',
        ttmNotAvailable: true,
      },
    };
  }

  // No valid comparison possible

  return createInsufficientDataResult(metric);
}

/**
 * Get TTM (Trailing Twelve Months) value from last 4 quarters
 */
function getTTMValue(quarterlyData: any[], metric: GrowthMetric): number {
  if (quarterlyData.length < 4) {
    return 0;
  }

  let ttmValue = 0;
  for (let i = 0; i < 4; i++) {
    const value = getMetricValue(quarterlyData[i], metric);
    ttmValue += value;
  }

  return ttmValue;
}

/**
 * Get prior year TTM by summing all quarters from prior year
 * Falls back to annual data if full 4 quarters not available
 */
function getPriorYearTTMValue(
  quarterlyData: any[],
  annualData: any[],
  metric: GrowthMetric,
  currentYear: number
): number {
  const priorYear = currentYear - 1;

  // Find all quarters from prior year
  const priorYearQuarters = quarterlyData.filter((q: any) => q.fiscalYear === priorYear);

  if (priorYearQuarters.length >= 4) {
    // Sum all 4 quarters from prior year
    let ttmValue = 0;
    for (const q of priorYearQuarters.slice(0, 4)) {
      ttmValue += getMetricValue(q, metric);
    }
    return ttmValue;
  } else if (priorYearQuarters.length > 0) {
    // Partial quarters available - annualize them
    let sum = 0;
    for (const q of priorYearQuarters) {
      sum += getMetricValue(q, metric);
    }
    const averageQuarter = sum / priorYearQuarters.length;
    return averageQuarter * 4;
  } else {
    // No prior year quarters - use full year data
    return getFullYearValue(annualData, metric, priorYear);
  }
}

/**
 * Get full year value for a specific fiscal year
 */
function getFullYearValue(annualData: any[], metric: GrowthMetric, year: number): number {
  const annual = annualData.find((f: any) => f.fiscalYear === year);
  if (!annual) {
    return 0;
  }
  return getMetricValue(annual, metric);
}

/**
 * Extract metric value from financial data object
 */
function getMetricValue(data: any, metric: GrowthMetric): number {
  const metricMap: Record<GrowthMetric, string[]> = {
    revenue: ['revenue', 'totalRevenue'],
    netIncome: ['netIncome'],
    operatingIncome: ['operatingIncome'],
    freeCashFlow: ['freeCashFlow'],
    operatingCashFlow: ['operatingCashFlow'],
  };

  const keys = metricMap[metric];
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number' && value !== 0) {
      return value;
    }
  }
  return 0;
}

/**
 * Extract quarter from period string (e.g., "2025-03-31" -> "Q1")
 */
function getQuarterFromPeriod(period: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  try {
    const date = new Date(period);
    if (isNaN(date.getTime())) {
      // If date parsing fails, return Q1 as default
      return 'Q1';
    }
    const month = date.getMonth() + 1;
    
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  } catch (e) {
    return 'Q1';
  }
}

/**
 * Create insufficient data result
 */
function createInsufficientDataResult(metric: GrowthMetric): GrowthCalculationResult {
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

/**
 * Calculate multiple growth metrics at once
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
