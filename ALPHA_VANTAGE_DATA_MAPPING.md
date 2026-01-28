# Alpha Vantage API Data Mapping & Unit Conversion Guide

## Overview

This document maps Alpha Vantage API response fields to the internal data structure used by agents, including proper unit conversions.

---

## 1. PRICE DATA (GLOBAL_QUOTE)

### API Response Fields
| Field | API Key | Unit | Type | Example |
|-------|---------|------|------|---------|
| Price | `05. price` | USD (dollars) | String | "157.67" |
| Volume | `06. volume` | Shares | String | "12345678" |
| Change | `09. change` | USD (dollars) | String | "2.50" |
| Change % | `10. change percent` | Percentage (string with %) | String | "1.61%" |
| Trading Day | `07. latest trading day` | Date (YYYY-MM-DD) | String | "2026-01-28" |

### Internal Structure (quote)
```typescript
quote: {
  price: number,        // USD, e.g., 157.67
  volume: number,       // shares, e.g., 12345678
  change: number,       // USD, e.g., 2.50
  changePercent: number, // decimal, e.g., 1.61 (NOT 0.0161)
  timestamp: string,    // ISO string or YYYY-MM-DD
}
```

### Conversion Rules
- **Price**: Parse string to number, keep as USD
- **Volume**: Parse string to number, keep as shares
- **Change**: Parse string to number, keep as USD
- **Change %**: Remove "%" and parse to number (result is 1.61, not 0.0161)
- **Timestamp**: Use trading day or current date

---

## 2. COMPANY OVERVIEW (OVERVIEW)

### API Response Fields
| Field | API Key | Unit | Type | Example |
|-------|---------|------|------|---------|
| P/E Ratio | `PERatio` | Unitless | String | "14.06" |
| Price-to-Book | `PriceToBookRatio` | Unitless | String | "1.43" |
| Price-to-Sales | `PriceToSalesRatioTTM` | Unitless | String | "2.15" |
| ROE (TTM) | `ReturnOnEquityTTM` | Decimal 0-1 | String | "0.03" |
| ROA (TTM) | `ReturnOnAssetsTTM` | Decimal 0-1 | String | "0.015" |
| Dividend Yield | `DividendYield` | Decimal 0-1 | String | "0.012" |
| Market Cap | `MarketCapitalization` | USD (dollars) | String | "123456789000" |
| Company Name | `Name` | Text | String | "Baidu Inc." |
| Sector | `Sector` | Text | String | "Technology" |
| Industry | `Industry` | Text | String | "Internet Content & Information" |
| Exchange | `Exchange` | Text | String | "NASDAQ" |
| Currency | `Currency` | Text | String | "USD" |
| Description | `Description` | Text | String | "Baidu is a Chinese search engine..." |

### Internal Structure (ratios & profile)
```typescript
ratios: {
  pe: number | null,        // unitless, e.g., 14.06
  pb: number | null,        // unitless, e.g., 1.43
  ps: number | null,        // unitless, e.g., 2.15
  roe: number | null,       // decimal 0-1, e.g., 0.03 (NOT 3)
  roa: number | null,       // decimal 0-1, e.g., 0.015 (NOT 1.5)
  roic: number | null,      // decimal 0-1 (calculated if needed)
  dividendYield: number | null, // decimal 0-1, e.g., 0.012 (NOT 1.2)
  grossMargin: number | null,   // percentage 0-100, e.g., 45.5
  operatingMargin: number | null, // percentage 0-100, e.g., 15.3
  netMargin: number | null,     // percentage 0-100, e.g., 12.1
  currentRatio: number | null,  // unitless, e.g., 1.5
  debtToEquity: number | null,  // unitless, e.g., 0.45
  interestCoverage: number | null, // unitless
}

profile: {
  companyName: string,      // e.g., "Baidu Inc."
  sector: string,           // e.g., "Technology"
  industry: string,         // e.g., "Internet Content & Information"
  exchange: string,         // e.g., "NASDAQ"
  currency: string,         // e.g., "USD"
  marketCap: number,        // USD, e.g., 123456789000
  description: string | null,
  website: string | null,
  employees: number | null,
}
```

