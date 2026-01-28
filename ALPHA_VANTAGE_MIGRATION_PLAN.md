# Alpha Vantage API Migration Plan

## Executive Summary
Migrate Guru Lens from yfinance to Alpha Vantage API as the primary financial data source while maintaining **100% backward compatibility** with existing business logic, formulas, and agent interfaces. The goal is a **data source swap only** - all downstream code (fundamental agent, valuation agent, persona agents, TTM calculations, ratio formulas) remains completely unchanged. Alpha Vantage provides better rate limiting handling, no IP-based blocking, and comprehensive financial data coverage.

---

## Current System Architecture

### Data Flow
```
User Request → Node.js Server → Python yfinanceWrapper.py → yfinance Library → Yahoo Finance API
                                                                    ↓
                                                        Returns JSON → Node.js → Frontend
```

### Integration Points (Files to Modify)
1. **server/services/yfinanceWrapper.py** - Main data fetching script
2. **server/services/realFinancialData.ts** - Node.js wrapper that spawns Python process
3. **server/services/currencyDetector.py** - Currency conversion using yfinance
4. **server/services/balanceSheetHistory.ts** - Historical balance sheet data (Python)
5. **server/services/hybridScoringOrchestrator.ts** - Uses financial data for scoring
6. **server/services/opportunityScanningService.ts** - Fetches data for multiple stocks

### Data Requirements from yfinance
```typescript
{
  price: { current, open, high, low, close, volume, change, changePercent },
  profile: { companyName, sector, industry, description, employees, website, marketCap },
  ratios: { pe, pb, ps, roe, roic, roa, currentRatio, debtToEquity, margins, dividendYield },
  financials: [ { revenue, netIncome, eps, operatingIncome, freeCashFlow } ],
  quarterlyFinancials: [ { revenue, netIncome, eps, operatingIncome } ],
  historicalBars: [ { date, open, high, low, close, volume } ],
  balanceSheet: { totalAssets, totalLiabilities, totalEquity, totalDebt, cash }
}
```

---

## Alpha Vantage API Overview

### Advantages
- **No IP Rate Limiting** - Uses API key-based rate limiting (5 calls/min, 500/day free tier)
- **Reliable** - Established financial data provider, no connection drops
- **Comprehensive** - Covers stocks, forex, crypto, technical indicators
- **Free Tier** - 500 requests/day sufficient for testing and small-scale use
- **Premium Tiers** - Scalable for production (up to 120,000 requests/day)

### API Key
- Already configured in environment: `POLYGON_API_KEY` (can reuse or get new one from alphavantage.co)
- Free tier: https://www.alphavantage.co/api/

### Rate Limiting
- Free: 5 requests/minute, 500/day
- Premium: Up to 120,000 requests/day
- **Strategy**: Implement caching to reduce API calls

### Supported Endpoints
| Endpoint | Purpose | Data Available |
|----------|---------|-----------------|
| `GLOBAL_QUOTE` | Current price & basic info | Price, volume, change |
| `OVERVIEW` | Company profile | Sector, industry, description, market cap |
| `INCOME_STATEMENT` | Annual financials | Revenue, net income, EPS, margins |
| `BALANCE_SHEET` | Balance sheet data | Assets, liabilities, equity, debt, cash |
| `CASH_FLOW` | Cash flow statement | Operating CF, free CF, capex |
| `EARNINGS` | Quarterly earnings | EPS, revenue by quarter |
| `TIME_SERIES_DAILY` | Historical prices | OHLCV data |
| `CURRENCY_EXCHANGE_RATE` | FX rates | Exchange rates for currency conversion |

---

## Migration Roadmap

### Phase 1: Create Alpha Vantage Wrapper (Week 1)
**Goal**: Build new Python wrapper that mirrors yfinance interface

**Files to Create**:
- `server/services/alphaVantageWrapper.py` - Main API wrapper
- `server/services/alphaVantageCache.ts` - Caching layer (Redis/in-memory)

