/**
 * AI-Powered Analysis Engine
 * 
 * Uses the built-in Manus LLM to provide real stock analysis
 * from the perspective of legendary investors.
 */

import { invokeLLM } from "../_core/llm";
import { getPersonaPrompt } from "./personaPrompts";
import type { StockPrice, CompanyProfile, FinancialStatement, KeyRatios } from "../../shared/types";

export interface AnalysisInput {
  symbol: string;
  personaId: string;
  personaName: string;
  price: StockPrice;
  profile: CompanyProfile;
  financials: FinancialStatement[];
  ratios: KeyRatios;
  dataQualityFlags?: {
    debtToEquityAnomalous?: boolean;
    roicZero?: boolean;
    interestCoverageZero?: boolean;
    peNegative?: boolean;
    marketCapZero?: boolean;
    pbAnomalous?: boolean;
    peAnomalous?: boolean;
    roeNegative?: boolean;
    currentRatioAnomalous?: boolean;
  };
}

export interface AnalysisCriterion {
  name: string;
  weight: number;
  status: "pass" | "fail" | "partial";
  metricsUsed: string[];
  explanation: string;
}

export interface AnalysisOutput {
  score: number; // 0-100
  verdict: "strong_fit" | "moderate_fit" | "weak_fit" | "poor_fit" | "insufficient_data";
  confidence: number; // 0-1
  summaryBullets: string[];
  criteria: AnalysisCriterion[];
  keyRisks: string[];
  whatWouldChangeMind: string[];
  dataQualityIssues?: string[]; // Metrics that were unavailable or anomalous
  dataUsed: {
    priceAsOf: Date;
    financialsAsOf: string;
    sources: string[];
  };
}

