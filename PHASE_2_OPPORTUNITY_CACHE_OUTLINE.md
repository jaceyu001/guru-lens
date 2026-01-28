# Phase 2: Opportunity Cache System - Detailed Implementation Outline

## Overview
Phase 2 implements persistent storage for 50 opportunities per persona, including complete financial data snapshots and LLM analysis results. This enables users to review, compare, and track investment opportunities over time.

---

## 1. Database Schema Design

### 1.1 Core Tables

#### Table: opportunity_scan
Tracks metadata for each scan execution per persona.

```sql
CREATE TABLE opportunity_scan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scan_id VARCHAR(36) UNIQUE NOT NULL,  -- UUID for tracking
  persona_name VARCHAR(100) NOT NULL,   -- 'Warren Buffett', 'Ray Dalio', etc.
  scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scan_status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
  
  -- Scan Statistics
  total_stocks_analyzed INT,            -- How many stocks were screened
  candidates_from_cache INT,            -- How many from preliminary cache
  opportunities_found INT,              -- How many passed LLM analysis
  
  -- Performance Metrics
  scan_duration_seconds INT,            -- Total time for scan
  api_calls_made INT,                   -- Alpha Vantage API calls
  llm_calls_made INT,                   -- LLM analysis calls
  
  -- Error Tracking
  error_message TEXT,                   -- If failed, what went wrong
  failed_tickers JSON,                  -- List of tickers that failed
  
  -- Metadata
  created_by VARCHAR(100),              -- User who initiated scan
  notes TEXT,                           -- User notes about this scan
  
  INDEX idx_persona (persona_name),
  INDEX idx_scan_date (scan_date),
  INDEX idx_scan_id (scan_id),
  INDEX idx_status (scan_status)
);
```

#### Table: opportunity
Stores individual opportunities with complete financial and LLM data.

```sql
CREATE TABLE opportunity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Foreign Key & Identifiers
  scan_id VARCHAR(36) NOT NULL,
  opportunity_rank INT,                 -- 1-50 (ranking within scan)
  ticker VARCHAR(10) NOT NULL,
  
  -- Company Info
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  
  -- Persona & Score
  persona_name VARCHAR(100) NOT NULL,
  investment_score INT,                 -- 0-100
  score_verdict VARCHAR(50),            -- 'strong_buy', 'buy', 'hold', 'sell'
  confidence_level INT,                 -- 0-100
  
  -- Financial Data Snapshot (Complete JSON)
  financial_data_snapshot JSON,         -- Full financial metrics at time of analysis
  
  -- LLM Analysis Results (Complete JSON)
  llm_analysis_results JSON,            -- Thesis, strengths, risks, catalysts, etc.
  
  -- Scoring Breakdown (Detailed JSON)
  scoring_criteria_breakdown JSON,      -- Score for each criterion with reasoning
  
  -- User Interaction
  user_saved BOOLEAN DEFAULT FALSE,     -- User bookmarked this opportunity
  user_notes TEXT,                      -- User's personal notes
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 1,           -- Track schema changes
  
  FOREIGN KEY (scan_id) REFERENCES opportunity_scan(scan_id),
  INDEX idx_ticker (ticker),
  INDEX idx_persona (persona_name),
  INDEX idx_score (investment_score),
  INDEX idx_scan_id (scan_id),
  INDEX idx_user_saved (user_saved),
  INDEX idx_created_at (created_at)
);
```

### 1.2 JSON Schema Details

#### financial_data_snapshot JSON Structure
Complete financial metrics snapshot at time of analysis.