### Conversion Rules
- **P/E, P/B, P/S**: Parse string to number, keep unitless
- **ROE, ROA, Dividend Yield**: Parse string to decimal (0-1), **DO NOT multiply by 100**
  - API: "0.03" → Internal: 0.03 (represents 3%)
  - Display: 0.03 × 100 = 3% (multiply only for display)
- **Margins**: Calculate from income statement (see below)
- **Market Cap**: Parse string to number, keep as USD
- **Text fields**: Keep as-is

---

## 3. INCOME STATEMENT (INCOME_STATEMENT)

### API Response Fields (Annual & Quarterly)
| Field | API Key | Unit | Type | Example |
|-------|---------|------|------|---------|
| Fiscal Date | `fiscalDateEnding` | Date (YYYY-MM-DD) | String | "2024-12-31" |
| Total Revenue | `totalRevenue` | USD (dollars) | String | "12345678900" |
| Gross Profit | `grossProfit` | USD (dollars) | String | "5678900000" |
| Operating Income | `operatingIncome` | USD (dollars) | String | "1234567890" |
| Net Income | `netIncome` | USD (dollars) | String | "987654321" |

### Internal Structure (financials)
```typescript
financials: {
  annualReports: Array<{
    fiscalDateEnding: string,      // YYYY-MM-DD
    fiscalYear: number,            // extracted from date, e.g., 2024
    revenue: number,               // USD, e.g., 12345678900
    operatingIncome: number,       // USD, e.g., 1234567890
    netIncome: number,             // USD, e.g., 987654321
    grossProfit: number,           // USD, e.g., 5678900000
    totalAssets: number,           // USD (from balance sheet)
    totalLiabilities: number,      // USD (from balance sheet)
    totalEquity: number,           // USD (from balance sheet)
    operatingCashFlow: number,     // USD (from cash flow)
    capitalExpenditure: number,    // USD (from cash flow)
    freeCashFlow: number,          // USD (calculated: OCF - CapEx)
  }>,
  quarterlyReports: Array<{...}>,  // same structure as annual
}
```

### Margin Calculations
```typescript
// All margins are percentages (0-100), NOT decimals (0-1)
grossMargin = (grossProfit / totalRevenue) * 100
operatingMargin = (operatingIncome / totalRevenue) * 100
netMargin = (netIncome / totalRevenue) * 100
```

### Conversion Rules
- **Revenue, Income**: Parse string to number, keep as USD
- **Fiscal Date**: Extract year for fiscal year tracking
- **Margins**: Calculate from revenue and profit figures, result is 0-100 (e.g., 45.5 for 45.5%)

---

## 4. BALANCE SHEET (BALANCE_SHEET)

### API Response Fields (Annual & Quarterly)
| Field | API Key | Unit | Type | Example |
|-------|---------|------|------|---------|
| Fiscal Date | `fiscalDateEnding` | Date (YYYY-MM-DD) | String | "2024-12-31" |
| Total Assets | `totalAssets` | USD (dollars) | String | "50000000000" |
| Total Liabilities | `totalLiabilities` | USD (dollars) | String | "20000000000" |
| Total Equity | `totalShareholderEquity` | USD (dollars) | String | "30000000000" |
| Current Assets | `totalCurrentAssets` | USD (dollars) | String | "15000000000" |
| Current Liabilities | `totalCurrentLiabilities` | USD (dollars) | String | "8000000000" |
| Long-term Debt | `longTermDebt` | USD (dollars) | String | "5000000000" |
| Short-term Debt | `shortTermDebt` | USD (dollars) | String | "2000000000" |
| Cash | `cashAndCashEquivalentsAtCarryingValue` | USD (dollars) | String | "3000000000" |
| Inventory | `inventory` | USD (dollars) | String | "500000000" |
| Accounts Receivable | `accountsReceivable` | USD (dollars) | String | "2000000000" |

