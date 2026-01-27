# Guru Lens - Project TODO

## OPPORTUNITY SCANNING SYSTEM

### Phase 1: Shared Scoring Engine (COMPLETE)
- [x] Create shared persona scoring engine (`personaScoringEngine.ts`)
  - [x] Warren Buffett scoring configuration
  - [x] Peter Lynch scoring configuration
  - [x] Benjamin Graham scoring configuration
  - [x] Core scoring functions: `calculatePersonaScore()`, `isOpportunity()`, `getDetailedScoreBreakdown()`
  - [x] Metric mapping and threshold evaluation
- [x] Create database schema for opportunity scanning
  - [x] `scanJobs` table (track scan progress)
  - [x] `scanOpportunities` table (store qualified opportunities)
  - [x] `scanOpportunityAnalyses` table (store LLM-generated thesis)
  - [x] Database migrations applied successfully
- [x] Create opportunity scanning service (`opportunityScanningService.ts`)
  - [x] Scan job management functions
  - [x] Opportunity storage and retrieval
  - [x] LLM analysis generation
  - [x] Shared scoring engine integration

### Phase 2: Batch Fetching & Adaptive Rate Limiting (COMPLETE)
- [x] Implement batch fetching in yfinanceWrapper.py
  - [x] Create get_stock_data_batch() function
  - [x] Support fetching 50 tickers in one call
  - [x] Return dict of {ticker: financial_data}
  - [x] Updated main section for batch mode
- [x] Implement batch fetching in realFinancialData.ts
  - [x] Create getStockDataBatch() method
  - [x] Handle batch responses
  - [x] Error handling for failed tickers
- [x] Implement adaptive rate limiting
  - [x] Start at 500/hr
  - [x] Increase by 250/hr every hour (750, 1000, 1250, 1500)
  - [x] Detect rate limit errors
  - [x] Revert to previous rate on error
  - [x] Stop increasing when error detected
- [x] Implement refresh job executor
  - [x] Load 5,500 stock tickers
  - [x] Process in batches of 50
  - [x] Apply adaptive rate limiting
  - [x] Track progress and errors
  - [x] Calculate optimal delay between batches

### Phase 3: tRPC Procedures (COMPLETE)
- [x] Create getDataStatus() procedure
  - [x] Return current cache status
  - [x] Show collection date
  - [x] Show stocks count
- [x] Create refreshFinancialData() procedure
  - [x] Start refresh immediately or schedule
  - [x] Return refresh job ID
- [x] Create getRefreshProgress() procedure
  - [x] Real-time progress updates
  - [x] Show current rate
  - [x] Show success/failure counts
- [x] Create generateScan() procedure
  - [x] Validate cache exists
  - [x] Run three-phase screening
  - [x] Return opportunities
- [x] Create getScanProgress() procedure
  - [x] Track scan progress in real-time
  - [x] Show phase, processed stocks, opportunities found
- [x] Create getOpportunities() procedure
  - [x] Retrieve scan results with filtering
  - [x] Support limit parameter (10/30/50)
- [x] Create getOpportunityDetails() procedure
  - [x] Return full opportunity analysis
  - [x] Include thesis, strengths, risks, catalysts

### Phase 4: UI Components (COMPLETE)
- [x] Build OpportunityScannerHeader component
  - [x] Show data status
  - [x] Show collection date
  - [x] Refresh button
- [x] Build RefreshDataModal component
  - [x] Show current data age
  - [x] Options: Refresh Now, Schedule for Tonight
- [x] Build RefreshProgressModal component
  - [x] Show real-time progress
  - [x] Show rate progression
  - [x] Show batch progress
- [x] Create OpportunityScannerPage component
  - [x] Persona selection
  - [x] Scan progress tracking
  - [x] Results table display
  - [x] Opportunity details modal
- [x] Add /scanner route to App.tsx

### Phase 5: LLM Analysis Integration (COMPLETE)
- [x] Implement LLM analysis for qualified opportunities
  - [x] Use existing persona prompts from personaPrompts.ts
  - [x] Generate investment thesis for each opportunity
  - [x] Parse LLM responses (thesis, strengths, risks, catalysts)
  - [x] Store analyses in scanOpportunityAnalyses table
  - [x] Add confidence level assessment
