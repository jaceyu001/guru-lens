# Financial Modeling Prep API Integration Guide

## API Overview

**Provider:** Financial Modeling Prep (FMP)  
**Base URL:** `https://financialmodelingprep.com/api/v3/`  
**Authentication:** Query parameter `apikey=YOUR_API_KEY`  
**Rate Limit:** Depends on plan (typically 250 requests/minute for free tier)

---

## API Endpoints Needed for Stock Analysis

### 1. Quote Endpoint (Current Price & OHLCV)
```
GET /quote/{symbol}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "price": 175.26,
  "changesPercentage": -1.82,
  "change": -3.24,
  "dayLow": 174.50,
  "dayHigh": 178.90,
  "yearHigh": 237.49,
  "yearLow": 164.08,
  "marketCap": 2800000000000,
  "priceAvg50": 180.45,
  "priceAvg200": 185.32,
  "volume": 45000000,
  "avgVolume": 52000000,
  "exchange": "NASDAQ",
  "open": 178.50,
  "previousClose": 178.50,
  "eps": 6.05,
  "pe": 29.0,
  "earningsAnnouncement": "2026-01-28T21:00:00.000+0000",
  "sharesOutstanding": 15977000000,
  "timestamp": 1704729600
}
```

**API Calls:** 1 per ticker

---

### 2. Company Profile Endpoint
```
GET /profile/{symbol}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "price": 175.26,
  "beta": 1.19,
  "volAvg": 52000000,
  "mktCap": 2800000000000,
  "lastDiv": 0.24,
  "range": "164.08 - 237.49",
  "changes": -3.24,
  "companyName": "Apple Inc.",
  "currency": "USD",
  "cik": "0000320193",
  "isin": "US0378331005",
  "cusip": "037833100",
  "exchange": "NASDAQ",
  "exchangeShortName": "NASDAQ",
  "industry": "Consumer Electronics",
  "website": "https://www.apple.com",
  "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  "ceo": "Timothy D. Cook",
  "sector": "Technology",
  "country": "US",
  "employees": 161000,
  "phone": "408-996-1010",
  "address": "One Apple Park Way",
  "city": "Cupertino",
  "state": "CA",
  "zipcode": "95014",
  "dcfValue": 185.32,
  "dcf": 185.32,
  "image": "https://financialmodelingprep.com/image-stock/AAPL.png",
  "ipoDate": "1980-12-12",
  "defaultImage": false,
  "isEtf": false,
  "isActivelyTrading": true,
  "isAdr": false,
  "isFund": false
}
```

**API Calls:** 1 per ticker

---

### 3. Income Statement (Annual)
```
GET /income-statement/{symbol}?period=annual&limit=5
```

**Response:**
```json
[
  {
    "date": "2023-09-30",
    "symbol": "AAPL",
    "reportedCurrency": "USD",
    "cik": "0000320193",
    "fillingDate": "2023-11-03",
    "acceptedDate": "2023-11-03T18:08:14Z",
    "calendarYear": 2023,
    "period": "FY",
    "revenue": 383285000000,
    "costOfRevenue": 214137000000,
    "grossProfit": 169148000000,
    "grossProfitRatio": 0.441,
    "researchAndDevelopmentExpenses": 29915000000,
    "generalAndAdministrativeExpenses": 6060000000,
    "sellingAndMarketingExpenses": 0,
    "sellingGeneralAndAdministrativeExpenses": 6060000000,
    "otherExpenses": 0,
    "operatingExpenses": 35975000000,
    "costAndExpenses": 250112000000,
    "interestIncome": 3932000000,
    "interestExpense": 2931000000,
    "depreciationAndAmortization": 11510000000,
    "ebitda": 120232000000,
    "ebit": 108722000000,
    "incomeBeforeTax": 109689000000,
    "incomeTaxExpense": 16741000000,
    "netIncome": 96995000000,
    "eps": 6.05,
    "epsdiluted": 6.05,
    "weightedAverageShsOut": 16037000000,
    "weightedAverageShsOutDil": 16215000000,
    "link": "https://www.sec.gov/Archives/edgar/0000320193-23-000077-index.html",
    "finalLink": "https://www.sec.gov/cgi-bin/viewer?action=view&cik=320193&accession_number=0000320193-23-000077&xbrl_type=v"
  }
]
```

**API Calls:** 1 per ticker (annual statements)

