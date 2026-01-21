# Issue: Missing ROIC Data Not Reported in Warren Buffett Score Card for BIDU

## Problem Statement
Warren Buffett's investment philosophy heavily relies on **ROIC (Return on Invested Capital)** to evaluate:
- Competitive advantage (moat strength)
- Capital efficiency
- Quality of management's capital allocation

However, BIDU has **ROIC = 0** (flagged as anomalous), which means this critical metric is **blocked from the LLM analysis**. Yet, the Warren Buffett score card **does NOT explicitly mention that ROIC is missing** or that the analysis is incomplete due to this data gap.

## Current Behavior

### What Warren Buffett Analysis Shows:
The modal displays:
1. **Overall Score:** 35/100 (Not a Fit)
2. **Summary bullets** mentioning:
   - Complex Chinese tech sector (outside circle of competence)
   - Dominant position in search (potential moat)
   - Heavy dilution from AI/autonomous driving investments
   - Reported financials are inconsistent (307% ROE, 689% Profit Margin, negative FCF)

3. **Criteria Breakdown** showing:
   - "Durable Competitive Advantage (Moat)" - partial
   - "Management Quality & Capital Allocation" - partial
   - "Understandability & Simplicity (Circle of Competence)" - FAIL (red badge)
   - "Valuation & Margin of Safety" - FAIL (red badge)

### What's Missing:
- **No explicit disclaimer** that ROIC is unavailable
- **No mention** that the analysis is incomplete due to missing critical metrics
- **No indication** that the "Durable Competitive Advantage" criterion cannot be fully evaluated without ROIC
- **No note** that "Management Quality & Capital Allocation" assessment is compromised

## Root Cause Analysis

### Current Implementation Issue:
1. **Data Blocking Works:** The aiAnalysisEngine correctly identifies ROIC as anomalous and replaces it with "[DATA UNAVAILABLE]" in the LLM prompt
2. **LLM Receives:** The prompt includes a disclaimer about missing metrics, but...
3. **LLM Doesn't Report It:** The LLM analysis doesn't explicitly call out which specific metrics are missing or how they impact the score
4. **UI Doesn't Show It:** The persona card and modal don't display which metrics were unavailable for that specific persona

### Why This Matters:
- **For Warren Buffett specifically:** ROIC is fundamental to his analysis. Without it, the "Durable Competitive Advantage" and "Management Quality" assessments are incomplete
- **For users:** They don't know that the score might be artificially low/high due to missing data
- **For credibility:** The analysis appears complete when it's actually based on incomplete information

## Specific Example from BIDU Analysis

**What the analysis says about moat:**
> "Baidu holds a dominant position in the Chinese search market, which provides a network effect moat in advertising. However, this moat is constantly challenged by competition, and the massive capital required for its new AI/Autonomous Driving ventures dilutes the strength of the core business moat."

**What it SHOULD say:**
> "Baidu holds a dominant position in the Chinese search market, which provides a network effect moat in advertising. However, this moat is constantly challenged by competition, and the massive capital required for its new AI/Autonomous Driving ventures dilutes the strength of the core business moat. **[NOTE: ROIC data is unavailable, which typically would be used to quantify the strength and sustainability of this moat. This assessment is therefore qualitative only.]**"

## The Gap

The current system:
- ✅ Blocks anomalous metrics from LLM (prevents bad data from influencing analysis)
- ✅ Includes a generic disclaimer about missing metrics in the prompt
- ❌ **Does NOT explicitly tell users which specific metrics are missing**
- ❌ **Does NOT tell users which persona criteria are affected by missing data**
- ❌ **Does NOT adjust confidence scores based on data completeness**

## Expected Behavior (What Should Happen)

For Warren Buffett's BIDU analysis, the score card should show:

```
Warren Buffett - Not a Fit (35/100)
⚠️ Analysis based on incomplete data

Missing Critical Metrics:
- ROIC (Return on Invested Capital) - Impacts: "Durable Competitive Advantage" assessment
- Interest Coverage Ratio - Impacts: "Financial Strength" assessment

Confidence: 75% (reduced from 90% due to missing data)
```

Or in the detailed modal, add a section:

```
Data Quality Notes:
- ROIC is unavailable (flagged as anomalous)
- Interest Coverage is unavailable (flagged as anomalous)
- These metrics are typically important for evaluating competitive advantage and financial strength
- This analysis is based on available metrics only
```

## Files Involved

1. **yfinanceWrapper.py** - Flags ROIC as zero/anomalous ✓
2. **aiAnalysisEngine.ts** - Blocks anomalous metrics from LLM ✓
3. **shared/types.ts** - Has dataQualityIssues field (but not used for persona-specific impacts)
4. **Ticker.tsx** - Displays persona cards (doesn't show which metrics are missing for each persona)

## Recommendation

The system needs to:
1. Track which metrics are missing for each persona
2. Identify which criteria each missing metric impacts
3. Display this information in the score card/modal
4. Optionally adjust confidence scores based on data completeness