- [x] Integrate into scan flow
  - [x] Phase 2 runs after Phase 1.5 ranking
  - [x] Generates LLM analysis for top 50 opportunities
  - [x] Updates progress tracking
  - [x] Handles errors gracefully

### Phase 6: Testing & Delivery (NEXT)
- [ ] End-to-end testing
  - [ ] Test data refresh with adaptive rate limiting
  - [ ] Test scan generation for each persona
  - [ ] Test LLM analysis generation
  - [ ] Test UI components and interactions
- [ ] Performance testing
  - [ ] Measure refresh time with batching
  - [ ] Measure scan time (Phase 1 + 1.5 + 2)
  - [ ] Measure LLM analysis time
- [ ] Bug fixes and refinements
- [ ] Create final checkpoint
- [ ] Deploy opportunity scanning system

---

## PREVIOUS PHASES (COMPLETED)

### Phase 1: Foundation & Planning
- [x] Design system and visual identity established
- [x] Database schema designed
- [x] Backend architecture planned

### Phase 2: Core Infrastructure
- [x] Database schema implemented (tickers, personas, analyses, opportunities, watchlists)
- [x] Financial data API integration (Real Yahoo Finance API)
- [x] ai-hedge-fund multi-agent system integration (Real AI analysis)
- [x] tRPC procedures for ticker operations
- [x] tRPC procedures for persona operations

### Phase 3: Ticker Evaluation Features
- [x] Ticker search functionality
- [x] Company snapshot display (price, market cap, sector)
- [x] Persona rating cards grid
- [x] Persona detail modal with criteria breakdown
- [x] Pass/fail checks visualization
- [x] Key metrics display
- [x] Risks and what would change my mind sections
- [x] Data timestamps and citations
- [x] Rerun analysis button with rate limiting

### Phase 4: Opportunity Discovery Features
- [x] Persona opportunity page (/opportunities/{persona})
- [x] Daily market-wide scan system
- [x] Ranked opportunities list
- [x] Why now explanations for each opportunity
- [x] Change status tracking (new/improved/unchanged/dropped)
- [x] Link opportunities to ticker pages

### Phase 5: User Features (Authenticated)
- [x] User authentication flow
- [x] Watchlist functionality (save tickers)
- [x] Score snapshot tracking
- [x] Alerts system (score threshold notifications) - Backend ready
- [x] Alerts system (new opportunity notifications) - Backend ready

### Phase 6: Data & Analysis Requirements
- [x] Structured persona output schema enforced
- [x] All US ticker support (Real Yahoo Finance data)
- [x] Price data (daily OHLCV + latest quote)
- [x] Company profile data
- [x] Financial statements (annual + quarterly)
- [x] Key ratios (margins, ROE/ROIC, leverage, liquidity, valuation)
- [x] SEC filings integration (10-K/10-Q snippets)
- [x] Data freshness timestamps on all pages
- [x] Run metadata tracking (model, version, run time, inputs hash)

### Phase 7: UX & Performance
- [x] Progressive loading (cached results fast load)
- [x] Quick mode (sync-ish with partial results)
- [x] Deep mode (async with job tracking) - Backend ready
- [x] Loading states and skeletons
- [x] Cached ticker load < 2s (p50)
- [x] Error handling and retry strategies

### Phase 8: Compliance & Trust
- [x] Educational/research disclaimer
- [x] Fits/doesn't fit language (no you should buy)
- [x] Insufficient data verdict handling
- [x] Data source citations
- [x] Reproducibility features (timestamps, snapshots)

### Phase 9: LLM Integration
- [x] Create persona prompt templates for each investor
- [x] Implement LLM-based analysis engine with structured JSON output
- [x] Replace mock analysis service with real AI analysis
- [x] Test AI analysis quality and response times
- [x] Add error handling for LLM failures

