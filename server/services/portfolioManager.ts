/**
 * Portfolio Manager Agent
 * 
 * Aggregates all 18 agents (12 investor personas + 4 technical + risk manager)
 * and generates final consensus recommendation using weighted voting
 */

import { invokeLLM } from "../_core/llm";
import type { AnalysisOutput } from "../../shared/types";
import type { TechnicalAgentOutput } from "./technicalAgents";
import type { RiskManagerOutput } from "./riskManager";

export interface AgentVote {
  agentName: string;
  agentType: "persona" | "technical" | "risk";
  recommendation: "BUY" | "SELL" | "HOLD" | "AVOID";
  confidence: number; // 0-100
  score: number; // 0-100
  weight: number; // Voting weight (0-1)
}

export interface ConsensusResult {
  finalRecommendation: "BUY" | "SELL" | "HOLD" | "AVOID";
  confidenceScore: number; // 0-100
  consensusStrength: number; // 0-100 (how much agreement)
  buyVotes: number;
  sellVotes: number;
  holdVotes: number;
  avoidVotes: number;
  weightedScore: number; // 0-100
  agentVotes: AgentVote[];
  reasoning: string;
  dissent: string[]; // Minority opinions
  keyInsights: string[];
  timestamp: Date;
}

/**
 * Convert recommendation string to numeric value for voting
 */
function recommendationToValue(rec: string): number {
  switch (rec) {
    case "BUY":
      return 1.0;
    case "HOLD":
      return 0.5;
    case "SELL":
      return 0.0;
    case "AVOID":
      return -1.0;
    default:
      return 0.5;
  }
}

/**
 * Convert numeric value back to recommendation
 */
function valueToRecommendation(value: number): "BUY" | "SELL" | "HOLD" | "AVOID" {
  if (value > 0.75) return "BUY";
  if (value > 0.25) return "HOLD";
  if (value > -0.25) return "SELL";
  return "AVOID";
}

/**
 * Calculate consensus from all agent votes
 */
export function calculateConsensus(votes: AgentVote[]): ConsensusResult {
  // Count votes
  const buyVotes = votes.filter((v) => v.recommendation === "BUY").length;
  const sellVotes = votes.filter((v) => v.recommendation === "SELL").length;
  const holdVotes = votes.filter((v) => v.recommendation === "HOLD").length;
  const avoidVotes = votes.filter((v) => v.recommendation === "AVOID").length;

  // Calculate weighted consensus
  let weightedSum = 0;
  let totalWeight = 0;

  votes.forEach((vote) => {
    const value = recommendationToValue(vote.recommendation);
    const weightedValue = value * vote.weight * (vote.confidence / 100);
    weightedSum += weightedValue;
    totalWeight += vote.weight;
  });

  const weightedScore = totalWeight > 0 ? ((weightedSum / totalWeight + 1) / 2) * 100 : 50;
  const finalRecommendation = valueToRecommendation(weightedSum / totalWeight);

  // Calculate consensus strength (0-100)
  // Perfect consensus = 100, split = 0
  const totalVotes = votes.length;
  const maxVotes = Math.max(buyVotes, sellVotes, holdVotes, avoidVotes);
  const consensusStrength = (maxVotes / totalVotes) * 100;

  // Calculate average confidence
  const confidenceScore = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

  // Identify dissent (minority opinions)
  const dissent: string[] = [];
  if (buyVotes > 0 && buyVotes < totalVotes / 3) {
    dissent.push(`${buyVotes} agent(s) recommend BUY (minority view)`);
  }
  if (sellVotes > 0 && sellVotes < totalVotes / 3) {
    dissent.push(`${sellVotes} agent(s) recommend SELL (minority view)`);
  }
  if (avoidVotes > 0 && avoidVotes < totalVotes / 3) {
    dissent.push(`${avoidVotes} agent(s) recommend AVOID (minority view)`);
  }

  return {
    finalRecommendation,
    confidenceScore: Math.round(confidenceScore),
    consensusStrength: Math.round(consensusStrength),
    buyVotes,
    sellVotes,
    holdVotes,
    avoidVotes,
    weightedScore: Math.round(weightedScore),
    agentVotes: votes,
    reasoning: `Consensus recommendation: ${finalRecommendation} (${Math.round(consensusStrength)}% agreement)`,
    dissent,
    keyInsights: [],
    timestamp: new Date(),
  };
}

/**
 * Portfolio Manager Agent
 * Synthesizes all agent recommendations into final decision
 */
