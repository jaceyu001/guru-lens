# Valuation Agent Implementation Outline

## Overview
The Valuation Agent calculates intrinsic value using 4 independent methods and returns narrative findings (not scores) showing valuation assessment, upside/downside, and method agreement.

## Architecture

### Input
```typescript
interface ValuationInput {
  ticker: string;
  currentPrice: number;
  financialData: FinancialData;
  dataQualityFlags: DataQualityFlags;
}
```

### Output
```typescript
interface ValuationMethod {
  name: "DCF" | "Comparable" | "DDM" | "AssetBased";
  intrinsicValue: number;
  upside: number; // %
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-1
  narrative: string;
  assumptions: Record<string, string | number>;
  limitations: string[];
}

interface ValuationFindings {
  currentPrice: number;
  methods: ValuationMethod[];
  consensusValuation: {
    low: number;
    high: number;
    midpoint: number;
  };
  consensusUpside: number; // %
  marginOfSafety: number; // %
  methodAgreement: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT";
  overallAssessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  summary: string;
  dataQualityWarnings: string[];
  recommendationsForPersonas: string[];
}
```

## Implementation Steps

### 1. DCF (Discounted Cash Flow) Method

**Concept:** Calculate present value of future free cash flows

**Steps:**
1. Get historical FCF from financials
2. Calculate FCF growth rate (3-year average)
3. Project FCF for next 5 years using growth rate
4. Calculate terminal value (perpetuity growth method)
5. Calculate WACC (Weighted Average Cost of Capital)
   - Risk-free rate: 4.5% (current 10-year Treasury)
   - Market risk premium: 6%
   - Beta: estimate from industry or use 1.0
   - Cost of equity = Risk-free rate + Beta × Market risk premium
   - WACC = (E/V × Cost of equity) + (D/V × Cost of debt × (1 - Tax rate))
6. Discount future cash flows to present value
7. Calculate intrinsic value = PV(FCF) + PV(Terminal Value)

**Assumptions to document:**
- FCF growth rate (historical average)
- Terminal growth rate (2-3%)
- WACC calculation components
- Projection period (5 years)

**Limitations to flag:**
- Sensitive to growth rate assumptions
- Sensitive to WACC assumptions
- Requires reliable FCF data
- Terminal value represents 70-80% of value

**Confidence calculation:**
- High if: FCF positive and growing, data quality good
- Medium if: FCF stable but flat, some data concerns
- Low if: FCF negative, volatile, or data anomalies

### 2. Comparable Company Analysis

**Concept:** Use industry multiples to value the company

**Methods:**
1. **P/E Multiple Method:**
   - Get company's earnings (EPS × shares outstanding)
   - Get industry average P/E ratio (S&P 500 average ~20x)
   - Intrinsic value = Earnings × Industry P/E

