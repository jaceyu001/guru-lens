import { FinancialData } from "../../shared/types";
import { calculateGrowth } from "./growthCalculator";

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
  comparisonType: "TTM_VS_FY" | "TTM_VS_TTM" | "FY_VS_FY" | "INSUFFICIENT_DATA";
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
  roe: number | null; // % or null if unavailable
  roic: number | null; // % or null if unavailable
  roa: number | null; // % or null if unavailable
  narrative: string;
  confidence: number; // 0-100
}

export interface FinancialHealthAnalysis {
  assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR";
  debtToEquity: number | null; // % or null if unavailable
  currentRatio: number | null; // or null if unavailable
  interestCoverage: number | null; // or null if unavailable
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
  const growth = analyzeGrowth(financialData, dataQualityFlags);
  const profitability = analyzeProfitability(financialData);
  const capitalEfficiency = analyzeCapitalEfficiency(financialData, dataQualityFlags);
  const financialHealth = analyzeFinancialHealth(financialData, dataQualityFlags);
  const cashFlow = analyzeCashFlow(financialData);

  // Generate summary
  const summary = generateFundamentalsSummary(growth, profitability, capitalEfficiency, financialHealth, cashFlow);

  // Collect data quality warnings
  const dataQualityWarnings: string[] = [];

