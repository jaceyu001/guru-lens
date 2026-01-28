# Guru Lens: Complete System Architecture
## API Migration, Workflow, and Storage Plan

**Document Version**: 1.0  
**Date**: January 28, 2026  
**Status**: Planning & Design Phase

---

## Executive Summary

Guru Lens is transitioning from yfinance (rate-limited, unreliable) to Alpha Vantage API as the primary financial data source. The system implements a two-tier caching strategy with intelligent workflow optimization:

- **Phase 1 (Preliminary Filtering)**: Analyze 5000+ stocks using financial criteria, select top 50
- **Phase 2 (Detailed Analysis)**: Run LLM analysis on top 50, store complete results
- **Cache System**: Permanent storage of financial data, updated on-demand or when refresh needed

**Expected Improvements**:
- Scan time: 4+ minutes → 1-2 minutes (50-70% faster)
- API reliability: 100% → 99%+ (no rate limiting)
- Data freshness: Always current (fresh API data + smart caching)

---

## Part 1: Current State & Problems

### Current Issues with yfinance

**Problem 1: Rate Limiting**
- Yahoo Finance blocks sandbox IP after multiple requests
- Returns HTTP 429 (Too Many Requests)
- yfinance hangs indefinitely waiting for response
- No built-in timeout handling in yfinance

**Problem 2: Network Connectivity**
- curl library fails with "Connection closed abruptly"
- Signal-based timeout interrupts mid-stream
- No graceful error recovery

**Problem 3: Performance Impact**
- Individual analysis page: Blank (data never arrives)
- Scanner: Hangs after 2+ minutes
- All LLM analysis blocked (depends on financial data)

**Problem 4: Reliability**
- 0% success rate in sandbox environment
- No fallback mechanism
- No data persistence for retry

---

## Part 2: Alpha Vantage API Solution

### Why Alpha Vantage?

| Feature | yfinance | Alpha Vantage |
|---------|----------|---------------|
| Rate Limiting | IP-based (blocks sandbox) | API key-based (predictable) |
| Reliability | Unreliable in sandbox | Stable, proven |
| Timeout Handling | None (hangs) | Built-in (respects timeouts) |
| Data Quality | Good | Excellent |
| Free Tier | Unlimited | 500 requests/day |
| Premium Tiers | N/A | Available for scaling |
| API Documentation | Limited | Comprehensive |

### Alpha Vantage Data Available

**Stock Data Endpoints**:
- `TIME_SERIES_DAILY`: Daily OHLCV data
- `TIME_SERIES_INTRADAY`: Intraday data (1min, 5min, 15min, 30min, 60min)
- `GLOBAL_QUOTE`: Current price and basic info
- `OVERVIEW`: Company profile and fundamentals

**Fundamental Data Endpoints**:
- `INCOME_STATEMENT`: Annual and quarterly income statements
- `BALANCE_SHEET`: Annual and quarterly balance sheets
- `CASH_FLOW`: Annual and quarterly cash flow statements
- `EARNINGS`: Quarterly earnings data

**Technical Analysis Endpoints**:
- `SMA`: Simple Moving Average
- `EMA`: Exponential Moving Average
- `RSI`: Relative Strength Index
- `MACD`: MACD indicator
- `BBANDS`: Bollinger Bands

### Data Mapping: yfinance → Alpha Vantage

#### Price & Quote Data
```
yfinance.Ticker.info['currentPrice']     → Alpha Vantage GLOBAL_QUOTE['05. price']
yfinance.Ticker.info['marketCap']        → Alpha Vantage OVERVIEW['MarketCapitalization']
yfinance.Ticker.info['trailingPE']       → Alpha Vantage OVERVIEW['TrailingPE']
yfinance.Ticker.info['priceToBook']      → Alpha Vantage OVERVIEW['PriceToBookRatio']
yfinance.Ticker.info['priceToSalesTrail']→ Alpha Vantage OVERVIEW['PriceToSalesRatioTTM']
```

