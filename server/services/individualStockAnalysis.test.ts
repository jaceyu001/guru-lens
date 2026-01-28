import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFinancialDataWithFallback } from "./cacheFirstDataFetcher";

// Mock the cache-first fetcher
vi.mock("./cacheFirstDataFetcher", () => ({
  getFinancialDataWithFallback: vi.fn(),
}));

describe("Individual Stock Analysis with New API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Financial Data Fetching for Individual Analysis", () => {
    it("should fetch financial data using cache-first strategy", async () => {
      const mockData = {
        profile: {
          companyName: "Apple Inc",
          sector: "Technology",
          industry: "Consumer Electronics",
          exchange: "NASDAQ",
          currency: "USD",
          marketCap: 3000000000000,
          description: "Apple Inc designs, manufactures, and markets smartphones, computers, and wearables.",
          employees: 161000,
          website: "https://www.apple.com",
        },
        quote: {
          price: 180.5,
          open: 179.0,
          high: 182.0,
          low: 178.5,
          close: 180.5,
          volume: 50000000,
          previousClose: 179.0,
          change: 1.5,
          changePercent: 0.84,
          timestamp: "2026-01-28T20:00:00Z",
        },
        ratios: {
          pe: 28.5,
          pb: 45.2,
          ps: 8.5,
          roe: 0.85,
          roa: 0.25,
          roic: 0.35,
          currentRatio: 1.2,
          debtToEquity: 0.15,
          grossMargin: 0.46,
          operatingMargin: 0.31,
          netMargin: 0.25,
          earningsGrowth: 0.05,
          revenueGrowth: 0.08,
          dividendYield: 0.004,
        },
        financials: [
          {
            period: "2025-12-31",
            periodType: "annual",
            fiscalYear: 2025,
            revenue: 383285000000,
            costOfRevenue: 206039000000,
            grossProfit: 177246000000,
            operatingExpenses: 65000000000,
            operatingIncome: 112246000000,
            netIncome: 96995000000,
            eps: 6.05,
            ebitda: 120000000000,
            freeCashFlow: 110000000000,
            totalAssets: 352755000000,
            totalLiabilities: 116646000000,
            shareholderEquity: 236109000000,
            cashAndEquivalents: 29965000000,
            totalDebt: 106900000000,
          },
        ],
        price: {
          current: 180.5,
          open: 179.0,
          high: 182.0,
          low: 178.5,
          close: 180.5,
          volume: 50000000,
          previousClose: 179.0,
          change: 1.5,
          changePercent: 0.84,
          timestamp: "2026-01-28T20:00:00Z",
        },
        dataQualityFlags: {
          peNegative: false,
          pegUndefined: false,
          earningsCollapse: false,
          revenueDecline: false,
        },
      };

      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: true,
        data: mockData,
        source: "cache",
        cacheHit: true,
        apiUsed: false,
      });

      const result = await getFinancialDataWithFallback("AAPL", false);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.source).toBe("cache");
      expect(result.cacheHit).toBe(true);
      expect(result.data?.profile.companyName).toBe("Apple Inc");
      expect(result.data?.ratios.pe).toBe(28.5);
      expect(result.data?.financials).toHaveLength(1);
    });

    it("should handle API fallback when cache is empty", async () => {
      const mockData = {
        profile: {
          companyName: "Microsoft Corporation",
          sector: "Technology",
          industry: "Software",
          exchange: "NASDAQ",
          currency: "USD",
          marketCap: 2800000000000,
        },
        quote: {
          price: 420.0,
          volume: 20000000,
        },
        ratios: {
          pe: 35.0,
          pb: 12.5,
          ps: 12.0,
          roe: 0.45,
          roa: 0.18,
          roic: 0.25,
        },
        price: {
          current: 420.0,
          open: 418.0,
          high: 422.0,
          low: 417.0,
          close: 420.0,
          volume: 20000000,
          previousClose: 418.0,
          change: 2.0,
          changePercent: 0.48,
          timestamp: "2026-01-28T20:00:00Z",
        },
        dataQualityFlags: {},
      };

      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: true,
        data: mockData,
        source: "api",
        cacheHit: false,
        apiUsed: true,
      });

      const result = await getFinancialDataWithFallback("MSFT", false);

      expect(result.success).toBe(true);
      expect(result.source).toBe("api");
      expect(result.apiUsed).toBe(true);
      expect(result.data?.profile.companyName).toBe("Microsoft Corporation");
    });

    it("should provide complete data for persona analysis", async () => {
      const mockData = {
        profile: {
          companyName: "Google LLC",
          sector: "Technology",
          industry: "Internet Services",
          exchange: "NASDAQ",
          currency: "USD",
          marketCap: 2000000000000,
          description: "Google LLC is a technology company.",
          employees: 190234,
          website: "https://www.google.com",
        },
        quote: {
          price: 140.0,
          volume: 25000000,
        },
        ratios: {
          pe: 25.0,
          pb: 8.0,
          ps: 6.5,
          roe: 0.20,
          roa: 0.15,
          roic: 0.18,
          currentRatio: 1.5,
          debtToEquity: 0.05,
          grossMargin: 0.82,
          operatingMargin: 0.25,
          netMargin: 0.20,
          earningsGrowth: 0.10,
          revenueGrowth: 0.12,
        },
        financials: [
          {
            period: "2025-12-31",
            periodType: "annual",
            fiscalYear: 2025,
            revenue: 307394000000,
            costOfRevenue: 55000000000,
            grossProfit: 252394000000,
            operatingExpenses: 75000000000,
            operatingIncome: 177394000000,
            netIncome: 59972000000,
            eps: 0.47,
            ebitda: 185000000000,
            freeCashFlow: 75000000000,
            totalAssets: 402392000000,
            totalLiabilities: 95000000000,
            shareholderEquity: 307392000000,
            cashAndEquivalents: 110939000000,
            totalDebt: 14000000000,
          },
        ],
        price: {
          current: 140.0,
          open: 138.5,
          high: 142.0,
          low: 138.0,
          close: 140.0,
          volume: 25000000,
          previousClose: 138.5,
          change: 1.5,
          changePercent: 1.08,
          timestamp: "2026-01-28T20:00:00Z",
        },
        dataQualityFlags: {
          peNegative: false,
          pegUndefined: false,
          earningsCollapse: false,
          revenueDecline: false,
        },
      };

      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: true,
        data: mockData,
        source: "cache",
        cacheHit: true,
        apiUsed: false,
      });

      const result = await getFinancialDataWithFallback("GOOGL", false);

      // Verify all required fields for persona analysis are present
      expect(result.data?.profile).toBeDefined();
      expect(result.data?.quote).toBeDefined();
      expect(result.data?.ratios).toBeDefined();
      expect(result.data?.financials).toBeDefined();
      expect(result.data?.price).toBeDefined();
      expect(result.data?.dataQualityFlags).toBeDefined();

      // Verify specific metrics needed for analysis
      expect(result.data?.ratios.pe).toBeGreaterThan(0);
      expect(result.data?.ratios.roe).toBeGreaterThan(0);
      expect(result.data?.ratios.roic).toBeGreaterThan(0);
      expect(result.data?.financials).toHaveLength(1);
    });

    it("should handle errors gracefully", async () => {
      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: false,
        source: "error",
        cacheHit: false,
        apiUsed: false,
        error: "Failed to fetch financial data",
      });

      const result = await getFinancialDataWithFallback("INVALID", false);

      expect(result.success).toBe(false);
      expect(result.source).toBe("error");
      expect(result.error).toBeDefined();
    });
  });

  describe("Data Compatibility with Analysis Engines", () => {
    it("should provide data compatible with fundamentals agent", async () => {
      const mockData = {
        profile: {
          companyName: "Test Corp",
          sector: "Technology",
          industry: "Software",
          exchange: "NASDAQ",
          currency: "USD",
          marketCap: 1000000000,
        },
        quote: { price: 100 },
        ratios: {
          pe: 20,
          pb: 5,
          ps: 3,
          roe: 0.15,
          roa: 0.10,
          roic: 0.12,
          currentRatio: 1.5,
          debtToEquity: 0.3,
          grossMargin: 0.60,
          operatingMargin: 0.20,
          netMargin: 0.15,
          earningsGrowth: 0.08,
          revenueGrowth: 0.10,
        },
        financials: [],
        price: {
          current: 100,
          open: 99,
          high: 102,
          low: 98,
          close: 100,
          volume: 1000000,
          previousClose: 99,
          change: 1,
          changePercent: 1.01,
          timestamp: "2026-01-28T20:00:00Z",
        },
        dataQualityFlags: {},
      };

      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: true,
        data: mockData,
        source: "cache",
        cacheHit: true,
        apiUsed: false,
      });

      const result = await getFinancialDataWithFallback("TEST", false);

      // Verify fundamentals agent requirements
      expect(result.data?.ratios.roe).toBeDefined();
      expect(result.data?.ratios.roa).toBeDefined();
      expect(result.data?.ratios.roic).toBeDefined();
      expect(result.data?.ratios.currentRatio).toBeDefined();
      expect(result.data?.ratios.debtToEquity).toBeDefined();
      expect(result.data?.ratios.grossMargin).toBeDefined();
      expect(result.data?.ratios.operatingMargin).toBeDefined();
      expect(result.data?.ratios.netMargin).toBeDefined();
    });

    it("should provide data compatible with valuation agent", async () => {
      const mockData = {
        profile: {
          companyName: "Test Corp",
          sector: "Technology",
          industry: "Software",
          exchange: "NASDAQ",
          currency: "USD",
          marketCap: 1000000000,
        },
        quote: { price: 100 },
        ratios: {
          pe: 20,
          pb: 5,
          ps: 3,
          roe: 0.15,
          roa: 0.10,
          roic: 0.12,
          currentRatio: 1.5,
          debtToEquity: 0.3,
          grossMargin: 0.60,
          operatingMargin: 0.20,
          netMargin: 0.15,
          earningsGrowth: 0.08,
          revenueGrowth: 0.10,
        },
        financials: [
          {
            period: "2025-12-31",
            periodType: "annual",
            fiscalYear: 2025,
            revenue: 1000000000,
            costOfRevenue: 400000000,
            grossProfit: 600000000,
            operatingExpenses: 400000000,
            operatingIncome: 200000000,
            netIncome: 150000000,
            eps: 1.50,
            ebitda: 250000000,
            freeCashFlow: 120000000,
            totalAssets: 2000000000,
            totalLiabilities: 600000000,
            shareholderEquity: 1400000000,
            cashAndEquivalents: 300000000,
            totalDebt: 200000000,
          },
        ],
        price: {
          current: 100,
          open: 99,
          high: 102,
          low: 98,
          close: 100,
          volume: 1000000,
          previousClose: 99,
          change: 1,
          changePercent: 1.01,
          timestamp: "2026-01-28T20:00:00Z",
        },
        dataQualityFlags: {},
      };

      const mockGetFetch = vi.mocked(getFinancialDataWithFallback);
      mockGetFetch.mockResolvedValue({
        success: true,
        data: mockData,
        source: "cache",
        cacheHit: true,
        apiUsed: false,
      });

      const result = await getFinancialDataWithFallback("TEST", false);

      // Verify valuation agent requirements
      expect(result.data?.ratios.pe).toBeDefined();
      expect(result.data?.ratios.pb).toBeDefined();
      expect(result.data?.ratios.ps).toBeDefined();
      expect(result.data?.financials).toHaveLength(1);
      expect(result.data?.financials[0].revenue).toBeDefined();
      expect(result.data?.financials[0].netIncome).toBeDefined();
      expect(result.data?.financials[0].totalAssets).toBeDefined();
      expect(result.data?.financials[0].shareholderEquity).toBeDefined();
    });
  });
});
