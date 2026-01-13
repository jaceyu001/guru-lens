# Guru Lens Architecture

## System Overview

Guru Lens is a full-stack web application that implements an 18-agent multi-agent system for stock analysis. It combines legendary investor personas, technical analysis agents, risk management, and consensus voting to generate actionable trading signals.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  6-Tab Interface                                    │   │
│  │  • Overview (Consensus)                             │   │
│  │  • Personas (Individual Analysis)                   │   │
│  │  • Technical (4 Agents)                             │   │
│  │  • Risk (Metrics & Sizing)                          │   │
│  │  • Signals (Entry/Exit)                             │   │
│  │  • Backtest (Performance)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│                    tRPC Client (Type-Safe)                   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + tRPC)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  18-Agent Multi-Agent System                        │   │
│  │                                                     │   │
│  │  12 Investor Personas (8% weight each)              │   │
│  │  • Warren Buffett (Value Investing)                 │   │
│  │  • Peter Lynch (GARP)                               │   │
│  │  • Benjamin Graham (Quantitative Value)             │   │
│  │  • Cathie Wood (Disruptive Innovation)              │   │
│  │  • Ray Dalio (Macro-Aware)                          │   │
│  │  • Philip Fisher (Growth + Quality)                 │   │
│  │  • Aswath Damodaran (Valuation Expert)              │   │
│  │  • Michael Burry (Contrarian)                       │   │
│  │  • Mohnish Pabrai (Value + Moats)                   │   │
│  │  • Rakesh Jhunjhunwala (Conviction)                 │   │
│  │  • Stanley Druckenmiller (Macro + Timing)           │   │
│  │  • Bill Ackman (Activist)                           │   │
│  │                                                     │   │
│  │  4 Technical Agents (2% weight each)                │   │
│  │  • Valuation Agent (DCF, Comparables)               │   │
│  │  • Sentiment Agent (Market Sentiment)               │   │
│  │  • Fundamentals Agent (Financial Analysis)          │   │
│  │  • Technicals Agent (Price Patterns)                │   │
│  │                                                     │   │
│  │  Risk Manager (4% weight)                           │   │
│  │  • Volatility & Beta                                │   │
│  │  • Sharpe Ratio & Max Drawdown                      │   │
│  │  • VaR & CVaR                                       │   │
│  │  • Position Sizing                                  │   │
│  │                                                     │   │
│  │  Portfolio Manager                                  │   │
│  │  • Consensus Voting                                 │   │
│  │  • Confidence Scoring                               │   │
│  │  • Dissent Identification                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Trading Signal Generator                           │   │
│  │  • Entry/Exit Prices                                │   │
│  │  • Position Sizing                                  │   │
│  │  • Risk/Reward Ratios                               │   │
│  │  • Action Items                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Backtesting Engine                                 │   │
│  │  • Historical Validation                            │   │
│  │  • Performance Metrics                              │   │
│  │  • Trade Analysis                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │  SQLite Database │  │  External APIs               │    │
│  │  (Drizzle ORM)   │  │  • Yahoo Finance             │    │
│  │                  │  │  • Manus LLM                 │    │
│  │  • Tickers       │  │  • Polygon.io (optional)     │    │
│  │  • Personas      │  │  • FMP (optional)            │    │
│  │  • Analyses      │  │                              │    │
│  │  • Opportunities │  │                              │    │
│  │  • Watchlists    │  │                              │    │
│  │  • Alerts        │  │                              │    │
│  │  • Jobs          │  │                              │    │
│  │  • Cache         │  │                              │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### Pages
- **Home.tsx** - Landing page with ticker search and persona showcase
- **TickerAnalysisEnhanced.tsx** - Main 6-tab analysis interface
- **Opportunities.tsx** - Persona-based opportunity discovery
- **Watchlist.tsx** - User watchlist management

#### Layouts
- **DashboardLayout.tsx** - Main application layout with sidebar navigation
- **DashboardLayoutSkeleton.tsx** - Loading skeleton

#### UI Components
- Tabs, Cards, Buttons, Badges, Dialogs from shadcn/ui
- Custom financial charts and metrics displays

### Backend Services

#### Core Services

**aiAnalysisEngine.ts**
- Runs AI analysis for all 12 investor personas
- Uses Manus LLM with structured JSON output
- Each persona gets custom prompt based on investment philosophy
- Returns: score (0-100), verdict, confidence, criteria breakdown

**technicalAgents.ts**
- Valuation Agent: DCF analysis, comparables, asset-based valuation
- Sentiment Agent: Market sentiment, news analysis, social signals
- Fundamentals Agent: Financial statement analysis, margin trends
- Technicals Agent: Price patterns, moving averages, RSI, momentum
- All use Manus LLM for analysis