### Internal Structure (balanceSheet)
```typescript
balanceSheet: {
  annualReports: Array<{
    fiscalDateEnding: string,      // YYYY-MM-DD
    fiscalYear: number,            // extracted from date
    totalAssets: number,           // USD
    totalLiabilities: number,      // USD
    totalEquity: number,           // USD
    currentAssets: number,         // USD
    currentLiabilities: number,    // USD
    cash: number,                  // USD
    inventory: number,             // USD
    accountsReceivable: number,    // USD
    longTermDebt: number,          // USD
    shortTermDebt: number,         // USD
  }>,
  quarterlyReports: Array<{...}>,  // same structure
}
```

### Ratio Calculations
```typescript
// All ratios are unitless (0-1 or decimal format)
currentRatio = currentAssets / currentLiabilities
debtToEquity = (longTermDebt + shortTermDebt) / totalEquity
```

### Conversion Rules
- **All monetary values**: Parse string to number, keep as USD
- **Fiscal Date**: Extract year for fiscal year tracking
- **Ratios**: Calculate from balance sheet figures, result is unitless decimal

---

## 5. CASH FLOW (CASH_FLOW)

### API Response Fields (Annual & Quarterly)
| Field | API Key | Unit | Type | Example |
|-------|---------|------|------|---------|
| Fiscal Date | `fiscalDateEnding` | Date (YYYY-MM-DD) | String | "2024-12-31" |
| Operating Cash Flow | `operatingCashFlow` | USD (dollars) | String | "5000000000" |
| Capital Expenditures | `capitalExpenditures` | USD (dollars) | String | "1000000000" |
| Investing Cash Flow | `investingCashFlow` | USD (dollars) | String | "-2000000000" |
| Financing Cash Flow | `financingCashFlow` | USD (dollars) | String | "-1000000000" |

### Internal Structure (cashFlow)
```typescript
cashFlow: {
  annualReports: Array<{
    fiscalDateEnding: string,      // YYYY-MM-DD
    fiscalYear: number,            // extracted from date
    operatingCashFlow: number,     // USD
    investingCashFlow: number,     // USD (can be negative)
    financingCashFlow: number,     // USD (can be negative)
    capitalExpenditure: number,    // USD
  }>,
  quarterlyReports: Array<{...}>,  // same structure
}
```

### Free Cash Flow Calculation
```typescript
freeCashFlow = operatingCashFlow - capitalExpenditure
```

### Conversion Rules
- **All cash flows**: Parse string to number, keep as USD (can be negative)
- **Fiscal Date**: Extract year for fiscal year tracking
- **Free Cash Flow**: Calculate as OCF - CapEx

---

## 6. GROWTH CALCULATIONS (For Agents)

### Growth Rate Calculation
Growth rates are calculated by comparing financial metrics across periods:

```typescript
// TTM vs Prior Year FY
growthRate = ((ttmValue - priorFYValue) / Math.abs(priorFYValue)) * 100

// Result is a percentage: e.g., 15.5 (represents 15.5% growth)
```

### TTM (Trailing Twelve Months) Calculation
```typescript
// Sum last 4 quarters
ttmRevenue = Q1 + Q2 + Q3 + Q4

// Result is in USD, same unit as quarterly data
```

### Metrics for Growth Calculation
- **Revenue Growth**: Compare TTM revenue to prior year FY revenue
- **Earnings Growth**: Compare TTM net income to prior year FY net income
- **FCF Growth**: Compare TTM free cash flow to prior year FY free cash flow

---

## 7. UNIT CONVERSION SUMMARY

| Metric | API Unit | Internal Unit | Display Unit | Conversion |
|--------|----------|---------------|--------------|------------|
| Price | USD string | number USD | $X.XX | Parse, no conversion |
| Volume | Shares string | number | Shares | Parse, no conversion |
| P/E Ratio | Unitless string | number | X.XX | Parse, no conversion |
| P/B Ratio | Unitless string | number | X.XX | Parse, no conversion |
| ROE | Decimal 0-1 string | decimal 0-1 | X% | Parse, multiply by 100 for display |
| ROA | Decimal 0-1 string | decimal 0-1 | X% | Parse, multiply by 100 for display |
| Dividend Yield | Decimal 0-1 string | decimal 0-1 | X% | Parse, multiply by 100 for display |
| Gross Margin | Calculated % | 0-100 | X% | Calculate, no conversion |
| Operating Margin | Calculated % | 0-100 | X% | Calculate, no conversion |
| Net Margin | Calculated % | 0-100 | X% | Calculate, no conversion |
| Revenue | USD string | number USD | $X.XXB | Parse, no conversion |
| Net Income | USD string | number USD | $X.XXB | Parse, no conversion |
| Market Cap | USD string | number USD | $X.XXB | Parse, no conversion |
| Current Ratio | Calculated | unitless | X.XX | Calculate, no conversion |
| Debt/Equity | Calculated | unitless | X.XX | Calculate, no conversion |
| Growth Rate | Calculated % | percentage | X% | Calculate, no conversion |