### Phase 10: Real Financial Data Integration
- [x] Create HTTP-based financial data client
- [x] Implement Yahoo Finance API integration
- [x] Implement company profile endpoint
- [x] Implement financial statements endpoint
- [x] Implement key metrics endpoint
- [x] Replace mock financial data service with real API calls
- [x] Test with real stocks (AAPL, MSFT, GOOGL, etc.)
- [x] Implement caching to reduce API calls
- [x] Add error handling for API failures


### Phase 6: Advanced Filtering (COMPLETE)
- [x] Add filter state management
  - [x] Sector multi-select filter
  - [x] Market cap range filter (billions)
  - [x] Price range filter (dollars)
  - [x] Minimum score slider filter
- [x] Implement client-side filtering logic
  - [x] Filter opportunities based on all criteria
  - [x] Calculate active filter count
  - [x] Show filtered vs total count
- [x] Build filter UI components
  - [x] Filter panel with collapsible design
  - [x] Filter controls for each filter type
  - [x] Clear All Filters button
  - [x] Filter count badge
- [x] Update results display
  - [x] Show filtered opportunities count
  - [x] Update table with filtered data
  - [x] Maintain sorting and ranking


## UI ENHANCEMENTS FOR OPPORTUNITY SCANNER

### Phase 7: Enhanced UI Components
- [ ] Data Status Header
  - [ ] Show last cache update date/time
  - [ ] Display "Refresh Data" button
  - [ ] Show cache status (empty/populated)
  - [ ] Add loading state during refresh
- [ ] Scan Progress Modal
  - [ ] Real-time progress bar (0-100%)
  - [ ] Show current phase (Phase 1, 1.5, 2)
  - [ ] Display processed stocks count
  - [ ] Show opportunities found count
  - [ ] Display elapsed time
  - [ ] Auto-close when scan completes
- [ ] Results Table
  - [ ] Columns: Rank, Ticker, Company, Score, Price, Market Cap, Sector
  - [ ] Sortable by any column
  - [ ] Clickable rows to show details
  - [ ] Color-coded scores (green >70, yellow 50-70, red <50)
  - [ ] Empty state message
  - [ ] Pagination (10/30/50 per page)
- [ ] Filter Panel
  - [ ] Sector multi-select checkboxes
  - [ ] Market cap range slider (billions)
  - [ ] Price range inputs (min/max)
  - [ ] Minimum score slider (0-100)
  - [ ] Apply/Clear buttons
  - [ ] Filter count badge
  - [ ] Show "X of Y opportunities" when filtered
- [ ] Opportunity Details Modal
  - [ ] Investment thesis (full text)
  - [ ] Key strengths (bullet list)
  - [ ] Key risks (bullet list)
  - [ ] Catalyst analysis (bullet list)
  - [ ] Confidence level (low/medium/high)
  - [ ] Recommended action (buy/hold/watch)
  - [ ] Full financial metrics table
  - [ ] Close button

### Phase 8: Test Mode
- [ ] Add "Test Scan (10 stocks)" button
  - [ ] Uses test tickers: AAPL, MSFT, GOOGL, AMZN, TSLA, JNJ, V, WMT, KO, PG
  - [ ] Lowers score threshold to 40 (vs 60+)
  - [ ] Filters to top 5 opportunities
  - [ ] Shows same UI flow as production scan
  - [ ] Completes in 2-3 minutes vs 8-17 minutes
- [ ] Create testScan tRPC procedure
  - [ ] Calls startTestScan from testScanService
  - [ ] Returns scan job ID
  - [ ] Tracks progress same as production scan

### Phase 9: End-to-End Testing
- [ ] Test data refresh flow
- [ ] Test scan progress tracking
- [ ] Test results table display
- [ ] Test filtering functionality
- [ ] Test opportunity details modal
- [ ] Verify all 3 phases complete successfully