```json
{
  "price": {
    "current": 150.25,
    "open": 149.50,
    "high": 151.75,
    "low": 148.90,
    "close": 150.25,
    "volume": 45000000,
    "previousClose": 149.80,
    "change": 0.45,
    "changePercent": 0.30,
    "timestamp": "2026-01-28T18:00:00Z"
  },
  "profile": {
    "companyName": "Microsoft Corporation",
    "sector": "Technology",
    "industry": "Software",
    "description": "Develops software, cloud services, and gaming products",
    "employees": 221000,
    "website": "https://www.microsoft.com",
    "marketCap": 2750000000000,
    "dilutedSharesOutstanding": 7200000000
  },
  "ratios": {
    "pe": 28.5,
    "pb": 12.3,
    "ps": 8.9,
    "roe": 42.5,
    "roa": 18.2,
    "roic": 35.8,
    "currentRatio": 1.85,
    "debtToEquity": 0.45,
    "grossMargin": 69.2,
    "operatingMargin": 42.1,
    "netMargin": 34.8,
    "dividendYield": 0.75,
    "interestCoverage": 125.3
  },
  "financials": [
    {
      "period": "2025-12-31",
      "fiscalYear": 2025,
      "revenue": 245000000000,
      "netIncome": 85000000000,
      "eps": 11.81,
      "operatingIncome": 103000000000,
      "freeCashFlow": 65000000000,
      "operatingCashFlow": 75000000000
    },
    {
      "period": "2024-12-31",
      "fiscalYear": 2024,
      "revenue": 235000000000,
      "netIncome": 80000000000,
      "eps": 11.12,
      "operatingIncome": 98000000000,
      "freeCashFlow": 62000000000,
      "operatingCashFlow": 72000000000
    }
  ],
  "quarterlyFinancials": [
    {
      "period": "2025-Q4",
      "quarter": "Q4",
      "fiscalYear": 2025,
      "revenue": 65000000000,
      "netIncome": 23000000000,
      "eps": 3.19,
      "operatingIncome": 28000000000,
      "operatingCashFlow": 21000000000
    }
  ],
  "balanceSheet": {
    "totalAssets": 420000000000,
    "totalLiabilities": 180000000000,
    "totalEquity": 240000000000,
    "bookValuePerShare": 33.33,
    "tangibleBookValuePerShare": 28.50,
    "totalDebt": 80000000000,
    "cash": 120000000000
  },
  "historicalBars": [
    {
      "date": "2026-01-28",
      "open": 149.50,
      "high": 151.75,
      "low": 148.90,
      "close": 150.25,
      "volume": 45000000
    }
  ]
}
```

#### llm_analysis_results JSON Structure
Complete LLM analysis output for the opportunity.

```json
{
  "persona": "Warren Buffett",
  "analysisDate": "2026-01-28T18:00:00Z",
  "modelUsed": "gpt-4",
  
  "investmentThesis": "Microsoft demonstrates exceptional competitive moats through its dominant cloud platform (Azure) and enterprise software suite. The company's transition to AI-powered products (Copilot) positions it at the forefront of the AI revolution. Strong cash generation and disciplined capital allocation support long-term value creation.",
  
  "summaryBullets": [
    "Dominant market position in enterprise cloud (Azure) with 23% market share",
    "Successful AI integration across product portfolio (Office 365, GitHub Copilot)",
    "Strong financial metrics: 34.8% net margin, 42.5% ROE",
    "Consistent revenue growth: 4.2% YoY despite macro headwinds",
    "Attractive dividend yield of 0.75% with 10-year dividend growth history"
  ],
  
  "strengths": [
    {
      "category": "Competitive Advantage",
      "description": "Unmatched ecosystem integration across cloud, productivity, and gaming",
      "impact": "High",
      "evidence": "Azure growing 29% YoY, Office 365 has 400M+ users"
    },
    {
      "category": "Financial Health",
      "description": "Fortress balance sheet with $120B cash and manageable debt",
      "impact": "High",
      "evidence": "Debt-to-equity of 0.45, interest coverage of 125x"
    },
    {
      "category": "Management Quality",
      "description": "Proven track record under Satya Nadella's leadership",
      "impact": "Medium",
      "evidence": "Stock returned 1,200% since 2014, consistent execution"
    }
  ],
  
  "risks": [
    {
      "category": "Valuation Risk",
      "description": "Trading at 28.5x PE, above historical average of 25x",
      "impact": "Medium",
      "mitigation": "Justified by growth and AI positioning"
    },
    {
      "category": "Regulatory Risk",
      "description": "Increased antitrust scrutiny on cloud and AI practices",
      "impact": "Medium",
      "mitigation": "Strong legal team, compliance track record"
    },
    {
      "category": "Competition Risk",
      "description": "AWS and Google Cloud remain formidable competitors",
      "impact": "Low",
      "mitigation": "Azure's enterprise integration is difficult to replicate"
    }
  ],
  
  "whatWouldChangeMind": "Sustained decline in Azure market share below 20%, or failure to monetize AI investments within 2 years would suggest the thesis is broken.",
  
  "catalysts": [
    {
      "catalyst": "AI Monetization Success",
      "timeframe": "6-12 months",
      "impact": "Positive",
      "probability": "High",
      "description": "Successful integration of Copilot into enterprise workflows"
    },
    {
      "catalyst": "Cloud Market Consolidation",
      "timeframe": "12-24 months",
      "impact": "Positive",
      "probability": "Medium",
      "description": "Market consolidation favoring larger players like Microsoft"
    },
    {
      "catalyst": "Regulatory Action",
      "timeframe": "6-18 months",
      "impact": "Negative",
      "probability": "Low",
      "description": "Antitrust action limiting cloud or AI business practices"
    }
  ],
  
  "confidenceScore": 85,
  "confidenceReasoning": "High confidence due to clear competitive advantages, strong financials, and proven management execution. Moderate uncertainty around AI monetization timeline."
}
```

