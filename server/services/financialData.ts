/**
 * Financial Data Service
 * 
 * Uses yfinance via Python subprocess to fetch real financial data
 * including shares outstanding for accurate valuation calculations.
 */

import type { FinancialData, TickerSnapshot } from "../../shared/types";
import { execSync } from "child_process";

/**
 * Fetch financial data from yfinance using Python
 */
async function fetchFromYfinance(symbol: string): Promise<any> {
  try {
    const pythonScript = `
import yfinance as yf
import json
import sys

try:
    ticker = yf.Ticker("${symbol}")
    
    # Get historical data
    hist = ticker.history(period="1y")
    
    # Get info
    info = ticker.info
    
    # Extract key data
    data = {
        "symbol": "${symbol}",
        "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
        "shares_outstanding": info.get("sharesOutstanding", 0),
        "market_cap": info.get("marketCap", 0),
        "revenue": info.get("totalRevenue", 0),
        "net_income": info.get("netIncome", 0),
        "eps": info.get("trailingEps", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "pb_ratio": info.get("priceToBook", 0),
        "roe": info.get("returnOnEquity", 0),
        "debt_to_equity": info.get("debtToEquity", 0),
        "current_ratio": info.get("currentRatio", 0),
        "gross_margin": info.get("grossMargins", [0])[-1] if info.get("grossMargins") else 0,
        "operating_margin": info.get("operatingMargins", [0])[-1] if info.get("operatingMargins") else 0,
        "net_margin": info.get("profitMargins", [0])[-1] if info.get("profitMargins") else 0,
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "company_name": info.get("longName", ""),
        "website": info.get("website", ""),
        "employees": info.get("fullTimeEmployees", 0),
    }
    
    print(json.dumps(data))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const result = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: 30000,
    });

    return JSON.parse(result);
  } catch (error) {
    console.error(`Error fetching yfinance data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Search for tickers by symbol or company name
 */
export async function searchTickerData(query: string): Promise<TickerSnapshot[]> {
  // For search, return mock data as yfinance doesn't have a search API
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
  const data = await fetchFromYfinance(symbol);
  if (!data || data.error) return null;
  
  return {
    symbol: data.symbol,
    companyName: data.company_name || symbol,
    sector: data.sector || "Unknown",
    industry: data.industry || "Unknown",
    exchange: "NASDAQ",
    lastDataUpdate: new Date(),
  };
}

/**
 * Get comprehensive financial data for a ticker
 */
export async function getFinancialData(symbol: string): Promise<FinancialData | null> {
  const data = await fetchFromYfinance(symbol);
  if (!data || data.error) {
    console.error(`Failed to fetch data for ${symbol}:`, data?.error);
    return null;
  }

  // Convert shares outstanding from individual shares to millions
  const sharesOutstandingInMillions = data.shares_outstanding ? data.shares_outstanding / 1000000 : 0;

  return {
    sharesOutstanding: sharesOutstandingInMillions,
    price: {
      current: Number(data.current_price?.toFixed(2) || 0),
      change: 0,
      changePercent: 0,
      open: Number(data.current_price?.toFixed(2) || 0),
      high: Number(data.current_price?.toFixed(2) || 0),
      low: Number(data.current_price?.toFixed(2) || 0),
      volume: 0,
      timestamp: new Date(),
    },
    profile: {
      sector: data.sector || "Unknown",
      industry: data.industry || "Unknown",
      description: `${data.company_name} operates in the ${data.industry} industry.`,
      employees: data.employees || 0,
      website: data.website || "",
    },
    financials: [
      {
        revenue: Number(data.revenue || 0),
        netIncome: Number(data.net_income || 0),
        eps: Number(data.eps?.toFixed(2) || 0),
        period: "FY",
        fiscalYear: new Date().getFullYear(),
      },
    ],
    ratios: {
      pe: Number(data.pe_ratio?.toFixed(2) || 0),
      pb: Number(data.pb_ratio?.toFixed(2) || 0),
      ps: data.revenue && data.market_cap ? Number((data.revenue / data.market_cap).toFixed(2)) : 0,
      roe: Number(data.roe?.toFixed(4) || 0),
      roic: 0,
      // Fix: debtToEquity from yfinance is in percentage format (33.81 = 33.81%), convert to decimal
      debtToEquity: Number((data.debt_to_equity / 100)?.toFixed(4) || 0),
      currentRatio: Number(data.current_ratio?.toFixed(2) || 0),
      grossMargin: Number(data.gross_margin?.toFixed(4) || 0),
      operatingMargin: Number(data.operating_margin?.toFixed(4) || 0),
      netMargin: Number(data.net_margin?.toFixed(4) || 0),
    },
  };
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
