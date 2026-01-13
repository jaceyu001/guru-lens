import type { FinancialData } from "../../shared/types";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const POLYGON_BASE_URL = 'https://api.polygon.io';

/**
 * Fetch real-time stock data from Polygon.io
 * Uses aggregates (daily bars) and reference data endpoints
 */
export async function getStockData(symbol: string): Promise<FinancialData> {
  try {
    console.log(`[Polygon] Fetching data for ${symbol}`);

    // Get ticker details (company info)
    const tickerDetailsUrl = `${POLYGON_BASE_URL}/v3/reference/tickers/${symbol}?apikey=${POLYGON_API_KEY}`;
    const tickerDetailsResponse = await fetch(tickerDetailsUrl);
    const tickerDetailsData = await tickerDetailsResponse.json() as any;
    const tickerDetails = tickerDetailsData.results || {};

    // Get historical data (last 30 days) using aggregates endpoint
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const toDate = today.toISOString().split("T")[0];

    const aggregatesUrl = `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?apikey=${POLYGON_API_KEY}`;
    const aggregatesResponse = await fetch(aggregatesUrl);
    const aggregatesData = await aggregatesResponse.json() as any;
    const aggregates = aggregatesData.results || [];

    if (aggregates.length === 0) {
      throw new Error(`No data available for ${symbol}`);
    }

    // Get latest bar (most recent trading day)
    const latestBar = aggregates[aggregates.length - 1];
    const previousBar = aggregates.length > 1 ? aggregates[aggregates.length - 2] : latestBar;

    const currentPrice = latestBar.c || 0; // close price
    const previousClose = previousBar.c || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Extract company info
    const sector = tickerDetails.sector || "Technology";
    const industry = tickerDetails.industry || "Software";
    const marketCap = tickerDetails.market_cap || 0;

    // Build financial data response
    const financialData: FinancialData = {
      price: {
        current: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        open: latestBar.o || currentPrice,
        high: latestBar.h || currentPrice,
        low: latestBar.l || currentPrice,
        volume: latestBar.v || 0,
        timestamp: new Date(latestBar.t || Date.now()),
      },
      profile: {
        sector,
        industry,
        description: tickerDetails.description || "",
        employees: tickerDetails.share_class_shares_outstanding,
        website: tickerDetails.homepage_url,
      },
      ratios: {
        pe: 0,
        pb: 0,
        ps: 0,
        roe: 0,
        roic: 0,
        debtToEquity: 0,
        currentRatio: 0,
        grossMargin: 0,
        operatingMargin: 0,
        netMargin: 0,
      },
    };

    console.log(`[Polygon] Successfully fetched data for ${symbol}: $${currentPrice}`);
    return financialData;
  } catch (error) {
    console.error(`[Polygon] Error fetching data for ${symbol}:`, error);
    throw new Error(`Failed to fetch data for ${symbol}: ${error}`);
  }
}

/**
 * Search for tickers by query
 */
export async function searchTickers(
  query: string
): Promise<
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