#### scoring_criteria_breakdown JSON Structure
Detailed breakdown of how the investment score was calculated.

```json
{
  "totalScore": 82,
  "verdict": "strong_buy",
  "confidenceLevel": 85,
  
  "criteria": {
    "valuation": {
      "score": 75,
      "weight": 20,
      "weightedScore": 15,
      "pass": true,
      "reasoning": "PE of 28.5x is above historical average but justified by growth and AI positioning",
      "metrics": {
        "pe_ratio": 28.5,
        "pb_ratio": 12.3,
        "ps_ratio": 8.9,
        "peg_ratio": 1.8
      },
      "thresholds": {
        "min_pe": 15,
        "max_pe": 35,
        "min_pb": 1,
        "max_pb": 20
      }
    },
    
    "growth": {
      "score": 85,
      "weight": 25,
      "weightedScore": 21.25,
      "pass": true,
      "reasoning": "Strong revenue growth of 4.2% YoY with accelerating cloud growth",
      "metrics": {
        "revenue_growth_yoy": 4.2,
        "earnings_growth_yoy": 6.5,
        "fcf_growth_yoy": 5.8,
        "cloud_growth_yoy": 29.0
      },
      "thresholds": {
        "min_revenue_growth": 2.0,
        "min_earnings_growth": 3.0
      }
    },
    
    "profitability": {
      "score": 90,
      "weight": 20,
      "weightedScore": 18,
      "pass": true,
      "reasoning": "Exceptional profitability with 34.8% net margin and 42.5% ROE",
      "metrics": {
        "net_margin": 34.8,
        "operating_margin": 42.1,
        "roe": 42.5,
        "roa": 18.2,
        "roic": 35.8
      },
      "thresholds": {
        "min_net_margin": 10,
        "min_roe": 15,
        "min_roic": 10
      }
    },
    
    "financial_health": {
      "score": 88,
      "weight": 15,
      "weightedScore": 13.2,
      "pass": true,
      "reasoning": "Strong balance sheet with fortress cash position",
      "metrics": {
        "current_ratio": 1.85,
        "debt_to_equity": 0.45,
        "interest_coverage": 125.3,
        "cash_to_debt": 1.5
      },
      "thresholds": {
        "min_current_ratio": 1.0,
        "max_debt_to_equity": 2.0,
        "min_interest_coverage": 5.0
      }
    },
    
    "competitive_position": {
      "score": 92,
      "weight": 20,
      "weightedScore": 18.4,
      "pass": true,
      "reasoning": "Dominant market position in cloud and enterprise software",
      "metrics": {
        "market_share": "23% in cloud",
        "brand_strength": "Very Strong",
        "switching_costs": "High",
        "network_effects": "Strong"
      },
      "qualitative_assessment": "Unmatched ecosystem integration"
    }
  },
  
  "scoreDistribution": {
    "strong_buy": "80-100",
    "buy": "60-79",
    "hold": "40-59",
    "sell": "20-39",
    "strong_sell": "0-19"
  }
}
```

