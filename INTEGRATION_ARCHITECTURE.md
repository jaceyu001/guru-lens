# Guru Lens + ai-hedge-fund Integration Architecture

## Overview

This document describes how we're integrating ai-hedge-fund's advanced features (consensus voting, trading signals, risk management, technical agents, backtesting) while preserving Guru Lens's existing persona analysis scores.

---

## System Architecture

### Before Integration (Current Guru Lens)

```
Financial Data (Yahoo Finance)
    ↓
[6 Investor Personas]
    ├─ Warren Buffett
    ├─ Peter Lynch
    ├─ Benjamin Graham
    ├─ Cathie Wood
    ├─ Ray Dalio
    └─ Philip Fisher
    ↓
[Persona Scores: 0-100]
    ↓
Frontend Display
```

### After Integration (Guru Lens + ai-hedge-fund)

```
Financial Data (Yahoo Finance)
    ↓
┌───────────────────────────────────────────┐
│         ANALYSIS LAYER                    │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  6 INVESTOR PERSONAS (Existing)     │  │
│  ├─────────────────────────────────────┤  │
│  │ ├─ Warren Buffett (Score: 0-100)    │  │
│  │ ├─ Peter Lynch (Score: 0-100)       │  │
│  │ ├─ Benjamin Graham (Score: 0-100)   │  │
│  │ ├─ Cathie Wood (Score: 0-100)       │  │
│  │ ├─ Ray Dalio (Score: 0-100)         │  │
│  │ └─ Philip Fisher (Score: 0-100)     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  4 TECHNICAL AGENTS (New)           │  │
│  ├─────────────────────────────────────┤  │
│  │ ├─ Valuation Agent                  │  │
│  │ ├─ Sentiment Agent                  │  │
│  │ ├─ Fundamentals Agent               │  │
│  │ └─ Technicals Agent                 │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  RISK MANAGER (New)                 │  │
│  │  ├─ Volatility calculation          │  │
│  │  ├─ Beta analysis                   │  │
│  │  ├─ Position sizing                 │  │
│  │  └─ Stop-loss levels                │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│    DECISION LAYER                         │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  CONSENSUS VOTING                   │  │
│  │  ├─ Collect all agent votes         │  │
│  │  ├─ Weight by confidence            │  │
│  │  ├─ Calculate consensus strength    │  │
│  │  └─ Generate recommendation         │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  PORTFOLIO MANAGER (New)            │  │
│  │  ├─ Synthesize all signals          │  │
│  │  ├─ Apply portfolio constraints     │  │
│  │  ├─ Generate trading signal         │  │
│  │  └─ Calculate position size         │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│    OUTPUT LAYER                           │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  RESEARCH VIEW (Existing)           │  │
│  │  ├─ 6 persona scores (0-100)        │  │
│  │  ├─ Detailed reasoning              │  │
│  │  └─ Criteria breakdown              │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  TRADING VIEW (New)                 │  │
│  │  ├─ Consensus recommendation        │  │
│  │  ├─ Trading signal (BUY/SELL/HOLD)  │  │
│  │  ├─ Position size (%)               │  │
│  │  ├─ Stop-loss level                 │  │
│  │  ├─ Price target                    │  │
│  │  └─ Confidence score                │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  RISK METRICS (New)                 │  │
│  │  ├─ Volatility                      │  │
│  │  ├─ Beta                            │  │
│  │  ├─ Sharpe ratio                    │  │
│  │  └─ Max drawdown                    │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
    ↓
Frontend Display (Multiple Views)
```

---

## Database Schema Updates

### New Tables

```sql
-- Store agent votes and recommendations
CREATE TABLE agent_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysisId INT NOT NULL,
  agentType VARCHAR(50),  -- 'investor', 'technical', 'risk', 'portfolio'
  agentName VARCHAR(100),
  recommendation VARCHAR(20),  -- BUY, SELL, HOLD
  confidence DECIMAL(5,2),
  reasoning TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysisId) REFERENCES analyses(id)
);

-- Store trading signals
CREATE TABLE trading_signals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tickerId INT NOT NULL,
  action VARCHAR(20),  -- BUY, SELL, HOLD
  positionSize DECIMAL(5,2),  -- % of portfolio
  entryPrice DECIMAL(12,2),
  stopLoss DECIMAL(12,2),
  priceTarget DECIMAL(12,2),
  confidence DECIMAL(5,2),
  consensusStrength DECIMAL(5,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tickerId) REFERENCES tickers(id)
);

-- Store risk metrics
CREATE TABLE risk_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tickerId INT NOT NULL,
  volatility DECIMAL(5,2),
  beta DECIMAL(5,2),
  sharpeRatio DECIMAL(5,2),
  maxDrawdown DECIMAL(5,2),
  var95 DECIMAL(5,2),  -- Value at Risk
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tickerId) REFERENCES tickers(id)
);

-- Store backtest results
CREATE TABLE backtest_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tickerId INT NOT NULL,
  strategyName VARCHAR(100),
  startDate DATE,
  endDate DATE,
  totalReturn DECIMAL(10,2),
  sharpeRatio DECIMAL(5,2),
  maxDrawdown DECIMAL(5,2),
  winRate DECIMAL(5,2),
  trades INT,
  profitableTrades INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tickerId) REFERENCES tickers(id)
);
```

