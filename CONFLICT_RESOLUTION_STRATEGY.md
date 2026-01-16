# AI Hedge Fund: Conflict Resolution Strategy

## How AI Hedge Fund Handles Disagreement Between Personas

When different personas have conflicting views (e.g., Warren Buffett says BUY but Benjamin Graham says SELL), the system uses a **weighted consensus approach** rather than a "winner-takes-all" strategy.

---

## Signal Aggregation Architecture

### 1. **Signal Collection Phase**

Each agent (persona, analysis agent, etc.) generates a signal with:
```python
{
    "signal": "BUY" | "SELL" | "HOLD",
    "confidence": 0.0 - 1.0,
    "reasoning": "explanation of why",
    "score": 0 - 100
}
```

**Example: AAPL Analysis**
```
Warren Buffett Agent:
  - Signal: BUY
  - Confidence: 0.85
  - Score: 85/100
  - Reasoning: "Strong moat, excellent capital allocation"

Benjamin Graham Agent:
  - Signal: HOLD
  - Confidence: 0.70
  - Score: 65/100
  - Reasoning: "Fairly valued, but not a margin of safety"

Cathie Wood Agent:
  - Signal: BUY
  - Confidence: 0.90
  - Score: 90/100
  - Reasoning: "Innovation leader, strong growth trajectory"

Fundamentals Agent:
  - Signal: BUY
  - Confidence: 0.75
  - Score: 75/100

Valuation Agent:
  - Signal: HOLD
  - Confidence: 0.80
  - Score: 60/100
```

---

### 2. **Signal Normalization**

Convert all signals to numeric scores on a 0-100 scale:
```
BUY → 75-100 (bullish)
HOLD → 40-60 (neutral)
SELL → 0-25 (bearish)
```

**With Confidence Weighting:**
```
Adjusted Score = Base Score × Confidence

Warren Buffett: 85 × 0.85 = 72.25
Benjamin Graham: 65 × 0.70 = 45.50
Cathie Wood: 90 × 0.90 = 81.00
Fundamentals: 75 × 0.75 = 56.25
Valuation: 60 × 0.80 = 48.00
```

---

### 3. **Weighted Aggregation**

Apply predefined weights to each agent type:

```python
AGENT_WEIGHTS = {
    # Investor Personas (30% total, equally distributed)
    "warren_buffett": 0.025,      # 2.5%
    "benjamin_graham": 0.025,     # 2.5%
    "cathie_wood": 0.025,         # 2.5%
    "peter_lynch": 0.025,         # 2.5%
    "michael_burry": 0.025,       # 2.5%
    "charlie_munger": 0.025,      # 2.5%
    "bill_ackman": 0.025,         # 2.5%
    "aswath_damodaran": 0.025,    # 2.5%
    "mohnish_pabrai": 0.025,      # 2.5%
    "rakesh_jhunjhunwala": 0.025, # 2.5%
    "stanley_druckenmiller": 0.025, # 2.5%
    
    # Analysis Agents
    "fundamentals_agent": 0.20,   # 20%
    "valuation_agent": 0.25,      # 25%
    "sentiment_agent": 0.15,      # 15%
    "technicals_agent": 0.10,     # 10%
}
```

**Weighted Score Calculation:**
```
Final Score = Σ(Agent Score × Agent Weight)

= (72.25 × 0.025) + (45.50 × 0.025) + (81.00 × 0.025) + (56.25 × 0.20) + (48.00 × 0.25)
= 1.81 + 1.14 + 2.03 + 11.25 + 12.00
= 28.23 (on 0-100 scale)

Normalized: 28.23 / 100 = 0.28 (on 0-1 scale)
```

---

### 4. **Consensus Detection**

Analyze the distribution of signals to detect:

**Agreement Scenarios:**
```python
# Strong Consensus (all agree)
if all signals in same direction AND std_dev < 0.15:
    confidence = "VERY HIGH"
    action = "Execute with full position size"

# Weak Consensus (majority agree)
elif majority signals in same direction AND std_dev < 0.25:
    confidence = "MEDIUM"
    action = "Execute with reduced position size"

# Disagreement (split signals)
elif std_dev > 0.25:
    confidence = "LOW"
    action = "Wait for more clarity OR execute with minimal position"
```

**Example: AAPL Scenario**
```
Signals: [BUY, HOLD, BUY, BUY, HOLD]
Distribution: 60% BUY, 40% HOLD, 0% SELL
Standard Deviation: 0.18

Result: WEAK CONSENSUS (BUY with caution)
```

---

### 5. **Risk Manager Adjustment**

The Risk Manager applies constraints based on:

```python
def apply_risk_constraints(final_score, portfolio_state):
    
    # Check portfolio concentration
    if portfolio_allocation[ticker] > max_position_size:
        final_score *= 0.7  # Reduce by 30%
    
    # Check sector exposure
    if sector_exposure > max_sector_exposure:
        final_score *= 0.8  # Reduce by 20%
    
    # Check portfolio leverage
    if portfolio_leverage > max_leverage:
        final_score *= 0.5  # Reduce by 50%
    
    # Check correlation with existing positions
    if correlation_with_portfolio > 0.8:
        final_score *= 0.6  # Reduce by 40%
    
    return final_score
```

---

### 6. **Final Trading Decision**

