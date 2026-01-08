# Guru Lens vs. ai-hedge-fund: Comprehensive Comparison

## Executive Summary

**Short Answer:** You are on the **same track** but with **different approaches**. Both systems use multiple AI agents to analyze stocks through different investor personas, but they differ significantly in:

1. **Architecture:** ai-hedge-fund is Python-based with sequential agent execution; Guru Lens is Node.js/TypeScript with parallel LLM calls
2. **Decision Making:** ai-hedge-fund uses a **consensus voting system** with a Portfolio Manager making final decisions; Guru Lens uses **independent persona scoring** with user-driven selection
3. **Output:** ai-hedge-fund generates **trading signals** (BUY/SELL/HOLD); Guru Lens generates **analysis scores** (0-100 per persona)
4. **Scope:** ai-hedge-fund is a **complete trading system** with backtesting; Guru Lens is an **analysis platform** with research focus

---

## Part 1: System Architecture Comparison

### ai-hedge-fund Architecture

```
Python-based multi-agent system:

┌─────────────────────────────────────────────────────┐
│              FINANCIAL DATA INPUT                   │
│  (Financial Datasets API + Yahoo Finance)           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    INVESTOR AGENTS          TECHNICAL AGENTS
    (Sequential)              (Parallel)
    
    ├─ Aswath Damodaran      ├─ Valuation Agent
    ├─ Ben Graham            ├─ Sentiment Agent
    ├─ Bill Ackman           ├─ Fundamentals Agent
    ├─ Cathie Wood           └─ Technicals Agent
    ├─ Charlie Munger
    ├─ Michael Burry
    ├─ Mohnish Pabrai
    ├─ Peter Lynch
    ├─ Phil Fisher
    ├─ Rakesh Jhunjhunwala
    ├─ Stanley Druckenmiller
    └─ Warren Buffett
    
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   RISK MANAGER         │
        │ (Calculates risk,      │
        │  sets position limits) │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  PORTFOLIO MANAGER     │
        │ (Makes final decision: │
        │  BUY/SELL/HOLD)        │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   TRADING SIGNALS      │
        │  (BUY, SELL, HOLD)     │
        └────────────────────────┘
```

**Key Characteristics:**
- **Language:** Python
- **Agents:** 18 total (12 investor personas + 4 technical + Risk Manager + Portfolio Manager)
- **Execution Flow:** Sequential (each agent analyzes, then passes to next)
- **Decision Making:** Consensus voting → Portfolio Manager decides
- **Output:** Trading signals (BUY/SELL/HOLD with position size)
- **Backtesting:** Built-in backtester for historical analysis
- **Trading:** Does NOT actually execute trades (educational only)

### Guru Lens Architecture

```
Node.js/TypeScript web platform:

┌─────────────────────────────────────────────────────┐
│         REAL-TIME FINANCIAL DATA INPUT              │
│  (Yahoo Finance API via HTTP)                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Data Preparation Layer    │
        │  (Format for LLM)          │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────────────────┐
        │                                     │
        ▼                                     ▼
    PERSONA PROMPTS                    FINANCIAL DATA
    (6 investor personas)              (Quantitative +
                                       Qualitative)
    ├─ Warren Buffett
    ├─ Peter Lynch
    ├─ Benjamin Graham
    ├─ Cathie Wood
    ├─ Ray Dalio
    └─ Philip Fisher
    
        │                                     │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   MANUS LLM SERVICE        │
        │ (Parallel LLM calls,       │
        │  one per persona)          │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────────────────┐
        │                                     │
        ▼                                     ▼
    PERSONA SCORES                    ANALYSIS OUTPUT
    (0-100 per persona)               (JSON structured)
    
    ├─ Cathie Wood: 95/100
    ├─ Warren Buffett: 72/100
    ├─ Peter Lynch: 78/100
    ├─ Benjamin Graham: 35/100
    ├─ Ray Dalio: 82/100
    └─ Philip Fisher: 88/100
    
        │                                     │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   DATABASE PERSISTENCE     │
        │  (MySQL - Drizzle ORM)     │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   FRONTEND DISPLAY         │
        │  (React - Web UI)          │
        │  User selects persona      │
        │  to follow                 │
        └────────────────────────────┘
```

**Key Characteristics:**
- **Language:** TypeScript/Node.js (backend) + React (frontend)
- **Agents:** 6 investor personas
- **Execution Flow:** Parallel (all personas analyzed simultaneously)
- **Decision Making:** Independent scoring → User chooses which persona to follow
- **Output:** Analysis scores (0-100) with detailed reasoning
- **Backtesting:** Not included
- **Trading:** Not applicable (research platform, not trading system)

