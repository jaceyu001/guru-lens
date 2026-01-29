import { FinancialData } from "../../shared/types";
import { calculateEPV, EPVValuation } from "./epvCalculator";
import { extractMarketGrowthRate, validateGrowthRate, getConfidenceAdjustment } from "./growthRateExtractor";

type DataQualityFlags = NonNullable<FinancialData['dataQualityFlags']>;

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValuationMethod {
  name: "EPV" | "Comparable" | "DDM" | "AssetBased";
  intrinsicValue: number;
  upside: number; // %
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-1
  narrative: string;
  assumptions: Record<string, string | number>;
  limitations: string[];
  scenarios?: {
    conservative: {
      intrinsicValue: number;
      growthRate: number;
    };
    baseCase: {
      intrinsicValue: number;
      growthRate: number;
    };
  };
}

export interface ValuationFindings {
  currentPrice: number;
  methods: ValuationMethod[];
  consensusValuation: {
    low: number;
    high: number;
    midpoint: number;
  };
  consensusUpside: number; // %
  marginOfSafety: number; // %
  methodAgreement: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT";
  overallAssessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-100
  summary: string;
  dataQualityWarnings: string[];
  recommendationsForPersonas: string[];
}

interface ValuationInput {
  ticker: string;
  currentPrice: number;
  financialData: FinancialData;
  dataQualityFlags: DataQualityFlags;
}

// ============================================================================
// Main Valuation Agent Function
// ============================================================================

