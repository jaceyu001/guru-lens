import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("AI-powered analysis", () => {
  it("should run AI analysis for AAPL with Warren Buffett persona", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Get Warren Buffett persona
    const personas = await caller.personas.list();
    const buffett = personas.find(p => p.personaId === "warren_buffett");
    expect(buffett).toBeDefined();

    // Run AI analysis
    const result = await caller.analyses.runAnalysis({
      symbol: "AAPL",
      personaIds: [buffett!.id],
      mode: "quick",
    });

    expect(result.analyses).toBeDefined();
    expect(result.analyses.length).toBe(1);

    const analysis = result.analyses[0];
    
    // Verify basic structure
    expect(analysis.ticker).toBe("AAPL");
    expect(analysis.personaId).toBe("warren_buffett");
    expect(analysis.personaName).toBe("Warren Buffett");
    
    // Verify AI-generated content
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
    expect(analysis.verdict).toBeDefined();
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.confidence).toBeLessThanOrEqual(1);
    
    // Verify structured output
    expect(Array.isArray(analysis.summaryBullets)).toBe(true);
    expect(analysis.summaryBullets.length).toBeGreaterThan(0);
    
    expect(Array.isArray(analysis.criteria)).toBe(true);
    expect(analysis.criteria.length).toBeGreaterThan(0);
    
    // Verify criteria structure
    const criterion = analysis.criteria[0];
    expect(criterion.name).toBeDefined();
    expect(criterion.weight).toBeGreaterThan(0);
    expect(["pass", "fail", "partial"]).toContain(criterion.status);
    expect(Array.isArray(criterion.metricsUsed)).toBe(true);
    expect(criterion.explanation).toBeDefined();
    expect(typeof criterion.explanation).toBe("string");
    
    expect(Array.isArray(analysis.keyRisks)).toBe(true);
    expect(analysis.keyRisks.length).toBeGreaterThan(0);
    
    expect(Array.isArray(analysis.whatWouldChangeMind)).toBe(true);
    expect(analysis.whatWouldChangeMind.length).toBeGreaterThan(0);
    
    // Log the analysis for manual review
    console.log("\n=== AI Analysis Result ===");
    console.log(`Ticker: ${analysis.ticker}`);
    console.log(`Persona: ${analysis.personaName}`);
    console.log(`Score: ${analysis.score}/100`);
    console.log(`Verdict: ${analysis.verdict}`);
    console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`\nSummary:`);
    analysis.summaryBullets.forEach((bullet, i) => {
      console.log(`  ${i + 1}. ${bullet}`);
    });
    console.log(`\nCriteria (${analysis.criteria.length} total):`);
    analysis.criteria.slice(0, 3).forEach(c => {
      console.log(`  - ${c.name} (${c.weight}%): ${c.status.toUpperCase()}`);
      console.log(`    ${c.explanation.substring(0, 100)}...`);
    });
    console.log("=========================\n");
  }, 60000); // 60 second timeout for LLM call

  it("should run AI analysis for multiple personas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Run analysis with all personas
    const result = await caller.analyses.runAnalysis({
      symbol: "MSFT",
      mode: "quick",
    });

    expect(result.analyses).toBeDefined();
    expect(result.analyses.length).toBeGreaterThan(1);

    // Verify each persona has unique analysis
    const personaIds = new Set(result.analyses.map(a => a.personaId));
    expect(personaIds.size).toBe(result.analyses.length);

    // Verify all analyses have valid structure
    result.analyses.forEach(analysis => {
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis.summaryBullets.length).toBeGreaterThan(0);
      expect(analysis.criteria.length).toBeGreaterThan(0);
      expect(analysis.keyRisks.length).toBeGreaterThan(0);
    });

    console.log(`\n=== Multi-Persona Analysis ===`);
    console.log(`Analyzed ${result.analyses.length} personas for MSFT`);
    result.analyses.forEach(a => {
      console.log(`  - ${a.personaName}: ${a.score}/100 (${a.verdict})`);
    });
    console.log("===============================\n");
  }, 120000); // 120 second timeout for multiple LLM calls
});
