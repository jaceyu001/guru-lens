/**
 * Real Financial Data Service using Alpha Vantage API
 * 
 * This service calls the Alpha Vantage wrapper to get real market data
 * for any US-listed stock using the premium API key.
 */

import { fetchAllData } from './alphaVantageWrapper';
import { normalizeToFinancialData } from './alphaVantageNormalizer';
import type { FinancialData } from '../../shared/types';

export async function getStockData(symbol: string): Promise<FinancialData> {
  try {
    console.log(`[realFinancialData] Fetching data for ${symbol}`);
    
    const responses = await fetchAllData(symbol);
    
    if (!responses.overview) {
      throw new Error(`No overview data received for ${symbol}`);
    }
    
    const financialData = normalizeToFinancialData(responses);
    console.log(`[realFinancialData] Successfully fetched data for ${symbol}`);
    
    return financialData;
  } catch (error) {
    console.error(`[realFinancialData] Error fetching data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get all available tickers (returns popular US stocks)
 * This is a simplified list - in production, you'd query a comprehensive list
 */
export async function searchTickers(query: string): Promise<
  Array<{
    symbol: string;
    name: string;
  }>
> {
  // Popular US stocks for demo
  const popularTickers = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "WMT", name: "Walmart Inc." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "KO", name: "The Coca-Cola Company" },
    { symbol: "BIDU", name: "Baidu Inc." },
    { symbol: "NFLX", name: "Netflix Inc." },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "UBER", name: "Uber Technologies Inc." },
  ];

  const lowerQuery = query.toLowerCase();
  return popularTickers.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lowerQuery) ||
      t.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Fetch financial data for multiple stocks in a single batch
 * 
 * @param symbols - Array of ticker symbols (e.g., ["AAPL", "MSFT", "GOOGL"])
 * @returns Record of {symbol: FinancialData} for all symbols
 */
export async function getStockDataBatch(
  symbols: string[]
): Promise<Record<string, FinancialData | { error: string }>> {
  const results: Record<string, FinancialData | { error: string }> = {};
  
  for (const symbol of symbols) {
    try {
      results[symbol] = await getStockData(symbol);
    } catch (error) {
      results[symbol] = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  return results;
}
