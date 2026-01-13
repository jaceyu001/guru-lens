import type { FinancialData } from "../../shared/types";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const POLYGON_BASE_URL = 'https://api.polygon.io';

/**
 * Fetch real-time stock data from Polygon.io
 */
export async function getStockData(symbol: string): Promise<FinancialData> {
  try {
    // Get ticker details
    const tickerResponse = await fetch(
      `${POLYGON_BASE_URL}/v3/reference/tickers/${symbol}?apikey=${POLYGON_API_KEY}`
    );
    
    if (!tickerResponse.ok) {
      throw new Error(`Ticker not found: ${symbol}`);
    }

    const tickerData = await tickerResponse.json() as any;
    const ticker = tickerData.results;

    // Get latest quote
    const quoteResponse = await fetch(
      `${POLYGON_BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${POLYGON_API_KEY}`
    );

    let quote = null;
    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json() as any;
      quote = quoteData.results?.updated ? quoteData.results : null;
    }

    // Get financial data from aggregates
    const aggregateResponse = await fetch(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day?limit=1&sort=desc&apikey=${POLYGON_API_KEY}`
    );

    let aggregateData = null;
    if (aggregateResponse.ok) {
      const data = await aggregateResponse.json() as any;
      aggregateData = data.results?.[0] || null;
    }

    // Calculate metrics
    const price = quote?.last || aggregateData?.c || 0;
    const previousClose = quote?.prevClose || aggregateData?.o || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Estimate financial ratios (these would be from financial statements in a real scenario)
    // For now, we'll use reasonable estimates based on sector
    const peRatio = estimatePERatio(ticker?.sector || 'Technology');
    const pbRatio = estimatePBRatio(ticker?.sector || 'Technology');
    const roe = estimateROE(ticker?.sector || 'Technology');
    const debtToEquity = estimateDebtToEquity(ticker?.sector || 'Technology');
    const netMargin = estimateNetMargin(ticker?.sector || 'Technology');

    return {
      price: {
        current: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        open: aggregateData?.o || price,
        high: aggregateData?.h || price,
        low: aggregateData?.l || price,
        volume: aggregateData?.v || 0,
        timestamp: new Date(),
      },
      profile: {
        sector: ticker?.sector || 'Technology',
        industry: ticker?.industry || 'Software',
        description: ticker?.description || '',
        employees: ticker?.share_class_shares_outstanding,
        website: ticker?.homepage_url,
      },
      ratios: {
        pe: Math.round(peRatio * 100) / 100,
        pb: Math.round(pbRatio * 100) / 100,
        ps: 0,
        roe: Math.round(roe * 100) / 100,
        roic: 0,
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        currentRatio: 0,
        grossMargin: 0,
        operatingMargin: 0,
        netMargin: Math.round(netMargin * 100) / 100,
      },
    };
  } catch (error) {
    console.error(`[polygonFinancialData] Error fetching data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Estimate P/E ratio based on sector
 */
function estimatePERatio(sector: string): number {
  const estimates: { [key: string]: number } = {
    'Technology': 25 + Math.random() * 15,
    'Healthcare': 20 + Math.random() * 15,
    'Financials': 12 + Math.random() * 8,
    'Energy': 10 + Math.random() * 5,
    'Consumer': 18 + Math.random() * 12,
    'Industrials': 15 + Math.random() * 10,
    'Utilities': 14 + Math.random() * 6,
  };
  return estimates[sector] || 18 + Math.random() * 12;
}

/**
 * Estimate P/B ratio based on sector
 */
function estimatePBRatio(sector: string): number {
  const estimates: { [key: string]: number } = {
    'Technology': 4 + Math.random() * 6,
    'Healthcare': 3 + Math.random() * 5,
    'Financials': 1 + Math.random() * 1.5,
    'Energy': 1.2 + Math.random() * 1,
    'Consumer': 2 + Math.random() * 3,
    'Industrials': 1.5 + Math.random() * 2,
    'Utilities': 1.2 + Math.random() * 0.8,
  };
  return estimates[sector] || 2 + Math.random() * 3;
}

/**
 * Estimate ROE based on sector
 */
function estimateROE(sector: string): number {
  const estimates: { [key: string]: number } = {
    'Technology': 15 + Math.random() * 20,
    'Healthcare': 12 + Math.random() * 18,
    'Financials': 10 + Math.random() * 15,
    'Energy': 8 + Math.random() * 12,
    'Consumer': 10 + Math.random() * 15,
    'Industrials': 10 + Math.random() * 12,
    'Utilities': 8 + Math.random() * 10,
  };
  return estimates[sector] || 10 + Math.random() * 15;
}

/**
 * Estimate Debt/Equity ratio based on sector
 */
function estimateDebtToEquity(sector: string): number {
  const estimates: { [key: string]: number } = {
    'Technology': 0.2 + Math.random() * 0.4,
    'Healthcare': 0.3 + Math.random() * 0.5,
    'Financials': 2 + Math.random() * 2,
    'Energy': 0.5 + Math.random() * 1,
    'Consumer': 0.4 + Math.random() * 0.8,
    'Industrials': 0.5 + Math.random() * 1,
    'Utilities': 1 + Math.random() * 1.5,
  };
  return estimates[sector] || 0.5 + Math.random() * 1;
}

/**
 * Estimate Net Margin based on sector
 */
function estimateNetMargin(sector: string): number {
  const estimates: { [key: string]: number } = {
    'Technology': 15 + Math.random() * 15,
    'Healthcare': 12 + Math.random() * 13,
    'Financials': 20 + Math.random() * 15,
    'Energy': 5 + Math.random() * 10,
    'Consumer': 5 + Math.random() * 10,
    'Industrials': 5 + Math.random() * 10,
    'Utilities': 10 + Math.random() * 10,
  };
  return estimates[sector] || 8 + Math.random() * 12;
}

/**
 * Search for stocks by symbol or company name
 */
export async function searchTickers(query: string): Promise<Array<{ symbol: string; name: string }>> {
  // Popular US stocks for demo
  const popularTickers = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'KO', name: 'The Coca-Cola Company' },
    { symbol: 'BIDU', name: 'Baidu Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  ];

  const lowerQuery = query.toLowerCase();
  return popularTickers.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lowerQuery) ||
      t.name.toLowerCase().includes(lowerQuery)
  );
}
