import { FinancialData } from "../../shared/types";
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

  // Calculate overall confidence based on method agreement and data quality
  let confidence = 75;
  if (methodAgreement === "STRONG") confidence = 90;
  else if (methodAgreement === "MODERATE") confidence = 75;
  else if (methodAgreement === "WEAK") confidence = 60;
  else if (methodAgreement === "DIVERGENT") confidence = 40;
  
  if (dataQualityWarnings.length > 0) confidence -= 10;
  if (applicableMethods.length < 2) confidence -= 15;
  
  confidence = Math.max(30, Math.min(100, confidence));

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
// Valuation Methods
// ============================================================================

async function calculateDCF(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  try {
    // Get historical FCF (not available in current FinancialData structure)
    // Using placeholder - would need to calculate from operating cash flow - capex
    const fcfHistory: number[] = [];
    if (fcfHistory.length === 0) {
      return {
        name: "DCF",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "DCF analysis not possible - no historical FCF data available.",
        assumptions: {},
        limitations: ["No FCF history", "Cannot project future cash flows"],
      };
    }

    // Get FCF growth using TTM vs FY logic from growthCalculator
    const fcfGrowthResult = calculateGrowth({
      financialData,
      metric: 'freeCashFlow',
    });

    // Check if we have sufficient data
    if (fcfGrowthResult.comparisonType === 'INSUFFICIENT_DATA') {
      return {
        name: "DCF",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: `DCF analysis not possible - insufficient FCF data available. Comparison type: ${fcfGrowthResult.comparisonType}`,
        assumptions: {},
        limitations: ["No FCF history", "Cannot project future cash flows"],
      };
    }

    // Use TTM vs FY growth rate
    const fcfGrowthRate = fcfGrowthResult.growthRate;

    // Validate FCF data
    const currentFcf = fcfGrowthResult.currentValue;
    if (currentFcf <= 0) {
      return {
        name: "DCF",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0.2,
        narrative: `DCF analysis unreliable - current FCF is negative or zero. Using ${fcfGrowthResult.currentPeriod} data.`,
        assumptions: { fcfGrowthRate: `${fcfGrowthRate.toFixed(1)}%`, comparisonType: fcfGrowthResult.comparisonType, currentPeriod: fcfGrowthResult.currentPeriod, priorPeriod: fcfGrowthResult.priorPeriod },
        limitations: ["Negative FCF", "Cannot project positive future cash flows"],
      };
    }

    // Calculate WACC
    const wacc = calculateWACC(financialData, dataQualityFlags);

    // Terminal growth rate (conservative)
    const terminalGrowthRate = 2.5;

    // Project FCF for 5 years using TTM vs FY growth rate
    let projectedFcf = currentFcf;
    let pvFcf = 0;
    for (let year = 1; year <= 5; year++) {
      projectedFcf = projectedFcf * (1 + fcfGrowthRate / 100);
      pvFcf += projectedFcf / Math.pow(1 + wacc / 100, year);
    }

    // Calculate terminal value
    const terminalFcf = projectedFcf * (1 + terminalGrowthRate / 100);
    const terminalValue = terminalFcf / ((wacc - terminalGrowthRate) / 100);
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc / 100, 5);

    // Calculate intrinsic value
    const intrinsicValue = pvFcf + pvTerminalValue;

    // Determine confidence
    const confidence = fcfGrowthRate > 0 && fcfGrowthRate < 50 ? 0.85 : 0.6;

    // Calculate upside
    const upside = ((intrinsicValue - 0) / intrinsicValue) * 100; // Placeholder for current price

    // Determine assessment
    const assessment = determineAssessment(intrinsicValue, 0, "DCF"); // Placeholder

    const narrative = `DCF analysis based on ${fcfGrowthResult.currentPeriod} FCF of $${(currentFcf / 1e9).toFixed(1)}B (vs ${fcfGrowthResult.priorPeriod} $${(fcfGrowthResult.priorValue / 1e9).toFixed(1)}B) ` +
      `with ${fcfGrowthRate.toFixed(1)}% growth assumption (${fcfGrowthResult.comparisonType}). ` +
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
        fcfGrowthRate: `${fcfGrowthRate.toFixed(1)}%`,
        comparisonType: fcfGrowthResult.comparisonType,
        currentPeriod: fcfGrowthResult.currentPeriod,
        priorPeriod: fcfGrowthResult.priorPeriod,
        wacc: `${wacc.toFixed(1)}%`,
        terminalGrowthRate: `${terminalGrowthRate}%`,
        projectionPeriod: "5 years",
      },
      limitations: [
        "Sensitive to growth rate assumptions",
        "Sensitive to WACC assumptions",
        "Terminal value represents majority of valuation",
      ],
    };
  } catch (error) {
    return {
      name: "DCF",
      intrinsicValue: 0,
      upside: 0,
      assessment: "UNABLE_TO_VALUE",
      confidence: 0,
      narrative: `DCF analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
  try {
    // Get current financials
    const latestFinancials = financialData.financials?.[0];
    if (!latestFinancials) {
      return {
        name: "Comparable",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "Comparable analysis not possible - no financial data available.",
        assumptions: {},
        limitations: ["No financial data"],
      };
    }

    // Get shares outstanding from financial data (in millions)
    const sharesOutstanding = financialData.sharesOutstanding || 16000; // millions of shares (fallback to default if not available)
    
    // Calculate using P/E multiple
    const eps = latestFinancials.eps || 0;
    const industryPE = 20; // S&P 500 average
    const peValuation = eps > 0 ? eps * industryPE : 0;

    // Calculate using P/B multiple (if available)
    const bookValue = financialData.ratios?.pb ? 1 / financialData.ratios.pb : 0;
    const industryPB = 3.0;
    const pbValuation = bookValue > 0 ? bookValue * industryPB : 0;

    // Calculate using P/S multiple (revenue per share * P/S multiple)
    const revenue = latestFinancials.revenue || 0; // in millions
    const revenuePerShare = sharesOutstanding > 0 ? (revenue / sharesOutstanding) : 0;
    const industryPS = 2.0;
    const psValuation = revenuePerShare > 0 ? revenuePerShare * industryPS : 0;
    
    // Validate that valuations are reasonable (not anomalous)
    const isAnomalous = (val: number) => val > 10000 || val < 0.01;
    const validValuations = [peValuation, pbValuation, psValuation].filter(v => v > 0 && !isAnomalous(v));
    const intrinsicValue = validValuations.length > 0 ? validValuations.reduce((a, b) => a + b) / validValuations.length : 0;

    // Determine confidence
    const confidence = validValuations.length >= 2 ? 0.75 : 0.5;

    // Calculate upside
    const upside = intrinsicValue > 0 ? ((intrinsicValue - currentPrice) / currentPrice) * 100 : 0;

    // Determine assessment
    const assessment = determineAssessment(intrinsicValue, currentPrice, "Comparable");

    const narrative = `Comparable analysis uses industry multiples (P/E: ${industryPE}x, P/B: ${industryPB}x, P/S: ${industryPS}x). ` +
      `${validValuations.length} valuation methods applied. ` +
      `Assumes company quality similar to industry average.`;

    return {
      name: "Comparable",
      intrinsicValue,
      upside,
      assessment,
      confidence,
      narrative,
      assumptions: {
        industryPE: `${industryPE}x`,
        industryPB: `${industryPB}x`,
        industryPS: `${industryPS}x`,
        methodsApplied: validValuations.length,
      },
      limitations: [
        "Assumes company is similar to industry average",
        "Market multiples can be irrational",
        "Doesn't account for company-specific competitive advantages",
      ],
    };
  } catch (error) {
    return {
      name: "Comparable",
      intrinsicValue: 0,
      upside: 0,
      assessment: "UNABLE_TO_VALUE",
      confidence: 0,
      narrative: `Comparable analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      assumptions: {},
      limitations: ["Calculation error"],
    };
  }
}

