# Earning Power Value (EPV) Valuation Model

## Overview

The Earning Power Value (EPV) model is a simplified DCF approach that values a company based on its sustainable earning power without assuming growth. It's ideal for:
- Mature companies with stable earnings
- Companies with uncertain or negative growth
- Companies in distress or turnaround situations
- When growth assumptions are unreliable

The EPV model has two variants:
1. **EPV with NO GROWTH**: For stable, mature companies
2. **EPV with GROWTH**: For companies with sustainable growth potential

---

## Formula Structure

### Step 1: Calculate Sustainable Net Operating Profit After Tax (NOPAT)

**NOPAT** represents the sustainable operating profit available to all investors (debt and equity holders).

#### Method A: Build from Income Statement
```
Revenue
(-) Cost of Goods Sold (COGS)
(=) Gross Profit
(-) Total Operating Expenses:
    - R&D
    - SG&A (Selling, General & Administrative)
    - Wages
    - Depreciation (from cash flow statement)
(=) Operating Profit (EBIT)
(+/-) Over/under depreciation adjustments
(+) Expenses related to growth (growth capex/others)
(+/-) Extraordinary items
(=) Adjusted Operating Profit
(-) Effective tax rate (applied to operating profit)
(=) **Sustainable NOPAT**
```

#### Method B: Simplified Formula
```
NOPAT = Revenue × Operating Margin - Taxes on Operating Profit
      = Revenue × Operating Margin × (1 - Tax Rate)
```

### Step 2: EPV with NO GROWTH (Gordon Growth Model - Zero Growth)

Used when company has stable, mature operations with no expected growth.

**Formula:**
```
EPV (No Growth) = NOPAT / WACC
```

Where:
- **NOPAT** = Sustainable Net Operating Profit After Tax (in dollars)
- **WACC** = Weighted Average Cost of Capital (as decimal, e.g., 0.09 for 9%)

**Example:**
```
NOPAT = $500M
WACC = 9%
EPV (No Growth) = $500M / 0.09 = $5,556M
```

### Step 3: EPV with GROWTH (Gordon Growth Model - With Growth)

Used when company has sustainable growth potential.

**Formula:**
```
EPV (With Growth) = NOPAT / (WACC - g)
```

Where:
- **NOPAT** = Sustainable Net Operating Profit After Tax
- **WACC** = Weighted Average Cost of Capital
- **g** = Sustainable long-term growth rate (as decimal, e.g., 0.03 for 3%)

**Constraints:**
- Growth rate (g) MUST be less than WACC
- If g ≥ WACC, the formula is unstable and should not be used
- Growth rate should be sustainable long-term (typically 0-4% for mature companies)

**Example:**
```
NOPAT = $500M
WACC = 9%
g = 3%
EPV (With Growth) = $500M / (0.09 - 0.03) = $500M / 0.06 = $8,333M
```

### Step 4: Calculate Enterprise Value

**Enterprise Value (EV)** = EPV (No Growth or With Growth)

### Step 5: Calculate Equity Value

**Equity Value** = Enterprise Value - Net Debt

Where:
- **Net Debt** = Total Debt - Non-operating Cash

**Formula:**
```
Equity Value = EPV - Debt + Non-operating Cash
```

### Step 6: Calculate Per Share Value

**Intrinsic Value per Share** = Equity Value / Diluted Shares Outstanding

**Formula:**
```
Intrinsic Value per Share = (EPV - Debt + Non-operating Cash) / Diluted Shares Outstanding
```

---

## Key Differences: EPV vs Traditional DCF

| Aspect | Traditional DCF | EPV Model |
|--------|-----------------|-----------|
| **Growth Assumption** | Explicit multi-year growth rates | No growth (or minimal sustainable growth) |
| **Projection Period** | 5-10 years + terminal value | Perpetuity (infinite horizon) |
| **Formula** | Complex (sum of PV of cash flows) | Simple (NOPAT / WACC or NOPAT / (WACC - g)) |
| **Best For** | High-growth companies | Mature, stable companies |
| **Sensitivity** | Very sensitive to growth assumptions | Less sensitive (uses sustainable rate) |
| **Negative Cash Flow** | Breaks down | Still applicable if NOPAT is positive |
| **Calculation** | Multiple years of projections | Single-year sustainable earnings |

---

## Valuation Methodology Steps

### Step 1: Gather Financial Data

From financial statements, collect:
- **Income Statement**: Revenue, COGS, Operating Expenses (R&D, SG&A, Wages), Depreciation, EBIT, Tax Rate
- **Cash Flow Statement**: Depreciation, Capital Expenditures (Maintenance vs Growth)
- **Balance Sheet**: Total Debt, Cash & Equivalents, Shares Outstanding (diluted)

### Step 2: Calculate Operating Margin

```
Operating Margin = Operating Profit / Revenue
                 = EBIT / Revenue
```

### Step 3: Adjust for Sustainable Operations

Make adjustments for:
- **Over/Under Depreciation**: If depreciation doesn't match actual maintenance capex
- **Growth Capex**: Separate maintenance capex from growth capex
- **Extraordinary Items**: Remove one-time gains/losses
- **Tax Rate**: Use effective tax rate (actual taxes paid / taxable income)

