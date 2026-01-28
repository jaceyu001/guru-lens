// FinancialData type is inferred from actual data structure

/**
 * Derived Metrics Calculator
 * Calculates ROIC and payout ratio from available financial data
 */

export interface DerivedMetrics {
  roic: number | null;
  payoutRatio: number | null;
  retentionRatio: number | null;
  dividendGrowth: number | null;
  confidence: {
    roic: number; // 0-1
    payoutRatio: number; // 0-1
  };
  notes: string[];
}

/**
 * Calculate Return on Invested Capital (ROIC)
 * Formula: NOPAT / Invested Capital
 * 
 * NOPAT = Operating Income × (1 - Tax Rate)
 * Invested Capital = Total Assets - Current Liabilities
 * 
 * Returns null if data is insufficient
 */
export function calculateROIC(
  operatingIncome: number | null | undefined,
  totalAssets: number | null | undefined,
  currentLiabilities: number | null | undefined,
  taxRate: number = 0.15
): {
  roic: number | null;
  confidence: number;
  notes: string[];
} {
  const notes: string[] = [];
  let confidence = 0.9; // Default high confidence

  // Validate inputs
  if (!operatingIncome || operatingIncome === 0) {
    notes.push("Operating income is zero or missing");
    return { roic: null, confidence: 0, notes };
  }

  if (!totalAssets || totalAssets === 0) {
    notes.push("Total assets is zero or missing");
    return { roic: null, confidence: 0, notes };
  }

  if (!currentLiabilities || currentLiabilities === 0) {
    notes.push("Current liabilities is zero or missing - using total assets as proxy");
    confidence = 0.6; // Lower confidence if we're making assumptions
  }

  // Calculate NOPAT (Net Operating Profit After Tax)
  const nopat = operatingIncome * (1 - taxRate);

  // Calculate Invested Capital
  // If current liabilities not available, use total assets as conservative estimate
  const investedCapital = currentLiabilities 
    ? totalAssets - currentLiabilities 
    : totalAssets * 0.5; // Conservative 50% assumption

  // Avoid division by zero
  if (investedCapital <= 0) {
    notes.push("Invested capital is zero or negative");
    return { roic: null, confidence: 0, notes };
  }

  // Calculate ROIC as percentage
  const roic = (nopat / investedCapital) * 100;

  // Validate result
  if (roic < -100 || roic > 500) {
    notes.push(`ROIC calculation resulted in extreme value: ${roic.toFixed(1)}%`);
    confidence = Math.max(0.3, confidence - 0.3);
  }

  return {
    roic: isFinite(roic) ? roic : null,
    confidence,
    notes,
  };
}

/**
 * Calculate Payout Ratio
 * Formula: Dividend Per Share / Earnings Per Share
 * 
 * Returns null if data is insufficient
 */
export function calculatePayoutRatio(
  dividendPerShare: number | null | undefined,
  eps: number | null | undefined
): {
  payoutRatio: number | null;
  retentionRatio: number | null;
  confidence: number;
  notes: string[];
} {
  const notes: string[] = [];
  let confidence = 0.95;

  // Validate inputs
  if (dividendPerShare === null || dividendPerShare === undefined) {
    notes.push("Dividend per share is not available");
    return { payoutRatio: null, retentionRatio: null, confidence: 0, notes };
  }

  if (dividendPerShare === 0) {
    notes.push("Company does not pay dividends");
    return { 
      payoutRatio: 0, 
      retentionRatio: 100, 
      confidence: 0.95, 
      notes 
    };
  }

  if (!eps || eps === 0) {
    notes.push("EPS is zero or missing - cannot calculate payout ratio");
    return { payoutRatio: null, retentionRatio: null, confidence: 0, notes };
  }

  if (eps < 0) {
    notes.push("EPS is negative - company is unprofitable");
    return { payoutRatio: null, retentionRatio: null, confidence: 0, notes };
  }

  // Calculate payout ratio as percentage
  const payoutRatio = (dividendPerShare / eps) * 100;

  // Validate result
  if (payoutRatio > 100) {
    notes.push(`Payout ratio exceeds 100% (${payoutRatio.toFixed(1)}%) - company paying out more than earnings`);
    confidence = 0.7; // Lower confidence for unsustainable payout
  }

  if (payoutRatio < 0) {
    notes.push("Payout ratio is negative - data quality issue");
    confidence = 0.3;
  }

  // Calculate retention ratio
  const retentionRatio = Math.max(0, 100 - payoutRatio);

  return {
    payoutRatio: isFinite(payoutRatio) ? Math.max(0, payoutRatio) : null,
    retentionRatio: isFinite(retentionRatio) ? retentionRatio : null,
    confidence,
    notes,
  };
}