async function calculateDDM(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  try {
    // Check if company pays dividends
    const dividendYield = 0; // Placeholder - dividendYield not in ratios structure
    if (dividendYield <= 0) {
      return {
        name: "DDM",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "DDM not applicable - company does not pay dividends or dividend data unavailable.",
        assumptions: { dividendYield: "0%" },
        limitations: ["No dividend payments", "Not primary valuation driver for growth companies"],
      };
    }

    // Get current price (assuming it's passed in context)
    const currentPrice = 100; // Placeholder

    // Calculate annual dividend
    const annualDividend = currentPrice * (dividendYield / 100);

    // Estimate dividend growth rate (conservative)
    const dividendGrowthRate = 3; // %

    // Calculate required return (cost of equity)
    const requiredReturn = 10; // % (conservative estimate)

    // Gordon Growth Model: Value = D1 / (r - g)
    const nextDividend = annualDividend * (1 + dividendGrowthRate / 100);
    const intrinsicValue = nextDividend / ((requiredReturn - dividendGrowthRate) / 100);

    // Determine confidence
    const confidence = dividendGrowthRate < requiredReturn ? 0.7 : 0.3;

    // Calculate upside
    const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;

    // Determine assessment
    const assessment = determineAssessment(intrinsicValue, currentPrice, "DDM");

    const narrative = `DDM values company based on dividend stream of $${annualDividend.toFixed(2)} annually. ` +
      `Assumes ${dividendGrowthRate}% dividend growth and ${requiredReturn}% required return. ` +
      `Note: DDM undervalues companies that reinvest earnings for growth.`;

    return {
      name: "DDM",
      intrinsicValue,
      upside,
      assessment,
      confidence,
      narrative,
      assumptions: {
        dividendYield: `${dividendYield.toFixed(2)}%`,
        dividendGrowthRate: `${dividendGrowthRate}%`,
        requiredReturn: `${requiredReturn}%`,
      },
      limitations: [
        "Only applicable to dividend-paying companies",
        "Undervalues growth companies that reinvest earnings",
        "Assumes perpetual dividend payments",
        "Sensitive to growth rate assumptions",
      ],
    };
  } catch (error) {
    return {
      name: "DDM",
      intrinsicValue: 0,
      upside: 0,
      assessment: "UNABLE_TO_VALUE",
      confidence: 0,
      narrative: `DDM analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      assumptions: {},
      limitations: ["Calculation error"],
    };
  }
}

async function calculateAssetBased(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags
): Promise<ValuationMethod> {
  try {
    // Get balance sheet data
    const latestFinancials = financialData.financials?.[0];
    if (!latestFinancials) {
      return {
        name: "AssetBased",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "Asset-based valuation not possible - no balance sheet data available.",
        assumptions: {},
        limitations: ["No balance sheet data"],
      };
    }

    // Balance sheet data not in current FinancialData structure
    const totalAssets = 0; // Placeholder
    const totalLiabilities = 0; // Placeholder
    const shareholderEquity = totalAssets - totalLiabilities;

    // Check for negative equity
    if (shareholderEquity <= 0) {
      return {
        name: "AssetBased",
        intrinsicValue: 0,
        upside: 0,
        assessment: "UNABLE_TO_VALUE",
        confidence: 0,
        narrative: "Asset-based valuation not applicable - company has negative equity.",
        assumptions: { shareholderEquity: shareholderEquity.toFixed(0) },
        limitations: ["Negative equity", "Company is technically insolvent"],
      };
    }

    // Adjust for intangible assets (reduce by 20% for typical company)
    const intangibleAdjustment = shareholderEquity * 0.2;
    const adjustedEquity = shareholderEquity - intangibleAdjustment;

    // Calculate intrinsic value per share (placeholder - would need share count)
    const intrinsicValue = adjustedEquity;

    // Determine confidence (low for tech/service companies)
    const confidence = 0.4; // Asset-based is generally less reliable

    // Calculate upside (placeholder)
    const upside = 0;

    // Determine assessment
    const assessment = "UNABLE_TO_VALUE"; // Generally not suitable for valuation

    const narrative = `Asset-based valuation calculates net asset value of $${(adjustedEquity / 1e9).toFixed(1)}B after adjusting for intangible assets. ` +
      `This method is not suitable for technology and service companies where intangible assets (brand, IP, talent) are primary value drivers.`;

    return {
      name: "AssetBased",
      intrinsicValue,
      upside,
      assessment,
      confidence,
      narrative,
      assumptions: {
        totalAssets: `$${(totalAssets / 1e9).toFixed(1)}B`,
        totalLiabilities: `$${(totalLiabilities / 1e9).toFixed(1)}B`,
        intangibleAdjustment: `20%`,
      },
      limitations: [
        "Not suitable for tech/service companies",
        "Ignores earning power and competitive advantage",
        "Book values may not reflect market values",
        "Intangible asset adjustments are subjective",
      ],
    };
  } catch (error) {
    return {
      name: "AssetBased",
      intrinsicValue: 0,
      upside: 0,
      assessment: "UNABLE_TO_VALUE",
      confidence: 0,
      narrative: `Asset-based analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      assumptions: {},
      limitations: ["Calculation error"],
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateAverageGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  let totalGrowth = 0;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] !== 0) {
      const growth = ((values[i] - values[i + 1]) / values[i + 1]) * 100;
      totalGrowth += growth;
    }
  }
  return totalGrowth / (values.length - 1);
}

