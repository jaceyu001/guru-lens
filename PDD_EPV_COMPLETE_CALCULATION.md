# PDD (Pinduoduo) EPV Valuation - Complete Calculation Breakdown

## Overview
This document shows the complete step-by-step calculation for PDD's Earning Power Value (EPV) valuation using the simplified model with 4-year normalized operating income and fixed assumptions.

---

## Step 1: Extract Operating Income Data

### Quarterly Operating Income (Last 4 Quarters - TTM)
| Quarter | Date | Operating Income |
|---------|------|------------------|
| Q1 2025 | 2025-09-30 | $25.03B |
| Q2 2025 | 2025-06-30 | $25.79B |
| Q3 2025 | 2025-03-31 | $16.09B |
| Q4 2024 | 2024-12-31 | $25.59B |
| **TTM Total** | | **$92.50B** |

### Annual Operating Income (Last 3 Years)
| Fiscal Year | Date | Operating Income |
|-------------|------|------------------|
| FY 2024 | 2024-12-31 | $108.42B |
| FY 2023 | 2023-12-31 | $58.70B |
| FY 2022 | 2022-12-31 | $30.40B |

---

## Step 2: Calculate 4-Year Normalized Operating Income

**Data Points Used:**
- TTM (Trailing Twelve Months): $92.50B
- FY 2024: $108.42B
- FY 2023: $58.70B
- FY 2022: $30.40B

**Formula:**
```
Normalized Operating Income = (TTM + FY2024 + FY2023 + FY2022) / 4
```

**Calculation:**
```
= ($92.50B + $108.42B + $58.70B + $30.40B) / 4
= $290.02B / 4
= $72.505B
```

**Result: Normalized Operating Income = $72.51B**

---

## Step 3: Calculate NOPAT (Net Operating Profit After Tax)

**Formula:**
```
NOPAT = Normalized Operating Income × (1 - Tax Rate)
```

**Assumptions:**
- Fixed Tax Rate: 15%

**Calculation:**
```
NOPAT = $72.51B × (1 - 0.15)
      = $72.51B × 0.85
      = $61.63B
```

**Result: NOPAT = $61.63B**

---

## Step 4: Calculate Enterprise Value (EPV)

### Scenario A: Conservative (Zero Growth)

**Formula:**
```
EPV = NOPAT / WACC
```

**Assumptions:**
- WACC (Weighted Average Cost of Capital): 9.0%
- Growth Rate: 0%

**Calculation:**
```
EPV_Conservative = $61.63B / 0.09
                 = $684.78B
```

**Result: Enterprise Value (Conservative) = $684.78B**

---

### Scenario B: Base Case (Market Growth)

**Formula:**
```
EPV = NOPAT / (WACC - g)
```

**Assumptions:**
- WACC: 9.0%
- Market Growth Rate: 8.0% (from LLM analysis of analyst consensus)

**Calculation:**
```
EPV_BaseCase = $61.63B / (0.09 - 0.08)
             = $61.63B / 0.01
             = $6,163.00B
```

**Result: Enterprise Value (Base Case) = $6,163.00B**

---

## Step 5: Adjust for Debt and Cash to Get Equity Value

### Balance Sheet Data
| Item | Amount |
|------|--------|
| Total Debt (Current + Long-Term) | $0.00B |
| Cash and Cash Equivalents | $57.77B |

### Formula:
```
Equity Value = Enterprise Value - Total Debt + Cash & Equivalents
```

### Conservative Scenario:
```
Equity Value_Conservative = $684.78B - $0.00B + $57.77B
                          = $742.55B
```

### Base Case Scenario:
```
Equity Value_BaseCase = $6,163.00B - $0.00B + $57.77B
                      = $6,220.77B
```

---

## Step 6: Calculate Intrinsic Value Per Share

### Shares Outstanding
- Diluted Shares Outstanding: 1.42B shares

### Formula:
```
Intrinsic Value Per Share = Equity Value / Diluted Shares Outstanding
```

### Conservative Scenario:
```
Intrinsic Value_Conservative = $742.55B / 1.42B
                             = $523.21 per share
```

### Base Case Scenario:
```
Intrinsic Value_BaseCase = $6,220.77B / 1.42B
                         = $4,381.67 per share
```

---

## Step 7: Valuation Assessment

### Current Market Data
- Current Stock Price: $106.39 per share

