# TTM vs Full Year Growth Calculation Specification

## Overview

Implement a system-wide standard for growth calculations that uses **Trailing Twelve Months (TTM)** vs **Full Year (FY)** comparisons, with intelligent fallback logic based on data availability.

---

## Core Principle

**Use the most recent complete period available for comparison:**

| Scenario | Current Data Available | Growth Calculation | Example |
|----------|------------------------|-------------------|---------|
| Q2+ announced | 25 TTM (Q1+Q2+Q3+Q4 2024) | 25 TTM vs 24 FY | 25Q2 released → use 25 TTM vs 24 FY |
| Q1 only announced | 25 Q1 only | 24 FY vs 23 FY | 25Q1 released → use 24 FY vs 23 FY |
| Full year released | 25 FY complete | 25 FY vs 24 FY | Jan 2026 → use 25 FY vs 24 FY |

---

## Data Availability Detection Logic

### Step 1: Determine Current Calendar Quarter

```
Current Date: January 16, 2026
- If date is in Q1 (Jan-Mar): current_quarter = Q1, current_year = 2026
- If date is in Q2 (Apr-Jun): current_quarter = Q2, current_year = 2026
- If date is in Q3 (Jul-Sep): current_quarter = Q3, current_year = 2026
- If date is in Q4 (Oct-Dec): current_quarter = Q4, current_year = 2026
```

### Step 2: Determine Earnings Announcement Lag

Most US companies report earnings 30-45 days after quarter end:
- Q1 ends Mar 31 → Reported by mid-May
- Q2 ends Jun 30 → Reported by mid-August
- Q3 ends Sep 30 → Reported by mid-November
- Q4/FY ends Dec 31 → Reported by late February

### Step 3: Check Data Availability

Query yfinance quarterly_financials and income_stmt:

```python
def detect_data_availability(ticker):
    """
    Returns: {
        'latest_annual_year': 2024 or 2025,
        'latest_annual_complete': True/False,
        'latest_quarterly_year': 2025,
        'latest_quarterly_q': 'Q1' or 'Q2' or 'Q3' or 'Q4',
        'quarters_available': ['2025-Q1', '2025-Q2', ...],
        'ttm_available': True/False,
        'ttm_period': '2025 TTM' or '2024 TTM'
    }
    """
    
    # Get annual data
    annual_data = ticker.income_stmt  # Most recent year first
    latest_annual_year = int(str(annual_data.columns[0])[:4])
    
    # Get quarterly data
    quarterly_data = ticker.quarterly_financials  # Most recent quarter first
    quarters = []
    for col in quarterly_data.columns[:4]:
        year = int(str(col)[:4])
        month = int(str(col)[5:7])
        q = (month - 1) // 3 + 1
        quarters.append(f"{year}-Q{q}")
    
    latest_q_year = int(quarters[0].split('-')[0])
    latest_q_num = int(quarters[0].split('-Q')[1])
    
    # TTM is available if we have at least 2 quarters from current year
    ttm_available = len([q for q in quarters if q.startswith(str(latest_q_year))]) >= 2
    
    return {
        'latest_annual_year': latest_annual_year,
        'latest_quarterly_year': latest_q_year,
        'latest_quarterly_q': f"Q{latest_q_num}",
        'ttm_available': ttm_available,
        'quarters': quarters
    }
```

---

## Growth Calculation Decision Tree

### Decision Logic

```
IF latest_quarterly_q >= Q2 AND ttm_available:
    # Use TTM vs Full Year
    comparison_type = "TTM_VS_FY"
    current_period = f"{latest_q_year} TTM"
    prior_period = f"{latest_q_year - 1} FY"
    
ELIF latest_quarterly_q == Q1 OR NOT ttm_available:
    # Use Full Year vs Full Year (most recent complete years)
    comparison_type = "FY_VS_FY"
    current_period = f"{latest_q_year - 1} FY"  # 2024 FY when Q1 2025 announced
    prior_period = f"{latest_q_year - 2} FY"    # 2023 FY when Q1 2025 announced
    
ELSE:
    # Fallback: use latest available annual
    comparison_type = "FY_VS_FY"
    current_period = f"{latest_annual_year} FY"
    prior_period = f"{latest_annual_year - 1} FY"
```

---

## TTM Calculation