**Implementation Steps**:
1. Create `alphaVantageWrapper.py` with functions:
   - `get_stock_data(symbol)` - Combines OVERVIEW + GLOBAL_QUOTE + INCOME_STATEMENT
   - `get_balance_sheet(symbol)` - Fetches BALANCE_SHEET
   - `get_cash_flow(symbol)` - Fetches CASH_FLOW
   - `get_historical_prices(symbol)` - Fetches TIME_SERIES_DAILY
   - `get_exchange_rate(from_currency, to_currency)` - Currency conversion

2. Handle Alpha Vantage responses:
   - Parse JSON responses
   - Handle rate limiting (429 responses with retry)
   - Map Alpha Vantage fields to yfinance schema
   - Error handling for missing data

3. Implement caching:
   - Cache company profiles (expires: 30 days)
   - Cache financial statements (expires: 1 day)
   - Cache historical prices (expires: 1 day)
   - Cache exchange rates (expires: 1 hour)

**Data Mapping**:
```python
# Alpha Vantage → yfinance schema mapping
{
  "GLOBAL_QUOTE": {
    "01. symbol": symbol,
    "05. price": current_price,
    "09. change": price_change,
    "10. change percent": change_percent,
    "06. volume": volume
  },
  "OVERVIEW": {
    "Name": companyName,
    "Sector": sector,
    "Industry": industry,
    "Description": description,
    "MarketCapitalization": marketCap
  }
}
```

### Phase 2: Update Node.js Integration (Week 1)
**Goal**: Update realFinancialData.ts to use new wrapper

**Files to Modify**:
- `server/services/realFinancialData.ts` - Update to call alphaVantageWrapper.py
- `server/services/realFinancialData.ts` - No code changes needed, just Python swap

**Implementation Steps**:
1. Update `getStockData()` to spawn `alphaVantageWrapper.py` instead of `yfinanceWrapper.py`
2. Verify response schema matches existing interface
3. Update error handling for Alpha Vantage-specific errors

### Phase 3: Update Currency Detection (Week 1)
**Goal**: Migrate currency detection from yfinance to Alpha Vantage

**Files to Modify**:
- `server/services/currencyDetector.py` - Replace yfinance with Alpha Vantage

**Implementation Steps**:
1. Update `detect_financial_currency()` to use Alpha Vantage OVERVIEW
2. Update `get_exchange_rate()` to use Alpha Vantage CURRENCY_EXCHANGE_RATE
3. Remove yfinance imports

### Phase 4: Update Balance Sheet History (Week 2)
**Goal**: Migrate balance sheet fetching to Alpha Vantage

**Files to Modify**:
- `server/services/balanceSheetHistory.ts` - Replace yfinance with Alpha Vantage

**Implementation Steps**:
1. Create `getBalanceSheetHistory()` using Alpha Vantage BALANCE_SHEET endpoint
2. Parse historical balance sheet data
3. Handle annual vs quarterly data

### Phase 5: Testing & Validation (Week 2)
**Goal**: Verify all data flows work correctly

**Test Cases**:
1. Individual ticker analysis (PDD, AAPL, MSFT, etc.)
2. Opportunity scanner with 5-10 stocks
3. Financial metrics accuracy
4. Currency conversion for international stocks
5. Rate limiting handling
6. Error handling for invalid tickers

**Testing Approach**:
- Unit tests for alphaVantageWrapper.py
- Integration tests for realFinancialData.ts
- End-to-end tests for UI flows
- Performance benchmarks vs yfinance

### Phase 6: Cleanup & Optimization (Week 2)
**Goal**: Remove yfinance, optimize caching

**Files to Delete**:
- `server/services/yfinanceWrapper.py`
- `server/services/yfinanceWrapper_backup.py`
- `server/services/yfinanceWrapper_v2.py`

**Optimization**:
1. Implement Redis caching for production
2. Add cache warming for popular stocks
3. Implement batch API calls where possible
4. Monitor API usage and adjust tier if needed