---

## 8. CRITICAL UNIT MISTAKES TO AVOID

### ❌ WRONG: ROE Multiplication
```typescript
// WRONG: Multiply ROE twice
roe = 0.03  // API returns 3% as 0.03
roe_wrong = roe * 100  // = 3
display = roe_wrong + "%"  // = "3%" ✓ Correct by accident
// But if stored as "3" and multiplied again: 3 * 100 = 300% ❌
```

### ✅ CORRECT: ROE Handling
```typescript
// CORRECT: Store as decimal, multiply only for display
roe = 0.03  // API returns 3% as 0.03
display = (roe * 100).toFixed(2) + "%"  // = "3.00%" ✓
```

### ❌ WRONG: Margin Calculation
```typescript
// WRONG: Margins are already percentages
netMargin = (netIncome / revenue) * 100  // = 12.1
display = netMargin + "%"  // = "12.1%" ✓
// But if stored as "12.1" and multiplied again: 12.1 * 100 = 1210% ❌
```

### ✅ CORRECT: Margin Handling
```typescript
// CORRECT: Calculate as percentage, store as 0-100
netMargin = (netIncome / revenue) * 100  // = 12.1
display = netMargin.toFixed(2) + "%"  // = "12.10%" ✓
```

### ❌ WRONG: Revenue in Millions
```typescript
// WRONG: Treating revenue as millions when it's in dollars
revenue = 12345678900  // dollars
display = (revenue / 1000000) + "M"  // = "12345.68M" ✓
// But if stored as "12345.68" and divided again: 12345.68 / 1000000 = 0.012M ❌
```

### ✅ CORRECT: Revenue Handling
```typescript
// CORRECT: Store as actual dollars, divide only for display
revenue = 12345678900  // dollars
display = (revenue / 1000000000).toFixed(2) + "B"  // = "12.35B" ✓
```

---

## 9. DATA FLOW CHECKLIST

When integrating Alpha Vantage data:

- [ ] Parse all string numbers to JavaScript numbers
- [ ] Verify units match expected format (decimal vs percentage vs dollars)
- [ ] Calculate derived metrics (margins, ratios, growth) with correct formulas
- [ ] Store internal data in canonical units (not display units)
- [ ] Convert to display units only in UI layer
- [ ] Test with multiple tickers to verify consistency
- [ ] Log actual API values during development
- [ ] Validate calculations match financial definitions

---

## 10. EXAMPLE: BIDU Data Flow

### API Response (OVERVIEW)
```json
{
  "PERatio": "14.06",
  "PriceToBookRatio": "1.43",
  "ReturnOnEquityTTM": "0.03",
  "ReturnOnAssetsTTM": "0.015",
  "MarketCapitalization": "123456789000"
}
```

### Internal Storage
```typescript
ratios: {
  pe: 14.06,        // unitless
  pb: 1.43,         // unitless
  roe: 0.03,        // decimal 0-1 (represents 3%)
  roa: 0.015,       // decimal 0-1 (represents 1.5%)
}
```

### Display Output
```
P/E Ratio: 14.06
P/B Ratio: 1.43
ROE: 3.00%         // 0.03 * 100 = 3%
ROA: 1.50%         // 0.015 * 100 = 1.5%
```

---

## 11. References

- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
- [Financial Ratio Definitions](https://www.investopedia.com/)
- [TTM Calculation Guide](https://www.investopedia.com/terms/t/ttm.asp)
