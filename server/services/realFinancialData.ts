/**
 * Real Financial Data Service using yfinance
 * 
 * This service calls the Python yfinance wrapper to get real market data
 * for any US-listed stock. No API keys required.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { StockPrice, CompanyProfile, FinancialData, KeyRatios } from "../../shared/types";

interface YFinanceResponse {
  symbol: string;
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    change: number;
    changePercent: number;
    timestamp: string;
  };
  profile: {
    companyName: string;
    sector: string;
    industry: string;
    description: string;
    employees: number;
    website: string;
    marketCap: number;
  };
  ratios: {
    pe: number;
    pb: number;
    ps: number;
    roe: number;
    roic: number;
    currentRatio: number;
    debtToEquity: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    dividendYield: number;
    interestCoverage: number;
  };
  financials: Array<{
    period: string;
    fiscalYear: number;
    revenue: number;
    netIncome: number;
    eps: number;
    operatingIncome: number;
    freeCashFlow: number;
  }>;
  historicalBars: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  error?: string;
}

export async function getStockData(symbol: string): Promise<FinancialData> {
  try {
    // Call Python yfinance wrapper
    const scriptPath = path.join(__dirname, "yfinanceWrapper.py");
    const result = execSync(`python3 "${scriptPath}" ${symbol}`, {
      encoding: "utf-8",
      timeout: 30000,
    });

    const data: YFinanceResponse = JSON.parse(result);

    if (data.error) {
      throw new Error(`yfinance error: ${data.error}`);
    }

    // Transform yfinance response to our types
    return {
      price: {
        current: data.price.current,
        change: data.price.change,
        changePercent: data.price.changePercent,
        open: data.price.open,
        high: data.price.high,
        low: data.price.low,
        volume: data.price.volume,
        timestamp: new Date(data.price.timestamp),
      },
      profile: {
        sector: data.profile.sector,
        industry: data.profile.industry,
        description: data.profile.description,
        employees: data.profile.employees,
        website: data.profile.website,
      },
      financials: data.financials.map((f) => ({
        period: f.period,
        fiscalYear: f.fiscalYear,
        revenue: f.revenue,
        netIncome: f.netIncome,
        eps: f.eps,
      })),
      ratios: {
        pe: data.ratios.pe,
        pb: data.ratios.pb,
        ps: data.ratios.ps,
        roe: data.ratios.roe,
        roic: data.ratios.roic,
        debtToEquity: data.ratios.debtToEquity,
        currentRatio: data.ratios.currentRatio,
        grossMargin: data.ratios.grossMargin,
        operatingMargin: data.ratios.operatingMargin,
        netMargin: data.ratios.netMargin,
      },
    };
  } catch (error) {
    console.error(`[Real Financial Data] Error fetching ${symbol}:`, error);
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
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "WMT", name: "Walmart Inc." },
    { symbol: "PG", name: "Procter & Gamble Co." },
    { symbol: "KO", name: "The Coca-Cola Company" },
    { symbol: "DIS", name: "The Walt Disney Company" },
    { symbol: "NFLX", name: "Netflix Inc." },
    { symbol: "BA", name: "The Boeing Company" },
    { symbol: "IBM", name: "International Business Machines" },
    { symbol: "INTC", name: "Intel Corporation" },
    { symbol: "AMD", name: "Advanced Micro Devices" },
    { symbol: "CSCO", name: "Cisco Systems Inc." },
  ];

  const queryUpper = query.toUpperCase();
  return popularTickers.filter(
    (t) => t.symbol.includes(queryUpper) || t.name.toUpperCase().includes(queryUpper)
  );
}

/**
 * Validate if a ticker exists and is tradeable
 */
export async function validateTicker(symbol: string): Promise<boolean> {
  try {
    const data = await getStockData(symbol);
    return data.profile?.sector !== "Unknown" && data.profile?.sector !== "";
  } catch {
    return false;
  }
}
