# Guru Lens - Stock Analysis System Architecture

## Overview

Guru Lens is an AI-powered stock analysis platform that evaluates US stocks through the investment philosophies of 6 legendary investors. The system uses the Manus LLM to generate persona-specific analysis with structured criteria evaluation, scoring, and investment verdicts.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  (React Frontend - Homepage, Ticker Page, Opportunities Page)   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    tRPC API LAYER                                │
│  (Type-safe RPC procedures for data fetching & mutations)       │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │ Tickers│  │Analyses │  │Watchlist │
    │Router  │  │Router   │  │Router    │
    └────────┘  └─────────┘  └──────────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND SERVICES LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Financial Data Service                                   │   │
│  │ - Fetches stock prices, company profiles, financials    │   │
│  │ - Currently: Mock data (10 major stocks)                │   │
│  │ - Future: Financial Datasets API integration            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Analysis Engine (LLM-Powered)                         │   │
│  │ - Invokes Manus LLM with persona prompts                │   │
│  │ - Generates structured JSON analysis output             │   │
│  │ - Returns: score, verdict, criteria, risks, insights    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Persona Prompt Templates                                 │   │
│  │ - Warren Buffett (Value Investing)                       │   │
│  │ - Peter Lynch (Growth at Reasonable Price)              │   │
│  │ - Benjamin Graham (Quantitative Value)                  │   │
│  │ - Cathie Wood (Disruptive Innovation)                   │   │
│  │ - Ray Dalio (Macro & Risk Parity)                       │   │
│  │ - Philip Fisher (Growth Investing)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (MySQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  - Tickers (symbol, company info, market cap)                   │
│  - Personas (investor profiles, criteria weights)               │
│  - Analyses (scores, verdicts, criteria, risks)                 │
│  - Watchlists (user-saved tickers & opportunities)              │
│  - Alerts (price thresholds, score changes)                     │
│  - Jobs (async analysis tracking)                               │
│  - Cache (financial data snapshots)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Stock Analysis Process

### Step 1: User Searches for a Stock

**User Action:** Types "AAPL" in search box and clicks "Analyze"

**Frontend:**
```typescript
// Home.tsx
const handleSearch = (e) => {
  setLocation(`/ticker/${searchQuery.toUpperCase()}`);
};
```

**Navigation:** Routes to `/ticker/AAPL`

---

### Step 2: Fetch Stock Data

**Ticker Page Component Loads:**
```typescript
// Ticker.tsx
const { data: ticker } = trpc.tickers.getBySymbol.useQuery({ symbol: "AAPL" });
const { data: financialData } = trpc.tickers.getFinancialData.useQuery({ symbol: "AAPL" });
```

**Backend tRPC Procedure:**
```typescript
// routers.ts - tickers.getBySymbol
getBySymbol: publicProcedure
  .input(z.object({ symbol: z.string() }))
  .query(async ({ input }) => {
    // 1. Check database for cached ticker
    let ticker = await db.getTickerBySymbol(input.symbol);
    
    // 2. If not found, fetch from Financial Data Service
    if (!ticker) {
      const snapshot = await financialDataService.getTickerSnapshot(input.symbol);
      // 3. Upsert into database for future queries
      await db.upsertTicker({...snapshot});
      ticker = await db.getTickerBySymbol(input.symbol);
    }
    
    return ticker;
  })
```

**Financial Data Service:**
```typescript
// financialData.ts
export async function getFinancialData(symbol: string): Promise<FinancialData> {
  // Currently returns mock data from MOCK_STOCKS
  // In production: calls Financial Datasets API
  
  return {
    price: {
      current: 175.26,
      change: -3.24,
      changePercent: -1.82,
      timestamp: new Date(),
      // ... OHLCV data
    },
    profile: {
      companyName: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      description: "...",
      // ... company info
    },
    financials: [
      {
        period: "Q3 2024",
        revenue: 93_000_000_000,
        netIncome: 14_300_000_000,
        eps: 0.92,
        // ... financial statement data
      }
    ],
    ratios: {
      pe: 31.04,
      pb: 2.35,
      roe: 23.88,
      // ... key ratios
    }
  };
}
```

---

### Step 3: Run Analysis for Each Persona

**User clicks "Rerun Analysis" or page auto-loads analysis:**

```typescript
// Ticker.tsx
const { mutate: runAnalysis } = trpc.analyses.runAnalysis.useMutation();

// Trigger analysis for all personas
runAnalysis({ 
  symbol: "AAPL",
  mode: "quick" // or "deep" for full analysis
});
```

**Backend Analysis Procedure:**
```typescript
// routers.ts - analyses.runAnalysis
runAnalysis: publicProcedure
  .input(z.object({
    symbol: z.string(),
    personaIds: z.array(z.number()).optional(),
    mode: z.enum(["quick", "deep"]).default("quick"),
  }))
  .mutation(async ({ input }) => {
    // 1. Get or create ticker
    const ticker = await db.getTickerBySymbol(input.symbol);
    
    // 2. Fetch financial data
    const financialData = await financialDataService.getFinancialData(input.symbol);
    
    // 3. Get all personas (or specific ones)
    const personas = await db.getAllPersonas();
    
    // 4. For each persona, run analysis
    const analyses = [];
    for (const persona of personas) {
      // Prepare analysis input with all financial data
      const analysisInput = {
        symbol: "AAPL",
        personaId: persona.personaId,
        personaName: persona.name,
        price: { current: 175.26, ... },
        profile: { companyName: "Apple Inc.", ... },
        financials: [ { revenue: 93B, ... } ],
        ratios: { pe: 31.04, roe: 23.88, ... }
      };
      
      // Call AI Analysis Engine
      const result = await aiAnalysisEngine.analyzeStock(analysisInput);
      
      // Save to database
      const analysisId = await db.createAnalysis({
        tickerId: ticker.id,
        personaId: persona.id,
        score: result.score,
        verdict: result.verdict,
        criteria: result.criteria,
        // ... save all analysis data
      });
      
      analyses.push(result);
    }
    
    return analyses;
  })
```

---

### Step 4: AI Analysis Engine Generates Persona-Specific Analysis

**AI Analysis Engine Flow:**

```typescript
// aiAnalysisEngine.ts - analyzeStock()
export async function analyzeStock(input: AnalysisInput): Promise<AnalysisOutput> {
  // 1. Get persona prompt template
  const personaPrompt = getPersonaPrompt(input.personaId);
  // Example: Warren Buffett's system prompt:
  // "You are Warren Buffett, the legendary value investor...
  //  Your investment philosophy focuses on:
  //  - Buying wonderful businesses at fair prices
  //  - Looking for durable competitive advantages (economic moats)
  //  - Management quality and capital allocation
  //  - ..."
  
  // 2. Fill in analysis template with actual financial data
  const userPrompt = personaPrompt.analysisTemplate
    .replace('{symbol}', 'AAPL')
    .replace('{companyName}', 'Apple Inc.')
    .replace('{peRatio}', '31.04')
    .replace('{roe}', '23.88')
    // ... fill in all metrics
    
  // Template becomes:
  // "Analyze AAPL (Apple Inc.) as Warren Buffett would.
  //  Company Information:
  //  - Sector: Technology
  //  - P/E Ratio: 31.04
  //  - ROE: 23.88%
  //  ...
  //  Evaluate this stock based on Warren Buffett's value investing principles:
  //  1. Does it have a durable competitive advantage (moat)?
  //  2. Is management competent and shareholder-friendly?
  //  3. Are earnings predictable and growing?
  //  ..."
  
  // 3. Call Manus LLM with structured output schema
  const response = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: personaPrompt.systemPrompt  // Warren Buffett persona
      },
      { 
        role: "user", 
        content: userPrompt  // Filled-in analysis template
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "stock_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: { type: "number" },           // 0-100
            verdict: { type: "string" },         // "strong_fit", "fit", etc.
            confidence: { type: "number" },      // 0-1
            summaryBullets: { type: "array" },   // Key points
            criteria: { type: "array" },         // Detailed evaluation
            keyRisks: { type: "array" },         // Risk factors
            whatWouldChangeMind: { type: "array" } // Conditions for change
          }
        }
      }
    }
  });
  
  // 4. Parse LLM response
  const analysis = JSON.parse(response.choices[0].message.content);
  
  // 5. Return structured analysis
  return {
    score: 65,                    // Warren Buffett gives AAPL 65/100
    verdict: "moderate_fit",      // Fits his criteria but not perfect
    confidence: 0.90,             // High confidence in analysis
    summaryBullets: [
      "Apple possesses an undeniable, durable competitive advantage...",
      "Management has a strong track record of innovation...",
      // ...
    ],
    criteria: [
      {
        name: "Economic Moat",
        weight: 25,
        status: "pass",
        metricsUsed: ["Brand strength", "Ecosystem lock-in"],
        explanation: "Apple's ecosystem creates strong switching costs..."
      },
      {
        name: "Valuation",
        weight: 20,
        status: "partial",
        metricsUsed: ["P/E Ratio: 31.04"],
        explanation: "P/E is elevated but justified by growth..."
      },
      // ... more criteria
    ],
    keyRisks: [
      "Regulatory pressure on App Store",
      "iPhone market saturation",
      // ...
    ],
    whatWouldChangeMind: [
      "Significant margin compression",
      "Loss of ecosystem dominance",
      // ...
    ],
    dataUsed: {
      priceAsOf: new Date(),
      financialsAsOf: "Q3 2024",
      sources: ["Financial Data API", "AI Analysis Engine"]
    }
  };
}
```

---

## Persona Analysis Criteria Breakdown

### Warren Buffett (Value Investing)

**System Prompt:** Focuses on buying wonderful businesses at fair prices with durable competitive advantages

**Key Criteria (with weights):**
- **Economic Moat (25%)** - Does the company have sustainable competitive advantages?
  - Metrics: Brand strength, pricing power, switching costs, network effects
  - Status: PASS/FAIL/PARTIAL based on industry analysis
  
- **Management Quality (20%)** - Is management competent and shareholder-friendly?
  - Metrics: Capital allocation, insider ownership, track record
  - Status: Evaluated from financial decisions and statements
  
- **Financial Strength (20%)** - Is the balance sheet healthy?
  - Metrics: Debt/Equity, Current Ratio, Interest Coverage
  - Status: PASS if ratios meet thresholds
  
- **Valuation (20%)** - Is there a margin of safety?
  - Metrics: P/E Ratio, P/B Ratio, FCF yield
  - Status: PASS if trading below intrinsic value estimate
  
- **Business Understandability (15%)** - Can you understand and explain the business?
  - Metrics: Business model clarity, competitive positioning
  - Status: Subjective evaluation

**Scoring Logic:**
```
Final Score = Σ(Criterion Weight × Criterion Score)

Example for AAPL:
- Economic Moat: 25% × 90 = 22.5
- Management Quality: 20% × 85 = 17.0
- Financial Strength: 20% × 70 = 14.0
- Valuation: 20% × 50 = 10.0  (P/E too high)
- Understandability: 15% × 95 = 14.25
─────────────────────────────
Total Score = 77.75 ≈ 78/100

Verdict Logic:
- 80-100: "Strong Fit"
- 60-79: "Fit" (Moderate Fit)
- 40-59: "Borderline" (Weak Fit)
- 0-39: "Not a Fit" (Poor Fit)

Result: AAPL gets 65/100 = "Fit" (moderate fit)
```

---

### Peter Lynch (Growth at Reasonable Price)

**System Prompt:** Focuses on finding growth at reasonable prices (GARP) and "tenbaggers"

**Key Criteria:**
- **Growth Rate (30%)** - Is earnings growing 15-25% annually?
  - Metrics: Revenue growth, EPS growth, earnings acceleration
  
- **PEG Ratio (25%)** - Is PEG < 1.0? (Price/Earnings to Growth)
  - Metrics: P/E Ratio ÷ Growth Rate
  - Formula: PEG = 31.04 / 15% = 2.07 (Too high for Lynch)
  
- **Business Understandability (20%)** - Can you observe and understand the products?
  - Metrics: Product visibility, customer accessibility
  
- **Earnings Quality (15%)** - Are earnings sustainable and growing?
  - Metrics: Operating leverage, margin trends
  
- **Valuation (10%)** - Is price reasonable relative to growth?
  - Metrics: P/E vs. growth rate

**Verdict for AAPL:** 45/100 = "Not a Fit"
- Reason: PEG ratio of 2.07 is too high; Lynch wants < 1.0

---

### Benjamin Graham (Quantitative Value)

**System Prompt:** Focuses on buying stocks trading below intrinsic value with strict quantitative screens

**Key Criteria:**
- **Valuation Metrics (30%)** - Do P/E < 15 and P/B < 1.5?
  - AAPL: P/E = 31.04 ❌ (Graham wants < 15)
  - AAPL: P/B = 2.35 ❌ (Graham wants < 1.5)
  
- **Balance Sheet Strength (25%)** - Is the company financially stable?
  - Metrics: Current Ratio > 2, Debt/Equity < 0.5
  
- **Margin of Safety (20%)** - Is there a sufficient discount to intrinsic value?
  - Metrics: Discount percentage, safety buffer
  
- **Earnings Consistency (15%)** - Has the company been profitable for 10+ years?
  - Metrics: Earnings history, consistency
  
- **Dividend History (10%)** - Does the company pay dividends?
  - Metrics: Dividend yield, payout ratio

**Verdict for AAPL:** 43/100 = "Not a Fit"
- Reason: Fails Graham's strict valuation screens (P/E too high, P/B too high)

---

### Cathie Wood (Disruptive Innovation)

**System Prompt:** Focuses on disruptive innovation themes with exponential growth potential

**Key Criteria:**
- **Disruptive Potential (35%)** - Is this a disruptive innovation play?
  - Themes: AI, genomics, blockchain, robotics, energy storage
  - AAPL: AI integration potential ✓
  
- **Market Size (25%)** - Is the addressable market $1T+?
  - AAPL: Yes, in multiple markets ✓
  
- **Growth Trajectory (20%)** - Exponential growth over 5+ years?
  - AAPL: Strong growth in services and AI ✓
  
- **Technology Moat (15%)** - First-mover advantage in emerging category?
  - AAPL: Strong ecosystem moat ✓
  
- **Management Vision (5%)** - Is management bold and visionary?
  - AAPL: Yes, Tim Cook's vision ✓

**Verdict for AAPL:** 90/100 = "Strong Fit"
- Reason: AAPL is a leader in AI integration, large market, strong growth potential

---

### Ray Dalio (Macro & Risk Parity)

**System Prompt:** Focuses on macroeconomic environment, balance sheet health, and risk-adjusted returns

**Key Criteria:**
- **Balance Sheet Health (30%)** - Is debt manageable?
  - Metrics: Debt/Equity, Interest Coverage, Cash position
  
- **Macro Environment Fit (25%)** - How does this fit current economic conditions?
  - Metrics: Interest rate sensitivity, inflation exposure
  
- **Risk Assessment (20%)** - What are the key risks?
  - Metrics: Downside scenarios, volatility
  
- **Cash Flow Quality (15%)** - Is cash flow sustainable?
  - Metrics: FCF margin, FCF growth
  
- **Scenario Resilience (10%)** - How does it perform in different scenarios?
  - Scenarios: Growth, recession, inflation, deflation

**Verdict for AAPL:** 73/100 = "Fit"
- Reason: Strong balance sheet, good macro fit, but some macro risks

---

### Philip Fisher (Growth Investing)

**System Prompt:** Focuses on outstanding management, superior products, and long-term growth

**Key Criteria:**
- **Management Quality (30%)** - Are executives of high integrity?
  - Metrics: Track record, capital allocation, insider ownership
  
- **Innovation & R&D (25%)** - Strong R&D and innovation capabilities?
  - Metrics: R&D spending, product pipeline, patent portfolio
  
- **Competitive Advantages (20%)** - Does the company have sustainable moats?
  - Metrics: Brand strength, switching costs, network effects
  
- **Profit Margins (15%)** - Are margins above average and improving?
  - Metrics: Gross margin, operating margin, net margin trends
  
- **Long-term Growth (10%)** - 10+ year growth potential?
  - Metrics: Market expansion, new product categories

**Verdict for AAPL:** 78/100 = "Fit"
- Reason: Excellent management, strong innovation, superior products, growing margins

---

## Data Structures

### Analysis Output (JSON Schema)

```json
{
  "score": 65,
  "verdict": "moderate_fit",
  "confidence": 0.90,
  "summaryBullets": [
    "Apple possesses an undeniable, durable competitive advantage...",
    "Management has a strong track record of innovation..."
  ],
  "criteria": [
    {
      "name": "Economic Moat",
      "weight": 25,
      "status": "pass",
      "metricsUsed": ["Brand strength", "Ecosystem lock-in"],
      "explanation": "Apple's ecosystem creates strong switching costs..."
    }
  ],
  "keyRisks": [
    "Regulatory pressure on App Store",
    "iPhone market saturation"
  ],
  "whatWouldChangeMind": [
    "Significant margin compression",
    "Loss of ecosystem dominance"
  ],
  "dataUsed": {
    "priceAsOf": "2026-01-08T20:53:38Z",
    "financialsAsOf": "Q3 2024",
    "sources": ["Financial Data API", "AI Analysis Engine"]
  }
}
```

---

## Key Systems & Components

### 1. Financial Data Service
- **Purpose:** Fetch real-time and historical financial data
- **Current:** Mock data (10 major stocks)
- **Future:** Financial Datasets API integration
- **Data Provided:**
  - Stock prices (OHLCV)
  - Company profiles
  - Financial statements (quarterly & annual)
  - Key ratios (P/E, ROE, margins, etc.)

### 2. AI Analysis Engine (LLM-Powered)
- **Purpose:** Generate persona-specific stock analysis
- **Technology:** Manus LLM with structured JSON output
- **Process:**
  1. Get persona prompt template
  2. Fill template with financial data
  3. Call LLM with system + user prompts
  4. Parse structured JSON response
  5. Return analysis with score, verdict, criteria, risks

### 3. Persona Prompt Templates
- **Purpose:** Define each investor's philosophy and criteria
- **Components:**
  - System prompt (persona background & philosophy)
  - Analysis template (questions to evaluate)
  - Criteria weights (importance of each criterion)
  
### 4. Database Layer
- **Tables:**
  - `personas` - Investor profiles
  - `tickers` - Stock information
  - `analyses` - Analysis results
  - `watchlist_tickers` - User-saved stocks
  - `alerts` - Price/score alerts
  - `jobs` - Async analysis tracking

### 5. tRPC API Layer
- **Purpose:** Type-safe RPC procedures
- **Routers:**
  - `tickers.*` - Search, get stock data
  - `analyses.*` - Run analysis, get results
  - `personas.*` - List personas, get details
  - `watchlist.*` - Save/remove stocks
  - `alerts.*` - Create/manage alerts

---

## Analysis Flow Summary

```
User Input (Ticker)
    ↓
Fetch Financial Data (Financial Data Service)
    ↓
Get All Personas (Database)
    ↓
For Each Persona:
    ├─ Get Persona Prompt Template
    ├─ Fill Template with Financial Data
    ├─ Call Manus LLM with Structured Output
    ├─ Parse JSON Response
    ├─ Extract Score, Verdict, Criteria, Risks
    └─ Save Analysis to Database
    ↓
Return All Persona Analyses
    ↓
Display on Ticker Page (6 persona cards with scores)
```

---

## Conclusion Generation Logic

### Score Calculation
The LLM evaluates each criterion based on the persona's philosophy and financial metrics:

```
For each criterion:
  - Evaluate if metrics meet the criterion's requirements
  - Assign status: PASS (100%), PARTIAL (50%), FAIL (0%)
  - Multiply by criterion weight

Final Score = Sum of (Criterion Weight × Criterion Status)
```

### Verdict Determination
```
if score >= 80:
  verdict = "Strong Fit"
elif score >= 60:
  verdict = "Fit" (Moderate Fit)
elif score >= 40:
  verdict = "Borderline" (Weak Fit)
else:
  verdict = "Not a Fit" (Poor Fit)
```

### Confidence Scoring
The LLM assigns confidence (0-1) based on:
- Data quality and completeness
- Clarity of financial metrics
- Alignment with persona's criteria
- Absence of conflicting signals

---

## Example: Warren Buffett Analyzing Apple (AAPL)

**Input Data:**
```
Symbol: AAPL
Price: $175.26
P/E Ratio: 31.04
ROE: 23.88%
Debt/Equity: 1.07
Market Cap: $2.8T
```

**LLM Evaluation:**

1. **Economic Moat (25%)** - PASS
   - Strong brand, ecosystem lock-in, switching costs
   - Score: 90% → Contribution: 22.5 points

2. **Management Quality (20%)** - PASS
   - Strong capital allocation, shareholder-friendly
   - Score: 85% → Contribution: 17.0 points

3. **Financial Strength (20%)** - PARTIAL
   - Good profitability but high debt/equity ratio
   - Score: 70% → Contribution: 14.0 points

4. **Valuation (20%)** - FAIL
   - P/E of 31 is high, lacks margin of safety
   - Score: 50% → Contribution: 10.0 points

5. **Understandability (15%)** - PASS
   - Clear business model, easy to understand
   - Score: 95% → Contribution: 14.25 points

**Total Score:** 22.5 + 17.0 + 14.0 + 10.0 + 14.25 = **77.75 ≈ 78/100**

**Verdict:** "Fit" (Moderate Fit)

**Confidence:** 90% (High confidence due to clear financial data)

**Summary:**
- "Apple possesses an undeniable, durable competitive advantage through its ecosystem, brand loyalty, and pricing power."
- "Management has a strong track record of innovation and significant capital allocation towards share repurchases, demonstrating shareholder friendliness."
- "However, the P/E ratio of 31 is elevated and lacks the margin of safety Buffett typically requires."

---

## Future Enhancements

1. **Real Financial Data Integration**
   - Replace mock data with Financial Datasets API
   - Real-time price updates
   - Historical financial statements

2. **Advanced Caching**
   - Redis caching for hot tickers
   - Cache invalidation strategies
   - Performance optimization

3. **Async Job Processing**
   - Background job queue for deep analysis
   - Job progress tracking
   - Batch analysis runs

4. **Comparison Features**
   - Side-by-side persona comparison
   - Multi-stock comparison
   - Consensus views

5. **Historical Tracking**
   - Score history over time
   - Verdict change tracking
   - Performance analytics

6. **Alerts & Notifications**
   - Price threshold alerts
   - Score change notifications
   - New opportunity alerts

---

## Summary

Guru Lens uses a sophisticated multi-layered architecture:

1. **Financial Data Layer** - Provides real-time stock data
2. **AI Analysis Layer** - Uses LLM to generate persona-specific analysis
3. **Persona Logic Layer** - Defines investment philosophies and criteria
4. **Scoring Layer** - Calculates scores based on criteria evaluation
5. **Persistence Layer** - Stores analyses for reproducibility and tracking
6. **API Layer** - Exposes functionality through type-safe tRPC procedures

The system generates conclusions by having the LLM evaluate each criterion based on the persona's investment philosophy, assign scores to each criterion, and calculate a weighted final score that determines the verdict (Strong Fit, Fit, Borderline, or Not a Fit).
