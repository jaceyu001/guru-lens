/**
 * Technical Agents Service
 * 
 * Implements 4 technical agents that complement investor personas:
 * - Valuation Agent: Intrinsic value calculation and valuation signals
 * - Sentiment Agent: Market sentiment analysis
 * - Fundamentals Agent: Financial statement analysis
 * - Technicals Agent: Technical indicators and price patterns
 */

import { invokeLLM } from "../_core/llm";
import type { FinancialData, CompanyProfile } from "../../shared/types";

export interface TechnicalAgentOutput {
  agentName: string;
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0-100
  score: number; // 0-100 (for consistency with personas)
  reasoning: string;
  keyMetrics: Record<string, number | string>;
  risks: string[];
  whatWouldChangeMind: string[];
  timestamp: Date;
}

/**
 * Valuation Agent
 * Calculates intrinsic value and generates valuation signals
 */
export async function runValuationAgent(
  ticker: string,
  financialData: FinancialData,
  currentPrice: number
): Promise<TechnicalAgentOutput> {
  const latestFinancial = financialData.financials?.[0];
  const pe = financialData.ratios?.pe || 0;
  const pb = financialData.ratios?.pb || 0;
  const ps = financialData.ratios?.ps || 0;

  const prompt = `You are a Valuation Agent analyzing ${ticker} for intrinsic value and valuation signals.

Financial Data:
- Current Price: $${currentPrice}
- P/E Ratio: ${pe || "N/A"}
- P/B Ratio: ${pb || "N/A"}
- P/S Ratio: ${ps || "N/A"}
- Revenue: $${latestFinancial?.revenue || "N/A"}B
- Net Income: $${latestFinancial?.netIncome || "N/A"}B
- Operating Margin: ${financialData.ratios?.operatingMargin || "N/A"}%
- ROE: ${financialData.ratios?.roe || "N/A"}%

Analyze the valuation using multiple approaches:
1. DCF Analysis: Estimate intrinsic value based on cash flows and growth
2. Comparable Analysis: Compare to peer multiples
3. Asset-Based: Consider book value and tangible assets
4. PEG Ratio: Evaluate growth-adjusted valuation

Generate a JSON response with:
{
  "agentName": "Valuation Agent",
  "recommendation": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "score": <0-100>,
  "reasoning": "<comprehensive reasoning>",
  "keyMetrics": {
    "peRatio": ${pe},
    "intrinsicValue": <calculated>,
    "upside": <percentage>
  },
  "risks": ["<risk1>", "<risk2>"],
  "whatWouldChangeMind": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a valuation expert. Analyze stocks using DCF, comparables, and asset-based approaches. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "valuation_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agentName: { type: "string" },
              recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
              confidence: { type: "number" },
              score: { type: "number" },
              reasoning: { type: "string" },
              keyMetrics: { type: "object" },
              risks: { type: "array", items: { type: "string" } },
              whatWouldChangeMind: { type: "array", items: { type: "string" } },
            },
            required: [
              "agentName",
              "recommendation",
              "confidence",
              "score",
              "reasoning",
              "keyMetrics",
              "risks",
              "whatWouldChangeMind",
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
      agentName: "Valuation Agent",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      score: parsed.score,
      reasoning: parsed.reasoning,
      keyMetrics: parsed.keyMetrics,
      risks: parsed.risks,
      whatWouldChangeMind: parsed.whatWouldChangeMind,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Valuation Agent] Error:", error);
    throw error;
  }
}

/**
 * Sentiment Agent
 * Analyzes market sentiment and social signals
 */
export async function runSentimentAgent(
  ticker: string,
  companyProfile: CompanyProfile | undefined
): Promise<TechnicalAgentOutput> {
  const prompt = `You are a Sentiment Agent analyzing market sentiment for ${ticker}${companyProfile ? ` (${companyProfile.companyName})` : ""}.

${
  companyProfile
    ? `Company Info:
- Sector: ${companyProfile.sector}
- Industry: ${companyProfile.industry}
- Market Cap: $${companyProfile.marketCap}B
- Description: ${companyProfile.description}`
    : "Limited company information available."
}

Analyze sentiment from multiple sources:
1. News Sentiment: Analyze recent news tone (positive/negative/neutral)
2. Social Media: Gauge retail investor interest and sentiment
3. Analyst Consensus: Consider analyst ratings and target prices
4. Insider Activity: Evaluate insider buying/selling patterns
5. Short Interest: Assess short positioning and potential squeeze

Generate a JSON response with:
{
  "agentName": "Sentiment Agent",
  "recommendation": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "score": <0-100>,
  "reasoning": "<comprehensive sentiment analysis>",
  "keyMetrics": {
    "sentimentScore": <-1 to 1>,
    "newsScore": <-1 to 1>,
    "socialScore": <-1 to 1>
  },
  "risks": ["<risk1>", "<risk2>"],
  "whatWouldChangeMind": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analyst. Analyze market sentiment from news, social media, and analyst opinions. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agentName: { type: "string" },
              recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
              confidence: { type: "number" },
              score: { type: "number" },
              reasoning: { type: "string" },
              keyMetrics: { type: "object" },
              risks: { type: "array", items: { type: "string" } },
              whatWouldChangeMind: { type: "array", items: { type: "string" } },
            },
            required: [
              "agentName",
              "recommendation",
              "confidence",
              "score",
              "reasoning",
              "keyMetrics",
              "risks",
              "whatWouldChangeMind",
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
      agentName: "Sentiment Agent",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      score: parsed.score,
      reasoning: parsed.reasoning,
      keyMetrics: parsed.keyMetrics,
      risks: parsed.risks,
      whatWouldChangeMind: parsed.whatWouldChangeMind,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Sentiment Agent] Error:", error);
    throw error;
  }
}

