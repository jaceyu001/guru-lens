# Guru Lens Data Flow Architecture

## System Overview

This document explains how quantitative and qualitative data flows through the Guru Lens system, and how the LLM integrates with other components to produce investment analysis.

---

## 1. Data Classification

### Quantitative Data (Numerical, Objective)
Data that can be measured and expressed numerically:

```
PRICE DATA:
├── Current Price: $248.50
├── Open: $243.30
├── High: $250.75
├── Low: $242.10
├── Volume: 145,000,000 shares
├── Change: +$5.20
└── Change %: +2.14%

FINANCIAL METRICS:
├── Revenue: $96,700,000,000
├── Net Income: $16,934,000,000
├── EPS: $5.13
├── Operating Income: $20,100,000,000
├── Free Cash Flow: $14,200,000,000
└── Total Assets: $87,500,000,000

RATIOS:
├── P/E Ratio: 48.4
├── P/B Ratio: 12.8
├── P/S Ratio: 2.6
├── ROE: 28%
├── ROIC: 22%
├── Debt/Equity: 0.18
├── Current Ratio: 1.45
├── Gross Margin: 28%
├── Operating Margin: 21%
└── Net Margin: 17.5%

GROWTH METRICS:
├── Revenue Growth: 50% YoY
├── Earnings Growth: 45% YoY
├── Free Cash Flow Growth: 38% YoY
└── Historical Volatility: 35%
```

### Qualitative Data (Descriptive, Subjective)
Data that describes characteristics and context:

```
COMPANY PROFILE:
├── Name: Tesla, Inc.
├── Sector: Consumer Cyclical
├── Industry: Auto Manufacturers
├── Headquarters: Austin, Texas
├── Founded: 2003
├── CEO: Elon Musk
├── Employees: 128,000
└── Website: tesla.com

BUSINESS DESCRIPTION:
"Tesla designs, develops, manufactures and sells fully electric vehicles, 
energy storage systems, and solar products. The company operates through 
automotive and energy storage segments, with a focus on sustainable energy."

COMPETITIVE ADVANTAGES:
├── Vertical Integration
│   └── In-house battery manufacturing, software, hardware
├── Technology Leadership
│   └── Proprietary battery chemistry, autonomous driving
├── Brand Strength
│   └── Premium brand, customer loyalty
├── Manufacturing Scale
│   └── Multiple gigafactories globally
└── Ecosystem
    └── Charging network, energy storage, solar

MARKET TRENDS:
├── EV Adoption: Accelerating globally
├── Battery Costs: Declining 10% annually
├── Regulatory Support: Government incentives expanding
├── Competitive Landscape: Traditional OEMs entering market
└── Energy Transition: Shift to renewable energy

MANAGEMENT QUALITY:
├── Vision: Clear long-term sustainable energy focus
├── Execution: Track record of meeting ambitious goals
├── Capital Allocation: Strategic investments in growth
├── Innovation Culture: Continuous product development
└── Risk Taking: Bold bets on new technologies

RISKS:
├── Regulatory: Changes in EV incentives
├── Competition: Traditional automakers and startups
├── Supply Chain: Semiconductor and battery availability
├── Execution: New product launches (Cybertruck, Semi)
└── Valuation: Premium pricing if growth slows
```

---

## 2. Data Flow Through System

### 2.1 Step 1: Data Ingestion

```
┌─────────────────────────────────────────────────┐
│         USER SEARCHES FOR "TSLA"                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Search Tickers Function   │
        │  (routers.ts)              │
        │                            │
        │  Input: "TSLA"             │
        │  Output: Ticker match      │
        └────────────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  Fetch Financial Data              │
        │  (httpFinancialData.ts)            │
        │                                    │
        │  1. Check cache (TTL: 1 hour)      │
        │  2. If miss: Call Yahoo Finance    │
        │  3. Parse response                 │
        │  4. Cache for 1 hour               │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
    QUANTITATIVE                    QUALITATIVE
    ├── Price: $248.50              ├── Sector: Consumer Cyclical
    ├── Volume: 145M                ├── Industry: Auto
    ├── P/E: 48.4                   ├── Description: "Tesla designs..."
    ├── ROE: 28%                    ├── Employees: 128,000
    ├── Revenue: $96.7B             └── Website: tesla.com
    └── Margins: 21% operating
```

