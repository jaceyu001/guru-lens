/**
 * AI-Powered Analysis Engine
 * 
 * Uses the built-in Manus LLM to provide real stock analysis
 * from the perspective of legendary investors.
 */

import { invokeLLM } from "../_core/llm";
import { getPersonaPrompt } from "./personaPrompts";
import type { StockPrice, CompanyProfile, FinancialStatement, KeyRatios, FundamentalsFindings, ValuationFindings } from "../../shared/types";

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
  fundamentalsFindings?: FundamentalsFindings;
  valuationFindings?: ValuationFindings;
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
  baseConfidence: number; // 0-1, confidence before data quality adjustment
  summaryBullets: string[];
  criteria: AnalysisCriterion[];
  keyRisks: string[];
  whatWouldChangeMind: string[];
  dataQualityIssues?: string[]; // Metrics that were unavailable or anomalous
  missingMetricsImpact?: Array<{metric: string; affectedCriteria: string[]; description: string}>; // Maps missing metrics to criteria they impact
  dataUsed: {
    priceAsOf: Date;
    financialsAsOf: string;
    sources: string[];
  };
}

// Map missing metrics to persona-specific criteria they impact
function buildMissingMetricsImpact(personaId: string, missingMetrics: string[]): Array<{metric: string; affectedCriteria: string[]; description: string}> {
  const metricToCriteria: Record<string, Record<string, {criteria: string[]; description: string}>> = {
    'warren_buffett': {
      'ROIC': {
        criteria: ['Durable Competitive Advantage (Moat)', 'Management Quality & Capital Allocation'],
        description: 'ROIC is essential for evaluating moat strength and capital efficiency'
      },
      'Interest Coverage': {
        criteria: ['Financial Strength & Safety'],
        description: 'Interest Coverage is critical for assessing financial stability and debt safety'
      },
      'Debt/Equity': {
        criteria: ['Financial Strength & Safety'],
        description: 'Debt/Equity ratio impacts financial leverage assessment'
      }
    },
    'benjamin_graham': {
      'ROIC': {
        criteria: ['Return on Capital'],
        description: 'ROIC is needed to evaluate capital efficiency'
      },
      'Interest Coverage': {
        criteria: ['Financial Strength & Safety Margin'],
        description: 'Interest Coverage is crucial for safety margin calculation'
      },
      'Current Ratio': {
        criteria: ['Financial Strength & Safety Margin'],
        description: 'Current Ratio is needed to assess liquidity and financial strength'
      }
    },
    'ray_dalio': {
      'ROIC': {
        criteria: ['Return on Capital'],
        description: 'ROIC impacts return on capital assessment'
      },
      'Interest Coverage': {
        criteria: ['Balance Sheet Health'],
        description: 'Interest Coverage is important for debt sustainability analysis'
      }
    },
    'peter_lynch': {
      'ROIC': {
        criteria: ['Earnings Growth & PEG Ratio'],
        description: 'ROIC affects earnings quality assessment'
      }
    },
    'cathie_wood': {
      'ROIC': {
        criteria: ['Innovation & Disruption'],
        description: 'ROIC impacts capital efficiency in growth analysis'
      }
    },
    'philip_fisher': {
      'ROIC': {
        criteria: ['Long-term Growth Potential'],
        description: 'ROIC is important for assessing sustainable competitive advantages'
      }
    }
  };

  const personaMetrics = metricToCriteria[personaId] || {};
  return missingMetrics
    .filter(metric => personaMetrics[metric])
    .map(metric => ({
      metric,
      affectedCriteria: personaMetrics[metric]!.criteria,
      description: personaMetrics[metric]!.description
    }));
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

  // Build agent findings summary for enrichment
  let agentFindingsSummary = '';
  if (input.fundamentalsFindings) {
    const fund = input.fundamentalsFindings;
    agentFindingsSummary += `\n\nFUNDAMENTALS AGENT FINDINGS:\n`;
    
    // Add period information for growth metrics
    const growthPeriodInfo = fund.growth.comparisonType === 'TTM_VS_FY' 
      ? `(${fund.growth.currentPeriod} vs ${fund.growth.priorPeriod})`
      : fund.growth.comparisonType === 'FY_VS_FY'
      ? `(${fund.growth.currentPeriod} vs ${fund.growth.priorPeriod} - Q1 data only)`
      : '';
    
    agentFindingsSummary += `- Growth: ${fund.growth.assessment} ${growthPeriodInfo} (Revenue: ${fund.growth.revenueGrowth.toFixed(1)}%, Earnings: ${fund.growth.earningsGrowth.toFixed(1)}%, FCF: ${fund.growth.fcfGrowth.toFixed(1)}%)\n`;
    agentFindingsSummary += `- Profitability: ${fund.profitability.assessment} (Net Margin: ${fund.profitability.netMargin.toFixed(1)}%, Operating: ${fund.profitability.operatingMargin.toFixed(1)}%)\n`;
    const roeStr = fund.capitalEfficiency.roe !== null ? `${fund.capitalEfficiency.roe.toFixed(1)}%` : 'N/A';
    const roicStr = fund.capitalEfficiency.roic !== null ? `${fund.capitalEfficiency.roic.toFixed(1)}%` : 'N/A';
    agentFindingsSummary += `- Capital Efficiency: ${fund.capitalEfficiency.assessment} (ROE: ${roeStr}, ROIC: ${roicStr})\n`;
    agentFindingsSummary += `- Financial Health: ${fund.financialHealth.assessment} (D/E: ${fund.financialHealth.debtToEquity.toFixed(1)}%, Current Ratio: ${fund.financialHealth.currentRatio.toFixed(2)}x)\n`;
    agentFindingsSummary += `- Cash Flow: ${fund.cashFlow.assessment} (FCF Margin: ${fund.cashFlow.fcfMargin.toFixed(1)}%, Growth: ${fund.cashFlow.fcfGrowth.toFixed(1)}%)\n`;
    
    // Add data quality flags if present
    if (fund.growth.dataQualityFlags && Object.values(fund.growth.dataQualityFlags).some(v => v)) {
      agentFindingsSummary += `\nGrowth Data Quality Notes:\n`;
      if (fund.growth.dataQualityFlags.onlyQ1Available) {
        agentFindingsSummary += `- Only Q1 data available; using FY vs FY comparison for stability\n`;
      }
      if (fund.growth.dataQualityFlags.ttmNotAvailable) {
        agentFindingsSummary += `- TTM data not available; using FY vs FY comparison\n`;
      }
      if (fund.growth.dataQualityFlags.insufficientData) {
        agentFindingsSummary += `- Insufficient financial data for reliable growth calculation\n`;
      }
    }
  }
  if (input.valuationFindings) {
    const val = input.valuationFindings;
    agentFindingsSummary += `\nVALUATION AGENT FINDINGS:\n`;
    agentFindingsSummary += `- Current Price: $${val.currentPrice.toFixed(2)}\n`;
    agentFindingsSummary += `- Consensus Valuation: $${val.consensusValuation.low.toFixed(2)} - $${val.consensusValuation.high.toFixed(2)} (Midpoint: $${val.consensusValuation.midpoint.toFixed(2)})\n`;
    agentFindingsSummary += `- Assessment: ${val.overallAssessment.replace(/_/g, ' ')}\n`;
    agentFindingsSummary += `- Upside Potential: ${val.consensusUpside.toFixed(1)}%\n`;
    agentFindingsSummary += `- Margin of Safety: ${val.marginOfSafety.toFixed(1)}%\n`;
    agentFindingsSummary += `- Method Agreement: ${val.methodAgreement}\n`;
  }

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
    .replace('{pegRatio}', (() => {
      // PEG is undefined (0) for unprofitable or non-growing companies
      if (input.ratios.pegRatio === 0) {
        return 'N/A (Company is unprofitable or earnings not growing)';
      }
      return getSafeMetricValue(input.ratios.pegRatio.toFixed(2), input.dataQualityFlags?.peAnomalous, 'PEG Ratio');
    })())
    .replace('{pbRatio}', getSafeMetricValue(input.ratios.pbRatio.toFixed(2), input.dataQualityFlags?.pbAnomalous, 'P/B Ratio'))
    .replace('{roe}', getSafeMetricValue(input.ratios.roe.toFixed(1), input.dataQualityFlags?.roeNegative, 'ROE'))
    .replace('{roic}', getSafeMetricValue(input.ratios.roic.toFixed(1), input.dataQualityFlags?.roicZero, 'ROIC'))
    .replace('{netMargin}', input.ratios.netMargin.toFixed(1))
    .replace('{operatingMargin}', input.ratios.operatingMargin.toFixed(1))
    .replace('{debtToEquity}', getSafeMetricValue(input.ratios.debtToEquity.toFixed(2), input.dataQualityFlags?.debtToEquityAnomalous, 'Debt/Equity'))
    .replace('{currentRatio}', getSafeMetricValue(input.ratios.currentRatio.toFixed(2), input.dataQualityFlags?.currentRatioAnomalous, 'Current Ratio'))
    .replace('{interestCoverage}', getSafeMetricValue(input.ratios.interestCoverage.toFixed(1), input.dataQualityFlags?.interestCoverageZero, 'Interest Coverage'))
    .replace('{dividendYield}', input.ratios.dividendYield.toFixed(2))
    .replace('{financials}', financialSummary)
    .replace('{revenueGrowth}', (() => {
      const growth = input.fundamentalsFindings?.growth?.revenueGrowth?.toFixed(1) || 'N/A';
      const period = input.fundamentalsFindings?.growth?.comparisonType === 'TTM_VS_FY' ? ' (TTM vs FY)' : input.fundamentalsFindings?.growth?.comparisonType === 'FY_VS_FY' ? ' (FY vs FY)' : '';
      return growth === 'N/A' ? 'N/A' : `${growth}%${period}`;
    })()) // Use actual revenue growth from fundamentals with period info
    .replace('{rdIntensity}', 'N/A') // R&D intensity not available in current data set
    .replace('{freeCashFlow}', latestFinancials ? `$${(latestFinancials.freeCashFlow / 1e9).toFixed(2)}B` : 'N/A')
    .replace('{agentFindings}', agentFindingsSummary)
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

    // Calculate adjusted confidence based on missing metrics
    const baseConfidence = analysis.confidence;
    const confidencePenalty = anomalousMetrics.length * 0.1;
    const adjustedConfidence = Math.max(0.3, baseConfidence - confidencePenalty);
    
    // Build missing metrics impact mapping
    const missingMetricsImpact = buildMissingMetricsImpact(input.personaId, anomalousMetrics);
    
    // Add metadata
    return {
      ...analysis,
      baseConfidence,
      confidence: adjustedConfidence,
      dataQualityIssues: anomalousMetrics.length > 0 ? anomalousMetrics : undefined,
      missingMetricsImpact: missingMetricsImpact.length > 0 ? missingMetricsImpact : undefined,
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
      baseConfidence: 0.3,
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
        baseConfidence: 0.3,
        summaryBullets: ["Analysis failed - please try again"],
        criteria: personaPrompt ? Object.entries(personaPrompt.criteriaWeights).map(([name, weight]) => ({
          name,
          weight,
          status: "partial" as const,
          metricsUsed: [],
          explanation: "Analysis failed",
        })) : [],
        keyRisks: ["Analysis failed"],
        whatWouldChangeMind: ["Successful re-analysis"],
        missingMetricsImpact: undefined,
        dataUsed: {
          priceAsOf: input.price.timestamp,
          financialsAsOf: "Unknown",
          sources: ["Error"],
        },
      };
    }
  });
}