---

## Implementation Details

### alphaVantageWrapper.py Structure
```python
import requests
import json
import time
from functools import lru_cache
from datetime import datetime, timedelta

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

class AlphaVantageCache:
    """In-memory cache with TTL"""
    def __init__(self):
        self.cache = {}
        self.expiry = {}
    
    def get(self, key):
        if key in self.cache:
            if datetime.now() < self.expiry.get(key, datetime.now()):
                return self.cache[key]
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value, ttl_seconds):
        self.cache[key] = value
        self.expiry[key] = datetime.now() + timedelta(seconds=ttl_seconds)

cache = AlphaVantageCache()

def get_stock_data(symbol):
    """Fetch comprehensive stock data"""
    # Check cache first
    cached = cache.get(f"stock_{symbol}")
    if cached:
        return cached
    
    # Fetch from Alpha Vantage
    overview = fetch_overview(symbol)
    quote = fetch_global_quote(symbol)
    income = fetch_income_statement(symbol)
    
    # Combine and cache
    data = combine_data(overview, quote, income)
    cache.set(f"stock_{symbol}", data, ttl_seconds=86400)
    
    return data

def fetch_overview(symbol):
    """Fetch company overview"""
    params = {
        "function": "OVERVIEW",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    return response.json()

def fetch_global_quote(symbol):
    """Fetch current price quote"""
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    return response.json()

# ... more functions
```

### Rate Limiting Strategy
```python
import time
from datetime import datetime, timedelta

class RateLimiter:
    """Implement rate limiting for Alpha Vantage (5 calls/min)"""
    def __init__(self, calls_per_minute=5):
        self.calls_per_minute = calls_per_minute
        self.call_times = []
    
    def wait_if_needed(self):
        now = datetime.now()
        # Remove calls older than 1 minute
        self.call_times = [t for t in self.call_times if (now - t).total_seconds() < 60]
        
        if len(self.call_times) >= self.calls_per_minute:
            sleep_time = 60 - (now - self.call_times[0]).total_seconds()
            if sleep_time > 0:
                time.sleep(sleep_time)
        
        self.call_times.append(datetime.now())

limiter = RateLimiter()

def api_call(symbol):
    limiter.wait_if_needed()
    # Make API call
```

---

## Environment Configuration

### Required Environment Variables
```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### Optional Configuration
```bash
ALPHA_VANTAGE_CACHE_TTL=86400  # 1 day for financials
ALPHA_VANTAGE_PRICE_CACHE_TTL=3600  # 1 hour for prices
ALPHA_VANTAGE_RATE_LIMIT=5  # calls per minute (free tier)
```

---

## Fallback Strategy

### If Alpha Vantage Fails
1. **Retry with exponential backoff** - 3 retries with 2^n second delays
2. **Use cached data** - Return last known good data if available
3. **Graceful degradation** - Show error message to user with cached data if available
4. **Fallback to alternative** - Can implement FMP or Polygon as secondary source

### Error Handling
```python
try:
    data = fetch_from_alpha_vantage(symbol)
except RateLimitError:
    # Wait and retry
    time.sleep(60)
    data = fetch_from_alpha_vantage(symbol)
except APIError:
    # Use cached data
    data = cache.get(symbol)
    if not data:
        raise