### What is TTM?

Trailing Twelve Months = Sum of last 4 quarters of data (most recent quarter + prior 3 quarters)

### Implementation

```python
def calculate_ttm(ticker, metric_name='Net Income'):
    """
    Calculate TTM for a given metric (e.g., 'Net Income', 'Total Revenue')
    
    Args:
        ticker: yfinance Ticker object
        metric_name: Financial metric to sum (must exist in quarterly_financials)
    
    Returns:
        float: TTM value
    """
    quarterly_data = ticker.quarterly_financials
    
    if quarterly_data is None or quarterly_data.empty:
        return None
    
    # Get last 4 quarters
    last_4_quarters = quarterly_data.columns[:4]
    
    try:
        ttm_value = 0
        for col in last_4_quarters:
            if metric_name in quarterly_data.index:
                value = float(quarterly_data.loc[metric_name, col]) or 0
                ttm_value += value
        return ttm_value
    except (ValueError, KeyError, TypeError):
        return None
```

### Example Calculation

```
BIDU Q2 2025 Release (mid-August 2025):
- Q2 2025: $32.71B revenue
- Q1 2025: $32.45B revenue
- Q4 2024: $34.12B revenue
- Q3 2024: $31.45B revenue

2025 TTM = 32.71 + 32.45 + 34.12 + 31.45 = $130.73B
2024 FY  = $134.60B (from annual_financials)

Growth = (130.73 - 134.60) / 134.60 = -2.9%
```

---

## System-Wide Implementation

### 1. Create Centralized Growth Calculator Service

**File:** `server/services/growthCalculator.ts`

```typescript
interface GrowthCalculationInput {
  ticker: string;
  metric: 'revenue' | 'netIncome' | 'operatingIncome' | 'freeCashFlow';
  includeMetadata?: boolean; // Return period info
}

interface GrowthCalculationResult {
  growthRate: number; // Percentage
  currentValue: number;
  priorValue: number;
  currentPeriod: string; // "2025 TTM" or "2024 FY"
  priorPeriod: string;   // "2024 FY"
  comparisonType: 'TTM_VS_FY' | 'FY_VS_FY' | 'INSUFFICIENT_DATA';
  dataQualityFlags: {
    onlyQ1Available?: boolean;
    ttmNotAvailable?: boolean;
    annualNotAvailable?: boolean;
  };
}

export async function calculateGrowth(
  input: GrowthCalculationInput
): Promise<GrowthCalculationResult> {
  // Implementation details below
}
```

### 2. Data Availability Detection Module

**File:** `server/services/dataAvailabilityDetector.ts`

```typescript
interface DataAvailability {
  latestAnnualYear: number;
  latestAnnualComplete: boolean;
  latestQuarterlyYear: number;
  latestQuarterlyQ: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quartersAvailable: string[]; // ['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3']
  ttmAvailable: boolean;
  ttmYear: number; // 2025 or 2024
}

export async function detectDataAvailability(
  ticker: string
): Promise<DataAvailability> {
  // Query yfinance and determine what data is available
}
```

### 3. Update yfinanceWrapper.py

Enhance Python wrapper to return metadata about data availability:

```python
{
  "financials": [...],  # Annual data
  "quarterlyFinancials": [...],  # Quarterly data
  "dataAvailability": {
    "latestAnnualYear": 2024,
    "latestQuarterlyYear": 2025,
    "latestQuarterlyQ": "Q2",
    "ttmAvailable": True,
    "ttmYear": 2025
  }
}
```

### 4. Update fundamentalsAgent.ts

Replace current growth calculation with centralized calculator:

```typescript
// OLD:
let revenueGrowth = (financialData.ratios?.revenueGrowth || 0) * 100;

// NEW:
const revenueGrowthResult = await growthCalculator.calculateGrowth({
  ticker: input.symbol,
  metric: 'revenue',
  includeMetadata: true
});

const revenueGrowth = revenueGrowthResult.growthRate;
const revenueGrowthMetadata = {
  currentPeriod: revenueGrowthResult.currentPeriod,
  priorPeriod: revenueGrowthResult.priorPeriod,
  comparisonType: revenueGrowthResult.comparisonType
};
```

### 5. Update valuationAgent.ts

Apply same pattern for valuation metrics:

