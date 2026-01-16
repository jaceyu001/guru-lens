/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ============================================================================
// Guru Lens Custom Types
// ============================================================================

export interface PersonaCriteria {
  name: string;
  weight: number;
  status: "pass" | "fail" | "partial";
  metricsUsed: string[];
  explanation: string;
}

export interface DataSource {
  source: string;
  endpoint: string;
  timestamp: number;
}

export interface Citation {
  type: string;
  reference: string;
  url?: string;
}

export interface RunMetadata {
  model: string;
  version: string;
  runTime: number;
  inputsHash: string;
  mode: "quick" | "deep";
}

export interface AnalysisOutput {
  id: number;
  runId: string;
  ticker: string;
  personaId: string;
  personaName: string;
  score: number;
  verdict: "Strong Fit" | "Fit" | "Borderline" | "Not a Fit" | "Insufficient Data";
  confidence: number;
  baseConfidence?: number;
  summaryBullets: string[];
  criteria: PersonaCriteria[];
  keyRisks: string[];
  whatWouldChangeMind: string[];
  dataQualityIssues?: string[];
  missingMetricsImpact?: Array<{metric: string; affectedCriteria: string[]; description: string}>;
  dataUsed: DataSource[];
  citations?: Citation[];
  runMetadata: RunMetadata;
  runTimestamp: Date;
}

export interface TickerSnapshot {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  price?: number;
  marketCap?: number;
  exchange?: string;
  lastDataUpdate?: Date;
}

export interface OpportunityOutput {
  id: number;
  personaId: string;
  personaName: string;
  ticker: TickerSnapshot;
  analysis: AnalysisOutput;
  rank: number;
  whyNow: string[];
  keyMetrics: Record<string, number | string>;
  changeStatus: "new" | "improved" | "unchanged" | "dropped";
  previousScore?: number;
  scanDate: Date;
  scanTimestamp: Date;
}

export interface JobStatus {
  id: number;
  jobType: "ticker_analysis" | "daily_scan" | "deep_analysis";
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  statusMessage?: string;
  resultId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockPrice {
  symbol: string;
  current: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  ceo?: string;
  employees?: number;
  founded?: number;
  headquarters?: string;
  website?: string;
  marketCap: number;
}

export interface FinancialStatement {
  period: string;
  periodType: "quarterly" | "annual";
  fiscalYear: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  ebitda: number;
  freeCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholderEquity: number;
  cashAndEquivalents: number;
  totalDebt: number;
}

export interface KeyRatios {
  symbol: string;
  peRatio: number;
  pbRatio: number;
  psRatio: number;
  pegRatio: number;
  dividendYield: number;
  payoutRatio: number;
  roe: number;
  roa: number;
  roic: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  interestCoverage: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  assetTurnover: number;
  inventoryTurnover: number;
}

export interface FinancialData {
  sharesOutstanding?: number; // in millions
  price?: {
    current: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    timestamp: Date;
  };
  profile?: {
    sector: string;
    industry: string;
    description: string;
    employees?: number;
    website?: string;
  };
  financials?: {
    revenue: number;
    netIncome: number;
    eps: number;
    period: string;
    fiscalYear: number;
  }[];
  ratios?: {
    pe?: number;
    pb?: number;
    ps?: number;
    roe?: number;
    roic?: number;
    debtToEquity?: number;
    currentRatio?: number;
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;
  };
  dataQualityFlags?: {
    debtToEquityAnomalous?: boolean;
    roicZero?: boolean;
    interestCoverageZero?: boolean;
    peNegative?: boolean;
    marketCapZero?: boolean;
    pbAnomalous?: boolean;
    peAnomalous?: boolean;
    roeNegative?: boolean;
    currentRatioAnomalous?: boolean;
    leverageTrend?: string; // INCREASING, STABLE, DECREASING
    liquidityTrend?: string; // IMPROVING, STABLE, DETERIORATING
  };
}

// ============================================================================
// Agent Analysis Types
// ============================================================================

export interface GrowthAnalysis {
  assessment: "STRONG" | "MODERATE" | "WEAK" | "UNCLEAR";
  revenueGrowth: number; // %
  earningsGrowth: number; // %
  fcfGrowth: number; // %
  trend?: "ACCELERATING" | "STABLE" | "DECELERATING" | "UNKNOWN";
  narrative: string;
  confidence: number; // 0-100
}

export interface ProfitabilityAnalysis {
  assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
  netMargin: number; // %
  operatingMargin: number; // %
  grossMargin: number; // %
  trend?: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
  narrative: string;
  confidence: number; // 0-100
}

export interface CapitalEfficiencyAnalysis {
  assessment: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNCLEAR";
  roe: number; // %
  roic: number; // %
  roa: number; // %
  narrative: string;
  confidence: number; // 0-100
}

export interface FinancialHealthAnalysis {
  assessment: "STRONG" | "STABLE" | "CONCERNING" | "WEAK" | "UNCLEAR";
  debtToEquity: number; // %
  currentRatio: number;
  interestCoverage: number;
  narrative: string;
  confidence: number; // 0-100
}

export interface CashFlowAnalysis {
  assessment: "STRONG" | "HEALTHY" | "WEAK" | "NEGATIVE" | "UNCLEAR";
  fcfMargin: number; // %
  fcfGrowth: number; // %
  trend?: "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
  narrative: string;
  confidence: number; // 0-100
}

export interface FundamentalsFindings {
  growth: GrowthAnalysis;
  profitability: ProfitabilityAnalysis;
  capitalEfficiency: CapitalEfficiencyAnalysis;
  financialHealth: FinancialHealthAnalysis;
  cashFlow: CashFlowAnalysis;
  summary: string;
  dataQualityWarnings: string[];
  recommendationsForPersonas: string[];
}

export interface ValuationMethod {
  name: "DCF" | "Comparable" | "DDM" | "AssetBased";
  intrinsicValue: number;
  upside: number; // %
  assessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-1
  narrative: string;
  assumptions: Record<string, string | number>;
  limitations: string[];
}

export interface ValuationFindings {
  currentPrice: number;
  methods: ValuationMethod[];
  consensusValuation: {
    low: number;
    high: number;
    midpoint: number;
  };
  consensusUpside: number; // %
  marginOfSafety: number; // %
  methodAgreement: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT";
  overallAssessment: "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED" | "UNABLE_TO_VALUE";
  confidence: number; // 0-100
  summary: string;
  dataQualityWarnings: string[];
  recommendationsForPersonas: string[];
}

// Historical Balance Sheet Data
export interface HistoricalBalanceSheet {
  symbol: string;
  period: string; // "Q1", "Q2", "Q3", "Q4", "FY"
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  debtToEquity: number; // Calculated D/E ratio
  currentRatio: number;
  timestamp: Date;
}

// Balance Sheet Trends
export interface BalanceSheetTrend {
  symbol: string;
  debtToEquityTrend: "INCREASING" | "STABLE" | "DECREASING";
  debtToEquityChange: number; // % change over period
  currentRatioTrend: "IMPROVING" | "STABLE" | "DETERIORATING";
  currentRatioChange: number; // % change over period
  leverageRisk: "HIGH" | "MEDIUM" | "LOW";
  liquidityRisk: "HIGH" | "MEDIUM" | "LOW";
  analysisDate: Date;
}