export async function analyzeValuation(input: ValuationInput): Promise<ValuationFindings> {
  const { ticker, currentPrice, financialData, dataQualityFlags } = input;

  // Initialize methods array
  const methods: ValuationMethod[] = [];
  const dataQualityWarnings: string[] = [];

  // Add data quality warnings
  if (dataQualityFlags.debtToEquityAnomalous) {
    dataQualityWarnings.push("Debt-to-Equity ratio anomalous");
  }
  if (dataQualityFlags.roicZero) {
    dataQualityWarnings.push("ROIC is zero");
  }
  if (dataQualityFlags.interestCoverageZero) {
    dataQualityWarnings.push("Interest coverage is zero");
  }
  if (dataQualityFlags.peNegative) {
    dataQualityWarnings.push("P/E ratio is negative");
  }
  if (dataQualityFlags.marketCapZero) {
    dataQualityWarnings.push("Market cap is zero or unavailable");
  }
  if (dataQualityFlags.revenueDecline) {
    dataQualityWarnings.push("Revenue is declining YoY");
  }
  if (dataQualityFlags.earningsCollapse) {
    dataQualityWarnings.push("Earnings are collapsing significantly");
  }

  // ========================================================================
  // EPV Valuation Method (Earning Power Value)
  // ========================================================================
  try {
    // Extract market growth rate using LLM
    const growthRateInfo = await extractMarketGrowthRate(ticker, financialData.profile?.description || ticker);
    
    // Validate growth rate (ensure g < WACC of 9%)
    const validatedGrowthRate = validateGrowthRate(growthRateInfo.growthRate, 9);

    // Calculate EPV
    const epvValuation = calculateEPV(
      financialData,
      currentPrice,
      validatedGrowthRate,
      {
        growthRate: growthRateInfo.growthRate,
        confidence: growthRateInfo.confidence,
        sources: growthRateInfo.sources,
        reasoning: growthRateInfo.reasoning,
        caveats: growthRateInfo.caveats,
      }
    );

    // Use base case (market growth) as primary intrinsic value
    const primaryIntrinsicValue = epvValuation.scenarios.baseCase.intrinsicValuePerShare;
    const conservativeIntrinsicValue = epvValuation.scenarios.conservative.intrinsicValuePerShare;

    // Calculate upside based on base case
    // Guard against zero or negative currentPrice
    if (currentPrice <= 0) {
      throw new Error(`Invalid currentPrice: ${currentPrice}. Cannot perform valuation with zero or negative price.`);
    }
    const upside = primaryIntrinsicValue > 0
      ? ((primaryIntrinsicValue - currentPrice) / currentPrice) * 100
      : 0;

    // Determine assessment based on valuation range
    let assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
    if (primaryIntrinsicValue <= 0) {
      assessment = "UNABLE_TO_VALUE";
    } else if (currentPrice < conservativeIntrinsicValue * 0.9) {
      assessment = "UNDERVALUED";
    } else if (currentPrice > primaryIntrinsicValue * 1.1) {
      assessment = "OVERVALUED";
    } else {
      assessment = "FAIRLY_VALUED";
    }

    // Adjust confidence based on LLM confidence
    const confidenceAdjustment = getConfidenceAdjustment(growthRateInfo.confidence);
    const adjustedConfidence = Math.max(0.3, Math.min(0.9, epvValuation.confidence + confidenceAdjustment));

    const epvMethod: ValuationMethod = {
      name: "EPV",
      intrinsicValue: primaryIntrinsicValue,
      upside,
      assessment,
      confidence: adjustedConfidence,
      narrative: epvValuation.narrative,
      assumptions: {
        normalizedNopat: `$${epvValuation.assumptions.normalizedNopat.toFixed(1)}M`,
        wacc: `${epvValuation.assumptions.wacc.toFixed(1)}%`,
        marketGrowthRate: `${epvValuation.assumptions.marketGrowthRate.toFixed(1)}%`,
        taxRate: `${epvValuation.assumptions.taxRate}%`,
        dataAvailability: epvValuation.assumptions.dataAvailability,
        llmConfidence: growthRateInfo.confidence,
        llmSources: growthRateInfo.sources.join(", "),
      },
      limitations: epvValuation.limitations,
      scenarios: {
        conservative: {
          intrinsicValue: conservativeIntrinsicValue,
          growthRate: 0,
        },
        baseCase: {
          intrinsicValue: primaryIntrinsicValue,
          growthRate: validatedGrowthRate,
        },
      },
    };

    methods.push(epvMethod);
  } catch (error) {
    console.error(`Error in EPV valuation for ${ticker}:`, error);
    dataQualityWarnings.push("EPV valuation calculation failed - check data quality");
  }

  // ========================================================================
  // Placeholder Methods (for future implementation)
  // ========================================================================

  // Comparable Company Analysis (placeholder)
  const comparableMethod: ValuationMethod = {
    name: "Comparable",
    intrinsicValue: 0,
    upside: 0,
    assessment: "UNABLE_TO_VALUE",
    confidence: 0,
    narrative: "Comparable company analysis not yet implemented",
    assumptions: {},
    limitations: ["Placeholder implementation"],
  };
  methods.push(comparableMethod);

  // Dividend Discount Model (placeholder)
  const ddmMethod: ValuationMethod = {
    name: "DDM",
    intrinsicValue: 0,
    upside: 0,
    assessment: "UNABLE_TO_VALUE",
    confidence: 0,
    narrative: "Dividend discount model not yet implemented",
    assumptions: {},
    limitations: ["Placeholder implementation"],
  };
  methods.push(ddmMethod);

  // Asset-Based Valuation (placeholder)
  const assetMethod: ValuationMethod = {
    name: "AssetBased",
    intrinsicValue: 0,
    upside: 0,
    assessment: "UNABLE_TO_VALUE",
    confidence: 0,
    narrative: "Asset-based valuation not yet implemented",
    assumptions: {},
    limitations: ["Placeholder implementation"],
  };
  methods.push(assetMethod);

  // ========================================================================
  // Consensus Analysis
  // ========================================================================

  // Filter out UNABLE_TO_VALUE methods for consensus
  const validMethods = methods.filter(m => m.assessment !== "UNABLE_TO_VALUE" && m.intrinsicValue > 0);

  // Collect all valuation points including scenarios
  const allValuationPoints: number[] = [];
  for (const method of validMethods) {
    allValuationPoints.push(method.intrinsicValue);
    // Include scenario values if available
    if (method.scenarios?.conservative?.intrinsicValue) {
      allValuationPoints.push(method.scenarios.conservative.intrinsicValue);
    }
    if (method.scenarios?.baseCase?.intrinsicValue) {
      allValuationPoints.push(method.scenarios.baseCase.intrinsicValue);
    }
  }

  let consensusValuation = { low: 0, high: 0, midpoint: 0 };
  let consensusUpside = 0;
  let marginOfSafety = 0;
  let methodAgreement: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT" = "DIVERGENT";
  let overallAssessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" = "UNABLE_TO_VALUE";

  if (allValuationPoints.length > 0) {
    consensusValuation.low = Math.min(...allValuationPoints);
    consensusValuation.high = Math.max(...allValuationPoints);
    consensusValuation.midpoint = (consensusValuation.low + consensusValuation.high) / 2;

    // Calculate consensus upside
    consensusUpside = ((consensusValuation.midpoint - currentPrice) / currentPrice) * 100;

    // Calculate margin of safety
    marginOfSafety = ((consensusValuation.low - currentPrice) / consensusValuation.low) * 100;

    // Determine method agreement based on spread of all valuation points
    const range = consensusValuation.high - consensusValuation.low;
    const rangePercent = consensusValuation.midpoint > 0 ? (range / consensusValuation.midpoint) * 100 : 100;

    if (rangePercent < 10) {
      methodAgreement = "STRONG";
    } else if (rangePercent < 25) {
      methodAgreement = "MODERATE";
    } else if (rangePercent < 50) {
      methodAgreement = "WEAK";
    } else {
      methodAgreement = "DIVERGENT";
    }

    // Determine overall assessment
    if (currentPrice < consensusValuation.low * 0.9) {
      overallAssessment = "UNDERVALUED";
    } else if (currentPrice > consensusValuation.high * 1.1) {
      overallAssessment = "OVERVALUED";
    } else {
      overallAssessment = "FAIRLY_VALUED";
    }
  }

  // ========================================================================
  // Confidence and Recommendations
  // ========================================================================

  const avgConfidence = validMethods.length > 0
    ? validMethods.reduce((sum, m) => sum + m.confidence, 0) / validMethods.length
    : 0;

  const confidence = Math.round(avgConfidence * 100);

  const recommendationsForPersonas: string[] = [];
  if (overallAssessment === "UNDERVALUED") {
    recommendationsForPersonas.push("Strong buy signal - significant upside potential");
    recommendationsForPersonas.push("Consider for value-oriented portfolios");
  } else if (overallAssessment === "OVERVALUED") {
    recommendationsForPersonas.push("Avoid or reduce positions - limited upside");
    recommendationsForPersonas.push("Consider for short or contrarian strategies");
  } else {
    recommendationsForPersonas.push("Fair valuation - hold or accumulate on dips");
    recommendationsForPersonas.push("Monitor for changes in valuation drivers");
  }

  if (confidence < 40) {
    recommendationsForPersonas.push("Low confidence - requires additional due diligence");
  }

  // ========================================================================
  // Generate Summary
  // ========================================================================

  const summary = `${overallAssessment} at current price of $${currentPrice.toFixed(2)}. ` +
    `Valuation range: $${consensusValuation.low.toFixed(2)} - $${consensusValuation.high.toFixed(2)}. ` +
    `Consensus upside: ${consensusUpside.toFixed(1)}%. ` +
    `Confidence: ${confidence}%.`;

  return {
    currentPrice,
    methods,
    consensusValuation,
    consensusUpside,
    marginOfSafety,
    methodAgreement,
    overallAssessment,
    confidence,
    summary,
    dataQualityWarnings,
    recommendationsForPersonas,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine assessment based on intrinsic value vs current price
 */
function determineAssessment(
  intrinsicValue: number,
  currentPrice: number,
  method: string
): "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" {
  if (intrinsicValue <= 0) {
    return "UNABLE_TO_VALUE";
  }

  const margin = 0.1; // 10% margin of safety
  if (currentPrice < intrinsicValue * (1 - margin)) {
    return "UNDERVALUED";
  } else if (currentPrice > intrinsicValue * (1 + margin)) {
    return "OVERVALUED";
  } else {
    return "FAIRLY_VALUED";
  }
}
