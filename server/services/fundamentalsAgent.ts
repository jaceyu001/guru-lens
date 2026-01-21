import { FinancialData } from "../../shared/types";
import { calculateGrowth, type GrowthCalculationResult } from "./growthCalculator";

type DataQualityFlags = NonNullable<FinancialData['dataQualityFlags']>;

export interface GrowthAnalysis {
  assessment: "STRONG" | "MODERATE" | "WEAK" | "UNCLEAR";
  revenueGrowth: number; // %
  earningsGrowth: number; // %
  fcfGrowth: number; // %
  trend: "ACCELERATING" | "STABLE" | "DECELERATING" | "UNKNOWN";
  narrative: string;
  confidence: number; // 0-100
  // TTM vs FY period information
  comparisonType: "TTM_VS_FY" | "FY_VS_FY" | "INSUFFICIENT_DATA";
  currentPeriod: string; // e.g., "2025 TTM" or "2024 FY"
  priorPeriod: string; // e.g., "2024 FY" or "2023 FY"
  dataQualityFlags: {
    onlyQ1Available?: boolean;
    ttmNotAvailable?: boolean;
    insufficientData?: boolean;
  };
}

export interface ProfitabilityAnalysis {
  assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
  netMargin: number; // %
  operatingMargin: number; // %
  grossMargin: number; // %
  trend: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
  narrative: string;
  confidence: number; // 0-100
}

export interface CapitalEfficiencyAnalysis {
  assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
  roe: number; // %
  roic: number; // %
  roa: number; // %
  narrative: string;
  confidence: number; // 0-100
}

export interface FinancialHealthAnalysis {
  assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR";
  debtToEquity: number; // %
  currentRatio: number;
  interestCoverage: number;
  narrative: string;
  confidence: number; // 0-100
}

export interface CashFlowAnalysis {
  assessment: "STRONG" | "HEALTHY" | "WEAK" | "NEGATIVE" | "UNCLEAR";
  fcfMargin: number; // %
  fcfGrowth: number; // %
  narrative: string;
  confidence: number; // 0-100
}

export interface FundamentalsFindings {
  growth: GrowthAnalysis;
  profitability: ProfitabilityAnalysis;
  capitalEfficiency: CapitalEfficiencyAnalysis;
  financialHealth: FinancialHealthAnalysis;
  cashFlow: CashFlowAnalysis;
  summary: string;
  dataQualityWarnings: string[];
  recommendationsForPersonas: string[];
}

