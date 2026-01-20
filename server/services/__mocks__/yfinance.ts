import { vi } from "vitest";

// Mock yfinance ticker data
export const mockTickerData = {
  AAPL: {
    info: {
      currentPrice: 255.87,
      sharesOutstanding: 15300000000, // 15.3B shares
      marketCap: 3914000000000, // $3.914T
      revenue: 383285000000, // $383.3B
      netIncome: 96995000000, // $97B
      operatingCashFlow: 110543000000, // $110.5B
      freeCashFlow: 110543000000, // $110.5B
      trailingPE: 34.5,
      priceToBook: 52.3,
      priceToSalesTrailing12Months: 10.2,
      returnOnEquity: 0.95, // 95%
      returnOnAssets: 0.18, // 18%
      debtToEquity: 1.5241, // 152.41%
      currentRatio: 0.88,
      interestCoverage: 25.5,
      profitMargins: 0.253, // 25.3%
      operatingMargins: 0.301, // 30.1%
      grossMargins: 0.463, // 46.3%
      revenueGrowth: 0.02, // 2% YoY
      earningsGrowth: 0.05, // 5% YoY
      freeCashFlowGrowth: 0.03, // 3% YoY
    },
  },
  MSFT: {
    info: {
      currentPrice: 460.79,
      sharesOutstanding: 8100000000, // 8.1B shares
      marketCap: 3732000000000, // $3.732T
      revenue: 245122000000, // $245.1B
      netIncome: 88118000000, // $88.1B
      operatingCashFlow: 101000000000, // $101B
      freeCashFlow: 88000000000, // $88B
      trailingPE: 35.2,
      priceToBook: 15.8,
      priceToSalesTrailing12Months: 15.2,
      returnOnEquity: 0.42, // 42%
      returnOnAssets: 0.15, // 15%
      debtToEquity: 0.65, // 65%
      currentRatio: 1.45,
      interestCoverage: 18.2,
      profitMargins: 0.36, // 36%
      operatingMargins: 0.44, // 44%
      grossMargins: 0.69, // 69%
      revenueGrowth: 0.16, // 16% YoY
      earningsGrowth: 0.19, // 19% YoY
      freeCashFlowGrowth: 0.12, // 12% YoY
    },
  },
  GOOGL: {
    info: {
      currentPrice: 195.45,
      sharesOutstanding: 12600000000, // 12.6B shares
      marketCap: 2460000000000, // $2.46T
      revenue: 307394000000, // $307.4B
      netIncome: 59972000000, // $60B
      operatingCashFlow: 92000000000, // $92B
      freeCashFlow: 72000000000, // $72B
      trailingPE: 41.0,
      priceToBook: 6.2,
      priceToSalesTrailing12Months: 8.0,
      returnOnEquity: 0.18, // 18%
      returnOnAssets: 0.12, // 12%
      debtToEquity: 0.08, // 8%
      currentRatio: 2.1,
      interestCoverage: 45.0,
      profitMargins: 0.195, // 19.5%
      operatingMargins: 0.25, // 25%
      grossMargins: 0.57, // 57%
      revenueGrowth: 0.11, // 11% YoY
      earningsGrowth: 0.13, // 13% YoY
      freeCashFlowGrowth: 0.08, // 8% YoY
    },
  },
  BIDU: {
    info: {
      currentPrice: 98.45,
      sharesOutstanding: 1280000000, // 1.28B shares
      marketCap: 125900000000, // $125.9B
      revenue: 28600000000, // $28.6B
      netIncome: 3200000000, // $3.2B
      operatingCashFlow: 5800000000, // $5.8B
      freeCashFlow: 4200000000, // $4.2B
      trailingPE: 30.8,
      priceToBook: 2.1,
      priceToSalesTrailing12Months: 4.4,
      returnOnEquity: 0.08, // 8%
      returnOnAssets: 0.04, // 4%
      debtToEquity: 0.25, // 25%
      currentRatio: 1.8,
      interestCoverage: 12.0,
      profitMargins: 0.112, // 11.2%
      operatingMargins: 0.15, // 15%
      grossMargins: 0.62, // 62%
      revenueGrowth: 0.05, // 5% YoY
      earningsGrowth: 0.08, // 8% YoY
      freeCashFlowGrowth: 0.06, // 6% YoY
    },
  },
};

// Mock Ticker class
export class Ticker {
  symbol: string;
  info: Record<string, any>;

  constructor(symbol: string) {
    this.symbol = symbol;
    const mockData = mockTickerData[symbol as keyof typeof mockTickerData];
    if (!mockData) {
      throw new Error(`No mock data for ticker: ${symbol}`);
    }
    this.info = mockData.info;
  }
}

// Mock download function
export const download = vi.fn((tickers: string | string[], group_by: string = "column") => {
  const tickerList = Array.isArray(tickers) ? tickers : [tickers];
  const result: Record<string, any> = {};

  tickerList.forEach((ticker) => {
    const mockData = mockTickerData[ticker as keyof typeof mockTickerData];
    if (mockData) {
      result[ticker] = {
        Open: [100, 101, 102],
        High: [102, 103, 104],
        Low: [99, 100, 101],
        Close: [101, 102, 103],
        Volume: [1000000, 1100000, 1200000],
      };
    }
  });

  return result;
});

export default {
  Ticker,
  download,
};
