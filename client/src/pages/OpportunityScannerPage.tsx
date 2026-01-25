import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Opportunity {
  id: number;
  rank: number;
  ticker: string;
  companyName: string;
  score: number;
  currentPrice: number | null;
  marketCap: number | null;
  sector: string | null;
  thesis?: string;
  confidence?: string;
}

export function OpportunityScannerPage() {
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<any>(null);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const personas = trpc.personas.list.useQuery();
  const startScan = trpc.opportunityScanning.startScan.useMutation();
  const getScanProgress = trpc.opportunityScanning.getScanProgress.useQuery(
    { scanJobId: scanJobId || 0 },
    { enabled: !!scanJobId && isScanning, refetchInterval: 2000 }
  );
  const getOpportunities = trpc.opportunityScanning.getOpportunities.useQuery(
    { scanJobId: scanJobId || 0, limit: 50 },
    { enabled: !!scanJobId && !isScanning }
  );
  const getDataStatusQuery = trpc.opportunityScanning.getDataStatus.useQuery();
  const refreshData = trpc.opportunityScanning.refreshData.useMutation();

  // Update scan progress
  useEffect(() => {
    if (getScanProgress.data) {
      setScanProgress(getScanProgress.data);
      if (getScanProgress.data.status === "completed") {
        setIsScanning(false);
      }
    }
  }, [getScanProgress.data]);

  // Update opportunities
  useEffect(() => {
    if (getOpportunities.data) {
      setOpportunities(getOpportunities.data as Opportunity[]);
    }
  }, [getOpportunities.data]);

  // Update data status
  useEffect(() => {
    if (getDataStatusQuery.data) {
      setDataStatus(getDataStatusQuery.data);
    }
  }, [getDataStatusQuery.data]);

  const handleStartScan = async (personaId: number) => {
    setSelectedPersona(personaId);
    setIsScanning(true);
    setOpportunities([]);
    setScanProgress(null);

    try {
      const result = await startScan.mutateAsync({ personaId });
      setScanJobId(result.scanJobId);
    } catch (error) {
      console.error("Failed to start scan:", error);
      setIsScanning(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      await refreshData.mutateAsync({ scheduleForLater: false });
      // Refetch data status
      getDataStatusQuery.refetch();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Opportunity Scanner</h1>
        <p className="text-gray-600">
          Scan all US stocks to find opportunities matching your investment style
        </p>
      </div>

      {/* Data Status Header */}
      <Card className="mb-8 p-6 bg-blue-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">Financial Data Cache</h3>
            {dataStatus?.lastUpdated ? (
              <p className="text-sm text-gray-600">
                Last updated: {new Date(dataStatus.lastUpdated).toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-gray-600">No data cached yet</p>
            )}
            <p className="text-sm text-gray-600">
              Stocks cached: {dataStatus?.stocksCached || 0} / 5,500
            </p>
          </div>
          <Button
            onClick={handleRefreshData}
            disabled={refreshData.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {refreshData.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>
      </Card>

      {/* Persona Selection */}
      {!isScanning && opportunities.length === 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Select an Investor Persona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.data?.map((persona) => (
              <Card
                key={persona.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleStartScan(persona.id)}
              >
                <h3 className="font-bold text-lg mb-2">{persona.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{persona.description}</p>
                <Button className="w-full">Start Scan</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scan Progress */}
      {isScanning && scanProgress && (
        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-bold mb-4">Scanning...</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">
                Phase: {scanProgress.phase}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(scanProgress.processedStocks / scanProgress.totalStocks) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Processed: {scanProgress.processedStocks} / {scanProgress.totalStocks} stocks
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Opportunities Found</p>
                <p className="text-2xl font-bold">{scanProgress.opportunitiesFound}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">LLM Analyses</p>
                <p className="text-2xl font-bold">{scanProgress.llmAnalysesCompleted}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {!isScanning && opportunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Found {opportunities.length} Opportunities
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Ticker</th>
                  <th className="text-left p-3">Company</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Market Cap</th>
                  <th className="text-left p-3">Sector</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{opp.rank}</td>
                    <td className="p-3 font-bold">{opp.ticker}</td>
                    <td className="p-3">{opp.companyName}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {opp.score}
                      </span>
                    </td>
                    <td className="p-3">${opp.currentPrice?.toFixed(2) || "N/A"}</td>
                    <td className="p-3">
                      {opp.marketCap
                        ? `$${(opp.marketCap / 1e9).toFixed(1)}B`
                        : "N/A"}
                    </td>
                    <td className="p-3">{opp.sector || "N/A"}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOpportunity(opp)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedOpportunity && (
        <Card className="fixed inset-4 z-50 overflow-y-auto p-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {selectedOpportunity.ticker} - {selectedOpportunity.companyName}
            </h2>
            <Button
              variant="ghost"
              onClick={() => setSelectedOpportunity(null)}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Investment Thesis</h3>
              <p className="text-gray-700">{selectedOpportunity.thesis || "N/A"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2">Key Metrics</h3>
                <ul className="text-sm space-y-1">
                  <li>Score: {selectedOpportunity.score}</li>
                  <li>Price: ${selectedOpportunity.currentPrice?.toFixed(2)}</li>
                  <li>Market Cap: ${(selectedOpportunity.marketCap! / 1e9).toFixed(1)}B</li>
                  <li>Sector: {selectedOpportunity.sector}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Confidence</h3>
                <p className="text-lg capitalize">{selectedOpportunity.confidence}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
