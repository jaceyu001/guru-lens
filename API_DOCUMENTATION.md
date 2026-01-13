# API Documentation

Guru Lens uses tRPC for type-safe API endpoints. All endpoints are automatically typed and validated.

## Base URL

```
Development: http://localhost:3000/api/trpc
Production: https://your-domain.com/api/trpc
```

## Authentication

All protected endpoints require a valid session cookie. Authentication is handled automatically by the Manus OAuth integration.

```typescript
// Check current user
const user = await trpc.auth.me.useQuery();

// Logout
const logout = trpc.auth.logout.useMutation();
```

## API Endpoints

### Authentication

#### `auth.me`
Get current authenticated user

**Type**: Query (Public)

**Response**:
```typescript
{
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}
```

**Example**:
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

#### `auth.logout`
Logout current user

**Type**: Mutation (Public)

**Response**:
```typescript
{ success: true }
```

**Example**:
```typescript
const logout = trpc.auth.logout.useMutation();
logout.mutate();
```

---

### Personas

#### `personas.list`
Get all active investor personas

**Type**: Query (Public)

**Response**:
```typescript
Array<{
  id: number;
  personaId: string;
  name: string;
  description: string;
  investmentPhilosophy: string;
  criteria: Record<string, any>;
  isActive: boolean;
}>
```

**Example**:
```typescript
const { data: personas } = trpc.personas.list.useQuery();
```

#### `personas.getById`
Get specific persona by ID

**Type**: Query (Public)

**Input**:
```typescript
{ id: number }
```

**Response**:
```typescript
{
  id: number;
  personaId: string;
  name: string;
  description: string;
  investmentPhilosophy: string;
  criteria: Record<string, any>;
  isActive: boolean;
}
```

**Example**:
```typescript
const { data: persona } = trpc.personas.getById.useQuery({ id: 1 });
```

---

### Tickers

#### `tickers.search`
Search for stocks by symbol or name

**Type**: Query (Public)

**Input**:
```typescript
{ query: string } // min 1 character
```

**Response**:
```typescript
Array<{
  symbol: string;
  name: string;
  exchange?: string;
}>
```

**Example**:
```typescript
const { data: results } = trpc.tickers.search.useQuery({ query: "AAPL" });
```

#### `tickers.getBySymbol`
Get ticker details by stock symbol

**Type**: Query (Public)

**Input**:
```typescript
{ symbol: string }
```

**Response**:
```typescript
{
  id: number;
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: string;
  exchange?: string;
  description?: string;
  lastDataUpdate: Date;
  isActive: boolean;
}
```

**Example**:
```typescript
const { data: ticker } = trpc.tickers.getBySymbol.useQuery({ symbol: "AAPL" });
```

#### `tickers.getFinancialData`
Get real-time financial data for a stock

**Type**: Query (Public)

**Input**:
```typescript
{ symbol: string }
```

**Response**:
```typescript
{
  symbol: string;
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    change: number;
    changePercent: number;
    timestamp: Date;
  };
  profile: {
    symbol: string;
    companyName: string;
    sector: string;
    industry: string;
    description: string;
    employees: number;
    website: string;
    marketCap: number;
  };
  ratios: {
    pe: number;
    pb: number;
    ps: number;
    roe: number;
    roa: number;
    roic: number;
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    interestCoverage: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    assetTurnover: number;
    inventoryTurnover: number;
  };
  financials: Array<{
    period: string;
    periodType: "quarterly" | "annual";
    fiscalYear: number;
    revenue: number;
    costOfRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
    eps: number;
    ebitda: number;
    freeCashFlow: number;
    totalAssets: number;
    totalLiabilities: number;
    shareholderEquity: number;
    cashAndEquivalents: number;
    totalDebt: number;
  }>;
}
```

**Example**:
```typescript
const { data: financialData } = trpc.tickers.getFinancialData.useQuery({
  symbol: "AAPL"
});
```

---

### Analysis

#### `analyses.runAnalysis`
Run multi-persona analysis on a stock

**Type**: Mutation (Public)

**Input**:
```typescript
{
  symbol: string;
  personaIds?: number[]; // Optional: specific personas
  mode?: "quick" | "deep"; // Default: "quick"
}
```

