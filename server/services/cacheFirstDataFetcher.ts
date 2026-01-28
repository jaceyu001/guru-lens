import { getDb } from "../db";
import { stockFinancialCache } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStockData } from "./alphaVantageWrapper";

/**
 * Sanitize numeric value: convert NaN, Infinity, null, undefined to 0
 */
function sanitizeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (!isFinite(num)) return 0;
  return num;
}

/**
 * Sanitize string value: convert null, undefined to empty string
 */
function sanitizeString(value: any): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Build financial data structure from cache entry
 */
function buildFinancialDataFromCache(cacheEntry: any): any {
  const parseNum = (val: any) => {
    if (val === null || val === undefined || val === "" || val === "0") return null;
    const num = Number(val);
    return isFinite(num) ? num : null;
  };
  
  return {
    ticker: cacheEntry.ticker,
    profile: {
      companyName: cacheEntry.companyName || "N/A",
      sector: cacheEntry.sector || "N/A",
      industry: cacheEntry.industry || "N/A",
      exchange: cacheEntry.exchange || "N/A",
      currency: cacheEntry.currency || "USD",
      marketCap: cacheEntry.marketCap && cacheEntry.marketCap !== "0" ? Number(cacheEntry.marketCap) : 0,
    },
    quote: {
      price: cacheEntry.currentPrice && cacheEntry.currentPrice !== "0" ? Number(cacheEntry.currentPrice) : 0,
      volume: cacheEntry.volume && cacheEntry.volume !== "0" ? Number(cacheEntry.volume) : 0,
    },
    ratios: {
      pe: parseNum(cacheEntry.peRatio),
      pb: parseNum(cacheEntry.pbRatio),
      ps: parseNum(cacheEntry.psRatio),
      roe: parseNum(cacheEntry.roe),
      roa: parseNum(cacheEntry.roa),
      roic: parseNum(cacheEntry.roic),
      grossMargin: parseNum(cacheEntry.grossMargin),
      operatingMargin: parseNum(cacheEntry.operatingMargin),
      netMargin: parseNum(cacheEntry.netMargin),
      debtToEquity: parseNum(cacheEntry.debtToEquity),
      currentRatio: parseNum(cacheEntry.currentRatio),
      dividendYield: parseNum(cacheEntry.dividendYield),
    },
  };
}

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
    
    // Try to extract parsed financial data from JSON
    let financialData: any = null;
    if (cacheEntry.financialDataJson) {
      try {
        financialData = typeof cacheEntry.financialDataJson === "string" 
          ? JSON.parse(cacheEntry.financialDataJson)
          : cacheEntry.financialDataJson;
      } catch (e) {
        console.error(`[cacheFirstDataFetcher] Failed to parse financialDataJson for ${ticker}:`, e);
      }
    }
    
    // If we don't have parsed financial data, construct it from cache columns
    if (!financialData) {
      financialData = buildFinancialDataFromCache(cacheEntry);
    }
    
    if (!cacheEntry.refreshRequired) {
      return { found: true, data: financialData, source: "cache" };
    }

    return { found: true, data: financialData, source: "stale_cache", reason: "Cache marked for refresh" };
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

    console.log(`[cacheFirstDataFetcher] Storing data for ${ticker}:`, { quote: freshData.quote, price: freshData.quote?.price });
    const cacheData = {
      ticker,
      companyName: sanitizeString(freshData.profile?.companyName),
      sector: sanitizeString(freshData.profile?.sector),
      industry: sanitizeString(freshData.profile?.industry),
      exchange: sanitizeString(freshData.profile?.exchange),
      currency: sanitizeString(freshData.profile?.currency) || "USD",
      currentPrice: String(sanitizeNumber(freshData.quote?.price)),
      marketCap: String(sanitizeNumber(freshData.profile?.marketCap)),
      volume: String(sanitizeNumber(freshData.quote?.volume)),
      peRatio: String(sanitizeNumber(freshData.ratios?.pe)),
      pbRatio: String(sanitizeNumber(freshData.ratios?.pb)),
      psRatio: String(sanitizeNumber(freshData.ratios?.ps)),
      roe: String(sanitizeNumber(freshData.ratios?.roe)),
      roa: String(sanitizeNumber(freshData.ratios?.roa)),
      roic: String(sanitizeNumber(freshData.ratios?.roic)),
      grossMargin: String(sanitizeNumber(freshData.ratios?.grossMargin)),
      operatingMargin: String(sanitizeNumber(freshData.ratios?.operatingMargin)),
      netMargin: String(sanitizeNumber(freshData.ratios?.netMargin)),
      debtToEquity: String(sanitizeNumber(freshData.ratios?.debtToEquity)),
      currentRatio: String(sanitizeNumber(freshData.ratios?.currentRatio)),
      dividendYield: String(sanitizeNumber(freshData.ratios?.dividendYield)),
      financialDataJson: freshData,
      refreshRequired: false,
      fetchedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(stockFinancialCache).set(cacheData).where(eq(stockFinancialCache.ticker, ticker));
    } else {
      await db.insert(stockFinancialCache).values(cacheData as any);
    }

    console.log(`[cacheFirstDataFetcher] Cache updated for ${ticker}`);
    return true;
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error updating cache for ${ticker}:`, error);
    console.error(`[cacheFirstDataFetcher] Cache data that failed:`, {
      ticker,
      companyName: freshData.profile?.companyName,
      sector: freshData.profile?.sector,
      industry: freshData.profile?.industry,
      exchange: freshData.profile?.exchange,
      currency: freshData.profile?.currency,
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
      fetchedAt: new Date(),
    });
    return false;
  }
}

export interface FinancialDataResult {
  success: boolean;
  data?: any;
  source: "cache" | "api" | "stale_cache" | "error";
  cacheHit: boolean;
  apiUsed: boolean;
  error?: string;
}

/**
 * Get financial data with cache-first strategy
 * Priority: Cache → API → Stale Cache → Error
 */
export async function getFinancialDataWithFallback(
  ticker: string,
  forceRefresh: boolean = false,
): Promise<FinancialDataResult> {
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
 * Get financial data for multiple tickers in batch
 */
export async function getFinancialDataBatchWithFallback(
  tickers: string[],
  forceRefresh: boolean = false,
): Promise<Map<string, FinancialDataResult>> {
  const results = new Map<string, FinancialDataResult>();
  const errors = new Map<string, Error>();

  for (const ticker of tickers) {
    try {
      const result = await getFinancialDataWithFallback(ticker, forceRefresh);
      results.set(ticker, result);
    } catch (error) {
      errors.set(ticker, error as Error);
      results.set(ticker, {
        success: false,
        source: "error",
        cacheHit: false,
        apiUsed: false,
        error: String(error),
      });
    }
  }

  if (errors.size > 0) {
    console.error(`[cacheFirstDataFetcher] Batch fetch completed with ${errors.size} errors`);
  }

  return results;
}

/**
 * Mark a cache entry for refresh
 */
export async function markForRefresh(ticker: string, reason: string = "manual_refresh"): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[cacheFirstDataFetcher] Database not available");
      return false;
    }

    await db.update(stockFinancialCache).set({ refreshRequired: true, lastRefreshReason: reason }).where(eq(stockFinancialCache.ticker, ticker));

    console.log(`[cacheFirstDataFetcher] Marked ${ticker} for refresh (reason: ${reason})`);
    return true;
  } catch (error) {
    console.error(`[cacheFirstDataFetcher] Error marking ${ticker} for refresh:`, error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<{
  totalCached: number;
  cacheHitRate: number;
  averageAge: number;
  needsRefresh: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { totalCached: 0, cacheHitRate: 0, averageAge: 0, needsRefresh: 0 };
    }

    const cached = await db.select().from(stockFinancialCache);

    const needsRefresh = cached.filter((c) => c.refreshRequired).length;
    const totalCached = cached.length;

    return {
      totalCached,
      cacheHitRate: totalCached > 0 ? ((totalCached - needsRefresh) / totalCached) * 100 : 0,
      averageAge: 0, // Would need to calculate from timestamps
      needsRefresh,
    };
  } catch (error) {
    console.error("[cacheFirstDataFetcher] Error getting cache statistics:", error);
    return { totalCached: 0, cacheHitRate: 0, averageAge: 0, needsRefresh: 0 };
  }
}
