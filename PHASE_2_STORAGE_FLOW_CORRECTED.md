# Phase 2: Opportunity Cache System - Corrected Storage Flow

## Correct Storage Flow

```
Scan Initiated (persona)
    ↓
[Phase 1: Preliminary Filtering]
├─ For each stock in universe:
│  ├─ Fetch fresh financial data from Alpha Vantage
│  │  OR Query stock_financial_cache if exist
│  ├─ Apply persona financial criteria
│  └─ Rank by financial metrics
├─ Select top 50 candidates based on financial data
└─ Return ranked list of 50 stocks
    ↓
[Phase 2: Detailed Analysis]
├─ For each of top 50 candidates:
│  ├─ Fetch fresh financial data from Alpha Vantage
│  │  OR Query stock_financial_cache if exist
│  ├─ Run LLM analysis
│  ├─ Calculate investment score
│  └─ Store in opportunity table
    ↓
[Phase 3: Finalization]
├─ Update opportunity_scan status to 'completed'
├─ Calculate scan statistics
└─ Notify user of results
```

## Key Changes from Original Design

### 1. Financial Data Fetching Strategy
**Before**: Query preliminary cache (5000 stocks), then fetch fresh data only for top 50
**After**: Fetch fresh data at BOTH Phase 1 and Phase 2, use cache as fallback

**Rationale**:
- Ensures most recent financial data for filtering decisions
- Prevents missing opportunities due to stale cache data
- Cache is used only when fresh data fetch fails
- Cache is updated after each successful fetch

### 2. Top 50 Selection Timing
**Before**: Get top 100 from cache, then analyze top 50
**After**: Analyze ALL stocks with financial criteria, select top 50 based on financial metrics

**Rationale**:
- More accurate filtering using current financial data
- Ensures best opportunities aren't missed
- Financial criteria are applied consistently
- LLM analysis only runs on truly qualified candidates

### 3. Cache Usage Pattern
**Before**: Primary source for Phase 1 filtering
**After**: Fallback source when fresh data unavailable

**Rationale**:
- Fresh data ensures accuracy
- Cache reduces API calls when network issues occur
- `refresh_required` flag allows manual cache invalidation
- Cache is continuously updated with fresh data

## Implementation Details

### Phase 1: Preliminary Filtering

```typescript
async function preliminaryFilter(
  persona: PersonaConfig,
  stockUniverse: string[]
): Promise<FilteredCandidates> {
  const candidates = [];
  let apiCalls = 0;
  let cacheHits = 0;
  let failures = 0;
  
  for (const ticker of stockUniverse) {
    try {
      // Get financial data (fresh or cached)
      const financialData = await getFinancialDataWithFallback(ticker);
      
      if (financialData.source === 'api') {
        apiCalls++;
      } else if (financialData.source === 'cache') {
        cacheHits++;
      }
      
      // Apply persona financial criteria
      if (meetsPersonaFinancialCriteria(financialData, persona)) {
        const financialScore = calculateFinancialScore(financialData, persona);
        
        candidates.push({
          ticker,
          companyName: financialData.profile.companyName,
          sector: financialData.profile.sector,
          financialData,
          financialScore,
          dataSource: financialData.source
        });
      }
    } catch (error) {
      failures++;
      console.error(`Failed to fetch ${ticker}:`, error);
      // Continue with next stock
    }
  }
  
  // Sort by financial score and select top 50
  const top50 = candidates
    .sort((a, b) => b.financialScore - a.financialScore)
    .slice(0, 50);
  
  return {
    candidates: top50,
    statistics: {
      totalStocksAnalyzed: stockUniverse.length,
      candidatesQualified: candidates.length,
      topCandidatesSelected: top50.length,
      apiCalls,
      cacheHits,
      failures
    }
  };
}
```

### Phase 2: Detailed Analysis

