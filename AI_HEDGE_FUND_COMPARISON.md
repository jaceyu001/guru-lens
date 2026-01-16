# AI Hedge Fund vs Guru Lens: Architecture Comparison

## Overview

The **ai-hedge-fund** project (virattt/ai-hedge-fund) is a multi-agent system with 18 agents working together to make trading decisions. Your **guru-lens** system uses 6 persona-based agents. Here's how they differ fundamentally.

---

## AI Hedge Fund Architecture (18 Agents)

### Agent Categories

#### 1. **Investor Persona Agents (12 agents)**
These agents each represent a famous investor's philosophy:
- Warren Buffett Agent
- Benjamin Graham Agent
- Peter Lynch Agent
- Phil Fisher Agent
- Charlie Munger Agent
- Cathie Wood Agent
- Bill Ackman Agent
- Michael Burry Agent
- Mohnish Pabrai Agent
- Rakesh Jhunjhunwala Agent
- Stanley Druckenmiller Agent
- Aswath Damodaran Agent

#### 2. **Analysis Agents (4 agents)**
These agents analyze specific aspects of stocks:
- **Fundamentals Agent** - Analyzes fundamental financial data
- **Valuation Agent** - Calculates intrinsic value and generates signals
- **Sentiment Agent** - Analyzes market sentiment and news
- **Technicals Agent** - Analyzes technical indicators

#### 3. **Decision Agents (2 agents)**
- **Risk Manager** - Calculates risk metrics and sets position limits
- **Portfolio Manager** - Makes final trading decisions and generates orders

---

## Exact Workflow for Key Agents

### 1. FUNDAMENTALS AGENT

**Purpose:** Analyze fundamental financial data and generate trading signals

**Workflow:**
```
1. Fetch Financial Metrics
   ├── Get ticker data
   ├── Extract end_date and period
   └── Call get_financial_metrics(ticker, end_date, period)

2. Analyze Fundamentals
   ├── Revenue growth
   ├── Profit margins
   ├── ROE, ROIC
   ├── Debt levels
   ├── Cash flow
   └── Other key ratios

3. Generate Trading Signal
   ├── Evaluate metrics against thresholds
   ├── Create reasoning for signal
   ├── Return: {
   │     "signal": "BUY" | "SELL" | "HOLD",
   │     "reasoning": "explanation",
   │     "score": 0-100
   │   }
   └── Update progress status

4. Return Results
   └── Signal + reasoning sent to Portfolio Manager
```

**Key Code Pattern:**
```python
def fundamentals_analyst_agent(state: AgentState, agent_id: str = "fundamentals_analyst_agent"):
    """Analyzes fundamental data and generates trading signals"""
    
    data = state["data"]
    tickers = data["tickers"]
    api_key = get_api_key_from_state(state, "FINANCIAL_DATASETS_API_KEY")
    
    fundamental_analysis = {}
    
    for ticker in tickers:
        progress.update_status(agent_id, ticker, "Fetching financial metrics")
        
        financial_metrics = get_financial_metrics(
            ticker=ticker,
            end_date=data["end_date"],
            period="ttm",  # Trailing Twelve Months
            limit=10,
            api_key=api_key,
        )
        
        if not financial_metrics:
            progress.update_status(agent_id, ticker, "Failed: No financial metrics found")
            continue
        
        # Analyze metrics and generate signal
        signal = analyze_fundamentals(financial_metrics)
        fundamental_analysis[ticker] = signal
    
    return {"fundamental_analysis": fundamental_analysis}
```

---

### 2. VALUATION AGENT

**Purpose:** Calculate intrinsic value of stocks and generate valuation-based signals

**Workflow:**
```
1. Fetch Stock Data
   ├── Current price
   ├── Historical prices
   ├── Financial statements
   └── Growth projections

2. Calculate Intrinsic Value
   ├── DCF (Discounted Cash Flow) analysis
   ├── Comparable company analysis
   ├── Asset-based valuation
   └── Average intrinsic value

3. Compare to Market Price
   ├── Calculate upside/downside
   ├── Determine margin of safety
   └── Generate signal:
       ├── If price < intrinsic value × 0.8 → BUY
       ├── If price > intrinsic value × 1.2 → SELL
       └── Otherwise → HOLD

4. Return Results
   ├── Intrinsic value
   ├── Margin of safety
   ├── Signal
   └── Confidence score
```