---

## 2. Data Storage Implementation

### 2.1 Storage Strategy

#### Opportunity Storage Workflow

```
Scan Initiated (persona)
    ↓
[Phase 1: Preliminary Filtering]
├─ Query stock_financial_cache
├─ Apply persona criteria
└─ Get top 100 candidates
    ↓
[Phase 2: Detailed Analysis]
├─ For each of top 50 candidates:
│  ├─ Fetch fresh financial data from Alpha Vantage
│  ├─ Run LLM analysis
│  ├─ Calculate investment score
│  └─ Store in opportunity table
    ↓
[Phase 3: Finalization]
├─ Update opportunity_scan status to 'completed'
├─ Calculate scan statistics
└─ Notify user of results
```

#### Storage Operations

```typescript
// 1. Create scan record
async function createScan(persona: string): Promise<string> {
  const scanId = generateUUID();
  await db.insert('opportunity_scan', {
    scan_id: scanId,
    persona_name: persona,
    scan_status: 'in_progress',
    created_by: currentUser.id
  });
  return scanId;
}

// 2. Store individual opportunity
async function storeOpportunity(
  scanId: string,
  ticker: string,
  financialData: FinancialSnapshot,
  llmAnalysis: LLMAnalysisResult,
  scores: ScoringBreakdown,
  rank: number
): Promise<void> {
  await db.insert('opportunity', {
    scan_id: scanId,
    opportunity_rank: rank,
    ticker: ticker,
    company_name: financialData.profile.companyName,
    sector: financialData.profile.sector,
    industry: financialData.profile.industry,
    market_cap: financialData.profile.marketCap,
    persona_name: llmAnalysis.persona,
    investment_score: scores.totalScore,
    score_verdict: scores.verdict,
    confidence_level: scores.confidenceLevel,
    
    // Store complete snapshots as JSON
    financial_data_snapshot: JSON.stringify(financialData),
    llm_analysis_results: JSON.stringify(llmAnalysis),
    scoring_criteria_breakdown: JSON.stringify(scores)
  });
}

// 3. Complete scan
async function completeScan(
  scanId: string,
  stats: ScanStatistics
): Promise<void> {
  await db.update('opportunity_scan', {
    scan_id: scanId
  }, {
    scan_status: 'completed',
    total_stocks_analyzed: stats.totalAnalyzed,
    candidates_from_cache: stats.fromCache,
    opportunities_found: stats.opportunitiesFound,
    scan_duration_seconds: stats.durationSeconds,
    api_calls_made: stats.apiCalls,
    llm_calls_made: stats.llmCalls
  });
}
```

### 2.2 Data Retrieval

#### Get Opportunities for Display

