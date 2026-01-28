/**
 * Cache Management Router
 * Provides tRPC procedures for cache statistics and refresh controls
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { stockFinancialCache } from "../../drizzle/schema";
import { getFinancialDataWithFallback } from "../services/cacheFirstDataFetcher";
import { eq } from "drizzle-orm";

export const cacheRouter = router({
  /**
   * Get cache statistics and health status
   */
  getStatistics: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          totalCached: 0,
          cacheHitRate: 0,
          averageCacheAge: 0,
          needsRefresh: 0,
          apiCallsToday: 0,
          status: "error",
        };
      }

      // Get all cache entries
      const allEntries = await (db as any).select().from(stockFinancialCache);
      const totalCached = allEntries.length;

      // Calculate cache age
      const now = new Date();
      let totalAge = 0;
      let needsRefresh = 0;
      let cacheHits = 0;

      for (const entry of allEntries) {
        if (entry.fetchedAt) {
          const ageMs = now.getTime() - new Date(entry.fetchedAt).getTime();
          totalAge += ageMs;
          
          // Cache older than 7 days needs refresh
          if (ageMs > 7 * 24 * 60 * 60 * 1000) {
            needsRefresh++;
          }
        }
        
        // Count entries not marked for refresh (cache hits)
        if (!entry.refreshRequired) {
          cacheHits++;
        }
      }

      const averageCacheAge = totalCached > 0 ? totalAge / totalCached / (1000 * 60 * 60) : 0; // in hours
      const cacheHitRate = totalCached > 0 ? (cacheHits / totalCached) * 100 : 0;

      return {
        totalCached,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        averageCacheAge: Math.round(averageCacheAge * 100) / 100,
        needsRefresh,
        apiCallsToday: 0, // Would need to track API calls
        status: "healthy",
      };
    } catch (error) {
      console.error("[cacheRouter] Error getting statistics:", error);
      return {
        totalCached: 0,
        cacheHitRate: 0,
        averageCacheAge: 0,
        needsRefresh: 0,
        apiCallsToday: 0,
        status: "error",
      };
    }
  }),

  /**
   * Get cache status for a specific ticker
   */
  getTickerStatus: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            ticker: input.ticker,
            cached: false,
            age: null,
            needsRefresh: false,
            lastFetched: null,
          };
        }

        const entries = await (db as any)
          .select()
          .from(stockFinancialCache)
          .where(eq(stockFinancialCache.ticker, input.ticker))
          .limit(1);

        if (entries.length === 0) {
          return {
            ticker: input.ticker,
            cached: false,
            age: null,
            needsRefresh: false,
            lastFetched: null,
          };
        }

        const entry = entries[0];
        const now = new Date();
        const ageMs = now.getTime() - new Date(entry.fetchedAt).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        return {
          ticker: input.ticker,
          cached: true,
          age: Math.round(ageHours * 100) / 100,
          needsRefresh: entry.refreshRequired || ageHours > 24,
          lastFetched: entry.fetchedAt,
        };
      } catch (error) {
        console.error("[cacheRouter] Error getting ticker status:", error);
        return {
          ticker: input.ticker,
          cached: false,
          age: null,
          needsRefresh: false,
          lastFetched: null,
        };
      }
    }),

  /**
   * Manually refresh cache for a specific ticker
   */
  refreshTicker: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .mutation(async ({ input }: any) => {
      try {
        console.log(`[cacheRouter] Refreshing cache for ${input.ticker}`);
        
        // Fetch fresh data from API
        const freshData = await getFinancialDataWithFallback(input.ticker);
        
        if (freshData) {
          console.log(`[cacheRouter] Successfully refreshed ${input.ticker}`);
          return {
            success: true,
            ticker: input.ticker,
            message: `Cache refreshed for ${input.ticker}`,
          };
        } else {
          console.error(`[cacheRouter] Failed to refresh ${input.ticker}`);
          return {
            success: false,
            ticker: input.ticker,
            message: `Failed to refresh cache for ${input.ticker}`,
          };
        }
      } catch (error) {
        console.error(`[cacheRouter] Error refreshing ${input.ticker}:`, error);
        return {
          success: false,
          ticker: input.ticker,
          message: `Error refreshing cache: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),

  /**
   * Mark a ticker for refresh
   */
  markForRefresh: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .mutation(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            message: "Database not available",
          };
        }

        await (db as any)
          .update(stockFinancialCache)
          .set({ refreshRequired: true })
          .where(eq(stockFinancialCache.ticker, input.ticker));

        console.log(`[cacheRouter] Marked ${input.ticker} for refresh`);
        return {
          success: true,
          message: `${input.ticker} marked for refresh`,
        };
      } catch (error) {
        console.error(`[cacheRouter] Error marking for refresh:`, error);
        return {
          success: false,
          message: `Error marking for refresh: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),

  /**
   * Get list of tickers that need refresh
   */
  getTickersNeedingRefresh: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const entries = await (db as any)
        .select()
        .from(stockFinancialCache)
        .where(eq(stockFinancialCache.refreshRequired, true));

      return entries.map((e: any) => ({
        ticker: e.ticker,
        lastFetched: e.fetchedAt,
        companyName: e.companyName,
      }));
    } catch (error) {
      console.error("[cacheRouter] Error getting tickers needing refresh:", error);
      return [];
    }
  }),
});