#### Financial Metrics
```
yfinance.Ticker.info['returnOnEquity']   → Calculate from Balance Sheet + Income Statement
yfinance.Ticker.info['returnOnAssets']   → Calculate from Balance Sheet + Income Statement
yfinance.Ticker.info['profitMargins']    → Alpha Vantage INCOME_STATEMENT['NetIncome'] / Revenue
yfinance.Ticker.info['operatingMargins'] → Alpha Vantage INCOME_STATEMENT['OperatingIncome'] / Revenue
```

#### Quarterly/Annual Data
```
yfinance.Ticker.quarterly_financials     → Alpha Vantage INCOME_STATEMENT (quarterly reports)
yfinance.Ticker.financials               → Alpha Vantage INCOME_STATEMENT (annual reports)
yfinance.Ticker.quarterly_balance_sheet  → Alpha Vantage BALANCE_SHEET (quarterly)
yfinance.Ticker.balance_sheet            → Alpha Vantage BALANCE_SHEET (annual)
yfinance.Ticker.quarterly_cashflow       → Alpha Vantage CASH_FLOW (quarterly)
yfinance.Ticker.cashflow                 → Alpha Vantage CASH_FLOW (annual)
```

### TTM (Trailing Twelve Months) Calculations

All TTM calculations remain identical, just using Alpha Vantage data:

```typescript
// TTM Revenue = Sum of last 4 quarters
const ttmRevenue = Q1_Revenue + Q2_Revenue + Q3_Revenue + Q4_Revenue;

// TTM EPS = TTM Net Income / Shares Outstanding
const ttmEPS = ttmNetIncome / sharesOutstanding;

// TTM Free Cash Flow = Sum of last 4 quarters
const ttmFCF = Q1_FCF + Q2_FCF + Q3_FCF + Q4_FCF;

// ROE = Net Income / Shareholders' Equity
const roe = netIncome / equity;

// ROA = Net Income / Total Assets
const roa = netIncome / totalAssets;

// ROIC = NOPAT / Invested Capital
const roic = nopat / investedCapital;
```

---

## Part 3: System Architecture

### 3.1 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Guru Lens System                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼─────────┐
            │  Frontend UI   │  │  Backend API   │
            │  (React)       │  │  (Node.js)     │
            └───────┬────────┘  └──────┬─────────┘
                    │                   │
                    └───────────┬───────┘
                                │
                    ┌───────────▼────────────┐
                    │   tRPC Procedures      │
                    │  - scan.startScan      │
                    │  - scan.getOpportunities
                    │  - opportunity.save    │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
    ┌───▼─────────┐  ┌─────────▼──────────┐  ┌────────▼────────┐
    │  Financial  │  │  LLM Analysis      │  │  Database       │
    │  Data       │  │  Engine            │  │  (MySQL/TiDB)   │
    │  Pipeline   │  │  (Claude/GPT-4)    │  │                 │
    └───┬─────────┘  └─────────┬──────────┘  └────────┬────────┘
        │                      │                      │
        │                      │                      │
    ┌───▼─────────────────────────────────────────────▼────────┐
    │              Data Persistence Layer                      │
    │  ┌──────────────────────────────────────────────────┐   │
    │  │ 1. stock_financial_cache (5000+ stocks)         │   │
    │  │ 2. opportunity_scan (scan metadata)             │   │
    │  │ 3. opportunity (50 per scan with full data)     │   │
    │  └──────────────────────────────────────────────────┘   │
    └───┬─────────────────────────────────────────────────────┘
        │
        └─────────────────────────┬──────────────────────────┐
                                  │                          │
                        ┌─────────▼──────────┐  ┌───────────▼────────┐
                        │ Alpha Vantage API  │  │ Cache Fallback     │
                        │ (Primary Source)   │  │ (When API fails)   │
                        └────────────────────┘  └────────────────────┘
```

### 3.2 Component Responsibilities

#### Frontend (React)
- Display scanner UI with persona selection
- Show scan progress and results
- Display opportunity details modal
- Save/bookmark opportunities
- Compare opportunities side-by-side

#### Backend (Node.js + tRPC)
- Orchestrate scan workflow
- Manage financial data fetching
- Coordinate LLM analysis
- Store results in database
- Handle caching logic

#### Financial Data Pipeline
- Fetch from Alpha Vantage API
- Calculate financial metrics
- Compute TTM values
- Update cache
- Handle errors and fallbacks

#### LLM Analysis Engine
- Receive financial data
- Generate investment thesis
- Identify strengths and risks
- Calculate investment scores
- Provide confidence levels

#### Database Layer
- Store financial cache (5000+ stocks)
- Persist scan metadata
- Store 50 opportunities per scan
- Track user interactions (saves, notes)
- Support historical queries

---

## Part 4: Workflow - Detailed Scan Process

### 4.1 Complete Scan Workflow

```
USER INITIATES SCAN
    ↓
