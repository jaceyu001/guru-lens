# Comprehensive Data Source Audit for JNJ

Generated: 2026-01-28T23:55:31.336Z

## Data Summary

- Total Data Points: 48
- Data Points with Values: 45
- Data Points Missing: 3

## Complete Data Point Table

| Data Point Name | Used By | Value (JNJ) | API Source | Unit | Formula |
|----------------|---------|-------------|------------|------|----------|
| Company Name | Dashboard | Johnson & Johnson | OVERVIEW.Name | text | - |
| Sector | Dashboard | HEALTHCARE | OVERVIEW.Sector | text | - |
| Industry | Dashboard | DRUG MANUFACTURERS - GENERAL | OVERVIEW.Industry | text | - |
| Exchange | Dashboard | NYSE | OVERVIEW.Exchange | text | - |
| Price | Dashboard | 227.72 | GLOBAL_QUOTE["05. price"] | $ | - |
| Change | Dashboard | 3.28 | GLOBAL_QUOTE["09. change"] | $ | - |
| Change Percent | Dashboard | 1.4614% | GLOBAL_QUOTE["10. change percent"] | % | - |
| Volume | Dashboard | $8.96M | GLOBAL_QUOTE["06. volume"] | shares | - |
| P/E Ratio | Dashboard | 20.37 | OVERVIEW.PERatio | ratio | - |
| P/B Ratio | Dashboard | 6.82 | OVERVIEW.PriceToBookRatio | ratio | - |
| ROE | Dashboard, Fundamentals Agent | 35.60% | OVERVIEW.ReturnOnEquityTTM | % | ReturnOnEquityTTM × 100 |
| ROA | Dashboard, Fundamentals Agent | 8.26% | OVERVIEW.ReturnOnAssetsTTM | % | ReturnOnAssetsTTM × 100 |
| Debt/Equity | Dashboard, Financial Health Agent | NaN | BALANCE_SHEET (calculated) | ratio | (Long Term Debt + Short Term Debt) / Total Equity |
| Net Margin | Dashboard, Fundamentals Agent | 28.46% | INCOME_STATEMENT (calculated) | % | (Net Income / Revenue) × 100 |
| Revenue (Latest Annual) | Fundamentals Agent | $94.19B | INCOME_STATEMENT.annualReports[0].totalRevenue | $ | - |
| Revenue Growth | Fundamentals Agent | Calculated from TTM vs FY | INCOME_STATEMENT (calculated) | % | ((TTM Revenue - Last FY Revenue) / Last FY Revenue) × 100 |
| Net Income (Latest Annual) | Fundamentals Agent | $26.80B | INCOME_STATEMENT.annualReports[0].netIncome | $ | - |
| Earnings Growth | Fundamentals Agent | Calculated from TTM vs FY | INCOME_STATEMENT (calculated) | % | ((TTM Net Income - Last FY Net Income) / Last FY Net Income) × 100 |
| Operating Income | Fundamentals Agent, ROIC Calculation | $25.60B | INCOME_STATEMENT.annualReports[0].operatingIncome | $ | - |
| Gross Profit | Fundamentals Agent | $68.56B | INCOME_STATEMENT.annualReports[0].grossProfit | $ | - |
| Gross Margin | Fundamentals Agent | 72.78% | INCOME_STATEMENT (calculated) | % | (Gross Profit / Revenue) × 100 |
| Operating Margin | Fundamentals Agent | 27.17% | INCOME_STATEMENT (calculated) | % | (Operating Income / Revenue) × 100 |
| Operating Cash Flow | Fundamentals Agent, Financial Health Agent | $24.27B | CASH_FLOW.annualReports[0].operatingCashflow | $ | - |
| Capital Expenditure | Fundamentals Agent | $4.42B | CASH_FLOW.annualReports[0].capitalExpenditures | $ | - |
| Free Cash Flow | Fundamentals Agent, Valuation Agent | $19.84B | CASH_FLOW (calculated) | $ | Operating Cash Flow - Capital Expenditure |
| FCF Growth | Fundamentals Agent | Calculated from TTM vs FY | CASH_FLOW (calculated) | % | ((TTM FCF - Last FY FCF) / Last FY FCF) × 100 |
| Total Assets | Financial Health Agent, ROIC Calculation | None | BALANCE_SHEET.annualReports[0].totalAssets | $ | - |
| Total Liabilities | Financial Health Agent | None | BALANCE_SHEET.annualReports[0].totalLiabilities | $ | - |
| Total Equity | Financial Health Agent | N/A | BALANCE_SHEET.annualReports[0].totalEquity | $ | - |
| Current Assets | Financial Health Agent | N/A | BALANCE_SHEET.annualReports[0].currentAssets | $ | - |
| Current Liabilities | Financial Health Agent, ROIC Calculation | N/A | BALANCE_SHEET.annualReports[0].currentLiabilities | $ | - |
| Current Ratio | Financial Health Agent | NaN | BALANCE_SHEET (calculated) | ratio | Current Assets / Current Liabilities |
| Long Term Debt | Financial Health Agent | None | BALANCE_SHEET.annualReports[0].longTermDebt | $ | - |
| Short Term Debt | Financial Health Agent | None | BALANCE_SHEET.annualReports[0].shortTermDebt | $ | - |
| Cash | Financial Health Agent, Valuation Agent | None | BALANCE_SHEET.annualReports[0].cashAndCashEquivalentsAtCarryingValue | $ | - |
| Shares Outstanding | Valuation Agent | $2.41B | OVERVIEW.SharesOutstanding | shares | - |
| EPS | Valuation Agent, Payout Ratio | 11.02 | OVERVIEW.EPS | $/share | - |
| Diluted EPS | Valuation Agent | 11.02 | OVERVIEW.DilutedEPSTTM | $/share | - |
| Book Value Per Share | Valuation Agent | 32.95 | OVERVIEW.BookValue | $/share | - |
| Revenue Per Share | Valuation Agent | 38.77 | OVERVIEW.RevenuePerShareTTM | $/share | - |
| Dividend Per Share | Valuation Agent, Payout Ratio | 5.14 | OVERVIEW.DividendPerShare | $/share | - |
| Dividend Yield | Valuation Agent | 2.32% | OVERVIEW.DividendYield | % | DividendYield × 100 |
| ROIC | Fundamentals Agent | NaN% | Calculated from INCOME_STATEMENT + BALANCE_SHEET | % | (Operating Income × (1 - Tax Rate)) / (Total Assets - Current Liabilities) × 100 |
| Payout Ratio | Fundamentals Agent | 46.64% | Calculated from OVERVIEW | % | (Dividend Per Share / EPS) × 100 |
| Interest Expense | Financial Health Agent | $85.00M | INCOME_STATEMENT.annualReports[0].interestExpense | $ | - |
| Interest Coverage | Financial Health Agent | 301.13 | INCOME_STATEMENT (calculated) | ratio | Operating Income / Interest Expense |
| Market Cap | Dashboard, Valuation Agent | $540.74B | OVERVIEW.MarketCapitalization | $ | - |
| P/S Ratio | Valuation Agent | 5.74 | OVERVIEW.PriceToSalesRatioTTM | ratio | - |

## Missing or Problematic Data Points

- **Total Equity** (used by Financial Health Agent): Missing from BALANCE_SHEET.annualReports[0].totalEquity
- **Current Assets** (used by Financial Health Agent): Missing from BALANCE_SHEET.annualReports[0].currentAssets
- **Current Liabilities** (used by Financial Health Agent, ROIC Calculation): Missing from BALANCE_SHEET.annualReports[0].currentLiabilities

## Data Quality Notes

1. **ROIC Calculation**: Requires Operating Income, Total Assets, and Current Liabilities - all available ✓
2. **Payout Ratio**: Requires EPS and Dividend Per Share - both available ✓
3. **Growth Metrics**: Require TTM calculation from quarterly data - data available ✓
4. **Interest Coverage**: Requires Interest Expense - available ✓
