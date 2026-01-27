import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Loader2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OpportunityDetailsModal } from "@/components/OpportunityDetailsModal";

interface Opportunity {
  ticker: string;
  company: string;
  sector: string | null;
  price: number | null;
  marketCap: number | null;
  score: number;
  thesis?: string;
  confidence?: string;
}

export default function OpportunityScannerPage() {
  const [location, setLocation] = useLocation();
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const personas = trpc.personas.list.useQuery();
  const startScan = trpc.opportunityScanning.startScan.useMutation();
  const getDataStatusQuery = trpc.opportunityScanning.getDataStatus.useQuery();
  const getOpportunitiesQuery = trpc.opportunityScanning.getOpportunities.useQuery(
    { scanJobId: scanJobId || 0, limit: 50 },
    { enabled: !!scanJobId }
  );
  const refreshData = trpc.opportunityScanning.refreshData.useMutation();

  // Poll for results when scanning
  useEffect(() => {
    if (!isScanning || !scanJobId) return;

    const pollInterval = setInterval(() => {
      getOpportunitiesQuery.refetch();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isScanning, scanJobId, getOpportunitiesQuery]);

  // Check if results are available
  useEffect(() => {
    if (getOpportunitiesQuery.data && getOpportunitiesQuery.data.length > 0) {
      const mapped = getOpportunitiesQuery.data.map((opp: any) => ({
        ticker: opp.ticker,
        company: opp.company || opp.ticker,
        sector: opp.sector,
        price: opp.price,
        marketCap: opp.marketCap,
        score: opp.score || opp.finalScore,
        thesis: opp.thesis,
        confidence: opp.confidence,
      }));
      setOpportunities(mapped);
      setIsScanning(false);
    }
  }, [getOpportunitiesQuery.data]);

  // Update data status
  useEffect(() => {
    if (getDataStatusQuery.data) {
      setDataStatus(getDataStatusQuery.data);
    }
  }, [getDataStatusQuery.data]);

  const handleStartScan = async (personaId: number, isTestScan: boolean) => {
    try {
      setSelectedPersonaId(personaId);
      setIsScanning(true);
      setOpportunities([]);
      setError(null);
      setScanJobId(null);

      // Start scan - returns immediately
      const result = await startScan.mutateAsync({
        personaId,
        testMode: isTestScan,
      });

      setScanJobId(result.scanJobId);
      console.log(`[Scan] Started scan job ${result.scanJobId}`);
    } catch (err) {
      console.error("Scan failed:", err);
      setError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setIsScanning(false);
    }
  };

  const handleBack = () => {
    setSelectedPersonaId(null);
    setIsScanning(false);
    setOpportunities([]);
    setError(null);
    setScanJobId(null);
  };

  const handleRefreshData = async () => {
    try {
      await refreshData.mutateAsync({});
      getDataStatusQuery.refetch();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const persona = personas.data?.find((p) => p.id === selectedPersonaId);

  // Show scanner page
  if (!selectedPersonaId || !persona) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Opportunity Scanner</h1>
            <p className="text-lg text-muted-foreground">
              Scan all US stocks to find opportunities matching your investment style
            </p>
          </div>

          {/* Financial Data Cache */}
          <Card className="mb-8 p-6 border-blue-200 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold mb-2">Financial Data Cache</h2>
                <p className="text-sm text-muted-foreground">
                  Last updated: {dataStatus?.lastUpdated ? new Date(dataStatus.lastUpdated).toLocaleString() : "Never"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Stocks cached: {dataStatus?.cachedStocks || 0} / 5,500
                </p>
              </div>
              <Button
                onClick={handleRefreshData}
                disabled={refreshData.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {refreshData.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh Data"
                )}
              </Button>
            </div>
          </Card>

          {/* Personas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.data?.map((p) => (
              <Card key={p.id} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{p.description}</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStartScan(p.id, false)}
                    disabled={startScan.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Start Scan (5,500 stocks)
                  </Button>
                  <Button
                    onClick={() => handleStartScan(p.id, true)}
                    disabled={startScan.isPending}
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Test Scan (10 stocks)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show scan in progress or results
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-8">
      <div className="maxw-6xl mx-auto">
        {/* Header with back button and persona info */}
        <div className="mb-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">{persona.name}</h1>
          <p className="text-muted-foreground">{persona.description}</p>
        </div>

        {/* Financial Data Cache */}
        <Card className="mb-8 p-6 border-blue-200 bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold mb-2">Financial Data Cache</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {dataStatus?.lastUpdated ? new Date(dataStatus.lastUpdated).toLocaleString() : "Never"}
              </p>
              <p className="text-sm text-muted-foreground">
                Stocks cached: {dataStatus?.cachedStocks || 0} / 5,500
              </p>
            </div>
            <Button
              onClick={handleRefreshData}
              disabled={refreshData.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {refreshData.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh Data"
              )}
            </Button>
          </div>
        </Card>

        {/* Scan in Progress, Error, or Results */}
        {isScanning ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <h2 className="text-2xl font-bold">Scan in Progress</h2>
              <p className="text-muted-foreground">
                Analyzing stocks and generating investment insights...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take 60-90 seconds
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center border-red-200 bg-red-50">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Scan Failed</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              Back to Personas
            </Button>
          </Card>
        ) : opportunities.length > 0 ? (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Top 5 Opportunities</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Ticker</th>
                    <th className="text-left py-3 px-4 font-semibold">Company</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Sector</th>
                    <th className="text-left py-3 px-4 font-semibold">Thesis</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-bold text-blue-600">{opp.ticker}</td>
                      <td className="py-3 px-4">{opp.company}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          opp.score >= 70 ? 'bg-green-100 text-green-800' :
                          opp.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(opp.score)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{opp.sector || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{opp.thesis?.substring(0, 50)}...</td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => {
                            setSelectedOpportunity(opp);
                            setIsDetailsOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              onClick={handleBack}
              variant="outline"
              className="mt-6"
            >
              Back to Personas
            </Button>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">No opportunities found</h2>
            <p className="text-muted-foreground mb-6">The scan completed but no opportunities matched the criteria.</p>
            <Button
              onClick={handleBack}
              variant="outline"
            >
              Back to Personas
            </Button>
          </Card>
        )}

        {/* Details Modal */}
        {selectedOpportunity && (
          <OpportunityDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedOpportunity(null);
            }}
            opportunity={selectedOpportunity}
          />
        )}
      </div>
    </div>
  );
}
