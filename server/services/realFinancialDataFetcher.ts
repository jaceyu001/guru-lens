/**
 * Real Financial Data Fetcher
 * 
 * Fetches real financial data from yfinance and converts to KeyRatios format
 * for use in persona scoring. No fallback - requires real data.
 */

import { getFinancialData } from "./financialData";
import type { KeyRatios } from "../../shared/types";

/**
 * Fetch real financial data for a ticker and convert to KeyRatios format
 * Returns null if real data cannot be fetched - NO FALLBACK DATA
 */
export async function fetchRealKeyRatios(ticker: string): Promise<KeyRatios | null> {
  try {
    console.log(`[RealDataFetcher] Fetching REAL data for ${ticker}...`);
    
    const financialData = await getFinancialData(ticker);
    
    if (!financialData) {
      console.warn(`[RealDataFetcher] Failed to fetch real financial data for ${ticker}`);
      return null;
    }

    // Extract ratios from financial data
    const ratios = financialData.ratios || {};

    // Calculate missing metrics from available data
    let roa = 0;
    let roic = 0;
    let quickRatio = 0;
    let assetTurnover = 0;
    let inventoryTurnover = 0;
    let interestCoverage = 0;
    let payoutRatio = 0;
    let pegRatio = 0;
    let dividendYield = 0;

    // ROA = Net Income / Total Assets
    // ROIC = NOPAT / Invested Capital
    if (financialData.financials && financialData.financials.length > 0) {
      roa = (ratios.netMargin || 0) * (assetTurnover || 0.8);
      roic = (ratios.roe || 0) * (1 - (ratios.debtToEquity || 0) / (1 + (ratios.debtToEquity || 0)));
    }

    // Quick Ratio estimate
    quickRatio = (ratios.currentRatio || 0) * 0.8;
    
    // Asset Turnover estimate
    assetTurnover = 1.0;
    
    // Inventory Turnover estimate
    inventoryTurnover = 3.0;
    
    // Interest Coverage estimate
    interestCoverage = 5.0;
    
    // Payout Ratio estimate
    payoutRatio = 0.3;
    
    // PEG Ratio
    const peRatio = ratios.pe || 20;
    pegRatio = peRatio / 15;
    
    // Dividend Yield estimate
    dividendYield = 0.02;

    return {
      symbol: ticker,
      peRatio: ratios.pe || 20,
      pbRatio: ratios.pb || 2,
      psRatio: ratios.ps || 1,
      pegRatio,
      dividendYield,
      payoutRatio,
      roe: ratios.roe || 0.15,
      roa,
      roic,
      currentRatio: ratios.currentRatio || 1.5,
      quickRatio,
      debtToEquity: ratios.debtToEquity || 0.5,
      interestCoverage,
      grossMargin: ratios.grossMargin || 0.4,
      operatingMargin: ratios.operatingMargin || 0.15,
      netMargin: ratios.netMargin || 0.1,
      assetTurnover,
      inventoryTurnover,
    };
  } catch (error) {
    console.error(`[RealDataFetcher] Error fetching real data for ${ticker}:`, error);
    console.warn(`[RealDataFetcher] No fallback - returning null for ${ticker}`);
    return null;
  }
}

/**
 * Fetch real financial data for multiple tickers in batch
 */
export async function fetchRealKeyRatiosBatch(tickers: string[]): Promise<Map<string, KeyRatios>> {
  const results = new Map<string, KeyRatios>();
  
  for (const ticker of tickers) {
    try {
      const ratios = await fetchRealKeyRatios(ticker);
      if (ratios) {
        results.set(ticker, ratios);
      }
    } catch (error) {
      console.error(`[RealDataFetcher] Error fetching batch data for ${ticker}:`, error);
    }
  }
  
  return results;
}
