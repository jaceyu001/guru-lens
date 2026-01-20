/**
 * Risk Manager Agent
 * 
 * Calculates position sizing, volatility, beta, VaR, and portfolio-level risk constraints
 * Follows ai-hedge-fund's risk management framework
 */

import { invokeLLM } from "../_core/llm";
import type { FinancialData } from "../../shared/types";

export interface RiskMetrics {
  volatility: number; // Standard deviation of returns
  beta: number; // Market sensitivity
  sharpeRatio: number; // Risk-adjusted returns
  maxDrawdown: number; // Worst peak-to-trough decline
  var95: number; // Value at Risk at 95% confidence
  cvar95: number; // Conditional Value at Risk (expected loss beyond VaR)
}

export interface PositionSizing {
  recommendedPositionSize: number; // % of portfolio
  maxPositionSize: number; // Maximum allowed
  minPositionSize: number; // Minimum for meaningful position
  stopLossLevel: number; // Stop loss price
  takeProfitLevel: number; // Take profit price
  riskRewardRatio: number; // Upside/downside ratio
}

export interface RiskManagerOutput {
  agentName: string;
  recommendation: "BUY" | "SELL" | "HOLD" | "AVOID";
  confidence: number; // 0-100
  score: number; // 0-100
  riskRating: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskMetrics: RiskMetrics;
  positionSizing: PositionSizing;
  reasoning: string;
  keyRisks: string[];
  hedgingStrategies: string[];
  portfolioConstraints: string[];
  timestamp: Date;
}

/**
 * Calculate volatility from price history
 */
function calculateVolatility(priceHistory: Array<{ date: string; close: number }>): number {
  if (priceHistory.length < 2) return 0;

  const prices = priceHistory.map((p) => p.close);
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;

  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}

/**
 * Calculate beta (market sensitivity)
 * Simplified: assumes market correlation of 0.7 for typical stocks
 */
function calculateBeta(volatility: number, marketVolatility: number = 0.15): number {
  const marketCorrelation = 0.7;
  return (volatility / marketVolatility) * marketCorrelation;
}

/**
 * Calculate Sharpe Ratio
 */
