# Valuation Agent: Data Requirements & Usage Analysis

## Overview
The valuation agent uses 4 methods to estimate intrinsic value: DCF, Comparable Company, DDM (Dividend Discount Model), and Asset-Based. This document outlines what data each method needs, what's currently available, and what's missing.

---

## Data Available from yfinanceWrapper

### Current Financial Data (Annual)
```
financials[]: {
  revenue: number
  netIncome: number
  eps: number
  period: string (date)
  fiscalYear: number
  operatingIncome?: number
  freeCashFlow?: number
  revenueGrowth?: number
  earningsGrowth?: number
}
```

### Quarterly Financial Data
```
quarterlyFinancials[]: {
  revenue: number
  netIncome: number
  eps: number
  period: string (date)
  quarter: string (e.g., "2025-Q3")
  fiscalYear: number
  operatingIncome?: number
  freeCashFlow?: number
}
```

### Stock Price Data
```
price: {
  current: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  timestamp: Date
}
```

### Company Profile
```
profile?: {
  sector: string
  industry: string
  description: string
  employees?: number
  website?: string
}
```

### Key Metrics
```
sharesOutstanding?: number (in millions)
ratios?: {
  pe?: number
  pb?: number
  ps?: number
  roe?: number
  roic?: number
  debtToEquity?: number
  currentRatio?: number
  grossMargin?: number
  operatingMargin?: number
  netMargin?: number
  revenueGrowth?: number
  earningsGrowth?: number
}
```

### Data Quality Flags
```
dataQualityFlags?: {
  debtToEquityAnomalous?: boolean
  roicZero?: boolean
  interestCoverageZero?: boolean
  peNegative?: boolean
  marketCapZero?: boolean
  pbAnomalous?: boolean
  peAnomalous?: boolean
  roeNegative?: boolean
  currentRatioAnomalous?: boolean
  leverageTrend?: string
  liquidityTrend?: string
  revenueDecline?: boolean
  earningsCollapse?: boolean
}
```

---

## Valuation Method: DCF (Discounted Cash Flow)

### Purpose
Estimates intrinsic value based on projected free cash flows discounted to present value.

### Data Required
| Data Point | Purpose | Available? | Notes |
|-----------|---------|-----------|-------|
| **Historical FCF (3-5 years)** | Establish FCF trend | ❌ MISSING | Only current FCF available, not historical |
| **FCF Growth Rate** | Project future cash flows | ✅ PARTIAL | Using growthCalculator with TTM vs FY logic |
| **WACC (Weighted Avg Cost of Capital)** | Discount rate | ❌ MISSING | Calculated but needs: debt, equity, tax rate, risk-free rate, market risk premium |
| **Terminal Growth Rate** | Long-term growth assumption | ✅ YES | Hardcoded to 2.5% |
| **Shares Outstanding** | Calculate per-share value | ✅ YES | Available in financialData |
| **Current Price** | Calculate upside | ✅ YES | Available in price data |

### Current Implementation
- ✅ Uses TTM vs FY growth rate from growthCalculator
- ✅ Projects FCF for 5 years
- ✅ Calculates terminal value
- ✅ Discounts to present value
- ❌ **PROBLEM**: No historical FCF data to validate trend
- ❌ **PROBLEM**: WACC calculation is incomplete (uses placeholder values)

### Missing Data to Improve DCF
1. **Historical FCF (3-5 years)** - Need quarterly/annual FCF history
2. **Debt & Equity Structure** - For accurate WACC calculation
3. **Tax Rate** - For WACC calculation
4. **Risk-Free Rate & Market Risk Premium** - For cost of equity calculation
5. **Operating Cash Flow** - To calculate FCF from OCF - CapEx

### Confidence Level
**Current: 60-85%** (depends on FCF growth rate validity)
- High confidence if FCF growth is 0-50%
- Low confidence if FCF is negative or growth > 50%

---

## Valuation Method: Comparable Company (P/E, P/B, P/S)

### Purpose
Estimates value using industry multiples applied to company metrics.

### Data Required
| Data Point | Purpose | Available? | Notes |
|-----------|---------|-----------|-------|
| **EPS (Earnings Per Share)** | P/E valuation | ✅ YES | Available in financials |
| **Book Value Per Share** | P/B valuation | ❌ MISSING | Need total assets - total liabilities |
| **Revenue Per Share** | P/S valuation | ✅ YES | Can calculate: revenue / sharesOutstanding |
| **Industry P/E Multiple** | Apply to EPS | ✅ YES | Hardcoded to 20x (S&P 500 avg) |
| **Industry P/B Multiple** | Apply to book value | ✅ YES | Hardcoded to 3.0x |
| **Industry P/S Multiple** | Apply to revenue/share | ✅ YES | Hardcoded to 2.0x |
| **Current Stock Price** | Calculate upside | ✅ YES | Available in price data |
| **Shares Outstanding** | Calculate per-share metrics | ✅ YES | Available in financialData |