### 2.2 Step 2: Data Preparation for LLM

```
┌──────────────────────────────────────────────────┐
│  Prepare Analysis Input                          │
│  (routers.ts - runAnalysis procedure)            │
└────────────────┬─────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    QUANTITATIVE      QUALITATIVE
    (Formatted)       (Formatted)
    
    "P/E Ratio: 48.4"     "Sector: Consumer Cyclical"
    "ROE: 28%"            "Industry: Auto Manufacturers"
    "Revenue: $96.7B"     "Description: Tesla designs..."
    "Margin: 21%"         "Employees: 128,000"
    "Debt/Equity: 0.18"   "Website: tesla.com"
    
        │                 │
        └────────┬────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │  Create Persona Prompt               │
    │  (personaPrompts.ts)                 │
    │                                      │
    │  Template + Financial Data           │
    │  = Complete Prompt                   │
    └──────────────────────────────────────┘
```

### 2.3 Step 3: LLM Analysis

```
┌──────────────────────────────────────────────────┐
│  Manus LLM Service                               │
│  (Built-in LLM)                                  │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
LLM PROCESSES BOTH:      LLM APPLIES:
├── Quantitative Data    ├── Persona Philosophy
├── Qualitative Data     ├── Investment Criteria
└── Persona Prompt       └── Reasoning Logic
    
    EXAMPLE REASONING:
    "P/E 48.4 is high, BUT ROE 28% is exceptional.
     This justifies the premium valuation.
     
     Tesla's disruptive innovation in EVs and energy
     storage creates a massive TAM ($500B+ EV, $1T+ storage).
     
     Management execution is excellent.
     
     Financial health is strong (0.18 debt/equity).
     
     Therefore: STRONG FIT for Cathie Wood's thesis."
    
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │  LLM Generates JSON Response         │
    │  {                                   │
    │    "score": 95,                      │
    │    "verdict": "Strong Fit",          │
    │    "criteria": [...],                │
    │    "keyRisks": [...],                │
    │    "whatWouldChangeMind": [...]      │
    │  }                                   │
    └──────────────────────────────────────┘
```

### 2.4 Step 4: Response Parsing and Validation

```
┌──────────────────────────────────────────────────┐
│  Parse LLM Response                              │
│  (aiAnalysisEngine.ts)                           │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
EXTRACT JSON            VALIDATE STRUCTURE
├── score: 95           ├── score: 0-100 ✓
├── verdict: "Strong"   ├── verdict: enum ✓
├── criteria: [...]     ├── criteria: array ✓
├── risks: [...]        ├── risks: array ✓
└── whatWould: [...]    └── whatWould: array ✓
    
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │  Convert to TypeScript Type          │
    │  AnalysisOutput                      │
    └──────────────────────────────────────┘
```

### 2.5 Step 5: Database Storage

```
┌──────────────────────────────────────────────────┐
│  Store in Database                               │
│  (server/db.ts - createAnalysis)                 │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
ANALYSES TABLE         TICKERS TABLE
├── id: 1              ├── id: 1
├── ticker: TSLA       ├── symbol: TSLA
├── personaId: 4       ├── companyName: Tesla
├── score: 95          ├── sector: Consumer Cyclical
├── verdict: Strong    ├── industry: Auto
├── criteria: JSON     ├── marketCap: 780B
├── keyRisks: JSON     └── lastDataUpdate: 2026-01-08
└── timestamp: 2026-01-08
```

### 2.6 Step 6: Return to Frontend

```
┌──────────────────────────────────────────────────┐
│  API Response to Frontend                        │
│  (tRPC procedure returns AnalysisOutput[])       │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┴────────────────────────┐
    │                                     │
    ▼                                     ▼
DISPLAY RESULTS:                   STORE IN CACHE:
├── Cathie Wood: 95/100            ├── In-memory cache
├── Warren Buffett: 72/100         ├── TTL: 1 hour
├── Peter Lynch: 78/100            └── For fast re-access
├── Benjamin Graham: 35/100
├── Ray Dalio: 82/100
└── Philip Fisher: 88/100
```

---

