# TTM Growth Calculation - Architecture & Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Display growth rates with period labels                       │
│  - Show tooltips: "2025 TTM vs 2024 FY"                          │
│  - Flag data quality issues                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    tRPC API Call
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    tRPC Routers (Node.js)                        │
│  - analyses.runAnalysis                                          │
│  - tickers.getFinancialData                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ fundamentalsAgent│ │ valuationAgent   │ │ aiAnalysisEngine │
│  (uses growth)   │ │  (uses growth)   │ │  (uses growth)   │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ growthCalculator.ts  │ ◄── NEW SERVICE
                    │ (centralized logic)  │
                    └────────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │dataAvailabilityDetec │  │  TTM Calculator      │
        │tor.ts (NEW)          │  │  (in Python wrapper) │
        └────────────┬─────────┘  └──────────┬───────────┘
                     │                       │
                     └───────────┬───────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │ realFinancialData.ts │
                    │ (calls Python)       │
                    └────────────┬─────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │ yfinanceWrapper.py   │ ◄── UPDATED
                    │ (returns TTM data)   │
                    └────────────┬─────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │   yfinance Library   │
                    │  (quarterly_fin,     │
                    │   income_stmt)       │
                    └──────────────────────┘
```

---

## Data Flow Example: BIDU Analysis

### Step 1: User Requests Analysis
```
Frontend: POST /api/trpc/analyses.runAnalysis
Body: { symbol: "BIDU", personaIds: [1, 2, 3] }
```

### Step 2: Fetch Financial Data
```
realFinancialData.getStockData("BIDU")
  ↓
yfinanceWrapper.py get_stock_data("BIDU")
  ├─ Query: ticker.income_stmt (annual data)
  ├─ Query: ticker.quarterly_financials (quarterly data)
  ├─ Calculate: TTM for revenue, net income, etc.
  └─ Return: {
       financials: [...annual...],
       quarterlyFinancials: [...quarterly...],
       dataAvailability: {
         latestAnnualYear: 2024,
         latestQuarterlyYear: 2025,
         latestQuarterlyQ: "Q2",
         ttmAvailable: true,
         ttmYear: 2025
       }
     }
```

### Step 3: Detect Data Availability
```
dataAvailabilityDetector.detectDataAvailability(financialData)
  ├─ Latest annual: 2024 FY
  ├─ Latest quarterly: 2025 Q2
  ├─ Quarters available: ['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3']
  ├─ TTM available: true (have 4 quarters)
  └─ Return: {
       latestAnnualYear: 2024,
       latestQuarterlyYear: 2025,
       latestQuarterlyQ: "Q2",
       ttmAvailable: true,
       ttmYear: 2025
     }
```

### Step 4: Calculate Growth
```
growthCalculator.calculateGrowth({
  ticker: "BIDU",
  metric: "revenue",
  includeMetadata: true
})
  ├─ Decision: Q2 >= Q2 AND ttmAvailable → Use TTM vs FY
  ├─ Current: 2025 TTM = $130.73B (sum of Q2+Q1+Q4+Q3)
  ├─ Prior: 2024 FY = $134.60B
  ├─ Growth: (130.73 - 134.60) / 134.60 = -2.9%
  └─ Return: {
       growthRate: -2.9,
       currentValue: 130.73e9,
       priorValue: 134.60e9,
       currentPeriod: "2025 TTM",
       priorPeriod: "2024 FY",
       comparisonType: "TTM_VS_FY",
       dataQualityFlags: {}
     }
```

### Step 5: Use in Analysis
```
fundamentalsAgent.analyzeGrowth(financialData)
  ├─ Call: growthCalculator.calculateGrowth(...)
  ├─ Get: revenueGrowth = -2.9%, earningsGrowth = +17.0%
  ├─ Get: metadata = { currentPeriod: "2025 TTM", ... }
  └─ Return: {
       assessment: "MODERATE",
       revenueGrowth: -2.9,
       earningsGrowth: 17.0,
       growthMetadata: {
         currentPeriod: "2025 TTM",
         priorPeriod: "2024 FY",
         comparisonType: "TTM_VS_FY"
       }
     }
```

### Step 6: Display to User
```
UI Shows:
┌─────────────────────────────────────┐
│ Fundamentals Analysis               │
│                                     │
│ Growth: MODERATE                    │
│ Revenue Growth: -2.9%               │
│ (2025 TTM vs 2024 FY)              │
│                                     │
│ Earnings Growth: +17.0%             │
│ (2025 TTM vs 2024 FY)              │
│                                     │
│ ℹ️ Comparison uses most recent      │
│    12-month data vs prior year      │
└─────────────────────────────────────┘
```

---

## File-by-File Implementation

### 1. `server/services/growthCalculator.ts` (NEW)

```typescript
import { dataAvailabilityDetector } from './dataAvailabilityDetector';
import * as realFinancialData from './realFinancialData';

