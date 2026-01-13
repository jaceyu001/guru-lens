# Guru Lens - AI-Powered Stock Analysis Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.13.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

> A comprehensive stock analysis platform that evaluates US stocks through the lens of 12 legendary investors, 4 technical agents, and advanced risk management. Combines real financial data with AI-powered analysis to generate actionable trading signals.

## 🎯 Overview

Guru Lens is a production-ready web application that brings the power of the [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) multi-agent system to a professional user interface. It provides institutional-grade stock analysis by combining:

- **12 Legendary Investor Personas** - Each with unique investment philosophies and criteria
- **4 Technical Agents** - Valuation, Sentiment, Fundamentals, and Technicals analysis
- **Risk Manager** - Position sizing, volatility analysis, and risk metrics
- **Portfolio Manager** - Consensus voting across all 18 agents
- **Real Financial Data** - Yahoo Finance API integration
- **Real AI Analysis** - Manus LLM for intelligent stock evaluation

## ✨ Key Features

### 📊 Multi-Agent Analysis System
- **12 Investor Personas**: Warren Buffett, Peter Lynch, Benjamin Graham, Cathie Wood, Ray Dalio, Philip Fisher, Aswath Damodaran, Michael Burry, Mohnish Pabrai, Rakesh Jhunjhunwala, Stanley Druckenmiller, Bill Ackman
- **4 Technical Agents**: Valuation, Sentiment, Fundamentals, Technicals
- **Risk Manager**: Volatility, Beta, Sharpe Ratio, VaR, CVaR, Position Sizing
- **Portfolio Manager**: Weighted consensus voting (personas 8%, technical 2%, risk 4%)

### 🎨 Professional 6-Tab Interface
1. **Overview** - Consensus recommendation with key metrics
2. **Personas** - Individual investor analysis and scores
3. **Technical** - Technical agent recommendations
4. **Risk** - Risk metrics and position sizing
5. **Signals** - Trading signals with entry/exit prices
6. **Backtest** - Historical performance analysis

### 📈 Real-Time Analysis
- Real financial data from Yahoo Finance API
- Real AI analysis via Manus LLM
- Structured JSON output with scores and verdicts
- Consensus voting with confidence levels
- Trading signals with entry/exit prices and risk/reward ratios

### 🛡️ Risk Management
- Volatility and Beta calculations
- Sharpe Ratio and Max Drawdown metrics
- Value at Risk (VaR) and Conditional VaR (CVaR)
- Position sizing recommendations (1-5% of portfolio)
- Stop loss and take profit levels

### 📊 Backtesting Framework
- Historical performance validation
- Trade-by-trade analysis
- Monthly returns breakdown
- Win rate and profit factor calculations
- Equity curve visualization

### 👤 User Features
- Stock watchlist management
- Price alert thresholds
- Reproducible analysis tracking
- Full analysis metadata and citations
- Responsive design for desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 22.13.0 or higher
- pnpm (recommended) or npm
- SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/jaceyu001/guru-lens.git
cd guru-lens

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
pnpm db:push

# Start development server
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL=file:./dev.db

# OAuth (Manus)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# API Keys
JWT_SECRET=your_jwt_secret
POLYGON_API_KEY=your_polygon_key
FMP_API_KEY=your_fmp_key

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

## 📚 Project Structure

