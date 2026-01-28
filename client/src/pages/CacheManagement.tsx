/**
 * Cache Management Dashboard
 * Shows cache statistics, health status, and refresh controls
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, TrendingUp, Database, Clock } from "lucide-react";

interface CacheStats {
  totalCached: number;
  cacheHitRate: number;
  averageCacheAge: number;
  needsRefresh: number;
  apiCallsToday: number;
  status: string;
}

interface TickerNeedingRefresh {
  ticker: string;
  lastFetched: string | null;
  companyName: string | null;
}

export function CacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [tickersNeedingRefresh, setTickersNeedingRefresh] = useState<TickerNeedingRefresh[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // Fetch cache statistics
  const statsQuery = trpc.cache.getStatistics.useQuery();
  const tickersQuery = trpc.cache.getTickersNeedingRefresh.useQuery();
  const refreshMutation = trpc.cache.refreshTicker.useMutation();
  const markForRefreshMutation = trpc.cache.markForRefresh.useMutation();

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
  }, [statsQuery.data]);

  useEffect(() => {
    if (tickersQuery.data) {
      setTickersNeedingRefresh(tickersQuery.data);
    }
  }, [tickersQuery.data]);

  const handleRefreshTicker = async (ticker: string) => {
    setSelectedTicker(ticker);
    setIsRefreshing(true);
    try {
      await refreshMutation.mutateAsync({ ticker });
      // Refresh the lists
      await statsQuery.refetch();
      await tickersQuery.refetch();
    } finally {
      setIsRefreshing(false);
      setSelectedTicker(null);
    }
  };

  const handleMarkForRefresh = async (ticker: string) => {
    try {
      await markForRefreshMutation.mutateAsync({ ticker });
      await tickersQuery.refetch();
    } catch (error) {
      console.error("Error marking for refresh:", error);
    }
  };

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading cache statistics...</div>
      </div>
    );
  }

  const statusColor = stats.status === "healthy" ? "text-green-600" : "text-red-600";
  const statusBg = stats.status === "healthy" ? "bg-green-50" : "bg-red-50";

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Cache Management Dashboard</h1>
        <p className="text-gray-600">Monitor and manage the financial data cache system</p>
      </div>

      {/* Status Overview */}
      <div className={`rounded-lg p-4 ${statusBg}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-5 h-5 ${statusColor}`} />
          <span className={`font-semibold ${statusColor}`}>
            Cache Status: {stats.status === "healthy" ? "Healthy" : "Needs Attention"}
          </span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cached */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Total Cached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCached}</div>
            <p className="text-xs text-gray-600 mt-1">stocks in cache</p>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-600 mt-1">successful cache hits</p>
          </CardContent>
        </Card>

        {/* Average Cache Age */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCacheAge.toFixed(1)}</div>
            <p className="text-xs text-gray-600 mt-1">hours old</p>
          </CardContent>
        </Card>

        {/* Needs Refresh */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Needs Refresh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needsRefresh}</div>
            <p className="text-xs text-gray-600 mt-1">stocks marked for refresh</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickers Needing Refresh */}
      {tickersNeedingRefresh.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tickers Needing Refresh</CardTitle>
            <CardDescription>
              {tickersNeedingRefresh.length} stocks have outdated cache data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickersNeedingRefresh.map((ticker) => (
                <div
                  key={ticker.ticker}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{ticker.ticker}</div>
                    <div className="text-sm text-gray-600">
                      {ticker.companyName || "Unknown Company"}
                    </div>
                    {ticker.lastFetched && (
                      <div className="text-xs text-gray-500">
                        Last fetched: {new Date(ticker.lastFetched).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRefreshTicker(ticker.ticker)}
                    disabled={isRefreshing && selectedTicker === ticker.ticker}
                    variant="outline"
                  >
                    {isRefreshing && selectedTicker === ticker.ticker ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Refresh Needed */}
      {tickersNeedingRefresh.length === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">All Cache Fresh</CardTitle>
            <CardDescription className="text-green-700">
              All cached stocks have recent data. No refresh needed.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Cache Management Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Information about the cache system and how it works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">How the Cache Works</h4>
            <p className="text-sm text-gray-600">
              The cache system stores financial data from Alpha Vantage API with a priority strategy:
              <br />
              1. Check cache first (fastest)
              <br />
              2. Fetch from API if cache miss (updates cache)
              <br />
              3. Use stale cache if API fails (fallback)
              <br />
              4. Return error if all sources fail
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Refresh Strategy</h4>
            <p className="text-sm text-gray-600">
              Cache entries older than 7 days are marked for refresh. You can manually refresh
              individual stocks or wait for the automatic refresh cycle.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Cache Hit Rate</h4>
            <p className="text-sm text-gray-600">
              Shows the percentage of requests served from cache vs API calls. Higher is better
              for performance and API rate limit management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
