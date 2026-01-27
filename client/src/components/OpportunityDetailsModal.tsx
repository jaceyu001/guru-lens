import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

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
    criteria?: Record<string, any>;
    strengths?: string[];
    risks?: string[];
    verdict?: string;
  };
}

export function OpportunityDetailsModal({
  isOpen,
  onClose,
  opportunity,
}: OpportunityDetailsModalProps) {
  if (!opportunity) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return "bg-gray-100 text-gray-800";
    if (verdict.toUpperCase() === "BUY") return "bg-green-100 text-green-800";
    if (verdict.toUpperCase() === "SELL") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <DialogTitle className="text-2xl">{opportunity.ticker}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{opportunity.company}</p>
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
          {/* Score and Verdict */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Investment Score</p>
              <div className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(opportunity.score)}`}>
                {Math.round(opportunity.score)} / 100
              </div>
            </Card>
            {opportunity.verdict && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Recommendation</p>
                <Badge className={`${getVerdictColor(opportunity.verdict)} text-sm py-1 px-3`}>
                  {opportunity.verdict.toUpperCase()}
                </Badge>
              </Card>
            )}
          </div>

          {/* Key Metrics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {opportunity.price !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-lg font-semibold">${opportunity.price.toFixed(2)}</p>
                </div>
              )}
              {opportunity.marketCap !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-semibold">
                    ${(opportunity.marketCap / 1e9).toFixed(1)}B
                  </p>
                </div>
              )}
              {opportunity.sector && (
                <div>
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <p className="text-lg font-semibold">{opportunity.sector}</p>
                </div>
              )}
              {opportunity.confidence && (
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-lg font-semibold capitalize">{opportunity.confidence}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Investment Thesis */}
          {opportunity.thesis && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Investment Thesis</h3>
              <p className="text-sm leading-relaxed text-foreground">{opportunity.thesis}</p>
            </Card>
          )}

          {/* Strengths */}
          {opportunity.strengths && opportunity.strengths.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Key Strengths</h3>
              <ul className="space-y-2">
                {opportunity.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Risks */}
          {opportunity.risks && opportunity.risks.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Key Risks</h3>
              <ul className="space-y-2">
                {opportunity.risks.map((risk, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="text-red-600 font-bold">⚠</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Scoring Criteria */}
          {opportunity.criteria && Object.keys(opportunity.criteria).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Scoring Criteria</h3>
              <div className="space-y-2">
                {Object.entries(opportunity.criteria).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