---

## Agent Architecture

### 6 Investor Personas (Existing)
- Warren Buffett (Value investing)
- Peter Lynch (Growth at reasonable price)
- Benjamin Graham (Deep value)
- Cathie Wood (Disruptive innovation)
- Ray Dalio (Macro + balance sheet)
- Philip Fisher (Quality + growth)

**Output:** Score 0-100, Verdict, Criteria breakdown

### 4 Technical Agents (New)

#### 1. Valuation Agent
**Purpose:** Calculate intrinsic value and generate valuation signals

**Inputs:**
- Financial statements (revenue, earnings, cash flow)
- Key ratios (P/E, P/B, P/S)
- Growth rates
- Discount rate

**Analysis:**
- DCF (Discounted Cash Flow) valuation
- Comparable company analysis
- Asset-based valuation
- Intrinsic value calculation

**Output:**
```json
{
  "agentName": "Valuation Agent",
  "recommendation": "BUY|SELL|HOLD",
  "intrinsicValue": 350.00,
  "currentPrice": 248.50,
  "upside": 40.8,
  "confidence": 85,
  "reasoning": "Stock trading at 29% discount to intrinsic value..."
}
```

#### 2. Sentiment Agent
**Purpose:** Analyze market sentiment and social signals

**Inputs:**
- News sentiment (positive/negative/neutral)
- Social media mentions
- Analyst ratings
- Insider trading activity

**Analysis:**
- News sentiment scoring
- Social media trend analysis
- Analyst consensus
- Insider buying/selling patterns

**Output:**
```json
{
  "agentName": "Sentiment Agent",
  "recommendation": "BUY|SELL|HOLD",
  "sentimentScore": 0.72,  // -1 to 1
  "newsScore": 0.65,
  "socialScore": 0.78,
  "analystRating": 4.2,  // 1-5
  "confidence": 70,
  "reasoning": "Positive sentiment with strong analyst support..."
}
```

#### 3. Fundamentals Agent
**Purpose:** Analyze financial fundamentals and generate signals

**Inputs:**
- Revenue growth
- Earnings growth
- Margin trends
- Cash flow quality
- Balance sheet strength

**Analysis:**
- Earnings quality assessment
- Revenue growth sustainability
- Margin trend analysis
- Cash conversion efficiency

**Output:**
```json
{
  "agentName": "Fundamentals Agent",
  "recommendation": "BUY|SELL|HOLD",
  "revenueGrowth": 50.0,  // YoY %
  "earningsGrowth": 45.0,
  "marginTrend": "improving",
  "cashFlowQuality": 0.92,  // 0-1
  "confidence": 88,
  "reasoning": "Strong fundamentals with improving margins..."
}
```

#### 4. Technicals Agent
**Purpose:** Analyze price patterns and technical indicators

**Inputs:**
- Price history (OHLCV)
- Technical indicators (RSI, MACD, Bollinger Bands)
- Support/resistance levels
- Volume patterns

**Analysis:**
- Trend analysis (uptrend/downtrend)
- Momentum indicators
- Support/resistance identification
- Chart pattern recognition

**Output:**
```json
{
  "agentName": "Technicals Agent",
  "recommendation": "BUY|SELL|HOLD",
  "trend": "uptrend",
  "rsi": 65.2,
  "macd": "bullish",
  "support": 240.00,
  "resistance": 260.00,
  "confidence": 72,
  "reasoning": "Bullish trend with strong support at $240..."
}
```

### Risk Manager Agent (New)

**Purpose:** Calculate risk metrics and position sizing

**Inputs:**
- Stock volatility (historical)
- Beta (market correlation)
- Portfolio size
- Risk tolerance
- Current holdings

**Analysis:**
- Volatility calculation (30-day, 60-day, annualized)
- Beta calculation
- Value at Risk (VaR) at 95% confidence
- Maximum drawdown estimation
- Position sizing based on Kelly Criterion

**Output:**
```json
{
  "agentName": "Risk Manager",
  "volatility": 35.2,  // Annualized %
  "beta": 1.8,
  "var95": 5.2,  // Max loss at 95% confidence
  "maxDrawdown": 45.0,  // Historical %
  "recommendedPositionSize": 2.5,  // % of portfolio
  "stopLoss": 210.00,
  "maxLoss": 18.50,  // $ per share
  "confidence": 90,
  "reasoning": "High volatility requires conservative position sizing..."
}
```

---

## Decision-Making Flow

### Step 1: Collect All Votes

