import { FinancialData } from "../../shared/types";

export interface EPVScenario {
  name: string;
  growthRate: number;
  nopat: number;
  epv: number;
  equityValue: number;
  intrinsicValuePerShare: number;
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
}

export interface EPVValuation {
  scenarios: {
    conservative: EPVScenario;
    baseCase: EPVScenario;
  };
  valuationRange: {
    low: number;
    high: number;
    midpoint: number;
  };
  marginOfSafety: number;
  upsideToBaseCase: number;
  downsideToConservative: number;
  confidence: number;
  llmGrowthRateInfo?: {
    growthRate: number;
    confidence: "high" | "medium" | "low";
    sources: string[];
    reasoning: string;
    caveats?: string;
  };
  assumptions: {
    normalizedNopat: number;
    wacc: number;
    marketGrowthRate: number;
    zeroGrowthRate: number;
    taxRate: number;
    totalDebt: number;
    nonOperatingCash: number;
    dilutedSharesOutstanding: number;
    dataAvailability: string;
  };
  narrative: string;
  limitations: string[];
}

/**
 * Calculate 4-year normalized NOPAT
 * Uses: TTM, FY2024, FY2023, FY2022
 * Formula: Average Operating Income × (1 - 15% Tax Rate)
 * 
 * Handles mixed profitability:
 * - Includes ALL years (positive and negative) for accurate normalization
 * - If average is negative, returns 0 (company is destroying value)
 * - Flags data quality issues for unprofitable periods
 */
export function calculateNormalizedNOPAT(financialData: FinancialData): {
  nopat: number;
  dataPoints: number;
  dataAvailability: string;
  hasNegativePeriods: boolean;
} {
  const operatingIncomes: number[] = [];
  const dataPoints: string[] = [];
  const TAX_RATE = 0.15; // Fixed 15% tax rate
  let hasNegativePeriods = false;

  // Extract operating income from financials array
  // Expected order: [TTM, FY2024, FY2023, FY2022]
  // IMPORTANT: Include ALL years (positive and negative) for accurate normalization
  if (financialData.financials && financialData.financials.length > 0) {
    for (let i = 0; i < Math.min(4, financialData.financials.length); i++) {
      const fin = financialData.financials[i];
      if (fin.operatingIncome !== undefined) {
        operatingIncomes.push(fin.operatingIncome);
        dataPoints.push(fin.period);
        if (fin.operatingIncome < 0) {
          hasNegativePeriods = true;
        }
      }
    }
  }

  // Calculate average operating income (including negative values)
  const avgOperatingIncome = operatingIncomes.length > 0 
    ? operatingIncomes.reduce((a, b) => a + b, 0) / operatingIncomes.length 
    : 0;

  // If average is negative or zero, the company is not generating sustainable earnings
  // Set NOPAT to 0 to indicate inability to value using EPV
  const normalizedNopat = avgOperatingIncome > 0 
    ? avgOperatingIncome * (1 - TAX_RATE)
    : 0;

  const dataAvailability = `${operatingIncomes.length} years (${dataPoints.join(", ")})`;

  return {
    nopat: normalizedNopat,
    dataPoints: operatingIncomes.length,
    dataAvailability,
    hasNegativePeriods,
  };
}

/**
 * Calculate EPV for a single scenario
 */
function calculateEPVScenario(
  nopat: number,
  growthRate: number,
  wacc: number = 0.09,
  totalDebt: number,
  nonOperatingCash: number,
  dilutedShares: number,
  scenarioName: string,
  currentPrice: number
): EPVScenario {
  // EPV formula: NOPAT / (WACC - g)
  // For zero growth: NOPAT / WACC
  const denominator = growthRate > 0 ? (wacc - growthRate) : wacc;
  
  if (denominator <= 0) {
    return {
      name: scenarioName,
      growthRate,
      nopat,
      epv: 0,
      equityValue: 0,
      intrinsicValuePerShare: 0,
      assessment: "UNABLE_TO_VALUE",
    };
  }

  const epv = nopat / denominator;
  const equityValue = epv - totalDebt + nonOperatingCash;
  const intrinsicValuePerShare = dilutedShares > 0 ? equityValue / dilutedShares : 0;

  // Determine assessment
  let assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  if (intrinsicValuePerShare <= 0) {
    assessment = "UNABLE_TO_VALUE";
  } else if (currentPrice < intrinsicValuePerShare * 0.9) {
    assessment = "UNDERVALUED";
  } else if (currentPrice > intrinsicValuePerShare * 1.1) {
    assessment = "OVERVALUED";
  } else {
    assessment = "FAIRLY_VALUED";
  }

  return {
    name: scenarioName,
    growthRate,
    nopat,
    epv,
    equityValue,
    intrinsicValuePerShare,
    assessment,
  };
}

/**
 * Calculate confidence score based on data availability and stability
 */
function calculateConfidence(
  dataPoints: number,
  normalizedNopat: number,
  llmConfidence?: "high" | "medium" | "low"
): number {
  let confidence = 0.6; // Base confidence

  // Data availability factor
  if (dataPoints === 4) {
    confidence += 0.2;
  } else if (dataPoints === 3) {
    confidence += 0.1;
  } else if (dataPoints < 2) {
    confidence -= 0.1;
  }

  // LLM confidence factor
  if (llmConfidence === "high") {
    confidence += 0.1;
  } else if (llmConfidence === "low") {
    confidence -= 0.1;
  }

  // Cap confidence between 0.3 and 0.9
  return Math.max(0.3, Math.min(0.9, confidence));
}