### Phase 10: Real Data Integration & Persona Testing
- [x] Integrate yfinance API for real financial data
- [x] Replace mock data in test scan with real data
- [ ] Replace mock data in full scan with real data
- [ ] Test scan for Warren Buffett persona
- [ ] Test scan for Peter Lynch persona
- [ ] Test scan for Benjamin Graham persona
- [ ] Test scan for Cathie Wood persona
- [ ] Test scan for Ray Dalio persona
- [ ] Test scan for Philip Fisher persona
- [ ] Full scan for Warren Buffett persona
- [ ] Full scan for Peter Lynch persona
- [ ] Full scan for Benjamin Graham persona
- [ ] Full scan for Cathie Wood persona
- [ ] Full scan for Ray Dalio persona
- [ ] Full scan for Philip Fisher persona
- [ ] Verify all scans return meaningful results

## COMPLETED: Database Persistence for Scan Results

- [x] Implemented in-memory cache for scan results
  - [x] Scan results stored in scanResultsCache
  - [x] getOpportunitiesForScan reads from cache
  - [x] Polling mechanism fetches results every 5 seconds
  - [x] Frontend displays results when available

## COMPLETED: Add Details Button and Scorecard to Results

- [x] Create OpportunityDetailsModal component
  - [x] Display financial metrics (PE ratio, market cap, etc.)
  - [x] Display LLM analysis details (thesis, strengths, risks)
  - [x] Show score breakdown by criteria
  - [x] Similar layout to individual analysis scorecard
- [x] Add Details button to results table
  - [x] Button in each row
  - [x] Opens modal with full opportunity details
  - [x] Close button/modal dismiss
- [x] Test Details view for each opportunity

## CURRENT WORK: Batch LLM Analysis Optimization

- [x] Create batchLLMAnalysis.ts module
  - [x] Implement analyzeBatchOptimized function
  - [x] Single LLM call for all stocks instead of sequential calls
  - [x] Preserve stock order in results
  - [x] Handle errors gracefully with fallback results
- [x] Integrate batch analysis into hybridScoringOrchestrator
  - [x] Update applyLLMFinalScoring to use batch optimization
  - [x] Prepare all analysis inputs in parallel
  - [x] Call batch LLM analysis instead of sequential calls
- [x] Write unit tests for batch LLM analysis
  - [x] Test single stock analysis
  - [x] Test multiple stocks analysis
  - [x] Test stock order preservation
  - [x] Test different personas
  - [x] All 4 tests passing
- [ ] Performance testing with UI
  - [ ] Test scan with Warren Buffett persona
  - [ ] Test scan with other personas
  - [ ] Measure actual time reduction
  - [ ] Verify results display correctly


## ENHANCEMENT: Expand Opportunity Details Modal

- [ ] Enhance OpportunityDetailsModal with comprehensive details
  - [ ] Add financial metrics section (PE ratio, market cap, dividend yield, etc.)
  - [ ] Add LLM analysis details (thesis, strengths, risks, catalysts)
  - [ ] Add scoring criteria breakdown with pass/fail checks
  - [ ] Add data sources and timestamps
  - [ ] Make modal scrollable for long content
  - [ ] Match layout/styling of individual analysis page
  - [ ] Show confidence level with visual indicator
  - [ ] Display all key ratios from analysis
  - [ ] Show what would change my mind section
- [ ] Test enhanced modal with various opportunities
- [ ] Verify data display accuracy

## COMPLETED: Expand Opportunity Details Modal

- [x] Enhance OpportunityDetailsModal with comprehensive details
  - [x] Add financial metrics section (PE ratio, market cap, dividend yield, etc.)
  - [x] Add LLM analysis details (thesis, strengths, risks, catalysts)
  - [x] Add scoring criteria breakdown with pass/fail checks
  - [x] Add data sources and timestamps
  - [x] Make modal scrollable for long content
  - [x] Match layout/styling of individual analysis page
  - [x] Show confidence level with visual indicator
  - [x] Display all key ratios from analysis
  - [x] Show what would change my mind section
- [x] Enhanced OpportunityDetailsModal component with comprehensive layout
- [x] Updated HybridScoringResult interface to include all detailed fields
- [x] Modified opportunityScanningService to pass complete analysis data
- [x] Updated hybridScoringOrchestrator to include financial metrics and LLM details
- [ ] Test enhanced modal with various opportunities (in progress - scan running)