---

## Part 2: Decision-Making Process Comparison

### ai-hedge-fund Decision Flow

```
STEP 1: INVESTOR AGENTS ANALYZE
┌─────────────────────────────────────────────────────┐
│ Each agent reads financial data and generates:      │
│ - Investment thesis (narrative reasoning)           │
│ - Recommendation (BUY/SELL/HOLD)                    │
│ - Confidence score                                  │
│ - Price target                                      │
└─────────────────────────────────────────────────────┘

Example: Warren Buffett Agent
Input: TSLA financial data
Output: "HOLD - Valuation too high despite quality business"

Example: Cathie Wood Agent
Input: TSLA financial data
Output: "BUY - Disruptive innovation in EVs and energy storage"

STEP 2: TECHNICAL AGENTS ANALYZE
┌─────────────────────────────────────────────────────┐
│ Parallel agents analyze:                            │
│ - Valuation metrics (intrinsic value)               │
│ - Market sentiment (news, social media)             │
│ - Fundamental data (financial statements)           │
│ - Technical indicators (price patterns)             │
└─────────────────────────────────────────────────────┘

STEP 3: CONSENSUS VOTING
┌─────────────────────────────────────────────────────┐
│ All agents vote on recommendation:                  │
│                                                     │
│ Agent Votes:                                        │
│ ├─ Warren Buffett: HOLD (confidence: 85%)           │
│ ├─ Cathie Wood: BUY (confidence: 90%)               │
│ ├─ Ben Graham: SELL (confidence: 75%)               │
│ ├─ Valuation Agent: HOLD (confidence: 80%)          │
│ ├─ Sentiment Agent: BUY (confidence: 70%)           │
│ ├─ Fundamentals Agent: BUY (confidence: 85%)        │
│ └─ Technicals Agent: HOLD (confidence: 65%)         │
│                                                     │
│ Vote Tally:                                         │
│ ├─ BUY: 3 votes (Cathie, Sentiment, Fundamentals)   │
│ ├─ HOLD: 3 votes (Warren, Valuation, Technicals)    │
│ └─ SELL: 1 vote (Ben Graham)                        │
└─────────────────────────────────────────────────────┘

STEP 4: RISK MANAGER EVALUATES
┌─────────────────────────────────────────────────────┐
│ Calculates:                                         │
│ - Volatility (35% for TSLA)                         │
│ - Beta (1.8)                                        │
│ - Position sizing (max 5% of portfolio)             │
│ - Stop-loss levels                                  │
└─────────────────────────────────────────────────────┘

STEP 5: PORTFOLIO MANAGER DECIDES
┌─────────────────────────────────────────────────────┐
│ Final decision logic:                               │
│ - Weighted vote (confidence-weighted)               │
│ - Risk constraints from Risk Manager                │
│ - Portfolio balance                                 │
│ - Position limits                                   │
│                                                     │
│ Decision: "BUY 2% position in TSLA"                 │
│ (Weighted consensus favors BUY despite tie)         │
└─────────────────────────────────────────────────────┘

STEP 6: GENERATE TRADING SIGNAL
┌─────────────────────────────────────────────────────┐
│ Output: Trading Signal                              │
│ ├─ Action: BUY                                      │
│ ├─ Position Size: 2% of portfolio                   │
│ ├─ Entry Price: $248.50                             │
│ ├─ Stop Loss: $210.00                               │
│ ├─ Price Target: $350.00                            │
│ └─ Confidence: 72% (weighted consensus)             │
└─────────────────────────────────────────────────────┘
```

**Key Decision Factors:**
1. **Consensus voting** - Majority rule with confidence weighting
2. **Risk management** - Position sizing based on volatility
3. **Portfolio constraints** - Balance across holdings
4. **Single final decision** - One BUY/SELL/HOLD per stock

### Guru Lens Decision Flow