2. **P/B Multiple Method:**
   - Get book value (shareholders' equity)
   - Get industry average P/B ratio (S&P 500 average ~3.0x)
   - Intrinsic value = Book Value × Industry P/B

3. **P/S Multiple Method:**
   - Get revenue
   - Get industry average P/S ratio (S&P 500 average ~2.0x)
   - Intrinsic value = Revenue × Industry P/S

4. **EV/EBITDA Multiple Method:**
   - Get EBITDA
   - Get industry average EV/EBITDA (S&P 500 average ~12x)
   - Enterprise Value = EBITDA × Industry EV/EBITDA
   - Equity Value = EV - Net Debt

**Assumptions to document:**
- Industry benchmarks used
- Adjustment factors (if company is better/worse than average)
- Peer group selection

**Limitations to flag:**
- Assumes company is similar to industry average
- Market-driven multiples can be irrational
- Different methods may give different results
- Doesn't account for company-specific factors

**Confidence calculation:**
- High if: Multiple methods converge, data quality good
- Medium if: Methods diverge but within 20%, some data concerns
- Low if: Methods diverge >20%, data anomalies

### 3. Dividend Discount Model (DDM)

**Concept:** Value company based on present value of future dividends

**Formula:**
- Intrinsic Value = D1 / (r - g)
- Where: D1 = Next dividend, r = Required return, g = Dividend growth rate

**Steps:**
1. Check if company pays dividends (if not, mark as "UNABLE_TO_VALUE")
2. Get current dividend yield
3. Calculate dividend growth rate (3-year average)
4. Estimate required return (cost of equity from WACC calculation)
5. Calculate intrinsic value using Gordon Growth Model
6. If dividend growth expected to change, use multi-stage DDM

**Assumptions to document:**
- Dividend yield
- Dividend growth rate
- Required return
- Assumption of perpetual dividend payments

**Limitations to flag:**
- Only applicable to dividend-paying companies
- Sensitive to growth rate assumptions
- Assumes dividends represent company value
- Not suitable for growth companies that reinvest earnings

**Confidence calculation:**
- High if: Stable dividend history, consistent growth
- Medium if: Dividend growing but volatile
- Low if: Recent dividend cuts, inconsistent payments
- N/A if: Company doesn't pay dividends

### 4. Asset-Based Valuation

**Concept:** Value company based on net asset value

**Formula:**
- Net Asset Value = Total Assets - Total Liabilities
- Adjusted NAV = NAV + Adjustments for intangibles, goodwill, etc.

**Steps:**
1. Get total assets and total liabilities from balance sheet
2. Calculate book value (shareholders' equity)
3. Adjust for:
   - Intangible assets (reduce value if overstated)
   - Goodwill (reduce value if impaired)
   - Off-balance sheet items
   - Asset quality (e.g., receivables collection risk)
4. Calculate intrinsic value per share = Adjusted NAV / Shares outstanding

**Assumptions to document:**
- Adjustment factors applied
- Asset quality assumptions
- Intangible asset treatment

**Limitations to flag:**
- Only applicable to asset-heavy businesses
- Not suitable for service/tech companies with few tangible assets
- Ignores earning power and competitive advantage
- Book values may not reflect market values

**Confidence calculation:**
- High if: Asset-heavy business, reliable balance sheet
- Medium if: Mix of tangible and intangible assets
- Low if: Tech/service company with few tangible assets
- N/A if: Company has negative equity

## Method Agreement Analysis

**Algorithm:**
1. Calculate upside % for each method
2. Calculate standard deviation of upsides
3. Determine agreement level:
   - STRONG: std dev < 10% (methods align closely)
   - MODERATE: std dev 10-20% (methods mostly align)
   - WEAK: std dev 20-30% (methods diverge)
   - DIVERGENT: std dev > 30% (methods strongly disagree)

**Narrative:**
- STRONG: "All valuation methods converge on similar intrinsic value"
- MODERATE: "Most methods align, with [method] as outlier due to [reason]"
- WEAK: "Valuation methods diverge significantly, suggesting high uncertainty"
- DIVERGENT: "Valuation methods show strong disagreement, recommend caution"

## Margin of Safety Calculation

**Formula:**
- Margin of Safety = (Intrinsic Value - Current Price) / Intrinsic Value × 100%

**Interpretation:**
- Positive = Undervalued (good investment)
- Negative = Overvalued (avoid)
- 0-5% = Thin margin (risky)
- 5-15% = Adequate margin (acceptable)
- 15%+ = Strong margin (attractive)

**Assessment:**
- 15%+ = "Strong margin of safety"
- 5-15% = "Adequate margin of safety"
- 0-5% = "Thin margin of safety"
- Negative = "No margin of safety"

## Overall Assessment Logic

**Determine based on consensus valuation:**
1. If intrinsic value > current price + 15% = UNDERVALUED
2. If intrinsic value between current price ± 10% = FAIRLY_VALUED
3. If intrinsic value < current price - 10% = OVERVALUED
4. If unable to calculate (all methods N/A) = UNABLE_TO_VALUE

**Adjust for data quality:**
- If multiple data quality warnings: reduce confidence
- If key data missing: mark as "UNABLE_TO_VALUE"
- If methods diverge significantly: mark as "FAIRLY_VALUED" (uncertain)

## Summary Generation

**Template:**
```
[Company] appears [UNDERVALUED/FAIRLY_VALUED/OVERVALUED] at current price of $[price].

Valuation analysis suggests intrinsic value range of $[low]-$[high], implying 
[upside/downside]% [upside/downside]. Margin of safety is [assessment] at [%].

[Method agreement statement]. [Primary valuation method] suggests $[value], 
while [secondary method] suggests $[value].

Key assumptions: [list 2-3 key assumptions]. Key limitations: [list 1-2 key limitations].
```

## Data Quality Integration

**Warnings to flag:**
- Missing FCF data (affects DCF confidence)
- Negative earnings (affects P/E method)
- No dividend history (marks DDM as N/A)
- Negative equity (marks asset-based as N/A)
- High debt (affects cost of equity calculation)
- Volatile earnings (affects growth rate reliability)

**Recommendations for personas:**
- "DCF method most reliable given strong FCF history"
- "Comparable analysis limited due to [reason]"
- "DDM not applicable - company doesn't pay dividends"
- "Asset-based valuation not suitable for tech company"

## Example Output: AAPL

```
Current Price: $257.40

DCF Method:
  Intrinsic Value: $285
  Upside: +10.7%
  Assessment: FAIRLY_VALUED
  Confidence: 85%
  Key Assumptions: 8% FCF growth, 12.9% WACC, 2.5% terminal growth
  Narrative: "DCF analysis based on historical FCF of $110B and conservative 8% growth assumption. Terminal value represents 72% of total value."

Comparable Method:
  Intrinsic Value: $280
  Upside: +8.8%
  Assessment: FAIRLY_VALUED
  Confidence: 75%
  Key Assumptions: P/E multiple of 28.5x (vs S&P 500 avg 20x), premium justified by brand
  Narrative: "P/E multiple approach suggests $280 intrinsic value. Apple trades at premium to market average, justified by superior margins and brand strength."

DDM Method:
  Intrinsic Value: $42
  Upside: -83.7%
  Assessment: UNABLE_TO_VALUE
  Confidence: 20%
  Narrative: "DDM significantly undervalues Apple because dividends represent only 1.5% of earnings. Not primary valuation driver."

Asset-Based Method:
  Intrinsic Value: $95
  Upside: -63.1%
  Assessment: UNABLE_TO_VALUE
  Confidence: 15%
  Narrative: "Asset-based valuation not suitable for tech company with significant intangible assets (brand, IP). Book value of $95 significantly undervalues earning power."

Consensus Valuation: $280-285
Consensus Upside: 8-11%
Margin of Safety: 5.8% (THIN)
Method Agreement: MODERATE
  - DCF and Comparable methods align on ~$280-285
  - DDM and Asset-based are outliers (not primary valuation drivers)

Overall Assessment: FAIRLY_VALUED

Summary:
"Apple appears fairly valued at current price of $257.40. DCF and comparable analysis suggest intrinsic value around $280-285, implying 8-11% upside. Margin of safety is modest at 5.8%, below typical 15-20% threshold for conservative investors. Method agreement is moderate, with primary methods (DCF and Comparable) aligning closely."

Data Quality Warnings:
- "ROE appears anomalously high (171%) - affects cost of equity calculation"
- "ROIC data unavailable - cannot assess capital efficiency"

Recommendations for Personas:
- "Value investors should note thin margin of safety (5.8%)"
- "Growth investors can focus on strong FCF generation ($110B annually)"
- "Income investors should note low dividend yield (1.5%)"
- "Use DCF and Comparable methods as primary valuation anchors"
```

## Testing Strategy

1. **Unit Tests**: Test each valuation method independently
2. **Integration Tests**: Test full valuationAgent with various stocks
3. **Edge Cases**: Test with:
   - Negative earnings (P/E method)
   - No dividends (DDM method)
   - Negative equity (Asset-based method)
   - High volatility (growth rate reliability)
4. **Benchmark Tests**: Compare outputs to known valuations
5. **Performance Tests**: Ensure analysis completes in <2 seconds

## Next Steps

1. Create valuationAgent.ts file with interface definitions
2. Implement each of the 4 valuation methods
3. Add method agreement analysis
4. Add margin of safety calculation
5. Add data quality integration
6. Create tRPC procedure
7. Write unit tests
8. Test with AAPL and BIDU
