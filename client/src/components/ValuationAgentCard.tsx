import { useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ValuationFindings } from "@shared/types";

interface ValuationAgentCardProps {
  findings: ValuationFindings;
  isLoading?: boolean;
}

export function ValuationAgentCard({ findings, isLoading }: ValuationAgentCardProps) {
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());

  const toggleMethod = (methodName: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(methodName)) {
      newExpanded.delete(methodName);
    } else {
      newExpanded.add(methodName);
    }
    setExpandedMethods(newExpanded);
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case "UNDERVALUED":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "FAIRLY_VALUED":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "OVERVALUED":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "UNABLE_TO_VALUE":
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getMethodAgreementColor = (agreement: string) => {
    switch (agreement) {
      case "STRONG":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "MODERATE":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "WEAK":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "DIVERGENT":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getComparisonTypeBadge = (assumptions: Record<string, any>) => {
    const comparisonType = assumptions?.comparisonType;
    const currentPeriod = assumptions?.currentPeriod;
    const priorPeriod = assumptions?.priorPeriod;

    if (!comparisonType) return null;

    const label =
      comparisonType === "TTM_VS_FY"
        ? `${currentPeriod} TTM vs ${priorPeriod} FY`
        : comparisonType === "FY_VS_FY"
        ? `${currentPeriod} vs ${priorPeriod} (Q1 Only)`
        : null;

    const tooltip =
      comparisonType === "TTM_VS_FY"
        ? "Trailing Twelve Months compared to last Fiscal Year. Used when Q2+ data is available."
        : comparisonType === "FY_VS_FY"
        ? "Fiscal Year comparison. Used when only Q1 data is available for stability."
        : "";

    if (!label) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 cursor-help">
              {label}
              <Info className="w-3 h-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Valuation Analysis</h2>
          <Badge variant="outline" className="bg-slate-100">Agent</Badge>
        </div>

        {/* Current Price */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">Current Price</p>
          <p className="text-3xl font-bold text-slate-900">${findings.currentPrice.toFixed(2)}</p>
        </div>

        {/* Consensus Valuation */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Consensus Valuation</h3>
            <div className="flex items-center gap-2">
              <Badge className={`${getAssessmentColor(findings.overallAssessment)}`}>
                {findings.overallAssessment.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.confidence}% confidence
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Low</p>
              <p className="text-lg font-semibold text-slate-900">
                ${findings.consensusValuation.low.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Midpoint</p>
              <p className="text-lg font-semibold text-slate-900">
                ${findings.consensusValuation.midpoint.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">High</p>
              <p className="text-lg font-semibold text-slate-900">
                ${findings.consensusValuation.high.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Upside Potential</p>
              <p className={`text-sm font-semibold ${findings.consensusUpside > 0 ? "text-green-600" : "text-red-600"}`}>
                {findings.consensusUpside > 0 ? "+" : ""}{findings.consensusUpside.toFixed(1)}%
              </p>
            </div>
            <Progress value={Math.min(Math.max((findings.consensusUpside + 50) / 2, 0), 100)} className="h-2" />
          </div>
        </div>

        {/* Data Quality Warnings */}
        {findings.dataQualityWarnings && findings.dataQualityWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-900 mb-2">Data Quality Warnings</p>
            <ul className="text-xs text-yellow-800 space-y-1">
              {findings.dataQualityWarnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Margin of Safety & Method Agreement */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">Margin of Safety</p>
            <p className="text-2xl font-bold text-slate-900">{findings.marginOfSafety.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {findings.marginOfSafety > 20 ? "✓ Adequate" : findings.marginOfSafety > 10 ? "⚠ Moderate" : "✗ Low"}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">Method Agreement</p>
            <Badge className={`${getMethodAgreementColor(findings.methodAgreement)} mt-2`}>
              {findings.methodAgreement}
            </Badge>
          </div>
        </div>

        {/* Valuation Methods */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900">Valuation Methods</h3>
          {findings.methods.map((method) => (
            <div key={method.name} className="border border-slate-200 rounded-lg bg-white">
              <button
                onClick={() => toggleMethod(method.name)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-900">{method.name}</span>
                  <Badge className={`${getAssessmentColor(method.assessment)}`}>
                    {method.assessment.replace(/_/g, " ")}
                  </Badge>
                  {getComparisonTypeBadge(method.assumptions)}
                  <span className="text-sm font-medium text-slate-600">
                    ${method.intrinsicValue.toFixed(2)}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedMethods.has(method.name) ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMethods.has(method.name) && (
                <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Intrinsic Value</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${method.intrinsicValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Upside</p>
                      <p className={`text-lg font-semibold ${method.upside > 0 ? "text-green-600" : "text-red-600"}`}>
                        {method.upside > 0 ? "+" : ""}{method.upside.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Confidence</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={method.confidence * 100} className="h-2 flex-1" />
                      <span className="text-sm font-semibold text-slate-900">
                        {(method.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Assumptions</p>
                    <div className="space-y-1">
                      {Object.entries(method.assumptions)
                        .filter(([key]) => !['comparisonType', 'currentPeriod', 'priorPeriod'].includes(key))
                        .map(([key, value]) => (
                          <p key={key} className="text-sm text-slate-600">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </p>
                        ))}
                    </div>
                    {method.assumptions?.comparisonType && (
                      <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs font-medium text-purple-900 mb-1">Growth Comparison:</p>
                        <p className="text-xs text-purple-800">
                          {method.assumptions.comparisonType === "TTM_VS_FY"
                            ? `${method.assumptions.currentPeriod} TTM vs ${method.assumptions.priorPeriod} FY`
                            : `${method.assumptions.currentPeriod} vs ${method.assumptions.priorPeriod} (Q1 Only)`}
                        </p>
                      </div>
                    )}
                  </div>
                  {method.limitations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Limitations</p>
                      <ul className="space-y-1">
                        {method.limitations.map((limitation, idx) => (
                          <li key={idx} className="text-sm text-slate-600 flex gap-2">
                            <span>•</span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-slate-700 italic">{method.narrative}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Summary</p>
          <p className="text-sm text-blue-800">{findings.summary}</p>
        </div>

        {/* Data Quality Warnings */}
        {findings.dataQualityWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900 mb-2">Data Quality Warnings</p>
            <ul className="space-y-1">
              {findings.dataQualityWarnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-800 flex gap-2">
                  <span>⚠</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
