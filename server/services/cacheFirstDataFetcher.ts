import { getDb } from "../db";
import { stockFinancialCache } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStockData } from "./alphaVantageWrapper";

export interface CacheCheckResult {
  found: boolean;
  data?: any;
  source: "cache" | "api" | "stale_cache" | "error";
  reason?: string;
}

/**
 * Check if stock data exists in cache and is fresh
 */
export async function checkCache(ticker: string): Promise<CacheCheckResult> {
  try {
    const db = await getDb();
    if (!db) {
      return { found: false, source: "error", reason: "Database not available" };
    }

    const cached = await db.select().from(stockFinancialCache).where(eq(stockFinancialCache.ticker, ticker)).limit(1);

    if (cached.length === 0) {
      return { found: false, source: "error", reason: "No cache entry found" };
    }

    const cacheEntry = cached[0];
    if (!cacheEntry.refreshRequired) {
      return { found: true, data: cacheEntry, source: "cache" };
    }

    return { found: true, data: cacheEntry, source: "stale_cache", reason: "Cache marked for refresh" };
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error checking cache for ${ticker}:`, error);
    return { found: false, source: "error", reason: String(error) };
  }
}

/**
 * Update cache with fresh financial data
 */
export async function updateCache(ticker: string, freshData: any): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[cacheFirstDataFetcher] Database not available");
      return false;
    }

    const existing = await db.select().from(stockFinancialCache).where(eq(stockFinancialCache.ticker, ticker)).limit(1);
    const now = new Date();

    const cacheData = {
      ticker,
      companyName: freshData.profile?.companyName,
      sector: freshData.profile?.sector,
      industry: freshData.profile?.industry,
      exchange: freshData.profile?.exchange,
      currency: freshData.profile?.currency || "USD",
      currentPrice: freshData.quote?.price,
      marketCap: freshData.profile?.marketCap,
      volume: freshData.quote?.volume,
      peRatio: freshData.ratios?.pe,
      pbRatio: freshData.ratios?.pb,
      psRatio: freshData.ratios?.ps,
      roe: freshData.ratios?.roe,
      roa: freshData.ratios?.roa,
      roic: freshData.ratios?.roic,
      grossMargin: freshData.ratios?.grossMargin,
      operatingMargin: freshData.ratios?.operatingMargin,
      netMargin: freshData.ratios?.netMargin,
      debtToEquity: freshData.ratios?.debtToEquity,
      currentRatio: freshData.ratios?.currentRatio,
      dividendYield: freshData.ratios?.dividendYield,
      financialDataJson: freshData,
      refreshRequired: false,
      fetchedAt: now,
    };

    if (existing.length === 0) {
      await (db as any).insert(stockFinancialCache).values(cacheData);
      console.log(`[cacheFirstDataFetcher] Created new cache entry for ${ticker}`);
    } else {
      await (db as any).update(stockFinancialCache).set(cacheData).where(eq(stockFinancialCache.ticker, ticker));
      console.log(`[cacheFirstDataFetcher] Updated cache entry for ${ticker}`);
    }

    return true;
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error updating cache for ${ticker}:`, error);
    return false;
  }
}

/**
 * Get financial data with cache-first strategy
 */
