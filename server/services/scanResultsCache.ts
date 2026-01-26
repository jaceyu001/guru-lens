/**
 * In-Memory Scan Results Cache
 * 
 * Temporarily stores scan results in memory while database tables are being set up.
 * This allows immediate display of scan results without database persistence.
 */

export interface ScanResult {
  id: number;
  rank: number;
  ticker: string;
  companyName: string;
  score: number;
  currentPrice: number | null;
  marketCap: number | null;
  sector: string | null;
  thesis?: string;
  confidence?: string;
  scoringDetails?: {
    categories: Array<{
      name: string;
      points: number;
      maxPoints: number;
      metrics: Array<{
        name: string;
        value: number;
        rating: string;
        points: number;
      }>;
    }>;
    totalScore: number;
  };
}

interface ScanJob {
  id: number;
  personaId: number;
  status: "pending" | "screening" | "ranking" | "llm_analysis" | "completed" | "failed";
  phase: string;
  processedStocks: number;
  opportunitiesFound: number;
  results: ScanResult[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

const scanCache = new Map<number, ScanJob>();
let nextScanJobId = 1;

export function createScanJob(personaId: number): number {
  const scanJobId = nextScanJobId++;
  scanCache.set(scanJobId, {
    id: scanJobId,
    personaId,
    status: "pending",
    phase: "initializing",
    processedStocks: 0,
    opportunitiesFound: 0,
    results: [],
    createdAt: new Date(),
  });
  console.log(`[ScanCache] Created scan job ${scanJobId} for persona ${personaId}`);
  return scanJobId;
}

export function getScanJob(scanJobId: number): ScanJob | undefined {
  return scanCache.get(scanJobId);
}

export function updateScanProgress(
  scanJobId: number,
  updates: Partial<Omit<ScanJob, "id" | "personaId" | "createdAt">>
): void {
  const job = scanCache.get(scanJobId);
  if (job) {
    Object.assign(job, updates);
    console.log(`[ScanCache] Updated scan job ${scanJobId}:`, {
      status: job.status,
      phase: job.phase,
      processedStocks: job.processedStocks,
      opportunitiesFound: job.opportunitiesFound,
    });
  }
}

export function addScanResult(scanJobId: number, result: ScanResult): void {
  const job = scanCache.get(scanJobId);
  if (job) {
    job.results.push(result);
    job.opportunitiesFound = job.results.length;
  }
}

export function completeScan(scanJobId: number): void {
  const job = scanCache.get(scanJobId);
  if (job) {
    job.status = "completed";
    job.completedAt = new Date();
    console.log(`[ScanCache] Completed scan job ${scanJobId} with ${job.results.length} opportunities`);
  }
}

export function failScan(scanJobId: number, error: string): void {
  const job = scanCache.get(scanJobId);
  if (job) {
    job.status = "failed";
    job.error = error;
    job.completedAt = new Date();
    console.error(`[ScanCache] Failed scan job ${scanJobId}:`, error);
  }
}

export function getScanResults(scanJobId: number, limit?: number): ScanResult[] {
  const job = scanCache.get(scanJobId);
  if (!job) return [];
  
  const results = job.results.slice();
  if (limit) {
    return results.slice(0, limit);
  }
  return results;
}

export function getScanProgress(scanJobId: number) {
  const job = scanCache.get(scanJobId);
  if (!job) {
    return {
      status: "not_found",
      phase: "unknown",
      processedStocks: 0,
      opportunitiesFound: 0,
    };
  }

  return {
    status: job.status,
    phase: job.phase,
    processedStocks: job.processedStocks,
    opportunitiesFound: job.opportunitiesFound,
  };
}

export function clearOldScans(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  const idsToDelete: number[] = [];
  scanCache.forEach((job, id) => {
    if (now - job.createdAt.getTime() > maxAge) {
      idsToDelete.push(id);
    }
  });
  
  idsToDelete.forEach(id => scanCache.delete(id));
}