### Valuation Range
| Scenario | Intrinsic Value | vs Current Price | Upside/(Downside) |
|----------|-----------------|------------------|-------------------|
| Conservative (0% g) | $523.21 | $106.39 | +391.6% |
| Base Case (8% g) | $4,381.67 | $106.39 | +4,017.3% |
| **Valuation Range** | **$523.21 - $4,381.67** | | |

### Assessment
- **Conservative Valuation**: $523.21/share (391.6% upside)
- **Base Case Valuation**: $4,381.67/share (4,017.3% upside)
- **Current Price**: $106.39/share
- **Margin of Safety**: (($523.21 - $106.39) / $523.21) × 100 = **79.6%**

**Conclusion: UNDERVALUED**

---

## Step 8: Confidence Assessment

### Confidence Factors
| Factor | Score | Rationale |
|--------|-------|-----------|
| Data Availability | +0.20 | 4 years of data available (TTM + 3 FY) |
| Data Quality | +0.10 | All required fields present and normalized |
| LLM Growth Confidence | +0.10 | Medium confidence from analyst consensus |
| Base Confidence | 0.60 | Standard baseline |
| **Total Confidence** | **0.80 (80%)** | |

---

## Summary Table

| Metric | Value |
|--------|-------|
| **Normalized Operating Income** | $72.51B |
| **NOPAT (15% tax)** | $61.63B |
| **WACC** | 9.0% |
| **Market Growth Rate** | 8.0% |
| **Enterprise Value (Conservative)** | $684.78B |
| **Enterprise Value (Base Case)** | $6,163.00B |
| **Total Debt** | $0.00B |
| **Cash & Equivalents** | $57.77B |
| **Equity Value (Conservative)** | $742.55B |
| **Equity Value (Base Case)** | $6,220.77B |
| **Diluted Shares** | 1.42B |
| **Intrinsic Value/Share (Conservative)** | **$523.21** |
| **Intrinsic Value/Share (Base Case)** | **$4,381.67** |
| **Current Market Price** | $106.39 |
| **Upside to Conservative** | 391.6% |
| **Upside to Base Case** | 4,017.3% |
| **Margin of Safety** | 79.6% |
| **Confidence Level** | 80% |
| **Assessment** | **UNDERVALUED** |

---

## Key Assumptions & Limitations

### Fixed Assumptions
1. **WACC**: Fixed at 9.0% for all companies
2. **Tax Rate**: Fixed at 15% for all companies
3. **Market Growth Rate**: Extracted via LLM from analyst consensus (8.0% for PDD)

### Data Quality Notes
- ✅ All 4 years of data available (TTM + 3 FY)
- ✅ Operating income properly extracted from quarterly and annual statements
- ✅ Balance sheet data confirmed (zero debt, $57.77B cash)
- ✅ Diluted shares properly normalized to billions

### Limitations
1. **Extreme Base Case Valuation**: The 8% growth rate is very close to the 9% WACC, resulting in extremely high valuation. This is mathematically correct but may not reflect realistic market conditions.
2. **No Growth Validation**: The LLM-estimated 8% growth rate should be validated against company guidance and industry trends.
3. **Terminal Value Assumption**: Assumes PDD can maintain normalized operating income indefinitely.
4. **Cyclical Business**: E-commerce is cyclical; normalized OI may not be sustainable through all cycles.
5. **Competitive Pressure**: Chinese tech companies face regulatory and competitive risks not captured in this model.

### Recommendation
- Use the **Conservative scenario ($523/share)** as a more realistic floor valuation
- Treat the **Base Case ($4,382/share)** as an optimistic scenario requiring growth rate validation
- Consider triangulating with Comparable Multiples and Dividend Discount Model for comprehensive analysis

---

## Calculation Verification

### Cross-Check: Conservative Scenario
```
NOPAT / WACC = $61.63B / 0.09 = $684.78B ✓
Equity Value = $684.78B + $57.77B = $742.55B ✓
Per Share = $742.55B / 1.42B = $523.21 ✓
```

### Cross-Check: Base Case Scenario
```
NOPAT / (WACC - g) = $61.63B / 0.01 = $6,163.00B ✓
Equity Value = $6,163.00B + $57.77B = $6,220.77B ✓
Per Share = $6,220.77B / 1.42B = $4,381.67 ✓
```

All calculations verified ✓