```

---

## Performance Considerations

### Caching Strategy
| Data Type | TTL | Reason |
|-----------|-----|--------|
| Company Profile | 30 days | Changes infrequently |
| Financial Statements | 1 day | Updated quarterly/annually |
| Historical Prices | 1 day | Updated daily |
| Current Price | 5 minutes | Changes frequently |
| Exchange Rates | 1 hour | Changes throughout day |

### Batch Operations
- **Opportunity Scanner**: Fetch data for 5-10 stocks sequentially with rate limiting
- **Estimated Time**: 10 stocks × (1 call + 0.2s delay) = ~12 seconds
- **Much faster than yfinance** which hangs indefinitely

### API Call Optimization
- Combine multiple endpoints in single call where possible
- Use batch endpoints if available
- Cache aggressively to reduce API calls
- Pre-warm cache for popular stocks (AAPL, MSFT, GOOGL, etc.)

---

## Rollback Plan

### If Migration Fails
1. Keep yfinance wrapper files in git history
2. Tag current commit before migration starts
3. Can revert to previous version if needed
4. Parallel run both systems during transition period

### Testing Before Production
1. Run both systems side-by-side for 1 week
2. Compare data accuracy and latency
3. Verify all UI flows work correctly
4. Get user feedback on data quality

---

## Success Metrics

### Before Migration
- Scan time: 4+ minutes (hangs frequently)
- Success rate: ~20% (rate-limited)
- Error messages: "Connection closed abruptly"

### After Migration
- Scan time: ~30-60 seconds (5-10 stocks)
- Success rate: 95%+ (only fails on invalid tickers)
- Error messages: Clear, actionable feedback
- Individual ticker analysis: Instant (<2 seconds)

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Alpha Vantage Wrapper | 3-4 days | Not started |
| Phase 2: Node.js Integration | 1-2 days | Not started |
| Phase 3: Currency Detection | 1 day | Not started |
| Phase 4: Balance Sheet History | 2 days | Not started |
| Phase 5: Testing & Validation | 3-4 days | Not started |
| Phase 6: Cleanup & Optimization | 1-2 days | Not started |
| **Total** | **~2 weeks** | |

---

## Conclusion

Migrating to Alpha Vantage API will:
1. ✅ Eliminate rate-limiting issues
2. ✅ Improve reliability and uptime
3. ✅ Reduce scan time from 4+ minutes to <1 minute
4. ✅ Provide better error handling
5. ✅ Enable scalability for production use
6. ✅ Maintain all existing functionality

The migration is straightforward because we're replacing the data source while keeping the same data schema, so minimal UI/business logic changes are needed.


---

## Caching & Persistence Strategy

### Overview
Implement a two-tier caching system to support efficient scanning and persona-based opportunity tracking:

**Phase 1: Preliminary Financial Filtering Cache**
- Store 5000+ stocks with basic financial metrics
- Used for initial screening before LLM analysis
- Reusable across all personas
- TTL: Permanent (until manual refresh)
- Storage: Database (PostgreSQL/MySQL) for persistence

**Phase 2: Opportunity Storage**
- Store 50 opportunities per persona after LLM analysis
- Include full financial data snapshot + LLM analysis results
- Track historical scans and results
- TTL: Permanent (user reference)
- Storage: Database with versioning

### Database Schema

#### Table 1: StockFinancialCache
```sql
CREATE TABLE stock_financial_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  
  -- Basic Financials (used for filtering)
  pe_ratio FLOAT,
  pb_ratio FLOAT,
  ps_ratio FLOAT,
  roe FLOAT,
  roa FLOAT,
  roic FLOAT,
  gross_margin FLOAT,
  operating_margin FLOAT,
  net_margin FLOAT,
  current_ratio FLOAT,
  debt_to_equity FLOAT,
  dividend_yield FLOAT,
  interest_coverage FLOAT,
  
  -- Metadata
  last_updated TIMESTAMP,
  data_source VARCHAR(50),
  data_quality_score FLOAT,
  refresh_required BOOLEAN DEFAULT FALSE,
  
  INDEX idx_symbol (symbol),
  INDEX idx_sector (sector),
  INDEX idx_last_updated (last_updated)
);
```

#### Table 2: OpportunityScan
```sql
CREATE TABLE opportunity_scan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scan_id VARCHAR(36) UNIQUE NOT NULL,
  persona_name VARCHAR(100) NOT NULL,
  scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scan_status ENUM('in_progress', 'completed', 'failed'),
  total_stocks_analyzed INT,
  opportunities_found INT,
  
  INDEX idx_persona (persona_name),
  INDEX idx_scan_date (scan_date),
  INDEX idx_scan_id (scan_id)
);
```

#### Table 3: Opportunity
```sql
CREATE TABLE opportunity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scan_id VARCHAR(36) NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  persona_name VARCHAR(100),
  
  -- Score & Verdict
  investment_score INT,
  score_verdict VARCHAR(50),
  confidence_level INT,
  
  -- Financial Data Snapshot (JSON for flexibility)
  financial_data JSON,
  
  -- LLM Analysis Results (JSON)
  llm_analysis JSON,
  
  -- Scoring Details
  scoring_criteria JSON,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT,
  
  FOREIGN KEY (scan_id) REFERENCES opportunity_scan(scan_id),
  INDEX idx_ticker (ticker),
  INDEX idx_persona (persona_name),
  INDEX idx_score (investment_score),
  INDEX idx_scan_id (scan_id)
);
```

### Cache Implementation Strategy

#### Phase 1: Preliminary Financial Cache
**Purpose**: Avoid fetching financial data for 5000+ stocks every scan

**Usage in Scanning**:
1. Query cache instead of API for preliminary filtering
2. Get top 100 candidates based on persona criteria
3. Fetch fresh data from API only for top 50
4. Store results in opportunity table

**Cache Invalidation**:
- No automatic expiration (permanent until refresh)
- Manual: Admin endpoint to refresh specific sectors or all stocks
- Smart: Mark for refresh if stock price changed >5% or earnings announced
- Refresh workflow: Mark `refresh_required = TRUE`, then update on next scheduled job

#### Phase 2: Opportunity Storage
**Purpose**: Persist LLM analysis results and financial snapshots

**Data Stored**:
- Complete financial data snapshot (as JSON)
- Complete LLM analysis results
- Score breakdown and criteria
- Persona name and scan date
- Confidence level and verdict

### Performance Optimization

**Preliminary Filtering (Phase 1)**:
- Time: ~2-5 seconds (database query, no API calls)
- Returns: Top 100 candidates from 5000 cached stocks
- Benefit: 50x faster than fetching from API

**Detailed Analysis (Phase 2)**:
- Time: ~30-60 seconds (100 candidates analyzed)
- Includes: API calls + LLM analysis + database storage
- Benefit: Reuses preliminary cache, only fetches fresh data for top candidates

**Overall Scan Time**:
- Before: 4+ minutes (hangs due to rate limiting)
- After: ~1-2 minutes (5000 stocks cached, only analyze top 50)
- Improvement: 2-4x faster

### Cache Maintenance

**Scheduled Tasks**:
1. Daily: Check for stocks marked `refresh_required = TRUE` and update them
2. Manual Refresh: Admin endpoint to refresh specific sectors or all stocks
3. Monthly: Rebuild cache (add new stocks, remove delisted)
4. Quarterly: Archive old scans (keep last 12 months)
5. On-demand: Refresh individual stock when user requests fresh analysis

**Monitoring**:
- Track cache hit rate (should be >95%)
- Monitor cache staleness (show last_updated timestamp in UI)
- Alert on cache misses (indicates new stocks)
- Track database size (should be <500MB for 5000 stocks)
- Track refresh_required count (stocks pending update)

### Cache & Persistence Benefits

**Phase 1: Preliminary Financial Cache (5000+ stocks)**
- Eliminates API calls for preliminary filtering
- Enables fast screening across 5000 stocks in <2 seconds
- Reusable across all personas
- Reduces API usage by 90%
- Enables historical trend analysis
- Permanent storage until manual refresh (no automatic expiration)
- User can request fresh data on-demand for specific stocks

**Phase 2: Opportunity Storage (50 per persona)**
- Persistent record of all LLM analysis results
- Full financial data snapshot at time of analysis
- Enables user reference and comparison
- Tracks score breakdown and reasoning
- Supports historical analysis
- Enables portfolio tracking
