# Who Decides the Criteria Weights for Each Persona?

## Current Implementation

The criteria weights for each persona are **hardcoded in `/server/services/personaPrompts.ts`** by the development team. These weights are NOT dynamically set or user-configurable.

---

## Criteria Weights by Persona

### 1. Warren Buffett
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Economic Moat | 25% | Core to Buffett's philosophy - competitive advantages |
| Management Quality | 20% | Critical for capital allocation decisions |
| Financial Strength | 20% | Balance sheet health and sustainability |
| Valuation | 20% | Margin of safety principle |
| Business Understandability | 15% | "Circle of competence" concept |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on Buffett's published investment philosophy from Berkshire Hathaway letters and interviews.

---

### 2. Peter Lynch
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Growth Rate | 30% | Earnings growth is the key driver |
| PEG Ratio | 25% | GARP (Growth at Reasonable Price) metric |
| Business Understandability | 20% | "Invest in what you know" philosophy |
| Earnings Quality | 15% | Sustainable earnings matter |
| Valuation | 10% | Less emphasis than growth |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on Lynch's Fidelity Magellan Fund methodology and book "One Up On Wall Street."

---

### 3. Benjamin Graham
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Valuation Metrics | 30% | P/E < 15, P/B < 1.5 screening |
| Balance Sheet Strength | 25% | Current ratio > 2, low debt |
| Margin of Safety | 20% | Buy at discount to intrinsic value |
| Earnings Consistency | 15% | 10+ years of positive earnings |
| Dividend History | 10% | Income generation |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on Graham's "The Intelligent Investor" and his classic quantitative criteria.

---

### 4. Cathie Wood
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Disruptive Potential | 35% | Core theme of ARK Invest |
| Market Size | 25% | Addressable market opportunity |
| Growth Trajectory | 20% | Exponential growth potential |
| Technology Moat | 15% | Competitive advantages in tech |
| Management Vision | 5% | Bold leadership (lower weight) |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on ARK Invest's public research and Cathie Wood's investment theses.

---

### 5. Ray Dalio
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Balance Sheet Health | 30% | Debt levels critical for risk management |
| Macro Environment Fit | 25% | Economic cycle considerations |
| Risk Assessment | 20% | Scenario analysis and downside risk |
| Cash Flow Quality | 15% | Sustainability of returns |
| Scenario Resilience | 10% | Performance across economic scenarios |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on Dalio's "All Weather" portfolio and "Principles" framework.

---

### 6. Philip Fisher
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Management Quality | 30% | "15 Points" emphasize management |
| Innovation & R&D | 25% | Long-term competitive advantage |
| Competitive Advantages | 20% | Scuttlebutt research findings |
| Profit Margins | 15% | Quality of earnings |
| Long-term Growth | 10% | 5-10 year holding periods |
| **Total** | **100%** | |

**Decision Maker:** Development team, based on Fisher's "Common Stocks and Uncommon Profits."

---

## How Weights Are Used

The weights are applied in the **aiAnalysisEngine.ts** file when the LLM analyzes a stock:

1. **LLM receives the criteria weights** in the persona prompt
2. **LLM evaluates each criterion** based on the stock data
3. **LLM assigns a score to each criterion** (typically 0-100)
4. **Weighted average is calculated**: `Score = Σ(Criterion Score × Weight)`
5. **Final persona rating** is displayed to the user (e.g., "Warren Buffett: 92/100")

---

## Current Limitations

### 1. **Weights Are Hardcoded**
- Cannot be adjusted per user preference
- Cannot be adjusted per market conditions
- Cannot be adjusted per stock category

### 2. **Weights Are Not Validated**
- No backtesting against historical performance
- No optimization against real investment results
- Weights are based on investment philosophy, not empirical data

### 3. **Weights Are Not Transparent to Users**
- Users don't see the weights in the UI
- Users don't understand how the final score is calculated
- Users cannot adjust weights for their own analysis

### 4. **Weights Don't Adapt**
- Same weights for all stocks (tech, healthcare, utilities, etc.)
- Same weights for all market conditions (bull, bear, sideways)
- Same weights for all company sizes (mega-cap, small-cap)

---

## Proposed Improvements

### Short-term (Easy to Implement)
1. **Display weights in the UI** - Show users which criteria matter most for each persona
2. **Show criterion scores** - Display how each criterion was scored before weighting
3. **Add weight explanations** - Explain why each weight was chosen

### Medium-term (Requires Development)
1. **Allow user-customizable weights** - Let users adjust weights for their own analysis
2. **Sector-specific weights** - Different weights for tech vs. healthcare vs. utilities
3. **Market-condition weights** - Adjust weights based on bull/bear market conditions

### Long-term (Requires Research)
1. **Empirical weight optimization** - Backtest weights against historical investment results
2. **Machine learning weights** - Use ML to optimize weights based on real performance
3. **Dynamic weights** - Automatically adjust weights based on market regime

---

## Decision Authority

**Current:** Development team (hardcoded in code)

**Recommended:** 
- **Short-term:** Keep development team authority, but add transparency
- **Medium-term:** Add admin panel for weight management
- **Long-term:** Implement ML-based weight optimization

---

## Historical Context

The weights were initially set by the development team based on:
1. **Published investment philosophies** - Books, interviews, letters
2. **Historical track records** - Each investor's actual returns
3. **Investment principles** - Core beliefs and methodologies
4. **Relative importance** - How much each investor emphasizes each factor

For example:
- **Warren Buffett** emphasizes moat (25%) because he famously said "the best business is one that earns exceptional returns on capital"
- **Benjamin Graham** emphasizes balance sheet (25%) because he believed financial strength provides margin of safety
- **Cathie Wood** emphasizes disruption (35%) because ARK Invest is built around disruptive innovation themes
- **Ray Dalio** emphasizes balance sheet (30%) because he believes debt is the primary risk factor

---

## Conclusion

The criteria weights are **currently decided by the development team** based on each investor's published philosophy and track record. They are **hardcoded and not user-configurable**. This approach ensures consistency but lacks flexibility and transparency.

To improve the system, consider:
1. Making weights visible to users
2. Allowing customization for advanced users
3. Validating weights against historical performance
4. Adapting weights based on market conditions and sectors