### Current Implementation
- ✅ Calculates P/E valuation (EPS × 20x)
- ✅ Calculates P/S valuation (revenue/share × 2.0x)
- ❌ P/B valuation incomplete (needs balance sheet data)
- ✅ Averages valid valuations
- ✅ Filters anomalous values (< $0.01 or > $10,000)

### Missing Data to Improve Comparable
1. **Balance Sheet Data** - Total assets, total liabilities, shareholders' equity
2. **Dynamic Industry Multiples** - Currently hardcoded; should use actual sector averages
3. **Peer Group Data** - Actual comparable company multiples
4. **Market Cap** - For market-cap-weighted valuation

### Confidence Level
**Current: 50-75%**
- High confidence if 2+ valuation methods available
- Low confidence if only 1 method available
- **Problem**: Using S&P 500 average (20x P/E) for all companies is unrealistic

---

## Valuation Method: DDM (Dividend Discount Model)

### Purpose
Estimates value based on present value of future dividend payments.

### Data Required
| Data Point | Purpose | Available? | Notes |
|-----------|---------|-----------|-------|
| **Dividend Yield** | Current dividend payout | ❌ MISSING | Not in ratios structure |
| **Dividend History (3-5 years)** | Establish dividend trend | ❌ MISSING | No dividend data available |
| **Dividend Growth Rate** | Project future dividends | ✅ PARTIAL | Using revenue growth as proxy (50% of revenue growth, max 8%) |
| **Required Return (Cost of Equity)** | Discount rate | ✅ PARTIAL | Hardcoded to 10% |
| **Current Stock Price** | Calculate upside | ✅ YES | Available in price data |

### Current Implementation
- ❌ **CRITICAL ISSUE**: Dividend yield hardcoded to 0
- ✅ Uses revenue growth as proxy for dividend growth
- ✅ Uses Gordon Growth Model: Value = D1 / (r - g)
- ✅ Conservative dividend growth (50% of revenue growth, max 8%)
- ✅ Applies TTM vs FY logic to growth rate

### Missing Data to Improve DDM
1. **Dividend Yield** - Current annual dividend / stock price
2. **Dividend Payment History** - Last 5 years of dividends
3. **Payout Ratio** - Dividends / net income
4. **Cost of Equity** - Should calculate from CAPM, not hardcode to 10%

### Confidence Level
**Current: 0%** (returns UNABLE_TO_VALUE for all non-dividend stocks)
- **Problem**: DDM only works for dividend-paying companies
- **Problem**: Dividend yield is hardcoded to 0

### When DDM is Applicable
- Companies with consistent dividend history (5+ years)
- Mature, stable companies (utilities, REITs, dividend aristocrats)
- **NOT applicable**: Growth companies, tech stocks, companies with no dividends

---

## Valuation Method: Asset-Based (Book Value)

### Purpose
Estimates value based on net asset value (total assets - total liabilities).

### Data Required
| Data Point | Purpose | Available? | Notes |
|-----------|---------|-----------|-------|
| **Total Assets** | Calculate shareholder equity | ❌ MISSING | Not in financialData |
| **Total Liabilities** | Calculate shareholder equity | ❌ MISSING | Not in financialData |
| **Intangible Assets** | Adjust for goodwill/patents | ❌ MISSING | Not available |
| **Tangible Book Value Per Share** | Per-share valuation | ❌ MISSING | Need balance sheet data |
| **Shares Outstanding** | Calculate per-share value | ✅ YES | Available in financialData |
| **ROE (Return on Equity)** | Assess asset quality | ✅ YES | Available in ratios |

### Current Implementation
- ❌ **CRITICAL ISSUE**: Total assets and liabilities hardcoded to 0
- ❌ Returns UNABLE_TO_VALUE for all companies
- ✅ Uses ROE growth from growthCalculator to assess asset quality
- ✅ Adjusts for intangible assets (reduces equity by 20%)

### Missing Data to Improve Asset-Based
1. **Total Assets** - From balance sheet
2. **Total Liabilities** - From balance sheet
3. **Goodwill & Intangibles** - From balance sheet
4. **Tangible Book Value** - Assets - Liabilities - Intangibles
5. **Debt Structure** - For leverage analysis

### Confidence Level
**Current: 0%** (returns UNABLE_TO_VALUE for all companies)
- **Problem**: Balance sheet data completely missing
- **Note**: Asset-based valuation is generally unreliable for tech/service companies (low confidence even with data)

### When Asset-Based is Applicable
- Asset-heavy businesses (real estate, manufacturing, utilities)
- Banks and financial institutions
- **NOT applicable**: Tech companies, service companies, intangible-heavy businesses

---

## Summary: Data Availability Matrix

