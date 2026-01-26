/**
 * Shared Persona Scoring Engine
 * 
 * This is the single source of truth for persona scoring logic.
 * Both individual stock analysis and opportunity scanning use this engine.
 * 
 * Any changes to persona criteria here automatically apply to both systems.
 */

import type { KeyRatios } from "../../shared/types";

export interface ScoringThreshold {
  min: number;
  max: number;
  points: number;
  label: string;
}

export interface MetricScoringConfig {
  [bracket: string]: ScoringThreshold;
}

export interface PersonaScoringCriteria {
  name: string;
  description: string;
  minThreshold: number; // Minimum score to be considered an opportunity (0-100)
  categories: {
    [categoryName: string]: {
      weight: number; // 0-1, should sum to 1.0
      maxPoints: number;
      metrics: {
        [metricName: string]: MetricScoringConfig;
      };
    };
  };
}

/**
 * WARREN BUFFETT SCORING CONFIGURATION
 * 
 * Philosophy: Buy wonderful companies at fair prices
 * Focus: Quality businesses with durable competitive advantages
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 60 points
 */
export const WARREN_BUFFETT_SCORING: PersonaScoringCriteria = {
  name: "Warren Buffett",
  description: "The Oracle of Omaha - Value investing legend focused on quality businesses with durable competitive advantages",
  minThreshold: 60,
  categories: {
    "Financial Health": {
      weight: 0.25,
      maxPoints: 25,
      metrics: {
        debtToEquity: {
          excellent: { min: 0, max: 0.5, points: 10, label: "Excellent" },
          good: { min: 0.5, max: 1.0, points: 7, label: "Good" },
          fair: { min: 1.0, max: 1.5, points: 4, label: "Fair" },
          poor: { min: 1.5, max: 100, points: 0, label: "Poor" },
        },
        currentRatio: {
          excellent: { min: 2.0, max: 100, points: 10, label: "Excellent" },
          good: { min: 1.5, max: 2.0, points: 7, label: "Good" },
          fair: { min: 1.0, max: 1.5, points: 4, label: "Fair" },
          poor: { min: 0, max: 1.0, points: 0, label: "Poor" },
        },
        interestCoverage: {
          excellent: { min: 5.0, max: 1000, points: 5, label: "Excellent" },
          good: { min: 3.0, max: 5.0, points: 3, label: "Good" },
          fair: { min: 1.5, max: 3.0, points: 1, label: "Fair" },
          poor: { min: 0, max: 1.5, points: 0, label: "Poor" },
        },
      },
    },
    "Profitability & Quality": {
      weight: 0.35,
      maxPoints: 35,
      metrics: {
        roe: {
          excellent: { min: 0.20, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.15, max: 0.20, points: 9, label: "Good" },
          fair: { min: 0.10, max: 0.15, points: 5, label: "Fair" },
          poor: { min: 0, max: 0.10, points: 0, label: "Poor" },
        },
        roa: {
          excellent: { min: 0.10, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.07, max: 0.10, points: 9, label: "Good" },
          fair: { min: 0.04, max: 0.07, points: 5, label: "Fair" },
          poor: { min: 0, max: 0.04, points: 0, label: "Poor" },
        },
        netMargin: {
          excellent: { min: 0.15, max: 1.0, points: 11, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 8, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
      },
    },
    "Valuation": {
      weight: 0.25,
      maxPoints: 25,
      metrics: {
        peRatio: {
          excellent: { min: 0, max: 15, points: 10, label: "Excellent" },
          good: { min: 15, max: 20, points: 7, label: "Good" },
          fair: { min: 20, max: 25, points: 4, label: "Fair" },
          poor: { min: 25, max: 1000, points: 0, label: "Poor" },
        },
        pbRatio: {
          excellent: { min: 0, max: 1.5, points: 10, label: "Excellent" },
          good: { min: 1.5, max: 2.5, points: 7, label: "Good" },
          fair: { min: 2.5, max: 3.5, points: 4, label: "Fair" },
          poor: { min: 3.5, max: 1000, points: 0, label: "Poor" },
        },
        upsidePercent: {
          excellent: { min: 50, max: 1000, points: 5, label: "Excellent" },
          good: { min: 30, max: 50, points: 3, label: "Good" },
          fair: { min: 10, max: 30, points: 1, label: "Fair" },
          poor: { min: -1000, max: 10, points: 0, label: "Poor" },
        },
      },
    },
    "Growth & Earnings Quality": {
      weight: 0.15,
      maxPoints: 15,
      metrics: {
        earningsGrowth: {
          excellent: { min: 0.15, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 6, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 3, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        earningsStability: {
          excellent: { min: 3, max: 100, points: 7, label: "Excellent" },
          good: { min: 2, max: 3, points: 4, label: "Good" },
          fair: { min: 1, max: 2, points: 2, label: "Fair" },
          poor: { min: 0, max: 1, points: 0, label: "Poor" },
        },
      },
    },
  },
};

/**
 * PETER LYNCH SCORING CONFIGURATION
 * 
 * Philosophy: Find undervalued growth stocks trading below their potential
 * Focus: Companies growing faster than their P/E ratio (GARP)
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 55 points
 */
export const PETER_LYNCH_SCORING: PersonaScoringCriteria = {
  name: "Peter Lynch",
  description: "The Legendary Growth Investor - Finds undervalued growth stocks trading below their potential",
  minThreshold: 55,
  categories: {
    "Valuation": {
      weight: 0.25,
      maxPoints: 25,
      metrics: {
        pegRatio: {
          excellent: { min: 0, max: 0.8, points: 15, label: "Excellent" },
          good: { min: 0.8, max: 1.2, points: 10, label: "Good" },
          fair: { min: 1.2, max: 1.5, points: 5, label: "Fair" },
          poor: { min: 1.5, max: 1000, points: 0, label: "Poor" },
        },
        psRatio: {
          excellent: { min: 0, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 2.0, points: 7, label: "Good" },
          fair: { min: 2.0, max: 3.0, points: 4, label: "Fair" },
          poor: { min: 3.0, max: 1000, points: 0, label: "Poor" },
        },
      },
    },
    "Growth": {
      weight: 0.40,
      maxPoints: 40,
      metrics: {
        revenueGrowth: {
          excellent: { min: 0.20, max: 1.0, points: 15, label: "Excellent" },
          good: { min: 0.15, max: 0.20, points: 11, label: "Good" },
          fair: { min: 0.10, max: 0.15, points: 7, label: "Fair" },
          slow: { min: 0.05, max: 0.10, points: 3, label: "Slow" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        earningsGrowth: {
          excellent: { min: 0.25, max: 1.0, points: 15, label: "Excellent" },
          good: { min: 0.15, max: 0.25, points: 11, label: "Good" },
          fair: { min: 0.10, max: 0.15, points: 7, label: "Fair" },
          slow: { min: 0.05, max: 0.10, points: 3, label: "Slow" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        fcfGrowth: {
          excellent: { min: 0.20, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.10, max: 0.20, points: 7, label: "Good" },
          fair: { min: 0, max: 0.10, points: 4, label: "Fair" },
          poor: { min: -1.0, max: 0, points: 0, label: "Poor" },
        },
      },
    },
    "Quality": {
      weight: 0.20,
      maxPoints: 20,
      metrics: {
        roe: {
          excellent: { min: 0.15, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 7, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        debtToEquity: {
          excellent: { min: 0, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 7, label: "Good" },
          fair: { min: 1.5, max: 2.0, points: 4, label: "Fair" },
          poor: { min: 2.0, max: 100, points: 0, label: "Poor" },
        },
      },
    },
    "Momentum": {
      weight: 0.15,
      maxPoints: 15,
      metrics: {
        pricePerformance52Week: {
          strong: { min: 0.20, max: 1.0, points: 8, label: "Strong" },
          good: { min: 0.10, max: 0.20, points: 5, label: "Good" },
          weak: { min: 0, max: 0.10, points: 2, label: "Weak" },
          negative: { min: -1.0, max: 0, points: 0, label: "Negative" },
        },
      },
    },
  },
};

/**
 * BENJAMIN GRAHAM SCORING CONFIGURATION
 * 
 * Philosophy: Buy stocks trading significantly below intrinsic value
 * Focus: Margin of safety and fundamental value
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 65 points
 */
export const BENJAMIN_GRAHAM_SCORING: PersonaScoringCriteria = {
  name: "Benjamin Graham",
  description: "Deep Value Investor - Focused on finding stocks trading significantly below intrinsic value",
  minThreshold: 65,
  categories: {
    "Valuation Discount": {
      weight: 0.40,
      maxPoints: 40,
      metrics: {
        intrinsicDiscount: {
          excellent: { min: 0.40, max: 1.0, points: 20, label: "Excellent" },
          good: { min: 0.30, max: 0.40, points: 15, label: "Good" },
          fair: { min: 0.20, max: 0.30, points: 10, label: "Fair" },
          marginal: { min: 0.10, max: 0.20, points: 5, label: "Marginal" },
          poor: { min: 0, max: 0.10, points: 0, label: "Poor" },
        },
        peVsHistorical: {
          excellent: { min: 0, max: 0.50, points: 10, label: "Excellent" },
          good: { min: 0.50, max: 0.70, points: 7, label: "Good" },
          fair: { min: 0.70, max: 0.90, points: 4, label: "Fair" },
          poor: { min: 0.90, max: 1.0, points: 0, label: "Poor" },
        },
        pbRatio: {
          excellent: { min: 0, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 7, label: "Good" },
          fair: { min: 1.5, max: 2.0, points: 4, label: "Fair" },
          poor: { min: 2.0, max: 1000, points: 0, label: "Poor" },
        },
      },
    },
    "Fundamental Strength": {
      weight: 0.35,
      maxPoints: 35,
      metrics: {
        roe: {
          excellent: { min: 0.15, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 9, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 5, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        debtToEquity: {
          excellent: { min: 0, max: 0.5, points: 12, label: "Excellent" },
          good: { min: 0.5, max: 1.0, points: 9, label: "Good" },
          fair: { min: 1.0, max: 1.5, points: 5, label: "Fair" },
          poor: { min: 1.5, max: 100, points: 0, label: "Poor" },
        },
        currentRatio: {
          excellent: { min: 1.5, max: 100, points: 11, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 7, label: "Good" },
          poor: { min: 0, max: 1.0, points: 0, label: "Poor" },
        },
      },
    },
    "Earnings Quality": {
      weight: 0.15,
      maxPoints: 15,
      metrics: {
        earningsStability: {
          excellent: { min: 3, max: 100, points: 10, label: "Excellent" },
          good: { min: 2, max: 3, points: 7, label: "Good" },
          fair: { min: 1, max: 2, points: 3, label: "Fair" },
          poor: { min: 0, max: 1, points: 0, label: "Poor" },
        },
        fcfToNI: {
          excellent: { min: 0.80, max: 1.0, points: 5, label: "Excellent" },
          good: { min: 0.60, max: 0.80, points: 3, label: "Good" },
          fair: { min: 0, max: 0.60, points: 1, label: "Fair" },
          poor: { min: -1.0, max: 0, points: 0, label: "Poor" },
        },
      },
    },
    "Dividend & Shareholder Returns": {
      weight: 0.10,
      maxPoints: 10,
      metrics: {
        dividendYield: {
          excellent: { min: 0.03, max: 1.0, points: 6, label: "Excellent" },
          good: { min: 0.01, max: 0.03, points: 3, label: "Good" },
          low: { min: 0, max: 0.01, points: 1, label: "Low" },
          none: { min: -1.0, max: 0, points: 0, label: "None" },
        },
        dividendHistory: {
          excellent: { min: 10, max: 100, points: 4, label: "Excellent" },
          good: { min: 5, max: 10, points: 2, label: "Good" },
          fair: { min: 1, max: 5, points: 1, label: "Fair" },
          poor: { min: 0, max: 1, points: 0, label: "Poor" },
        },
      },
    },
  },
};



/**
 * Calculate score for a stock based on persona criteria
 * 
 * @param ratios - Financial ratios for the stock
 * @param personaId - The persona to score against
 * @returns Score 0-100, or null if insufficient data
 */
export function calculatePersonaScore(
  ratios: Partial<KeyRatios>,
  personaId: string
): number | null {
  const config = PERSONA_SCORING_CONFIGS[personaId];
  if (!config) {
    throw new Error(`Unknown persona: ${personaId}`);
  }

  let totalScore = 0;
  let maxPossible = 0;
  let metricsScored = 0;

  // Iterate through each category
  for (const [categoryName, category] of Object.entries(config.categories)) {
    let categoryScore = 0;
    let categoryMaxPoints = category.maxPoints;

    // Iterate through each metric in the category
    for (const [metricName, thresholds] of Object.entries(category.metrics)) {
      const metricValue = getMetricValue(ratios, metricName);

      if (metricValue !== null) {
        // Find which threshold bracket this metric falls into
        const points = findThresholdPoints(metricValue, thresholds);
        categoryScore += points;
        metricsScored++;
      }
    }

    // Add weighted category score
    totalScore += categoryScore * category.weight;
    maxPossible += categoryMaxPoints * category.weight;
  }

  // If we don't have enough data, return null
  if (metricsScored === 0) {
    return null;
  }

  // Normalize to 0-100 scale
  const finalScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  return Math.round(finalScore);
}

/**
 * Get metric value from ratios object
 * Maps metric names to actual ratio properties
 */
function getMetricValue(ratios: Partial<KeyRatios> & Record<string, any>, metricName: string): number | null {
  const metricMap: Record<string, string> = {
    debtToEquity: "debtToEquity",
    currentRatio: "currentRatio",
    interestCoverage: "interestCoverage",
    roe: "roe",
    roa: "roa",
    netMargin: "netMargin",
    peRatio: "peRatio",
    pbRatio: "pbRatio",
    upsidePercent: "upsidePercent",
    earningsGrowth: "earningsGrowth",
    earningsStability: "earningsStability",
    pegRatio: "pegRatio",
    psRatio: "psRatio",
    revenueGrowth: "revenueGrowth",
    fcfGrowth: "fcfGrowth",
    pricePerformance52Week: "pricePerformance52Week",
    intrinsicDiscount: "intrinsicDiscount",
    peVsHistorical: "peVsHistorical",
    fcfToNI: "fcfToNI",
    dividendYield: "dividendYield",
    dividendHistory: "dividendHistory",
  };

  const ratioKey = metricMap[metricName];
  if (!ratioKey) {
    console.warn(`Unknown metric: ${metricName}`);
    return null;
  }

  const value = ratios[ratioKey];
  return value !== undefined && value !== null ? (value as number) : null;
}

/**
 * Find which threshold bracket a metric falls into and return points
 */
function findThresholdPoints(
  metricValue: number,
  thresholds: MetricScoringConfig
): number {
  for (const bracket of Object.values(thresholds)) {
    if (metricValue >= bracket.min && metricValue <= bracket.max) {
      return bracket.points;
    }
  }
  // If no bracket matches, return 0
  return 0;
}

/**
 * Get persona scoring configuration
 */
export function getPersonaScoringConfig(personaId: string): PersonaScoringCriteria | null {
  return PERSONA_SCORING_CONFIGS[personaId] || null;
}

/**
 * Get minimum threshold for a persona
 */
export function getPersonaMinThreshold(personaId: string): number {
  const config = PERSONA_SCORING_CONFIGS[personaId];
  return config ? config.minThreshold : 60;
}

/**
 * Check if a stock qualifies as an opportunity for a persona
 */
export function isOpportunity(
  ratios: Partial<KeyRatios>,
  personaId: string
): boolean {
  const score = calculatePersonaScore(ratios, personaId);
  if (score === null) {
    return false;
  }

  const minThreshold = getPersonaMinThreshold(personaId);
  return score >= minThreshold;
}

/**
 * Get detailed scoring breakdown for a stock
 */
export function getDetailedScoreBreakdown(
  ratios: Partial<KeyRatios>,
  personaId: string
): {
  totalScore: number;
  categories: Array<{
    name: string;
    weight: number;
    categoryScore: number;
    maxPoints: number;
    metrics: Array<{
      name: string;
      value: number | null;
      points: number;
      maxPoints: number;
      label: string;
    }>;
  }>;
} | null {
  const config = PERSONA_SCORING_CONFIGS[personaId];
  if (!config) {
    return null;
  }

  let totalScore = 0;
  const categories = [];

  for (const [categoryName, category] of Object.entries(config.categories)) {
    let categoryScore = 0;
    const metrics = [];

    for (const [metricName, thresholds] of Object.entries(category.metrics)) {
      const metricValue = getMetricValue(ratios, metricName);
      let points = 0;
      let label = "N/A";

      if (metricValue !== null) {
        points = findThresholdPoints(metricValue, thresholds);
        // Find the label for this bracket
        for (const bracket of Object.values(thresholds)) {
          if (metricValue >= bracket.min && metricValue <= bracket.max) {
            label = bracket.label;
            break;
          }
        }
      }

      metrics.push({
        name: metricName,
        value: metricValue,
        points,
        maxPoints: Math.max(...Object.values(thresholds).map((t) => t.points)),
        label,
      });

      categoryScore += points;
    }

    const weightedCategoryScore = categoryScore * category.weight;
    totalScore += weightedCategoryScore;

    categories.push({
      name: categoryName,
      weight: category.weight,
      categoryScore,
      maxPoints: category.maxPoints,
      metrics,
    });
  }

  return {
    totalScore: Math.round(totalScore),
    categories,
  };
}


/**
 * Calculate detailed scoring breakdown with metric details
 * Returns category scores and individual metric ratings
 */
export function calculateDetailedScoringBreakdown(
  ratios: Partial<KeyRatios>,
  personaId: string
): {
  categories: Array<{
    name: string;
    points: number;
    maxPoints: number;
    metrics: Array<{
      name: string;
      value: number;
      rating: string;
      points: number;
    }>;
  }>;
  totalScore: number;
} | null {
  const config = PERSONA_SCORING_CONFIGS[personaId];
  if (!config) {
    throw new Error(`Unknown persona: ${personaId}`);
  }

  let totalScore = 0;
  let maxPossible = 0;
  const categories: Array<{
    name: string;
    points: number;
    maxPoints: number;
    metrics: Array<{
      name: string;
      value: number;
      rating: string;
      points: number;
    }>;
  }> = [];

  // Iterate through each category
  for (const [categoryName, category] of Object.entries(config.categories)) {
    let categoryScore = 0;
    const metrics: Array<{
      name: string;
      value: number;
      rating: string;
      points: number;
    }> = [];

    // Iterate through each metric in the category
    for (const [metricName, thresholds] of Object.entries(category.metrics)) {
      const metricValue = getMetricValue(ratios, metricName);

      if (metricValue !== null) {
        // Find which threshold bracket this metric falls into
        const points = findThresholdPoints(metricValue, thresholds);
        const rating = findThresholdRating(metricValue, thresholds);
        
        categoryScore += points;
        metrics.push({
          name: metricName,
          value: Number(metricValue.toFixed(2)),
          rating,
          points,
        });
      }
    }

    // Add weighted category score
    const weightedScore = categoryScore * category.weight;
    totalScore += weightedScore;
    maxPossible += category.maxPoints * category.weight;

    categories.push({
      name: categoryName,
      points: Math.round(weightedScore),
      maxPoints: Math.round(category.maxPoints * category.weight),
      metrics,
    });
  }

  // If we don't have enough data, return null
  if (categories.every((c) => c.metrics.length === 0)) {
    return null;
  }

  // Normalize to 0-100 scale
  const finalScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  return {
    categories,
    totalScore: Math.round(finalScore),
  };
}

/**
 * Find the rating label for a metric value
 */
function findThresholdRating(
  value: number,
  thresholds: MetricScoringConfig
): string {
  for (const [rating, threshold] of Object.entries(thresholds)) {
    if (value >= threshold.min && value <= threshold.max) {
      return threshold.label;
    }
  }
  return "Unknown";
}

/**
 * CATHIE WOOD SCORING CONFIGURATION
 * 
 * Philosophy: Disruptive innovation and technology disruption
 * Focus: High-growth companies with transformative potential
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 50 points
 */
export const CATHIE_WOOD_SCORING: PersonaScoringCriteria = {
  name: "Cathie Wood",
  description: "Innovation-focused investor seeking disruptive technology companies with exponential growth potential",
  minThreshold: 50,
  categories: {
    "Growth Metrics": {
      weight: 0.40,
      maxPoints: 40,
      metrics: {
        revenueGrowth: {
          excellent: { min: 0.30, max: 1.0, points: 15, label: "Excellent" },
          good: { min: 0.15, max: 0.30, points: 10, label: "Good" },
          fair: { min: 0.05, max: 0.15, points: 5, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        earningsGrowth: {
          excellent: { min: 0.40, max: 1.0, points: 15, label: "Excellent" },
          good: { min: 0.20, max: 0.40, points: 10, label: "Good" },
          fair: { min: 0.05, max: 0.20, points: 5, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        fcfGrowth: {
          excellent: { min: 0.25, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.10, max: 0.25, points: 5, label: "Good" },
          poor: { min: 0, max: 0.10, points: 0, label: "Poor" },
        },
      },
    },
    "Profitability & Efficiency": {
      weight: 0.30,
      maxPoints: 30,
      metrics: {
        roa: {
          excellent: { min: 0.10, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.05, max: 0.10, points: 8, label: "Good" },
          fair: { min: 0, max: 0.05, points: 3, label: "Fair" },
          poor: { min: -1.0, max: 0, points: 0, label: "Poor" },
        },
        netMargin: {
          excellent: { min: 0.10, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.05, max: 0.10, points: 6, label: "Good" },
          fair: { min: 0, max: 0.05, points: 2, label: "Fair" },
          poor: { min: -1.0, max: 0, points: 0, label: "Poor" },
        },
        roe: {
          excellent: { min: 0.15, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 5, label: "Good" },
          fair: { min: 0, max: 0.10, points: 2, label: "Fair" },
          poor: { min: -1.0, max: 0, points: 0, label: "Poor" },
        },
      },
    },
    "Financial Health": {
      weight: 0.20,
      maxPoints: 20,
      metrics: {
        debtToEquity: {
          excellent: { min: 0, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 2.0, points: 6, label: "Good" },
          fair: { min: 2.0, max: 3.0, points: 2, label: "Fair" },
          poor: { min: 3.0, max: 100, points: 0, label: "Poor" },
        },
        currentRatio: {
          excellent: { min: 1.5, max: 100, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 6, label: "Good" },
          poor: { min: 0, max: 1.0, points: 0, label: "Poor" },
        },
      },
    },
    "Valuation": {
      weight: 0.10,
      maxPoints: 10,
      metrics: {
        pegRatio: {
          excellent: { min: 0, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 1.0, max: 2.0, points: 4, label: "Good" },
          fair: { min: 2.0, max: 3.0, points: 2, label: "Fair" },
          poor: { min: 3.0, max: 1000, points: 0, label: "Poor" },
        },
      },
    },
  },
};

/**
 * RAY DALIO SCORING CONFIGURATION
 * 
 * Philosophy: Diversified portfolio with macroeconomic balance
 * Focus: Uncorrelated assets with strong fundamentals
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 55 points
 */
export const RAY_DALIO_SCORING: PersonaScoringCriteria = {
  name: "Ray Dalio",
  description: "Macro-focused investor seeking diversified, uncorrelated assets with strong fundamental support",
  minThreshold: 55,
  categories: {
    "Fundamental Strength": {
      weight: 0.35,
      maxPoints: 35,
      metrics: {
        roe: {
          excellent: { min: 0.15, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 8, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        debtToEquity: {
          excellent: { min: 0, max: 0.8, points: 12, label: "Excellent" },
          good: { min: 0.8, max: 1.5, points: 8, label: "Good" },
          fair: { min: 1.5, max: 2.0, points: 3, label: "Fair" },
          poor: { min: 2.0, max: 100, points: 0, label: "Poor" },
        },
        currentRatio: {
          excellent: { min: 1.5, max: 100, points: 11, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 7, label: "Good" },
          poor: { min: 0, max: 1.0, points: 0, label: "Poor" },
        },
      },
    },
    "Profitability": {
      weight: 0.30,
      maxPoints: 30,
      metrics: {
        netMargin: {
          excellent: { min: 0.10, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.05, max: 0.10, points: 8, label: "Good" },
          fair: { min: 0.02, max: 0.05, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.02, points: 0, label: "Poor" },
        },
        roa: {
          excellent: { min: 0.08, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.05, max: 0.08, points: 6, label: "Good" },
          fair: { min: 0.02, max: 0.05, points: 3, label: "Fair" },
          poor: { min: 0, max: 0.02, points: 0, label: "Poor" },
        },
        fcfToNI: {
          excellent: { min: 0.70, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 0.50, max: 0.70, points: 4, label: "Good" },
          poor: { min: 0, max: 0.50, points: 0, label: "Poor" },
        },
      },
    },
    "Valuation & Value": {
      weight: 0.20,
      maxPoints: 20,
      metrics: {
        peRatio: {
          excellent: { min: 0, max: 15, points: 10, label: "Excellent" },
          good: { min: 15, max: 20, points: 6, label: "Good" },
          fair: { min: 20, max: 25, points: 2, label: "Fair" },
          poor: { min: 25, max: 1000, points: 0, label: "Poor" },
        },
        pbRatio: {
          excellent: { min: 0, max: 1.5, points: 10, label: "Excellent" },
          good: { min: 1.5, max: 2.5, points: 6, label: "Good" },
          fair: { min: 2.5, max: 3.5, points: 2, label: "Fair" },
          poor: { min: 3.5, max: 1000, points: 0, label: "Poor" },
        },
      },
    },
    "Stability & Dividends": {
      weight: 0.15,
      maxPoints: 15,
      metrics: {
        dividendYield: {
          excellent: { min: 0.02, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 0.01, max: 0.02, points: 4, label: "Good" },
          low: { min: 0, max: 0.01, points: 1, label: "Low" },
          none: { min: -1.0, max: 0, points: 0, label: "None" },
        },
        earningsStability: {
          excellent: { min: 3, max: 100, points: 7, label: "Excellent" },
          good: { min: 2, max: 3, points: 4, label: "Good" },
          poor: { min: 0, max: 2, points: 0, label: "Poor" },
        },
      },
    },
  },
};

/**
 * PHILIP FISHER SCORING CONFIGURATION
 * 
 * Philosophy: Quality growth at reasonable prices
 * Focus: Companies with excellent management and competitive advantages
 * 
 * Scoring: 0-100 points
 * Minimum threshold for opportunity: 58 points
 */
export const PHILIP_FISHER_SCORING: PersonaScoringCriteria = {
  name: "Philip Fisher",
  description: "Growth investor seeking quality companies with strong management and sustainable competitive advantages",
  minThreshold: 58,
  categories: {
    "Business Quality": {
      weight: 0.35,
      maxPoints: 35,
      metrics: {
        roe: {
          excellent: { min: 0.18, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.12, max: 0.18, points: 8, label: "Good" },
          fair: { min: 0.08, max: 0.12, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.08, points: 0, label: "Poor" },
        },
        roa: {
          excellent: { min: 0.10, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.07, max: 0.10, points: 8, label: "Good" },
          fair: { min: 0.04, max: 0.07, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.04, points: 0, label: "Poor" },
        },
        netMargin: {
          excellent: { min: 0.12, max: 1.0, points: 11, label: "Excellent" },
          good: { min: 0.08, max: 0.12, points: 7, label: "Good" },
          fair: { min: 0.04, max: 0.08, points: 3, label: "Fair" },
          poor: { min: 0, max: 0.04, points: 0, label: "Poor" },
        },
      },
    },
    "Growth Trajectory": {
      weight: 0.30,
      maxPoints: 30,
      metrics: {
        revenueGrowth: {
          excellent: { min: 0.15, max: 1.0, points: 12, label: "Excellent" },
          good: { min: 0.10, max: 0.15, points: 8, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 4, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        earningsGrowth: {
          excellent: { min: 0.20, max: 1.0, points: 10, label: "Excellent" },
          good: { min: 0.10, max: 0.20, points: 6, label: "Good" },
          fair: { min: 0.05, max: 0.10, points: 3, label: "Fair" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
        fcfGrowth: {
          excellent: { min: 0.15, max: 1.0, points: 8, label: "Excellent" },
          good: { min: 0.05, max: 0.15, points: 4, label: "Good" },
          poor: { min: 0, max: 0.05, points: 0, label: "Poor" },
        },
      },
    },
    "Financial Health": {
      weight: 0.20,
      maxPoints: 20,
      metrics: {
        debtToEquity: {
          excellent: { min: 0, max: 0.6, points: 10, label: "Excellent" },
          good: { min: 0.6, max: 1.0, points: 6, label: "Good" },
          fair: { min: 1.0, max: 1.5, points: 2, label: "Fair" },
          poor: { min: 1.5, max: 100, points: 0, label: "Poor" },
        },
        currentRatio: {
          excellent: { min: 1.5, max: 100, points: 10, label: "Excellent" },
          good: { min: 1.0, max: 1.5, points: 6, label: "Good" },
          poor: { min: 0, max: 1.0, points: 0, label: "Poor" },
        },
      },
    },
    "Valuation": {
      weight: 0.15,
      maxPoints: 15,
      metrics: {
        pegRatio: {
          excellent: { min: 0, max: 1.2, points: 10, label: "Excellent" },
          good: { min: 1.2, max: 1.8, points: 6, label: "Good" },
          fair: { min: 1.8, max: 2.5, points: 2, label: "Fair" },
          poor: { min: 2.5, max: 1000, points: 0, label: "Poor" },
        },
        peRatio: {
          excellent: { min: 0, max: 20, points: 5, label: "Excellent" },
          good: { min: 20, max: 30, points: 3, label: "Good" },
          poor: { min: 30, max: 1000, points: 0, label: "Poor" },
        },
      },
    },
  },
};

/**
 * All available persona scoring configurations
 */
export const PERSONA_SCORING_CONFIGS: Record<string, PersonaScoringCriteria> = {
  warren_buffett: WARREN_BUFFETT_SCORING,
  peter_lynch: PETER_LYNCH_SCORING,
  benjamin_graham: BENJAMIN_GRAHAM_SCORING,
  cathie_wood: CATHIE_WOOD_SCORING,
  ray_dalio: RAY_DALIO_SCORING,
  philip_fisher: PHILIP_FISHER_SCORING,
};