**riskManager.ts**
- Calculates volatility and beta
- Computes Sharpe Ratio and Max Drawdown
- Calculates VaR and CVaR
- Determines position sizing (1-5% of portfolio)
- Generates stop loss and take profit levels
- Provides hedging strategies

**portfolioManager.ts**
- Aggregates votes from all 18 agents
- Applies weighted voting (personas 8%, technical 2%, risk 4%)
- Calculates consensus strength
- Identifies dissenting opinions
- Generates final recommendation (BUY/SELL/HOLD/AVOID)

**tradingSignalGenerator.ts**
- Generates trading signals from consensus and risk metrics
- Calculates entry/exit prices
- Determines position sizing
- Computes risk/reward ratios
- Creates actionable checklist

**backtestEngine.ts**
- Simulates historical trades
- Calculates performance metrics
- Generates equity curve
- Computes monthly returns
- Analyzes win rate and profit factor

#### Data Services

**httpFinancialData.ts**
- Fetches real-time stock data from Yahoo Finance
- Gets company profiles and financial ratios
- Retrieves historical financial statements
- Implements caching for performance

**personaPrompts.ts**
- Contains detailed prompts for all 12 investor personas
- Each prompt includes investment philosophy and criteria
- Structured to generate consistent JSON output

### Database Layer (Drizzle ORM)

#### Schema

```typescript
// Tickers
tickers {
  id: number (PK)
  symbol: string (UNIQUE)
  companyName: string
  sector: string
  industry: string
  marketCap: string
  exchange: string
  description: string
  lastDataUpdate: timestamp
  isActive: boolean
}

// Personas
personas {
  id: number (PK)
  personaId: string (UNIQUE)
  name: string
  description: string
  investmentPhilosophy: string
  criteria: JSON
  isActive: boolean
}

// Analyses
analyses {
  id: number (PK)
  tickerId: number (FK)
  personaId: number (FK)
  runId: string (UNIQUE)
  score: number (0-100)
  verdict: string
  confidence: string
  summaryBullets: JSON
  criteria: JSON
  keyRisks: JSON
  whatWouldChangeMind: JSON
  dataUsed: JSON
  citations: JSON
  runMetadata: JSON
  runTimestamp: timestamp
}

// Opportunities
opportunities {
  id: number (PK)
  personaId: number (FK)
  tickerId: number (FK)
  analysisId: number (FK)
  scanDate: date
  rank: number
  whyNow: JSON
  keyMetrics: JSON
  changeStatus: string
  previousScore: number
  scanTimestamp: timestamp
}

// Watchlists
watchlists {
  id: number (PK)
  userId: string (FK)
  createdAt: timestamp
}

// Watchlist Tickers
watchlist_tickers {
  id: number (PK)
  watchlistId: number (FK)
  tickerId: number (FK)
  snapshotScore: number
  snapshotData: JSON
  notes: string
  addedAt: timestamp
}

// Alerts
alerts {
  id: number (PK)
  userId: string (FK)
  alertType: string (score_threshold | new_opportunity)
  tickerId: number (FK)
  personaId: number (FK)
  thresholdScore: number
  thresholdDirection: string (above | below)
  isActive: boolean
  lastTriggered: timestamp
  createdAt: timestamp
}

// Jobs
jobs {
  id: number (PK)
  jobType: string
  status: string
  input: JSON
  output: JSON
  error: string
  createdAt: timestamp
  completedAt: timestamp
}

// Cache
cache {
  id: number (PK)
  key: string (UNIQUE)
  value: JSON
  expiresAt: timestamp
  createdAt: timestamp
}
```

## Data Flow

### Stock Analysis Flow

```
1. User Input
   └─→ Search ticker (e.g., "AAPL")

2. Data Fetching
   ├─→ Get ticker from database
   ├─→ Fetch financial data from Yahoo Finance
   └─→ Cache financial data

3. Parallel Agent Analysis
   ├─→ AI Analysis Engine (12 personas in parallel)
   │   ├─→ Warren Buffett analysis
   │   ├─→ Peter Lynch analysis
   │   └─→ ... (10 more personas)
   │
   ├─→ Technical Agents (4 agents in parallel)
   │   ├─→ Valuation Agent
   │   ├─→ Sentiment Agent
   │   ├─→ Fundamentals Agent
   │   └─→ Technicals Agent
   │
   └─→ Risk Manager
       └─→ Calculate risk metrics and position sizing

4. Consensus Calculation
   ├─→ Collect all 18 agent votes
   ├─→ Apply weighted voting
   ├─→ Calculate consensus score
   └─→ Determine final recommendation

5. Signal Generation
   ├─→ Generate trading signal
   ├─→ Calculate entry/exit prices
   ├─→ Determine position sizing
   └─→ Create action items

6. Backtesting
   ├─→ Simulate historical trades
   ├─→ Calculate performance metrics
   └─→ Generate equity curve

7. Database Storage
   ├─→ Store analyses
   ├─→ Store opportunities
   ├─→ Update cache
   └─→ Log job completion

8. Frontend Display
   └─→ Render 6-tab interface with all results
```