## 3. How LLM Integrates with Other Systems

### 3.1 Data Flow to LLM

```
┌────────────────────────────────────────────────────────┐
│                    LLM SERVICE                         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  INPUT: Persona Prompt + Financial Data         │ │
│  │                                                  │ │
│  │  "You are Cathie Wood analyzing Tesla..."       │ │
│  │  "Financial Data: P/E 48.4, ROE 28%, ..."       │ │
│  │  "Evaluate based on these criteria..."          │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                               │
│                        ▼                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  PROCESSING:                                    │ │
│  │  1. Read quantitative metrics                   │ │
│  │  2. Understand qualitative context              │ │
│  │  3. Apply persona's philosophy                  │ │
│  │  4. Reason through criteria                     │ │
│  │  5. Generate structured output                  │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                               │
│                        ▼                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  OUTPUT: JSON with score, verdict, reasoning    │ │
│  │  {                                               │ │
│  │    "score": 95,                                 │ │
│  │    "verdict": "Strong Fit",                     │ │
│  │    "criteria": [                                │ │
│  │      {                                          │ │
│  │        "name": "Disruptive Innovation",         │ │
│  │        "status": "pass",                        │ │
│  │        "explanation": "..."                     │ │
│  │      }                                          │ │
│  │    ],                                           │ │
│  │    "keyRisks": [...]                            │ │
│  │  }                                              │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 3.2 Integration with Other Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GURU LENS SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Financial Data Service (httpFinancialData.ts)      │  │
│  │  ├── Fetches: Quantitative + Qualitative data       │  │
│  │  ├── Source: Yahoo Finance API                      │  │
│  │  └── Output: FinancialData object                   │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Persona Prompts (personaPrompts.ts)                │  │
│  │  ├── Defines: Persona philosophy                    │  │
│  │  ├── Creates: Prompt templates                      │  │
│  │  └── Output: Prompt string + data                   │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Analysis Engine (aiAnalysisEngine.ts)           │  │
│  │  ├── Calls: Manus LLM service                       │  │
│  │  ├── Parses: JSON response                          │  │
│  │  └── Output: AnalysisOutput object                  │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (Drizzle ORM)                             │  │
│  │  ├── Stores: Analysis results                       │  │
│  │  ├── Enables: Historical tracking                   │  │
│  │  └── Output: Persisted data                         │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Router (routers.ts)                            │  │
│  │  ├── Orchestrates: Component calls                  │  │
│  │  ├── Handles: User requests                         │  │
│  │  └── Output: tRPC response                          │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (React)                                   │  │
│  │  ├── Displays: Analysis results                     │  │
│  │  ├── Shows: Persona scores                          │  │
│  │  └── Provides: User interaction                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Quantitative vs. Qualitative Processing

### 4.1 Quantitative Data Handling

**Where it comes from:**
- Yahoo Finance API (real-time)
- Financial statements (historical)
- Market data (prices, volumes)

**How it's processed:**
1. **Fetched** as numbers from API
2. **Formatted** as JSON for LLM
3. **Used by LLM** for objective reasoning
4. **Stored** in database as numbers
5. **Displayed** in UI as charts/tables

**Example:**
```
Raw Data: P/E Ratio = 48.4
↓
LLM Processing: "P/E 48.4 is high for traditional auto, 
                 but justified by 28% ROE and growth"
↓
Output: Score 95 (quantitative), "Strong Fit" (qualitative)
```

### 4.2 Qualitative Data Handling

**Where it comes from:**
- Company descriptions
- Industry classifications
- Management narratives
- Competitive advantages
- Market trends

**How it's processed:**
1. **Fetched** as text from API
2. **Included** in LLM prompt
3. **Reasoned** by LLM for context
4. **Converted** to structured output
5. **Displayed** as text/bullets in UI

**Example:**
```
Raw Data: "Tesla designs, develops, manufactures and sells 
          fully electric vehicles..."
↓
LLM Processing: "Tesla is disrupting the automotive industry
                 with EVs and energy storage"
↓
Output: "Disruptive innovation: PASS" (criteria status)
```

### 4.3 Integration in LLM

```
LLM REASONING PROCESS:

