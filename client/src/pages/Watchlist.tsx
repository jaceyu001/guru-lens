import { useLocation } from "wouter";
import { Trash2, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Watchlist() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const watchlist = trpc.watchlist.getTickers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeMutation = trpc.watchlist.removeTicker.useMutation({
    onSuccess: () => {
      watchlist.refetch();
    },
  });

  const handleRemove = (tickerId: number) => {
    removeMutation.mutate({ tickerId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <Card className="p-12 text-center">
            <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to sign in to view and manage your watchlist.
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
          <p className="text-muted-foreground">
            Track your favorite stocks and monitor their persona ratings
          </p>
        </div>

        {watchlist.isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : watchlist.data && watchlist.data.length > 0 ? (
          <div className="space-y-4">
            {watchlist.data.map((item) => (
              <Card
                key={item.watchlistItem.id}
                className="p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setLocation(`/ticker/${item.ticker.symbol}`)}
                          >
                            {item.ticker.symbol}
                          </h3>
                          {item.ticker.sector && (
                            <Badge variant="outline">{item.ticker.sector}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.ticker.companyName}
                        </p>
                      </div>
                      
                      {item.watchlistItem.snapshotScore && (
                        <div className="text-right">
                          <div className="text-2xl font-bold font-mono-numbers text-foreground">
                            {item.watchlistItem.snapshotScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                      )}
                    </div>

                    {item.watchlistItem.notes && (
                      <div className="mb-4 p-3 bg-muted/50 rounded">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          Notes
                        </div>
                        <p className="text-sm">{item.watchlistItem.notes}</p>
                      </div>
                    )}

                    {item.cache && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Price</div>
                          <div className="text-lg font-semibold">${item.cache.currentPrice || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                          <div className="text-lg font-semibold">
                            {item.cache.marketCap ? `$${(Number(item.cache.marketCap) / 1e9).toFixed(2)}B` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">P/E Ratio</div>
                          <div className="text-lg font-semibold">{item.cache.peRatio || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Dividend Yield</div>
                          <div className="text-lg font-semibold">{item.cache.dividendYield ? `${item.cache.dividendYield}%` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Debt/Equity</div>
                          <div className="text-lg font-semibold">{item.cache.debtToEquity || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">ROE</div>
                          <div className="text-lg font-semibold">{item.cache.roe ? `${item.cache.roe}%` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">ROIC</div>
                          <div className="text-lg font-semibold">{item.cache.roic ? `${item.cache.roic}%` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Net Margin</div>
                          <div className="text-lg font-semibold">{item.cache.netMargin ? `${item.cache.netMargin}%` : 'N/A'}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        Added: {new Date(item.watchlistItem.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/ticker/${item.ticker.symbol}`)}
                        >
                          View Analysis
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item.ticker.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your Watchlist is Empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding stocks to your watchlist to track their persona ratings and monitor changes.
            </p>
            <Button onClick={() => setLocation("/")}>
              Explore Stocks
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
