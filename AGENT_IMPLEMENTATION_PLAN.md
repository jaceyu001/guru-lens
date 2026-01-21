# Valuation Agent & Fundamentals Agent Implementation Plan

## Overview

This document outlines the plan to build two specialized analysis agents based on the AI Hedge Fund architecture, transforming Guru Lens from a persona-based system to a hybrid system with dedicated analysis agents + personas.

---

## Architecture Overview

### Current System (Guru Lens)
```
Stock Input
    ↓
6 Personas (LLM-based analysis)
    ↓
6 Individual Scores (0-100)
    ↓
User sees all perspectives
```

### Proposed System (Guru Lens + Agents)
```
Stock Input
    ↓
├─ Fundamentals Agent (quantitative analysis)
├─ Valuation Agent (intrinsic value calculation)
└─ 6 Personas (qualitative analysis)
    ↓
Aggregate all signals with weights
    ↓
Generate consensus score + confidence
    ↓
Show individual perspectives + aggregated recommendation
```

---

## Phase 1: Fundamentals Agent

### Purpose
Analyze core financial metrics and generate a quantitative fundamentals score (0-100) with confidence level.

### Input Data
```typescript
{
  ticker: string;
  financialData: {
    // Growth Metrics
    revenueGrowth: number;           // YoY %
    earningsGrowth: number;          // YoY %
    fcfGrowth: number;               // YoY %
    
    // Profitability Metrics
    netMargin: number;               // %
    operatingMargin: number;         // %
    grossMargin: number;             // %
    
    // Return Metrics
    roe: number;                     // %
    roic: number;                    // %
    roa: number;                     // %
    
    // Financial Health
    debtToEquity: number;            // ratio
    currentRatio: number;            // ratio
    quickRatio: number;              // ratio
    interestCoverage: number;        // ratio
    
    // Cash Flow
    fcf: number;                     // absolute value
    fcfMargin: number;               // % of revenue
    operatingCashFlow: number;       // absolute value
    
    // Valuation
    pe: number;                      // P/E ratio
    pb: number;                      // P/B ratio
    psRatio: number;                 // P/S ratio
    
    // Other
    dividendYield: number;           // %
    marketCap: number;               // absolute value
  };
  dataQualityFlags: {
    // Anomaly flags from yfinance
    roicZero: boolean;
    interestCoverageZero: boolean;
    debtToEquityAnomalous: boolean;
    // ... other flags
  };
}
```

### Analysis Framework

#### 1. **Revenue & Growth Analysis**
```
Scoring Logic:
- Revenue Growth > 15% → 25 points
- Revenue Growth 10-15% → 20 points
- Revenue Growth 5-10% → 15 points
- Revenue Growth 0-5% → 10 points
- Revenue Growth < 0% → 0 points

Adjustments:
- If revenue growth > 30% AND company is large cap → -5 points (sustainability concern)
- If revenue growth > 50% AND company is small cap → +5 points (high growth potential)
```

#### 2. **Profitability Analysis**
```
Scoring Logic:
- Net Margin > 20% → 25 points (excellent)
- Net Margin 15-20% → 20 points (very good)
- Net Margin 10-15% → 15 points (good)
- Net Margin 5-10% → 10 points (acceptable)
- Net Margin < 5% → 5 points (weak)

Adjustments:
- If margin declining YoY → -5 points
- If margin expanding YoY → +5 points
- If industry average is lower → +5 points
- If industry average is higher → -5 points
```

#### 3. **Return on Capital Analysis**
```
Scoring Logic:
- ROE > 20% AND ROIC > 15% → 25 points (excellent capital efficiency)
- ROE 15-20% AND ROIC 10-15% → 20 points (good)
- ROE 10-15% AND ROIC 5-10% → 15 points (acceptable)
- ROE 5-10% AND ROIC 0-5% → 10 points (weak)
- ROE < 5% OR ROIC < 0% → 0 points (poor)

Adjustments:
- If ROIC > Cost of Capital → +5 points (creating value)
- If ROIC < Cost of Capital → -5 points (destroying value)
```