```
18 Agents vote:
├─ 6 Investor Personas
│  ├─ Warren Buffett: HOLD (confidence 85%)
│  ├─ Peter Lynch: BUY (confidence 80%)
│  ├─ Benjamin Graham: SELL (confidence 75%)
│  ├─ Cathie Wood: BUY (confidence 90%)
│  ├─ Ray Dalio: BUY (confidence 82%)
│  └─ Philip Fisher: BUY (confidence 88%)
│
├─ 4 Technical Agents
│  ├─ Valuation Agent: BUY (confidence 85%)
│  ├─ Sentiment Agent: BUY (confidence 70%)
│  ├─ Fundamentals Agent: BUY (confidence 88%)
│  └─ Technicals Agent: HOLD (confidence 72%)
│
└─ Risk Manager: Position size 2.5% (confidence 90%)
```

### Step 2: Consensus Voting

```
Vote Tally:
├─ BUY: 8 votes (Peter Lynch, Cathie Wood, Ray Dalio, Philip Fisher, 
│                 Valuation, Sentiment, Fundamentals)
├─ HOLD: 2 votes (Warren Buffett, Technicals)
└─ SELL: 1 vote (Benjamin Graham)

Weighted Consensus:
├─ BUY votes: 8 × avg confidence 83% = 664 points
├─ HOLD votes: 2 × avg confidence 78% = 156 points
├─ SELL votes: 1 × avg confidence 75% = 75 points
│
├─ Total: 895 points
├─ BUY strength: 664/895 = 74.2%
├─ Consensus: STRONG BUY
└─ Confidence: 74.2%
```

### Step 3: Portfolio Manager Decision

```
Portfolio Manager synthesizes:
├─ Consensus recommendation: STRONG BUY
├─ Consensus confidence: 74.2%
├─ Risk metrics: Volatility 35%, Beta 1.8
├─ Position sizing: 2.5% of portfolio
├─ Risk constraints: Max 5% per position
├─ Portfolio balance: Currently 18% in tech
│
└─ Final Decision:
    ├─ Action: BUY
    ├─ Position Size: 2.5%
    ├─ Entry Price: $248.50
    ├─ Stop Loss: $210.00
    ├─ Price Target: $350.00
    ├─ Confidence: 74.2%
    └─ Reasoning: Strong consensus across investors and technicals...
```

---

## Output Format

### Research View (Existing - Preserved)

```json
{
  "ticker": "TSLA",
  "personaAnalyses": [
    {
      "persona": "Cathie Wood",
      "score": 95,
      "verdict": "Strong Fit",
      "criteria": [...],
      "keyRisks": [...],
      "whatWouldChangeMind": [...]
    },
    // ... 5 more personas
  ]
}
```

### Trading View (New)

```json
{
  "ticker": "TSLA",
  "tradingSignal": {
    "action": "BUY",
    "positionSize": 2.5,
    "entryPrice": 248.50,
    "stopLoss": 210.00,
    "priceTarget": 350.00,
    "confidence": 74.2,
    "consensusStrength": 74.2
  },
  "agentVotes": [
    {
      "agentName": "Warren Buffett",
      "recommendation": "HOLD",
      "confidence": 85,
      "reasoning": "..."
    },
    // ... 17 more agents
  ],
  "riskMetrics": {
    "volatility": 35.2,
    "beta": 1.8,
    "sharpeRatio": 1.45,
    "maxDrawdown": 45.0,
    "var95": 5.2
  }
}
```

---

## Implementation Phases

### Phase 2: Technical Agents
- Implement Valuation Agent (DCF, comparables)
- Implement Sentiment Agent (news, social, analyst)
- Implement Fundamentals Agent (growth, margins, cash flow)
- Implement Technicals Agent (indicators, patterns)

### Phase 3: Risk Manager
- Volatility calculation
- Beta calculation
- Position sizing (Kelly Criterion)
- Stop-loss and price target calculation

### Phase 4: Portfolio Manager & Consensus
- Collect votes from all agents
- Weighted voting system
- Consensus strength calculation
- Final recommendation synthesis

### Phase 5: Trading Signals
- Generate BUY/SELL/HOLD signals
- Position sizing
- Risk-adjusted recommendations
- Store in database

### Phase 6: Backtesting
- Historical data collection
- Strategy validation
- Performance metrics
- Visualization

---

## Key Design Decisions

1. **Preserve Existing Personas:** Keep 6 persona scores (0-100) unchanged
2. **Add Technical Agents:** Complement investor personas with technical analysis
3. **Consensus Voting:** Confidence-weighted voting for robust decisions
4. **Multiple Views:** Research view (personas) + Trading view (signals)
5. **Risk Management:** Integrated throughout, not separate
6. **User Agency:** Users can follow personas or trading signals

---

## Benefits of This Approach

✅ **Best of both worlds:** Research focus + Trading signals
✅ **Transparency:** All agent votes visible to users
✅ **Robustness:** Consensus reduces single-agent bias
✅ **Risk-aware:** Position sizing based on volatility
✅ **Validated:** Backtesting shows historical performance
✅ **Flexible:** Users choose which signals to follow