/**
 * Fundamentals Agent
 * Analyzes financial fundamentals and generates signals
 */
export async function runFundamentalsAgent(
  ticker: string,
  financialData: FinancialData
): Promise<TechnicalAgentOutput> {
  const latestFinancial = financialData.financials?.[0];

  const prompt = `You are a Fundamentals Agent analyzing financial fundamentals for ${ticker}.

Financial Data:
- Revenue: $${latestFinancial?.revenue || "N/A"}B
- Net Income: $${latestFinancial?.netIncome || "N/A"}B
- EPS: ${latestFinancial?.eps || "N/A"}
- Operating Margin: ${financialData.ratios?.operatingMargin || "N/A"}%
- Net Margin: ${financialData.ratios?.netMargin || "N/A"}%
- ROE: ${financialData.ratios?.roe || "N/A"}%
- ROIC: ${financialData.ratios?.roic || "N/A"}%
- Debt/Equity: ${financialData.ratios?.debtToEquity || "N/A"}
- Current Ratio: ${financialData.ratios?.currentRatio || "N/A"}

Analyze fundamentals:
1. Earnings Quality: Are earnings real and sustainable?
2. Revenue Growth: Is growth accelerating or decelerating?
3. Margin Trends: Are margins improving or deteriorating?
4. Cash Flow: Is cash flow supporting earnings?
5. Balance Sheet: Is the company financially healthy?

Generate a JSON response with:
{
  "agentName": "Fundamentals Agent",
  "recommendation": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "score": <0-100>,
  "reasoning": "<comprehensive fundamentals analysis>",
  "keyMetrics": {
    "revenue": ${latestFinancial?.revenue || "N/A"},
    "netIncome": ${latestFinancial?.netIncome || "N/A"},
    "operatingMargin": ${financialData.ratios?.operatingMargin || "N/A"},
    "roe": ${financialData.ratios?.roe || "N/A"}
  },
  "risks": ["<risk1>", "<risk2>"],
  "whatWouldChangeMind": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a fundamentals analyst. Analyze financial statements for earnings quality, growth sustainability, and balance sheet health. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "fundamentals_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agentName: { type: "string" },
              recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
              confidence: { type: "number" },
              score: { type: "number" },
              reasoning: { type: "string" },
              keyMetrics: { type: "object" },
              risks: { type: "array", items: { type: "string" } },
              whatWouldChangeMind: { type: "array", items: { type: "string" } },
            },
            required: [
              "agentName",
              "recommendation",
              "confidence",
              "score",
              "reasoning",
              "keyMetrics",
              "risks",
              "whatWouldChangeMind",
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
      agentName: "Fundamentals Agent",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      score: parsed.score,
      reasoning: parsed.reasoning,
      keyMetrics: parsed.keyMetrics,
      risks: parsed.risks,
      whatWouldChangeMind: parsed.whatWouldChangeMind,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Fundamentals Agent] Error:", error);
    throw error;
  }
}

/**
 * Technicals Agent
 * Analyzes price patterns and technical indicators
 */
export async function runTechnicalsAgent(
  ticker: string,
  currentPrice: number,
  priceHistory: Array<{ date: string; close: number }>
): Promise<TechnicalAgentOutput> {
  // Calculate simple technical indicators
  const prices = priceHistory.map((p) => p.close);
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
  const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);

  // RSI calculation (simplified)
  const changes = prices.slice(-14).map((p, i) => (i === 0 ? 0 : p - prices[i - 1]));
  const gains = changes.filter((c) => c > 0).reduce((a, b) => a + b, 0) / 14;
  const losses = Math.abs(changes.filter((c) => c < 0).reduce((a, b) => a + b, 0)) / 14;
  const rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);

  const trend = currentPrice > sma50 ? "uptrend" : "downtrend";
  const momentum = currentPrice > sma20 ? "bullish" : "bearish";

  const prompt = `You are a Technicals Agent analyzing price patterns and technical indicators for ${ticker}.

Technical Data:
- Current Price: $${currentPrice}
- 20-Day SMA: $${sma20.toFixed(2)}
- 50-Day SMA: $${sma50.toFixed(2)}
- RSI (14): ${rsi.toFixed(1)}
- Trend: ${trend}
- Momentum: ${momentum}
- 52-Week Range: $${(Math.min(...prices) * 0.95).toFixed(2)} - $${(Math.max(...prices) * 1.05).toFixed(2)}

Analyze technical indicators:
1. Trend Analysis: Is the stock in uptrend or downtrend?
2. Momentum: Is momentum bullish or bearish?
3. Support/Resistance: Identify key support and resistance levels
4. Volume: Assess volume trends (assume normal volume)
5. Chart Patterns: Look for bullish or bearish patterns

Generate a JSON response with:
{
  "agentName": "Technicals Agent",
  "recommendation": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "score": <0-100>,
  "reasoning": "<comprehensive technical analysis>",
  "keyMetrics": {
    "rsi": ${rsi.toFixed(1)},
    "trend": "${trend}",
    "momentum": "${momentum}",
    "sma20": ${sma20.toFixed(2)},
    "sma50": ${sma50.toFixed(2)}
  },
  "risks": ["<risk1>", "<risk2>"],
  "whatWouldChangeMind": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a technical analyst. Analyze price patterns, moving averages, RSI, and other technical indicators. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "technicals_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agentName: { type: "string" },
              recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
              confidence: { type: "number" },
              score: { type: "number" },
              reasoning: { type: "string" },
              keyMetrics: { type: "object" },
              risks: { type: "array", items: { type: "string" } },
              whatWouldChangeMind: { type: "array", items: { type: "string" } },
            },
            required: [
              "agentName",
              "recommendation",
              "confidence",
              "score",
              "reasoning",
              "keyMetrics",
              "risks",
              "whatWouldChangeMind",
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
      agentName: "Technicals Agent",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      score: parsed.score,
      reasoning: parsed.reasoning,
      keyMetrics: parsed.keyMetrics,
      risks: parsed.risks,
      whatWouldChangeMind: parsed.whatWouldChangeMind,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Technicals Agent] Error:", error);
    throw error;
  }
}

/**
 * Run all technical agents in parallel
 */
export async function runAllTechnicalAgents(
  ticker: string,
  financialData: FinancialData,
  companyProfile: CompanyProfile | undefined,
  currentPrice: number,
  priceHistory: Array<{ date: string; close: number }>
): Promise<TechnicalAgentOutput[]> {
  try {
    const results = await Promise.all([
      runValuationAgent(ticker, financialData, currentPrice),
      runSentimentAgent(ticker, companyProfile),
      runFundamentalsAgent(ticker, financialData),
      runTechnicalsAgent(ticker, currentPrice, priceHistory),
    ]);

    return results;
  } catch (error) {
    console.error("[Technical Agents] Error running all agents:", error);
    throw error;
  }
}
