/**
 * TTM (Trailing Twelve Months) Calculator
 * 
 * Calculates TTM metrics using the most recent 12 months of data:
 * - 2025 Q1, Q2, Q3 (most recent quarters)
 * - 2024 Q4 (to complete the 12-month period)
 * 
 * Used for comparing current performance (TTM) vs. last full year (FY 2024)
 */

export interface FinancialReport {
  fiscalDateEnding: string;
  revenue?: number;
  totalRevenue?: number;
  netIncome?: number;
  operatingIncome?: number;
  operatingCashFlow?: number;
  capitalExpenditures?: number;
  grossProfit?: number;
}

export interface TTMMetrics {
  revenue: number;
  netIncome: number;
  operatingIncome: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  grossProfit: number;
  dataPoints: number; // How many quarters used (should be 4 for complete TTM)
  startDate: string;
  endDate: string;
}

/**
 * Get the fiscal quarter from a fiscal date
 * 2025-03-31 = Q1, 2025-06-30 = Q2, 2025-09-30 = Q3, 2024-12-31 = Q4
 */
function getQuarterInfo(fiscalDateEnding: string): { year: number; quarter: number } {
  const [year, month] = fiscalDateEnding.split('-').map(Number);
  let quarter = 1;
  if (month === 3) quarter = 1;
  else if (month === 6) quarter = 2;
  else if (month === 9) quarter = 3;
  else if (month === 12) quarter = 4;

  return { year, quarter };
}

/**
 * Calculate TTM metrics from quarterly reports
 * Uses: 2025 Q1, Q2, Q3 + 2024 Q4 (most recent 12 months)
 */