---

### 4. Balance Sheet Statement (Annual)
```
GET /balance-sheet-statement/{symbol}?period=annual&limit=5
```

**Response:**
```json
[
  {
    "date": "2023-09-30",
    "symbol": "AAPL",
    "reportedCurrency": "USD",
    "cik": "0000320193",
    "fillingDate": "2023-11-03",
    "acceptedDate": "2023-11-03T18:08:14Z",
    "calendarYear": 2023,
    "period": "FY",
    "cashAndCashEquivalents": 29941000000,
    "shortTermInvestments": 24658000000,
    "cashAndShortTermInvestments": 54599000000,
    "netReceivables": 28184000000,
    "inventory": 6331000000,
    "otherCurrentAssets": 15341000000,
    "totalCurrentAssets": 110375000000,
    "propertyPlantAndEquipmentNet": 42117000000,
    "goodwill": 0,
    "intangibleAssets": 0,
    "goodwillAndIntangibleAssets": 0,
    "longTermInvestments": 100544000000,
    "taxAssetsDeferred": 0,
    "otherNonCurrentAssets": 54428000000,
    "totalNonCurrentAssets": 197089000000,
    "otherAssets": 0,
    "totalAssets": 352755000000,
    "accountPayable": 55888000000,
    "shortTermDebt": 9822000000,
    "taxPayable": 0,
    "deferredRevenueShortTerm": 8060000000,
    "otherCurrentLiabilities": 47493000000,
    "totalCurrentLiabilities": 121263000000,
    "longTermDebt": 106897000000,
    "deferredRevenueNonCurrentLiabilities": 7912000000,
    "deferredTaxLiabilitiesNonCurrent": 0,
    "otherNonCurrentLiabilities": 11435000000,
    "totalNonCurrentLiabilities": 126244000000,
    "otherLiabilities": 0,
    "totalLiabilities": 247507000000,
    "commonStock": 73000000,
    "retainedEarnings": 70400000000,
    "accumulatedOtherComprehensiveIncomeLoss": -1775000000,
    "othertotalStockholdersEquity": 32550000000,
    "totalStockholdersEquity": 105248000000,
    "totalLiabilitiesAndStockholdersEquity": 352755000000,
    "minorityInterest": 0,
    "totalEquity": 105248000000,
    "totalLiabilitiesAndTotalEquity": 352755000000,
    "totalInvestedCapital": 212145000000,
    "totalDebt": 116719000000,
    "netDebt": 86778000000,
    "link": "https://www.sec.gov/Archives/edgar/0000320193-23-000077-index.html",
    "finalLink": "https://www.sec.gov/cgi-bin/viewer?action=view&cik=320193&accession_number=0000320193-23-000077&xbrl_type=v"
  }
]
```

**API Calls:** 1 per ticker (annual statements)

---

### 5. Cash Flow Statement (Annual)
```
GET /cash-flow-statement/{symbol}?period=annual&limit=5
```

**Response:**
```json
[
  {
    "date": "2023-09-30",
    "symbol": "AAPL",
    "reportedCurrency": "USD",
    "cik": "0000320193",
    "fillingDate": "2023-11-03",
    "acceptedDate": "2023-11-03T18:08:14Z",
    "calendarYear": 2023,
    "period": "FY",
    "netIncome": 96995000000,
    "depreciationAndAmortization": 11510000000,
    "stockBasedCompensation": 8163000000,
    "deferredIncomeTax": 0,
    "otherNonCashItems": 4293000000,
    "changesInOperatingAssets": -4281000000,
    "changesInOperatingLiabilities": 3844000000,
    "accountsReceivableChange": -3706000000,
    "accountsPayableChange": 8747000000,
    "otherWorkingCapitalChange": -9322000000,
    "otherOperatingCashFlow": 0,
    "netCashProvidedByOperatingActivities": 110543000000,
    "investmentsInPropertyPlantAndEquipment": -10946000000,
    "acquisitionsNet": 0,
    "purchasesOfInvestments": -24356000000,
    "salesMaturitiesOfInvestments": 26307000000,
    "otherInvestingActivities": -1519000000,
    "netCashUsedForInvestingActivities": -10614000000,
    "debtRepayment": -8000000000,
    "commonStockIssued": 0,
    "commonStockRepurchased": -61000000000,
    "dividendsPaid": -14763000000,
    "otherFinancingActivities": -1289000000,
    "netCashUsedProvidedByFinancingActivities": -85052000000,
    "effectOfForexChangesOnCash": -1289000000,
    "netChangeInCash": 13588000000,
    "cashAtEndOfPeriod": 29941000000,
    "cashAtBeginningOfPeriod": 16353000000,
    "operatingCashFlow": 110543000000,
    "capitalExpenditure": -10946000000,
    "freeCashFlow": 99597000000,
    "link": "https://www.sec.gov/Archives/edgar/0000320193-23-000077-index.html",
    "finalLink": "https://www.sec.gov/cgi-bin/viewer?action=view&cik=320193&accession_number=0000320193-23-000077&xbrl_type=v"
  }
]
```