```
STEP 1: FETCH FINANCIAL DATA
┌─────────────────────────────────────────────────────┐
│ Real-time data from Yahoo Finance:                  │
│ - Price: $248.50                                    │
│ - P/E: 48.4                                         │
│ - ROE: 28%                                          │
│ - Revenue: $96.7B                                   │
│ - Margins: 21% operating                            │
│ - Sector: Consumer Cyclical                         │
│ - Description: "Tesla designs..."                   │
└─────────────────────────────────────────────────────┘

STEP 2: PREPARE PERSONA PROMPTS
┌─────────────────────────────────────────────────────┐
│ For each persona, create prompt:                    │
│                                                     │
│ "You are Cathie Wood analyzing Tesla..."            │
│ "Financial Data: P/E 48.4, ROE 28%, ..."            │
│ "Evaluate based on these criteria: [...]"           │
│ "Return structured JSON with score, verdict..."     │
└─────────────────────────────────────────────────────┘

STEP 3: PARALLEL LLM CALLS
┌─────────────────────────────────────────────────────┐
│ Call Manus LLM 6 times in parallel:                 │
│                                                     │
│ ├─ Cathie Wood prompt → LLM → Score 95              │
│ ├─ Warren Buffett prompt → LLM → Score 72           │
│ ├─ Peter Lynch prompt → LLM → Score 78              │
│ ├─ Benjamin Graham prompt → LLM → Score 35          │
│ ├─ Ray Dalio prompt → LLM → Score 82                │
│ └─ Philip Fisher prompt → LLM → Score 88            │
│                                                     │
│ All calls happen simultaneously                     │
└─────────────────────────────────────────────────────┘

STEP 4: LLM REASONING (Inside each call)
┌─────────────────────────────────────────────────────┐
│ Example: Cathie Wood's reasoning                    │
│                                                     │
│ Input: TSLA financial data + Cathie's criteria      │
│                                                     │
│ LLM Thinks:                                         │
│ "P/E 48.4 is high, but ROE 28% is exceptional.      │
│  This justifies premium valuation.                  │
│                                                     │
│  Tesla's disruptive innovation in EVs and energy    │
│  storage creates massive TAM ($500B+ EV, $1T+).     │
│                                                     │
│  Management execution is excellent.                 │
│  Financial health is strong (0.18 debt/equity).     │
│                                                     │
│  Criteria Evaluation:                               │
│  - Disruptive Innovation: PASS (25 pts)             │
│  - Revenue Growth: PASS (20 pts)                    │
│  - Market Opportunity: PASS (20 pts)                │
│  - Management Vision: PASS (15 pts)                 │
│  - Valuation: PARTIAL (5 pts)                       │
│  - Financial Health: PASS (10 pts)                  │
│                                                     │
│  Total: 95/100 = Strong Fit"                        │
│                                                     │
│ Output: JSON with score 95, verdict "Strong Fit"    │
└─────────────────────────────────────────────────────┘

STEP 5: PARSE & STORE RESULTS
┌─────────────────────────────────────────────────────┐
│ For each persona, store:                            │
│ - Score: 0-100                                      │
│ - Verdict: Strong Fit / Fit / Borderline / Not Fit  │
│ - Criteria breakdown with weights                   │
│ - Key risks                                         │
│ - What would change my mind                         │
│ - Timestamp and metadata                            │
└─────────────────────────────────────────────────────┘

STEP 6: DISPLAY TO USER
┌─────────────────────────────────────────────────────┐
│ Show all 6 persona scores:                          │
│                                                     │
│ Cathie Wood: 95/100 (Strong Fit)                    │
│ ├─ Disruptive Innovation: PASS                      │
│ ├─ Revenue Growth: PASS                             │
│ ├─ Market Opportunity: PASS                         │
│ ├─ Management Vision: PASS                          │
│ ├─ Valuation: PARTIAL                               │
│ └─ Financial Health: PASS                           │
│                                                     │
│ Warren Buffett: 72/100 (Fit)                        │
│ ├─ Economic Moat: PASS                              │
│ ├─ Management: PASS                                 │
│ ├─ Financial Strength: PARTIAL                      │
│ ├─ Valuation: FAIL (P/E too high)                   │
│ └─ Understandability: PASS                          │
│                                                     │
│ [... and 4 more personas ...]                       │
│                                                     │
│ User can click on any persona to see full analysis  │
└─────────────────────────────────────────────────────┘

STEP 7: USER DECISION
┌─────────────────────────────────────────────────────┐
│ User chooses which persona(s) to follow:            │
│                                                     │
│ "I like Cathie Wood's thesis (95/100)"              │
│ → User adds TSLA to watchlist                       │
│ → Receives alerts if score drops below 80           │
│                                                     │
│ OR                                                  │
│                                                     │
│ "I'm a value investor like Graham (35/100)"         │
│ → User skips TSLA, looks for cheaper stocks         │
│                                                     │
│ OR                                                  │
│                                                     │
│ "I want consensus (average: 75/100)"                │
│ → User considers TSLA as moderate opportunity       │
└─────────────────────────────────────────────────────┘
```

**Key Decision Factors:**
1. **Independent scoring** - Each persona evaluated separately
2. **Weighted criteria** - Each persona has different weights
3. **User-driven selection** - User chooses which persona to follow
4. **Multiple perspectives** - All 6 scores available simultaneously
5. **No portfolio management** - Focus on individual stock analysis

