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
  summaryBullets: string[];
  criteria: PersonaCriteria[];
  keyRisks: string[];
  whatWouldChangeMind: string[];
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

export interface FinancialData {
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
}
