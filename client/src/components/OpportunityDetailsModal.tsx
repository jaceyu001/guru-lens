import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface OpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    ticker: string;
    company: string;
    sector: string | null;
    price: number | null;
    marketCap: number | null;
    score: number;
    thesis?: string;
    confidence?: string;
    criteria?: any[];
    summaryBullets?: string[];
    strengths?: string[];
    risks?: string[];
    keyRisks?: string[];
    whatWouldChangeMind?: string[];
    verdict?: string;
    dataUsed?: {
      sources: string[];
      timestamp?: string;
    };
    financialMetrics?: {
      peRatio?: number;
      pbRatio?: number;
      psRatio?: number;
      pegRatio?: number;
      dividendYield?: number;
      roe?: number;
      roa?: number;
      roic?: number;
      debtToEquity?: number;
      currentRatio?: number;
      netMargin?: number;
      operatingMargin?: number;
      grossMargin?: number;
      earningsGrowth?: number;
      revenueGrowth?: number;
    };
  };
}

export function OpportunityDetailsModal({
  isOpen,
  onClose,
  opportunity,
}: OpportunityDetailsModalProps) {
  if (!opportunity) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return "bg-gray-100 text-gray-800";
    const v = verdict.toLowerCase();
    if (v.includes("strong") || v.includes("buy")) return "bg-green-100 text-green-800";
    if (v.includes("fit") && !v.includes("not")) return "bg-blue-100 text-blue-800";
    if (v.includes("borderline")) return "bg-yellow-100 text-yellow-800";
    if (v.includes("not") || v.includes("sell")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getCriteriaStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    if (status === "pass") return "bg-green-100 text-green-800";
    if (status === "partial") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatMetric = (value: number | undefined, decimals: number = 2, suffix: string = "") => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(decimals)}${suffix}`;
  };

  const criteria = opportunity.criteria || [];
  const summaryBullets = opportunity.summaryBullets || [];
  const strengths = opportunity.strengths || [];
  const risks = opportunity.keyRisks || opportunity.risks || [];
  const whatWouldChangeMind = opportunity.whatWouldChangeMind || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <DialogTitle className="text-2xl">{opportunity.ticker}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{opportunity.company}</p>
                {opportunity.sector && (
                  <p className="text-xs text-muted-foreground mt-1">{opportunity.sector}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Score & Verdict */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Investment Score</div>
              <div className={`text-4xl font-bold font-mono-numbers ${getScoreColor(opportunity.score)}`}>
                {Math.round(opportunity.score)} / 100
              </div>
            </div>
            {opportunity.verdict && (
              <Badge className={`text-lg px-4 py-2 ${getVerdictColor(opportunity.verdict)}`}>
                {opportunity.verdict.toUpperCase()}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Score Progress</span>
              <span>{Math.round(opportunity.score)}%</span>
            </div>
            <Progress value={opportunity.score} className="h-2" />
          </div>

          {/* Key Metrics Grid */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {opportunity.price !== null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-lg font-semibold">${opportunity.price.toFixed(2)}</p>
                </div>
              )}
              {opportunity.marketCap !== null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                  <p className="text-lg font-semibold">
                    ${(opportunity.marketCap / 1e9).toFixed(1)}B
                  </p>
                </div>
              )}
              {opportunity.confidence && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p className="text-lg font-semibold capitalize">{opportunity.confidence}</p>
                </div>
              )}
              {opportunity.financialMetrics?.peRatio !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">P/E Ratio</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.peRatio)}</p>
                </div>
              )}
              {opportunity.financialMetrics?.pbRatio !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">P/B Ratio</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.pbRatio)}</p>
                </div>
              )}
              {opportunity.financialMetrics?.roe !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ROE</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.roe, 1, "%")}</p>
                </div>
              )}
              {opportunity.financialMetrics?.debtToEquity !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Debt/Equity</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.debtToEquity, 2)}</p>
                </div>
              )}
              {opportunity.financialMetrics?.currentRatio !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Ratio</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.currentRatio, 2)}</p>
                </div>
              )}
              {opportunity.financialMetrics?.netMargin !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Net Margin</p>
                  <p className="text-lg font-semibold">{formatMetric(opportunity.financialMetrics.netMargin, 1, "%")}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Financial Metrics Expanded */}
          {opportunity.financialMetrics && Object.keys(opportunity.financialMetrics).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Financial Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {opportunity.financialMetrics.peRatio !== undefined && (
                  <div>
                    <p className="text-muted-foreground">P/E Ratio</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.peRatio)}</p>
                  </div>
                )}
                {opportunity.financialMetrics.psRatio !== undefined && (
                  <div>
                    <p className="text-muted-foreground">P/S Ratio</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.psRatio)}</p>
                  </div>
                )}
                {opportunity.financialMetrics.pegRatio !== undefined && (
                  <div>
                    <p className="text-muted-foreground">PEG Ratio</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.pegRatio)}</p>
                  </div>
                )}
                {opportunity.financialMetrics.dividendYield !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Dividend Yield</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.dividendYield, 2, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.roe !== undefined && (
                  <div>
                    <p className="text-muted-foreground">ROE</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.roe, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.roa !== undefined && (
                  <div>
                    <p className="text-muted-foreground">ROA</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.roa, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.roic !== undefined && (
                  <div>
                    <p className="text-muted-foreground">ROIC</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.roic, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.debtToEquity !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Debt/Equity</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.debtToEquity, 2)}</p>
                  </div>
                )}
                {opportunity.financialMetrics.currentRatio !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Current Ratio</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.currentRatio, 2)}</p>
                  </div>
                )}
                {opportunity.financialMetrics.netMargin !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Net Margin</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.netMargin, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.operatingMargin !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Operating Margin</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.operatingMargin, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.grossMargin !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Gross Margin</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.grossMargin, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.earningsGrowth !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Earnings Growth</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.earningsGrowth, 1, "%")}</p>
                  </div>
                )}
                {opportunity.financialMetrics.revenueGrowth !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Revenue Growth</p>
                    <p className="font-semibold">{formatMetric(opportunity.financialMetrics.revenueGrowth, 1, "%")}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Investment Thesis */}
          {opportunity.thesis && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Investment Thesis</h3>
              <p className="text-sm leading-relaxed text-foreground">{opportunity.thesis}</p>
            </Card>
          )}

          {/* Summary Bullets */}
          {summaryBullets.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Summary</h3>
              <ul className="space-y-2">
                {summaryBullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Scoring Criteria Breakdown */}
          {criteria.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Scoring Criteria Breakdown</h3>
              <div className="space-y-4">
                {criteria.map((criterion, idx) => (
                  <Card key={idx} className="p-3 bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm">{criterion.name}</div>
                      <Badge className={`text-xs ${getCriteriaStatusColor(criterion.status)}`}>
                        {criterion.status || "N/A"}
                      </Badge>
                    </div>
                    {criterion.explanation && (
                      <p className="text-xs text-muted-foreground mb-2">{criterion.explanation}</p>
                    )}
                    {criterion.weight !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Weight: {(criterion.weight * 100).toFixed(0)}%</span>
                        {criterion.metricsUsed && (
                          <>
                            <span>•</span>
                            <span>Metrics: {criterion.metricsUsed.join(", ")}</span>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Key Strengths */}
          {strengths.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Key Strengths</h3>
              <ul className="space-y-2">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Key Risks */}
          {risks.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Key Risks</h3>
              <ul className="space-y-2">
                {risks.map((risk, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* What Would Change My Mind */}
          {whatWouldChangeMind.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">What Would Change My Mind</h3>
              <ul className="space-y-2">
                {whatWouldChangeMind.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Data Sources & Metadata */}
          {opportunity.dataUsed && (
            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-3 text-sm">Data Sources</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {opportunity.dataUsed.sources && opportunity.dataUsed.sources.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Sources:</p>
                    <p>{opportunity.dataUsed.sources.join(", ")}</p>
                  </div>
                )}
                {opportunity.dataUsed.timestamp && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Analyzed:</p>
                    <p>{new Date(opportunity.dataUsed.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