[Step 1: Create Scan Record]
├─ Generate unique scan_id (UUID)
├─ Record persona_name
├─ Set status = 'in_progress'
└─ Store in opportunity_scan table
    ↓
[Step 2: Phase 1 - Preliminary Filtering]
├─ For each stock in universe (5000+):
│  ├─ Call getFinancialDataWithFallback(ticker)
│  │  ├─ Try: Query stock_financial_cache
│  │  ├─ On cache hit: Use cached data (if refresh_required = FALSE)
│  │  ├─ On cache miss or refresh_required: Fetch fresh from Alpha Vantage API
│  │  └─ On API success: Update cache with fresh data (max 4 years: TTM + 3 full years)
│  │
│  ├─ Apply persona financial criteria
│  │  ├─ Check PE ratio range
│  │  ├─ Check PB ratio range
│  │  ├─ Check profit margins
│  │  ├─ Check ROE/ROA/ROIC
│  │  └─ Check debt ratios
│  │
│  ├─ If passes criteria:
│  │  ├─ Calculate financial_score
│  │  └─ Add to candidates list
│  │
│  └─ Track: API calls, cache hits, failures
│
├─ Sort candidates by financial_score (descending)
├─ Select top 50 candidates
└─ Return: [Top 50 stocks with financial data]
    ↓
[Step 3: Phase 2 - Detailed Analysis]
├─ For each of top 50 candidates (rank 1-50):
│  ├─ Call getFinancialDataWithFallback(ticker)
│  │  ├─ Try: Query stock_financial_cache
│  │  ├─ On cache hit: Use cached data (if refresh_required = FALSE)
│  │  ├─ On cache miss or refresh_required: Fetch fresh from Alpha Vantage API
│  │  ├─ On API success: Update cache with fresh data (max 4 years: TTM + 3 full years)
│  │  └─ Optional: Query valuation or fundamental agent for additional insights
│  │
│  ├─ Call runLLMAnalysis(ticker, financialData, persona)
│  │  ├─ Input: Financial data (cache or fresh API)
│  │  ├─ Process: Generate investment thesis
│  │  ├─ Output: Analysis with strengths, risks, catalysts
│  │  └─ Track: LLM call count
│  │
│  ├─ Call calculateInvestmentScore(financialData, llmAnalysis)
│  │  ├─ Score each criterion (valuation, growth, profitability, etc.)
│  │  ├─ Apply weights
│  │  ├─ Calculate total score (0-100)
│  │  ├─ Determine verdict (strong_buy, buy, hold, sell)
│  │  └─ Return: Complete scoring breakdown
│  │
│  ├─ Call storeOpportunity(...)
│  │  ├─ Store ticker, company info
│  │  ├─ Store complete financial_data_snapshot (JSON)
│  │  ├─ Store complete llm_analysis_results (JSON)
│  │  ├─ Store complete scoring_criteria_breakdown (JSON)
│  │  └─ Set opportunity_rank = current rank
│  │
│  └─ Track: API calls, cache hits, LLM calls, failures
│
└─ Return: 50 opportunities stored
    ↓
[Step 4: Phase 3 - Finalization]
├─ Calculate scan statistics:
│  ├─ total_stocks_analyzed = 5000
│  ├─ candidates_from_cache = cache_hits
│  ├─ opportunities_found = 50
│  ├─ scan_duration_seconds = elapsed time
│  ├─ api_calls_made = phase1_api + phase2_api
│  └─ llm_calls_made = 50
│
├─ Update opportunity_scan record:
│  ├─ Set status = 'completed'
│  ├─ Store all statistics
│  └─ Set updated_at timestamp
│
└─ Notify user: "Scan complete! Found 50 opportunities"
    ↓
