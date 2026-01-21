# Fundamentals Agent Implementation Outline

## Overview
The Fundamentals Agent analyzes core financial metrics across 5 categories and returns narrative findings (not scores) that will be fed to persona analysis.

## Architecture

### Input
```typescript
interface FundamentalsInput {
  ticker: string;
  financialData: FinancialData;
  dataQualityFlags: DataQualityFlags;
}
```

### Output
```typescript
interface FundamentalsFindings {
  growth: {
    assessment: "STRONG" | "MODERATE" | "WEAK" | "UNCLEAR";
    revenueGrowth: number; // %
    earningsGrowth: number; // %
    fcfGrowth: number; // %
    trend: "ACCELERATING" | "STABLE" | "DECELERATING";
    narrative: string;
  };
  
  profitability: {
    assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
    netMargin: number; // %
    operatingMargin: number; // %
    grossMargin: number; // %
    trend: "IMPROVING" | "STABLE" | "DETERIORATING";
    narrative: string;
  };
  
  capitalEfficiency: {
    assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
    roe: number; // %
    roic: number; // %
    roa: number; // %
    narrative: string;
  };
  
  financialHealth: {
    assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR";
    debtToEquity: number; // %
    currentRatio: number;
    interestCoverage: number;
    narrative: string;
  };
  
  cashFlow: {
    assessment: "STRONG" | "HEALTHY" | "WEAK" | "NEGATIVE" | "UNCLEAR";
    fcfMargin: number; // %
    fcfGrowth: number; // %
    fcfTrendYears: number[];
    narrative: string;
  };
  
  summary: string; // 2-3 sentence overall assessment
  dataQualityWarnings: string[]; // List of issues affecting analysis
  recommendationsForPersonas: string[]; // What personas should focus on
}
```

## Implementation Steps

### 1. Create fundamentalsAgent.ts Service File
- Location: `/server/services/fundamentalsAgent.ts`
- Export function: `analyzeFundamentals(input: FundamentalsInput): FundamentalsFindings`

### 2. Implement 5 Analysis Categories

#### Growth Analysis
- Calculate YoY revenue growth rate
- Calculate YoY earnings growth rate
- Calculate YoY FCF growth rate
- Determine trend (accelerating/stable/decelerating)
- Assess against industry benchmarks
- Handle missing data gracefully

#### Profitability Analysis
- Extract net margin, operating margin, gross margin
- Compare to historical trends
- Compare to industry benchmarks
- Identify margin expansion/contraction
- Handle anomalous values (e.g., negative margins)

#### Capital Efficiency Analysis
- Use ROE, ROIC, ROA metrics
- Check for anomalies (flagged as zero)
- Compare to industry and historical
- Assess capital allocation effectiveness
- Flag if data is unavailable

#### Financial Health Analysis
- Analyze debt-to-equity ratio
- Check current ratio for liquidity
- Evaluate interest coverage
- Assess leverage sustainability
- Flag anomalous values

#### Cash Flow Analysis
- Calculate FCF margin (FCF / Revenue)
- Calculate FCF growth rate
- Analyze FCF trend over years
- Assess sustainability
- Compare to earnings quality

### 3. Data Quality Integration
- Check each metric for anomalies from dataQualityFlags
- For anomalous metrics: mark as "UNCLEAR" and explain why
- Add warnings to dataQualityWarnings array
- Provide recommendations for personas on how to interpret

### 4. Narrative Generation
- For each category, generate 1-2 sentence narrative
- Include specific metric values
- Include assessment level (STRONG/GOOD/FAIR/POOR/UNCLEAR)
- Include trend direction
- Reference data quality issues if relevant

### 5. Summary Generation
- Combine insights from all 5 categories
- Highlight key strengths and concerns
- Provide 2-3 sentence overall assessment
- Flag any critical data quality issues

### 6. Recommendations for Personas
- Suggest which metrics are most reliable
- Suggest which metrics to be cautious about
- Suggest focus areas for each persona type
- Example: "Valuation investors should focus on profitability and FCF. Growth investors should emphasize revenue growth trend."