export interface GrowthCalculationInput {
  ticker: string;
  metric: 'revenue' | 'netIncome' | 'operatingIncome' | 'freeCashFlow';
  includeMetadata?: boolean;
}

export interface GrowthCalculationResult {
  growthRate: number; // Percentage
  currentValue: number;
  priorValue: number;
  currentPeriod: string;
  priorPeriod: string;
  comparisonType: 'TTM_VS_FY' | 'FY_VS_FY' | 'INSUFFICIENT_DATA';
  dataQualityFlags: {
    onlyQ1Available?: boolean;
    ttmNotAvailable?: boolean;
    annualNotAvailable?: boolean;
    negativeComparison?: boolean;
  };
}

export async function calculateGrowth(
  input: GrowthCalculationInput
): Promise<GrowthCalculationResult> {
  // Fetch financial data
  const financialData = await realFinancialData.getStockData(input.ticker);
  
  // Detect data availability
  const availability = await dataAvailabilityDetector.detectDataAvailability(
    financialData
  );
  
  // Determine comparison type
  const isQ2OrLater = 
    availability.latestQuarterlyQ !== 'Q1';
  const ttmAvailable = availability.ttmAvailable;
  
  let comparisonType: 'TTM_VS_FY' | 'FY_VS_FY' | 'INSUFFICIENT_DATA';
  let currentPeriod: string;
  let priorPeriod: string;
  let currentValue: number;
  let priorValue: number;
  
  if (isQ2OrLater && ttmAvailable) {
    // Use TTM vs Full Year
    comparisonType = 'TTM_VS_FY';
    currentPeriod = `${availability.ttmYear} TTM`;
    priorPeriod = `${availability.ttmYear - 1} FY`;
    
    // Get TTM value (from financialData.ttm object added by Python wrapper)
    currentValue = getTTMValue(financialData, input.metric);
    
    // Get prior year FY value
    priorValue = getFullYearValue(
      financialData,
      input.metric,
      availability.ttmYear - 1
    );
  } else if (availability.latestQuarterlyQ === 'Q1' || !ttmAvailable) {
    // Use Full Year vs Full Year (most recent complete years)
    comparisonType = 'FY_VS_FY';
    currentPeriod = `${availability.latestQuarterlyYear - 1} FY`;  // 2024 FY when Q1 2025 announced
    priorPeriod = `${availability.latestQuarterlyYear - 2} FY`;    // 2023 FY when Q1 2025 announced
    
    currentValue = getFullYearValue(
      financialData,
      input.metric,
      availability.latestQuarterlyYear - 1
    );
    priorValue = getFullYearValue(
      financialData,
      input.metric,
      availability.latestQuarterlyYear - 2
    );
  } else {
    // Insufficient data
    comparisonType = 'INSUFFICIENT_DATA';
    return {
      growthRate: 0,
      currentValue: 0,
      priorValue: 0,
      currentPeriod: 'N/A',
      priorPeriod: 'N/A',
      comparisonType,
      dataQualityFlags: {
        annualNotAvailable: true,
      },
    };
  }
  
  // Calculate growth rate
  let growthRate = 0;
  if (priorValue !== 0) {
    growthRate = ((currentValue - priorValue) / Math.abs(priorValue)) * 100;
  }
  
  // Build data quality flags
  const dataQualityFlags: any = {};
  if (availability.latestQuarterlyQ === 'Q1') {
    dataQualityFlags.onlyQ1Available = true;
  }
  if (!ttmAvailable) {
    dataQualityFlags.ttmNotAvailable = true;
  }
  if (priorValue < 0 && currentValue > 0) {
    dataQualityFlags.negativeComparison = true;
  }
  
  return {
    growthRate,
    currentValue,
    priorValue,
    currentPeriod,
    priorPeriod,
    comparisonType,
    dataQualityFlags,
  };
}

function getTTMValue(financialData: any, metric: string): number {
  // financialData.ttm will be populated by Python wrapper
  const ttmMap: Record<string, string> = {
    revenue: 'ttmRevenue',
    netIncome: 'ttmNetIncome',
    operatingIncome: 'ttmOperatingIncome',
    freeCashFlow: 'ttmFreeCashFlow',
  };
  return financialData[ttmMap[metric]] || 0;
}

