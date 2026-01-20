/**
 * Trading Signal Generator
 * 
 * Generates specific trading signals with entry/exit prices, position sizing,
 * and risk management parameters based on consensus recommendation
 */

import type { ConsensusResult } from "./portfolioManager";
import type { RiskManagerOutput } from "./riskManager";

export interface TradingSignal {
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD" | "AVOID";
  signalStrength: number; // 0-100
  confidence: number; // 0-100
  entryPrice: number;
  exitPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSize: number; // % of portfolio
  riskRewardRatio: number;
  expectedReturn: number; // %
  maxRisk: number; // %
  timeframe: "short" | "medium" | "long"; // Days
  reasoning: string;
  actionItems: string[];
  timestamp: Date;
}

/**
 * Generate trading signal from consensus and risk management
 */
export function generateTradingSignal(
  ticker: string,
  currentPrice: number,
  consensus: ConsensusResult,
  riskManager: RiskManagerOutput
): TradingSignal {
  // Determine signal from consensus recommendation
  const signal = consensus.finalRecommendation;

  // Calculate signal strength from weighted score and consensus strength
  const signalStrength = (consensus.weightedScore + consensus.consensusStrength) / 2;

  // Entry price based on signal
  let entryPrice = currentPrice;
  switch (signal) {
    case "BUY":
      // For BUY, enter at current price or slight pullback
      entryPrice = currentPrice * 0.98; // 2% pullback
      break;
    case "SELL":
      // For SELL, enter at current price or slight bounce
      entryPrice = currentPrice * 1.02; // 2% bounce
      break;
    case "HOLD":
      entryPrice = currentPrice;
      break;
    case "AVOID":
      entryPrice = currentPrice;
      break;
  }

  // Exit price based on risk manager's take profit
  const exitPrice = riskManager.positionSizing.takeProfitLevel;

  // Stop loss from risk manager
  const stopLossPrice = riskManager.positionSizing.stopLossLevel;

  // Position size from risk manager
  const positionSize = riskManager.positionSizing.recommendedPositionSize;

  // Calculate risk/reward ratio
  const riskRewardRatio = riskManager.positionSizing.riskRewardRatio;

  // Calculate expected return
  const expectedReturn = ((exitPrice - entryPrice) / entryPrice) * 100;

  // Calculate max risk
  const maxRisk = ((entryPrice - stopLossPrice) / entryPrice) * 100;

  // Determine timeframe based on signal strength
  let timeframe: "short" | "medium" | "long";
  if (signalStrength > 75) {
    timeframe = "long"; // Strong signal = longer timeframe
  } else if (signalStrength > 50) {
    timeframe = "medium";
  } else {
    timeframe = "short";
  }

  // Generate action items
  const actionItems: string[] = [];
  switch (signal) {
    case "BUY":
      actionItems.push(`Enter long position at $${entryPrice.toFixed(2)}`);
      actionItems.push(`Set stop loss at $${stopLossPrice.toFixed(2)}`);
      actionItems.push(`Set take profit at $${exitPrice.toFixed(2)}`);
      actionItems.push(`Position size: ${positionSize.toFixed(2)}% of portfolio`);
      if (riskManager.hedgingStrategies.length > 0) {
        actionItems.push(`Consider hedging: ${riskManager.hedgingStrategies[0]}`);
      }
      break;
    case "SELL":
      actionItems.push(`Exit long position at $${entryPrice.toFixed(2)}`);
      actionItems.push(`Or enter short position with stop at $${exitPrice.toFixed(2)}`);
      actionItems.push(`Monitor for reversal signals`);
      break;
    case "HOLD":
      actionItems.push(`Maintain current position`);
      actionItems.push(`Monitor for signal changes`);
      actionItems.push(`Review if risk rating changes`);
      break;
    case "AVOID":
      actionItems.push(`Do not enter new positions`);
      actionItems.push(`Consider exiting existing positions`);
      actionItems.push(`Risk rating: ${riskManager.riskRating}`);
      break;
  }

  const reasoning = `
Trading Signal: ${signal}
- Consensus Recommendation: ${consensus.finalRecommendation} (${consensus.consensusStrength}% agreement)
- Weighted Score: ${consensus.weightedScore}/100
- Risk Rating: ${riskManager.riskRating}
- Expected Return: ${expectedReturn.toFixed(2)}%
- Maximum Risk: ${maxRisk.toFixed(2)}%
- Risk/Reward Ratio: ${riskRewardRatio.toFixed(2)}x
- Timeframe: ${timeframe}
`;

  return {
    ticker,
    signal,
    signalStrength: Math.round(signalStrength),
    confidence: consensus.confidenceScore,
    entryPrice,
    exitPrice,
    stopLossPrice,
    takeProfitPrice: exitPrice,
    positionSize,
    riskRewardRatio,
    expectedReturn,
    maxRisk,
    timeframe,
    reasoning: reasoning.trim(),
    actionItems,
    timestamp: new Date(),
  };
}