**Response**:
```typescript
{
  analyses: Array<{
    id: number;
    runId: string;
    ticker: string;
    personaId: string;
    personaName: string;
    score: number; // 0-100
    verdict: string;
    confidence: number;
    summaryBullets: string[];
    criteria: Record<string, any>;
    keyRisks: string[];
    whatWouldChangeMind: string[];
    dataUsed: Array<{
      source: string;
      endpoint: string;
      timestamp: number;
    }>;
    citations: string[];
    runMetadata: {
      model: string;
      version: string;
      runTime: number;
      inputsHash: string;
      mode: string;
    };
    runTimestamp: Date;
  }>;
  jobId: string | null;
}
```

**Example**:
```typescript
const runAnalysis = trpc.analyses.runAnalysis.useMutation();

runAnalysis.mutate({
  symbol: "AAPL",
  mode: "quick"
});
```

#### `analyses.getLatestForTicker`
Get latest analyses for a ticker

**Type**: Query (Public)

**Input**:
```typescript
{ symbol: string }
```

**Response**:
```typescript
Array<AnalysisOutput>
```

**Example**:
```typescript
const { data: analyses } = trpc.analyses.getLatestForTicker.useQuery({
  symbol: "AAPL"
});
```

#### `analyses.getByRunId`
Get specific analysis by run ID

**Type**: Query (Public)

**Input**:
```typescript
{ runId: string }
```

**Response**:
```typescript
AnalysisOutput | null
```

**Example**:
```typescript
const { data: analysis } = trpc.analyses.getByRunId.useQuery({
  runId: "abc123def456"
});
```

---

### Opportunities

#### `opportunities.getForPersona`
Get top opportunities for a specific persona

**Type**: Query (Public)

**Input**:
```typescript
{
  personaId: string;
  limit?: number; // Default: 50
}
```

**Response**:
```typescript
Array<{
  id: number;
  personaId: string;
  personaName: string;
  ticker: {
    symbol: string;
    companyName: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
    exchange?: string;
  };
  analysis: AnalysisOutput;
  rank: number;
  whyNow: string[];
  keyMetrics: Record<string, any>;
  changeStatus: string;
  previousScore?: number;
  scanDate: Date;
  scanTimestamp: Date;
}>
```

**Example**:
```typescript
const { data: opportunities } = trpc.opportunities.getForPersona.useQuery({
  personaId: "buffett",
  limit: 10
});
```

#### `opportunities.generateDailyScan`
Generate daily scan of opportunities for a persona

**Type**: Mutation (Public)

**Input**:
```typescript
{ personaId: string }
```

**Response**:
```typescript
{
  count: number;
  opportunities: Array<{
    id: number;
    symbol: string;
    score: number;
  }>;
}
```

**Example**:
```typescript
const generateScan = trpc.opportunities.generateDailyScan.useMutation();

generateScan.mutate({ personaId: "buffett" });
```

---

### Watchlist (Protected)

#### `watchlist.getTickers`
Get user's watchlist

**Type**: Query (Protected)

**Response**:
```typescript
Array<{
  id: number;
  symbol: string;
  companyName: string;
  snapshotScore?: number;
  snapshotData: Record<string, any>;
  notes?: string;
  addedAt: Date;
}>
```

**Example**:
```typescript
const { data: watchlist } = trpc.watchlist.getTickers.useQuery();
```

#### `watchlist.addTicker`
Add stock to user's watchlist

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  symbol: string;
  notes?: string;
}
```

**Response**:
```typescript
{
  id: number;
  success: true;
}
```

**Example**:
```typescript
const addToWatchlist = trpc.watchlist.addTicker.useMutation();

addToWatchlist.mutate({
  symbol: "AAPL",
  notes: "Strong fundamentals, good entry point"
});
```

#### `watchlist.removeTicker`
Remove stock from user's watchlist

**Type**: Mutation (Protected)

**Input**:
```typescript
{ tickerId: number }
```

**Response**:
```typescript
{ success: true }
```

**Example**:
```typescript
const removeFromWatchlist = trpc.watchlist.removeTicker.useMutation();

removeFromWatchlist.mutate({ tickerId: 123 });
```

#### `watchlist.isInWatchlist`
Check if stock is in user's watchlist

**Type**: Query (Protected)

**Input**:
```typescript
{ symbol: string }
```

**Response**:
```typescript
boolean
```

**Example**:
```typescript
const { data: isInWatchlist } = trpc.watchlist.isInWatchlist.useQuery({
  symbol: "AAPL"
});
```

---

### Alerts (Protected)

#### `alerts.list`
Get user's alerts

**Type**: Query (Protected)

**Response**:
```typescript
Array<{
  id: number;
  alertType: "score_threshold" | "new_opportunity";
  symbol?: string;
  personaId?: string;
  thresholdScore?: number;
  thresholdDirection?: "above" | "below";
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
}>
```

**Example**:
```typescript
const { data: alerts } = trpc.alerts.list.useQuery();
```

#### `alerts.create`
Create new alert

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  alertType: "score_threshold" | "new_opportunity";
  symbol?: string;
  personaId?: string;
  thresholdScore?: number;
  thresholdDirection?: "above" | "below";
}
```