#### 4. **Financial Health Analysis**
```
Scoring Logic:
Debt-to-Equity:
- D/E < 50% → 20 points (conservative)
- D/E 50-100% → 15 points (moderate)
- D/E 100-150% → 10 points (elevated)
- D/E > 150% → 0 points (risky)

Current Ratio:
- CR > 2.0 → 10 points (strong liquidity)
- CR 1.5-2.0 → 8 points (good)
- CR 1.0-1.5 → 5 points (acceptable)
- CR < 1.0 → 0 points (liquidity risk)

Interest Coverage:
- IC > 10x → 10 points (strong)
- IC 5-10x → 8 points (good)
- IC 2-5x → 5 points (acceptable)
- IC < 2x → 0 points (distress risk)

Total Financial Health Score: (D/E + CR + IC) / 3
```

#### 5. **Cash Flow Analysis**
```
Scoring Logic:
FCF Margin:
- FCF Margin > 15% → 20 points (excellent)
- FCF Margin 10-15% → 15 points (good)
- FCF Margin 5-10% → 10 points (acceptable)
- FCF Margin 0-5% → 5 points (weak)
- FCF Margin < 0% → 0 points (cash burn)

FCF Growth:
- FCF Growth > 20% → 10 points
- FCF Growth 10-20% → 8 points
- FCF Growth 0-10% → 5 points
- FCF Growth < 0% → 0 points

Total Cash Flow Score: (FCF Margin + FCF Growth) / 2
```

#### 6. **Quality Score Calculation**
```
Final Score = (
  Growth Score (25 points) × 0.20 +
  Profitability Score (25 points) × 0.25 +
  Return on Capital Score (25 points) × 0.25 +
  Financial Health Score (20 points) × 0.20 +
  Cash Flow Score (20 points) × 0.10
) / 100 × 100

= Fundamentals Score (0-100)
```

### Output Data
```typescript
{
  score: number;                    // 0-100
  confidence: number;               // 0-1
  signal: "BUY" | "SELL" | "HOLD"; // Based on score
  breakdown: {
    growthScore: number;
    profitabilityScore: number;
    returnOnCapitalScore: number;
    financialHealthScore: number;
    cashFlowScore: number;
  };
  reasoning: string;                // Detailed explanation
  dataQualityWarnings: string[];    // List of anomalies detected
  missingMetrics: string[];         // Metrics unavailable due to anomalies
}
```

---

## Phase 2: Valuation Agent

### Purpose
Calculate intrinsic value using multiple methods and generate a valuation score (0-100) with confidence level.

### Input Data
```typescript
{
  ticker: string;
  currentPrice: number;
  financialData: {
    // For DCF
    fcf: number;
    fcfGrowthRate: number;           // 5-year projected
    terminalGrowthRate: number;      // 2-3% typical
    
    // For Comparable Analysis
    pe: number;
    pb: number;
    psRatio: number;
    priceToCashFlow: number;
    
    // For Dividend Discount Model
    dividendPerShare: number;
    dividendGrowthRate: number;
    
    // Risk metrics
    beta: number;
    riskFreeRate: number;            // Current 10-year Treasury
    marketRiskPremium: number;       // Historical 6-8%
    
    // Company metrics
    sharesOutstanding: number;
    netIncome: number;
    bookValue: number;
    revenue: number;
    
    // Market data
    industryPeAverage: number;
    industryPbAverage: number;
    industryPsAverage: number;
  };
}
```

### Valuation Methods

