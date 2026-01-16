import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { getFinancialData } from "./financialData";

// Mock yfinance module
vi.mock("yfinance", () => {
  const mockTickerData = {
    AAPL: {
      info: {
        currentPrice: 255.87,
        sharesOutstanding: 15300000000, // 15.3B shares
        marketCap: 3914000000000,
        revenue: 383285000000,
        netIncome: 96995000000,
        operatingCashFlow: 110543000000,
        freeCashFlow: 110543000000,
        trailingPE: 34.5,
        priceToBook: 52.3,
        priceToSalesTrailing12Months: 10.2,
        returnOnEquity: 0.95,
        returnOnAssets: 0.18,
        debtToEquity: 1.5241,
        currentRatio: 0.88,
        interestCoverage: 25.5,
        profitMargins: 0.253,
        operatingMargins: 0.301,
        grossMargins: 0.463,
        revenueGrowth: 0.02,
        earningsGrowth: 0.05,
        freeCashFlowGrowth: 0.03,
      },
    },
    MSFT: {
      info: {
        currentPrice: 460.79,
        sharesOutstanding: 8100000000,
        marketCap: 3732000000000,
        revenue: 245122000000,
        netIncome: 88118000000,
        operatingCashFlow: 101000000000,
        freeCashFlow: 88000000000,
        trailingPE: 35.2,
        priceToBook: 15.8,
        priceToSalesTrailing12Months: 15.2,
        returnOnEquity: 0.42,
        returnOnAssets: 0.15,
        debtToEquity: 0.65,
        currentRatio: 1.45,
        interestCoverage: 18.2,
        profitMargins: 0.36,
        operatingMargins: 0.44,
        grossMargins: 0.69,
        revenueGrowth: 0.16,
        earningsGrowth: 0.19,
        freeCashFlowGrowth: 0.12,
      },
    },
    GOOGL: {
      info: {
        currentPrice: 195.45,
        sharesOutstanding: 12600000000,
        marketCap: 2460000000000,
        revenue: 307394000000,
        netIncome: 59972000000,
        operatingCashFlow: 92000000000,
        freeCashFlow: 72000000000,
        trailingPE: 41.0,
        priceToBook: 6.2,
        priceToSalesTrailing12Months: 8.0,
        returnOnEquity: 0.18,
        returnOnAssets: 0.12,
        debtToEquity: 0.08,
        currentRatio: 2.1,
        interestCoverage: 45.0,
        profitMargins: 0.195,
        operatingMargins: 0.25,
        grossMargins: 0.57,
        revenueGrowth: 0.11,
        earningsGrowth: 0.13,
        freeCashFlowGrowth: 0.08,
      },
    },
    BIDU: {
      info: {
        currentPrice: 98.45,
        sharesOutstanding: 1280000000,
        marketCap: 125900000000,
        revenue: 28600000000,
        netIncome: 3200000000,
        operatingCashFlow: 5800000000,
        freeCashFlow: 4200000000,
        trailingPE: 30.8,
        priceToBook: 2.1,
        priceToSalesTrailing12Months: 4.4,
        returnOnEquity: 0.08,
        returnOnAssets: 0.04,
        debtToEquity: 0.25,
        currentRatio: 1.8,
        interestCoverage: 12.0,
        profitMargins: 0.112,
        operatingMargins: 0.15,
        grossMargins: 0.62,
        revenueGrowth: 0.05,
        earningsGrowth: 0.08,
        freeCashFlowGrowth: 0.06,
      },
    },
  };

  class Ticker {
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

  return {
    default: {
      Ticker,
    },
  };
});

describe("financialData", () => {
  describe("getFinancialData", () => {
    it("should fetch financial data for valid ticker (AAPL)", async () => {
      const data = await getFinancialData("AAPL");

      expect(data).toBeDefined();
      expect(data.ticker).toBe("AAPL");
      expect(data.currentPrice).toBeGreaterThan(0);
      expect(data.sharesOutstanding).toBeGreaterThan(0);
    });

    it("should fetch financial data for valid ticker (MSFT)", async () => {
      const data = await getFinancialData("MSFT");

      expect(data).toBeDefined();
      expect(data.ticker).toBe("MSFT");
      expect(data.currentPrice).toBeGreaterThan(0);
      expect(data.sharesOutstanding).toBeGreaterThan(0);
    });

    describe("Financial Metrics", () => {
      it("should include current price", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.currentPrice).toBeDefined();
        expect(typeof data.currentPrice).toBe("number");
        expect(data.currentPrice).toBeGreaterThan(0);
      });

      it("should include shares outstanding", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.sharesOutstanding).toBeDefined();
        expect(typeof data.sharesOutstanding).toBe("number");
        expect(data.sharesOutstanding).toBeGreaterThan(0);
      });

      it("should include financial statements", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.financials).toBeDefined();
        expect(Array.isArray(data.financials)).toBe(true);
        expect(data.financials.length).toBeGreaterThan(0);
      });

      it("should include revenue in financials", async () => {
        const data = await getFinancialData("AAPL");
        const latest = data.financials?.[0];

        expect(latest).toBeDefined();
        expect(latest?.revenue).toBeGreaterThan(0);
      });

      it("should include net income in financials", async () => {
        const data = await getFinancialData("MSFT");
        const latest = data.financials?.[0];

        expect(latest).toBeDefined();
        expect(latest?.netIncome).toBeDefined();
      });

      it("should include EPS in financials", async () => {
        const data = await getFinancialData("GOOGL");
        const latest = data.financials?.[0];

        expect(latest).toBeDefined();
        expect(latest?.eps).toBeGreaterThan(0);
      });

      it("should include FCF in financials", async () => {
        const data = await getFinancialData("BIDU");
        const latest = data.financials?.[0];

        expect(latest).toBeDefined();
        expect(latest?.fcf).toBeDefined();
      });
    });

    describe("Financial Ratios", () => {
      it("should include P/E ratio", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.ratios).toBeDefined();
        expect(data.ratios?.pe).toBeDefined();
        expect(typeof data.ratios?.pe).toBe("number");
      });

      it("should include P/B ratio", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.ratios?.pb).toBeDefined();
        expect(typeof data.ratios?.pb).toBe("number");
      });

      it("should include P/S ratio", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.ratios?.ps).toBeDefined();
        expect(typeof data.ratios?.ps).toBe("number");
      });

      it("should include ROE", async () => {
        const data = await getFinancialData("BIDU");

        expect(data.ratios?.roe).toBeDefined();
        expect(typeof data.ratios?.roe).toBe("number");
      });

      it("should include ROIC", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.ratios?.roic).toBeDefined();
        expect(typeof data.ratios?.roic).toBe("number");
      });

      it("should include Debt-to-Equity", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.ratios?.debtToEquity).toBeDefined();
        expect(typeof data.ratios?.debtToEquity).toBe("number");
      });

      it("should include Current Ratio", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.ratios?.currentRatio).toBeDefined();
        expect(typeof data.ratios?.currentRatio).toBe("number");
      });

      it("should include Interest Coverage", async () => {
        const data = await getFinancialData("BIDU");

        expect(data.ratios?.interestCoverage).toBeDefined();
        expect(typeof data.ratios?.interestCoverage).toBe("number");
      });

      it("should include FCF Margin", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.ratios?.fcfMargin).toBeDefined();
        expect(typeof data.ratios?.fcfMargin).toBe("number");
      });

      it("should include Net Margin", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.ratios?.netMargin).toBeDefined();
        expect(typeof data.ratios?.netMargin).toBe("number");
      });

      it("should include Operating Margin", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.ratios?.operatingMargin).toBeDefined();
        expect(typeof data.ratios?.operatingMargin).toBe("number");
      });

      it("should include Gross Margin", async () => {
        const data = await getFinancialData("BIDU");

        expect(data.ratios?.grossMargin).toBeDefined();
        expect(typeof data.ratios?.grossMargin).toBe("number");
      });
    });

    describe("Growth Metrics", () => {
      it("should include revenue growth", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.growth).toBeDefined();
        expect(data.growth?.revenueGrowth).toBeDefined();
        expect(typeof data.growth?.revenueGrowth).toBe("number");
      });

      it("should include earnings growth", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.growth?.earningsGrowth).toBeDefined();
        expect(typeof data.growth?.earningsGrowth).toBe("number");
      });

      it("should include FCF growth", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.growth?.fcfGrowth).toBeDefined();
        expect(typeof data.growth?.fcfGrowth).toBe("number");
      });
    });

    describe("Data Quality Flags", () => {
      it("should include data quality flags object", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.dataQualityFlags).toBeDefined();
      });

      it("should have boolean values for all quality flags", async () => {
        const data = await getFinancialData("MSFT");
        const flags = data.dataQualityFlags;

        if (flags) {
          Object.values(flags).forEach((value) => {
            expect(typeof value).toBe("boolean");
          });
        }
      });
    });

    describe("Data Consistency", () => {
      it("should have consistent ticker across all fields", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.ticker).toBe("AAPL");
      });

      it("should have positive price for liquid stocks", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.currentPrice).toBeGreaterThan(0);
        expect(data.currentPrice).toBeLessThan(10000);
      });

      it("should have reasonable shares outstanding", async () => {
        const data = await getFinancialData("GOOGL");

        expect(data.sharesOutstanding).toBeGreaterThan(100);
        expect(data.sharesOutstanding).toBeLessThan(100000);
      });

      it("should have positive revenue for operating companies", async () => {
        const data = await getFinancialData("BIDU");
        const latest = data.financials?.[0];

        expect(latest?.revenue).toBeGreaterThan(0);
      });

      it("should have reasonable P/E ratio", async () => {
        const data = await getFinancialData("AAPL");

        if (data.ratios?.pe && data.ratios.pe > 0) {
          expect(data.ratios.pe).toBeLessThan(500);
        }
      });

      it("should have reasonable P/B ratio", async () => {
        const data = await getFinancialData("MSFT");

        if (data.ratios?.pb && data.ratios.pb > 0) {
          expect(data.ratios.pb).toBeLessThan(100);
        }
      });

      it("should have reasonable ROE", async () => {
        const data = await getFinancialData("GOOGL");

        if (data.ratios?.roe) {
          expect(data.ratios.roe).toBeGreaterThan(-100);
          expect(data.ratios.roe).toBeLessThan(200);
        }
      });
    });

    describe("Multiple Stocks", () => {
      it("should fetch data for different stocks independently", async () => {
        const aapl = await getFinancialData("AAPL");
        const msft = await getFinancialData("MSFT");

        expect(aapl.ticker).toBe("AAPL");
        expect(msft.ticker).toBe("MSFT");
        expect(aapl.currentPrice).not.toBe(msft.currentPrice);
      });

      it("should have different financial profiles for different companies", async () => {
        const aapl = await getFinancialData("AAPL");
        const msft = await getFinancialData("MSFT");

        expect(aapl.ratios?.pe).not.toBe(msft.ratios?.pe);
      });

      it("should handle all mock stocks", async () => {
        const stocks = ["AAPL", "MSFT", "GOOGL", "BIDU"];

        for (const ticker of stocks) {
          const data = await getFinancialData(ticker);
          expect(data.ticker).toBe(ticker);
          expect(data.currentPrice).toBeGreaterThan(0);
        }
      });
    });

    describe("Data Type Validation", () => {
      it("should return FinancialData type with all required fields", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.ticker).toBeDefined();
        expect(data.currentPrice).toBeDefined();
        expect(data.sharesOutstanding).toBeDefined();
        expect(data.financials).toBeDefined();
        expect(data.ratios).toBeDefined();
        expect(data.growth).toBeDefined();
        expect(data.dataQualityFlags).toBeDefined();
      });

      it("should have correct types for all fields", async () => {
        const data = await getFinancialData("MSFT");

        expect(typeof data.ticker).toBe("string");
        expect(typeof data.currentPrice).toBe("number");
        expect(typeof data.sharesOutstanding).toBe("number");
        expect(Array.isArray(data.financials)).toBe(true);
        expect(typeof data.ratios).toBe("object");
        expect(typeof data.growth).toBe("object");
        expect(typeof data.dataQualityFlags).toBe("object");
      });
    });
  });
});
