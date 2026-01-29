import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Clock, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { FundamentalsAgentCard } from "@/components/FundamentalsAgentCard";
import { ValuationAgentCard } from "@/components/ValuationAgentCard";
import type { AnalysisOutput } from "@shared/types";

export default function Ticker() {
  const { symbol } = useParams<{ symbol: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const ticker = trpc.tickers.getBySymbol.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: !!symbol }
  );
  const financialData = trpc.tickers.getFinancialData.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: !!symbol }
  );
  const analyses = trpc.analyses.getLatestForTicker.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: !!symbol }
  );
  const inWatchlist = trpc.watchlist.isInWatchlist.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: isAuthenticated }
  );
  const fundamentalsAgent = trpc.agents.fundamentals.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: !!symbol }
  );
  const valuationAgent = trpc.agents.valuation.useQuery(
    { symbol: symbol?.toUpperCase() || "" },
    { enabled: !!symbol }
  );

  const runAnalysisMutation = trpc.analyses.runAnalysis.useMutation({
    onSuccess: () => {
      // Add delay to ensure database is updated before invalidating cache
      setTimeout(() => {
        // Invalidate the analyses query cache to force a fresh fetch
        utils.analyses.getLatestForTicker.invalidate({ symbol: symbol?.toUpperCase() || "" });
        setIsRunning(false);
      }, 500);
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
      setIsRunning(false);
      // Still invalidate to show any partial results
      utils.analyses.getLatestForTicker.invalidate({ symbol: symbol?.toUpperCase() || "" });
    },
  });

  const addToWatchlistMutation = trpc.watchlist.addTicker.useMutation({
    onSuccess: () => {
      inWatchlist.refetch();
    },
  });

  const handleRunAnalysis = () => {
    if (!symbol) return;
    setIsRunning(true);
    runAnalysisMutation.mutate({ symbol: symbol.toUpperCase(), mode: "quick" });
  };

  const handleAddToWatchlist = () => {
    if (!symbol) return;
    addToWatchlistMutation.mutate({ symbol: symbol.toUpperCase() });
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Strong Fit":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "Fit":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Borderline":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "Not a Fit":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-positive";
    if (score >= 65) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-negative";
  };

  const isMetricAnomalous = (metricName: string): boolean => {
    const flags = financialData.data?.dataQualityFlags;
    if (!flags) return false;
    
    const anomalyMap: Record<string, keyof typeof flags> = {
      "P/E Ratio": "peAnomalous",
      "P/B Ratio": "pbAnomalous",
      "ROE": "roeNegative",
      "Debt/Equity": "debtToEquityAnomalous",
      "Current Ratio": "currentRatioAnomalous",
    };
    
    const flagKey = anomalyMap[metricName];
    if (!flagKey || typeof flagKey !== 'string') return false;
    return (flags[flagKey as keyof typeof flags] as boolean) ?? false;
  };



  if (financialData.isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (financialData.isError || !financialData.data) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{financialData.isError ? "Unable to Load Data" : "Ticker Not Found"}</h2>
            <p className="text-muted-foreground mb-6">
              {financialData.isError 
                ? `We encountered an error loading data for ${symbol}. This may be a temporary issue. Please try again.`
                : `We couldn't find data for ticker symbol "${symbol}". Please try another ticker.`
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => financialData.refetch()}>Retry</Button>
              <Button variant="outline" onClick={() => setLocation("/")}>Return to Home</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const price = financialData.data?.quote;  // quote contains price, volume, change, changePercent
  const profile = financialData.data?.profile;
  const ratios = financialData.data?.ratios;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={handleAddToWatchlist}
                disabled={inWatchlist.data || addToWatchlistMutation.isPending}
              >
                <Star className={`mr-2 h-4 w-4 ${inWatchlist.data ? "fill-current" : ""}`} />
                {inWatchlist.data ? "In Watchlist" : "Add to Watchlist"}
              </Button>
            )}
            <Button
              onClick={handleRunAnalysis}
              disabled={isRunning || runAnalysisMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Running..." : "Rerun Analysis"}
            </Button>
            </div>
            {analyses.data && analyses.data.length > 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last run: {new Date(analyses.data[0].runTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Company Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {symbol}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{symbol}</Badge>
                {profile?.sector && <Badge variant="secondary">{profile.sector}</Badge>}
                {profile?.industry && <Badge variant="secondary">{profile.industry}</Badge>}
                <Badge variant="outline">NASDAQ</Badge>
              </div>
            </div>
            
            {price && price.price !== undefined && price.change !== undefined && price.changePercent !== undefined && (
              <div className="text-right">
                <div className="text-3xl font-bold font-mono-numbers text-foreground">
                  {price && price.price !== undefined && price.price !== null ? `$${Number(price.price).toFixed(2)}` : "N/A"}
                </div>
                <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${price && price.change >= 0 ? "text-positive" : "text-negative"}`}>
                  {price && price.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {price && price.change >= 0 ? "+" : ""}{price && price.change !== undefined ? Number(price.change).toFixed(2) : "N/A"} ({price && price.changePercent !== undefined ? Number(price.changePercent).toFixed(2) : "N/A"}%)
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {price && price.timestamp ? new Date(price.timestamp).toLocaleString() : new Date().toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          {price || ratios ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t">
              {price && price.price !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Price</div>
                  <div className="font-semibold font-mono-numbers">
                    ${Number(price.price).toFixed(2)}
                  </div>
                </div>
              )}
              {profile?.marketCap !== null && profile?.marketCap !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                  <div className="font-semibold font-mono-numbers">
                    ${(Number(profile.marketCap) / 1e9).toFixed(2)}B
                  </div>
                </div>
              )}
              {price && price.volume !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Volume</div>
                  <div className="font-semibold font-mono-numbers">
                    {(Number(price.volume) / 1e6).toFixed(2)}M
                  </div>
                </div>
              )}
              {ratios && ratios.pe !== null && ratios.pe !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    P/E Ratio
                    {isMetricAnomalous("P/E Ratio") && <Badge variant="destructive" className="text-xs">TBC</Badge>}
                  </div>
                  <div className={`font-semibold font-mono-numbers ${isMetricAnomalous("P/E Ratio") ? "text-yellow-600" : ""}`}>
                    {ratios.pe?.toFixed(2)}
                  </div>
                </div>
              )}
              {ratios && ratios.pb !== null && ratios.pb !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    P/B Ratio
                    {isMetricAnomalous("P/B Ratio") && <Badge variant="destructive" className="text-xs">TBC</Badge>}
                  </div>
                  <div className={`font-semibold font-mono-numbers ${isMetricAnomalous("P/B Ratio") ? "text-yellow-600" : ""}`}>
                    {ratios.pb?.toFixed(2)}
                  </div>
                </div>
              )}
              {ratios && ratios.ps !== null && ratios.ps !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">P/S Ratio</div>
                  <div className="font-semibold font-mono-numbers">
                    {ratios.ps?.toFixed(2)}
                  </div>
                </div>
              )}
              {ratios && ratios.roe !== null && ratios.roe !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    ROE
                    {isMetricAnomalous("ROE") && <Badge variant="destructive" className="text-xs">TBC</Badge>}
                  </div>
                  <div className={`font-semibold font-mono-numbers ${isMetricAnomalous("ROE") ? "text-yellow-600" : ""}`}>
                    {ratios.roe?.toFixed(2)}%
                  </div>
                </div>
              )}
              {ratios && ratios.roa !== null && ratios.roa !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ROA</div>
                  <div className="font-semibold font-mono-numbers">
                    {ratios.roa?.toFixed(2)}%
                  </div>
                </div>
              )}
              {ratios && ratios.roic !== null && ratios.roic !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ROIC</div>
                  <div className="font-semibold font-mono-numbers">
                    {ratios.roic?.toFixed(2)}%
                  </div>
                </div>
              )}
              {ratios?.debtToEquity !== null && ratios?.debtToEquity !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    Debt/Equity
                    {isMetricAnomalous("Debt/Equity") && <Badge variant="destructive" className="text-xs">TBC</Badge>}
                  </div>
                  <div className={`font-semibold font-mono-numbers ${isMetricAnomalous("Debt/Equity") ? "text-yellow-600" : ""}`}>
                    {((ratios.debtToEquity ?? 0) * 100).toFixed(2)}%
                  </div>
                </div>
              )}
              {ratios?.currentRatio !== null && ratios?.currentRatio !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    Current Ratio
                    {isMetricAnomalous("Current Ratio") && <Badge variant="destructive" className="text-xs">TBC</Badge>}
                  </div>
                  <div className="font-semibold font-mono-numbers">
                    {(ratios.currentRatio ?? 0).toFixed(2)}
                  </div>
                </div>
              )}
              {ratios?.grossMargin !== null && ratios?.grossMargin !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Gross Margin</div>
                  <div className="font-semibold font-mono-numbers">{(ratios.grossMargin ?? 0).toFixed(2)}%</div>
                </div>
              )}
              {ratios?.operatingMargin !== null && ratios?.operatingMargin !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Operating Margin</div>
                  <div className="font-semibold font-mono-numbers">{(ratios.operatingMargin ?? 0).toFixed(2)}%</div>
                </div>
              )}
              {ratios?.netMargin !== null && ratios?.netMargin !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Net Margin</div>
                  <div className="font-semibold font-mono-numbers">{(ratios.netMargin ?? 0).toFixed(2)}%</div>
                </div>
              )}
              {ratios?.dividendYield !== null && ratios?.dividendYield !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Dividend Yield</div>
                  <div className="font-semibold font-mono-numbers">{(ratios.dividendYield ?? 0).toFixed(2)}%</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Financial metrics data is currently unavailable for this ticker.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Agent Analysis Cards */}
        {(fundamentalsAgent.data || valuationAgent.data) && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold">Agent Analysis</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {fundamentalsAgent.data && (
                <FundamentalsAgentCard 
                  findings={fundamentalsAgent.data} 
                  isLoading={fundamentalsAgent.isLoading}
                />
              )}
              {valuationAgent.data && (
                <ValuationAgentCard 
                  findings={valuationAgent.data} 
                  isLoading={valuationAgent.isLoading}
                />
              )}
            </div>
          </div>
        )}

        {/* Persona Analyses */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Persona Ratings</h2>
          
          {analyses.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-16 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </Card>
              ))}
            </div>
          ) : analyses.data && analyses.data.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {analyses.data.map((analysis) => (
                <Card
                  key={analysis.id}
                  className={`p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 ${getVerdictColor(analysis.verdict)}`}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{analysis.personaName}</h3>
                      <Badge variant="outline" className="mt-1">{analysis.verdict}</Badge>
                    </div>
                    <div className={`text-3xl font-bold font-mono-numbers ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <Progress value={Number(analysis.confidence) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">{(Number(analysis.confidence) * 100).toFixed(0)}%</div>
                  </div>

                  {analysis.summaryBullets && analysis.summaryBullets.length > 0 && (
                    <div className="space-y-2">
                      {analysis.summaryBullets.slice(0, 2).map((bullet, idx) => (
                        <div key={idx} className="text-sm text-foreground">
                          • {bullet}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analyses Yet</h3>
              <p className="text-muted-foreground mb-6">
                Run an analysis to see how legendary investors would rate this stock.
              </p>
              <Button onClick={handleRunAnalysis} disabled={isRunning || runAnalysisMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
                {isRunning ? "Running..." : "Run Analysis"}
              </Button>
            </Card>
          )}
        </div>

        {/* Analysis Detail Dialog */}
        {selectedAnalysis && (
          <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedAnalysis.personaName} Analysis</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="criteria">Criteria</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Score: {selectedAnalysis.score}/100</h4>
                    <Progress value={selectedAnalysis.score} className="h-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Verdict</h4>
                    <Badge className="mb-4">{selectedAnalysis.verdict}</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <ul className="space-y-2">
                      {selectedAnalysis.summaryBullets?.map((bullet, idx) => (
                        <li key={idx} className="text-sm">• {bullet}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="criteria" className="space-y-4">
                  {selectedAnalysis.criteria?.map((criterion, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{criterion.name}</h4>
                        <Badge variant={criterion.status === "pass" ? "default" : criterion.status === "partial" ? "secondary" : "destructive"}>
                          {criterion.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{criterion.explanation}</p>
                      {criterion.metricsUsed && criterion.metricsUsed.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Metrics: {criterion.metricsUsed.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="risks" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Key Risks</h4>
                    <ul className="space-y-2">
                      {selectedAnalysis.keyRisks?.map((risk, idx) => (
                        <li key={idx} className="text-sm">• {risk}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">What Would Change Mind</h4>
                    <ul className="space-y-2">
                      {selectedAnalysis.whatWouldChangeMind?.map((item, idx) => (
                        <li key={idx} className="text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