RESULTS AVAILABLE IN UI
```

### 4.2 Data Fetching Strategy

#### getFinancialDataWithFallback() Function

```
Input: ticker (string)
    ↓
[Attempt 1: Cached Data]
├─ Query stock_financial_cache WHERE symbol = ticker
├─ If cached data exists:
│  ├─ Check refresh_required flag
│  ├─ If refresh_required = FALSE:
│  │  └─ Return { data, source: 'cache', timestamp: cached_time }
│  └─ If refresh_required = TRUE:
│     └─ Continue to Attempt 2 (fetch fresh data)
│
└─ If no cache or refresh_required = TRUE:
    ↓
[Attempt 2: Fresh API Data]
├─ Call alphaVantageAPI.getStockData(ticker)
├─ Limit data to: TTM + 3 full years (max 4 years)
├─ If successful:
│  ├─ Call updateStockFinancialCache(ticker, data)
│  ├─ Return { data, source: 'api', timestamp: now }
│  └─ Continue to next stock
│
└─ If failed (timeout, rate limit, network error):
    ↓
[Attempt 3: Error Handling]
├─ If cache exists (even if refresh_required = TRUE):
│  ├─ Log warning: "API failed for ${ticker}, using stale cache"
│  └─ Return { data, source: 'cache_stale', timestamp: cached_time }
│
└─ If no cache:
    ├─ Log error: "Unable to fetch ${ticker}: API failed and no cache"
    ├─ Throw error to caller
    └─ Caller decides: skip stock or retry
```

### 4.3 Cache Update Strategy

#### updateStockFinancialCache() Function

```
Input: ticker, freshFinancialData
    ↓
[Extract Metrics from Fresh Data]
├─ Basic info: company_name, sector, industry, market_cap
├─ Ratios: PE, PB, PS, ROE, ROA, ROIC, margins, etc.
├─ Metadata: last_updated = now, refresh_required = FALSE
    ↓
[Insert or Update Cache]
├─ Check if ticker exists in stock_financial_cache
├─ If exists: UPDATE all fields
├─ If not exists: INSERT new record
│
└─ Result: Cache now has latest financial data
    ↓
[Cache Ready for Next Scan]
├─ Cache hit rate increases
├─ Subsequent scans use cached data as fallback
└─ Manual refresh can mark as refresh_required = TRUE
```

---

## Part 5: Storage Architecture

### 5.1 Database Schema

#### Table 1: stock_financial_cache
Stores financial data for 5000+ stocks. Permanent storage until manual refresh.

```sql
CREATE TABLE stock_financial_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  
  -- Financial Ratios
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
  INDEX idx_last_updated (last_updated),
  INDEX idx_refresh_required (refresh_required)
);
```

**Storage Estimate**: ~500 bytes per stock × 5000 = ~2.5 MB

#### Table 2: opportunity_scan
Tracks metadata for each scan execution per persona.

```sql
CREATE TABLE opportunity_scan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scan_id VARCHAR(36) UNIQUE NOT NULL,
  persona_name VARCHAR(100) NOT NULL,
  scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scan_status ENUM('in_progress', 'completed', 'failed'),
  
  -- Statistics
  total_stocks_analyzed INT,
  candidates_from_cache INT,
  opportunities_found INT,
  scan_duration_seconds INT,
  api_calls_made INT,
  llm_calls_made INT,
  
  -- Metadata
  created_by VARCHAR(100),
  error_message TEXT,
  notes TEXT,
  
  INDEX idx_persona (persona_name),
  INDEX idx_scan_date (scan_date),
  INDEX idx_scan_id (scan_id),
  INDEX idx_status (scan_status)
);
```

**Storage Estimate**: ~300 bytes per scan

#### Table 3: opportunity
Stores 50 opportunities per scan with complete financial and LLM data.

```sql
CREATE TABLE opportunity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Foreign Keys & Identifiers
  scan_id VARCHAR(36) NOT NULL,
  opportunity_rank INT,
  ticker VARCHAR(10) NOT NULL,
  
  -- Company Info
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  
  -- Persona & Score
  persona_name VARCHAR(100) NOT NULL,
  investment_score INT,
  score_verdict VARCHAR(50),
  confidence_level INT,
  
  -- Complete Data Snapshots (JSON)
  financial_data_snapshot JSON,      -- ~5-8 KB
  llm_analysis_results JSON,         -- ~3-5 KB
  scoring_criteria_breakdown JSON,   -- ~2-3 KB
  
  -- User Interaction
  user_saved BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 1,
  
  FOREIGN KEY (scan_id) REFERENCES opportunity_scan(scan_id),
  INDEX idx_ticker (ticker),
  INDEX idx_persona (persona_name),
  INDEX idx_score (investment_score),
  INDEX idx_scan_id (scan_id),
  INDEX idx_user_saved (user_saved)
);
```

**Storage Estimate**: ~11-16 KB per opportunity × 50 = ~550-800 KB per scan

### 5.2 Storage Capacity

```
Per Scan:
- opportunity_scan record: 300 bytes
- 50 opportunity records: 550-800 KB
- Total per scan: ~600-900 KB