#### 1. **Discounted Cash Flow (DCF) Analysis**
```
Step 1: Calculate WACC (Weighted Average Cost of Capital)
  Cost of Equity = Risk-Free Rate + Beta × Market Risk Premium
  Cost of Debt = Interest Rate × (1 - Tax Rate)
  WACC = (E/V × Cost of Equity) + (D/V × Cost of Debt)
  
  Example:
  Risk-Free Rate = 4.5%
  Beta = 1.2
  Market Risk Premium = 7%
  Cost of Equity = 4.5% + (1.2 × 7%) = 12.9%
  WACC = 12.9% (simplified)

Step 2: Project Free Cash Flows (5 years)
  Year 1 FCF = Current FCF × (1 + Growth Rate)
  Year 2 FCF = Year 1 FCF × (1 + Growth Rate)
  ... (repeat for 5 years)
  
  Example:
  Current FCF = $10B, Growth Rate = 8%
  Year 1: $10.8B
  Year 2: $11.66B
  Year 3: $12.59B
  Year 4: $13.60B
  Year 5: $14.69B

Step 3: Calculate Terminal Value
  Terminal Value = Year 5 FCF × (1 + Terminal Growth Rate) / (WACC - Terminal Growth Rate)
  
  Example:
  Terminal Value = $14.69B × 1.03 / (0.129 - 0.03) = $152.7B

Step 4: Discount to Present Value
  PV = Σ(Year FCF / (1 + WACC)^year) + Terminal Value / (1 + WACC)^5
  
  Example:
  PV of Year 1-5 FCF = $48.2B
  PV of Terminal Value = $91.3B
  Total Enterprise Value = $139.5B

Step 5: Calculate Equity Value
  Equity Value = Enterprise Value - Net Debt
  Intrinsic Value per Share = Equity Value / Shares Outstanding
  
  Example:
  Net Debt = $5B
  Equity Value = $134.5B
  Shares Outstanding = 15.6B
  Intrinsic Value = $8.63 per share
```

#### 2. **Comparable Company Analysis**
```
Step 1: Find comparable companies in same industry
Step 2: Calculate average multiples
  Average P/E = Mean of industry P/E ratios
  Average P/B = Mean of industry P/B ratios
  Average P/S = Mean of industry P/S ratios

Step 3: Apply multiples to target company
  Intrinsic Value (P/E method) = Earnings × Average P/E
  Intrinsic Value (P/B method) = Book Value × Average P/B
  Intrinsic Value (P/S method) = Revenue × Average P/S

Step 4: Average the three methods
  Intrinsic Value = (P/E Value + P/B Value + P/S Value) / 3
```

#### 3. **Dividend Discount Model (DDM)**
```
For dividend-paying stocks:

Intrinsic Value = Dividend Per Share × (1 + Growth Rate) / (Cost of Equity - Growth Rate)

Example:
DPS = $2.00
Growth Rate = 5%
Cost of Equity = 10%

Intrinsic Value = $2.00 × 1.05 / (0.10 - 0.05) = $42 per share
```

#### 4. **Asset-Based Valuation**
```
For asset-heavy companies:

Intrinsic Value = (Total Assets - Total Liabilities) / Shares Outstanding
                = Book Value Per Share

Adjustment for intangibles:
- If company has strong brand/patents → Add 20% premium
- If company has weak brand → Subtract 10%
```

### Valuation Score Calculation

```
Step 1: Calculate Upside/Downside
  Upside % = (Intrinsic Value - Current Price) / Current Price × 100

Step 2: Determine Margin of Safety
  Margin of Safety = Upside % - Required Return (15% for value investors)
  
  Example:
  Intrinsic Value = $150
  Current Price = $120
  Upside = 25%
  Margin of Safety = 25% - 15% = 10% (acceptable)

Step 3: Generate Valuation Score
  If Upside > 30% AND Margin of Safety > 20% → Score = 90 (Strong BUY)
  If Upside 20-30% AND Margin of Safety 10-20% → Score = 75 (BUY)
  If Upside 10-20% AND Margin of Safety 5-10% → Score = 60 (HOLD)
  If Upside 0-10% → Score = 40 (HOLD)
  If Upside < 0% → Score = 20 (SELL)

Step 4: Adjust for Valuation Method Agreement
  If all 4 methods agree within 10% → Confidence = 0.95
  If 3 methods agree within 15% → Confidence = 0.80
  If methods diverge > 20% → Confidence = 0.50
```