## API Architecture (tRPC)

### Procedure Types

```typescript
// Public procedures (no authentication required)
publicProcedure
  .input(z.object({ ... }))
  .query(async ({ input }) => { ... })
  .mutation(async ({ input }) => { ... })

// Protected procedures (requires authentication)
protectedProcedure
  .input(z.object({ ... }))
  .query(async ({ ctx, input }) => { ... })
  .mutation(async ({ ctx, input }) => { ... })
```

### Router Structure

```typescript
appRouter {
  // Authentication
  auth.me
  auth.logout

  // Personas
  personas.list
  personas.getById

  // Tickers
  tickers.search
  tickers.getBySymbol
  tickers.getFinancialData

  // Analysis
  analyses.runAnalysis
  analyses.getLatestForTicker
  analyses.getByRunId

  // Opportunities
  opportunities.getForPersona
  opportunities.generateDailyScan

  // Watchlist (protected)
  watchlist.getTickers
  watchlist.addTicker
  watchlist.removeTicker
  watchlist.isInWatchlist

  // Alerts (protected)
  alerts.list
  alerts.create
  alerts.delete

  // System
  system.notifyOwner
}
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **API Client**: tRPC with React Query
- **State Management**: React Context + tRPC
- **Routing**: wouter

### Backend
- **Runtime**: Node.js 22.13.0
- **Framework**: Express 4
- **API**: tRPC 11
- **Language**: TypeScript 5.9
- **Database**: SQLite with Drizzle ORM
- **AI**: Manus LLM
- **Financial Data**: Yahoo Finance API

### Development Tools
- **Build**: Vite
- **Testing**: Vitest
- **Package Manager**: pnpm
- **Version Control**: Git
- **Code Quality**: ESLint, TypeScript

## Performance Considerations

### Caching Strategy
- Financial data cached for 1 hour
- Analysis results cached for 24 hours
- Persona prompts cached in memory
- Database queries optimized with indexes

### Parallel Processing
- All 12 personas analyzed in parallel
- All 4 technical agents run in parallel
- Risk manager runs independently
- Reduces analysis time from ~120s to ~15s

### Database Optimization
- Indexes on frequently queried columns
- Denormalized opportunity data for fast queries
- Pagination for large result sets
- Connection pooling for concurrent requests

## Security

### Authentication
- Manus OAuth integration
- JWT-based session management
- Secure cookie storage
- CSRF protection

### Authorization
- Protected procedures require authentication
- User-specific data isolation
- Role-based access control (admin/user)

### Data Protection
- Input validation with Zod
- SQL injection prevention via ORM
- XSS protection via React
- HTTPS in production

## Scalability

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Can run multiple server instances
- Load balancer ready

### Vertical Scaling
- Efficient database queries
- Caching strategy
- Parallel agent processing
- Memory-efficient data structures

### Future Improvements
- Redis caching layer
- Message queue for background jobs
- Database read replicas
- CDN for static assets
- API rate limiting

## Deployment Architecture

### Development
```
Local Machine
├── Frontend (Vite dev server)
├── Backend (Node.js dev server)
└── SQLite database
```

### Production
```
Cloud Provider (Railway/Render/AWS)
├── Frontend (Vite build → static files)
├── Backend (Node.js production server)
├── SQLite database (or PostgreSQL)
└── Environment variables
```

## Error Handling

### Frontend
- Try-catch blocks for async operations
- Error boundaries for React components
- User-friendly error messages
- Retry logic for failed requests

### Backend
- Input validation with Zod
- Try-catch in all procedures
- Detailed error logging
- Graceful error responses

### Database
- Transaction support for data consistency
- Rollback on errors
- Connection error handling
- Query timeout protection

## Monitoring & Logging

### Application Logs
- Server startup and shutdown
- Request/response logging
- Error stack traces
- Performance metrics

### Database Logs
- Query execution time
- Connection pool status
- Migration history

### User Activity
- Analysis requests
- Watchlist changes
- Alert triggers

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock external dependencies
- Edge case coverage

### Integration Tests
- API endpoint testing
- Database integration
- Multi-service workflows

### E2E Tests
- Full user workflows
- Frontend to backend
- Real data scenarios

---

**For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

**For API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

**For contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)**