export function calculateTTM(quarterlyReports: FinancialReport[]): TTMMetrics {
  if (!quarterlyReports || quarterlyReports.length === 0) {
    return {
      revenue: 0,
      netIncome: 0,
      operatingIncome: 0,
      operatingCashFlow: 0,
      capitalExpenditures: 0,
      freeCashFlow: 0,
      grossProfit: 0,
      dataPoints: 0,
      startDate: '',
      endDate: '',
    };
  }

  // Sort by fiscal date descending (most recent first)
  const sorted = [...quarterlyReports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  // Find the 4 most recent quarters that form a complete TTM
  // Ideal: 2025 Q3, Q2, Q1, 2024 Q4
  const ttmQuarters: FinancialReport[] = [];
  const usedDates = new Set<string>();

  // Try to find 2025 Q3, Q2, Q1 and 2024 Q4
  const targetQuarters = [
    { year: 2025, quarter: 3 }, // Q3
    { year: 2025, quarter: 2 }, // Q2
    { year: 2025, quarter: 1 }, // Q1
    { year: 2024, quarter: 4 }, // Q4
  ];

  for (const target of targetQuarters) {
    const found = sorted.find((report) => {
      if (usedDates.has(report.fiscalDateEnding)) return false;
      const info = getQuarterInfo(report.fiscalDateEnding);
      return info.year === target.year && info.quarter === target.quarter;
    });

    if (found) {
      ttmQuarters.push(found);
      usedDates.add(found.fiscalDateEnding);
    }
  }

  // If we don't have all 4 quarters, use the most recent available
  if (ttmQuarters.length < 4) {
    for (const report of sorted) {
      if (!usedDates.has(report.fiscalDateEnding) && ttmQuarters.length < 4) {
        ttmQuarters.push(report);
        usedDates.add(report.fiscalDateEnding);
      }
    }
  }

  // Sum up the metrics
  const ttm = ttmQuarters.reduce(
    (acc, report) => ({
      revenue: acc.revenue + (parseInt(String(report.totalRevenue || report.revenue || 0)) || 0),
      netIncome: acc.netIncome + (parseInt(String(report.netIncome || 0)) || 0),
      operatingIncome:
        acc.operatingIncome + (parseInt(String(report.operatingIncome || 0)) || 0),
      operatingCashFlow:
        acc.operatingCashFlow + (parseInt(String(report.operatingCashFlow || 0)) || 0),
      capitalExpenditures:
        acc.capitalExpenditures + (parseInt(String(report.capitalExpenditures || 0)) || 0),
      grossProfit: acc.grossProfit + (parseInt(String(report.grossProfit || 0)) || 0),
    }),
    {
      revenue: 0,
      netIncome: 0,
      operatingIncome: 0,
      operatingCashFlow: 0,
      capitalExpenditures: 0,
      grossProfit: 0,
    }
  );

  const freeCashFlow = ttm.operatingCashFlow - ttm.capitalExpenditures;

  // Sort by date for start/end
  const sortedByDate = [...ttmQuarters].sort(
    (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
  );

  return {
    revenue: ttm.revenue,
    netIncome: ttm.netIncome,
    operatingIncome: ttm.operatingIncome,
    operatingCashFlow: ttm.operatingCashFlow,
    capitalExpenditures: ttm.capitalExpenditures,
    freeCashFlow,
    grossProfit: ttm.grossProfit,
    dataPoints: ttmQuarters.length,
    startDate: sortedByDate[0]?.fiscalDateEnding || '',
    endDate: sortedByDate[sortedByDate.length - 1]?.fiscalDateEnding || '',
  };
}

/**
 * Calculate growth rate: TTM vs Full Year
 * Example: TTM 2025 (Q1+Q2+Q3+Q4 2024) vs FY 2024
 */
export function calculateGrowthRate(ttmValue: number, fyValue: number): number {
  if (fyValue === 0 || !fyValue) return 0;
  return ((ttmValue - fyValue) / Math.abs(fyValue)) * 100;
}

/**
 * Get the most recent full year data
 * Typically FY 2024 (fiscal year ending 2024-12-31)
 */
export function getLatestFullYear(annualReports: FinancialReport[]): FinancialReport | null {
  if (!annualReports || annualReports.length === 0) return null;

  // Sort by fiscal date descending
  const sorted = [...annualReports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  // Return the most recent full year (typically 2024-12-31)
  return sorted[0] || null;
}

/**
 * Determine if we have sufficient 2025 data for TTM calculation
 * Returns true if we have at least Q1 and Q2 2025 data
 */
export function hasSufficient2025Data(quarterlyReports: FinancialReport[]): boolean {
  if (!quarterlyReports || quarterlyReports.length === 0) return false;

  const has2025Q1 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-03-31');
  const has2025Q2 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-06-30');
  const has2025Q3 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-09-30');

  // Need at least 2 quarters of 2025 data
  const count2025 = [has2025Q1, has2025Q2, has2025Q3].filter(Boolean).length;
  return count2025 >= 2;
}

/**
 * Get confidence level for TTM calculations
 * Based on how many quarters of 2025 data are available
 */
export function getTTMConfidence(quarterlyReports: FinancialReport[]): {
  confidence: number;
  reason: string;
} {
  if (!quarterlyReports || quarterlyReports.length === 0) {
    return { confidence: 0, reason: 'No quarterly data available' };
  }

  const has2025Q1 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-03-31');
  const has2025Q2 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-06-30');
  const has2025Q3 = quarterlyReports.some((r) => r.fiscalDateEnding === '2025-09-30');
  const has2024Q4 = quarterlyReports.some((r) => r.fiscalDateEnding === '2024-12-31');

  const count2025 = [has2025Q1, has2025Q2, has2025Q3].filter(Boolean).length;

  if (has2025Q1 && has2025Q2 && has2025Q3 && has2024Q4) {
    return { confidence: 95, reason: 'Complete TTM (Q1+Q2+Q3 2025 + Q4 2024)' };
  }

  if (has2025Q1 && has2025Q2 && has2025Q3) {
    return { confidence: 85, reason: 'Three quarters of 2025 data (missing Q4 2024)' };
  }

  if (has2025Q1 && has2025Q2) {
    return { confidence: 70, reason: 'Two quarters of 2025 data (partial TTM)' };
  }

  if (has2025Q1) {
    return { confidence: 50, reason: 'Only Q1 2025 data (limited TTM)' };
  }

  return { confidence: 30, reason: 'Insufficient 2025 data for reliable TTM' };
}
