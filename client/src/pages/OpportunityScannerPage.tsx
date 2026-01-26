"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertCircle, RefreshCw, Play, Loader2, ChevronDown, ChevronUp } from "lucide-react";


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

interface FilterState {
  sectors: string[];
  marketCapMin: number | null;
  marketCapMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  minScore: number;
}

export default function OpportunityScannerPage() {
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<any>(null);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sectors: [],
    marketCapMin: null,
    marketCapMax: null,
    priceMin: null,
    priceMax: null,
    minScore: 0,
  });

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

  const handleStartScan = async (personaId: number, testMode: boolean = false) => {
    setSelectedPersona(personaId);
    setIsScanning(true);
    setOpportunities([]);
    setScanProgress(null);

    try {
      const result = await startScan.mutateAsync({ personaId, testMode });
      setScanJobId(result.scanJobId);
    } catch (error) {
      console.error("Failed to start scan:", error);
      setIsScanning(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      await refreshData.mutateAsync({ scheduleForLater: false });
      getDataStatusQuery.refetch();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };
  // Filter opportunities based on current filters
  const filteredOpportunities = opportunities.filter((opp) => {
    // Sector filter
    if (filters.sectors.length > 0 && !filters.sectors.includes(opp.sector || "")) {
      return false;
    }

    // Market cap filter (in billions)
    if (opp.marketCap) {
      const marketCapInBillions = opp.marketCap / 1e9;
      if (filters.marketCapMin !== null && marketCapInBillions < filters.marketCapMin) {
        return false;
      }
      if (filters.marketCapMax !== null && marketCapInBillions > filters.marketCapMax) {
        return false;
      }
    }

    // Price filter
    if (opp.currentPrice) {
      if (filters.priceMin !== null && opp.currentPrice < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== null && opp.currentPrice > filters.priceMax) {
        return false;
      }
    }

    // Score filter
    if (opp.score < filters.minScore) {
      return false;
    }

    return true;
  });

  const activeFilterCount = [
    filters.sectors.length > 0 ? 1 : 0,
    filters.marketCapMin !== null || filters.marketCapMax !== null ? 1 : 0,
    filters.priceMin !== null || filters.priceMax !== null ? 1 : 0,
    filters.minScore > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleClearFilters = () => {
    setFilters({
      sectors: [],
      marketCapMin: null,
      marketCapMax: null,
      priceMin: null,
      priceMax: null,
      minScore: 0,
    });
  };

  // Get unique sectors from opportunities
  const uniqueSectors = Array.from(
    new Set(opportunities.map((o) => o.sector).filter(Boolean))
  ) as string[];

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
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{persona.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{persona.description}</p>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleStartScan(persona.id)}
                  >
                    Start Scan (5,500 stocks)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => handleStartScan(persona.id, true)}
                  >
                    Test Scan (10 stocks)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scan Progress */}
      {isScanning && scanProgress && (
        <Card className="mb-8 p-6 bg-yellow-50">
          <h3 className="font-semibold text-lg mb-4">Scan in Progress</h3>
          <div className="space-y-2">
            <p className="text-sm">Phase: {scanProgress.phase}</p>
            <p className="text-sm">Processed: {scanProgress.processedStocks} stocks</p>
            <p className="text-sm">Opportunities Found: {scanProgress.opportunitiesFound}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((scanProgress.processedStocks / 5500) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      {!isScanning && opportunities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              🔍 Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                className="text-sm"
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {showFilters && (
            <Card className="p-6 mb-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sector Filter */}
                <div>
                  <label className="block font-semibold mb-2">Sector</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueSectors.map((sector) => (
                      <label key={sector} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.sectors.includes(sector)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                sectors: [...filters.sectors, sector],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                sectors: filters.sectors.filter((s) => s !== sector),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{sector}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Market Cap Filter */}
                <div>
                  <label className="block font-semibold mb-2">Market Cap (Billions)</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.marketCapMin || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          marketCapMin: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.marketCapMax || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          marketCapMax: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block font-semibold mb-2">Price Range ($)</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceMin: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceMax: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>

                {/* Minimum Score Filter */}
                <div>
                  <label className="block font-semibold mb-2">Minimum Score</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.minScore}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minScore: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="text-sm font-semibold text-center">
                      {filters.minScore}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Results */}
      {!isScanning && opportunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Showing {filteredOpportunities.length} of {opportunities.length} Opportunities
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Ticker</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Sector</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Market Cap</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{opp.rank}</td>
                    <td className="p-3 font-bold">{opp.ticker}</td>
                    <td className="p-3">{opp.companyName}</td>
                    <td className="p-3 text-sm">{opp.sector || "-"}</td>
                    <td className="p-3 text-right">
                      ${opp.currentPrice?.toFixed(2) || "-"}
                    </td>
                    <td className="p-3 text-right text-sm">
                      {opp.marketCap
                        ? `$${(opp.marketCap / 1e9).toFixed(1)}B`
                        : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                        {opp.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        onClick={() => setSelectedOpportunity(opp)}
                        variant="outline"
                        size="sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedOpportunity.ticker} - {selectedOpportunity.companyName}
                </h2>
                <p className="text-gray-600">Score: {selectedOpportunity.score.toFixed(0)}</p>
              </div>
              <Button
                onClick={() => setSelectedOpportunity(null)}
                variant="ghost"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Investment Thesis</h3>
                <p className="text-sm text-gray-700">
                  {selectedOpportunity.thesis || "No thesis available"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="font-bold">${selectedOpportunity.currentPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Market Cap</p>
                  <p className="font-bold">
                    {selectedOpportunity.marketCap
                      ? `$${(selectedOpportunity.marketCap / 1e9).toFixed(1)}B`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sector</p>
                  <p className="font-bold">{selectedOpportunity.sector || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="font-bold">{selectedOpportunity.confidence || "-"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!isScanning && opportunities.length === 0 && dataStatus?.stocksCached === 0 && (
        <Card className="p-8 text-center bg-gray-50">
          <p className="text-gray-600 mb-4">
            No financial data cached. Refresh data to start scanning.
          </p>
        </Card>
      )}
    </div>
  );
}