**Key Metrics Used:**
- Free Cash Flow (FCF)
- Earnings Per Share (EPS)
- Book Value Per Share
- Price-to-Book (P/B) ratio
- Price-to-Earnings (P/E) ratio
- Debt-to-Equity ratio
- Return on Equity (ROE)

---

### 3. RISK MANAGER

**Purpose:** Calculate risk metrics and set position limits

**Workflow:**
```
1. Analyze Portfolio Risk
   ├── Calculate Value at Risk (VaR)
   ├── Calculate Beta for each position
   ├── Calculate correlation between positions
   ├── Calculate portfolio volatility
   └── Calculate Sharpe ratio

2. Evaluate Individual Stock Risk
   ├── Historical volatility
   ├── Debt levels (financial risk)
   ├── Business model risk
   ├── Market risk
   └── Liquidity risk

3. Set Position Limits
   ├── Maximum position size per stock
   ├── Maximum sector exposure
   ├── Maximum portfolio leverage
   ├── Stop-loss levels
   └── Take-profit levels

4. Generate Risk Assessment
   ├── Overall portfolio risk score
   ├── Individual position risk scores
   ├── Recommended position sizing
   ├── Risk warnings
   └── Return: {
   │     "position_limits": {...},
   │     "risk_score": 0-100,
   │     "warnings": [...],
   │     "recommendations": [...]
   │   }
```

**Risk Metrics Calculated:**
- Value at Risk (VaR) - 95% confidence
- Conditional Value at Risk (CVaR)
- Beta - correlation to market
- Volatility - standard deviation of returns
- Sharpe Ratio - risk-adjusted returns
- Maximum Drawdown - worst-case loss
- Sortino Ratio - downside risk only

---

### 4. PORTFOLIO MANAGER

**Purpose:** Make final trading decisions and generate orders

**Workflow:**
```
1. Collect All Agent Signals
   ├── Fundamentals Agent signal
   ├── Valuation Agent signal
   ├── Sentiment Agent signal
   ├── Technicals Agent signal
   ├── 12 Investor Persona signals
   └── Risk Manager constraints

2. Aggregate Signals
   ├── Calculate weighted average signal
   ├── Weight by agent confidence
   ├── Weight by agent historical performance
   ├── Identify consensus vs. disagreement
   └── Signal strength score

3. Apply Risk Constraints
   ├── Check position size limits
   ├── Check sector exposure limits
   ├── Check portfolio leverage limits
   ├── Adjust signal strength based on risk
   └── Generate risk-adjusted signal

4. Make Trading Decision
   ├── If signal > threshold AND risk acceptable → BUY
   ├── If signal < -threshold AND risk acceptable → SELL
   ├── Otherwise → HOLD
   └── Generate order with:
       ├── Ticker
       ├── Action (BUY/SELL/HOLD)
       ├── Quantity (based on position sizing)
       ├── Stop-loss price
       ├── Take-profit price
       └── Confidence score

5. Return Final Orders
   └── Array of trading orders ready for execution
```

**Decision Logic:**
```
Signal Aggregation:
  - Fundamentals: 20% weight
  - Valuation: 25% weight
  - Sentiment: 15% weight
  - Technicals: 10% weight
  - Investor Personas: 30% weight (equally distributed)

Final Signal = Σ(Agent Signal × Weight)

Trading Decision:
  - If Final Signal > 0.6 → BUY
  - If Final Signal < 0.4 → SELL
  - If 0.4 ≤ Final Signal ≤ 0.6 → HOLD
```

---

## Comparison: AI Hedge Fund vs Guru Lens