/**
 * Calculate Dividend Growth Rate
 * Formula: (Current DPS - Previous DPS) / Previous DPS × 100
 * 
 * Returns null if insufficient data
 */
export function calculateDividendGrowth(
  currentDPS: number | null | undefined,
  previousDPS: number | null | undefined
): {
  growth: number | null;
  confidence: number;
  notes: string[];
} {
  const notes: string[] = [];
  let confidence = 0.9;

  // Validate inputs
  if (!currentDPS || !previousDPS) {
    notes.push("Current or previous dividend data missing");
    return { growth: null, confidence: 0, notes };
  }

  if (previousDPS === 0) {
    notes.push("Previous dividend was zero - cannot calculate growth rate");
    return { growth: null, confidence: 0, notes };
  }

  if (previousDPS < 0 || currentDPS < 0) {
    notes.push("Negative dividend values detected");
    return { growth: null, confidence: 0, notes };
  }

  // Calculate growth rate as percentage
  const growth = ((currentDPS - previousDPS) / previousDPS) * 100;

  // Validate result
  if (Math.abs(growth) > 500) {
    notes.push(`Dividend growth is extreme: ${growth.toFixed(1)}%`);
    confidence = 0.6;
  }

  return {
    growth: isFinite(growth) ? growth : null,
    confidence,
    notes,
  };
}

/**
 * Calculate all derived metrics for a financial period
 */
export function calculateDerivedMetricsForPeriod(
  operatingIncome: number | null | undefined,
  totalAssets: number | null | undefined,
  currentLiabilities: number | null | undefined,
  dividendPerShare: number | null | undefined,
  eps: number | null | undefined,
  taxRate: number = 0.15
): DerivedMetrics {
  const notes: string[] = [];

  // Calculate ROIC
  const roicResult = calculateROIC(
    operatingIncome,
    totalAssets,
    currentLiabilities,
    taxRate
  );
  notes.push(...roicResult.notes);

  // Calculate Payout Ratio
  const payoutResult = calculatePayoutRatio(dividendPerShare, eps);
  notes.push(...payoutResult.notes);

  return {
    roic: roicResult.roic,
    payoutRatio: payoutResult.payoutRatio,
    retentionRatio: payoutResult.retentionRatio,
    dividendGrowth: null, // Would need historical data
    confidence: {
      roic: roicResult.confidence,
      payoutRatio: payoutResult.confidence,
    },
    notes,
  };
}

/**
 * Calculate derived metrics from complete financial data
 */
export function calculateDerivedMetricsFromFinancialData(
  financialData: any
): {
  ttm: DerivedMetrics;
  annual: DerivedMetrics | null;
  notes: string[];
} {
  const notes: string[] = [];

  // Get TTM data (first financial period)
  const ttmFinancial = financialData.financials?.[0];
  const ttmBalance = financialData.balanceSheet?.[0];

  let ttmMetrics: DerivedMetrics = {
    roic: null,
    payoutRatio: null,
    retentionRatio: null,
    dividendGrowth: null,
    confidence: { roic: 0, payoutRatio: 0 },
    notes: ["Insufficient data for TTM metrics"],
  };

  if (ttmFinancial && ttmBalance) {
    ttmMetrics = calculateDerivedMetricsForPeriod(
      ttmFinancial.operatingIncome,
      ttmBalance.totalAssets,
      ttmBalance.currentLiabilities,
      financialData.ratios?.dividendPerShare || null,
      financialData.ratios?.eps || null
    );
  }

  // Get Annual data (second financial period if available)
  const annualFinancial = financialData.financials?.[1];
  const annualBalance = financialData.balanceSheet?.[1];

  let annualMetrics: DerivedMetrics | null = null;

  if (annualFinancial && annualBalance) {
    annualMetrics = calculateDerivedMetricsForPeriod(
      annualFinancial.operatingIncome,
      annualBalance.totalAssets,
      annualBalance.currentLiabilities,
      financialData.ratios?.dividendPerShare || null,
      financialData.ratios?.eps || null
    );
  }

  return {
    ttm: ttmMetrics,
    annual: annualMetrics,
    notes,
  };
}