```
guru-lens/
├── client/                          # React frontend (Next.js 15)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── TickerAnalysisEnhanced.tsx  # 6-tab analysis interface
│   │   │   ├── Opportunities.tsx   # Persona-based opportunities
│   │   │   └── Watchlist.tsx       # User watchlist
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Main layout
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client setup
│   │   ├── App.tsx                 # Routes and layout
│   │   └── main.tsx                # Entry point
│   ├── public/                      # Static assets
│   └── index.html
│
├── server/                          # Express backend
│   ├── routers.ts                   # tRPC procedures
│   ├── db.ts                        # Database queries
│   ├── services/
│   │   ├── aiAnalysisEngine.ts      # 12 investor personas AI analysis
│   │   ├── technicalAgents.ts       # 4 technical agents
│   │   ├── riskManager.ts           # Risk metrics and position sizing
│   │   ├── portfolioManager.ts      # Consensus voting
│   │   ├── tradingSignalGenerator.ts # Trading signals
│   │   ├── backtestEngine.ts        # Backtesting framework
│   │   ├── httpFinancialData.ts     # Yahoo Finance API
│   │   └── personaPrompts.ts        # Investor persona prompts
│   ├── _core/
│   │   ├── index.ts                 # Server entry point
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── context.ts               # tRPC context
│   │   ├── llm.ts                   # Manus LLM integration
│   │   └── cookies.ts               # Session management
│   └── tests/
│       ├── personas.test.ts         # Persona tests
│       ├── aiAnalysis.test.ts       # AI analysis tests
│       └── technicalAgents.test.ts  # Technical agent tests
│
├── drizzle/                         # Database
│   ├── schema.ts                    # Database schema
│   └── migrations/                  # Database migrations
│
├── shared/                          # Shared types and constants
│   ├── types.ts                     # TypeScript types
│   └── const.ts                     # Constants
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Development

### Available Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload

# Testing
pnpm test                 # Run all tests
pnpm test --watch        # Run tests in watch mode
pnpm test:ui             # Run tests with UI

# Database
pnpm db:push             # Push schema changes to database
pnpm db:studio           # Open Drizzle Studio for database management

# Building
pnpm run build           # Build for production
pnpm run start           # Start production server

# Code Quality
pnpm run lint            # Run ESLint
pnpm run type-check      # Run TypeScript type checking
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/personas.test.ts

# Run tests matching pattern
pnpm test --grep "AI Analysis"

# Run with coverage
pnpm test --coverage
```

## 📖 Architecture

### 18-Agent Multi-Agent System

```
┌─────────────────────────────────────────────────────┐
│         Portfolio Manager (Consensus Voting)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ 12 Personas      │  │ 4 Technical Agents   │   │
│  │ (8% each)        │  │ (2% each)            │   │
│  │                  │  │                      │   │
│  │ • Buffett        │  │ • Valuation          │   │
│  │ • Lynch          │  │ • Sentiment          │   │
│  │ • Graham         │  │ • Fundamentals       │   │
│  │ • Wood           │  │ • Technicals         │   │
│  │ • Dalio          │  │                      │   │
│  │ • Fisher         │  │                      │   │
│  │ • Damodaran      │  │                      │   │
│  │ • Burry          │  │                      │   │
│  │ • Pabrai         │  │                      │   │
│  │ • Jhunjhunwala   │  │                      │   │
│  │ • Druckenmiller  │  │                      │   │
│  │ • Ackman         │  │                      │   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                     │
│  ┌──────────────────┐                              │
│  │ Risk Manager     │                              │
│  │ (4%)             │                              │
│  │                  │                              │
│  │ • Volatility     │                              │
│  │ • Beta           │                              │
│  │ • Sharpe Ratio   │                              │
│  │ • Position Size  │                              │
│  └──────────────────┘                              │
└─────────────────────────────────────────────────────┘
         ↓
    Consensus Score (0-100)
    Final Recommendation (BUY/SELL/HOLD/AVOID)
         ↓
┌─────────────────────────────────────────────────────┐
│         Trading Signal Generator                    │
│  • Entry/Exit Prices                               │
│  • Position Sizing                                 │
│  • Stop Loss/Take Profit                           │
│  • Risk/Reward Ratios                              │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│         Backtesting Engine                          │
│  • Historical Performance                          │
│  • Trade Analysis                                  │
│  • Risk Metrics                                    │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **User searches for stock** → Ticker search via Yahoo Finance
2. **Financial data fetched** → Real-time stock data and fundamentals
3. **All 18 agents analyze** → Parallel AI analysis using Manus LLM
4. **Consensus calculated** → Weighted voting across all agents
5. **Risk assessed** → Position sizing and risk metrics
6. **Signals generated** → Entry/exit prices and action items
7. **Results displayed** → 6-tab professional interface
8. **Backtest validated** → Historical performance analysis

## 🔌 API Endpoints (tRPC)

### Ticker Operations
- `tickers.search` - Search for stocks
- `tickers.getBySymbol` - Get ticker details
- `tickers.getFinancialData` - Get financial data

### Analysis
- `analyses.runAnalysis` - Run multi-persona analysis
- `analyses.getLatestForTicker` - Get latest analyses

### Opportunities
- `opportunities.getForPersona` - Get persona opportunities
- `opportunities.generateDailyScan` - Generate daily scan

### Watchlist
- `watchlist.getTickers` - Get user watchlist
- `watchlist.addTicker` - Add to watchlist
- `watchlist.removeTicker` - Remove from watchlist

### Alerts
- `alerts.list` - Get user alerts
- `alerts.create` - Create new alert
- `alerts.delete` - Delete alert

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

## 🗄️ Database Schema

### Tables
- **tickers** - Stock symbols and company information
- **personas** - 12 investor personas with prompts and criteria
- **analyses** - Individual persona analyses with scores
- **opportunities** - High-scoring stocks by persona
- **watchlists** - User-saved stocks
- **watchlist_tickers** - Watchlist relationships
- **alerts** - User alerts and thresholds
- **jobs** - Background analysis jobs

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema documentation.

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Test results:
# ✓ Personas (4 tests)
# ✓ AI Analysis (12 tests)
# ✓ Technical Agents (8 tests)
# ✓ Risk Manager (4 tests)
# ✓ Portfolio Manager (4 tests)
# ✓ Trading Signals (2 tests)
# ✓ Backtesting (2 tests)
```