```python
def generate_trading_decision(final_score, risk_adjusted_score):
    
    if risk_adjusted_score > 0.70:
        action = "BUY"
        position_size = calculate_kelly_fraction(risk_adjusted_score)
        stop_loss = current_price * 0.95  # 5% stop loss
        take_profit = current_price * 1.20  # 20% profit target
    
    elif risk_adjusted_score < 0.30:
        action = "SELL"
        position_size = calculate_kelly_fraction(1 - risk_adjusted_score)
        stop_loss = current_price * 1.05  # 5% stop loss (for short)
        take_profit = current_price * 0.80  # 20% profit target
    
    else:
        action = "HOLD"
        position_size = 0
        stop_loss = None
        take_profit = None
    
    confidence = abs(risk_adjusted_score - 0.5) * 2  # 0-1 scale
    
    return {
        "action": action,
        "position_size": position_size,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "confidence": confidence,
        "reasoning": build_reasoning_from_signals()
    }
```

---

## Conflict Resolution Examples

### Scenario 1: Strong Disagreement (TSLA)

```
Warren Buffett: SELL (score: 20, confidence: 0.9) → 18
Benjamin Graham: SELL (score: 15, confidence: 0.85) → 12.75
Cathie Wood: BUY (score: 95, confidence: 0.95) → 90.25
Peter Lynch: BUY (score: 80, confidence: 0.8) → 64
Michael Burry: SELL (score: 10, confidence: 0.9) → 9

Fundamentals: HOLD (score: 50, confidence: 0.7) → 35
Valuation: SELL (score: 25, confidence: 0.75) → 18.75
Sentiment: BUY (score: 75, confidence: 0.8) → 60
Technicals: BUY (score: 70, confidence: 0.85) → 59.5

Weighted Average: 
  Personas (30%): (18+12.75+90.25+64+9) / 5 × 0.30 = 38.8 × 0.30 = 11.64
  Analysis (70%): (35+18.75+60+59.5) / 4 × 0.70 = 43.31 × 0.70 = 30.32
  
Final Score: 11.64 + 30.32 = 41.96 (HOLD territory)

Decision: HOLD - Wait for consensus
Reasoning: "Value investors (Buffett, Graham, Burry) see overvaluation. 
           Growth investors (Wood, Lynch) see disruption potential. 
           Mixed signals warrant caution."
```

### Scenario 2: Strong Agreement (JNJ)

```
Warren Buffett: BUY (score: 90, confidence: 0.95) → 85.5
Benjamin Graham: BUY (score: 85, confidence: 0.9) → 76.5
Cathie Wood: HOLD (score: 55, confidence: 0.7) → 38.5
Peter Lynch: BUY (score: 80, confidence: 0.85) → 68

Fundamentals: BUY (score: 85, confidence: 0.9) → 76.5
Valuation: BUY (score: 80, confidence: 0.85) → 68
Sentiment: BUY (score: 75, confidence: 0.8) → 60
Technicals: BUY (score: 78, confidence: 0.88) → 68.64

Weighted Average: 77.1 (strong BUY signal)

Decision: BUY with full position size
Confidence: 95%
Reasoning: "Consensus across value, growth, and technical analysis. 
           Strong fundamentals with attractive valuation."
```

---

## Key Design Principles

### 1. **Consensus Over Majority**
- Don't just count votes (5 BUY vs 3 SELL)
- Weight by confidence and agent expertise
- Penalize extreme disagreement

### 2. **Confidence Weighting**
- High-confidence signals weighted more heavily
- Low-confidence signals diluted
- Prevents weak signals from swaying decision

### 3. **Agent Specialization Weights**
- Valuation agent gets 25% (most important)
- Fundamentals agent gets 20% (core analysis)
- Sentiment gets 15% (market psychology)
- Technicals gets 10% (entry/exit timing)
- Personas get 30% combined (philosophy diversity)

### 4. **Risk Constraints Override**
- Even if final score is high, risk manager can veto
- Portfolio concentration limits enforced
- Sector exposure limits enforced
- Leverage limits enforced

### 5. **Transparency in Disagreement**
- Show which agents agree/disagree
- Explain why they disagree
- Show confidence levels
- Let user understand the uncertainty

---

## Comparison: AI Hedge Fund vs Guru Lens

| Aspect | AI Hedge Fund | Guru Lens |
|--------|---------------|-----------|
| **Conflict Handling** | Weighted consensus | Show all scores individually |
| **Final Decision** | Single BUY/SELL/HOLD | User decides |
| **Confidence Weighting** | Yes, built-in | No, all personas equal weight |
| **Risk Constraints** | Hard limits enforced | Soft recommendations |
| **Position Sizing** | Calculated by Kelly Criterion | User decides |
| **Transparency** | Shows aggregation logic | Shows individual reasoning |
| **Backtestable** | Yes, can optimize weights | No, subjective |

---

## Recommendation for Guru Lens

To adopt AI Hedge Fund's approach, implement:

1. **Confidence Scoring** - Have LLM output confidence (0-1) with each persona score
2. **Weighted Aggregation** - Calculate consensus score from all 6 personas
3. **Disagreement Detection** - Identify when personas strongly disagree
4. **Portfolio Manager** - Add agent that aggregates all signals
5. **Risk Manager** - Add constraints on position sizing
6. **Transparency View** - Show aggregation logic and disagreement analysis

This would transform Guru Lens from a "show all perspectives" tool to an "integrated recommendation" tool.