```typescript
// Retrieve opportunities for a specific scan
async function getOpportunitiesForScan(scanId: string) {
  const opportunities = await db.query(`
    SELECT 
      id,
      opportunity_rank,
      ticker,
      company_name,
      sector,
      investment_score,
      score_verdict,
      confidence_level,
      financial_data_snapshot,
      llm_analysis_results,
      scoring_criteria_breakdown,
      user_saved,
      created_at
    FROM opportunity
    WHERE scan_id = ?
    ORDER BY opportunity_rank ASC
  `, [scanId]);
  
  return opportunities.map(opp => ({
    id: opp.id,
    rank: opp.opportunity_rank,
    ticker: opp.ticker,
    companyName: opp.company_name,
    sector: opp.sector,
    score: opp.investment_score,
    verdict: opp.score_verdict,
    confidence: opp.confidence_level,
    
    // Parse JSON fields
    financialData: JSON.parse(opp.financial_data_snapshot),
    llmAnalysis: JSON.parse(opp.llm_analysis_results),
    scoringCriteria: JSON.parse(opp.scoring_criteria_breakdown),
    
    isSaved: opp.user_saved,
    createdAt: opp.created_at
  }));
}

// Get saved opportunities for user
async function getSavedOpportunities(userId: string) {
  return await db.query(`
    SELECT 
      os.scan_id,
      os.persona_name,
      os.scan_date,
      o.ticker,
      o.company_name,
      o.investment_score,
      o.score_verdict,
      o.user_notes,
      o.financial_data_snapshot,
      o.llm_analysis_results
    FROM opportunity o
    JOIN opportunity_scan os ON o.scan_id = os.scan_id
    WHERE o.user_saved = TRUE
    AND os.created_by = ?
    ORDER BY os.scan_date DESC, o.investment_score DESC
  `, [userId]);
}

// Get opportunity details for modal
async function getOpportunityDetails(opportunityId: number) {
  const opp = await db.queryOne(`
    SELECT *
    FROM opportunity
    WHERE id = ?
  `, [opportunityId]);
  
  return {
    ticker: opp.ticker,
    companyName: opp.company_name,
    sector: opp.sector,
    industry: opp.industry,
    score: opp.investment_score,
    verdict: opp.score_verdict,
    confidence: opp.confidence_level,
    
    financialData: JSON.parse(opp.financial_data_snapshot),
    llmAnalysis: JSON.parse(opp.llm_analysis_results),
    scoringCriteria: JSON.parse(opp.scoring_criteria_breakdown),
    
    userNotes: opp.user_notes,
    createdAt: opp.created_at
  };
}
```

---

## 3. Frontend Integration

### 3.1 UI Components

#### Opportunity Results List
```typescript
// Display scan results with 50 opportunities
<OpportunityResultsList
  scanId={scanId}
  opportunities={opportunities}
  onSelectOpportunity={handleSelectOpportunity}
/>
```

#### Opportunity Details Modal
```typescript
// Show full details including financials and LLM analysis
<OpportunityDetailsModal
  opportunity={selectedOpportunity}
  onSave={handleSaveOpportunity}
  onCompare={handleCompareOpportunities}
/>
```

#### Saved Opportunities
```typescript
// User's saved opportunities across all scans
<SavedOpportunitiesList
  opportunities={savedOpportunities}
  onViewDetails={handleViewDetails}
  onRemoveSave={handleRemoveSave}
/>
```

### 3.2 User Interactions

#### Save Opportunity
```typescript
async function saveOpportunity(opportunityId: number) {
  await db.update('opportunity', { id: opportunityId }, {
    user_saved: true,
    updated_at: new Date()
  });
  
  // Show success toast
  toast.success('Opportunity saved to your watchlist');
}
```

#### Add User Notes
```typescript
async function updateOpportunityNotes(
  opportunityId: number,
  notes: string
) {
  await db.update('opportunity', { id: opportunityId }, {
    user_notes: notes,
    updated_at: new Date()
  });
}
```

#### Compare Opportunities
```typescript
// Compare 2-3 opportunities side-by-side
<OpportunityComparison
  opportunities={selectedOpportunities}
  metrics={['score', 'pe_ratio', 'roe', 'growth', 'dividend_yield']}
/>
```

---

## 4. Implementation Phases

### Phase 2.1: Database Setup (2-3 days)
- [ ] Create opportunity_scan table
- [ ] Create opportunity table
- [ ] Create indexes for performance
- [ ] Add foreign key relationships
- [ ] Create database migration scripts

### Phase 2.2: Backend Storage (3-4 days)
- [ ] Implement storeOpportunity() function
- [ ] Implement getOpportunitiesForScan() function
- [ ] Implement getSavedOpportunities() function
- [ ] Implement updateOpportunityNotes() function
- [ ] Add error handling and logging