```typescript
async function detailedAnalysis(
  scanId: string,
  candidates: CandidateStock[],
  persona: PersonaConfig
): Promise<DetailedAnalysisStats> {
  let rank = 1;
  let apiCalls = 0;
  let cacheHits = 0;
  let llmCalls = 0;
  let failures = 0;
  
  for (const candidate of candidates) {
    try {
      // Fetch fresh financial data (or use cache as fallback)
      const freshFinancialData = await getFinancialDataWithFallback(candidate.ticker);
      
      if (freshFinancialData.source === 'api') {
        apiCalls++;
      } else if (freshFinancialData.source === 'cache') {
        cacheHits++;
      }
      
      // Run LLM analysis with fresh financial data
      const llmAnalysis = await runLLMAnalysis(
        candidate.ticker,
        freshFinancialData,
        persona
      );
      llmCalls++;
      
      // Calculate investment score
      const scores = calculateInvestmentScore(
        freshFinancialData,
        llmAnalysis,
        persona
      );
      
      // Store complete opportunity record
      await storeOpportunity(
        scanId,
        candidate.ticker,
        freshFinancialData,
        llmAnalysis,
        scores,
        rank
      );
      
      rank++;
    } catch (error) {
      failures++;
      console.error(`Failed to analyze ${candidate.ticker}:`, error);
      // Continue with next candidate
    }
  }
  
  return {
    opportunitiesStored: rank - 1,
    apiCalls,
    cacheHits,
    llmCalls,
    failures
  };
}
```

### Helper Function: Get Financial Data with Fallback

```typescript
async function getFinancialDataWithFallback(
  ticker: string
): Promise<FinancialDataWithSource> {
  try {
    // Try to fetch fresh data from Alpha Vantage
    const freshData = await alphaVantageWrapper.getStockData(ticker);
    
    // Update cache with fresh data
    await updateStockFinancialCache(ticker, freshData);
    
    return {
      ...freshData,
      source: 'api',
      timestamp: new Date()
    };
  } catch (apiError) {
    console.warn(`Alpha Vantage API failed for ${ticker}, trying cache:`, apiError);
    
    try {
      // Fallback to cache
      const cachedData = await getStockFinancialCache(ticker);
      
      if (cachedData) {
        return {
          ...transformCacheToSchema(cachedData),
          source: 'cache',
          timestamp: cachedData.last_updated,
          warning: 'Using cached data due to API failure'
        };
      }
    } catch (cacheError) {
      console.error(`Cache lookup also failed for ${ticker}:`, cacheError);
    }
    
    // Both API and cache failed
    throw new Error(
      `Unable to fetch financial data for ${ticker}: API failed and no cache available`
    );
  }
}
```

### Helper Function: Update Cache After Fetch

```typescript
async function updateStockFinancialCache(
  ticker: string,
  financialData: FinancialSnapshot
): Promise<void> {
  try {
    const cacheRecord = {
      symbol: ticker,
      company_name: financialData.profile.companyName,
      sector: financialData.profile.sector,
      industry: financialData.profile.industry,
      market_cap: financialData.profile.marketCap,
      
      // Extract all ratios
      pe_ratio: financialData.ratios.pe,
      pb_ratio: financialData.ratios.pb,
      ps_ratio: financialData.ratios.ps,
      roe: financialData.ratios.roe,
      roa: financialData.ratios.roa,
      roic: financialData.ratios.roic,
      gross_margin: financialData.ratios.grossMargin,
      operating_margin: financialData.ratios.operatingMargin,
      net_margin: financialData.ratios.netMargin,
      current_ratio: financialData.ratios.currentRatio,
      debt_to_equity: financialData.ratios.debtToEquity,
      dividend_yield: financialData.ratios.dividendYield,
      interest_coverage: financialData.ratios.interestCoverage,
      
      last_updated: new Date(),
      refresh_required: false
    };
    
    // Insert or update cache
    await db.query(`
      INSERT INTO stock_financial_cache 
      (symbol, company_name, sector, industry, market_cap, pe_ratio, pb_ratio, 
       ps_ratio, roe, roa, roic, gross_margin, operating_margin, net_margin, 
       current_ratio, debt_to_equity, dividend_yield, interest_coverage, 
       last_updated, refresh_required)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        sector = VALUES(sector),
        industry = VALUES(industry),
        market_cap = VALUES(market_cap),
        pe_ratio = VALUES(pe_ratio),
        pb_ratio = VALUES(pb_ratio),
        ps_ratio = VALUES(ps_ratio),
        roe = VALUES(roe),
        roa = VALUES(roa),
        roic = VALUES(roic),
        gross_margin = VALUES(gross_margin),
        operating_margin = VALUES(operating_margin),
        net_margin = VALUES(net_margin),
        current_ratio = VALUES(current_ratio),
        debt_to_equity = VALUES(debt_to_equity),
        dividend_yield = VALUES(dividend_yield),
        interest_coverage = VALUES(interest_coverage),
        last_updated = VALUES(last_updated),
        refresh_required = FALSE
    `, [
      cacheRecord.symbol, cacheRecord.company_name, cacheRecord.sector,
      cacheRecord.industry, cacheRecord.market_cap, cacheRecord.pe_ratio,
      cacheRecord.pb_ratio, cacheRecord.ps_ratio, cacheRecord.roe,
      cacheRecord.roa, cacheRecord.roic, cacheRecord.gross_margin,
      cacheRecord.operating_margin, cacheRecord.net_margin,
      cacheRecord.current_ratio, cacheRecord.debt_to_equity,
      cacheRecord.dividend_yield, cacheRecord.interest_coverage,
      cacheRecord.last_updated, cacheRecord.refresh_required
    ]);
  } catch (error) {
    console.error(`Failed to update cache for ${ticker}:`, error);
    // Don't throw - cache update failure shouldn't block scan
  }
}
```