function calculateSharpeRatio(
  expectedReturn: number,
  riskFreeRate: number = 0.04,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (expectedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Value at Risk (VaR) at 95% confidence
 */
function calculateVaR95(expectedReturn: number, volatility: number): number {
  const zScore = 1.645; // 95% confidence level
  return expectedReturn - zScore * volatility;
}

/**
 * Calculate Conditional Value at Risk (CVaR)
 */
function calculateCVaR95(expectedReturn: number, volatility: number): number {
  const zScore = 1.645;
  const pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * zScore * zScore);
  return expectedReturn - (volatility * zScore * pdf) / 0.05;
}

/**
 * Risk Manager Agent
 * Assesses risk and determines position sizing
 */
export async function runRiskManager(
  ticker: string,
  currentPrice: number,
  financialData: FinancialData,
  priceHistory: Array<{ date: string; close: number }>,
  personaScores: number[] // Scores from all personas (0-100)
): Promise<RiskManagerOutput> {
  // Calculate technical risk metrics
  const volatility = calculateVolatility(priceHistory);
  const beta = calculateBeta(volatility);

  // Estimate expected return from persona scores (average)
  const avgPersonaScore = personaScores.reduce((a, b) => a + b, 0) / personaScores.length;
  const expectedReturn = (avgPersonaScore / 100) * 0.20; // Scale to 20% max expected return

  const sharpeRatio = calculateSharpeRatio(expectedReturn, 0.04, volatility);
  const maxDrawdown = volatility * 2; // Simplified estimate
  const var95 = calculateVaR95(expectedReturn, volatility);
  const cvar95 = calculateCVaR95(expectedReturn, volatility);

  // Determine risk rating
  let riskRating: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  if (volatility > 0.5) {
    riskRating = "CRITICAL";
  } else if (volatility > 0.35) {
    riskRating = "HIGH";
  } else if (volatility > 0.2) {
    riskRating = "MEDIUM";
  } else {
    riskRating = "LOW";
  }

  // Calculate position sizing
  const basePositionSize = Math.max(1, Math.min(5, 100 / volatility / 100)); // Risk parity approach
  const recommendedPositionSize = Math.min(basePositionSize, avgPersonaScore / 100 * 5); // Scale by persona score
  const maxPositionSize = Math.min(10, recommendedPositionSize * 2);
  const minPositionSize = Math.max(0.5, recommendedPositionSize * 0.5);

  // Calculate stop loss and take profit
  const atr = volatility * currentPrice; // Simplified ATR
  const stopLossLevel = currentPrice - atr * 2;
  const takeProfitLevel = currentPrice + atr * 3;
  const riskRewardRatio = (takeProfitLevel - currentPrice) / (currentPrice - stopLossLevel);

  // Prepare prompt for LLM
  const prompt = `You are a Risk Manager analyzing ${ticker} for position sizing and risk management.

Risk Metrics:
- Volatility (Annualized): ${(volatility * 100).toFixed(2)}%
- Beta: ${beta.toFixed(2)}
- Sharpe Ratio: ${sharpeRatio.toFixed(2)}
- Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%
- VaR (95%): ${(var95 * 100).toFixed(2)}%
- CVaR (95%): ${(cvar95 * 100).toFixed(2)}%
- Current Price: $${currentPrice}
- Stop Loss: $${stopLossLevel.toFixed(2)}
- Take Profit: $${takeProfitLevel.toFixed(2)}
- Risk/Reward Ratio: ${riskRewardRatio.toFixed(2)}
- Average Persona Score: ${avgPersonaScore.toFixed(0)}/100

Assess the risk profile and determine position sizing:
1. Volatility Assessment: Is volatility acceptable for the expected return?
2. Drawdown Risk: How much capital could be lost in a worst-case scenario?
3. Position Sizing: What % of portfolio should be allocated?
4. Stop Loss: Where should the stop loss be placed?
5. Hedging: What hedging strategies should be considered?

Generate a JSON response with:
{
  "agentName": "Risk Manager",
  "recommendation": "BUY|SELL|HOLD|AVOID",
  "confidence": <0-100>,
  "score": <0-100>,
  "riskRating": "LOW|MEDIUM|HIGH|CRITICAL",
  "reasoning": "<comprehensive risk analysis>",
  "riskMetrics": {
    "volatility": ${(volatility * 100).toFixed(2)},
    "beta": ${beta.toFixed(2)},
    "sharpeRatio": ${sharpeRatio.toFixed(2)},
    "maxDrawdown": ${(maxDrawdown * 100).toFixed(2)},
    "var95": ${(var95 * 100).toFixed(2)},
    "cvar95": ${(cvar95 * 100).toFixed(2)}
  },
  "positionSizing": {
    "recommendedPositionSize": ${recommendedPositionSize.toFixed(2)},
    "maxPositionSize": ${maxPositionSize.toFixed(2)},
    "minPositionSize": ${minPositionSize.toFixed(2)},
    "stopLossLevel": ${stopLossLevel.toFixed(2)},
    "takeProfitLevel": ${takeProfitLevel.toFixed(2)},
    "riskRewardRatio": ${riskRewardRatio.toFixed(2)}
  },
  "keyRisks": ["<risk1>", "<risk2>", "<risk3>"],
  "hedgingStrategies": ["<strategy1>", "<strategy2>"],
  "portfolioConstraints": ["<constraint1>", "<constraint2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a risk manager. Assess portfolio risk, calculate position sizing, and recommend hedging strategies. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "risk_management",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agentName: { type: "string" },
              recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD", "AVOID"] },
              confidence: { type: "number" },
              score: { type: "number" },
              riskRating: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              reasoning: { type: "string" },
              riskMetrics: { type: "object" },
              positionSizing: { type: "object" },
              keyRisks: { type: "array", items: { type: "string" } },
              hedgingStrategies: { type: "array", items: { type: "string" } },
              portfolioConstraints: { type: "array", items: { type: "string" } },
            },
            required: [
              "agentName",
              "recommendation",
              "confidence",
              "score",
              "riskRating",
              "reasoning",
              "riskMetrics",
              "positionSizing",
              "keyRisks",
              "hedgingStrategies",
              "portfolioConstraints",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Invalid LLM response");
    }

    const parsed = JSON.parse(content);
    return {
      agentName: "Risk Manager",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      score: parsed.score,
      riskRating: parsed.riskRating,
      riskMetrics: parsed.riskMetrics,
      positionSizing: parsed.positionSizing,
      reasoning: parsed.reasoning,
      keyRisks: parsed.keyRisks,
      hedgingStrategies: parsed.hedgingStrategies,
      portfolioConstraints: parsed.portfolioConstraints,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Risk Manager] Error:", error);
    throw error;
  }
}

/**
 * Validate position sizing against portfolio constraints
 */
export function validatePositionSize(
  recommendedSize: number,
  maxPortfolioExposure: number = 0.05, // Max 5% per position
  minPositionSize: number = 0.01 // Min 1% per position
): number {
  return Math.max(minPositionSize, Math.min(recommendedSize, maxPortfolioExposure));
}

/**
 * Calculate portfolio-level risk metrics
 */
export function calculatePortfolioRisk(
  positions: Array<{
    ticker: string;
    size: number; // % of portfolio
    volatility: number;
    beta: number;
  }>
): {
  portfolioVolatility: number;
  portfolioBeta: number;
  diversificationRatio: number;
} {
  // Weighted volatility
  const portfolioVolatility = positions.reduce((sum, p) => sum + p.size * p.volatility, 0);

  // Weighted beta
  const portfolioBeta = positions.reduce((sum, p) => sum + p.size * p.beta, 0);

  // Diversification ratio: average volatility / portfolio volatility
  const avgVolatility = positions.reduce((sum, p) => sum + p.volatility, 0) / positions.length;
  const diversificationRatio = avgVolatility / (portfolioVolatility || 1);

  return {
    portfolioVolatility,
    portfolioBeta,
    diversificationRatio,
  };
}