export async function getFinancialDataWithFallback(
  ticker: string,
  forceRefresh: boolean = false
): Promise<{
  success: boolean;
  data?: any;
  source: "cache" | "api" | "stale_cache" | "error";
  cacheHit: boolean;
  apiUsed: boolean;
  error?: string;
}> {
  try {
    console.log(`[cacheFirstDataFetcher] Fetching data for ${ticker} (forceRefresh: ${forceRefresh})`);

    // Step 1: Check cache
    const cacheResult = await checkCache(ticker);

    // If cache is fresh and not forcing refresh, return immediately
    if (cacheResult.found && cacheResult.source === "cache" && !forceRefresh) {
      console.log(`[cacheFirstDataFetcher] Cache hit for ${ticker}`);
      return { success: true, data: cacheResult.data, source: "cache", cacheHit: true, apiUsed: false };
    }

    // Step 2: Fetch fresh data from API
    console.log(`[cacheFirstDataFetcher] Fetching fresh data from Alpha Vantage for ${ticker}`);
    try {
      const freshData = await getStockData(ticker);
      const updateSuccess = await updateCache(ticker, freshData);

      if (updateSuccess) {
        return { success: true, data: freshData, source: "api", cacheHit: false, apiUsed: true };
      } else {
        return { success: true, data: freshData, source: "api", cacheHit: false, apiUsed: true, error: "Cache update failed" };
      }
    } catch (apiError) {
      console.error(`[cacheFirstDataFetcher] API fetch failed for ${ticker}:`, apiError);

      // Step 3: Fall back to stale cache if available
      if (cacheResult.found && cacheResult.source === "stale_cache") {
        console.log(`[cacheFirstDataFetcher] Using stale cache for ${ticker}`);
        return {
          success: true,
          data: cacheResult.data,
          source: "stale_cache",
          cacheHit: true,
          apiUsed: false,
          error: `API failed: ${String(apiError)}. Using stale cache.`,
        };
      }

      return { success: false, source: "error", cacheHit: false, apiUsed: false, error: `Failed to fetch data: ${String(apiError)}` };
    }
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Unexpected error for ${ticker}:`, error);
    return { success: false, source: "error", cacheHit: false, apiUsed: false, error: String(error) };
  }
}

/**
 * Mark stock for refresh
 */
export async function markForRefresh(ticker: string, reason: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[cacheFirstDataFetcher] Database not available");
      return false;
    }

    await (db as any).update(stockFinancialCache).set({ refreshRequired: true, lastRefreshReason: reason }).where(eq(stockFinancialCache.ticker, ticker));

    console.log(`[cacheFirstDataFetcher] Marked ${ticker} for refresh: ${reason}`);
    return true;
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error marking ${ticker} for refresh:`, error);
    return false;
  }
}

/**
 * Get all stocks marked for refresh
 */
export async function getStocksMarkedForRefresh(limit: number = 100): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[cacheFirstDataFetcher] Database not available");
      return [];
    }

    const results = await db.select({ ticker: stockFinancialCache.ticker }).from(stockFinancialCache).where(eq(stockFinancialCache.refreshRequired, true)).limit(limit);

    return results.map((r: any) => r.ticker);
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error getting stocks marked for refresh:`, error);
    return [];
  }
}

/**
 * Batch fetch with cache-first strategy
 */
export async function getFinancialDataBatchWithFallback(tickers: string[], forceRefresh: boolean = false): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  for (const ticker of tickers) {
    try {
      const result = await getFinancialDataWithFallback(ticker, forceRefresh);
      if (result.success && result.data) {
        results.set(ticker, result.data);
      }
    } catch (error) {
      console.error(`[cacheFirstDataFetcher] Batch fetch error for ${ticker}:`, error);
    }
  }

  return results;
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<{
  totalCached: number;
  markedForRefresh: number;
  cacheHitRate: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[cacheFirstDataFetcher] Database not available");
      return { totalCached: 0, markedForRefresh: 0, cacheHitRate: 0, oldestEntry: null, newestEntry: null };
    }

    const all = await db.select().from(stockFinancialCache);
    const markedForRefresh = all.filter((c: any) => c.refreshRequired).length;

    const dates = all
      .map((c: any) => c.fetchedAt)
      .filter((d: any) => d !== null)
      .sort((a: any, b: any) => (a as Date).getTime() - (b as Date).getTime());

    return {
      totalCached: all.length,
      markedForRefresh,
      cacheHitRate: all.length > 0 ? ((all.length - markedForRefresh) / all.length) * 100 : 0,
      oldestEntry: dates.length > 0 ? (dates[0] as Date) : null,
      newestEntry: dates.length > 0 ? (dates[dates.length - 1] as Date) : null,
    };
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error getting cache statistics:`, error);
    return { totalCached: 0, markedForRefresh: 0, cacheHitRate: 0, oldestEntry: null, newestEntry: null };
  }
}