/**
 * Main EPV valuation function
 */
export function calculateEPV(
  financialData: FinancialData,
  currentPrice: number,
  marketGrowthRate: number,
  llmGrowthRateInfo?: {
    growthRate: number;
    confidence: "high" | "medium" | "low";
    sources: string[];
    reasoning: string;
    caveats?: string;
  }
): EPVValuation {
  const WACC = 0.09; // Fixed 9%
  const zeroGrowthRate = 0;

  // Validate and cap market growth rate
  let validatedGrowthRate = marketGrowthRate;
  // Cap growth rate at 4% maximum
  if (validatedGrowthRate > 0.04) {
    validatedGrowthRate = 0.04; // Cap at 4%
  }
  if (validatedGrowthRate >= WACC) {
    validatedGrowthRate = WACC - 0.01; // Cap at 8% if still too high
  }
  if (validatedGrowthRate < 0) {
    validatedGrowthRate = 0;
  }

  // Calculate normalized NOPAT
  const { nopat: normalizedNopat, dataPoints, dataAvailability, hasNegativePeriods } = calculateNormalizedNOPAT(financialData);

  // Get debt and cash data from balance sheet
  const totalDebt = financialData.balanceSheet?.totalDebt || 0;
  const nonOperatingCash = financialData.balanceSheet?.cash || 0;
  const dilutedShares = financialData.profile?.dilutedSharesOutstanding || 1;

  // Calculate both scenarios
  const conservativeScenario = calculateEPVScenario(
    normalizedNopat,
    zeroGrowthRate,
    WACC,
    totalDebt,
    nonOperatingCash,
    dilutedShares,
    "Zero Growth (Conservative)",
    currentPrice
  );

  const baseScenario = calculateEPVScenario(
    normalizedNopat,
    validatedGrowthRate,
    WACC,
    totalDebt,
    nonOperatingCash,
    dilutedShares,
    "Market Growth (Base Case)",
    currentPrice
  );

  // Calculate valuation range
  const low = conservativeScenario.intrinsicValuePerShare;
  const high = baseScenario.intrinsicValuePerShare;
  const midpoint = (low + high) / 2;

  // Calculate upside/downside
  const upsideToBaseCase = baseScenario.intrinsicValuePerShare > 0
    ? ((baseScenario.intrinsicValuePerShare - currentPrice) / currentPrice) * 100
    : 0;

  const downsideToConservative = conservativeScenario.intrinsicValuePerShare > 0
    ? ((conservativeScenario.intrinsicValuePerShare - currentPrice) / currentPrice) * 100
    : 0;

  // Calculate margin of safety
  const marginOfSafety = conservativeScenario.intrinsicValuePerShare > 0
    ? ((conservativeScenario.intrinsicValuePerShare - currentPrice) / conservativeScenario.intrinsicValuePerShare) * 100
    : 0;

  // Calculate confidence
  const confidence = calculateConfidence(dataPoints, normalizedNopat, llmGrowthRateInfo?.confidence);

  // Generate narrative
  const narrative = `EPV analysis suggests company is ${baseScenario.assessment.toLowerCase()}. ` +
    `Conservative scenario (zero growth) values stock at $${conservativeScenario.intrinsicValuePerShare.toFixed(2)}, ` +
    `while base case (${(validatedGrowthRate * 100).toFixed(1)}% growth) values at $${baseScenario.intrinsicValuePerShare.toFixed(2)}. ` +
    `Current price of $${currentPrice.toFixed(2)} falls ${
      currentPrice < low ? "below" : currentPrice > high ? "above" : "within"
    } this range. ` +
    `Normalized NOPAT based on ${dataAvailability}.`;

  // Limitations
  const limitations: string[] = [
    "Assumes normalized NOPAT is sustainable",
    "Does not account for cyclical business variations",
    "Terminal value assumes perpetual operations",
    "Sensitive to WACC assumptions (fixed at 9%)",
    "Market growth rate may be inaccurate",
  ];

  if (dataPoints < 4) {
    limitations.push(`Limited historical data (only ${dataPoints} years available)`);
  }

  if (normalizedNopat <= 0) {
    limitations.push("Negative or zero NOPAT - valuation may not be reliable");
  }

  if (hasNegativePeriods) {
    limitations.push("Company has unprofitable periods - suggests financial distress or turnaround situation");
  }

  return {
    scenarios: {
      conservative: conservativeScenario,
      baseCase: baseScenario,
    },
    valuationRange: {
      low,
      high,
      midpoint,
    },
    marginOfSafety,
    upsideToBaseCase,
    downsideToConservative,
    confidence,
    llmGrowthRateInfo,
    assumptions: {
      normalizedNopat,
      wacc: WACC * 100,
      marketGrowthRate: validatedGrowthRate * 100,
      zeroGrowthRate: zeroGrowthRate * 100,
      taxRate: 15,
      totalDebt,
      nonOperatingCash,
      dilutedSharesOutstanding: dilutedShares,
      dataAvailability,
    },
    narrative,
    limitations,
  };
}