| Aspect | AI Hedge Fund | Guru Lens |
|--------|---------------|-----------|
| **Total Agents** | 18 agents | 6 personas |
| **Investor Personas** | 12 agents | 6 personas |
| **Analysis Agents** | 4 agents (Fundamentals, Valuation, Sentiment, Technicals) | 0 (built into personas) |
| **Risk Management** | Dedicated Risk Manager agent | No dedicated risk agent |
| **Portfolio Management** | Dedicated Portfolio Manager agent | No dedicated portfolio agent |
| **Signal Aggregation** | Weighted average across all agents | LLM-based per persona |
| **Final Decision** | Portfolio Manager makes orders | User reads persona scores |
| **Trading Execution** | Generates actual trading orders | Provides analysis only |
| **Risk Constraints** | Hard limits enforced | Soft recommendations in analysis |
| **Data Sources** | Financial Datasets API | yfinance only |
| **Sentiment Analysis** | Dedicated Sentiment Agent | Included in persona analysis |
| **Technical Analysis** | Dedicated Technicals Agent | Not included |
| **Backtesting** | Built-in backtester | No backtester |

---

## Key Differences in Workflow

### AI Hedge Fund Flow:
```
Stock Input
    ↓
12 Investor Personas → Generate signals
4 Analysis Agents → Generate signals
    ↓
Aggregate all 16 signals
    ↓
Risk Manager → Evaluate constraints
    ↓
Portfolio Manager → Make final decision
    ↓
Generate Trading Orders
```

### Guru Lens Flow:
```
Stock Input
    ↓
6 Personas (LLM-based analysis)
    ↓
Generate persona ratings (0-100)
    ↓
Display to user
    ↓
User makes decision
```

---

## What Guru Lens Could Adopt from AI Hedge Fund

### 1. **Dedicated Analysis Agents**
Instead of embedding analysis in persona prompts, create separate agents:
- **Fundamentals Agent** - Pure metrics analysis
- **Valuation Agent** - DCF and intrinsic value
- **Sentiment Agent** - News and market sentiment
- **Technicals Agent** - Chart patterns and indicators

### 2. **Dedicated Risk Manager**
Create a Risk Manager agent that:
- Calculates portfolio-level risk metrics
- Sets position sizing recommendations
- Identifies concentration risks
- Suggests stop-loss and take-profit levels

### 3. **Dedicated Portfolio Manager**
Create a Portfolio Manager that:
- Aggregates all persona signals
- Applies risk constraints
- Makes final BUY/SELL/HOLD recommendation
- Provides confidence score

### 4. **Signal Aggregation**
Instead of just showing individual persona scores:
- Calculate weighted average signal
- Show consensus vs. disagreement
- Provide overall recommendation

### 5. **Backtesting**
- Test persona strategies against historical data
- Optimize persona weights based on performance
- Show historical accuracy of each persona

### 6. **Sentiment Analysis**
- Add dedicated sentiment agent
- Analyze news, social media, earnings calls
- Incorporate into final recommendation

### 7. **Technical Analysis**
- Add dedicated technicals agent
- Analyze chart patterns, moving averages, RSI, MACD
- Identify entry/exit points

---

## Implementation Recommendations

### Phase 1: Add Analysis Agents (Quick Win)
- Create Fundamentals Agent (extract from persona prompts)
- Create Valuation Agent (DCF analysis)
- Show separate signals alongside persona scores

### Phase 2: Add Risk Management
- Create Risk Manager agent
- Calculate portfolio-level risk metrics
- Show position sizing recommendations

### Phase 3: Add Portfolio Manager
- Create Portfolio Manager agent
- Aggregate all signals with weights
- Provide overall recommendation

### Phase 4: Add Sentiment & Technicals
- Create Sentiment Agent
- Create Technicals Agent
- Include in final aggregation

### Phase 5: Backtesting & Optimization
- Build backtester
- Optimize persona weights based on historical performance
- Show accuracy metrics for each persona

---

## Conclusion

The **ai-hedge-fund** project uses a **multi-agent consensus** approach with dedicated analysis and decision-making agents. Your **guru-lens** system uses a **persona-based LLM** approach that's simpler but less modular.

**Key Advantages of AI Hedge Fund Approach:**
- Separation of concerns (analysis vs. decision-making)
- Explicit risk management
- Quantitative signal aggregation
- Backtestable and optimizable
- Scalable to new agents

**Key Advantages of Guru Lens Approach:**
- Simpler to understand (persona-based)
- More flexible (LLM can adapt reasoning)
- Easier to add new personas
- More narrative/explanatory (why, not just what)

**Recommendation:** Consider adopting the **agent separation** pattern while keeping your **persona-based approach** for the investor analysis layer. This would give you the best of both worlds.
