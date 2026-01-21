# Earning Power Value (EPV) Valuation Model - Updated Outline

## Overview

The Earning Power Value (EPV) model values a company based on its sustainable earning power. This updated version uses:
1. **4-year normalized NOPAT** for more stable earnings estimate
2. **Dual growth scenarios** to provide valuation range

---

## Step 1: Gather Financial Data

From financial statements, collect for each available period:
- **Revenue**
- **Operating Profit (EBIT)** or Operating Margin
- **Effective Tax Rate**
- **Total Debt**
- **Cash & Equivalents** (non-operating)
- **Diluted Shares Outstanding**

### Available Data Points

Collect data for:
1. **Latest TTM** (Trailing Twelve Months) - if Q3 2025 available, calculate TTM from last 4 quarters
2. **Latest Full Year** (FY 2024)
3. **Prior Year** (FY 2023)
4. **Two Years Prior** (FY 2022)

---

## Step 2: Calculate NOPAT for Each Period

**Formula for each period:**
```
NOPAT = Revenue × Operating Margin × (1 - Tax Rate)
```

Or alternatively:
```
NOPAT = Operating Profit × (1 - Tax Rate)
```

### Calculate for Each Period

| Period | Revenue | Operating Margin | Tax Rate | NOPAT |
|--------|---------|------------------|----------|-------|
| TTM (2025 Q3) | - | - | - | NOPAT₁ |
| FY 2024 | - | - | - | NOPAT₂ |
| FY 2023 | - | - | - | NOPAT₃ |
| FY 2022 | - | - | - | NOPAT₄ |

---

## Step 3: Calculate 4-Year Normalized NOPAT

**Formula:**
```
Normalized NOPAT = (NOPAT₁ + NOPAT₂ + NOPAT₃ + NOPAT₄) / 4
```

Where:
- NOPAT₁ = Latest TTM NOPAT
- NOPAT₂ = Latest Full Year (FY 2024) NOPAT
- NOPAT₃ = Prior Year (FY 2023) NOPAT
- NOPAT₄ = Two Years Prior (FY 2022) NOPAT

### Example

```
TTM 2025 Q3 NOPAT: $500M
FY 2024 NOPAT:     $480M
FY 2023 NOPAT:     $450M
FY 2022 NOPAT:     $420M

Normalized NOPAT = ($500M + $480M + $450M + $420M) / 4
                 = $1,850M / 4
                 = $462.5M
```

**Rationale:** Using 4-year average smooths out cyclical variations and one-time events, providing a more stable estimate of sustainable earning power.

---

## Step 4: Determine WACC (Weighted Average Cost of Capital)

**Fixed WACC: 9%**

This model uses a **fixed WACC of 9%** for all valuations. This represents a reasonable estimate for mature companies and simplifies the valuation process.

### Rationale for 9% WACC

- **Industry Standard**: 9% is commonly used for mature, stable companies
- **Conservative**: Slightly above risk-free rate (~4%) + equity risk premium
- **Simplicity**: Avoids complex WACC calculations
- **Consistency**: Enables fair comparison across different companies

### WACC Calculation (Reference Only)

For reference, the 9% WACC assumes:
```
WACC = (E/V × Cost of Equity) + (D/V × Cost of Debt × (1 - Tax Rate))
     ≈ 9%
```

Where:
- **Cost of Equity** ≈ 10-11% (risk-free rate + equity risk premium)
- **Cost of Debt** ≈ 5-6% (after-tax)
- **Capital Structure** ≈ 60% equity, 40% debt

**Note:** This model does NOT calculate WACC dynamically. Always use 9% for consistency.

---

## Step 5: Determine Growth Rate Scenarios

### Scenario A: Market-Estimated Growth Rate (Using LLM)

**Source:** Use LLM to extract market consensus growth rate

**LLM-Based Growth Rate Extraction:**
The LLM will be prompted to search for analyst consensus, company guidance, and industry trends to synthesize a market consensus growth rate.

**LLM Output Processing:**
- Extract growth_rate from LLM response
- Use confidence to adjust valuation confidence score
- Document sources and reasoning in assumptions
- Note any caveats in limitations

**Typical Market Growth Rates:**
- Mature tech companies: 3-8%
- Stable industrial companies: 2-5%
- High-growth tech: 8-15%
- Utilities: 2-4%
- Distressed companies: 0-2% or negative

**Validation:**
- Growth rate (g) MUST be less than WACC (9%)
- If g ≥ 9%, cap g at 8% (WACC - 1%)
- If g < 0%, set g = 0% (use zero growth scenario)
- If LLM cannot determine g, default to 3% (conservative estimate)

**Formula:**
```
g_market = Market consensus long-term growth rate
```