**API Calls:** 1 per ticker (annual statements)

---

### 6. Key Metrics Endpoint (Ratios & Margins)
```
GET /key-metrics/{symbol}?period=annual&limit=5
```

**Response:**
```json
[
  {
    "date": "2023-09-30",
    "symbol": "AAPL",
    "period": "FY",
    "revenuePerShare": 23.93,
    "netIncomePerShare": 6.05,
    "operatingCashFlowPerShare": 6.90,
    "freeCashFlowPerShare": 6.22,
    "cashPerShare": 1.87,
    "bookValuePerShare": 6.57,
    "tangibleBookValuePerShare": 6.57,
    "shareholdersEquityPerShare": 6.57,
    "interestDebtPerShare": 7.29,
    "marketCap": 2800000000000,
    "enterpriseValue": 2886719000000,
    "peRatio": 29.0,
    "priceToSalesRatio": 7.30,
    "pocfratio": 25.40,
    "pfcfRatio": 28.14,
    "pbRatio": 26.64,
    "ptbRatio": 26.64,
    "evToRevenue": 7.53,
    "evToOperatingCashFlow": 26.15,
    "evToFreeCashFlow": 28.96,
    "earningsYield": 0.0345,
    "freeCashFlowYield": 0.0355,
    "debtToEquity": 1.11,
    "debtToAssets": 0.70,
    "netDebtToEbitda": 0.72,
    "currentRatio": 0.91,
    "interestCoverage": 37.24,
    "incomeQuality": 1.14,
    "dividendYield": 0.0055,
    "payoutRatio": 0.15,
    "salesGeneralAndAdministrativeToRevenue": 0.016,
    "researchAndDevelopmentToRevenue": 0.078,
    "intangiblesToTotalAssets": 0.0,
    "capexToOperatingCashFlow": 0.099,
    "capexToRevenue": 0.029,
    "capexToDepreciation": 0.95,
    "stockBasedCompensationToRevenue": 0.021,
    "grahamNumber": 150.32,
    "roic": 0.457,
    "returnOnTangibleAssets": 0.922,
    "grahamNetNet": 2.35,
    "workingCapital": -10888000000,
    "tangibleAssetValue": 105248000000,
    "netCurrentAssetValue": -10888000000,
    "investedCapital": 212145000000,
    "averageReceivables": 28184000000,
    "averageInventory": 6331000000,
    "averageTotalAssets": 352755000000,
    "averageStockholdersEquity": 105248000000,
    "daysInventoryOutstanding": 10.0,
    "daysPayableOutstanding": 95.0,
    "daysSalesOutstanding": 26.0,
    "cashConversionCycle": -59.0,
    "receivablesTurnover": 13.6,
    "inventoryTurnover": 57.5,
    "assetTurnover": 1.09,
    "freeCashFlowOperatingCashFlowRatio": 0.90,
    "operatingCashFlowNetIncomeRatio": 1.14,
    "operatingCashFlowToNetIncome": 1.14,
    "freeCashFlowToNetIncome": 1.03
  }
]
```

**API Calls:** 1 per ticker (annual metrics)

---

### 7. Financial Ratios Endpoint (Additional Ratios)
```
GET /ratios/{symbol}?period=annual&limit=5
```

**Response:** Contains profitability, liquidity, efficiency, and leverage ratios

**API Calls:** 1 per ticker (optional, overlaps with Key Metrics)

---

## API Call Breakdown Per Ticker Analysis

### Minimal Analysis (Quick Mode)
```
Per Ticker:
├─ Quote Endpoint                    → 1 API call
├─ Company Profile                   → 1 API call
└─ Key Metrics (Annual)              → 1 API call
────────────────────────────────────────
Total: 3 API calls per ticker
```

