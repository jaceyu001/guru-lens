/**
 * Opportunity Persistence Service
 * Handles storing Phase 2/3 results to database
 */

import { getDb, getTickerBySymbol, upsertTicker } from "../db";
import { opportunityRecords } from "../../drizzle/schema";

export interface OpportunityResultToPersist {
  scanRecordId: number;
  personaId: number;
  ticker: string;
  companyName?: string;
  sector?: string;
  industry?: string;
  rank: number;
  finalScore: number;
  preliminaryScore?: number;
  verdict?: string;
  confidence: number;
  thesis?: string;
  summaryBullets?: string[];
  strengths?: string[];
  keyRisks?: string[];
  catalystAnalysis?: string[];
  whatWouldChangeMind?: string[];
  criteria?: any[];
  financialMetrics?: Record<string, any>;
  dataQualityFlags?: Record<string, boolean>;
  personaScores?: {
    buffett?: number;
    wood?: number;
    graham?: number;
    lynch?: number;
    fisher?: number;
  };
  fundamentalsAgent?: Record<string, any>;
  valuationAgent?: Record<string, any>;
  dataUsed?: any[];
}

/**
 * Persist a single opportunity record to database
 */
export async function persistOpportunityRecord(opportunity: OpportunityResultToPersist): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[opportunityPersistence] Database not available");
      return false;
    }

    const recordData = {
      scanRecordId: opportunity.scanRecordId,
      personaId: opportunity.personaId,
      ticker: opportunity.ticker,
      companyName: opportunity.companyName || opportunity.ticker,
      sector: opportunity.sector || null,
      rank: opportunity.rank,
      investmentScore: Math.round(opportunity.finalScore),
      verdict: opportunity.verdict || "Strong Fit",
      confidence: opportunity.confidence,
      financialDataSnapshot: opportunity.financialMetrics || {},
      hybridScore: opportunity.finalScore,
      buffettScore: opportunity.personaScores?.buffett || null,
      woodScore: opportunity.personaScores?.wood || null,
      grahamScore: opportunity.personaScores?.graham || null,
      lyncheScore: opportunity.personaScores?.lynch || null,
      fisherScore: opportunity.personaScores?.fisher || null,
      fundamentalsAgentFindings: opportunity.fundamentalsAgent || null,
      valuationAgentFindings: opportunity.valuationAgent || null,
      dataQualityFlags: opportunity.dataQualityFlags || {},
      investmentThesis: opportunity.thesis || null,
      summaryBullets: opportunity.summaryBullets || [],
      keyStrengths: opportunity.strengths || [],
      keyRisks: opportunity.keyRisks || [],
      catalystAnalysis: opportunity.catalystAnalysis || [],
      whatWouldChangeMind: opportunity.whatWouldChangeMind || [],
      scoringCriteria: opportunity.criteria || [],
      dataUsed: opportunity.dataUsed || [],
      analyzedAt: new Date(),
    };

    await (db as any).insert(opportunityRecords).values(recordData);
    console.log(`[opportunityPersistence] Persisted opportunity: ${opportunity.ticker}`);
    return true;
  } catch (error) {
    console.error(`[opportunityPersistence] Error persisting opportunity ${opportunity.ticker}:`, error);
    return false;
  }
}

/**
 * Persist multiple opportunity records in batch
 */
export async function persistOpportunityRecords(opportunities: OpportunityResultToPersist[]): Promise<number> {
  let successCount = 0;
  
  for (const opportunity of opportunities) {
    const success = await persistOpportunityRecord(opportunity);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`[opportunityPersistence] Persisted ${successCount}/${opportunities.length} opportunities`);
  return successCount;
}

/**
 * Get persisted opportunity records for a scan
 */
export async function getOpportunitiesForScan(scanRecordId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[opportunityPersistence] Database not available");
      return [];
    }

    const records = await (db as any)
      .select()
      .from(opportunityRecords)
      .where((table: any) => table.scanRecordId === scanRecordId)
      .orderBy((table: any) => table.rank);

    return records;
  } catch (error) {
    console.error("[opportunityPersistence] Error retrieving opportunities:", error);
    return [];
  }
}

/**
 * Get opportunity record by scan and ticker
 */
export async function getOpportunityRecord(scanRecordId: number, ticker: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[opportunityPersistence] Database not available");
      return null;
    }

    const records = await (db as any)
      .select()
      .from(opportunityRecords)
      .where((table: any) => table.scanRecordId === scanRecordId && table.ticker === ticker)
      .limit(1);

    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error("[opportunityPersistence] Error retrieving opportunity:", error);
    return null;
  }
}