### Output Data
```typescript
{
  score: number;                    // 0-100
  confidence: number;               // 0-1
  signal: "BUY" | "SELL" | "HOLD"; // Based on score
  intrinsicValue: number;           // Per share
  upside: number;                   // % upside
  marginOfSafety: number;           // %
  breakdown: {
    dcfValue: number;
    comparableValue: number;
    ddmValue: number;
    assetBasedValue: number;
  };
  reasoning: string;                // Detailed explanation
  dataQualityWarnings: string[];    // Valuation method limitations
}
```

---

## Phase 3: Signal Aggregation

### Weighted Consensus Calculation

```typescript
interface AggregatedSignal {
  fundamentalsScore: number;        // 0-100 from Fundamentals Agent
  fundamentalsConfidence: number;   // 0-1
  
  valuationScore: number;           // 0-100 from Valuation Agent
  valuationConfidence: number;      // 0-1
  
  personaScores: {
    [personaId]: {
      score: number;                // 0-100
      confidence: number;           // 0-1
    }
  };
  
  // Aggregation
  weights: {
    fundamentals: 0.20;
    valuation: 0.25;
    personas: 0.55;                 // 0.0917 each for 6 personas
  };
  
  weightedScore: number;            // Final aggregated score 0-100
  overallConfidence: number;        // 0-1
  consensusLevel: "strong" | "weak" | "disagreement";
  signal: "BUY" | "SELL" | "HOLD";
  
  // Disagreement Analysis
  disagreement: {
    fundamentalsVsValuation: number; // Difference in scores
    fundamentalsVsPersonas: number;
    valuationVsPersonas: number;
    personasAgreement: number;       // Std dev of persona scores
  };
}
```

### Consensus Detection Logic

```typescript
function detectConsensus(signals: AggregatedSignal): string {
  const allScores = [
    signals.fundamentalsScore,
    signals.valuationScore,
    ...Object.values(signals.personaScores).map(p => p.score)
  ];
  
  const mean = average(allScores);
  const stdDev = standardDeviation(allScores);
  const range = max(allScores) - min(allScores);
  
  if (stdDev < 15 && range < 30) {
    return "strong";      // High consensus
  } else if (stdDev < 25 && range < 50) {
    return "weak";        // Moderate consensus
  } else {
    return "disagreement"; // Significant disagreement
  }
}
```

---

## Phase 4: UI/UX Changes

### New Ticker Page Layout

```
┌─────────────────────────────────────────────────────┐
│ AAPL | $257.40 | ↓ 0.82%                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  OVERALL RECOMMENDATION: BUY (Confidence: 92%)     │
│  Weighted Score: 78/100                            │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Fundamentals: 82/100 ✓ (Confidence: 88%)     │  │
│  │ Valuation: 75/100 ✓ (Confidence: 85%)        │  │
│  │ Personas Average: 76/100 (Confidence: 90%)   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  CONSENSUS: Strong Agreement (all signals align)   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ DETAILED ANALYSIS                                   │
│                                                     │
│ ▼ Fundamentals Agent                               │
│   Revenue Growth: 8% | Net Margin: 26.9%           │
│   ROE: 171% | Debt/Equity: 152%                    │
│   Score: 82/100                                    │
│                                                     │
│ ▼ Valuation Agent                                  │
│   Intrinsic Value: $285 | Current: $257            │
│   Upside: 11% | Margin of Safety: 8%               │
│   Score: 75/100                                    │
│                                                     │
│ ▼ Persona Ratings                                  │
│   Warren Buffett: 92/100 (Strong Fit)              │
│   Benjamin Graham: 68/100 (Fair Value)             │
│   ... (other personas)                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### New Data Displayed

1. **Fundamentals Agent Card**
   - Revenue/Earnings/FCF growth
   - Profitability metrics (margins)
   - Return on capital (ROE, ROIC)
   - Financial health (D/E, current ratio)
   - Cash flow analysis
   - Data quality warnings

2. **Valuation Agent Card**
   - Intrinsic value (per share)
   - Upside/downside percentage
   - Margin of safety
   - Valuation methods breakdown (DCF, Comparable, DDM, Asset-based)
   - Confidence in valuation

3. **Consensus Analysis**
   - Overall recommendation with confidence
   - Agreement level (strong/weak/disagreement)
   - Which signals agree/disagree
   - Weighted score calculation

---

## Phase 5: Backend Implementation

### New tRPC Procedures

```typescript
// Get Fundamentals Agent analysis
trpc.analysis.getFundamentalsAnalysis.query({
  ticker: string;
})