**Data Retrieved:**
- Current price, OHLCV, market cap
- Company info, sector, industry, CEO
- P/E, P/B, ROE, margins, ratios

**Use Case:** Quick analysis mode, homepage "Today's Picks"

---

### Standard Analysis (Deep Mode)
```
Per Ticker:
├─ Quote Endpoint                    → 1 API call
├─ Company Profile                   → 1 API call
├─ Income Statement (Annual)         → 1 API call
├─ Balance Sheet (Annual)            → 1 API call
├─ Cash Flow Statement (Annual)      → 1 API call
└─ Key Metrics (Annual)              → 1 API call
────────────────────────────────────────
Total: 6 API calls per ticker
```

**Data Retrieved:**
- Everything from Quick Mode +
- Revenue, net income, EPS trends
- Assets, liabilities, equity structure
- Operating cash flow, free cash flow
- Complete financial ratios

**Use Case:** Full persona analysis, detailed evaluation

---

### Comprehensive Analysis (With Quarterly Data)
```
Per Ticker:
├─ Quote Endpoint                    → 1 API call
├─ Company Profile                   → 1 API call
├─ Income Statement (Annual)         → 1 API call
├─ Income Statement (Quarterly)      → 1 API call
├─ Balance Sheet (Annual)            → 1 API call
├─ Balance Sheet (Quarterly)         → 1 API call
├─ Cash Flow Statement (Annual)      → 1 API call
├─ Cash Flow Statement (Quarterly)   → 1 API call
└─ Key Metrics (Annual)              → 1 API call
────────────────────────────────────────
Total: 9 API calls per ticker
```

**Data Retrieved:**
- Everything from Standard Mode +
- Quarterly trends for trend analysis
- Earnings growth acceleration
- Seasonal patterns

**Use Case:** Advanced analysis, trend detection, growth acceleration

---

## Multi-Persona Analysis Call Breakdown

### Scenario: Analyzing AAPL with 6 Personas

**Step 1: Fetch Financial Data (One-time)**
```
Quote                   → 1 call
Company Profile         → 1 call
Income Statement        → 1 call
Balance Sheet           → 1 call
Cash Flow Statement     → 1 call
Key Metrics             → 1 call
────────────────────────────────
Subtotal: 6 API calls
```

**Step 2: Run Analysis for Each Persona (No additional API calls)**
```
Warren Buffett Analysis  → 0 API calls (uses cached data)
Peter Lynch Analysis     → 0 API calls (uses cached data)
Benjamin Graham Analysis → 0 API calls (uses cached data)
Cathie Wood Analysis     → 0 API calls (uses cached data)
Ray Dalio Analysis       → 0 API calls (uses cached data)
Philip Fisher Analysis   → 0 API calls (uses cached data)
────────────────────────────────
Subtotal: 0 API calls (LLM calls only)
```

**Total for 6-Persona Analysis: 6 API calls**

**Why?** Financial data is fetched once, then reused for all personas. The LLM analysis doesn't require additional API calls—it processes the same data through different persona lenses.

---

## API Call Optimization Strategies

### 1. Caching Strategy
```
First Request for AAPL:
  ├─ Fetch from FMP API (6 calls)
  ├─ Store in database
  └─ Cache in Redis (5 min TTL)

Subsequent Requests (within 5 min):
  ├─ Check Redis cache
  ├─ Return cached data
  └─ 0 API calls
```

**Benefit:** Reduce API calls by 90%+ for repeated queries

---

### 2. Batch Processing
```
Analyzing 10 stocks for opportunities scan:
  ├─ Without optimization: 10 × 6 = 60 API calls
  ├─ With caching: ~6-12 API calls (depending on cache hits)
  └─ With batch endpoint: ~10 API calls (if available)
```

---

### 3. Data Freshness Strategy
```
Real-time Price Data:
  ├─ Update every 1 minute (for active traders)
  └─ API calls: 1 per minute per ticker

Financial Statements:
  ├─ Update quarterly (when earnings released)
  └─ API calls: 1 per quarter per ticker

Company Profile:
  ├─ Update annually (rarely changes)
  └─ API calls: 1 per year per ticker
```

---

## Implementation Plan