## 🚀 Deployment

### Deploy to Railway

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Railway
# - Go to railway.app
# - Create new project
# - Connect GitHub repository
# - Railway auto-detects Node.js project

# 3. Set environment variables in Railway dashboard
# 4. Deploy automatically on push
```

### Deploy to Render

```bash
# 1. Create Render account at render.com
# 2. Create new Web Service
# 3. Connect GitHub repository
# 4. Configure build and start commands:
#    Build: pnpm install && pnpm run build
#    Start: pnpm run start
# 5. Add environment variables
# 6. Deploy
```

### Deploy to Vercel (Frontend Only)

```bash
# 1. Push to GitHub
# 2. Go to vercel.com
# 3. Import GitHub repository
# 4. Configure build settings
# 5. Deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📊 Example Usage

### Search and Analyze a Stock

```typescript
// Frontend
const { data: analyses } = trpc.analyses.runAnalysis.useQuery({
  symbol: "AAPL",
  mode: "quick"
});

// Returns: Array of 6 persona analyses with scores (0-100)
```

### Get Consensus Recommendation

```typescript
const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
// AAPL: 54/100 (SELL)
```

### Get Trading Signal

```typescript
const signal = {
  entryPrice: 236.57,
  stopLoss: 223.32,
  takeProfit: 262.82,
  positionSize: 5,
  riskRewardRatio: 2.0
};
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) - Multi-agent stock analysis framework
- [Manus](https://manus.im) - AI and infrastructure platform
- [Yahoo Finance](https://finance.yahoo.com) - Financial data source
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [tRPC](https://trpc.io/) - End-to-end typesafe APIs

## 📞 Support

For issues, questions, or suggestions:

1. Check [existing issues](https://github.com/jaceyu001/guru-lens/issues)
2. Create a [new issue](https://github.com/jaceyu001/guru-lens/issues/new)
3. Reach out via email or discussions

## 🗺️ Roadmap

- [ ] Historical price charts and technical analysis visualizations
- [ ] Persona comparison tool
- [ ] Email digest notifications
- [ ] Portfolio optimization recommendations
- [ ] Multi-stock portfolio analysis
- [ ] Sector rotation analysis
- [ ] Dividend tracking and analysis
- [ ] Options analysis integration
- [ ] Mobile app (React Native)
- [ ] Advanced filtering and search

---

**Built with ❤️ using Next.js, React, TypeScript, tRPC, and Manus AI**
