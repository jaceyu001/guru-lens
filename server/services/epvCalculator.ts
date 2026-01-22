import { FinancialData } from "../../shared/types";

/**
 * EPV (Earning Power Value) Valuation Model
 * 
 * Calculates intrinsic value using:
 * 1. 4-year normalized NOPAT (average of TTM, FY 2024, FY 2023, FY 2022)
 * 2. Fixed 9% WACC
 * 3. Dual growth scenarios: Zero growth + Market growth
 */

export interface EPVScenario {
  name: string;
  growthRate: number; // as decimal (e.g., 0.04 for 4%)
  nopat: number; // in millions
  epv: number; // Enterprise Value in millions
  equityValue: number; // in millions
  intrinsicValuePerShare: number;
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
}

export interface EPVValuation {
  scenarios: {
    conservative: EPVScenario; // Zero growth
    baseCase: EPVScenario; // Market growth
  };
  valuationRange: {
    low: number;
    high: number;
    midpoint: number;
  };
  marginOfSafety: number; // as percentage
  upsideToBaseCase: number; // as percentage
  downsideToConservative: number; // as percentage
  confidence: number; // 0-1
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
 * Uses: TTM, FY 2024, FY 2023, FY 2022
 */
export function calculateNormalizedNOPAT(financialData: FinancialData): {
  nopat: number;
  dataPoints: number;
  dataAvailability: string;
} {
  const nopats: number[] = [];
  const dataPoints: string[] = [];

  // TTM NOPAT (from quarterly financials if available)
  if (financialData.quarterlyFinancials && financialData.quarterlyFinancials.length >= 4) {
    let ttmRevenue = 0;
    let ttmOperatingProfit = 0;
    
    for (let i = 0; i < Math.min(4, financialData.quarterlyFinancials.length); i++) {
      ttmRevenue += financialData.quarterlyFinancials[i].revenue || 0;
      ttmOperatingProfit += financialData.quarterlyFinancials[i].operatingIncome || 0;
    }
    
    if (ttmRevenue > 0) {
      const ttmOperatingMargin = ttmOperatingProfit / ttmRevenue;
      const ttmTaxRate = financialData.ratios?.netMargin ? 
        (1 - financialData.ratios.netMargin / (financialData.ratios.operatingMargin || 0.1)) : 0.15;
      const ttmNopat = ttmRevenue * ttmOperatingMargin * (1 - Math.max(0, Math.min(1, ttmTaxRate)));
      
      if (ttmNopat > 0) {
        nopats.push(ttmNopat);
        dataPoints.push("TTM");
      }
    }
  }

  // FY 2024 NOPAT
  if (financialData.financials && financialData.financials.length > 0) {
    const fy2024 = financialData.financials[0];
    if (fy2024.revenue > 0 && fy2024.operatingIncome !== undefined) {
      const operatingMargin = fy2024.operatingIncome / fy2024.revenue;
      const taxRate = 0.15;
      const nopat = fy2024.revenue * operatingMargin * (1 - taxRate);
      
      if (!isNaN(nopat) && isFinite(nopat)) {
        nopats.push(Math.abs(nopat));
        dataPoints.push("FY2024");
      }
    }
  }

  // FY 2023 NOPAT
  if (financialData.financials && financialData.financials.length > 1) {
    const fy2023 = financialData.financials[1];
    if (fy2023.revenue > 0 && fy2023.operatingIncome !== undefined) {
      const operatingMargin = fy2023.operatingIncome / fy2023.revenue;
      const taxRate = 0.15;
      const nopat = fy2023.revenue * operatingMargin * (1 - taxRate);
      
      if (!isNaN(nopat) && isFinite(nopat)) {
        nopats.push(Math.abs(nopat));
        dataPoints.push("FY2023");
      }
    }
  }

  // FY 2022 NOPAT
  if (financialData.financials && financialData.financials.length > 2) {
    const fy2022 = financialData.financials[2];
    if (fy2022.revenue > 0 && fy2022.operatingIncome !== undefined) {
      const operatingMargin = fy2022.operatingIncome / fy2022.revenue;
      const taxRate = 0.15;
      const nopat = fy2022.revenue * operatingMargin * (1 - taxRate);
      
      if (!isNaN(nopat) && isFinite(nopat)) {
        nopats.push(Math.abs(nopat));
        dataPoints.push("FY2022");
      }
    }
  }

  // Calculate average NOPAT
  const normalizedNopat = nopats.length > 0 ? nopats.reduce((a, b) => a + b, 0) / nopats.length : 0;
  const dataAvailability = `${nopats.length} years (${dataPoints.join(", ")})`;

  return {
    nopat: normalizedNopat,
    dataPoints: nopats.length,
    dataAvailability,
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
  nopats: number[],
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

  // NOPAT stability factor
  if (nopats.length > 1 && normalizedNopat > 0) {
    const stdDev = Math.sqrt(
      nopats.reduce((sum, val) => sum + Math.pow(val - normalizedNopat, 2), 0) / nopats.length
    );
    const coefficientOfVariation = stdDev / normalizedNopat;

    if (coefficientOfVariation < 0.1) {
      confidence += 0.2;
    } else if (coefficientOfVariation < 0.2) {
      confidence += 0.1;
    } else if (coefficientOfVariation > 0.3) {
      confidence -= 0.1;
    }
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
  if (validatedGrowthRate >= WACC) {
    validatedGrowthRate = WACC - 0.01; // Cap at 8%
  }
  if (validatedGrowthRate < 0) {
    validatedGrowthRate = 0;
  }

  // Calculate normalized NOPAT
  const { nopat: normalizedNopat, dataPoints, dataAvailability } = calculateNormalizedNOPAT(financialData);

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
  const nopats = [normalizedNopat]; // Simplified - would need individual NOPAT values
  const confidence = calculateConfidence(dataPoints, normalizedNopat, nopats, llmGrowthRateInfo?.confidence);

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
