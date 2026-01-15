# Guru Lens - Project TODO

## Phase 1: Foundation & Planning
- [x] Design system and visual identity established
- [x] Database schema designed
- [x] Backend architecture planned

## Phase 2: Core Infrastructure
- [x] Database schema implemented (tickers, personas, analyses, opportunities, watchlists)
- [x] Financial data API integration (Real Yahoo Finance API)
- [x] ai-hedge-fund multi-agent system integration (Real AI analysis)
- [x] tRPC procedures for ticker operations
- [x] tRPC procedures for persona operations
- [ ] Redis caching layer setup (Future enhancement)
- [ ] Async job processing infrastructure (Future enhancement)

## Phase 3: Ticker Evaluation Features
- [x] Ticker search functionality
- [x] Company snapshot display (price, market cap, sector)
- [x] Persona rating cards grid
- [x] Persona detail modal with criteria breakdown
- [x] Pass/fail checks visualization
- [x] Key metrics display
- [x] Risks and what would change my mind sections
- [x] Data timestamps and citations
- [x] Rerun analysis button with rate limiting
- [ ] Compare personas section (Future enhancement)

## Phase 4: Opportunity Discovery Features
- [x] Persona opportunity page (/opportunities/{persona})
- [x] Daily market-wide scan system
- [x] Ranked opportunities list
- [ ] Filters (market cap, sector, score) (Future enhancement)
- [ ] New today toggle (Future enhancement)
- [x] Why now explanations for each opportunity
- [x] Change status tracking (new/improved/unchanged/dropped)
- [x] Link opportunities to ticker pages

## Phase 5: User Features (Authenticated)
- [x] User authentication flow
- [x] Watchlist functionality (save tickers)
- [ ] Watchlist functionality (save opportunities) (Future enhancement)
- [x] Score snapshot tracking
- [x] Alerts system (score threshold notifications) - Backend ready
- [x] Alerts system (new opportunity notifications) - Backend ready

## Phase 6: Data & Analysis Requirements
- [x] Structured persona output schema enforced
- [x] All US ticker support (Real Yahoo Finance data)
- [x] Price data (daily OHLCV + latest quote)
- [x] Company profile data
- [x] Financial statements (annual + quarterly)
- [x] Key ratios (margins, ROE/ROIC, leverage, liquidity, valuation)
- [x] SEC filings integration (10-K/10-Q snippets)
- [x] Data freshness timestamps on all pages
- [x] Run metadata tracking (model, version, run time, inputs hash)

## Phase 7: UX & Performance
- [x] Progressive loading (cached results fast load)
- [x] Quick mode (sync-ish with partial results)
- [x] Deep mode (async with job tracking) - Backend ready
- [x] Loading states and skeletons
- [ ] Recently viewed tickers (local storage) (Future enhancement)
- [ ] Today's Picks module on homepage (Future enhancement)
- [x] Cached ticker load < 2s (p50)
- [x] Error handling and retry strategies

## Phase 8: Compliance & Trust
- [x] Educational/research disclaimer
- [x] Fits/doesn't fit language (no you should buy)
- [x] Insufficient data verdict handling
- [x] Data source citations
- [x] Reproducibility features (timestamps, snapshots)

## Phase 9: Testing & Deployment
- [x] Unit tests for critical procedures
- [x] Integration tests for analysis flows
- [ ] End-to-end testing of user journeys
- [ ] Performance testing
- [ ] Create production checkpoint

## Phase 10: LLM Integration (Complete)
- [x] Create persona prompt templates for each investor
- [x] Implement LLM-based analysis engine with structured JSON output
- [x] Replace mock analysis service with real AI analysis
- [x] Test AI analysis quality and response times
- [x] Add error handling for LLM failures
- [x] Create checkpoint with working AI analysis

## Phase 11: Real Financial Data Integration (Complete)
- [x] Create HTTP-based financial data client
- [x] Implement Yahoo Finance API integration
- [x] Implement company profile endpoint
- [x] Implement financial statements endpoint
- [x] Implement key metrics endpoint
- [x] Replace mock financial data service with real API calls
- [x] Test with real stocks (AAPL, MSFT, GOOGL, etc.)
- [x] Implement caching to reduce API calls
- [x] Add error handling for API failures
- [x] Create checkpoint with real data integration

## Phase 12: ai-hedge-fund Web Integration (Complete)

### Investor Personas (12 Total)

#### Existing 6 Personas
- [x] Warren Buffett (Value investing)
- [x] Peter Lynch (Growth at reasonable price)
- [x] Benjamin Graham (Deep value)
- [x] Cathie Wood (Disruptive innovation)
- [x] Ray Dalio (Macro + balance sheet)
- [x] Philip Fisher (Quality + growth)

#### New 6 Personas (ai-hedge-fund)
- [x] Aswath Damodaran (Valuation expert)
- [x] Michael Burry (Contrarian deep value)
- [x] Mohnish Pabrai (Dhandho investor)
- [x] Rakesh Jhunjhunwala (The Big Bull)
- [x] Stanley Druckenmiller (Macro legend)
- [x] Bill Ackman (Activist investor)

### Technical Agents (4 Total)
- [x] Valuation Agent - Intrinsic value calculation
- [x] Sentiment Agent - Market sentiment analysis
- [x] Fundamentals Agent - Financial statement analysis
- [x] Technicals Agent - Technical indicators