  // Recommendations for personas
  const recommendationsForPersonas: string[] = [];
  if (growth.assessment === "STRONG") {
    recommendationsForPersonas.push("Growth investors should find this company attractive");
  }
  if (profitability.assessment === "EXCELLENT") {
    recommendationsForPersonas.push("Value investors may appreciate the strong profitability");
  }

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

function analyzeGrowth(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): GrowthAnalysis {
  const revenueResult = calculateGrowth({ financialData, metric: "revenue" });
  const earningsResult = calculateGrowth({ financialData, metric: "netIncome" });
  const fcfResult = calculateGrowth({ financialData, metric: "freeCashFlow" });

  const revenueGrowth = revenueResult.growthRate;
  const earningsGrowth = earningsResult.growthRate;
  const fcfGrowth = fcfResult.growthRate;

  // Determine trend
  let trend: "ACCELERATING" | "STABLE" | "DECELERATING" | "UNKNOWN" = "UNKNOWN";
  if (revenueGrowth > 10 && earningsGrowth > 10) {
    trend = "ACCELERATING";
  } else if (revenueGrowth > 0 && earningsGrowth > 0) {
    trend = "STABLE";
  } else if (revenueGrowth < 0 || earningsGrowth < 0) {
    trend = "DECELERATING";
  }

  // Determine assessment
  let assessment: "STRONG" | "MODERATE" | "WEAK" | "UNCLEAR" = "MODERATE";
  if (revenueGrowth > 15) {
    assessment = "STRONG";
  } else if (revenueGrowth < 0) {
    assessment = "WEAK";
  } else if (revenueGrowth === 0 && earningsGrowth === 0) {
    assessment = "UNCLEAR";
  }

  const narrative = buildGrowthNarrative(revenueGrowth, earningsGrowth, fcfGrowth, trend);

  // Calculate confidence
  let confidence = 75;

  return {
    assessment,
    revenueGrowth,
    earningsGrowth,
    fcfGrowth,
    trend,
    narrative,
    confidence,
    comparisonType: revenueResult.comparisonType,
    currentPeriod: revenueResult.currentPeriod,
    priorPeriod: revenueResult.priorPeriod,
    dataQualityFlags: {
      insufficientData: revenueResult.comparisonType === "INSUFFICIENT_DATA",
    },
  };
}

function analyzeProfitability(financialData: FinancialData): ProfitabilityAnalysis {
  const netMargin = financialData.ratios?.netMargin || 0;
  const operatingMargin = financialData.ratios?.operatingMargin || 0;
  const grossMargin = financialData.ratios?.grossMargin || 0;

  // Determine trend (simplified - would need historical data for real trend)
  let trend: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN" = "STABLE";

  // Determine assessment
  let assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR" = "FAIR";
  if (netMargin > 20 && operatingMargin > 15) {
    assessment = "EXCELLENT";
  } else if (netMargin > 10 && operatingMargin > 8) {
    assessment = "GOOD";
  } else if (netMargin > 5 && operatingMargin > 3) {
    assessment = "FAIR";
  } else if (netMargin < 0) {
    assessment = "POOR";
  }

  const narrative = buildProfitabilityNarrative(netMargin, operatingMargin, grossMargin);

  return {
    assessment,
    netMargin,
    operatingMargin,
    grossMargin,
    trend,
    narrative,
    confidence: 90,
  };
}

function analyzeCapitalEfficiency(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): CapitalEfficiencyAnalysis {
  // Get metrics, using null for unavailable data
  const roe = (financialData.ratios?.roe && financialData.ratios.roe > 0) ? financialData.ratios.roe : null;
  const roic = (financialData.ratios?.roic && financialData.ratios.roic > 0) ? financialData.ratios.roic : null;
  const roa = (financialData.ratios?.roa && financialData.ratios.roa > 0) ? financialData.ratios.roa : null;

  // Count available metrics
  const availableMetrics = [roe, roic, roa].filter(m => m !== null).length;

  // Assess based only on available metrics
  let assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR" = "FAIR";

  if (availableMetrics === 0) {
    assessment = "UNCLEAR";
  } else if (availableMetrics === 1) {
    // Single metric assessment
    const metric = roe ?? roic ?? roa;
    if (metric && metric > 20) {
      assessment = "EXCELLENT";
    } else if (metric && metric > 15) {
      assessment = "GOOD";
    } else if (metric && metric > 10) {
      assessment = "FAIR";
    } else if (metric && metric > 5) {
      assessment = "POOR";
    } else {
      assessment = "UNCLEAR";
    }
  } else if (availableMetrics === 2) {
    // Two metric assessment
    const metrics = [roe, roic, roa].filter(m => m !== null) as number[];
    const avgMetric = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    if (avgMetric > 20) {
      assessment = "EXCELLENT";
    } else if (avgMetric > 15) {
      assessment = "GOOD";
    } else if (avgMetric > 10) {
      assessment = "FAIR";
    } else if (avgMetric > 5) {
      assessment = "POOR";
    }
  } else {
    // All three metrics available
    const avgMetric = ((roe ?? 0) + (roic ?? 0) + (roa ?? 0)) / 3;
    if (avgMetric > 20) {
      assessment = "EXCELLENT";
    } else if (avgMetric > 15) {
      assessment = "GOOD";
    } else if (avgMetric > 10) {
      assessment = "FAIR";
    } else if (avgMetric > 5) {
      assessment = "POOR";
    }
  }

  const narrative = buildCapitalEfficiencyNarrative(roe, roic, roa, availableMetrics);

  // Calculate confidence based on available metrics
  let confidence = 50 + (availableMetrics * 15);

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
  // Get metrics, using null for unavailable/zero data
  const debtToEquity = (financialData.ratios?.debtToEquity && financialData.ratios.debtToEquity > 0) ? financialData.ratios.debtToEquity : null;
  const currentRatio = (financialData.ratios?.currentRatio && financialData.ratios.currentRatio > 0) ? financialData.ratios.currentRatio : null;
  const interestCoverage = null; // Not available in current ratios

  // Count available metrics
  const availableMetrics = [debtToEquity, currentRatio, interestCoverage].filter(m => m !== null).length;

  // Assess based only on available metrics
  let assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR" = "STABLE";

  if (availableMetrics === 0) {
    assessment = "UNCLEAR";
  } else if (availableMetrics === 1) {
    if (debtToEquity !== null) {
      if (debtToEquity < 50) assessment = "STRONG";
      else if (debtToEquity < 100) assessment = "STABLE";
      else if (debtToEquity < 150) assessment = "CONCERNING";
      else assessment = "WEAK";
    } else if (currentRatio !== null) {
      if (currentRatio > 1.5) assessment = "STRONG";
      else if (currentRatio > 1) assessment = "STABLE";
      else if (currentRatio > 0.8) assessment = "CONCERNING";
      else assessment = "WEAK";
    }
  } else if (availableMetrics === 2) {
    if (debtToEquity !== null && currentRatio !== null) {
      if (debtToEquity < 50 && currentRatio > 1.5) assessment = "STRONG";
      else if (debtToEquity < 100 && currentRatio > 1) assessment = "STABLE";
      else if (debtToEquity > 100 || currentRatio < 0.8) assessment = "CONCERNING";
      else if (debtToEquity > 150 || currentRatio < 0.5) assessment = "WEAK";
    }
  }

  const narrative = buildFinancialHealthNarrative(debtToEquity, currentRatio, interestCoverage, availableMetrics);

  // Calculate confidence based on available metrics
  let confidence = 50 + (availableMetrics * 20);

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

function generateFundamentalsSummary(
  growth: GrowthAnalysis,
  profitability: ProfitabilityAnalysis,
  capitalEfficiency: CapitalEfficiencyAnalysis,
  financialHealth: FinancialHealthAnalysis,
  cashFlow: CashFlowAnalysis
): string {
  return `Growth is ${growth.assessment.toLowerCase()}, profitability is ${profitability.assessment.toLowerCase()}, capital efficiency is ${capitalEfficiency.assessment.toLowerCase()}, financial health is ${financialHealth.assessment.toLowerCase()}, and cash flow is ${cashFlow.assessment.toLowerCase()}.`;
}

function buildGrowthNarrative(
  revenueGrowth: number,
  earningsGrowth: number,
  fcfGrowth: number,
  trend: string
): string {
  return `Revenue growth of ${revenueGrowth.toFixed(1)}%, earnings growth of ${earningsGrowth.toFixed(1)}%, and FCF growth of ${fcfGrowth.toFixed(1)}%. Trend is ${trend.toLowerCase()}.`;
}

function buildProfitabilityNarrative(netMargin: number, operatingMargin: number, grossMargin: number): string {
  return `Net margin of ${netMargin.toFixed(1)}%, operating margin of ${operatingMargin.toFixed(1)}%, and gross margin of ${grossMargin.toFixed(1)}%.`;
}

function buildCapitalEfficiencyNarrative(
  roe: number | null,
  roic: number | null,
  roa: number | null,
  availableMetrics: number
): string {
  const metrics: string[] = [];
  if (roe !== null) metrics.push(`ROE of ${roe.toFixed(1)}%`);
  if (roic !== null) metrics.push(`ROIC of ${roic.toFixed(1)}%`);
  if (roa !== null) metrics.push(`ROA of ${roa.toFixed(1)}%`);

  if (metrics.length === 0) {
    return "Capital efficiency data unavailable.";
  }

  const metricsStr = metrics.join(", ");
  let assessment = "Moderate capital efficiency.";
  
  if (availableMetrics === 1) {
    const metric = roe ?? roic ?? roa;
    if (metric && metric > 20) assessment = "Excellent capital efficiency.";
    else if (metric && metric > 15) assessment = "Good capital efficiency.";
    else if (metric && metric > 10) assessment = "Fair capital efficiency.";
    else if (metric && metric > 5) assessment = "Poor capital efficiency.";
  }

  return `${metricsStr}. ${assessment}`;
}

function buildFinancialHealthNarrative(
  debtToEquity: number | null,
  currentRatio: number | null,
  interestCoverage: number | null,
  availableMetrics: number
): string {
  const metrics: string[] = [];
  if (debtToEquity !== null) metrics.push(`Debt-to-Equity of ${debtToEquity.toFixed(1)}%`);
  if (currentRatio !== null) metrics.push(`current ratio of ${currentRatio.toFixed(2)}x`);
  if (interestCoverage !== null) metrics.push(`interest coverage of ${interestCoverage.toFixed(1)}x`);

  if (metrics.length === 0) {
    return "Financial health data unavailable.";
  }

  let narrative = metrics.join(", ") + ".";

  // Add assessment narrative based on available metrics
  if (debtToEquity !== null) {
    if (debtToEquity < 50) {
      narrative += " Financial health is strong with conservative leverage.";
    } else if (debtToEquity < 100) {
      narrative += " Financial health is stable with manageable leverage.";
    } else if (debtToEquity < 150) {
      narrative += " Elevated leverage but manageable for cash-generative businesses.";
    } else {
      narrative += " High leverage with potential concerns.";
    }
  } else if (currentRatio !== null) {
    if (currentRatio > 1.5) {
      narrative += " Strong liquidity position.";
    } else if (currentRatio > 1) {
      narrative += " Adequate liquidity.";
    } else {
      narrative += " Liquidity concerns.";
    }
  }

  return narrative;
}

function buildCashFlowNarrative(fcfMargin: number, fcfGrowth: number): string {
  return `Free cash flow margin of ${fcfMargin.toFixed(1)}% with growth of ${fcfGrowth.toFixed(1)}%. ${
    fcfMargin > 15
      ? "Strong cash generation."
      : fcfMargin > 10
        ? "Healthy cash generation."
        : fcfMargin > 5
          ? "Weak cash generation."
          : "Negative cash flow concerns."
  }`;
}

function calculateFcfMargin(financials: FinancialData["financials"]): number {
  if (!financials || financials.length === 0) return 0;
  const latest = financials[0];
  if (!latest || latest.revenue === 0 || !latest.freeCashFlow) return 0;
  return (latest.freeCashFlow / latest.revenue) * 100;
}

function calculateFcfGrowth(financials: FinancialData["financials"]): number {
  if (!financials || financials.length < 2) return 0;
  const latest = financials[0];
  const prior = financials[1];
  if (!latest || !prior || !latest.freeCashFlow || !prior.freeCashFlow || prior.freeCashFlow === 0) return 0;
  return ((latest.freeCashFlow - prior.freeCashFlow) / Math.abs(prior.freeCashFlow)) * 100;
}