### Phase 1: Create FMP API Client
```typescript
// server/services/fmpClient.ts
export class FMPClient {
  private apiKey: string;
  private baseUrl = "https://financialmodelingprep.com/api/v3";
  
  async getQuote(symbol: string): Promise<Quote>
  async getProfile(symbol: string): Promise<Profile>
  async getIncomeStatement(symbol: string, period: "annual" | "quarterly"): Promise<IncomeStatement[]>
  async getBalanceSheet(symbol: string, period: "annual" | "quarterly"): Promise<BalanceSheet[]>
  async getCashFlow(symbol: string, period: "annual" | "quarterly"): Promise<CashFlow[]>
  async getKeyMetrics(symbol: string, period: "annual" | "quarterly"): Promise<KeyMetrics[]>
}
```

### Phase 2: Create Data Transformer
```typescript
// server/services/fmpTransformer.ts
export function transformFMPToFinancialData(
  quote: Quote,
  profile: Profile,
  financials: FinancialStatement[],
  ratios: KeyMetrics
): FinancialData {
  // Transform FMP API response to our internal format
}
```

### Phase 3: Replace Mock Service
```typescript
// server/services/financialData.ts
export async function getFinancialData(symbol: string): Promise<FinancialData> {
  // Check cache first
  const cached = await cache.get(`financial-data:${symbol}`);
  if (cached) return cached;
  
  // Fetch from FMP API
  const fmpClient = new FMPClient(process.env.FMP_API_KEY);
  const [quote, profile, income, balance, cashFlow, metrics] = await Promise.all([
    fmpClient.getQuote(symbol),
    fmpClient.getProfile(symbol),
    fmpClient.getIncomeStatement(symbol, "annual"),
    fmpClient.getBalanceSheet(symbol, "annual"),
    fmpClient.getCashFlow(symbol, "annual"),
    fmpClient.getKeyMetrics(symbol, "annual")
  ]);
  
  // Transform to our format
  const financialData = transformFMPToFinancialData(quote, profile, income, metrics);
  
  // Cache for 5 minutes
  await cache.set(`financial-data:${symbol}`, financialData, 300);
  
  return financialData;
}
```

---

## API Cost Estimation

### Free Tier (FMP)
- **Requests/Month:** ~7,500 (250/min limit)
- **Cost:** $0
- **Suitable for:** Development, testing, light usage

### Starter Plan
- **Requests/Month:** 250,000
- **Cost:** ~$15/month
- **Suitable for:** Small production use

### Professional Plan
- **Requests/Month:** 1,000,000+
- **Cost:** ~$50-100/month
- **Suitable for:** Medium production use

### Calculation Example (Professional Plan)
```
Scenario: 100 daily active users, each analyzing 2 stocks/day

Daily API Calls:
  ├─ 100 users × 2 stocks = 200 stock analyses
  ├─ 200 analyses × 6 API calls = 1,200 API calls
  ├─ With 80% cache hit rate = 240 actual API calls
  └─ Monthly: 240 × 30 = 7,200 API calls

Monthly Cost: $50 (Professional plan covers 1M+ calls)
Cost per Analysis: $50 / (100 × 2 × 30) = $0.0083 per analysis
```

---

## Rate Limiting Considerations

### FMP Rate Limits
```
Free Tier:      250 requests/minute
Starter:        500 requests/minute
Professional:   1000+ requests/minute
```

### Implementation
```typescript
// Add rate limiter to FMP client
const rateLimiter = new RateLimiter({
  maxRequests: 250,
  windowMs: 60000 // 1 minute
});

async function callFMPAPI(endpoint: string) {
  await rateLimiter.acquire();
  return fetch(`${baseUrl}${endpoint}`);
}
```

---

## Summary

**API Calls Per Ticker Analysis:**
- **Quick Mode:** 3 calls (price, profile, metrics)
- **Standard Mode:** 6 calls (+ financial statements)
- **Comprehensive Mode:** 9 calls (+ quarterly data)

**Multi-Persona Analysis:**
- **6 personas:** Still 6 API calls (data fetched once, reused)
- **Cost:** ~$0.01 per analysis with caching

**Optimization:**
- Cache reduces API calls by 80-90%
- Batch processing reduces calls by 50%
- Total monthly cost: $15-100 depending on usage

**Next Steps:**
1. Create FMP API client
2. Implement caching layer
3. Replace mock data service
4. Test with real stocks
5. Monitor API usage and costs