### Phase 2.3: API Integration (2-3 days)
- [ ] Create tRPC procedure: scan.getOpportunities
- [ ] Create tRPC procedure: opportunity.save
- [ ] Create tRPC procedure: opportunity.getSaved
- [ ] Create tRPC procedure: opportunity.addNotes
- [ ] Add authentication checks

### Phase 2.4: Frontend Components (4-5 days)
- [ ] Create OpportunityResultsList component
- [ ] Create OpportunityDetailsModal component
- [ ] Create SavedOpportunitiesList component
- [ ] Create OpportunityComparison component
- [ ] Add save/bookmark functionality

### Phase 2.5: Testing & Optimization (3-4 days)
- [ ] Unit tests for storage functions
- [ ] Integration tests for API endpoints
- [ ] Performance tests for large result sets
- [ ] UI tests for components
- [ ] End-to-end scan and storage tests

---

## 5. Performance Considerations

### 5.1 Query Optimization

```sql
-- Optimize opportunity retrieval
CREATE INDEX idx_scan_rank ON opportunity(scan_id, opportunity_rank);
CREATE INDEX idx_persona_date ON opportunity_scan(persona_name, scan_date);
CREATE INDEX idx_user_saved ON opportunity(user_saved, created_at);

-- Analyze query performance
EXPLAIN SELECT * FROM opportunity WHERE scan_id = ? ORDER BY opportunity_rank;
```

### 5.2 JSON Field Optimization

- Use JSON indexes for frequently queried fields
- Consider denormalizing critical fields (score, verdict) to separate columns
- Compress JSON data if storage becomes an issue

### 5.3 Storage Estimates

```
Per Opportunity:
- Basic fields: ~500 bytes
- financial_data_snapshot: ~5-8 KB
- llm_analysis_results: ~3-5 KB
- scoring_criteria_breakdown: ~2-3 KB
- Total per opportunity: ~11-16 KB

Per Scan (50 opportunities):
- opportunity_scan record: ~200 bytes
- 50 opportunity records: ~550-800 KB
- Total per scan: ~600-900 KB

Storage for 1000 scans:
- 1000 × 600-900 KB = 600-900 MB
- Reasonable for most databases
```

---

## 6. Scalability Strategy

### 6.1 Archive Old Scans
```sql
-- Archive scans older than 12 months
CREATE TABLE opportunity_archive (
  LIKE opportunity
);

INSERT INTO opportunity_archive
SELECT * FROM opportunity
WHERE created_at < DATE_SUB(NOW(), INTERVAL 12 MONTH);

DELETE FROM opportunity
WHERE created_at < DATE_SUB(NOW(), INTERVAL 12 MONTH);
```

### 6.2 Partitioning by Date
```sql
-- Partition opportunity table by month
ALTER TABLE opportunity
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
  PARTITION p202601 VALUES LESS THAN (202602),
  PARTITION p202602 VALUES LESS THAN (202603),
  ...
);
```

---

## 7. Success Metrics

### 7.1 Functional Requirements
- ✅ Store 50 opportunities per persona scan
- ✅ Persist complete financial data snapshots
- ✅ Persist complete LLM analysis results
- ✅ Persist scoring breakdown with reasoning
- ✅ Allow users to save/bookmark opportunities
- ✅ Allow users to add personal notes
- ✅ Enable comparison of opportunities

### 7.2 Performance Requirements
- ✅ Retrieve scan results in <500ms
- ✅ Retrieve saved opportunities in <1s
- ✅ Store opportunity in <100ms
- ✅ Support 1000+ scans without performance degradation

### 7.3 Data Integrity
- ✅ All financial data correctly captured
- ✅ All LLM analysis results preserved
- ✅ Scoring breakdown matches displayed scores
- ✅ No data loss on failures

---

## 8. Next Steps

1. **Immediate**: Create database schema and migration scripts
2. **Week 1**: Implement backend storage functions
3. **Week 2**: Create API endpoints and integrate with scanning service
4. **Week 3**: Build frontend components for results display
5. **Week 4**: Add user interaction features (save, notes, compare)
6. **Week 5**: Testing, optimization, and deployment