export async function analyzeStock(input: AnalysisInput): Promise<AnalysisOutput> {
  const personaPrompt = getPersonaPrompt(input.personaId);
  
  if (!personaPrompt) {
    throw new Error(`Unknown persona: ${input.personaId}`);
  }

  // Prepare financial summary
  const latestFinancials = input.financials[0];
  const financialSummary = latestFinancials 
    ? `Period: ${latestFinancials.period}
Revenue: $${(latestFinancials.revenue / 1e9).toFixed(2)}B
Net Income: $${(latestFinancials.netIncome / 1e9).toFixed(2)}B
Operating Margin: ${((latestFinancials.operatingIncome / latestFinancials.revenue) * 100).toFixed(1)}%
EPS: $${latestFinancials.eps.toFixed(2)}
Free Cash Flow: $${(latestFinancials.freeCashFlow / 1e9).toFixed(2)}B`
    : "Financial data not available";

  // Build data quality warnings
  const dataQualityWarnings = [];
  if (input.dataQualityFlags?.debtToEquityAnomalous) {
    dataQualityWarnings.push(`WARNING: Debt/Equity ratio of ${input.ratios.debtToEquity.toFixed(2)} appears anomalously high. This may indicate data quality issues. Use caution when drawing conclusions.`);
  }
  if (input.dataQualityFlags?.roicZero) {
    dataQualityWarnings.push(`WARNING: ROIC is reported as 0. This may indicate missing data or unusual circumstances.`);
  }
  if (input.dataQualityFlags?.interestCoverageZero) {
    dataQualityWarnings.push(`WARNING: Interest Coverage is reported as 0. This may indicate the company has no debt or missing data.`);
  }
  if (input.dataQualityFlags?.peNegative) {
    dataQualityWarnings.push(`WARNING: P/E ratio is negative, indicating negative earnings or unusual circumstances.`);
  }
  if (input.dataQualityFlags?.marketCapZero) {
    dataQualityWarnings.push(`WARNING: Market Cap is reported as 0. This may indicate missing data or a delisted company.`);
  }
  if (input.dataQualityFlags?.pbAnomalous) {
    dataQualityWarnings.push(`WARNING: P/B ratio appears anomalous (>100 or <0). This may indicate data quality issues.`);
  }
  if (input.dataQualityFlags?.peAnomalous) {
    dataQualityWarnings.push(`WARNING: P/E ratio appears anomalously high (>200). This may indicate data quality issues.`);
  }
  if (input.dataQualityFlags?.roeNegative) {
    dataQualityWarnings.push(`WARNING: ROE is negative, indicating the company is not generating positive returns on equity.`);
  }
  if (input.dataQualityFlags?.currentRatioAnomalous) {
    dataQualityWarnings.push(`WARNING: Current Ratio appears anomalous (<0.5 or >50). This may indicate data quality issues.`);
  }
  
  // Track which metrics are anomalous
  const anomalousMetrics: string[] = [];
  
  // getSafeMetricValue function
  const getSafeMetricValue = (value: string, isAnomalous: boolean | undefined, metricName: string): string => {
    if (isAnomalous) {
      anomalousMetrics.push(metricName);
      return '[DATA UNAVAILABLE]';
    }
    return value;
  };

  // Fill in the analysis template
  const userPrompt = personaPrompt.analysisTemplate
    .replace('{symbol}', input.symbol)
    .replace('{companyName}', input.profile.companyName)
    .replace('{sector}', input.profile.sector)
    .replace('{industry}', input.profile.industry)
    .replace('{marketCap}', getSafeMetricValue(`$${(input.profile.marketCap / 1e9).toFixed(2)}B`, input.dataQualityFlags?.marketCapZero, 'Market Cap'))
    .replace('{description}', input.profile.description)
    .replace('{price}', `$${input.price.current.toFixed(2)}`)
    .replace('{peRatio}', getSafeMetricValue(input.ratios.peRatio.toFixed(1), input.dataQualityFlags?.peAnomalous || input.dataQualityFlags?.peNegative, 'P/E Ratio'))
    .replace('{pegRatio}', getSafeMetricValue(input.ratios.pegRatio.toFixed(2), input.dataQualityFlags?.peAnomalous, 'PEG Ratio'))
    .replace('{pbRatio}', getSafeMetricValue(input.ratios.pbRatio.toFixed(2), input.dataQualityFlags?.pbAnomalous, 'P/B Ratio'))
    .replace('{roe}', getSafeMetricValue(input.ratios.roe.toFixed(1), input.dataQualityFlags?.roeNegative, 'ROE'))
    .replace('{roic}', getSafeMetricValue(input.ratios.roic.toFixed(1), input.dataQualityFlags?.roicZero, 'ROIC'))
    .replace('{netMargin}', input.ratios.netMargin.toFixed(1))
    .replace('{operatingMargin}', input.ratios.operatingMargin.toFixed(1))
    .replace('{debtToEquity}', getSafeMetricValue(input.ratios.debtToEquity.toFixed(2), input.dataQualityFlags?.debtToEquityAnomalous, 'Debt/Equity'))
    .replace('{currentRatio}', getSafeMetricValue(input.ratios.currentRatio.toFixed(2), input.dataQualityFlags?.currentRatioAnomalous, 'Current Ratio'))
    .replace('{interestCoverage}', input.ratios.interestCoverage.toFixed(1))
    .replace('{dividendYield}', input.ratios.dividendYield.toFixed(2))
    .replace('{financials}', financialSummary)
    .replace('{revenueGrowth}', '15.2') // TODO: Calculate from financials
    .replace('{rdIntensity}', '8.5') // TODO: Get from data
    .replace('{freeCashFlow}', latestFinancials ? `$${(latestFinancials.freeCashFlow / 1e9).toFixed(2)}B` : 'N/A')
    .replace('{dataQualityNote}', '');

  // Build comprehensive data quality disclaimer
  let dataQualityNote = '';
  if (dataQualityWarnings.length > 0 || anomalousMetrics.length > 0) {
    dataQualityNote = '\n\nIMPORTANT: Analysis performed with incomplete data.\n';
    if (anomalousMetrics.length > 0) {
      dataQualityNote += `Unavailable metrics: ${anomalousMetrics.join(', ')}.\n`;
    }
    if (dataQualityWarnings.length > 0) {
      dataQualityNote += `\nWARNINGS:\n${dataQualityWarnings.join('\n\n')}`;
    }
  }
  const finalPrompt = userPrompt.replace('{dataQualityNote}', dataQualityNote);

  // Define the JSON schema for structured output
  const analysisSchema = {
    type: "object" as const,
    properties: {
      score: {
        type: "number" as const,
        description: "Overall score from 0-100 indicating how well this stock fits the persona's investment criteria",
      },
      verdict: {
        type: "string" as const,
        enum: ["strong_fit", "moderate_fit", "weak_fit", "poor_fit", "insufficient_data"],
        description: "Overall verdict on the investment opportunity",
      },
      confidence: {
        type: "number" as const,
        description: "Confidence level from 0-1 in this analysis",
      },
      summaryBullets: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "3-5 key bullet points summarizing the analysis",
      },
      criteria: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            weight: { type: "number" as const },
            status: { 
              type: "string" as const,
              enum: ["pass", "fail", "partial"],
            },
            metricsUsed: {
              type: "array" as const,
              items: { type: "string" as const },
            },
            explanation: { type: "string" as const },
          },
          required: ["name", "weight", "status", "metricsUsed", "explanation"],
        },
        description: "Detailed evaluation of each investment criterion",
      },
      keyRisks: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "3-5 key risks or concerns about this investment",
      },
      whatWouldChangeMind: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "2-4 specific things that would change the verdict (make it better or worse)",
      },
    },
    required: ["score", "verdict", "confidence", "summaryBullets", "criteria", "keyRisks", "whatWouldChangeMind"],
    additionalProperties: false,
  };

  try {
    // Call the LLM with structured output
    const response = await invokeLLM({
      messages: [
        { role: "system", content: personaPrompt.systemPrompt },
        { role: "user", content: finalPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "stock_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Ensure content is a string before parsing
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const analysis = JSON.parse(contentStr);

    // Add metadata
    return {
      ...analysis,
      dataQualityIssues: anomalousMetrics.length > 0 ? anomalousMetrics : undefined,
      dataUsed: {
        priceAsOf: input.price.timestamp,
        financialsAsOf: latestFinancials?.period || "Unknown",
        sources: ["yfinance", "AI Analysis Engine"],
      },
    };
  } catch (error) {
    console.error(`[AI Analysis] Error analyzing ${input.symbol} with ${input.personaId}:`, error);
    
    // Return a fallback analysis if LLM fails
    return {
      score: 50,
      verdict: "insufficient_data",
      confidence: 0.3,
      summaryBullets: [
        "Analysis could not be completed due to technical issues",
        "Please try again later or contact support",
      ],
      criteria: Object.entries(personaPrompt.criteriaWeights).map(([name, weight]) => ({
        name,
        weight,
        status: "partial" as const,
        metricsUsed: [],
        explanation: "Unable to evaluate due to analysis error",
      })),
      keyRisks: ["Analysis incomplete - results may not be reliable"],
      whatWouldChangeMind: ["Successful re-analysis with complete data"],
      dataUsed: {
        priceAsOf: input.price.timestamp,
        financialsAsOf: latestFinancials?.period || "Unknown",
        sources: ["Error occurred during analysis"],
      },
    };
  }
}

export async function analyzeBatch(inputs: AnalysisInput[]): Promise<AnalysisOutput[]> {
  // Run analyses in parallel for better performance
  const results = await Promise.allSettled(
    inputs.map(input => analyzeStock(input))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(`[AI Analysis] Batch analysis failed for ${inputs[index]?.symbol}:`, result.reason);
      // Return fallback for failed analysis
      const input = inputs[index]!;
      const personaPrompt = getPersonaPrompt(input.personaId);
      return {
        score: 50,
        verdict: "insufficient_data" as const,
        confidence: 0.3,
        summaryBullets: ["Analysis failed - please try again"],
        criteria: personaPrompt ? Object.entries(personaPrompt.criteriaWeights).map(([name, weight]) => ({
          name,
          weight,
          status: "partial" as const,
          metricsUsed: [],
          explanation: "Analysis error",
        })) : [],
        keyRisks: ["Analysis incomplete"],
        whatWouldChangeMind: ["Successful re-analysis"],
        dataUsed: {
          priceAsOf: input.price.timestamp,
          financialsAsOf: "Unknown",
          sources: ["Error"],
        },
      };
    }
  });
}