### Phase 3: Finalization

```typescript
async function finalizeScan(
  scanId: string,
  phase1Stats: FilteredCandidatesStats,
  phase2Stats: DetailedAnalysisStats
): Promise<void> {
  const totalApiCalls = phase1Stats.apiCalls + phase2Stats.apiCalls;
  const totalCacheHits = phase1Stats.cacheHits + phase2Stats.cacheHits;
  const totalAnalyzed = phase1Stats.totalStocksAnalyzed;
  const totalDuration = calculateScanDuration(scanId);
  
  await db.update('opportunity_scan', { scan_id: scanId }, {
    scan_status: 'completed',
    total_stocks_analyzed: totalAnalyzed,
    candidates_from_cache: totalCacheHits,
    opportunities_found: phase2Stats.opportunitiesStored,
    scan_duration_seconds: totalDuration,
    api_calls_made: totalApiCalls,
    llm_calls_made: phase2Stats.llmCalls
  });
  
  // Log scan summary
  console.log(`Scan ${scanId} completed:
    - Total stocks analyzed: ${totalAnalyzed}
    - Opportunities found: ${phase2Stats.opportunitiesStored}
    - API calls: ${totalApiCalls}
    - Cache hits: ${totalCacheHits}
    - LLM calls: ${phase2Stats.llmCalls}
    - Duration: ${totalDuration}s
  `);
}
```

## Data Flow Example: Warren Buffett Scan

```
1. Scan Initiated: Warren Buffett persona
   ↓
2. Phase 1: Preliminary Filtering (5000 stocks)
   - AAPL: Fetch fresh data (API) → Score 85 ✓
   - MSFT: Fetch fresh data (API) → Score 82 ✓
   - GOOGL: Fetch fresh data (API) → Score 78 ✓
   - AMZN: Fetch from cache (cache hit) → Score 75 ✓
   - ... (continue for all 5000)
   - Phase 1 Stats: 5000 analyzed, 4850 API calls, 150 cache hits
   - Output: Top 50 candidates
   ↓
3. Phase 2: Detailed Analysis (top 50)
   - AAPL (rank 1):
     * Fetch fresh data (API)
     * Run LLM analysis
     * Score: 87/100 → "strong_buy"
     * Store opportunity with complete data
   - MSFT (rank 2):
     * Fetch fresh data (API)
     * Run LLM analysis
     * Score: 85/100 → "strong_buy"
     * Store opportunity
   - ... (continue for all 50)
   - Phase 2 Stats: 50 analyzed, 40 API calls, 10 cache hits, 50 LLM calls
   ↓
4. Phase 3: Finalization
   - Total stats:
     * Stocks analyzed: 5000
     * Opportunities found: 50
     * Total API calls: 4890 (4850 + 40)
     * Total cache hits: 160 (150 + 10)
     * Total LLM calls: 50
     * Cache hit rate: 3.2% (160 / 5000)
     * Scan duration: 120 seconds
   - Update scan status: 'completed'
   - Notify user: "Scan complete! Found 50 opportunities"
```

## Benefits of Corrected Flow

1. **Fresh Data Priority**: Always tries to fetch fresh data first
2. **Graceful Degradation**: Falls back to cache if API fails
3. **Cache Optimization**: Cache is continuously updated with fresh data
4. **Accurate Filtering**: Financial criteria applied to current data
5. **Flexible Selection**: Top 50 selected based on actual financial metrics
6. **Data Integrity**: Complete financial snapshots stored for each opportunity
7. **Transparency**: Statistics show API vs cache usage

## Implementation Timeline

- **Week 1**: Implement Phase 1 and Phase 2 functions
- **Week 2**: Integrate with opportunityScanningService.ts
- **Week 3**: Test and optimize performance
- **Week 4**: Deploy to production
