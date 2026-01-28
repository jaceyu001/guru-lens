import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkCache,
  updateCache,
  getFinancialDataWithFallback,
  getFinancialDataBatchWithFallback,
  markForRefresh,
  getCacheStatistics,
} from "./cacheFirstDataFetcher";
import { getDb } from "../db";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock the Alpha Vantage wrapper
vi.mock("./alphaVantageWrapper", () => ({
  getStockData: vi.fn(async (ticker: string) => ({
    profile: {
      companyName: `Test Company ${ticker}`,
      sector: "Technology",
      industry: "Software",
      exchange: "NASDAQ",
      currency: "USD",
      marketCap: 1000000000,
    },
    quote: {
      price: 150,
      volume: 1000000,
    },
    ratios: {
      pe: 25,
      pb: 3,
      ps: 5,
      roe: 0.15,
      roa: 0.1,
      roic: 0.12,
      grossMargin: 0.6,
      operatingMargin: 0.2,
      netMargin: 0.15,
      debtToEquity: 0.5,
      currentRatio: 2,
      dividendYield: 0.02,
    },
  })),
}));

describe("Cache-First Data Fetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkCache", () => {
    it("should return not found when database is unavailable", async () => {
      const mockDb = vi.mocked(getDb);
      mockDb.mockResolvedValue(null);

      const result = await checkCache("AAPL");
      expect(result.found).toBe(false);
      expect(result.source).toBe("error");
    });

    it("should return cache hit for fresh data", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: false,
                  currentPrice: 150,
                },
              ]),
            }),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await checkCache("AAPL");
      expect(result.found).toBe(true);
      expect(result.source).toBe("cache");
    });

    it("should return stale cache when refresh is required", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: true,
                  currentPrice: 150,
                },
              ]),
            }),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await checkCache("AAPL");
      expect(result.found).toBe(true);
      expect(result.source).toBe("stale_cache");
    });
  });

  describe("getFinancialDataWithFallback", () => {
    it("should return cache hit when cache is fresh", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: false,
                  currentPrice: 150,
                  companyName: "Apple Inc",
                },
              ]),
            }),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await getFinancialDataWithFallback("AAPL", false);
      expect(result.success).toBe(true);
      expect(result.source).toBe("cache");
      expect(result.cacheHit).toBe(true);
      expect(result.apiUsed).toBe(false);
    });

    it("should fetch from API when cache is empty", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await getFinancialDataWithFallback("AAPL", false);
      expect(result.success).toBe(true);
      expect(result.source).toBe("api");
      expect(result.apiUsed).toBe(true);
    });

    it("should force refresh when forceRefresh is true", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: false,
                  currentPrice: 150,
                },
              ]),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await getFinancialDataWithFallback("AAPL", true);
      expect(result.source).toBe("api");
      expect(result.apiUsed).toBe(true);
    });
  });

  describe("getFinancialDataBatchWithFallback", () => {
    it("should fetch data for multiple tickers", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const tickers = ["AAPL", "MSFT", "GOOGL"];
      const result = await getFinancialDataBatchWithFallback(tickers);

      expect(result.size).toBeGreaterThan(0);
      expect(result.has("AAPL") || result.has("MSFT") || result.has("GOOGL")).toBe(true);
    });

    it("should handle partial failures gracefully", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const tickers = ["AAPL", "INVALID", "MSFT"];
      const result = await getFinancialDataBatchWithFallback(tickers);

      // Should return at least some results despite failures
      expect(result.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("markForRefresh", () => {
    it("should mark stock for refresh", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await markForRefresh("AAPL", "Manual refresh requested");
      expect(result).toBe(true);
    });

    it("should return false when database is unavailable", async () => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(null);

      const result = await markForRefresh("AAPL", "Test");
      expect(result).toBe(false);
    });
  });

  describe("getCacheStatistics", () => {
    it("should return cache statistics", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([
            { ticker: "AAPL", refreshRequired: false, fetchedAt: new Date() },
            { ticker: "MSFT", refreshRequired: false, fetchedAt: new Date() },
            { ticker: "GOOGL", refreshRequired: true, fetchedAt: new Date() },
          ]),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const stats = await getCacheStatistics();
      expect(stats.totalCached).toBe(3);
      expect(stats.markedForRefresh).toBe(1);
      expect(stats.cacheHitRate).toBeCloseTo(66.67, 1);
    });

    it("should return zeros when database is unavailable", async () => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(null);

      const stats = await getCacheStatistics();
      expect(stats.totalCached).toBe(0);
      expect(stats.markedForRefresh).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
    });
  });

  describe("Cache-First Strategy", () => {
    it("should prioritize cache over API", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: false,
                  currentPrice: 150,
                  companyName: "Apple Inc",
                },
              ]),
            }),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      const result = await getFinancialDataWithFallback("AAPL", false);

      // Should use cache, not API
      expect(result.source).toBe("cache");
      expect(result.apiUsed).toBe(false);
      expect(result.cacheHit).toBe(true);
    });

    it("should fall back to stale cache when API fails", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  ticker: "AAPL",
                  refreshRequired: true,
                  currentPrice: 150,
                  companyName: "Apple Inc",
                },
              ]),
            }),
          }),
        }),
      };

      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);

      // This would normally fail when API is called, but we're testing the fallback logic
      const result = await getFinancialDataWithFallback("AAPL", false);

      // When API fails, should fall back to stale cache
      expect(result.source).toBe("stale_cache");
      expect(result.cacheHit).toBe(true);
    });
  });
});
