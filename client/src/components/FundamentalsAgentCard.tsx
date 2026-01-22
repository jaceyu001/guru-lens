import { useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FundamentalsFindings } from "@shared/types";

interface FundamentalsAgentCardProps {
  findings: FundamentalsFindings;
  isLoading?: boolean;
}

export function FundamentalsAgentCard({ findings, isLoading }: FundamentalsAgentCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["growth"]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case "STRONG":
      case "EXCELLENT":
      case "HEALTHY":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "MODERATE":
      case "GOOD":
      case "STABLE":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "WEAK":
      case "FAIR":
      case "CONCERNING":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "POOR":
      case "WEAK":
      case "NEGATIVE":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    switch (trend) {
      case "ACCELERATING":
      case "IMPROVING":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "DECELERATING":
      case "DETERIORATING":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "STABLE":
        return <Minus className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getComparisonTypeDescription = (comparisonType: string | undefined): string => {
    switch (comparisonType) {
      case "TTM_VS_FY":
        return "Trailing Twelve Months (TTM) compared to last Full Year (FY)";
      case "FY_VS_FY":
        return "Full Year compared to prior Full Year (Q1 data only available)";
      case "INSUFFICIENT_DATA":
        return "Insufficient data for comparison";
      default:
        return "Comparison type unknown";
    }
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
          <h2 className="text-xl font-bold text-slate-900">Fundamentals Analysis</h2>
          <Badge variant="outline" className="bg-slate-100">Agent</Badge>
        </div>

        {/* Growth Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => toggleSection("growth")}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Growth</span>
              <Badge className={`${getAssessmentColor(findings.growth.assessment)}`}>
                {findings.growth.assessment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.growth.confidence}% confidence
              </Badge>
              {getTrendIcon(findings.growth.trend)}
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedSections.has("growth") ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.has("growth") && (
            <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Revenue Growth</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.growth.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Earnings Growth</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.growth.earningsGrowth.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">FCF Growth</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.growth.fcfGrowth.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Period Label with Tooltip */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {findings.growth.currentPeriod} vs {findings.growth.priorPeriod}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {getComparisonTypeDescription(findings.growth.comparisonType)}
                  </p>
                </div>
              </div>

              {/* Data Quality Warnings */}
              {Object.values(findings.growth.dataQualityFlags || {}).some(v => v) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs font-medium text-yellow-900">Data Quality Notes:</p>
                  <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                    {findings.growth.dataQualityFlags?.onlyQ1Available && (
                      <li>• Only Q1 data available - using FY vs FY comparison</li>
                    )}
                    {findings.growth.dataQualityFlags?.ttmNotAvailable && (
                      <li>• TTM not available - using FY vs FY comparison</li>
                    )}
                    {findings.growth.dataQualityFlags?.insufficientData && (
                      <li>• Insufficient financial data for reliable growth calculation</li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-sm text-slate-700 italic">{findings.growth.narrative}</p>
            </div>
          )}
        </div>

        {/* Profitability Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => toggleSection("profitability")}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Profitability</span>
              <Badge className={`${getAssessmentColor(findings.profitability.assessment)}`}>
                {findings.profitability.assessment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.profitability.confidence}% confidence
              </Badge>
              {getTrendIcon(findings.profitability.trend)}
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedSections.has("profitability") ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.has("profitability") && (
            <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Net Margin</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.profitability.netMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Operating Margin</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.profitability.operatingMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Gross Margin</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.profitability.grossMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 italic">{findings.profitability.narrative}</p>
            </div>
          )}
        </div>

        {/* Capital Efficiency Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => toggleSection("capitalEfficiency")}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Capital Efficiency</span>
              <Badge className={`${getAssessmentColor(findings.capitalEfficiency.assessment)}`}>
                {findings.capitalEfficiency.assessment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.capitalEfficiency.confidence}% confidence
              </Badge>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedSections.has("capitalEfficiency") ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.has("capitalEfficiency") && (
            <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">ROE</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.capitalEfficiency.roe !== null ? `${findings.capitalEfficiency.roe.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">ROIC</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.capitalEfficiency.roic !== null ? `${findings.capitalEfficiency.roic.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">ROA</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.capitalEfficiency.roa !== null ? `${findings.capitalEfficiency.roa.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 italic">{findings.capitalEfficiency.narrative}</p>
            </div>
          )}
        </div>

        {/* Financial Health Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => toggleSection("financialHealth")}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Financial Health</span>
              <Badge className={`${getAssessmentColor(findings.financialHealth.assessment)}`}>
                {findings.financialHealth.assessment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.financialHealth.confidence}% confidence
              </Badge>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedSections.has("financialHealth") ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.has("financialHealth") && (
            <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Debt/Equity</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.financialHealth.debtToEquity !== null ? `${findings.financialHealth.debtToEquity.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Current Ratio</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.financialHealth.currentRatio !== null ? `${findings.financialHealth.currentRatio.toFixed(2)}x` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Interest Coverage</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.financialHealth.interestCoverage !== null ? `${findings.financialHealth.interestCoverage.toFixed(1)}x` : "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 italic">{findings.financialHealth.narrative}</p>
            </div>
          )}
        </div>

        {/* Cash Flow Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => toggleSection("cashFlow")}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Cash Flow</span>
              <Badge className={`${getAssessmentColor(findings.cashFlow.assessment)}`}>
                {findings.cashFlow.assessment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {findings.cashFlow.confidence}% confidence
              </Badge>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                expandedSections.has("cashFlow") ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.has("cashFlow") && (
            <div className="px-4 pb-4 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">FCF Margin</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.cashFlow.fcfMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">FCF Growth</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {findings.cashFlow.fcfGrowth.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 italic">{findings.cashFlow.narrative}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {findings.summary && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700">{findings.summary}</p>
          </div>
        )}

        {/* Data Quality Warnings */}
        {findings.dataQualityWarnings && findings.dataQualityWarnings.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-semibold text-orange-900 mb-2">Data Quality Warnings:</p>
            <ul className="text-sm text-orange-800 space-y-1">
              {findings.dataQualityWarnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