// Get Valuation Agent analysis
trpc.analysis.getValuationAnalysis.query({
  ticker: string;
})

// Get aggregated signal with all agents
trpc.analysis.getAggregatedSignal.query({
  ticker: string;
})

// Get consensus analysis
trpc.analysis.getConsensusAnalysis.query({
  ticker: string;
})
```

### New Server Services

```
server/services/
├── fundamentalsAgent.ts      // Fundamentals analysis logic
├── valuationAgent.ts         // Valuation analysis logic
├── signalAggregation.ts      // Weighted consensus calculation
└── consensusAnalysis.ts      // Disagreement detection
```

### Database Schema Updates

```typescript
// Store agent analysis results for caching/backtesting
table("agentAnalysis", {
  id: text().primaryKey(),
  ticker: text(),
  analysisType: text(), // "fundamentals" | "valuation" | "aggregated"
  score: integer(),
  confidence: real(),
  signal: text(),
  breakdown: json(),
  reasoning: text(),
  createdAt: timestamp(),
  dataQualityFlags: json(),
});
```

---

## Phase 6: Testing & Validation

### Unit Tests
- Fundamentals scoring logic (each metric)
- Valuation methods (DCF, Comparable, DDM, Asset-based)
- Consensus detection algorithm
- Signal aggregation weights

### Integration Tests
- End-to-end analysis for multiple tickers
- Verify agent outputs match expected ranges
- Test with anomalous data (zero metrics, extreme values)
- Test with missing data

### Backtesting
- Compare agent recommendations vs. actual stock performance
- Optimize weights based on historical accuracy
- Identify best/worst performing stocks for each agent

---

## Implementation Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Fundamentals Agent | 2-3 days | None |
| Phase 2: Valuation Agent | 3-4 days | Phase 1 complete |
| Phase 3: Signal Aggregation | 1-2 days | Phase 1 & 2 complete |
| Phase 4: UI/UX Changes | 2-3 days | Phase 1, 2, 3 complete |
| Phase 5: Backend Implementation | 2-3 days | Phase 1, 2, 3 complete |
| Phase 6: Testing & Validation | 3-5 days | All phases complete |
| **Total** | **13-20 days** | - |

---

## Risk Mitigation

### Risk 1: Valuation Model Accuracy
- **Mitigation:** Use multiple valuation methods, average results
- **Fallback:** If methods diverge > 20%, reduce confidence

### Risk 2: Missing Financial Data
- **Mitigation:** Graceful degradation - skip unavailable metrics
- **Fallback:** Use industry averages for missing data

### Risk 3: Anomalous Data
- **Mitigation:** Detect anomalies, flag to user, block from analysis
- **Fallback:** Use historical data or peer comparisons

### Risk 4: Agent Disagreement
- **Mitigation:** Show disagreement explicitly, reduce confidence
- **Fallback:** Recommend HOLD when signals conflict

---

## Success Criteria

1. ✅ Fundamentals Agent generates scores 0-100 with confidence
2. ✅ Valuation Agent calculates intrinsic value within 15% accuracy
3. ✅ Signal aggregation produces weighted consensus score
4. ✅ UI displays all agent analysis + consensus clearly
5. ✅ System handles anomalous data gracefully
6. ✅ All tests pass (unit, integration, backtesting)
7. ✅ User feedback indicates improved clarity and confidence

---

## Next Steps (After Approval)

1. Review and approve this plan
2. Identify any changes or clarifications needed
3. Begin Phase 1: Fundamentals Agent implementation
4. Create detailed technical specifications for each phase
5. Set up testing framework and test data
