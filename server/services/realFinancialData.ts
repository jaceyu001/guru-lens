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
    dilutedSharesOutstanding?: number;
  };
  ratios: {
    pe: number;
    pb: number;
    ps: number;
    roe: number;
    roic: number;
    roa: number;
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
    operatingCashFlow?: number;
  }>;
  historicalBars: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  balanceSheet?: {
    totalAssets?: number;
    totalLiabilities?: number;
    totalEquity?: number;
    bookValuePerShare?: number;
    tangibleBookValuePerShare?: number;
    totalDebt?: number;
    cash?: number;
  };
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
              dilutedSharesOutstanding: data.profile.dilutedSharesOutstanding,
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
              operatingCashFlow: q.operatingCashFlow,
            })),
            ratios: {
              pe: data.ratios.pe,
              pb: data.ratios.pb,
              ps: data.ratios.ps,
              roe: data.ratios.roe,
              roic: data.ratios.roic,
              roa: data.ratios.roa,
              debtToEquity: data.ratios.debtToEquity,
              currentRatio: data.ratios.currentRatio,
              interestCoverage: data.ratios.interestCoverage,
              grossMargin: data.ratios.grossMargin,
              operatingMargin: data.ratios.operatingMargin,
              netMargin: data.ratios.netMargin,
            },
            balanceSheet: {
              totalAssets: data.balanceSheet?.totalAssets,
              totalLiabilities: data.balanceSheet?.totalLiabilities,
              totalEquity: data.balanceSheet?.totalEquity,
              bookValuePerShare: data.balanceSheet?.bookValuePerShare,
              tangibleBookValuePerShare: data.balanceSheet?.tangibleBookValuePerShare,
              totalDebt: data.balanceSheet?.totalDebt,
              cash: data.balanceSheet?.cash,
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


/**
 * Fetch financial data for multiple stocks in a single batch
 * 
 * @param symbols - Array of ticker symbols (e.g., ["AAPL", "MSFT", "GOOGL"])
 * @returns Record of {symbol: FinancialData} for all symbols
 */
export async function getStockDataBatch(
  symbols: string[]
): Promise<Record<string, FinancialData | { error: string }>> {
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(__dirname, "yfinanceWrapper.py");
      // Pass symbols as comma-separated string for batch mode
      const symbolsArg = symbols.join(",");

      const python = spawn("/usr/bin/python3", [scriptPath, symbolsArg], {
        env: {
          ...process.env,
          PYTHONPATH: undefined,
          PYTHONHOME: undefined,
        },
        timeout: 60000, // 60 seconds for batch (longer than single ticker)
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
          reject(
            new Error(
              `Python process exited with code ${code}: ${errorOutput}`
            )
          );
          return;
        }

        try {
          const data: Record<string, YFinanceResponse> = JSON.parse(output);

          // Convert each response to FinancialData format
          const results: Record<string, FinancialData | { error: string }> = {};

          for (const symbol in data) {
            const response = data[symbol];

            if (response.error) {
              results[symbol] = { error: response.error };
              continue;
            }

            results[symbol] = {
              price: {
                current: response.price.current,
                change: response.price.change,
                changePercent: response.price.changePercent,
                open: response.price.open,
                high: response.price.high,
                low: response.price.low,
                volume: response.price.volume,
                timestamp: new Date(response.price.timestamp),
              },
              profile: {
                sector: response.profile.sector,
                industry: response.profile.industry,
                description: response.profile.description,
                employees: response.profile.employees,
                website: response.profile.website,
                dilutedSharesOutstanding:
                  response.profile.dilutedSharesOutstanding,
              },
              financials: response.financials.map((f) => ({
                period: f.period,
                fiscalYear: f.fiscalYear,
                revenue: f.revenue,
                netIncome: f.netIncome,
                eps: f.eps,
                operatingIncome: f.operatingIncome,
                freeCashFlow: f.freeCashFlow,
              })),
              quarterlyFinancials: response.quarterlyFinancials?.map((q) => ({
                period: q.period,
                quarter: q.quarter,
                fiscalYear: q.fiscalYear,
                revenue: q.revenue,
                netIncome: q.netIncome,
                eps: q.eps,
                operatingIncome: q.operatingIncome,
                freeCashFlow: q.freeCashFlow,
                operatingCashFlow: q.operatingCashFlow,
              })),
              ratios: {
                pe: response.ratios.pe,
                pb: response.ratios.pb,
                ps: response.ratios.ps,
                roe: response.ratios.roe,
                roic: response.ratios.roic,
                roa: response.ratios.roa,
                debtToEquity: response.ratios.debtToEquity,
                currentRatio: response.ratios.currentRatio,
                interestCoverage: response.ratios.interestCoverage,
                grossMargin: response.ratios.grossMargin,
                operatingMargin: response.ratios.operatingMargin,
                netMargin: response.ratios.netMargin,
              },
              balanceSheet: {
                totalAssets: response.balanceSheet?.totalAssets,
                totalLiabilities: response.balanceSheet?.totalLiabilities,
                totalEquity: response.balanceSheet?.totalEquity,
                bookValuePerShare: response.balanceSheet?.bookValuePerShare,
                tangibleBookValuePerShare:
                  response.balanceSheet?.tangibleBookValuePerShare,
                totalDebt: response.balanceSheet?.totalDebt,
                cash: response.balanceSheet?.cash,
              },
            };
          }

          resolve(results);
        } catch (parseError) {
          reject(new Error(`Failed to parse yfinance batch output: ${parseError}`));
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
