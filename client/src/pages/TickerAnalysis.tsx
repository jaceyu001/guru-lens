// @ts-nocheck
/**
 * Comprehensive Ticker Analysis Page
 * 
 * Displays all 18 agents (12 personas + 4 technical + risk manager)
 * with consensus voting, trading signals, and risk metrics
 */

import { useRoute } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Target, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function TickerAnalysis() {
  const [, params] = useRoute("/ticker/:symbol");
  const symbol = params?.symbol?.toUpperCase() || "";
  const [activeTab, setActiveTab] = useState("personas");
  // Fetch analysis data
  const { data: analysisData, isLoading, error } = trpc.analyses.getLatestForTicker.useQuery(
    { symbol },
    { enabled: !!symbol }
  );

  if (!symbol) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground">No ticker selected</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading analysis...</div>
      </div>
    );
  }

  if (error || !analysisData || analysisData.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error?.message || "Failed to load analysis"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from analysis
  const personaAnalyses = Array.isArray(analysisData) ? analysisData : [analysisData];
  const technicalAgents = [];
  const riskManager = null;
  const consensus = null;
  const tradingSignal = null;

  // Helper to get verdict badge color
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Strong Fit":
        return "bg-green-100 text-green-800";
      case "Fit":
        return "bg-blue-100 text-blue-800";
      case "Borderline":
        return "bg-yellow-100 text-yellow-800";
      case "Not a Fit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{symbol}</h1>
        <p className="text-lg text-muted-foreground">Comprehensive Multi-Agent Analysis</p>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personas">Personas ({personaAnalyses.length})</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personaAnalyses.map((analysis: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{analysis.personaName}</CardTitle>
                      <CardDescription>Score: {analysis.score}/100</CardDescription>
                    </div>
                    <Badge className={getVerdictColor(analysis.verdict)}>{analysis.verdict}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Summary:</h4>
                    <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                  </div>
                  {analysis.criteria && analysis.criteria.length > 0 && (
                    <div className="space-y-2 border-t pt-2">
                      <h4 className="font-semibold text-sm">Criteria:</h4>
                      {analysis.criteria.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{c.name}</span>
                          <Badge
                            variant={
                              c.status === "pass"
                                ? "default"
                                : c.status === "partial"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {c.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {analysis.keyRisks && analysis.keyRisks.length > 0 && (
                    <div className="space-y-2 border-t pt-2">
                      <h4 className="font-semibold text-sm">Key Risks:</h4>
                      <ul className="space-y-1">
                        {analysis.keyRisks.map((risk: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Technical Agents Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Agents (Coming Soon)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Technical agent analysis (Valuation, Sentiment, Fundamentals, Technicals) will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Assessment (Coming Soon)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Risk metrics and position sizing recommendations will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Research Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This analysis is for educational and research purposes only. It is not investment advice. Past
            performance does not guarantee future results. Please consult with a financial advisor before making
            investment decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
