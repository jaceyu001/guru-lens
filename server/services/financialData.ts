/**
 * Financial Data Service
 * 
 * Uses yfinance via Python subprocess to fetch real financial data
 * including balance sheet data (total assets, liabilities) for accurate analysis.
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
import pandas as pd

# Import currency detection utility
try:
    from currencyDetector import detect_financial_currency, get_currency_info_dict
except ImportError:
    def detect_financial_currency(info):
        return info.get('financialCurrency', 'USD')
    def get_currency_info_dict(currency):
        return {'reportingCurrency': currency, 'conversionApplied': False, 'conversionRate': 1.0}

try:
    ticker = yf.Ticker("${symbol}")
    
    # Get historical data
    hist = ticker.history(period="1y")
    
    # Get info
    info = ticker.info
    
    # Detect financial currency and get conversion info
    financial_currency = detect_financial_currency(info)
    currency_info = get_currency_info_dict(financial_currency)
    conversion_rate = currency_info['conversionRate']
    
    # Get balance sheet data (apply currency conversion if needed)
    total_assets = 0
    total_liabilities = 0
    total_equity = 0
    
    try:
        # Try to get annual balance sheet (most recent year)
        bs = ticker.balance_sheet
        if bs is not None and not bs.empty:
            latest_bs = bs.iloc[:, 0]  # Most recent column
            total_assets = (float(latest_bs.get('Total Assets', 0)) or 0) / 1e9 * conversion_rate
            # Get total equity - try multiple field names
            total_equity = (float(latest_bs.get('Stockholders Equity', 0)) or float(latest_bs.get('Total Stockholder Equity', 0)) or float(latest_bs.get('Common Stock Equity', 0)) or 0) / 1e9 * conversion_rate
            # Get total liabilities
            total_liabilities = (float(latest_bs.get('Total Liabilities Net Minority Interest', 0)) or 0) / 1e9 * conversion_rate
            # If we don't have liabilities, calculate from assets - equity
            if total_liabilities == 0 and total_assets > 0 and total_equity > 0:
                total_liabilities = total_assets - total_equity
    except Exception as e:
        pass
    
    # Calculate earnings growth from income statement (apply currency conversion if needed)
    earnings_growth = 0
    revenue_growth = info.get("revenueGrowth", 0)
    try:
        income_stmt = ticker.income_stmt
        if income_stmt is not None and not income_stmt.empty and len(income_stmt.columns) >= 2:
            # Get net income for current and previous year (already in same currency, so ratio is unaffected)
            current_ni = float(income_stmt.iloc[:, 0].get('Net Income', 0)) or 0
            previous_ni = float(income_stmt.iloc[:, 1].get('Net Income', 0)) or 0
            if previous_ni != 0:
                earnings_growth = (current_ni - previous_ni) / abs(previous_ni)
    except:
        # Fall back to EPS-based calculation
        current_eps = info.get("trailingEps", 0)
        forward_eps = info.get("forwardEps", 0)
        if current_eps > 0:
            earnings_growth = (forward_eps - current_eps) / current_eps
    
    # Extract key data (apply currency conversion if needed)
    data = {
        "symbol": "${symbol}",
        "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
        "shares_outstanding": info.get("sharesOutstanding", 0),
        "market_cap": info.get("marketCap", 0) * conversion_rate,
        "revenue": (info.get("totalRevenue", 0) / 1e9) * conversion_rate,
        "net_income": (info.get("netIncome", 0) / 1e9) * conversion_rate,
        "eps": info.get("trailingEps", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "pb_ratio": info.get("priceToBook", 0),
        "roe": info.get("returnOnEquity", 0),
        "debt_to_equity": info.get("debtToEquity", 0),
        "current_ratio": info.get("currentRatio", 0),
        "gross_margin": info.get("grossMargins", [0])[-1] if info.get("grossMargins") else 0,
        "operating_margin": info.get("operatingMargins", [0])[-1] if info.get("operatingMargins") else 0,
        "net_margin": info.get("profitMargins", [0])[-1] if info.get("profitMargins") else 0,
        "revenue_growth": revenue_growth,
        "earnings_growth": earnings_growth,
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "company_name": info.get("longName", ""),
        "website": info.get("website", ""),
        "employees": info.get("fullTimeEmployees", 0),
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "total_equity": total_equity,
        "total_debt": info.get("totalDebt", 0),
        "total_cash": info.get("totalCash", 0),
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

  // Calculate proper debt-to-equity using balance sheet data
  // IMPORTANT: Always use balance sheet calculation (total_debt / total_equity) as it's more accurate
  // yfinance's debtToEquity field is often incorrect for international companies
  let debtToEquity = 0;
  
  // Prefer balance sheet calculation if available
  if (data.total_equity > 0 && data.total_debt > 0) {
    debtToEquity = Number((data.total_debt / data.total_equity)?.toFixed(4) || 0);
  } else if (data.debt_to_equity > 0) {
    // Fallback to yfinance value if balance sheet data unavailable
    debtToEquity = Number((data.debt_to_equity)?.toFixed(4) || 0);
  }

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
      // Use calculated D/E from balance sheet if available, otherwise use yfinance value
      debtToEquity: debtToEquity,
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
