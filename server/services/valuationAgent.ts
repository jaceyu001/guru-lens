import type { FinancialData } from "@shared/types";
import { calculateGrowth } from "./growthCalculator";

type DataQualityFlags = NonNullable<FinancialData['dataQualityFlags']>;

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValuationMethod {
  name: "DCF" | "Comparable" | "DDM" | "AssetBased";
  intrinsicValue: number;
  upside: number; // %
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-1
  narrative: string;
  assumptions: Record<string, string | number>;
  limitations: string[];
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

  // Run all 4 valuation methods in parallel
  const [dcfMethod, comparableMethod, ddmMethod, assetBasedMethod] = await Promise.all([
    calculateDCF(financialData, dataQualityFlags),
    calculateComparable(financialData, currentPrice, dataQualityFlags),
    calculateDDM(financialData, dataQualityFlags),
    calculateAssetBased(financialData, dataQualityFlags),
  ]);

  const methods = [dcfMethod, comparableMethod, ddmMethod, assetBasedMethod];

  // Calculate consensus valuation (only from applicable methods)
  const applicableMethods = methods.filter(m => m.assessment !== "UNABLE_TO_VALUE");
  const consensusValuation = calculateConsensusValuation(applicableMethods);
  const consensusUpside = calculateUpside(currentPrice, consensusValuation.midpoint);
  const marginOfSafety = calculateMarginOfSafety(currentPrice, consensusValuation.midpoint);
  const methodAgreement = calculateMethodAgreement(applicableMethods);

  // Determine overall assessment
  const overallAssessment = determineOverallAssessment(
    currentPrice,
    consensusValuation.midpoint,
    applicableMethods.length
  );

  // Build summary
  const summary = buildValuationSummary(
    ticker,
    currentPrice,
    consensusValuation,
    consensusUpside,
    marginOfSafety,
    methodAgreement,
    applicableMethods
  );

  // Collect data quality warnings
  const dataQualityWarnings = collectDataQualityWarnings(
    financialData,
    dataQualityFlags,
    methods
  );

  // Generate recommendations for personas
  const recommendationsForPersonas = generatePersonaRecommendations(
    methods,
    marginOfSafety,
    methodAgreement,
    dataQualityWarnings
  );

  return {
    currentPrice,
    methods,
    consensusValuation,
    consensusUpside,
    marginOfSafety,
    methodAgreement,
    overallAssessment,
    confidence: Math.round(
      (applicableMethods.reduce((sum, m) => sum + m.confidence, 0) / applicableMethods.length) * 100
    ),
    summary,
    dataQualityWarnings,
    recommendationsForPersonas,
  };
}

// ============================================================================
// Valuation Methods
// ============================================================================

