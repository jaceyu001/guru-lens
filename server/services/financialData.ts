/**
 * Financial Data Service
 * 
 * This is a mock implementation for demonstration purposes.
 * Replace with real Financial Datasets API integration for production.
 * 
 * Real implementation would use:
 * - Financial Datasets API (https://financialdatasets.ai/)
 * - API key from environment: process.env.FINANCIAL_DATASETS_API_KEY
 */

import type { FinancialData, TickerSnapshot } from "../../shared/types";

// Mock stock universe for demonstration
const MOCK_STOCKS: Record<string, TickerSnapshot & { basePrice: number }> = {
  AAPL: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    exchange: "NASDAQ",
    basePrice: 178.50,
    marketCap: 2800000000000,
  },
  MSFT: {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software",
    exchange: "NASDAQ",
    basePrice: 380.00,
    marketCap: 2820000000000,
  },
  GOOGL: {
    symbol: "GOOGL",
    companyName: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet Services",
    exchange: "NASDAQ",
    basePrice: 140.50,
    marketCap: 1750000000000,
  },
  NVDA: {
    symbol: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    exchange: "NASDAQ",
    basePrice: 495.00,
    marketCap: 1220000000000,
  },
  TSLA: {
    symbol: "TSLA",
    companyName: "Tesla, Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    exchange: "NASDAQ",
    basePrice: 248.00,
    marketCap: 788000000000,
  },
  JPM: {
    symbol: "JPM",
    companyName: "JPMorgan Chase & Co.",
    sector: "Financial Services",
    industry: "Banks",
    exchange: "NYSE",
    basePrice: 158.00,
    marketCap: 450000000000,
  },
  JNJ: {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    sector: "Healthcare",
    industry: "Drug Manufacturers",
    exchange: "NYSE",
    basePrice: 162.00,
    marketCap: 395000000000,
  },
  WMT: {
    symbol: "WMT",
    companyName: "Walmart Inc.",
    sector: "Consumer Defensive",
    industry: "Discount Stores",
    exchange: "NYSE",
    basePrice: 68.50,
    marketCap: 535000000000,
  },
  V: {
    symbol: "V",
    companyName: "Visa Inc.",
    sector: "Financial Services",
    industry: "Credit Services",
    exchange: "NYSE",
    basePrice: 275.00,
    marketCap: 560000000000,
  },
  KO: {
    symbol: "KO",
    companyName: "The Coca-Cola Company",
    sector: "Consumer Defensive",
    industry: "Beverages",
    exchange: "NYSE",
    basePrice: 62.50,
    marketCap: 270000000000,
  },
};

/**
 * Search for tickers by symbol or company name
 */
export async function searchTickerData(query: string): Promise<TickerSnapshot[]> {
  const upperQuery = query.toUpperCase();
  
  return Object.values(MOCK_STOCKS)
    .filter(stock => 
      stock.symbol.includes(upperQuery) || 
      stock.companyName.toUpperCase().includes(upperQuery)
    )
    .map(({ basePrice, ...stock }) => stock);
}

/**
 * Get ticker snapshot information
 */
export async function getTickerSnapshot(symbol: string): Promise<TickerSnapshot | null> {
  const stock = MOCK_STOCKS[symbol.toUpperCase()];
  if (!stock) return null;
  
  const { basePrice, ...snapshot } = stock;
  return {
    ...snapshot,
    lastDataUpdate: new Date(),
  };
}

/**
 * Get comprehensive financial data for a ticker
 */
export async function getFinancialData(symbol: string): Promise<FinancialData | null> {
  const stock = MOCK_STOCKS[symbol.toUpperCase()];
  if (!stock) return null;
  
  // Generate realistic mock data with some randomness
  const priceVariation = (Math.random() - 0.5) * 0.05; // ±2.5%
  const currentPrice = stock.basePrice * (1 + priceVariation);
  const change = stock.basePrice * priceVariation;
  const changePercent = priceVariation * 100;
  
  return {
    price: {
      current: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      open: Number((currentPrice * 0.998).toFixed(2)),
      high: Number((currentPrice * 1.015).toFixed(2)),
      low: Number((currentPrice * 0.985).toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      timestamp: new Date(),
    },
    profile: {
      sector: stock.sector!,
      industry: stock.industry!,
      description: `${stock.companyName} operates in the ${stock.industry} industry within the ${stock.sector} sector.`,
      employees: Math.floor(Math.random() * 200000) + 10000,
      website: `https://www.${symbol.toLowerCase()}.com`,
    },
    financials: [
      {
        revenue: Math.floor(Math.random() * 100000000000) + 50000000000,
        netIncome: Math.floor(Math.random() * 20000000000) + 5000000000,
        eps: Number((Math.random() * 10 + 2).toFixed(2)),
        period: "Q4",
        fiscalYear: 2024,
      },
      {
        revenue: Math.floor(Math.random() * 95000000000) + 48000000000,
        netIncome: Math.floor(Math.random() * 18000000000) + 4500000000,
        eps: Number((Math.random() * 9 + 1.8).toFixed(2)),
        period: "Q3",
        fiscalYear: 2024,
      },
    ],
    ratios: {
      pe: Number((Math.random() * 30 + 15).toFixed(2)),
      pb: Number((Math.random() * 8 + 2).toFixed(2)),
      ps: Number((Math.random() * 6 + 1).toFixed(2)),
      roe: Number((Math.random() * 0.25 + 0.10).toFixed(4)),
      roic: Number((Math.random() * 0.20 + 0.08).toFixed(4)),
      debtToEquity: Number((Math.random() * 1.5 + 0.3).toFixed(2)),
      currentRatio: Number((Math.random() * 2 + 1).toFixed(2)),
      grossMargin: Number((Math.random() * 0.40 + 0.30).toFixed(4)),
      operatingMargin: Number((Math.random() * 0.30 + 0.15).toFixed(4)),
      netMargin: Number((Math.random() * 0.25 + 0.10).toFixed(4)),
    },
  };
}

/**
 * Get list of all available tickers
 */
export function getAllAvailableTickers(): string[] {
  return Object.keys(MOCK_STOCKS);
}

/**
 * Check if ticker exists in our data
 */
export function isValidTicker(symbol: string): boolean {
  return symbol.toUpperCase() in MOCK_STOCKS;
}