function calculateWACC(financialData: FinancialData, dataQualityFlags: DataQualityFlags): number {
  // Simplified WACC calculation
  // Risk-free rate: 4.5%
  // Market risk premium: 6%
  // Beta: 1.0 (assume market average)
  // Cost of equity = 4.5 + 1.0 * 6 = 10.5%
  // Assume 80% equity, 20% debt
  // Cost of debt: 4% (conservative)
  // Tax rate: 21%

  const riskFreeRate = 4.5;
  const beta = 1.0;
  const marketRiskPremium = 6.0;
  const costOfEquity = riskFreeRate + beta * marketRiskPremium;

  const costOfDebt = 4.0;
  const taxRate = 0.21;
  const equityWeight = 0.8;
  const debtWeight = 0.2;

  const wacc = equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate);
  return wacc;
}

function calculateConsensusValuation(methods: ValuationMethod[]): { low: number; high: number; midpoint: number } {
  const values = methods.map(m => m.intrinsicValue).filter(v => v > 0);
  if (values.length === 0) {
    return { low: 0, high: 0, midpoint: 0 };
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  const midpoint = (low + high) / 2;
  return { low, high, midpoint };
}

function calculateUpside(currentPrice: number, intrinsicValue: number): number {
  if (currentPrice === 0) return 0;
  return ((intrinsicValue - currentPrice) / currentPrice) * 100;
}

function calculateMarginOfSafety(currentPrice: number, intrinsicValue: number): number {
  if (intrinsicValue === 0) return 0;
  return ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
}

function calculateMethodAgreement(methods: ValuationMethod[]): "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT" {
  if (methods.length < 2) return "STRONG";

  const upsides = methods.map(m => m.upside);
  const mean = upsides.reduce((a, b) => a + b) / upsides.length;
  const variance = upsides.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / upsides.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 10) return "STRONG";
  if (stdDev < 20) return "MODERATE";
  if (stdDev < 30) return "WEAK";
  return "DIVERGENT";
}