function getFullYearValue(
  financialData: any,
  metric: string,
  year: number
): number {
  // Find annual data for specific year
  const annual = financialData.financials?.find(
    (f: any) => f.fiscalYear === year
  );
  
  if (!annual) return 0;
  
  const metricMap: Record<string, string> = {
    revenue: 'revenue',
    netIncome: 'netIncome',
    operatingIncome: 'operatingIncome',
    freeCashFlow: 'freeCashFlow',
  };
  
  return annual[metricMap[metric]] || 0;
}
```

### 2. `server/services/dataAvailabilityDetector.ts` (NEW)

```typescript
import type { FinancialData } from '@shared/types';

export interface DataAvailability {
  latestAnnualYear: number;
  latestAnnualComplete: boolean;
  latestQuarterlyYear: number;
  latestQuarterlyQ: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quartersAvailable: string[];
  ttmAvailable: boolean;
  ttmYear: number;
}

export async function detectDataAvailability(
  financialData: FinancialData
): Promise<DataAvailability> {
  // Extract annual data info
  const annualData = financialData.financials || [];
  const latestAnnualYear = annualData[0]?.fiscalYear || new Date().getFullYear() - 1;
  
  // Extract quarterly data info (from quarterlyFinancials added by Python wrapper)
  const quarterlyData = (financialData as any).quarterlyFinancials || [];
  
  let latestQuarterlyYear = latestAnnualYear;
  let latestQuarterlyQ: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q1';
  const quartersAvailable: string[] = [];
  
  if (quarterlyData.length > 0) {
    // Parse quarterly data
    for (const q of quarterlyData.slice(0, 4)) {
      const quarter = parseQuarter(q.period);
      if (quarter) {
        quartersAvailable.push(quarter);
      }
    }
    
    // Get latest quarter
    if (quartersAvailable.length > 0) {
      const [year, q] = parseQuarterString(quartersAvailable[0]);
      latestQuarterlyYear = year;
      latestQuarterlyQ = q;
    }
  }
  
  // Check if TTM is available (need at least 2 quarters from current year)
  const currentYearQuarters = quartersAvailable.filter(
    (q) => q.startsWith(String(latestQuarterlyYear))
  );
  const ttmAvailable = currentYearQuarters.length >= 2;
  
  return {
    latestAnnualYear,
    latestAnnualComplete: true,
    latestQuarterlyYear,
    latestQuarterlyQ,
    quartersAvailable,
    ttmAvailable,
    ttmYear: ttmAvailable ? latestQuarterlyYear : latestQuarterlyYear - 1,
  };
}

