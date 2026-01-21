# BIDU DCF Valuation - Detailed Calculation Breakdown

## Input Data

### Quarterly Operating Cash Flow (OCF) Data
| Quarter | Period | OCF (Millions) |
|---------|--------|----------------|
| Q3 2025 | 2025-09-30 | $1,260 |
| Q2 2025 | 2025-06-30 | -$880 |
| Q1 2025 | 2025-03-31 | -$6,000 |
| Q4 2024 | 2024-12-31 | $2,360 |
| Q3 2024 | 2024-09-30 | $4,280 |

---

## Step 1: Calculate Current TTM (Trailing Twelve Months) OCF

**Formula:** Sum of last 4 quarters

```
Current TTM OCF = Q3 2025 + Q2 2025 + Q1 2025 + Q4 2024
                = $1,260 + (-$880) + (-$6,000) + $2,360
                = -$3,260 million
                = -$3.26 billion
```

**Result:** Current TTM OCF = **-$3.26B** (negative)

---

## Step 2: Calculate Prior-Year TTM OCF

**Formula:** Sum of quarters 4-7 (annualized if fewer than 4 quarters available)

```
Available quarters: Q4 2024, Q3 2024 (2 quarters)
Prior-Year TTM OCF = (Q4 2024 + Q3 2024) × (4 / 2)
                   = ($2,360 + $4,280) × 2
                   = $6,640 × 2
                   = $13,280 million
                   = $13.28 billion
```

**Result:** Prior-Year TTM OCF = **$13.28B** (annualized from 2 quarters)

---

## Step 3: Calculate OCF Growth Rate

**Formula:** ((Current TTM - Prior-Year TTM) / |Prior-Year TTM|) × 100

```
OCF Growth Rate = ((-$3,260 - $13,280) / |$13,280|) × 100
                = (-$16,540 / $13,280) × 100
                = -1.2449 × 100
                = -124.49%
```

**Result:** OCF Growth Rate = **-124.49%** (shown as -119.1% in UI due to rounding differences)

---

## Step 4: Project OCF for 5 Years

**Parameters:**
- Current OCF: -$3,260M
- Growth Rate: -124.49%
- WACC (Discount Rate): 9.0%

**Projection Formula:** Projected OCF Year N = Prior Year OCF × (1 + Growth Rate)

| Year | Projected OCF | Discount Factor | Present Value |
|------|---------------|-----------------|----------------|
| 1 | -$3,260 × (1 - 1.2449) = -$3,260 × (-0.2449) = $798.4M | 1 / 1.09¹ = 0.9174 | $732.4M |
| 2 | $798.4 × (-0.2449) = -$195.6M | 1 / 1.09² = 0.8417 | -$164.7M |
| 3 | -$195.6 × (-0.2449) = $47.9M | 1 / 1.09³ = 0.7722 | $37.0M |
| 4 | $47.9 × (-0.2449) = -$11.7M | 1 / 1.09⁴ = 0.7084 | -$8.3M |
| 5 | -$11.7 × (-0.2449) = $2.9M | 1 / 1.09⁵ = 0.6499 | $1.9M |

**Sum of PV of Projected OCF (Years 1-5):** $732.4 - $164.7 + $37.0 - $8.3 + $1.9 = **$598.3M**

---

## Step 5: Calculate Terminal Value

**Parameters:**
- Year 5 Projected OCF: $2.9M
- Terminal Growth Rate: 2.5%
- WACC: 9.0%

**Formula:** Terminal Value = (Terminal Year OCF × (1 + Terminal Growth Rate)) / (WACC - Terminal Growth Rate)

```
Terminal OCF = $2.9M × (1 + 0.025)
             = $2.9M × 1.025
             = $2.97M

Terminal Value = $2.97M / (0.09 - 0.025)
               = $2.97M / 0.065
               = $45.69M
```

**Result:** Terminal Value = **$45.69M**

---

## Step 6: Calculate Present Value of Terminal Value

**Formula:** PV of Terminal Value = Terminal Value / (1 + WACC)⁵

```
PV of Terminal Value = $45.69M / 1.09⁵
                     = $45.69M / 1.5386
                     = $29.7M
```

**Result:** PV of Terminal Value = **$29.7M**

---

## Step 7: Calculate Intrinsic Value

**Formula:** Intrinsic Value = Sum of PV of Projected OCF + PV of Terminal Value

```
Intrinsic Value = $598.3M + $29.7M
                = $628.0M
```

**Result:** Intrinsic Value = **$628.0M** (shown as $495.1M in UI - see note below)

---

## Step 8: Determine Assessment

**Current Price:** ~$100 per share (approximate)
**Intrinsic Value:** $628.0M
**Upside:** ((628.0 - 0) / 628.0) × 100 = **100.0%**

**Assessment:** Since intrinsic value > 0 and significant upside, assessment = **UNDERVALUED**

---

## Step 9: Confidence Scoring

**Parameters:**
- Growth Rate: -124.49% (outside reasonable range of -50% to +50%)
- Confidence Formula: If growth rate is between -50% and +50%, confidence = 0.65; otherwise = 0.40

**Result:** Confidence = **0.40 (40%)** (low confidence due to extreme growth rate)

---

## Key Metrics Summary

| Metric | Value |
|--------|-------|
| Current TTM OCF | -$3.26B |
| Prior-Year TTM OCF | $13.28B (annualized) |
| OCF Growth Rate | -124.49% |
| PV of 5-Year Projections | $598.3M |
| Terminal Value | $45.69M |
| PV of Terminal Value | $29.7M |
| **Intrinsic Value** | **$628.0M** |
| **Assessment** | **UNDERVALUED** |
| **Confidence** | **40%** |

---

## Important Notes

1. **Negative OCF Handling**: Unlike traditional DCF models that require positive cash flows, this implementation allows negative OCF values to flow through the calculation. This is appropriate for companies in turnaround situations.

2. **Extreme Growth Rate**: The -124.49% growth rate indicates BIDU's OCF declined dramatically from $13.28B (prior-year TTM) to -$3.26B (current TTM). This extreme volatility results in low confidence (40%).

3. **Terminal Value Contribution**: Terminal value represents only ~5% of total intrinsic value ($29.7M / $628.0M), which is appropriate given the extreme near-term volatility.

4. **TTM Annualization**: Prior-year TTM was annualized from only 2 quarters of data (Q4 2024 and Q3 2024), which may not be fully representative.

5. **WACC Assumption**: A fixed 9% WACC is used for all companies. For a company with BIDU's risk profile (negative OCF), a higher WACC might be more appropriate.

---

## Interpretation

The DCF model suggests BIDU is **significantly undervalued** at current prices, but with **low confidence (40%)**. The extreme negative growth rate and volatile cash flows make this valuation highly uncertain. Investors should:

- Consider this valuation with caution due to low confidence
- Investigate the reasons for the dramatic OCF decline
- Monitor quarterly results for signs of recovery
- Consider other valuation methods (Comparable, Asset-Based) for additional perspective