```typescript
const earningsGrowthResult = await growthCalculator.calculateGrowth({
  ticker: input.symbol,
  metric: 'netIncome',
  includeMetadata: true
});

// Use for PEG calculation
const pegRatio = peRatio / (earningsGrowthResult.growthRate);
```

### 6. Update UI Display

Show period information in analysis cards:

```typescript
// In Ticker.tsx or analysis display component
<div className="text-xs text-muted-foreground">
  Growth: {revenueGrowth.toFixed(1)}%
  <span className="ml-2">({revenueGrowthMetadata.currentPeriod} vs {revenueGrowthMetadata.priorPeriod})</span>
</div>
```

---

## Edge Cases & Fallback Logic

### Case 1: Q1 Only Available

```
Scenario: February 2026, only 25Q1 data available
Decision: Use 24 FY vs 23 FY (most recent complete years)
Reason: Not enough data for TTM, so compare prior complete years
Flag: dataQualityFlags.onlyQ1Available = true
```

### Case 2: TTM Not Available

```
Scenario: Only 1 quarter of current year available
Decision: Fall back to FY vs FY comparison
Reason: Can't calculate TTM with only 1 quarter
Flag: dataQualityFlags.ttmNotAvailable = true
```

### Case 3: No Annual Data Available

```
Scenario: Newly IPO'd company, no full year data
Decision: Use available quarters only
Reason: Better than no data
Flag: dataQualityFlags.annualNotAvailable = true
```

### Case 4: Negative Prior Period (Company Swung from Loss to Profit)

```
Scenario: 24 FY = -$100M (loss), 25 TTM = +$50M (profit)
Calculation: (50 - (-100)) / |-100| = 150 / 100 = +150%
Interpretation: Company returned to profitability
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `growthCalculator.ts` service
- [ ] Create `dataAvailabilityDetector.ts` service
- [ ] Update `yfinanceWrapper.py` to return data availability metadata
- [ ] Add TTM calculation function to Python wrapper

### Phase 2: Integration
- [ ] Update `fundamentalsAgent.ts` to use new growth calculator
- [ ] Update `valuationAgent.ts` to use new growth calculator
- [ ] Update `aiAnalysisEngine.ts` to receive growth metadata
- [ ] Update all persona agents to use centralized calculator

### Phase 3: Testing
- [ ] Unit tests for `growthCalculator.ts`
- [ ] Unit tests for `dataAvailabilityDetector.ts`
- [ ] Integration tests with real yfinance data
- [ ] Edge case tests (Q1 only, negative periods, etc.)
- [ ] Test with multiple stocks at different reporting stages

### Phase 4: UI & Documentation
- [ ] Update UI to display period information
- [ ] Add tooltips explaining TTM vs FY comparison
- [ ] Document growth calculation methodology in help/FAQ
- [ ] Add data quality warnings to analysis cards

---

## Benefits

1. **Consistency**: All growth calculations use same logic system-wide
2. **Accuracy**: TTM provides more current data than annual-only comparisons
3. **Transparency**: Users see exactly which periods are being compared
4. **Flexibility**: Intelligent fallback handles all data availability scenarios
5. **Maintainability**: Centralized logic easier to update and test

---

## Example Scenarios

### Scenario A: BIDU in August 2025 (Q2 Released)
```
Data Available: 25Q2, 25Q1, 24Q4, 24Q3 (TTM available)
Calculation: 2025 TTM vs 2024 FY
Result: Shows most current 12-month performance vs prior full year
```

### Scenario B: BIDU in February 2026 (Q1 Only)
```
Data Available: 25Q1 only (TTM not available)
Calculation: 2024 FY vs 2023 FY (most recent complete years)
Result: Shows prior year growth; waits for Q2 data to show 2025 TTM growth
```

### Scenario C: BIDU in January 2026 (FY 2025 Released)
```
Data Available: 25 FY complete, 25Q4, 25Q3, 25Q2
Calculation: 2025 FY vs 2024 FY
Result: Full year comparison (most reliable)
```

---

## Notes

- **TTM is more current** but less stable (one quarter change affects 12-month view)
- **Full Year is more stable** but less current (wait until Feb for prior year data)
- **This approach balances** currency with stability
- **Users should understand** the comparison period to interpret results correctly