export async function runPortfolioManager(
  ticker: string,
  personaAnalyses: AnalysisOutput[],
  technicalAgents: TechnicalAgentOutput[],
  riskManager: RiskManagerOutput
): Promise<ConsensusResult> {
  // Build agent votes array
  const agentVotes: AgentVote[] = [];

  // Add persona votes (weight: 0.08 each = 96% total for 12 personas)
  personaAnalyses.forEach((analysis) => {
    const recMap: Record<string, "BUY" | "SELL" | "HOLD" | "AVOID"> = {
      "Strong Fit": "BUY",
      Fit: "HOLD",
      Borderline: "HOLD",
      "Not a Fit": "SELL",
      "Insufficient Data": "HOLD",
    };

    agentVotes.push({
      agentName: analysis.personaName,
      agentType: "persona",
      recommendation: recMap[analysis.verdict] || "HOLD",
      confidence: analysis.confidence,
      score: analysis.score,
      weight: 0.08, // 8% each
    });
  });

  // Add technical agent votes (weight: 0.02 each = 8% total for 4 agents)
  technicalAgents.forEach((agent) => {
    agentVotes.push({
      agentName: agent.agentName,
      agentType: "technical",
      recommendation: agent.recommendation,
      confidence: agent.confidence,
      score: agent.score,
      weight: 0.02, // 2% each
    });
  });

  // Add risk manager vote (weight: 0.04 = 4%)
  agentVotes.push({
    agentName: riskManager.agentName,
    agentType: "risk",
    recommendation: riskManager.recommendation,
    confidence: riskManager.confidence,
    score: riskManager.score,
    weight: 0.04, // 4%
  });

  // Calculate consensus
  const consensus = calculateConsensus(agentVotes);

  // Get LLM synthesis
  const prompt = `You are a Portfolio Manager synthesizing recommendations from 18 agents analyzing ${ticker}.

Agent Votes:
- BUY: ${consensus.buyVotes}
- HOLD: ${consensus.holdVotes}
- SELL: ${consensus.sellVotes}
- AVOID: ${consensus.avoidVotes}
- Consensus Strength: ${consensus.consensusStrength}%
- Weighted Score: ${consensus.weightedScore}/100
- Risk Rating: ${riskManager.riskRating}
- Recommended Position Size: ${riskManager.positionSizing.recommendedPositionSize}%

Synthesize the analysis:
1. What is the consensus recommendation?
2. How strong is the agreement among agents?
3. What are the key insights from the analysis?
4. What are the main risks and opportunities?
5. What would change the recommendation?

Generate a JSON response with:
{
  "reasoning": "<comprehensive synthesis>",
  "keyInsights": ["<insight1>", "<insight2>", "<insight3>"],
  "mainRisks": ["<risk1>", "<risk2>"],
  "mainOpportunities": ["<opportunity1>", "<opportunity2>"],
  "whatWouldChangeRecommendation": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a portfolio manager. Synthesize recommendations from multiple agents into a coherent investment thesis. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "portfolio_synthesis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reasoning: { type: "string" },
              keyInsights: { type: "array", items: { type: "string" } },
              mainRisks: { type: "array", items: { type: "string" } },
              mainOpportunities: { type: "array", items: { type: "string" } },
              whatWouldChangeRecommendation: { type: "array", items: { type: "string" } },
            },
            required: [
              "reasoning",
              "keyInsights",
              "mainRisks",
              "mainOpportunities",
              "whatWouldChangeRecommendation",
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
    consensus.reasoning = parsed.reasoning;
    consensus.keyInsights = parsed.keyInsights;

    return consensus;
  } catch (error) {
    console.error("[Portfolio Manager] Error:", error);
    // Return consensus even if LLM fails
    return consensus;
  }
}

/**
 * Generate portfolio manager report
 */
export function generatePortfolioReport(consensus: ConsensusResult): string {
  const report = `
PORTFOLIO MANAGER CONSENSUS REPORT
==================================

Final Recommendation: ${consensus.finalRecommendation}
Confidence Score: ${consensus.confidenceScore}/100
Consensus Strength: ${consensus.consensusStrength}%
Weighted Score: ${consensus.weightedScore}/100

Agent Voting Breakdown:
- BUY: ${consensus.buyVotes}
- HOLD: ${consensus.holdVotes}
- SELL: ${consensus.sellVotes}
- AVOID: ${consensus.avoidVotes}

Key Insights:
${consensus.keyInsights.map((insight) => `- ${insight}`).join("\n")}

Dissenting Views:
${consensus.dissent.length > 0 ? consensus.dissent.map((d) => `- ${d}`).join("\n") : "- Consensus agreement"}

Reasoning:
${consensus.reasoning}

Generated: ${consensus.timestamp.toISOString()}
`;

  return report;
}

/**
 * Validate consensus recommendation against risk constraints
 */
export function validateRecommendation(
  recommendation: "BUY" | "SELL" | "HOLD" | "AVOID",
  riskRating: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
): "BUY" | "SELL" | "HOLD" | "AVOID" {
  // Downgrade recommendation if risk is too high
  if (riskRating === "CRITICAL") {
    return "AVOID";
  }

  if (riskRating === "HIGH" && recommendation === "BUY") {
    return "HOLD";
  }

  return recommendation;
}