### Scenario B: Zero Growth

**Assumption:** Company will not grow beyond current sustainable earnings

**Formula:**
```
g_zero = 0%
```

**Rationale:** Conservative scenario that assumes company maintains current profitability but does not expand.

---

## Step 6: Calculate EPV for Scenario A (Market Growth)

**Formula:**
```
EPV_Market = Normalized NOPAT / (WACC - g_market)
```

Where:
- **WACC** = 9% (fixed)
- **g_market** = LLM-extracted market consensus growth rate

**Constraints:**
- If g_market ≥ 9%, cap g_market at 8% (WACC - 1%)
- If g_market < 0%, set g_market = 0% (use zero growth scenario)
- If LLM extraction fails, default g_market = 3%

### Example

```
Normalized NOPAT: $462.5M
WACC: 9% (fixed)
g_market: 4% (from LLM extraction)

EPV_Market = $462.5M / (0.09 - 0.04)
           = $462.5M / 0.05
           = $9,250M
```

---

## Step 7: Calculate EPV for Scenario B (Zero Growth)

**Formula:**
```
EPV_Zero = Normalized NOPAT / WACC
          = Normalized NOPAT / 0.09
```

Where:
- **WACC** = 9% (fixed)

### Example

```
Normalized NOPAT: $462.5M
WACC: 9% (fixed)

EPV_Zero = $462.5M / 0.09
         = $5,139M
```

---

## Step 8: Calculate Equity Value for Both Scenarios

**Formula for each scenario:**
```
Equity Value = EPV - Total Debt + Non-operating Cash
```

### Example - Scenario A (Market Growth)

```
EPV_Market: $9,250M
Total Debt: $5,000M
Non-operating Cash: $8,000M

Equity Value_Market = $9,250M - $5,000M + $8,000M
                    = $12,250M
```

### Example - Scenario B (Zero Growth)

```
EPV_Zero: $5,139M
Total Debt: $5,000M
Non-operating Cash: $8,000M

Equity Value_Zero = $5,139M - $5,000M + $8,000M
                  = $8,139M
```

---

## Step 9: Calculate Intrinsic Value per Share for Both Scenarios

**Formula for each scenario:**
```
Intrinsic Value per Share = Equity Value / Diluted Shares Outstanding
```

### Example - Scenario A (Market Growth)

```
Equity Value_Market: $12,250M
Diluted Shares Outstanding: 1,200M

Intrinsic Value per Share_Market = $12,250M / 1,200M
                                 = $10.21 per share
```

### Example - Scenario B (Zero Growth)

```
Equity Value_Zero: $8,139M
Diluted Shares Outstanding: 1,200M

Intrinsic Value per Share_Zero = $8,139M / 1,200M
                               = $6.78 per share
```

---

## Step 10: Determine Valuation Range and Assessment

### Valuation Range

```
Conservative Valuation (Zero Growth): Intrinsic Value_Zero
Base Case Valuation (Market Growth): Intrinsic Value_Market
Valuation Range: [Intrinsic Value_Zero, Intrinsic Value_Market]
```

### Assessment Logic

Compare current price to valuation range:

**UNDERVALUED:**
- Current Price < Intrinsic Value_Zero × 1.1
- Margin of safety > 10% even in conservative scenario

**FAIRLY VALUED:**
- Intrinsic Value_Zero × 0.9 < Current Price < Intrinsic Value_Market × 1.1
- Price within reasonable range of both scenarios

**OVERVALUED:**
- Current Price > Intrinsic Value_Market × 1.1
- Price exceeds even optimistic scenario

### Example

```
Current Price: $8.50 per share
Intrinsic Value_Zero: $6.78 per share (conservative)
Intrinsic Value_Market: $10.21 per share (base case)
Valuation Range: [$6.78, $10.21]

Assessment: FAIRLY VALUED
Reason: Current price ($8.50) falls within valuation range
Upside (to base case): ($10.21 - $8.50) / $8.50 = 20.1%
Downside (to conservative): ($6.78 - $8.50) / $8.50 = -20.2%
Margin of Safety: 20.2% (based on conservative scenario)
```

---

## Step 11: Calculate Confidence Score

**Factors affecting confidence:**

1. **Data Quality**: Are all 4 years of data available?
   - All 4 years available: +0.2
   - Only 3 years available: +0.1
   - Only 2 years available: 0
   - Only 1 year available: -0.1

2. **Earnings Stability**: How stable is NOPAT across 4 years?
   - Standard deviation of NOPAT < 10% of mean: +0.2
   - Standard deviation 10-20%: +0.1
   - Standard deviation 20-30%: 0
   - Standard deviation > 30%: -0.1

