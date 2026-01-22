import { invokeLLM } from "../_core/llm";

/**
 * LLM-Based Market Consensus Growth Rate Extraction
 * 
 * Uses LLM to search for and synthesize market consensus growth rates
 * from analyst estimates, company guidance, and industry trends
 */

export interface GrowthRateInfo {
  growthRate: number; // as percentage (e.g., 5 for 5%)
  confidence: "high" | "medium" | "low";
  sources: string[];
  reasoning: string;
  caveats?: string;
}

/**
 * Extract market consensus growth rate using LLM
 */
export async function extractMarketGrowthRate(
  ticker: string,
  companyName: string
): Promise<GrowthRateInfo> {
  try {
    const prompt = `You are a financial analyst tasked with finding the market consensus long-term earnings growth rate for a company.

Company: ${companyName} (Ticker: ${ticker})

Please research and provide the market consensus long-term earnings growth rate for this company. Consider:

1. **Analyst Consensus Estimates**: What do equity research analysts expect for long-term EPS growth?
2. **Company Management Guidance**: What growth targets has management provided?
3. **Industry Growth Trends**: What is the expected growth rate for the company's industry?
4. **Historical Growth Rates**: What has the company's historical growth rate been?
5. **Comparable Company Growth**: What growth rates do similar companies have?

Based on your analysis, provide:
- A single estimated long-term earnings growth rate (as a percentage, e.g., 5 for 5%)
- Your confidence level in this estimate (high/medium/low)
- Key sources and reasoning
- Any caveats or uncertainties

IMPORTANT: 
- The growth rate should be realistic and sustainable (typically 0-15% for mature companies)
- If you cannot find reliable data, default to 3%
- If the company is in distress or declining, the rate can be 0% or negative
- Always provide your best estimate based on available information

Format your response as valid JSON (no markdown, no code blocks):
{
  "growthRate": <number>,
  "confidence": "<high|medium|low>",
  "sources": [<list of sources as strings>],
  "reasoning": "<explanation of how you arrived at this rate>",
  "caveats": "<any limitations or uncertainties>"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a financial analyst expert at estimating company growth rates. Respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const content = response.choices[0]?.message?.content;
    let responseText = "";
    
    if (typeof content === "string") {
      responseText = content;
    } else if (Array.isArray(content)) {
      responseText = content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
    }
    
    // Try to parse JSON directly
    let growthData: GrowthRateInfo;
    try {
      growthData = JSON.parse(responseText);
    } catch {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        growthData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to default if parsing fails
        console.warn(`Failed to parse LLM response for ${ticker}, using default growth rate`);
        growthData = {
          growthRate: 3,
          confidence: "low",
          sources: ["default"],
          reasoning: "Could not extract growth rate from LLM response, using conservative default",
          caveats: "Default estimate - actual growth rate may differ significantly",
        };
      }
    }

    // Validate growth rate
    if (typeof growthData.growthRate !== "number") {
      growthData.growthRate = 3;
    }

    // Cap growth rate at 4% maximum (even if LLM suggests higher)
    // This prevents unrealistic valuations when growth rate is too close to WACC
    growthData.growthRate = Math.max(-20, Math.min(4, growthData.growthRate));

    // Ensure confidence is valid
    if (!["high", "medium", "low"].includes(growthData.confidence)) {
      growthData.confidence = "medium";
    }

    // Ensure sources is an array
    if (!Array.isArray(growthData.sources)) {
      growthData.sources = ["analyst consensus", "company guidance"];
    }

    // Ensure reasoning is a string
    if (typeof growthData.reasoning !== "string") {
      growthData.reasoning = "Based on market consensus and company fundamentals";
    }

    return growthData;
  } catch (error) {
    console.error(`Error extracting growth rate for ${ticker}:`, error);
    
    // Return default growth rate on error
    return {
      growthRate: 3,
      confidence: "low",
      sources: ["default"],
      reasoning: "Error during LLM extraction, using conservative default estimate",
      caveats: "LLM extraction failed - actual growth rate may differ",
    };
  }
}

/**
 * Validate and adjust growth rate for EPV formula
 * Ensures g < WACC (9%) and caps at 4% maximum
 */
export function validateGrowthRate(growthRate: number, wacc: number = 9): number {
  // Convert from percentage to decimal if needed
  const rateAsDecimal = growthRate > 1 ? growthRate / 100 : growthRate;
  const waccAsDecimal = wacc > 1 ? wacc / 100 : wacc;

  // Cap growth rate at 4% maximum
  let cappedRate = Math.min(growthRate, 4);

  // If growth rate >= WACC, cap at WACC - 1%
  const cappedRateAsDecimal = cappedRate > 1 ? cappedRate / 100 : cappedRate;
  if (cappedRateAsDecimal >= waccAsDecimal) {
    return (waccAsDecimal - 0.01) * 100;
  }

  // If growth rate is negative, keep it (company in decline)
  return cappedRate;
}

/**
 * Get confidence adjustment factor for valuation
 * Higher confidence = higher confidence score in valuation
 */
export function getConfidenceAdjustment(confidence: "high" | "medium" | "low"): number {
  switch (confidence) {
    case "high":
      return 0.1;
    case "medium":
      return 0;
    case "low":
      return -0.1;
    default:
      return 0;
  }
}
