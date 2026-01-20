/**
 * Balance Sheet History Service
 * 
 * Fetches and tracks historical balance sheet data to identify trends
 * in leverage, liquidity, and solvency metrics.
 */

import type { HistoricalBalanceSheet, BalanceSheetTrend } from "../../shared/types";
import { execSync } from "child_process";

/**
 * Fetch historical balance sheet data from yfinance
 */
async function fetchHistoricalBalanceSheets(symbol: string): Promise<HistoricalBalanceSheet[]> {
  try {
    const pythonScript = `
import yfinance as yf
import json
import pandas as pd

try:
    ticker = yf.Ticker("${symbol}")
    
    # Get annual balance sheets (last 4 years)
    bs_annual = ticker.balance_sheet
    
    results = []
    
    if bs_annual is not None and not bs_annual.empty:
        # Process each year (columns are dates, most recent first)
        for i, date_col in enumerate(bs_annual.columns[:4]):  # Last 4 years
            try:
                bs_data = bs_annual[date_col]
                
                total_assets = float(bs_data.get('Total Assets', 0)) or 0
                total_equity = float(bs_data.get('Stockholders Equity', 0)) or float(bs_data.get('Common Stock Equity', 0)) or 0
                total_liabilities = float(bs_data.get('Total Liabilities Net Minority Interest', 0)) or 0
                
                # Calculate if not available
                if total_liabilities == 0 and total_assets > 0 and total_equity > 0:
                    total_liabilities = total_assets - total_equity
                
                total_debt = float(bs_data.get('Total Debt', 0)) or 0
                current_assets = float(bs_data.get('Current Assets', 0)) or 0
                current_liabilities = float(bs_data.get('Current Liabilities', 0)) or 0
                
                # Calculate ratios
                de_ratio = (total_debt / total_equity) if total_equity > 0 else 0
                current_ratio = (current_assets / current_liabilities) if current_liabilities > 0 else 0
                
                results.append({
                    "symbol": "${symbol}",
                    "period": "FY",
                    "year": date_col.year,
                    "total_assets": total_assets,
                    "total_liabilities": total_liabilities,
                    "total_equity": total_equity,
                    "total_debt": total_debt,
                    "current_assets": current_assets,
                    "current_liabilities": current_liabilities,
                    "debt_to_equity": de_ratio,
                    "current_ratio": current_ratio,
                    "timestamp": date_col.isoformat(),
                })
            except Exception as e:
                continue
    
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const result = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: 30000,
    });

    const data = JSON.parse(result);
    if (data.error) {
      console.error(`Error fetching balance sheet history for ${symbol}:`, data.error);
      return [];
    }

    return data.map((item: any) => ({
      symbol: item.symbol,
      period: item.period,
      year: item.year,
      totalAssets: item.total_assets,
      totalLiabilities: item.total_liabilities,
      totalEquity: item.total_equity,
      totalDebt: item.total_debt,
      currentAssets: item.current_assets,
      currentLiabilities: item.current_liabilities,
      debtToEquity: item.debt_to_equity,
      currentRatio: item.current_ratio,
      timestamp: new Date(item.timestamp),
    }));
  } catch (error) {
    console.error(`Error fetching balance sheet history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Analyze balance sheet trends
 */
export async function analyzeBalanceSheetTrends(symbol: string): Promise<BalanceSheetTrend | null> {
  const history = await fetchHistoricalBalanceSheets(symbol);
  
  if (history.length < 2) {
    return null; // Need at least 2 data points
  }

  // Sort by year (oldest first)
  history.sort((a, b) => a.year - b.year);

  const oldest = history[0];
  const newest = history[history.length - 1];

  // Calculate trends
  const deChange = ((newest.debtToEquity - oldest.debtToEquity) / oldest.debtToEquity) * 100;
  const crChange = ((newest.currentRatio - oldest.currentRatio) / oldest.currentRatio) * 100;

  // Determine trend direction
  let debtToEquityTrend: "INCREASING" | "STABLE" | "DECREASING" = "STABLE";
  if (deChange > 5) debtToEquityTrend = "INCREASING";
  else if (deChange < -5) debtToEquityTrend = "DECREASING";

  let currentRatioTrend: "IMPROVING" | "STABLE" | "DETERIORATING" = "STABLE";
  if (crChange > 5) currentRatioTrend = "IMPROVING";
  else if (crChange < -5) currentRatioTrend = "DETERIORATING";

  // Determine risk levels
  const leverageRisk: "HIGH" | "MEDIUM" | "LOW" =
    newest.debtToEquity > 1.0 ? "HIGH" : newest.debtToEquity > 0.5 ? "MEDIUM" : "LOW";

  const liquidityRisk: "HIGH" | "MEDIUM" | "LOW" =
    newest.currentRatio < 1.0 ? "HIGH" : newest.currentRatio < 1.5 ? "MEDIUM" : "LOW";

  return {
    symbol,
    debtToEquityTrend,
    debtToEquityChange: deChange,
    currentRatioTrend,
    currentRatioChange: crChange,
    leverageRisk,
    liquidityRisk,
    analysisDate: new Date(),
  };
}

/**
 * Get historical balance sheet data for a ticker
 */
export async function getBalanceSheetHistory(symbol: string): Promise<HistoricalBalanceSheet[]> {
  return fetchHistoricalBalanceSheets(symbol);
}