For 1000 scans (1 year of data):
- 1000 × 600-900 KB = 600-900 MB
- Reasonable for most databases

For 10,000 scans (10 years):
- 10,000 × 600-900 KB = 6-9 GB
- May require archiving strategy
```

### 5.3 Data Retention Policy

**stock_financial_cache**:
- Retention: Permanent (until manual refresh)
- Cleanup: None (cache is reused)
- Archiving: Not needed

**opportunity_scan & opportunity**:
- Retention: 12 months (keep last year of scans)
- Cleanup: Archive scans older than 12 months
- Archiving: Move to separate archive tables

---

## Part 6: Implementation Phases

### Phase 0: Alpha Vantage Setup (1 week)
- [ ] Obtain Alpha Vantage API key
- [ ] Test API endpoints with sample tickers
- [ ] Verify data quality and completeness
- [ ] Document API response formats
- [ ] Create Python wrapper for Alpha Vantage

### Phase 1: Database Setup (1 week)
- [ ] Create stock_financial_cache table
- [ ] Create opportunity_scan table
- [ ] Create opportunity table
- [ ] Add all indexes
- [ ] Create migration scripts
- [ ] Test schema with sample data

### Phase 2: Backend Implementation (2 weeks)
- [ ] Implement preliminaryFilter() function
- [ ] Implement detailedAnalysis() function
- [ ] Implement getFinancialDataWithFallback() function
- [ ] Implement updateStockFinancialCache() function
- [ ] Implement storeOpportunity() function
- [ ] Integrate with opportunityScanningService.ts
- [ ] Add error handling and logging
- [ ] Write unit tests

### Phase 3: API Integration (1 week)
- [ ] Create tRPC procedures for scan operations
- [ ] Create tRPC procedures for opportunity retrieval
- [ ] Add authentication checks
- [ ] Test end-to-end API flow
- [ ] Performance testing

### Phase 4: Frontend Integration (1 week)
- [ ] Update OpportunityScannerPage component
- [ ] Update OpportunityDetailsModal component
- [ ] Add save/bookmark functionality
- [ ] Add comparison view
- [ ] Test UI with real data

### Phase 5: Testing & Optimization (1 week)
- [ ] Load testing (1000+ scans)
- [ ] Performance optimization
- [ ] Cache hit rate analysis
- [ ] Error recovery testing
- [ ] User acceptance testing

### Phase 6: Deployment (1 week)
- [ ] Migrate production database
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for issues
- [ ] Gradual rollout to users

**Total Timeline**: 8 weeks

---

## Part 7: Performance Expectations

### Scan Time Breakdown

**Before (yfinance)**:
- Phase 1: Hangs (rate limited)
- Phase 2: Hangs (rate limited)
- Total: 4+ minutes (or fails)

**After (Alpha Vantage + Cache)**:
- Phase 1: ~30 seconds (5000 stocks × 6ms/stock)
- Phase 2: ~60 seconds (50 stocks × 1.2s/stock including LLM)
- Total: ~90 seconds (1.5 minutes)

**Improvement**: 2-4x faster

### API Call Reduction

**Before**: 5000 API calls per scan (all fail due to rate limiting)

**After**: 
- First scan: ~4890 API calls (5000 Phase 1 + 50 Phase 2 - cache hits)
- Subsequent scans: ~50-100 API calls (mostly cache hits)

**Improvement**: 95%+ reduction in API calls after first scan

### Cache Hit Rate

**Scan 1**: 0% cache hit rate (all fresh data)
**Scan 2**: ~95% cache hit rate (reuse from Scan 1)
**Scan 3+**: ~95%+ cache hit rate (stable)

---

## Part 8: Risk Mitigation

### Risk 1: Alpha Vantage API Limits
**Risk**: Free tier limited to 500 requests/day
**Mitigation**: 
- Cache reduces API calls to ~50-100 per scan
- Can run 5+ scans per day on free tier
- Premium tier available for scaling

### Risk 2: Data Quality Differences
**Risk**: Alpha Vantage data might differ from yfinance
**Mitigation**:
- Comprehensive testing before deployment
- Comparison tests between APIs
- Tolerance levels for metric differences (±1%)
- Fallback to previous data if quality issues detected

### Risk 3: Cache Staleness
**Risk**: Cached data becomes outdated
**Mitigation**:
- Manual refresh endpoint for admin
- refresh_required flag for targeted updates
- User can request fresh data on-demand
- Automatic refresh on major price changes (>5%)

### Risk 4: Database Performance
**Risk**: Large result sets slow down queries
**Mitigation**:
- Proper indexing on all key fields
- Partitioning by date for large tables
- Archive old scans (>12 months)
- Query optimization and monitoring

---

## Part 9: Success Criteria

### Functional Requirements
- ✅ Migrate from yfinance to Alpha Vantage
- ✅ Maintain all existing business logic
- ✅ Preserve TTM calculations
- ✅ Store 50 opportunities per scan
- ✅ Persist complete financial data
- ✅ Persist complete LLM analysis
- ✅ Enable user bookmarking and notes
- ✅ Support opportunity comparison

### Performance Requirements
- ✅ Scan time: <2 minutes (vs 4+ minutes)
- ✅ API reliability: 99%+ (vs 0%)
- ✅ Cache hit rate: >95% (after first scan)
- ✅ Query response: <500ms
- ✅ Support 1000+ scans

### Data Quality Requirements
- ✅ Financial data accuracy: ±1% vs yfinance
- ✅ TTM calculations: Identical results
- ✅ Agent scores: Consistent with old system
- ✅ No data loss on failures

---

## Part 10: Rollback Plan

### If Alpha Vantage Fails
1. Switch back to yfinance (keep code path available)
2. Restore from database backup
3. Notify users of temporary service degradation
4. Investigate root cause
5. Redeploy with fixes

### If Cache Causes Issues
1. Clear cache (set all refresh_required = TRUE)
2. Force fresh API data for next scan
3. Rebuild cache gradually
4. Monitor cache hit rate

### If Database Performance Degrades
1. Archive scans older than 6 months
2. Optimize slow queries
3. Add additional indexes
4. Consider database upgrade

---

## Part 11: Monitoring & Metrics

### Key Metrics to Track

**API Performance**:
- API call count per scan
- API response time (avg, p95, p99)
- API error rate
- Rate limit hits

**Cache Performance**:
- Cache hit rate (%)
- Cache miss rate (%)
- Cache size (MB)
- Refresh frequency

**Scan Performance**:
- Scan duration (seconds)
- Phase 1 duration
- Phase 2 duration
- LLM call count

**Data Quality**:
- Financial data accuracy (vs external sources)
- TTM calculation consistency
- Agent score distribution
- Error rate per scan

**User Engagement**:
- Scans per day
- Opportunities saved
- Opportunities compared
- User retention

### Alerting Rules

- Alert if API error rate > 5%
- Alert if cache hit rate < 50%
- Alert if scan duration > 3 minutes
- Alert if database size > 5 GB
- Alert if LLM failures > 10%

---

## Conclusion

The Alpha Vantage migration with intelligent caching provides:
1. **Reliability**: 99%+ uptime vs current 0%
2. **Performance**: 2-4x faster scans
3. **Scalability**: Support for 1000+ scans
4. **Persistence**: Complete financial and LLM data storage
5. **User Experience**: Saved opportunities, comparisons, notes

**Next Step**: Begin Phase 0 (Alpha Vantage Setup)