**Response**:
```typescript
{
  id: number;
  success: true;
}
```

**Example**:
```typescript
const createAlert = trpc.alerts.create.useMutation();

createAlert.mutate({
  alertType: "score_threshold",
  symbol: "AAPL",
  thresholdScore: 70,
  thresholdDirection: "above"
});
```

#### `alerts.delete`
Delete alert

**Type**: Mutation (Protected)

**Input**:
```typescript
{ alertId: number }
```

**Response**:
```typescript
{ success: true }
```

**Example**:
```typescript
const deleteAlert = trpc.alerts.delete.useMutation();

deleteAlert.mutate({ alertId: 123 });
```

---

## Error Handling

All endpoints return typed errors with error codes:

```typescript
// Error structure
{
  code: "UNAUTHORIZED" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
  message: string;
}
```

**Example**:
```typescript
const { data, error } = await trpc.tickers.getBySymbol.useQuery({
  symbol: "INVALID"
});

if (error) {
  console.error(error.code, error.message);
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP
- Authenticated users: 500 requests per 15 minutes

## Pagination

Some endpoints support pagination:

```typescript
{
  limit?: number; // Default: 50, Max: 100
  offset?: number; // Default: 0
}
```

## Caching

- Financial data: 1 hour
- Analysis results: 24 hours
- Persona data: 7 days

Add cache headers to requests:

```typescript
const { data } = trpc.tickers.getFinancialData.useQuery(
  { symbol: "AAPL" },
  { staleTime: 1000 * 60 * 60 } // 1 hour
);
```

## Response Types

### AnalysisOutput
```typescript
{
  id: number;
  runId: string;
  ticker: string;
  personaId: string;
  personaName: string;
  score: number; // 0-100
  verdict: string;
  confidence: number;
  summaryBullets: string[];
  criteria: Record<string, any>;
  keyRisks: string[];
  whatWouldChangeMind: string[];
  dataUsed: Array<{
    source: string;
    endpoint: string;
    timestamp: number;
  }>;
  citations: string[];
  runMetadata: {
    model: string;
    version: string;
    runTime: number;
    inputsHash: string;
    mode: string;
  };
  runTimestamp: Date;
}
```

### OpportunityOutput
```typescript
{
  id: number;
  personaId: string;
  personaName: string;
  ticker: {
    symbol: string;
    companyName: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
    exchange?: string;
  };
  analysis: AnalysisOutput;
  rank: number;
  whyNow: string[];
  keyMetrics: Record<string, any>;
  changeStatus: string;
  previousScore?: number;
  scanDate: Date;
  scanTimestamp: Date;
}
```

## Examples

### Complete Analysis Workflow

```typescript
// 1. Search for stock
const { data: searchResults } = await trpc.tickers.search.useQuery({
  query: "AAPL"
});

// 2. Get ticker details
const { data: ticker } = await trpc.tickers.getBySymbol.useQuery({
  symbol: "AAPL"
});

// 3. Get financial data
const { data: financialData } = await trpc.tickers.getFinancialData.useQuery({
  symbol: "AAPL"
});

// 4. Run analysis
const runAnalysis = trpc.analyses.runAnalysis.useMutation();
const { data: analyses } = await runAnalysis.mutateAsync({
  symbol: "AAPL",
  mode: "quick"
});

// 5. Get latest analyses
const { data: latestAnalyses } = await trpc.analyses.getLatestForTicker.useQuery({
  symbol: "AAPL"
});

// 6. Add to watchlist
const addToWatchlist = trpc.watchlist.addTicker.useMutation();
await addToWatchlist.mutateAsync({
  symbol: "AAPL",
  notes: "Strong buy signal"
});

// 7. Create alert
const createAlert = trpc.alerts.create.useMutation();
await createAlert.mutateAsync({
  alertType: "score_threshold",
  symbol: "AAPL",
  thresholdScore: 70,
  thresholdDirection: "above"
});
```

---

For more information, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [README.md](./README.md)
