import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, TrendingUp, RefreshCw, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function Opportunities() {
  const { personaId } = useParams<{ personaId: string }>();
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);

  const personas = trpc.personas.list.useQuery();
  const opportunities = trpc.opportunities.getForPersona.useQuery(
    { personaId: personaId || "", limit: 50 },
    { enabled: !!personaId }
  );

  const scanMutation = trpc.opportunities.generateDailyScan.useMutation({
    onSuccess: () => {
      opportunities.refetch();
      setIsScanning(false);
    },
    onError: (error) => {
      console.error("Scan failed:", error);
      setIsScanning(false);
    },
  });

  const currentPersona = personas.data?.find(p => p.personaId === personaId);

  const handleGenerateScan = () => {
    if (!personaId) return;
    setIsScanning(true);
    scanMutation.mutate({ personaId });
  };

  const getChangeStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "improved":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "unchanged":
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      case "dropped":
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

  if (!personaId) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-6">Opportunities by Persona</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {personas.data?.map((persona) => (
              <Card
                key={persona.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setLocation(`/opportunities/${persona.personaId}`)}
              >
                <h3 className="text-xl font-bold mb-2">{persona.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{persona.description}</p>
                <Button variant="outline" className="w-full">
                  View Opportunities
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={handleGenerateScan}
            disabled={isScanning || scanMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Generate New Scan"}
          </Button>
        </div>

        {/* Persona Header */}
        {currentPersona && (
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{currentPersona.name}</h1>
                <p className="text-muted-foreground mb-4">{currentPersona.description}</p>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Investment Philosophy</div>
                  <p className="text-sm text-muted-foreground">{currentPersona.investmentPhilosophy}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Opportunities List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Today's Opportunities</h2>
            {opportunities.data && opportunities.data.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {opportunities.data.length} opportunities found
              </div>
            )}
          </div>

          {opportunities.isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 bg-muted rounded"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : opportunities.data && opportunities.data.length > 0 ? (
            <div className="space-y-4">
              {opportunities.data.map((opp) => (
                <Card
                  key={opp.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setLocation(`/ticker/${opp.ticker.symbol}`)}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="text-2xl font-bold text-primary">#{opp.rank}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">{opp.ticker.symbol}</h3>
                            <Badge className={getChangeStatusColor(opp.changeStatus)}>
                              {opp.changeStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{opp.ticker.companyName}</p>
                          {opp.ticker.sector && (
                            <Badge variant="outline" className="mt-2">{opp.ticker.sector}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold font-mono-numbers ${getScoreColor(opp.analysis.score)}`}>
                            {opp.analysis.score}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                          {opp.previousScore && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Previous: {opp.previousScore}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Why Now */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">Why Now?</span>
                        </div>
                        <ul className="space-y-1">
                          {opp.whyNow.map((reason, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key Metrics */}
                      <div className="flex flex-wrap gap-4 pt-4 border-t">
                        {Object.entries(opp.keyMetrics).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground">{key}: </span>
                            <span className="font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground mt-3">
                        Scanned: {new Date(opp.scanTimestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Opportunities Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate a daily scan to discover opportunities that match {currentPersona?.name}'s investment philosophy.
              </p>
              <Button onClick={handleGenerateScan} disabled={isScanning}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
                Generate Scan
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