## Key Design Decisions

### 1. Assessment Levels (Not Scores)
- Use qualitative assessments: STRONG, GOOD, FAIR, POOR, UNCLEAR
- Avoid numeric scores (0-100) to prevent false precision
- Allow for "UNCLEAR" when data is anomalous

### 2. Data Quality Handling
- If metric is anomalous: assessment = "UNCLEAR"
- Add explanation to narrative: "Data quality concern: [specific issue]"
- Add to dataQualityWarnings array
- Provide recommendation for personas

### 3. Benchmarking
- Compare to industry averages (S&P 500 for broad market)
- Compare to historical company trends (3-5 year average)
- Flag significant deviations
- Use as context for assessments

### 4. Narrative Style
- Professional but accessible
- Specific metric values included
- Trend direction emphasized
- Data quality concerns flagged
- Actionable insights provided

## Example Output: AAPL

```
Growth: MODERATE
  Revenue growing at 8% YoY, below tech industry average of 12%.
  Earnings growth of 12% outpacing revenue suggests margin expansion.
  FCF growth of 6% is moderate but sufficient.
  Trend: STABLE
  Narrative: "Apple demonstrates moderate growth with earnings outpacing revenue, suggesting operational leverage. Growth is below industry average but supported by strong profitability."

Profitability: EXCELLENT
  Net margin: 26.9% (well above industry average of 8%)
  Operating margin: 31.6% (excellent)
  Gross margin: 46.9% (strong)
  Trend: IMPROVING
  Narrative: "Apple exhibits exceptional profitability with industry-leading margins. All margin metrics are expanding YoY, demonstrating improving operational efficiency."

Capital Efficiency: UNCLEAR
  ROE: 171.4% (appears anomalous - flagged)
  ROIC: 0 (flagged as zero - data quality issue)
  ROA: Not available
  Narrative: "Capital efficiency metrics are unreliable due to data quality issues. ROE appears anomalously high and ROIC data is unavailable. Cannot reliably assess capital efficiency."

Financial Health: STABLE
  Debt-to-Equity: 152.4% (elevated but manageable)
  Current Ratio: 0.893 (normal for mature tech)
  Interest Coverage: 0 (flagged as zero - data quality issue)
  Narrative: "Apple maintains stable financial health with elevated but manageable leverage. Current ratio is normal for cash-generative tech company. Interest coverage data unavailable."

Cash Flow: STRONG
  FCF Margin: 18.5% (excellent)
  FCF Growth: 6% (moderate)
  Narrative: "Apple generates strong free cash flow with 18.5% FCF margin. FCF growth is moderate at 6% but sufficient to support dividends and buybacks."

Summary:
"Apple demonstrates excellent profitability with industry-leading margins and strong cash flow generation. Growth is moderate but offset by margin expansion. Financial health is stable despite elevated leverage. Capital efficiency metrics are unreliable due to data quality issues."

Data Quality Warnings:
- "ROE appears anomalously high (171%)"
- "ROIC data is zero (flagged as anomalous)"
- "Interest Coverage data is zero (flagged as anomalous)"

Recommendations for Personas:
- "Focus on profitability metrics (margins) and cash flow - these are reliable and strong"
- "Use caution when evaluating capital efficiency - key metrics are unavailable"
- "Leverage is elevated but manageable for a cash-generative business"
- "Growth investors should note moderate revenue growth but strong earnings growth"
- "Value investors should focus on FCF margin (18.5%) as a valuation anchor"
```

## Testing Strategy

1. **Unit Tests**: Test each analysis category independently
2. **Integration Tests**: Test full fundamentalsAgent with various stocks
3. **Data Quality Tests**: Test with anomalous data (BIDU, AAPL edge cases)
4. **Benchmark Tests**: Verify assessments align with industry standards
5. **Performance Tests**: Ensure analysis completes in <1 second

## Next Steps

1. Create fundamentalsAgent.ts file with interface definitions
2. Implement each of the 5 analysis categories
3. Add data quality integration
4. Add narrative generation
5. Create tRPC procedure
6. Write unit tests
7. Test with AAPL and BIDU