| Data | DCF | Comparable | DDM | Asset-Based | Status |
|-----|-----|-----------|-----|-------------|--------|
| **Annual Financials** | ✅ | ✅ | ✅ | ✅ | Available |
| **Quarterly Financials** | ✅ | ✅ | ✅ | ✅ | Available |
| **Stock Price** | ✅ | ✅ | ✅ | ✅ | Available |
| **Shares Outstanding** | ✅ | ✅ | ✅ | ✅ | Available |
| **Growth Rates (TTM vs FY)** | ✅ | ✅ | ✅ | ✅ | Available |
| **Historical FCF** | ❌ | - | - | - | MISSING |
| **WACC Components** | ❌ | - | - | - | MISSING |
| **Dividend Data** | - | - | ❌ | - | MISSING |
| **Balance Sheet** | - | ❌ | - | ❌ | MISSING |
| **Industry Multiples** | - | ⚠️ | - | - | HARDCODED |

---

## Current Valuation Method Reliability

### ✅ DCF: Moderately Reliable (60-85% confidence)
- **Strengths**: Uses TTM vs FY growth logic, projects 5 years, calculates terminal value
- **Weaknesses**: No historical FCF validation, WACC incomplete, sensitive to growth assumptions
- **Recommendation**: Improve WACC calculation and add FCF history validation

### ⚠️ Comparable: Partially Reliable (50-75% confidence)
- **Strengths**: Uses multiple valuation methods (P/E, P/S), filters anomalies
- **Weaknesses**: Hardcoded industry multiples, no P/B valuation, unrealistic for sector-specific companies
- **Recommendation**: Fetch actual sector multiples, add balance sheet data for P/B

### ❌ DDM: Not Applicable (0% confidence)
- **Strengths**: Correct Gordon Growth Model implementation
- **Weaknesses**: Dividend yield hardcoded to 0, no dividend history
- **Recommendation**: Fetch dividend data from yfinance, only apply to dividend payers

### ❌ Asset-Based: Not Applicable (0% confidence)
- **Strengths**: Considers intangible asset adjustments
- **Weaknesses**: Balance sheet data completely missing, returns UNABLE_TO_VALUE
- **Recommendation**: Fetch balance sheet data, only apply to asset-heavy companies

---

## Priority: Data to Fetch from yfinance

### High Priority (Needed for DCF improvement)
1. **Historical FCF** (3-5 years) - Validate FCF trend
2. **Operating Cash Flow** - To calculate FCF from OCF - CapEx
3. **Capital Expenditures** - For FCF calculation

### High Priority (Needed for Comparable improvement)
1. **Balance Sheet Data** - Total assets, liabilities, equity
2. **Actual Sector P/E, P/B, P/S Multiples** - Replace hardcoded values

### Medium Priority (Needed for DDM)
1. **Dividend Yield** - Current annual dividend / stock price
2. **Dividend Payment History** - Last 5 years

### Medium Priority (Needed for Asset-Based)
1. **Goodwill & Intangible Assets** - From balance sheet
2. **Tangible Book Value** - Assets - Liabilities - Intangibles

### Low Priority (WACC calculation)
1. **Debt Structure** - Total debt, interest expense
2. **Tax Rate** - Effective tax rate
3. **Risk-Free Rate** - Current 10-year Treasury yield
4. **Market Risk Premium** - Historical equity risk premium

---

## Recommended Implementation Roadmap

### Phase 1: Fix Comparable Company (Quick Win)
- [ ] Fetch balance sheet data from yfinance
- [ ] Add P/B valuation calculation
- [ ] Replace hardcoded multiples with sector averages
- **Impact**: Improve Comparable confidence from 50-75% to 70-85%

### Phase 2: Improve DCF (Medium Effort)
- [ ] Fetch historical FCF (3-5 years)
- [ ] Validate FCF trend before projection
- [ ] Improve WACC calculation (add debt/equity, tax rate)
- **Impact**: Improve DCF confidence from 60-85% to 75-90%

### Phase 3: Enable DDM (Medium Effort)
- [ ] Fetch dividend yield from yfinance
- [ ] Fetch dividend payment history
- [ ] Only apply DDM to dividend-paying companies
- **Impact**: Enable DDM for ~30-40% of stocks

### Phase 4: Enable Asset-Based (Medium Effort)
- [ ] Fetch balance sheet data
- [ ] Calculate tangible book value
- [ ] Only apply to asset-heavy companies
- **Impact**: Enable Asset-Based for ~20-30% of stocks

---

## Data Quality Considerations

### Current Limitations
1. **TTM Calculation**: Only works with Q2+ data; falls back to FY vs FY for Q1-only
2. **Missing Metrics**: Many companies have incomplete data (no FCF, no dividends, no balance sheet)
3. **Anomalous Values**: NaN values converted to null; need to handle gracefully
4. **Industry Assumptions**: Hardcoded multiples don't account for sector differences

### Recommendations
1. Add data completeness checks before running each valuation method
2. Display confidence scores based on data availability
3. Show which methods are applicable vs. not applicable for each stock
4. Add warnings when using fallback assumptions (e.g., "Using S&P 500 average P/E")

