/**
 * Real Financial Data Service using yfinance
 * 
 * This service calls the Python yfinance wrapper to get real market data
 * for any US-listed stock. No API keys required.
 */

import { spawn } from "child_process";
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
  quarterlyFinancials?: Array<{
    period: string;
    quarter: string;
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
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(__dirname, "yfinanceWrapper.py");
      const python = spawn("/usr/bin/python3", [scriptPath, symbol], {
        env: {
          ...process.env,
          PYTHONPATH: undefined,
          PYTHONHOME: undefined,
        },
        timeout: 30000,
      });

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const data: YFinanceResponse = JSON.parse(output);

          if (data.error) {
            reject(new Error(`yfinance error: ${data.error}`));
            return;
          }

          resolve({
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
              operatingIncome: f.operatingIncome,
              freeCashFlow: f.freeCashFlow,
            })),
            quarterlyFinancials: data.quarterlyFinancials?.map((q) => ({
              period: q.period,
              quarter: q.quarter,
              fiscalYear: q.fiscalYear,
              revenue: q.revenue,
              netIncome: q.netIncome,
              eps: q.eps,
              operatingIncome: q.operatingIncome,
              freeCashFlow: q.freeCashFlow,
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
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse yfinance output: ${parseError}`));
        }
      });

      python.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
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
