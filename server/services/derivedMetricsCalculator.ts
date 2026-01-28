/**
 * Derived Metrics Calculator
 * Calculates ROIC and payout ratio from available financial data
 */

/**
 * Calculate Return on Invested Capital (ROIC)
 * Formula: NOPAT / Invested Capital × 100
 * 
 * NOPAT = Operating Income × (1 - Tax Rate)
 * Invested Capital = Total Assets - Current Liabilities
 * 
 * @param operatingIncome Operating income from income statement
 * @param totalAssets Total assets from balance sheet
 * @param currentLiabilities Current liabilities from balance sheet
 * @param taxRate Tax rate (default 15%)
 * @returns ROIC as percentage, or null if data insufficient
 */
export function calculateROIC(
  operatingIncome: number | null | undefined,
  totalAssets: number | null | undefined,
  currentLiabilities: number | null | undefined,
  taxRate: number = 0.15
): number | null {
  // Validate inputs
  if (!operatingIncome || operatingIncome === 0) return null;
  if (!totalAssets || totalAssets === 0) return null;
  
  // Calculate NOPAT (Net Operating Profit After Tax)
  const nopat = operatingIncome * (1 - taxRate);
  
  // Calculate Invested Capital
  // If current liabilities not available, use 50% of total assets as conservative estimate
  const investedCapital = currentLiabilities && currentLiabilities > 0
    ? totalAssets - currentLiabilities 
    : totalAssets * 0.5;
  
  // Avoid division by zero
  if (investedCapital <= 0) return null;
  
  // Calculate ROIC as percentage
  const roic = (nopat / investedCapital) * 100;
  
  // Return null for extreme or invalid values
  if (!isFinite(roic) || roic < -100 || roic > 500) return null;
  
  return roic;
}

/**
 * Calculate Payout Ratio
 * Formula: (Dividend Per Share / Earnings Per Share) × 100
 * 
 * @param dividendPerShare Dividend per share
 * @param eps Earnings per share
 * @returns Payout ratio as percentage, or null if data insufficient
 */
export function calculatePayoutRatio(
  dividendPerShare: number | null | undefined,
  eps: number | null | undefined
): number | null {
  // Handle null/undefined
  if (dividendPerShare === null || dividendPerShare === undefined) return null;
  if (!eps || eps === 0) return null;
  
  // If no dividend, return 0%
  if (dividendPerShare === 0) return 0;
  
  // If EPS is negative, cannot calculate meaningful payout ratio
  if (eps < 0) return null;
  
  // Calculate payout ratio as percentage
  const payoutRatio = (dividendPerShare / eps) * 100;
  
  // Return null for invalid values
  if (!isFinite(payoutRatio) || payoutRatio < 0) return null;
  
  // Cap at reasonable maximum (some companies pay out more than 100%)
  return Math.min(payoutRatio, 200);
}

/**
 * Calculate both ROIC and payout ratio for a financial period
 */
export function calculateDerivedMetrics(
  operatingIncome: number | null | undefined,
  totalAssets: number | null | undefined,
  currentLiabilities: number | null | undefined,
  dividendPerShare: number | null | undefined,
  eps: number | null | undefined,
  taxRate: number = 0.15
): {
  roic: number | null;
  payoutRatio: number | null;
} {
  return {
    roic: calculateROIC(operatingIncome, totalAssets, currentLiabilities, taxRate),
    payoutRatio: calculatePayoutRatio(dividendPerShare, eps),
  };
}