---

## Part 3: Detailed Comparison Table

| Aspect | ai-hedge-fund | Guru Lens |
|--------|---------------|-----------|
| **Purpose** | Trading system | Research/Analysis platform |
| **Language** | Python | TypeScript/Node.js + React |
| **Number of Agents** | 18 (12 investors + 4 technical + Risk + Portfolio) | 6 (investor personas only) |
| **Execution Model** | Sequential (agents pass results to next) | Parallel (all personas analyzed simultaneously) |
| **Decision Making** | Consensus voting → Portfolio Manager | Independent scoring → User selection |
| **Output Type** | Trading signals (BUY/SELL/HOLD) | Analysis scores (0-100) |
| **Position Sizing** | Yes (% of portfolio) | No (research only) |
| **Risk Management** | Yes (Risk Manager agent) | No (not trading) |
| **Backtesting** | Yes (built-in backtester) | No |
| **Historical Analysis** | Yes (can analyze past periods) | Yes (can re-run past analyses) |
| **Real-time Trading** | No (educational only) | N/A (not trading) |
| **Financial Data** | Financial Datasets API + Yahoo | Yahoo Finance API |
| **Database** | SQLite | MySQL |
| **Frontend** | Web app (TypeScript/React) | Web app (React) |
| **Persona Count** | 12 investor personas | 6 investor personas |
| **Technical Analysis** | Yes (Technicals agent) | No |
| **Sentiment Analysis** | Yes (Sentiment agent) | No |
| **Valuation Agent** | Yes (dedicated agent) | No (integrated into personas) |
| **User Interaction** | View trading signals | Select persona to follow |
| **Watchlist** | Not mentioned | Yes (authenticated users) |
| **Alerts** | Not mentioned | Yes (score threshold alerts) |
| **API** | CLI + Web app | tRPC API + Web app |

---

## Part 4: What's in Common

### Similarities

1. **Multi-Agent Architecture**
   - Both use multiple AI agents to analyze stocks
   - Each agent has a distinct investment philosophy
   - Agents work in parallel or sequence to provide diverse perspectives

2. **Investor Personas**
   - Both feature legendary investor personas:
     - Warren Buffett (value investing)
     - Cathie Wood (growth/innovation)
     - Ben Graham (deep value)
     - Peter Lynch (growth at reasonable price)
   - ai-hedge-fund has 12 personas; Guru Lens has 6

3. **LLM-Based Analysis**
   - Both use LLMs (OpenAI for ai-hedge-fund, Manus for Guru Lens)
   - Both provide structured reasoning from financial data
   - Both generate narrative explanations for decisions

4. **Financial Data Integration**
   - Both fetch real financial data (Yahoo Finance, Financial Datasets API)
   - Both analyze quantitative metrics (P/E, ROE, margins, etc.)
   - Both consider qualitative factors (management, industry, trends)

5. **Educational Focus**
   - Both are explicitly for learning/research (not real trading)
   - Both provide transparency in decision-making
   - Both show reasoning behind recommendations

6. **Web-Based Interface**
   - Both have web applications for user interaction
   - Both display analysis results in user-friendly format
   - Both allow users to explore different stocks

---

## Part 5: What's Different

### Key Differences

1. **Decision Making Philosophy**
   
   **ai-hedge-fund:**
   - Consensus voting (majority rule)
   - Portfolio Manager makes final decision
   - Single recommendation per stock (BUY/SELL/HOLD)
   - Confidence-weighted voting
   
   **Guru Lens:**
   - Independent scoring (no consensus)
   - User makes final decision
   - Multiple scores (one per persona)
   - User selects which persona to follow

2. **Output Format**
   
   **ai-hedge-fund:**
   ```
   {
     "action": "BUY",
     "position_size": "2%",
     "entry_price": 248.50,
     "stop_loss": 210.00,
     "price_target": 350.00,
     "confidence": 0.72
   }
   ```
   
   **Guru Lens:**
   ```
   {
     "persona": "Cathie Wood",
     "score": 95,
     "verdict": "Strong Fit",
     "criteria": [
       {
         "name": "Disruptive Innovation",
         "status": "pass",
         "weight": 25
       },
       ...
     ],
     "keyRisks": [...],
     "whatWouldChangeMind": [...]
   }
   ```

3. **Risk Management**
   
   **ai-hedge-fund:**
   - Dedicated Risk Manager agent
   - Calculates volatility, beta, position sizing
   - Sets stop-loss levels
   - Manages portfolio-level risk
   
   **Guru Lens:**
   - No risk management (research focus)
   - No position sizing
   - No stop-loss levels
   - Focus on analysis quality

