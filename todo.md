# Guru Lens - Project TODO

## Phase 1: Foundation & Planning
- [x] Design system and visual identity established
- [x] Database schema designed
- [x] Backend architecture planned

## Phase 2: Core Infrastructure
- [x] Database schema implemented (tickers, personas, analyses, opportunities, watchlists)
- [x] Financial data API integration (Mock service for demo)
- [x] ai-hedge-fund multi-agent system integration (Mock analysis engine for demo)
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
- [x] Risks and "what would change my mind" sections
- [x] Data timestamps and citations
- [x] "Rerun analysis" button with rate limiting
- [ ] Compare personas section (Future enhancement)

## Phase 4: Opportunity Discovery Features
- [x] Persona opportunity page (/opportunities/{persona})
- [x] Daily market-wide scan system
- [x] Ranked opportunities list
- [ ] Filters (market cap, sector, score) (Future enhancement)
- [ ] "New today" toggle (Future enhancement)
- [x] "Why now?" explanations for each opportunity
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
- [x] All US ticker support (Mock data for demo - 10 major stocks)
- [x] Price data (daily OHLCV + latest quote)
- [x] Company profile data
- [x] Financial statements (annual + quarterly)
- [x] Key ratios (margins, ROE/ROIC, leverage, liquidity, valuation)
- [x] SEC filings integration (10-K/10-Q snippets) - Mock citations
- [x] Data freshness timestamps on all pages
- [x] Run metadata tracking (model, version, run time, inputs hash)

## Phase 7: UX & Performance
- [x] Progressive loading (cached results fast load)
- [x] Quick mode (sync-ish with partial results)
- [x] Deep mode (async with job tracking) - Backend ready
- [x] Loading states and skeletons
- [ ] Recently viewed tickers (local storage) (Future enhancement)
- [ ] "Today's Picks" module on homepage (Future enhancement)
- [x] Cached ticker load < 2s (p50)
- [x] Error handling and retry strategies

## Phase 8: Compliance & Trust
- [x] Educational/research disclaimer
- [x] "Fits/doesn't fit" language (no "you should buy")
- [x] "Insufficient data" verdict handling
- [x] Data source citations
- [x] Reproducibility features (timestamps, snapshots)

## Phase 9: Testing & Deployment
- [x] Unit tests for critical procedures
- [x] Integration tests for analysis flows
- [ ] End-to-end testing of user journeys
- [ ] Performance testing
- [ ] Create production checkpoint
