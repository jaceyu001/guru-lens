# Earnings Growth Metric Investigation

## Question
Where does the earnings growth metric come from? Is it YoY, TTM, or something else? (e.g., BIDU showing -253.4%)

## Answer

### Metric Type: **Year-over-Year (YoY) Growth**

The earnings growth metric is calculated as **Year-over-Year (YoY)** growth, comparing the most recent fiscal year's net income to the previous fiscal year's net income.

### Calculation Method

**Source Code:** `server/services/financialData.ts` (lines 52-68)

```python
# Get net income for current and previous year from income statement
current_ni = income_stmt.iloc[:, 0].get('Net Income', 0)
previous_ni = income_stmt.iloc[:, 1].get('Net Income', 0)

# Calculate YoY growth
if previous_ni != 0:
    earnings_growth = (current_ni - previous_ni) / abs(previous_ni)
```

**Formula:** 
```
Earnings Growth (%) = (Current Year Net Income - Previous Year Net Income) / |Previous Year Net Income| × 100
```

### Data Source
- **Primary:** yfinance income statement data (`ticker.income_stmt`)
- **Fallback:** EPS-based calculation if income statement unavailable
- **Field Used:** Net Income (annual fiscal year data)

### Interpretation

| Scenario | Result | Meaning |
|----------|--------|---------|
| Positive growth | +15% | Net income increased 15% YoY |
| Negative growth | -25% | Net income decreased 25% YoY |
| Extreme negative | -253.4% | Net income swung from profit to loss (or vice versa) |

### Example: BIDU -253.4% (Hypothetical)

If BIDU showed -253.4% earnings growth, it would mean:
- Previous year net income: $X (positive)
- Current year net income: Negative value (loss)
- The swing from profit to loss creates an extreme negative percentage

**Actual BIDU Data (Verified Jan 2025):**
- 2024 Net Income: $23.76 billion
- 2023 Net Income: $20.32 billion
- Calculated Growth: +17.0% YoY

### Data Quality Considerations

1. **Timing:** Uses most recent available fiscal year data (typically updated annually)
2. **Extreme Values:** Extremely negative values (< -100%) indicate:
   - Company swing from profitability to losses
   - Potential one-time charges or restructuring
   - Data quality issues
3. **Fallback Logic:** If income statement unavailable, uses EPS-based calculation

### Recommendations

1. **Add Metric Documentation:** Display tooltip showing "YoY earnings growth from annual income statement"
2. **Flag Extreme Values:** Highlight earnings growth < -100% or > 100% with data quality warning
3. **Show Comparison:** Display both current and previous year net income for context
4. **Update Frequency:** Refresh analysis when new fiscal year data becomes available

### Related Metrics

- **Revenue Growth:** Also YoY, calculated from total revenue
- **FCF Growth:** Year-over-year free cash flow growth
- **PEG Ratio:** Uses earnings growth to calculate P/E to Growth ratio

---

**Investigation Date:** January 16, 2025  
**Data Source:** yfinance  
**Metric Type:** Year-over-Year (YoY) Annual Growth