4. **Backtesting**
   
   **ai-hedge-fund:**
   - Built-in backtester
   - Can test strategies over historical periods
   - Generates performance metrics
   - Useful for validating strategy
   
   **Guru Lens:**
   - No backtesting
   - Can re-run analyses on past dates
   - Focus on current/recent analysis
   - No performance metrics

5. **Execution Model**
   
   **ai-hedge-fund:**
   - Sequential: Agents analyze → Voting → Portfolio Manager → Decision
   - Each agent reads previous agent's output
   - Results in single consensus decision
   
   **Guru Lens:**
   - Parallel: All personas analyzed simultaneously
   - No inter-agent communication
   - Results in 6 independent scores

6. **User Interaction**
   
   **ai-hedge-fund:**
   - User sees final trading signal
   - Limited ability to customize
   - System makes the decision
   
   **Guru Lens:**
   - User sees all 6 persona scores
   - User chooses which persona to follow
   - User can compare perspectives
   - User can set personalized alerts

7. **Scope of Analysis**
   
   **ai-hedge-fund:**
   - Technical analysis (price patterns, indicators)
   - Sentiment analysis (news, social media)
   - Fundamental analysis (financial statements)
   - Valuation analysis (intrinsic value)
   
   **Guru Lens:**
   - Fundamental analysis (financial statements)
   - Valuation analysis (ratios, multiples)
   - Qualitative factors (management, competitive advantages)
   - No technical or sentiment analysis

---

## Part 6: Are You on the Same Track?

### YES, but with Different Objectives

**Similarities in Approach:**
- ✅ Multi-agent LLM-based analysis
- ✅ Multiple investor personas
- ✅ Real financial data integration
- ✅ Structured reasoning and transparency
- ✅ Educational focus
- ✅ Web-based interface

**Different Objectives:**
- ❌ ai-hedge-fund: **Trading system** (BUY/SELL/HOLD signals)
- ❌ Guru Lens: **Research platform** (analysis scores for user decision-making)

### Strategic Positioning

**ai-hedge-fund is like:**
- A robo-advisor that makes decisions for you
- A trading bot that generates signals
- Automated portfolio management

**Guru Lens is like:**
- A research tool that educates you
- A decision support system
- Multiple perspectives for informed decision-making

---

## Part 7: Potential Integration Paths

### Option 1: Adopt ai-hedge-fund's Risk Management

```
Guru Lens could add:
├─ Risk Manager agent (calculate volatility, position sizing)
├─ Portfolio-level constraints
├─ Stop-loss recommendations
└─ Position sizing suggestions per persona
```

### Option 2: Add Technical Analysis

```
Guru Lens could add:
├─ Technical indicators (RSI, MACD, Bollinger Bands)
├─ Price pattern analysis
├─ Sentiment analysis (news, social media)
└─ Technical Agent (like ai-hedge-fund)
```

### Option 3: Implement Consensus Voting

```
Guru Lens could add:
├─ Weighted voting across personas
├─ Consensus strength metric
├─ Recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)
└─ Portfolio Manager to synthesize
```

### Option 4: Add Backtesting

```
Guru Lens could add:
├─ Historical analysis (re-run analyses on past dates)
├─ Strategy backtesting
├─ Performance metrics (Sharpe ratio, max drawdown)
└─ Validation of persona strategies
```

---

## Part 8: Conclusion

**You are on the same track** in terms of using multi-agent LLM systems to analyze stocks through investor personas. However, you're **pursuing different objectives**:

- **ai-hedge-fund:** Automated trading decisions (BUY/SELL/HOLD with position sizing)
- **Guru Lens:** Research and analysis (independent persona scores for user decision-making)

**Your approach (Guru Lens) has advantages:**
1. **User agency** - Users make their own decisions based on multiple perspectives
2. **Transparency** - All scores visible, no "black box" consensus
3. **Flexibility** - Users can follow different personas for different stocks
4. **Research focus** - Deeper analysis without trading constraints

**ai-hedge-fund's approach has advantages:**
1. **Automation** - System makes decisions automatically
2. **Risk management** - Built-in position sizing and risk controls
3. **Validation** - Backtesting shows historical performance
4. **Simplicity** - Single recommendation per stock

**Best path forward:** Keep Guru Lens focused on **research and analysis**, but consider adding:
- Risk metrics (volatility, beta, position sizing suggestions)
- Backtesting capability (validate persona strategies)
- Technical analysis (complement fundamental analysis)
- Consensus metrics (show agreement across personas)

This positions Guru Lens as a **superior research platform** rather than competing with ai-hedge-fund as a **trading system**.
