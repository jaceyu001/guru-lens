/**
 * Balance Sheet Trend Analysis
 * 
 * Integrates historical balance sheet data into fundamental analysis
 * to provide context on financial health trends.
 */

import type { FinancialData, BalanceSheetTrend } from "../../shared/types";
import { analyzeBalanceSheetTrends, getBalanceSheetHistory } from "./balanceSheetHistory";

export interface FinancialHealthWithTrends {
  currentDebtToEquity: number;
  currentCurrentRatio: number;
  debtToEquityTrend?: "INCREASING" | "STABLE" | "DECREASING";
  currentRatioTrend?: "IMPROVING" | "STABLE" | "DETERIORATING";
  leverageRisk: "HIGH" | "MEDIUM" | "LOW";
  liquidityRisk: "HIGH" | "MEDIUM" | "LOW";
  narrative: string;
  confidence: number;
}

/**
 * Analyze financial health including trends
 */
export async function analyzeFinancialHealthWithTrends(
  symbol: string,
  financialData: FinancialData
): Promise<FinancialHealthWithTrends> {
  const debtToEquity = financialData.ratios?.debtToEquity || 0;
  const currentRatio = financialData.ratios?.currentRatio || 0;

  // Fetch trend data
  const trends = await analyzeBalanceSheetTrends(symbol);

  // Determine leverage risk
  let leverageRisk: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  if (debtToEquity > 1.0) leverageRisk = "HIGH";
  else if (debtToEquity < 0.3) leverageRisk = "LOW";

  // Determine liquidity risk
  let liquidityRisk: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  if (currentRatio < 1.0) liquidityRisk = "HIGH";
  else if (currentRatio > 2.0) liquidityRisk = "LOW";

  // Build narrative
  let narrative = `Current D/E ratio is ${(debtToEquity * 100).toFixed(1)}% with a current ratio of ${currentRatio.toFixed(2)}x. `;

  if (trends) {
    narrative += `Over the past ${new Date().getFullYear() - trends.analysisDate.getFullYear()} years, `;
    narrative += `leverage is ${trends.debtToEquityTrend.toLowerCase()} (${trends.debtToEquityChange > 0 ? "+" : ""}${trends.debtToEquityChange.toFixed(1)}%) `;
    narrative += `and liquidity is ${trends.currentRatioTrend.toLowerCase()} (${trends.currentRatioChange > 0 ? "+" : ""}${trends.currentRatioChange.toFixed(1)}%). `;

    if (trends.leverageRisk === "HIGH") {
      narrative += "Leverage risk is HIGH. ";
    } else if (trends.leverageRisk === "LOW") {
      narrative += "Leverage risk is LOW. ";
    }

    if (trends.liquidityRisk === "HIGH") {
      narrative += "Liquidity risk is HIGH.";
    } else if (trends.liquidityRisk === "LOW") {
      narrative += "Liquidity risk is LOW.";
    }
  }

  // Calculate confidence
  let confidence = 80;
  if (!trends) confidence = 60; // Lower confidence without trend data
  if (leverageRisk === "HIGH") confidence -= 10;
  if (liquidityRisk === "HIGH") confidence -= 10;

  return {
    currentDebtToEquity: debtToEquity,
    currentCurrentRatio: currentRatio,
    debtToEquityTrend: trends?.debtToEquityTrend,
    currentRatioTrend: trends?.currentRatioTrend,
    leverageRisk: trends?.leverageRisk || leverageRisk,
    liquidityRisk: trends?.liquidityRisk || liquidityRisk,
    narrative,
    confidence,
  };
}

/**
 * Get balance sheet history for display
 */
export async function getBalanceSheetHistoryForDisplay(symbol: string) {
  const history = await getBalanceSheetHistory(symbol);
  return history.map((item) => ({
    year: item.year,
    debtToEquity: (item.debtToEquity * 100).toFixed(1) + "%",
    currentRatio: item.currentRatio.toFixed(2) + "x",
    totalAssets: `$${(item.totalAssets / 1e9).toFixed(1)}B`,
    totalDebt: `$${(item.totalDebt / 1e9).toFixed(1)}B`,
  }));
}