Input: Quantitative + Qualitative Data
│
├─ Read P/E 48.4 (quantitative)
├─ Read ROE 28% (quantitative)
├─ Read "Tesla disrupts EVs" (qualitative)
├─ Read "Elon Musk vision" (qualitative)
│
├─ Apply Cathie Wood's criteria:
│  ├─ Disruptive Innovation? YES (qualitative + quantitative)
│  ├─ Revenue Growth? 50% YoY (quantitative)
│  ├─ Market Opportunity? $500B+ TAM (qualitative + quantitative)
│  ├─ Management? Excellent (qualitative)
│  ├─ Valuation? High but justified (both)
│  └─ Financial Health? Strong (quantitative)
│
├─ Synthesize reasoning:
│  "Strong fit because disruptive innovation (qualitative)
│   with excellent metrics (quantitative) and strong growth
│   (quantitative) in massive TAM (qualitative)."
│
└─ Output: Score 95, "Strong Fit"
```

---

## 5. Complete Example: TSLA Analysis

### 5.1 Data Sources

```
QUANTITATIVE DATA SOURCES:
├── Yahoo Finance API
│   ├── Price: $248.50 (real-time)
│   ├── P/E: 48.4 (calculated)
│   ├── ROE: 28% (from financials)
│   ├── Revenue: $96.7B (annual)
│   └── Margins: 21% operating (calculated)
│
└── Historical Data
    ├── Revenue Growth: 50% YoY
    ├── EPS Growth: 45% YoY
    └── Volatility: 35%

QUALITATIVE DATA SOURCES:
├── Yahoo Finance API
│   ├── Sector: "Consumer Cyclical"
│   ├── Industry: "Auto Manufacturers"
│   └── Description: "Tesla designs, develops..."
│
└── Market Knowledge
    ├── Competitive Advantages: "Vertical integration"
    ├── Market Trends: "EV adoption accelerating"
    └── Management: "Elon Musk's vision"
```

### 5.2 Processing Pipeline

```
STEP 1: DATA INGESTION
Input: "TSLA"
↓
Fetch from Yahoo Finance:
- Quantitative: P/E 48.4, ROE 28%, Revenue $96.7B
- Qualitative: Sector "Consumer Cyclical", Description "Tesla designs..."
↓
Cache for 1 hour

STEP 2: PREPARE FOR LLM
Input: FinancialData object
↓
Format for Cathie Wood prompt:
- "P/E Ratio: 48.4"
- "ROE: 28%"
- "Revenue: $96.7B"
- "Sector: Consumer Cyclical"
- "Description: Tesla designs..."
↓
Create full prompt with persona criteria

STEP 3: LLM ANALYSIS
Input: Prompt + Financial Data
↓
LLM Reasoning:
- "P/E 48.4 is high, but ROE 28% justifies it"
- "Disruptive innovation in EVs and energy storage"
- "Massive TAM: $500B+ EV, $1T+ storage"
- "Strong financial health: 0.18 debt/equity"
- "Excellent management execution"
↓
Output: JSON with score 95, "Strong Fit"

STEP 4: STORE RESULTS
Input: AnalysisOutput
↓
Store in database:
- analyses table: score, verdict, criteria, risks
- tickers table: TSLA metadata
↓
Enable historical tracking

STEP 5: DISPLAY TO USER
Input: AnalysisOutput from database
↓
Frontend renders:
- Cathie Wood: 95/100 "Strong Fit"
- Reasoning: "Disruptive innovation..."
- Criteria breakdown: "Disruptive Innovation: PASS"
- Key risks: "Competition intensifying..."
↓
User sees complete analysis
```

---

## 6. Summary

The Guru Lens system integrates quantitative and qualitative data through:

1. **Data Ingestion:** Real financial data (quantitative) + company profiles (qualitative)
2. **LLM Integration:** Both data types fed to LLM for reasoning
3. **Persona Application:** LLM applies persona's philosophy to data
4. **Score Generation:** Weighted criteria evaluation produces numeric score
5. **Output Structure:** JSON with numeric scores + textual explanations
6. **Persistence:** Results stored for historical tracking and reproducibility

The LLM acts as the "reasoning engine" that synthesizes both quantitative metrics and qualitative context to produce investment insights aligned with each persona's philosophy.