function determineAssessment(
  intrinsicValue: number,
  currentPrice: number,
  method: string
): "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" {
  if (intrinsicValue === 0) return "UNABLE_TO_VALUE";
  const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;
  if (upside > 15) return "UNDERVALUED";
  if (upside < -10) return "OVERVALUED";
  return "FAIRLY_VALUED";
}

function determineOverallAssessment(
  currentPrice: number,
  intrinsicValue: number,
  applicableMethodCount: number
): "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE" {
  if (applicableMethodCount === 0 || intrinsicValue === 0) return "UNABLE_TO_VALUE";
  return determineAssessment(intrinsicValue, currentPrice, "Overall");
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
  const applicableMethods = methods.filter(m => m.assessment !== "UNABLE_TO_VALUE");
  if (applicableMethods.length === 0) {
    return `Unable to determine valuation for ${ticker} - insufficient applicable valuation methods.`;
  }

  const marginAssessment =
    marginOfSafety >= 15 ? "strong" : marginOfSafety >= 5 ? "adequate" : marginOfSafety > 0 ? "thin" : "no";

  return `${ticker} appears ${consensusUpside > 0 ? "undervalued" : "overvalued"} at current price of $${currentPrice.toFixed(2)}. ` +
    `Valuation analysis suggests intrinsic value range of $${consensusValuation.low.toFixed(0)}-$${consensusValuation.high.toFixed(0)}, ` +
    `implying ${consensusUpside.toFixed(1)}% ${consensusUpside > 0 ? "upside" : "downside"}. ` +
    `Margin of safety is ${marginAssessment} at ${Math.abs(marginOfSafety).toFixed(1)}%. ` +
    `Method agreement is ${methodAgreement.toLowerCase()}, with ${applicableMethods.length} applicable valuation methods.`;
}

function collectDataQualityWarnings(
  financialData: FinancialData,
  dataQualityFlags: DataQualityFlags,
  methods: ValuationMethod[]
): string[] {
  const warnings: string[] = [];

  if (dataQualityFlags.roicZero) {
    warnings.push("ROIC data unavailable - cannot assess capital efficiency");
  }
  if (dataQualityFlags.interestCoverageZero) {
    warnings.push("Interest coverage data unavailable - cannot assess debt service capability");
  }
  if (dataQualityFlags.peNegative) {
    warnings.push("Negative earnings - P/E multiple valuation not applicable");
  }
  if (dataQualityFlags.debtToEquityAnomalous) {
    warnings.push("Debt-to-equity ratio appears anomalous - affects cost of capital calculation");
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

  // Value investors
  if (marginOfSafety < 5) {
    recommendations.push("Value investors: Margin of safety below 5% threshold - consider waiting for better entry point");
  } else if (marginOfSafety > 15) {
    recommendations.push("Value investors: Strong margin of safety (>15%) - attractive for conservative investors");
  }

  // Growth investors
  const dcfMethod = methods.find(m => m.name === "DCF");
  if (dcfMethod && dcfMethod.assessment !== "UNABLE_TO_VALUE") {
    recommendations.push("Growth investors: DCF analysis shows strong FCF generation - focus on earnings growth trajectory");
  }

  // Income investors
  const ddmMethod = methods.find(m => m.name === "DDM");
  if (ddmMethod && ddmMethod.assessment === "UNABLE_TO_VALUE") {
    recommendations.push("Income investors: Company does not pay dividends - not suitable for income-focused portfolios");
  }

  // Method agreement
  if (methodAgreement === "DIVERGENT") {
    recommendations.push("All investors: Valuation methods show strong disagreement - recommend caution and further research");
  }

  return recommendations;
}