function parseQuarter(periodString: string): string | null {
  // Input: "2025-03-31" or "2025-Q1"
  // Output: "2025-Q1"
  try {
    if (periodString.includes('Q')) {
      return periodString; // Already in Q format
    }
    
    const date = new Date(periodString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const q = Math.ceil(month / 3);
    return `${year}-Q${q}`;
  } catch {
    return null;
  }
}

function parseQuarterString(quarterStr: string): [number, 'Q1' | 'Q2' | 'Q3' | 'Q4'] {
  // Input: "2025-Q2"
  // Output: [2025, 'Q2']
  const [year, q] = quarterStr.split('-');
  return [parseInt(year), q as 'Q1' | 'Q2' | 'Q3' | 'Q4'];
}
```

### 3. `server/services/yfinanceWrapper.py` (UPDATED)

Add TTM calculation and quarterly data:

```python
def get_stock_data(symbol):
    """Enhanced to return TTM data and quarterly financials"""
    
    # ... existing code ...
    
    # Calculate TTM values
    ttm_data = calculate_ttm(ticker)
    
    result = {
        "symbol": symbol,
        "price": { ... },
        "profile": { ... },
        "ratios": { ... },
        "financials": [...],  # Annual data
        "quarterlyFinancials": [...],  # NEW: Quarterly data
        "ttm": ttm_data,  # NEW: TTM values
        "dataAvailability": {  # NEW: Metadata
            "latestAnnualYear": latest_annual_year,
            "latestQuarterlyYear": latest_quarterly_year,
            "latestQuarterlyQ": f"Q{latest_q}",
            "ttmAvailable": len(quarters_current_year) >= 2,
            "ttmYear": latest_quarterly_year if len(quarters_current_year) >= 2 else latest_quarterly_year - 1
        }
    }
    
    return result

def calculate_ttm(ticker):
    """Calculate Trailing Twelve Months for key metrics"""
    quarterly_fin = ticker.quarterly_financials
    
    if quarterly_fin is None or quarterly_fin.empty:
        return None
    
    # Get last 4 quarters
    last_4 = quarterly_fin.columns[:4]
    
    ttm = {
        "ttmRevenue": sum(float(quarterly_fin.loc['Total Revenue', col]) or 0 for col in last_4),
        "ttmNetIncome": sum(float(quarterly_fin.loc['Net Income', col]) or 0 for col in last_4),
        "ttmOperatingIncome": sum(float(quarterly_fin.loc['Operating Income', col]) or 0 for col in last_4),
        "ttmFreeCashFlow": 0  # Would need cash flow statement
    }
    
    return ttm
```

### 4. `server/services/fundamentalsAgent.ts` (UPDATED)

Use centralized growth calculator:

```typescript
import * as growthCalculator from './growthCalculator';

async function analyzeGrowth(financialData: FinancialData): Promise<GrowthAnalysis> {
  // Use centralized growth calculator
  const revenueGrowthResult = await growthCalculator.calculateGrowth({
    ticker: financialData.symbol,
    metric: 'revenue',
    includeMetadata: true
  });
  
  const earningsGrowthResult = await growthCalculator.calculateGrowth({
    ticker: financialData.symbol,
    metric: 'netIncome',
    includeMetadata: true
  });
  
  const fcfGrowthResult = await growthCalculator.calculateGrowth({
    ticker: financialData.symbol,
    metric: 'freeCashFlow',
    includeMetadata: true
  });
  
  // Use growth rates
  const revenueGrowth = revenueGrowthResult.growthRate;
  const earningsGrowth = earningsGrowthResult.growthRate;
  const fcfGrowth = fcfGrowthResult.growthRate;
  
  // Store metadata for UI
  const growthMetadata = {
    revenue: {
      currentPeriod: revenueGrowthResult.currentPeriod,
      priorPeriod: revenueGrowthResult.priorPeriod,
      comparisonType: revenueGrowthResult.comparisonType
    },
    earnings: {
      currentPeriod: earningsGrowthResult.currentPeriod,
      priorPeriod: earningsGrowthResult.priorPeriod,
      comparisonType: earningsGrowthResult.comparisonType
    }
  };
  
  // ... rest of analysis ...
  
  return {
    assessment,
    revenueGrowth,
    earningsGrowth,
    fcfGrowth,
    growthMetadata,  // NEW: Pass metadata to UI
    // ... other fields ...
  };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// server/services/growthCalculator.test.ts

describe('growthCalculator', () => {
  describe('calculateGrowth', () => {
    it('should use TTM vs FY when Q2+ available', async () => {
      // Mock: Q2 2025 released, TTM available
      const result = await growthCalculator.calculateGrowth({
        ticker: 'BIDU',
        metric: 'revenue'
      });
      
      expect(result.comparisonType).toBe('TTM_VS_FY');
      expect(result.currentPeriod).toBe('2025 TTM');
      expect(result.priorPeriod).toBe('2024 FY');
    });
    
    it('should use FY vs FY when Q1 only', async () => {
      // Mock: Q1 2025 only, TTM not available
      const result = await growthCalculator.calculateGrowth({
        ticker: 'AAPL',
        metric: 'revenue'
      });
      
      expect(result.comparisonType).toBe('FY_VS_FY');
      expect(result.dataQualityFlags.onlyQ1Available).toBe(true);
    });
    
    it('should handle negative prior period', async () => {
      // Mock: Company swung from loss to profit
      const result = await growthCalculator.calculateGrowth({
        ticker: 'TEST',
        metric: 'netIncome'
      });
      
      expect(result.dataQualityFlags.negativeComparison).toBe(true);
      expect(result.growthRate).toBeGreaterThan(100);
    });
  });
});
```

---

## Rollout Plan

1. **Week 1**: Implement growthCalculator.ts and dataAvailabilityDetector.ts
2. **Week 2**: Update yfinanceWrapper.py with TTM calculations
3. **Week 3**: Integrate into fundamentalsAgent and valuationAgent
4. **Week 4**: Update UI to display period information
5. **Week 5**: Testing and bug fixes
6. **Week 6**: Deploy to production

---

## Success Metrics

- ✅ All growth calculations use TTM when available
- ✅ Fallback to FY vs FY when TTM unavailable
- ✅ UI displays comparison periods clearly
- ✅ Data quality flags inform users of limitations
- ✅ Zero breaking changes to existing APIs
- ✅ All tests passing (unit + integration)