/**
 * Validate trading signal against market conditions
 */
export function validateSignal(
  signal: TradingSignal,
  marketVolatility: number,
  marketTrend: "up" | "down" | "sideways"
): TradingSignal {
  // Adjust signal strength based on market conditions
  let adjustedSignal = { ...signal };

  // In high volatility, reduce position size
  if (marketVolatility > 0.3) {
    adjustedSignal.positionSize *= 0.7;
  }

  // In downtrend, reduce BUY signals
  if (marketTrend === "down" && signal.signal === "BUY") {
    adjustedSignal.signalStrength *= 0.8;
  }

  // In uptrend, reduce SELL signals
  if (marketTrend === "up" && signal.signal === "SELL") {
    adjustedSignal.signalStrength *= 0.8;
  }

  return adjustedSignal;
}

/**
 * Generate signal summary for display
 */
export function generateSignalSummary(signal: TradingSignal): string {
  const summary = `
${signal.ticker} Trading Signal
Signal: ${signal.signal} (Strength: ${signal.signalStrength}/100)
Entry: $${signal.entryPrice.toFixed(2)} | Exit: $${signal.exitPrice.toFixed(2)}
Stop Loss: $${signal.stopLossPrice.toFixed(2)}
Position Size: ${signal.positionSize.toFixed(2)}%
Expected Return: ${signal.expectedReturn.toFixed(2)}% | Max Risk: ${signal.maxRisk.toFixed(2)}%
Risk/Reward: ${signal.riskRewardRatio.toFixed(2)}x | Timeframe: ${signal.timeframe}

Action Items:
${signal.actionItems.map((item) => `• ${item}`).join("\n")}
`;

  return summary;
}

/**
 * Calculate portfolio-level trading signals
 */
export function calculatePortfolioSignals(
  signals: TradingSignal[]
): {
  totalBuySignals: number;
  totalSellSignals: number;
  totalHoldSignals: number;
  totalAvoidSignals: number;
  avgSignalStrength: number;
  portfolioExposure: number; // % of portfolio deployed
  portfolioRisk: number; // % of portfolio at risk
} {
  const buySignals = signals.filter((s) => s.signal === "BUY").length;
  const sellSignals = signals.filter((s) => s.signal === "SELL").length;
  const holdSignals = signals.filter((s) => s.signal === "HOLD").length;
  const avoidSignals = signals.filter((s) => s.signal === "AVOID").length;

  const avgSignalStrength =
    signals.reduce((sum, s) => sum + s.signalStrength, 0) / signals.length;

  const portfolioExposure = signals.reduce((sum, s) => sum + s.positionSize, 0);

  const portfolioRisk = signals.reduce((sum, s) => {
    if (s.signal === "BUY" || s.signal === "SELL") {
      return sum + s.positionSize * (s.maxRisk / 100);
    }
    return sum;
  }, 0);

  return {
    totalBuySignals: buySignals,
    totalSellSignals: sellSignals,
    totalHoldSignals: holdSignals,
    totalAvoidSignals: avoidSignals,
    avgSignalStrength: Math.round(avgSignalStrength),
    portfolioExposure: Math.round(portfolioExposure * 100) / 100,
    portfolioRisk: Math.round(portfolioRisk * 100) / 100,
  };
}