export async function analyzeFundamentals(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<FundamentalsFindings> {
  // Analyze each category
  const growth = analyzeGrowth(financialData);
  const profitability = analyzeProfitability(financialData, dataQualityFlags);
  const capitalEfficiency = analyzeCapitalEfficiency(financialData, dataQualityFlags);
  const financialHealth = analyzeFinancialHealth(financialData, dataQualityFlags);
  const cashFlow = analyzeCashFlow(financialData);

  // Collect data quality warnings
  const dataQualityWarnings: string[] = [];
  if (dataQualityFlags.roicZero) {
    dataQualityWarnings.push("ROIC data is zero (flagged as anomalous)");
  }
  if (dataQualityFlags.interestCoverageZero) {
    dataQualityWarnings.push("Interest Coverage data is zero (flagged as anomalous)");
  }
  if (dataQualityFlags.peNegative) {
    dataQualityWarnings.push("P/E ratio is negative (flagged as anomalous)");
  }
  if (dataQualityFlags.peAnomalous) {
    dataQualityWarnings.push("P/E ratio appears anomalously high (>200)");
  }
  if (dataQualityFlags.pbAnomalous) {
    dataQualityWarnings.push("P/B ratio appears anomalously high (>100)");
  }
  if (dataQualityFlags.roeNegative) {
    dataQualityWarnings.push("ROE is negative (flagged as anomalous)");
  }
  if (dataQualityFlags.currentRatioAnomalous) {
    dataQualityWarnings.push("Current ratio appears anomalous");
  }
  if (dataQualityFlags.debtToEquityAnomalous) {
    dataQualityWarnings.push("Debt-to-Equity ratio appears anomalously high (>150%)");
  }
  if (dataQualityFlags.marketCapZero) {
    dataQualityWarnings.push("Market cap data is zero or unavailable");
  }

  // Add TTM-related data quality warnings
  if (growth.dataQualityFlags.onlyQ1Available) {
    dataQualityWarnings.push("Only Q1 data available - using FY vs FY comparison instead of TTM");
  }
  if (growth.dataQualityFlags.ttmNotAvailable) {
    dataQualityWarnings.push("TTM not available - using FY vs FY comparison");
  }
  if (growth.dataQualityFlags.insufficientData) {
    dataQualityWarnings.push("Insufficient financial data for growth calculation");
  }

  // Generate recommendations for personas
  const recommendationsForPersonas = generateRecommendations(
    growth,
    profitability,
    capitalEfficiency,
    financialHealth,
    cashFlow,
    dataQualityWarnings
  );

  // Generate summary
  const summary = generateSummary(
    growth,
    profitability,
    capitalEfficiency,
    financialHealth,
    cashFlow
  );

  return {
    growth,
    profitability,
    capitalEfficiency,
    financialHealth,
    cashFlow,
    summary,
    dataQualityWarnings,
    recommendationsForPersonas,
  };
}

function analyzeGrowth(financialData: FinancialData): GrowthAnalysis {
  // Calculate growth using TTM vs FY logic
  const revenueResult = calculateGrowth({
    financialData,
    metric: 'revenue',
  });

  const earningsResult = calculateGrowth({
    financialData,
    metric: 'netIncome',
  });

  const fcfResult = calculateGrowth({
    financialData,
    metric: 'freeCashFlow',
  });

  // Use the growth rates from calculations
  const revenueGrowth = revenueResult.growthRate;
  const earningsGrowth = earningsResult.growthRate;
  const fcfGrowth = fcfResult.growthRate;

  // Get comparison type and period information from revenue result (all should be same)
  const comparisonType = revenueResult.comparisonType;
  const currentPeriod = revenueResult.currentPeriod;
  const priorPeriod = revenueResult.priorPeriod;
  const dataQualityFlags = revenueResult.dataQualityFlags;

  // Calculate confidence based on data availability and comparison type
  let confidence = 85;
  if (comparisonType === 'INSUFFICIENT_DATA') {
    confidence = 50; // Low confidence if insufficient data
  }
  if (dataQualityFlags.onlyQ1Available) {
    confidence -= 10; // Reduce confidence for Q1-only data
  }
  if (dataQualityFlags.ttmNotAvailable) {
    confidence -= 5; // Slight reduction if TTM not available
  }

  // Reduce confidence if growth is highly negative (indicates structural issues)
  if (earningsGrowth < -30) confidence -= 10;

  // Determine assessment based on growth rates
  let assessment: "STRONG" | "MODERATE" | "WEAK" | "UNCLEAR" = "UNCLEAR";

  if (comparisonType === 'INSUFFICIENT_DATA') {
    assessment = "UNCLEAR";
  } else {
    // Handle negative growth (contraction)
    if (revenueGrowth < -10 || earningsGrowth < -20) {
      assessment = "WEAK"; // Significant contraction
    } else if (revenueGrowth < 0 || earningsGrowth < 0) {
      assessment = "WEAK"; // Any negative growth
    } else if (revenueGrowth > 15 && earningsGrowth > 15) {
      assessment = "STRONG"; // Strong growth
    } else if (revenueGrowth > 5 && earningsGrowth > 5) {
      assessment = "MODERATE"; // Moderate growth
    } else if (revenueGrowth > 0 && earningsGrowth > 0) {
      assessment = "WEAK"; // Weak positive growth
    }
  }

  // Determine trend
  let trend: "ACCELERATING" | "STABLE" | "DECELERATING" | "UNKNOWN" = "UNKNOWN";
  if (earningsGrowth > revenueGrowth + 2) {
    trend = "ACCELERATING"; // Earnings growing faster than revenue
  } else if (Math.abs(earningsGrowth - revenueGrowth) <= 2) {
    trend = "STABLE"; // Growth rates aligned
  } else if (earningsGrowth < revenueGrowth - 2) {
    trend = "DECELERATING"; // Earnings growing slower than revenue (margin compression)
  }

  const narrative = buildGrowthNarrative(
    revenueGrowth,
    earningsGrowth,
    fcfGrowth,
    trend,
    currentPeriod,
    priorPeriod,
    comparisonType
  );

  return {
    assessment,
    revenueGrowth,
    earningsGrowth,
    fcfGrowth,
    trend,
    narrative,
    confidence,
    comparisonType,
    currentPeriod,
    priorPeriod,
    dataQualityFlags,
  };
}

function analyzeProfitability(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): ProfitabilityAnalysis {
  const netMargin = financialData.ratios?.netMargin || 0;
  const operatingMargin = financialData.ratios?.operatingMargin || 0;
  const grossMargin = financialData.ratios?.grossMargin || 0;

  // Determine assessment
  let assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR" = "FAIR";
  if (netMargin > 20) {
    assessment = "EXCELLENT";
  } else if (netMargin > 10) {
    assessment = "GOOD";
  } else if (netMargin > 5) {
    assessment = "FAIR";
  } else if (netMargin > 0) {
    assessment = "POOR";
  }

  // Determine trend (simplified - would need historical data for real trend)
  let trend: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN" = "UNKNOWN";

  const narrative = buildProfitabilityNarrative(netMargin, operatingMargin, grossMargin);

  // Calculate confidence based on data quality
  let confidence = 90;
  if (dataQualityFlags.peAnomalous) confidence -= 10;
  if (dataQualityFlags.pbAnomalous) confidence -= 5;

  return {
    assessment,
    netMargin,
    operatingMargin,
    grossMargin,
    trend,
    narrative,
    confidence,
  };
}

function analyzeCapitalEfficiency(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): CapitalEfficiencyAnalysis {
  const roe = financialData.ratios?.roe || 0;
  const roic = financialData.ratios?.roic || 0;
  const roa = 0; // ROA not in ratios, calculate from financials if needed

  // Check for data quality issues
  let assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR" = "FAIR";

  if (dataQualityFlags.roicZero || dataQualityFlags.roeNegative) {
    assessment = "UNCLEAR";
  } else if (roe > 20 && roic > 15) {
    assessment = "EXCELLENT";
  } else if (roe > 15 && roic > 10) {
    assessment = "GOOD";
  } else if (roe > 5 && roic > 5) {
    assessment = "FAIR";
  } else if (roe > 0) {
    assessment = "POOR";
  }

  const narrative = buildCapitalEfficiencyNarrative(roe, roic, roa, dataQualityFlags);

  // Calculate confidence based on data quality
  let confidence = 85;
  if (dataQualityFlags.roicZero) confidence = 50;
  if (dataQualityFlags.roeNegative) confidence -= 15;

  return {
    assessment,
    roe,
    roic,
    roa,
    narrative,
    confidence,
  };
}

function analyzeFinancialHealth(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): FinancialHealthAnalysis {
  const debtToEquity = financialData.ratios?.debtToEquity || 0;
  const currentRatio = financialData.ratios?.currentRatio || 0;
  const interestCoverage = 0; // Interest coverage not in ratios

  // Determine assessment
  let assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR" = "STABLE";

  // D/E is now in percentage format (0-100% range)
  if (debtToEquity < 50 && currentRatio > 1.5 && interestCoverage > 5) {
    assessment = "STRONG";
  } else if (debtToEquity < 100 && currentRatio > 1 && interestCoverage > 2) {
    assessment = "STABLE";
  } else if (debtToEquity > 100 || currentRatio < 0.8 || interestCoverage < 1) {
    assessment = "CONCERNING";
  } else if (debtToEquity > 150 || currentRatio < 0.5) {
    assessment = "WEAK";
  }
  // Check for data quality issues
  if (dataQualityFlags.interestCoverageZero || dataQualityFlags.currentRatioAnomalous) {
    assessment = "UNCLEAR";
  }

  const narrative = buildFinancialHealthNarrative(debtToEquity, currentRatio, interestCoverage, dataQualityFlags);

  // Calculate confidence based on data quality
  let confidence = 80;
  if (dataQualityFlags.debtToEquityAnomalous) confidence = 50;
  if (dataQualityFlags.currentRatioAnomalous) confidence -= 15;
  if (dataQualityFlags.interestCoverageZero) confidence -= 10;

  return {
    assessment,
    debtToEquity,
    currentRatio,
    interestCoverage,
    narrative,
    confidence,
  };
}

function analyzeCashFlow(financialData: FinancialData): CashFlowAnalysis {
  const fcfMargin = calculateFcfMargin(financialData.financials) || 0;
  const fcfGrowth = calculateFcfGrowth(financialData.financials) || 0;

  // Determine assessment
  let assessment: "STRONG" | "HEALTHY" | "WEAK" | "NEGATIVE" | "UNCLEAR" = "WEAK";

  if (fcfMargin > 15 && fcfGrowth > 5) {
    assessment = "STRONG";
  } else if (fcfMargin > 10 && fcfGrowth > 0) {
    assessment = "HEALTHY";
  } else if (fcfMargin > 5) {
    assessment = "WEAK";
  } else if (fcfMargin < 0) {
    assessment = "NEGATIVE";
  }

  const narrative = buildCashFlowNarrative(fcfMargin, fcfGrowth);

  // Calculate confidence based on data availability
  let confidence = 85;
  if (!financialData.financials || financialData.financials.length === 0) confidence = 50;

  return {
    assessment,
    fcfMargin,
    fcfGrowth,
    narrative,
    confidence,
  };
}

// Helper functions for calculating metrics
function calculateRevenueGrowth(financials?: any[]): number {
  if (!financials || financials.length < 2) return 0;
  const current = financials[0]?.revenue || 0;
  const previous = financials[1]?.revenue || 0;
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateEarningsGrowth(financials?: any[]): number {
  if (!financials || financials.length < 2) return 0;
  const current = financials[0]?.netIncome || 0;
  const previous = financials[1]?.netIncome || 0;
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateFcfGrowth(financials?: any[]): number {
  if (!financials || financials.length < 2) return 0;
  const current = financials[0]?.freeCashFlow || 0;
  const previous = financials[1]?.freeCashFlow || 0;
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateFcfMargin(financials?: any[]): number {
  if (!financials || financials.length === 0) return 0;
  const fcf = financials[0]?.freeCashFlow || 0;
  const revenue = financials[0]?.revenue || 0;
  if (revenue === 0) return 0;
  return (fcf / revenue) * 100;
}

// Narrative builders
function buildGrowthNarrative(
  revenueGrowth: number,
  earningsGrowth: number,
  fcfGrowth: number,
  trend: string,
  currentPeriod: string,
  priorPeriod: string,
  comparisonType: string
): string {
  if (comparisonType === 'INSUFFICIENT_DATA') {
    return "Insufficient financial data available to calculate growth rates.";
  }

  const periodLabel = comparisonType === 'TTM_VS_FY' ? 'TTM' : 'FY';
  let narrative = `Revenue growing at ${revenueGrowth.toFixed(1)}% (${currentPeriod} vs ${priorPeriod}), with earnings growth of ${earningsGrowth.toFixed(1)}%. FCF growth of ${fcfGrowth.toFixed(1)}% shows ${trend.toLowerCase()} trend. ${
    earningsGrowth > revenueGrowth
      ? "Earnings outpacing revenue suggests margin expansion."
      : "Revenue outpacing earnings suggests margin pressure."
  }`;

  if (earningsGrowth < -100) {
    narrative += " WARNING: Extreme earnings decline indicates significant structural changes or swing from profitability to losses.";
  }

  return narrative;
}

function buildProfitabilityNarrative(
  netMargin: number,
  operatingMargin: number,
  grossMargin: number
): string {
  return `Net margin of ${netMargin.toFixed(1)}%, operating margin of ${operatingMargin.toFixed(1)}%, and gross margin of ${grossMargin.toFixed(1)}%. ${
    netMargin > 15
      ? "Exceptional profitability with industry-leading margins."
      : netMargin > 5
        ? "Solid profitability metrics."
        : "Profitability concerns with thin margins."
  }`;
}

function buildCapitalEfficiencyNarrative(
  roe: number,
  roic: number,
  roa: number,
  dataQualityFlags: DataQualityFlags
): string {
  if (dataQualityFlags.roicZero || dataQualityFlags.roeNegative) {
    return "Capital efficiency metrics are unreliable due to data quality issues. Cannot reliably assess capital efficiency.";
  }

  return `ROE of ${roe.toFixed(1)}%, ROIC of ${roic.toFixed(1)}%, and ROA of ${roa.toFixed(1)}%. ${
    roe > 20
      ? "Excellent capital efficiency."
      : roe > 10
        ? "Good capital efficiency."
        : "Moderate capital efficiency."
  }`;
}

function buildFinancialHealthNarrative(
  debtToEquity: number,
  currentRatio: number,
  interestCoverage: number,
  dataQualityFlags: DataQualityFlags
): string {
  let narrative = `Debt-to-Equity of ${debtToEquity.toFixed(1)}%, current ratio of ${currentRatio.toFixed(2)}%`;

  if (dataQualityFlags.interestCoverageZero) {
    narrative += ". Interest coverage data unavailable.";
  } else {
    narrative += `, and interest coverage of ${interestCoverage.toFixed(1)}x.`;
  }

  // D/E is in percentage format (0-100% range)
  if (debtToEquity < 50) {
    narrative += " Financial health is strong with conservative leverage.";
  } else if (debtToEquity < 100) {
    narrative += " Financial health is stable with manageable leverage.";
  } else if (debtToEquity < 150) {
    narrative += " Elevated leverage but manageable for cash-generative businesses.";
  } else {
    narrative += " High leverage with potential concerns.";
  }

  return narrative;
}

function buildCashFlowNarrative(fcfMargin: number, fcfGrowth: number): string {
  return `Free cash flow margin of ${fcfMargin.toFixed(1)}% with growth of ${fcfGrowth.toFixed(1)}%. ${
    fcfMargin > 15
      ? "Strong cash generation supporting dividends and buybacks."
      : fcfMargin > 5
        ? "Healthy cash flow generation."
        : fcfMargin > 0
          ? "Weak cash flow generation."
          : "Negative free cash flow indicates cash burn."
  }`;
}

function generateRecommendations(
  growth: GrowthAnalysis,
  profitability: ProfitabilityAnalysis,
  capitalEfficiency: CapitalEfficiencyAnalysis,
  financialHealth: FinancialHealthAnalysis,
  cashFlow: CashFlowAnalysis,
  dataQualityWarnings: string[]
): string[] {
  const recommendations: string[] = [];

  // Growth recommendations
  if (growth.assessment === "STRONG") {
    recommendations.push("Growth investors should emphasize strong revenue and earnings growth.");
  } else if (growth.assessment === "WEAK") {
    recommendations.push("Growth investors should be cautious about modest growth rates.");
  }

  // Profitability recommendations
  if (profitability.assessment === "EXCELLENT") {
    recommendations.push("Focus on excellent profitability metrics - these are reliable and strong.");
  } else if (profitability.assessment === "POOR") {
    recommendations.push("Profitability concerns with thin margins - use caution in valuation.");
  }

  // Capital efficiency recommendations
  if (capitalEfficiency.assessment === "UNCLEAR") {
    recommendations.push("Use caution when evaluating capital efficiency - key metrics are unavailable or anomalous.");
  } else if (capitalEfficiency.assessment === "EXCELLENT") {
    recommendations.push("Capital efficiency metrics support competitive advantage thesis.");
  }

  // Financial health recommendations
  if (financialHealth.assessment === "STRONG") {
    recommendations.push("Strong financial position with low leverage and good liquidity.");
  } else if (financialHealth.assessment === "CONCERNING" || financialHealth.assessment === "WEAK") {
    recommendations.push("Financial health concerns - evaluate debt sustainability and liquidity carefully.");
  }

  // Cash flow recommendations
  if (cashFlow.assessment === "STRONG" || cashFlow.assessment === "HEALTHY") {
    recommendations.push("Strong cash flow generation supports valuation and dividend sustainability.");
  } else if (cashFlow.assessment === "NEGATIVE") {
    recommendations.push("Negative free cash flow indicates cash burn - evaluate sustainability.");
  }

  // Data quality recommendations
  if (dataQualityWarnings.length > 0) {
    recommendations.push(`Be aware of ${dataQualityWarnings.length} data quality issues that may affect analysis reliability.`);
  }

  return recommendations;
}

function generateSummary(
  growth: GrowthAnalysis,
  profitability: ProfitabilityAnalysis,
  capitalEfficiency: CapitalEfficiencyAnalysis,
  financialHealth: FinancialHealthAnalysis,
  cashFlow: CashFlowAnalysis
): string {
  const parts: string[] = [];

  // Profitability highlight
  if (profitability.assessment === "EXCELLENT" || profitability.assessment === "GOOD") {
    parts.push(`excellent profitability (${profitability.netMargin.toFixed(1)}% net margin)`);
  }

  // Growth highlight
  if (growth.assessment === "STRONG") {
    parts.push("strong growth");
  } else if (growth.assessment === "WEAK") {
    parts.push("modest growth");
  }

  // Cash flow highlight
  if (cashFlow.assessment === "STRONG" || cashFlow.assessment === "HEALTHY") {
    parts.push("strong cash flow");
  }

  // Financial health highlight
  if (financialHealth.assessment === "STRONG") {
    parts.push("strong financial position");
  } else if (financialHealth.assessment === "CONCERNING" || financialHealth.assessment === "WEAK") {
    parts.push("financial health concerns");
  }

  let summary = `Company demonstrates ${parts.join(", ")}. `;

  // Add capital efficiency note
  if (capitalEfficiency.assessment === "UNCLEAR") {
    summary += "Capital efficiency metrics are unreliable due to data quality issues. ";
  }

  summary += "Overall fundamentals suggest ";
  if (profitability.assessment === "EXCELLENT" && cashFlow.assessment !== "NEGATIVE") {
    summary += "a financially healthy business with strong operational performance.";
  } else if (profitability.assessment === "POOR" || cashFlow.assessment === "NEGATIVE") {
    summary += "operational challenges that warrant careful evaluation.";
  } else {
    summary += "a moderately healthy business with mixed signals.";
  }

  return summary;
}