async function calculateDCF(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  try {
    // Use Operating Cash Flow from quarterly data for DCF calculation
    const quarterlyData = (financialData as any).quarterlyFinancials || [];
    
    // Check if we have any quarterly data
    if (quarterlyData.length === 0) {
      return {
        name: "DCF",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "DCF analysis not possible - no quarterly financial data available.",
        assumptions: {},
        limitations: ["No quarterly data", "Cannot calculate TTM metrics"],
      };
    }
    
    // Get current TTM OCF (sum of last 4 quarters)
    // Allow negative values - do NOT filter them out
    let currentOcf = 0;
    for (let i = 0; i < Math.min(4, quarterlyData.length); i++) {
      currentOcf += quarterlyData[i].operatingCashFlow || 0;
    }
    
    // Get prior-year TTM OCF (sum of quarters 4-7, if available)
    // Allow negative values - do NOT filter them out
    let priorOcf = 0;
    let priorQuarterCount = 0;
    for (let i = 4; i < Math.min(8, quarterlyData.length); i++) {
      priorOcf += quarterlyData[i].operatingCashFlow || 0;
      priorQuarterCount++;
    }
    
    // Annualize prior OCF if we have fewer than 4 quarters
    if (priorQuarterCount > 0 && priorQuarterCount < 4) {
      priorOcf = (priorOcf / priorQuarterCount) * 4;
    }
    
    // Calculate OCF growth rate
    // Allow negative growth rates
    let ocfGrowthRate = 0;
    if (priorOcf !== 0) {
      ocfGrowthRate = ((currentOcf - priorOcf) / Math.abs(priorOcf)) * 100;
    }

    // Use hardcoded WACC of 9% (typical for mature US companies)
    const wacc = 9.0;

    // Terminal growth rate (conservative)
    const terminalGrowthRate = 2.5;

    // Project OCF for 5 years using TTM vs Prior-Year TTM growth rate
    // Allow negative OCF to continue through calculation
    let projectedOcf = currentOcf;
    let pvOcf = 0;
    for (let year = 1; year <= 5; year++) {
      projectedOcf = projectedOcf * (1 + ocfGrowthRate / 100);
      pvOcf += projectedOcf / Math.pow(1 + wacc / 100, year);
    }

    // Calculate terminal value
    const terminalOcf = projectedOcf * (1 + terminalGrowthRate / 100);
    const terminalValue = terminalOcf / ((wacc - terminalGrowthRate) / 100);

    // Calculate intrinsic value (may be negative)
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc / 100, 5);
    const intrinsicValue = pvOcf + pvTerminalValue;

    // Determine confidence
    const confidence = ocfGrowthRate > -50 && ocfGrowthRate < 50 ? 0.65 : 0.4;

    // Calculate upside (may be negative)
    const upside = intrinsicValue !== 0 ? ((intrinsicValue - 0) / intrinsicValue) * 100 : 0;

    // Determine assessment
    const assessment = determineAssessment(intrinsicValue, 0, "DCF"); // Placeholder

    const narrative = `DCF analysis based on Current TTM OCF of $${(currentOcf / 1e9).toFixed(1)}B (vs Prior-Year TTM $${(priorOcf / 1e9).toFixed(1)}B) ` +
      `with ${ocfGrowthRate.toFixed(1)}% growth assumption (TTM_VS_TTM). ` +
      `Terminal value represents ${((pvTerminalValue / intrinsicValue) * 100).toFixed(0)}% of total value. ` +
      `WACC of ${wacc.toFixed(1)}% used for discounting.`;

    return {
      name: "DCF",
      intrinsicValue,
      upside,
      assessment,
      confidence,
      narrative,
      assumptions: {
        ocfGrowthRate: `${ocfGrowthRate.toFixed(1)}%`,
        comparisonType: "TTM_VS_TTM",
        currentPeriod: "Current TTM",
        priorPeriod: "Prior-Year TTM",
        wacc: `${wacc.toFixed(1)}%`,
        terminalGrowthRate: `${terminalGrowthRate}%`,
        projectionPeriod: "5 years",
      },
      limitations: [
        "Sensitive to growth rate assumptions",
        "Sensitive to WACC assumptions",
        "Terminal value represents majority of valuation",
        "Uses Operating Cash Flow (allows negative values)",
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[DCF Error]", errorMsg, error);
    return {
      name: "DCF",
      intrinsicValue: 0,
      upside: 0,
      assessment: "UNABLE_TO_VALUE",
      confidence: 0,
      narrative: `DCF analysis failed: ${errorMsg}`,
      assumptions: {},
      limitations: ["Calculation error"],
    };
  }
}

async function calculateComparable(
  financialData: FinancialData,
  currentPrice: number,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  return {
    name: "Comparable",
    intrinsicValue: currentPrice,
    upside: 0,
    assessment: "FAIRLY_VALUED",
    confidence: 0.5,
    narrative: "Comparable company analysis placeholder",
    assumptions: {},
    limitations: ["Placeholder implementation"],
  };
}

async function calculateDDM(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  return {
    name: "DDM",
    intrinsicValue: 0,
    upside: 0,
    assessment: "UNABLE_TO_VALUE",
    confidence: 0,
    narrative: "Dividend Discount Model not applicable",
    assumptions: {},
    limitations: ["No dividend data"],
  };
}

async function calculateAssetBased(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  return {
    name: "AssetBased",
    intrinsicValue: 0,
    upside: 0,
    assessment: "UNABLE_TO_VALUE",
    confidence: 0,
    narrative: "Asset-based valuation not applicable",
    assumptions: {},
    limitations: ["No balance sheet data"],
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateConsensusValuation(methods: ValuationMethod[]) {
  const valuations = methods
    .filter(m => m.intrinsicValue > 0)
    .map(m => m.intrinsicValue);
  
  if (valuations.length === 0) {
    return { low: 0, high: 0, midpoint: 0 };
  }
  
  const sorted = valuations.sort((a, b) => a - b);
  return {
    low: sorted[0],
    high: sorted[sorted.length - 1],
    midpoint: (sorted[0] + sorted[sorted.length - 1]) / 2,
  };
}

function calculateUpside(currentPrice: number, consensusValuation: number): number {
  if (currentPrice === 0) return 0;
  return ((consensusValuation - currentPrice) / currentPrice) * 100;
}

function calculateMarginOfSafety(currentPrice: number, consensusValuation: number): number {
  if (consensusValuation === 0) return 0;
  return ((consensusValuation - currentPrice) / consensusValuation) * 100;
}

function calculateMethodAgreement(methods: ValuationMethod[]): "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT" {
  if (methods.length === 0) return "WEAK";
  
  const assessments = methods.map(m => m.assessment);
  const unique = new Set(assessments);
  
  if (unique.size === 1) return "STRONG";
  if (unique.size === 2) return "MODERATE";
  return "DIVERGENT";
}

function determineOverallAssessment(
  currentPrice: number,
  consensusValuation: number,
  methodCount: number
): "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" {
  if (methodCount === 0) return "UNABLE_TO_VALUE";
  
  const upside = calculateUpside(currentPrice, consensusValuation);
  
  if (upside > 20) return "UNDERVALUED";
  if (upside < -20) return "OVERVALUED";
  return "FAIRLY_VALUED";
}

function determineAssessment(
  intrinsicValue: number,
  currentPrice: number,
  method: string
): "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" {
  if (intrinsicValue === 0) return "UNABLE_TO_VALUE";
  
  const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;
  
  if (upside > 20) return "UNDERVALUED";
  if (upside < -20) return "OVERVALUED";
  return "FAIRLY_VALUED";
}

function buildValuationSummary(
  ticker: string,
  currentPrice: number,
  consensusValuation: { low: number; high: number; midpoint: number },
  consensusUpside: number,
  marginOfSafety: number,
  methodAgreement: string,
  methods: ValuationMethod[]
): string {
  return `${ticker} trading at $${currentPrice.toFixed(2)}. Consensus valuation: $${consensusValuation.midpoint.toFixed(2)} (${consensusUpside.toFixed(1)}% upside). Method agreement: ${methodAgreement}.`;
}

function collectDataQualityWarnings(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags,
  methods: ValuationMethod[]
): string[] {
  const warnings: string[] = [];
  
  if (!financialData.quarterlyFinancials || financialData.quarterlyFinancials.length < 4) {
    warnings.push("Limited quarterly data available - TTM calculations may be incomplete");
  }
  
  return warnings;
}

function generatePersonaRecommendations(
  methods: ValuationMethod[],
  marginOfSafety: number,
  methodAgreement: string,
  dataQualityWarnings: string[]
): string[] {
  const recommendations: string[] = [];
  
  if (marginOfSafety > 30) {
    recommendations.push("Strong margin of safety for value investors");
  }
  
  if (methodAgreement === "STRONG") {
    recommendations.push("High confidence in valuation across multiple methods");
  }
  
  return recommendations;
}