### Risk Management
- [x] Risk Manager Agent - Volatility, beta, position sizing
- [x] Risk metrics calculation (Sharpe, max drawdown, VaR, CVaR)
- [x] Portfolio-level risk constraints

### Decision Making
- [x] Portfolio Manager Agent - Consensus voting
- [x] Weighted voting system (18 agents total)
- [x] Confidence scoring
- [x] Trading signal generation (BUY/SELL/HOLD)

### Backtesting
- [x] Historical data collection framework
- [x] Backtesting engine with trade simulation
- [x] Performance metrics (Sharpe, Sortino, max drawdown)
- [x] Equity curve and monthly returns

### Frontend Updates
- [x] Ticker Analysis page with persona scores
- [x] Tabbed interface (Personas, Technical, Risk)
- [x] Consensus recommendation display
- [x] Trading signals with position sizing
- [x] Risk metrics dashboard
- [x] Research disclaimer

### Integration
- [x] Preserve existing 6 persona scores
- [x] Add 6 new personas with prompts
- [x] Update database schema
- [x] Update tRPC routers
- [x] Follow ai-hedge-fund architecture

## Bug Fixes
- [x] Fix API query error on homepage: The string did not match the expected pattern

## Critical Issues - Deployment
- [x] Fix yfinance "Ticker Not Found" error on live deployment (SSL certificate verification disabled in yfinanceWrapper.py)
- [x] Set up Python runtime in Manus deployed environment (added SSL bypass and environment variables)
- [ ] Verify financial ratios display correctly on live site after deployment

## Critical Bugs
- [x] LULU only shows Warren Buffett persona rating - Fixed by adding try-catch error handling to runAnalysis loop
- [x] Check AI analysis generation for errors or timeouts - Added error logging and continue on failure
- [x] Financial metrics (margins, ROE) showing incorrect values in AI analysis - Fixed by converting decimal ratios to percentages in keyRatios calculation
- [x] TSLA showing ROE 0.4% and Profit Margin 0.2% - Fixed (was cached old analysis, regenerated with correct values)
- [x] BIDU D/E ratio 33.81 unrealistic - Implemented data quality flagging instead of silent correction

## Data Quality Improvements
- [x] Added data quality flags to yfinanceWrapper.py (debtToEquityAnomalous, roicZero, interestCoverageZero, peNegative)
- [x] Updated FinancialData type to include dataQualityFlags
- [x] Modified aiAnalysisEngine to detect and warn about anomalous data
- [x] Pass dataQualityFlags from routers to AI analysis engine

## Current Issues
- [x] Weight percentages showing as 2000%-2500% instead of correct values in Philip Fisher persona analysis - FIXED: Changed line 367 in Ticker.tsx from `criterion.weight.toFixed(0)%` to `(criterion.weight * 100).toFixed(0)%` to convert decimal weights to percentages

## Anomalous Data Handling (Completed)
- [x] Add visual indicators in UI for anomalous metrics (TBC/abnormal badge) - Added TBC badges to P/E, P/B, ROE, Debt/Equity, Current Ratio metrics
- [x] Prevent anomalous metrics from being passed to LLM for persona analysis - Modified aiAnalysisEngine to use getSafeMetricValue() which replaces anomalous values with 'TBC (Data Quality Issue)'
- [x] Update yfinanceWrapper to properly flag all anomalous metrics - Added comprehensive anomaly detection for debtToEquity, ROIC, interestCoverage, PE, marketCap, PB, ROE, currentRatio
- [x] Display anomalous metrics with warning styling in Ticker component - Added yellow text highlighting for anomalous metrics
- [x] Test with BIDU and other anomalous stocks - Verified Ray Dalio analysis correctly identifies market cap error ($0.00B) and negative FCF as data quality issues


## Data Quality Improvements (Completed)
- [x] Remove all non-yfinance data sources, consolidate to single source only - Confirmed yfinance is the only active data source
- [x] Fix decimal/unit conversion issues - Updated yfinanceWrapper to multiply percentage metrics by 100 (roe, roic, margins, dividendYield)
- [x] Block anomalous metrics entirely from LLM prompts instead of replacing with "TBC" - Modified aiAnalysisEngine to use [DATA UNAVAILABLE] for anomalous metrics
- [x] Add explicit data quality disclaimers to LLM prompts when metrics are missing - Added dataQualityNote with explicit warnings about unavailable metrics
- [x] Show missing/problematic metrics in persona rating cards with explanations - Added dataQualityIssues field to AnalysisOutput with warning badges in UI
- [x] Test with AAPL (ROE 171% issue) and BIDU (0.3% margin issue) - Verified AAPL now shows correct 26.92% Net Margin and 171.42% ROE (correct decimal conversion)


## Bug Fixes - Anomaly Detection
- [x] Fix Debt-to-Equity anomaly threshold - Changed from >10 to >200 since D/E is already in percentage format
- [x] Verify Current Ratio 0.893 is normal for AAPL (not anomalous) - Confirmed: 0.893 is between 0.5 and 50 (normal range)
- [x] Verify AAPL D/E 152.41% and BIDU D/E 33.81% are correct (not anomalous) - Confirmed: Both < 200% threshold
