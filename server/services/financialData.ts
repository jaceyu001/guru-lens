/**
 * Financial Data Service
 * 
 * Uses Alpha Vantage API to fetch real financial data
 * including balance sheet data (total assets, liabilities) and cash flow for accurate analysis.
 */

import type { FinancialData, TickerSnapshot } from "../../shared/types";
import { fetchAllData } from "./alphaVantageWrapper";
import { normalizeToFinancialData } from "./alphaVantageNormalizer";

/**
 * Search for tickers by symbol or company name
 */
export async function searchTickerData(query: string): Promise<TickerSnapshot[]> {
  // For search, return mock data as Alpha Vantage doesn't have a search API
  const commonTickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "JNJ", "WMT", "V", "KO", "BIDU"
  ];
  
  const upperQuery = query.toUpperCase();
  const matches = commonTickers.filter(ticker => ticker.includes(upperQuery));
  
  return matches.map(symbol => ({
    symbol,
    companyName: symbol,
    sector: "Technology",
    industry: "Various",
    exchange: "NASDAQ",
    lastDataUpdate: new Date(),
  }));
}

/**
 * Get ticker snapshot information
 */
export async function getTickerSnapshot(symbol: string): Promise<TickerSnapshot | null> {
  try {
    const responses = await fetchAllData(symbol);
    if (!responses.overview) return null;
    
    const overview = responses.overview;
    return {
      symbol: overview.Symbol,
      companyName: overview.Name || symbol,
      sector: overview.Sector || "Unknown",
      industry: overview.Industry || "Unknown",
      exchange: overview.Exchange || "NASDAQ",
      lastDataUpdate: new Date(),
    };
  } catch (error) {
    console.error(`Failed to fetch snapshot for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get comprehensive financial data for a ticker
 */
export async function getFinancialData(symbol: string): Promise<FinancialData | null> {
  try {
    const responses = await fetchAllData(symbol);
    if (!responses.overview) {
      console.error(`Failed to fetch data for ${symbol}: No overview data`);
      return null;
    }

    // Use normalizer to convert Alpha Vantage data to internal schema
    const financialData = normalizeToFinancialData(responses);
    return financialData;
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get list of all available tickers
 */
export function getAllAvailableTickers(): string[] {
  return ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "JNJ", "WMT", "V", "KO", "BIDU"];
}

/**
 * Check if ticker exists in our data
 */
export function isValidTicker(symbol: string): boolean {
  return getAllAvailableTickers().includes(symbol.toUpperCase());
}