3. **Growth Rate Validity**: Is g < WACC?
   - g < WACC: +0.1
   - g ≥ WACC (adjusted): 0

4. **Base Confidence**: 0.6 (60%)

**Formula:**
```
Confidence = 0.6 + Data Quality Factor + Stability Factor + Growth Factor
```

**Range:** 0.3 (30%) to 0.9 (90%)

### Example

```
All 4 years available: +0.2
NOPAT std dev = 8%: +0.2
g < WACC: +0.1
Base: 0.6

Confidence = 0.6 + 0.2 + 0.2 + 0.1 = 1.1 → capped at 0.9 (90%)
```

---

## Step 12: Generate Valuation Output

### Output Structure

```
{
  "method": "EPV (Earning Power Value)",
  "scenarios": {
    "conservative": {
      "name": "Zero Growth",
      "growth_rate": 0,
      "nopat": $462.5M,
      "epv": $5,139M,
      "equity_value": $8,139M,
      "intrinsic_value_per_share": $6.78,
      "assessment": "FAIRLY_VALUED"
    },
    "base_case": {
      "name": "Market Growth",
      "growth_rate": 4%,
      "nopat": $462.5M,
      "epv": $9,250M,
      "equity_value": $12,250M,
      "intrinsic_value_per_share": $10.21,
      "assessment": "FAIRLY_VALUED"
    }
  },
  "valuation_range": {
    "low": $6.78,
    "high": $10.21,
    "midpoint": $8.50
  },
  "current_price": $8.50,
  "upside_to_base_case": 20.1%,
  "downside_to_conservative": -20.2%,
  "margin_of_safety": 20.2%,
  "confidence": 0.85,
  "assumptions": {
    "normalized_nopat": $462.5M,
    "wacc": 9%,
    "market_growth_rate": 4%,
    "tax_rate": 15%,
    "total_debt": $5,000M,
    "non_operating_cash": $8,000M,
    "diluted_shares_outstanding": 1,200M
  },
  "narrative": "EPV model suggests company is fairly valued at current price. Conservative scenario (zero growth) values stock at $6.78, while base case (4% growth) values at $10.21. Current price of $8.50 falls within this range with 20% margin of safety."
}
```

---

## Data Collection Requirements

### Financial Data Needed

For each of 4 periods (TTM, FY 2024, FY 2023, FY 2022):

- [ ] Revenue
- [ ] Operating Profit (EBIT) or Operating Margin %
- [ ] Effective Tax Rate
- [ ] Depreciation (for cash flow adjustments if needed)
- [ ] Capital Expenditures (to distinguish maintenance vs growth)

### Balance Sheet Data (Latest)

- [ ] Total Debt
- [ ] Cash & Equivalents
- [ ] Diluted Shares Outstanding

### Market Data

- [ ] Current Stock Price
- [ ] LLM will extract market consensus growth rate (no manual input needed)
- [ ] WACC: Fixed at 9% (no calculation needed)

---

## Key Advantages of This Approach

1. **4-Year Normalization**: Smooths cyclical variations and one-time events
2. **Dual Scenarios**: Provides valuation range instead of single point estimate
3. **Conservative + Base Case**: Allows investors to see upside and downside
4. **Transparent**: All assumptions clearly documented
5. **Robust**: Works even with negative or volatile cash flows
6. **Simple**: No complex multi-year projections needed

---

## Key Limitations

1. **Assumes Stability**: Assumes normalized NOPAT is sustainable
2. **No Cyclicality**: Doesn't account for cyclical business variations
3. **Terminal Value Risk**: Assumes perpetual operations
4. **WACC Sensitivity**: Still sensitive to WACC assumptions
5. **Growth Rate Risk**: Market growth estimates may be inaccurate

---

## Implementation Checklist

- [ ] Extract 4 years of financial data (TTM, FY 2024, FY 2023, FY 2022)
- [ ] Calculate NOPAT for each period
- [ ] Calculate 4-year normalized NOPAT
- [ ] Set WACC = 9% (fixed, no calculation needed)
- [ ] Use LLM to extract market consensus growth rate
  - [ ] Validate g_market < 9% (cap at 8% if needed)
  - [ ] Default to 3% if LLM extraction fails
- [ ] Calculate EPV for zero growth scenario (g = 0%)
- [ ] Calculate EPV for market growth scenario (g = g_market)
- [ ] Calculate equity value for both scenarios
- [ ] Calculate intrinsic value per share for both scenarios
- [ ] Determine valuation range
- [ ] Calculate confidence score (adjusted by LLM confidence)
- [ ] Generate assessment and narrative
- [ ] Compare to current price
- [ ] Document all assumptions (including LLM sources)