### Step 4: Calculate NOPAT

```
NOPAT = Revenue × Operating Margin × (1 - Tax Rate)
```

Or using adjusted operating profit:
```
NOPAT = Adjusted Operating Profit × (1 - Tax Rate)
```

### Step 5: Determine WACC

```
WACC = (E/V × Cost of Equity) + (D/V × Cost of Debt × (1 - Tax Rate))
```

Where:
- **E/V** = Equity as % of total value
- **D/V** = Debt as % of total value
- **Cost of Equity** = Risk-free rate + Beta × Market risk premium
- **Cost of Debt** = Interest expense / Total debt

For simplicity, use industry average WACC or assume 8-10% for mature companies.

### Step 6: Determine Growth Rate (if using EPV with Growth)

For sustainable growth:
```
g = ROE × Retention Ratio
  = ROE × (1 - Dividend Payout Ratio)
```

Or use conservative estimate:
- Mature companies: 2-3%
- Stable growth companies: 3-5%
- High-growth companies: Not suitable for EPV model

### Step 7: Calculate EPV

**If no growth expected:**
```
EPV = NOPAT / WACC
```

**If sustainable growth expected:**
```
EPV = NOPAT / (WACC - g)
```

**Validation:** Ensure g < WACC, otherwise formula is invalid.

### Step 8: Calculate Equity Value

```
Equity Value = EPV - Total Debt + Non-operating Cash
```

### Step 9: Calculate Per Share Intrinsic Value

```
Intrinsic Value per Share = Equity Value / Diluted Shares Outstanding
```

### Step 10: Determine Valuation Assessment

Compare intrinsic value to current price:
- **Intrinsic Value > Current Price × 1.2**: UNDERVALUED (20%+ margin of safety)
- **Intrinsic Value × 0.8 < Current Price < Intrinsic Value × 1.2**: FAIRLY VALUED
- **Current Price > Intrinsic Value × 1.2**: OVERVALUED

---

## Example Calculation: BIDU

### Given Data
- **Revenue**: $15,000M (annual)
- **Operating Margin**: 15% (EBIT / Revenue)
- **Tax Rate**: 15%
- **WACC**: 9%
- **Growth Rate**: 3% (sustainable)
- **Total Debt**: $5,000M
- **Non-operating Cash**: $8,000M
- **Diluted Shares Outstanding**: 1,200M

### Calculation

**Step 1: Calculate NOPAT**
```
NOPAT = Revenue × Operating Margin × (1 - Tax Rate)
      = $15,000M × 0.15 × (1 - 0.15)
      = $15,000M × 0.15 × 0.85
      = $1,912.5M
```

**Step 2: Calculate EPV with Growth**
```
EPV = NOPAT / (WACC - g)
    = $1,912.5M / (0.09 - 0.03)
    = $1,912.5M / 0.06
    = $31,875M
```

**Step 3: Calculate Equity Value**
```
Equity Value = EPV - Debt + Non-operating Cash
             = $31,875M - $5,000M + $8,000M
             = $34,875M
```

**Step 4: Calculate Intrinsic Value per Share**
```
Intrinsic Value per Share = Equity Value / Diluted Shares Outstanding
                          = $34,875M / 1,200M
                          = $29.06 per share
```

**Step 5: Assessment**
```
Current Price = $100 per share
Intrinsic Value = $29.06 per share
Assessment: OVERVALUED (current price > intrinsic value)
```

---

## Advantages of EPV Model

1. **Simple**: Only requires current year financials, not multi-year projections
2. **Robust**: Works for companies with uncertain or negative growth
3. **Less Sensitive**: Not overly dependent on growth rate assumptions
4. **Transparent**: Easy to explain and understand
5. **Flexible**: Can be adjusted for company-specific factors

---

## Limitations of EPV Model

1. **Assumes Stability**: Assumes current NOPAT is sustainable
2. **No Growth**: Undervalues companies with genuine growth potential
3. **Terminal Value Risk**: Assumes perpetual operations (company never declines)
4. **WACC Sensitivity**: Still sensitive to WACC assumptions
5. **Not for Startups**: Unsuitable for high-growth or pre-revenue companies

---

## When to Use EPV vs Traditional DCF

**Use EPV when:**
- Company is mature and stable
- Growth is uncertain or negative
- Company is in distress or turnaround
- You want a simple, conservative valuation
- Multi-year projections are unreliable

**Use Traditional DCF when:**
- Company has clear growth trajectory
- You can reliably project 5-10 years of cash flows
- Company is in high-growth phase
- You want to capture value creation from growth

---

## Implementation Checklist

- [ ] Gather financial data (revenue, operating margin, tax rate, debt, cash, shares)
- [ ] Calculate sustainable NOPAT
- [ ] Determine WACC (use 8-10% if unknown)
- [ ] Decide: No growth or sustainable growth?
- [ ] Calculate EPV using appropriate formula
- [ ] Calculate equity value (EPV - debt + cash)
- [ ] Calculate intrinsic value per share
- [ ] Compare to current price
- [ ] Determine assessment (undervalued/fairly valued/overvalued)
- [ ] Document assumptions and limitations
