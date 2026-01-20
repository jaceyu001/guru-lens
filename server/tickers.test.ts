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

describe("tickers router", () => {
  it("should search tickers by symbol", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.tickers.search({ query: "AAPL" });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    const apple = results.find(t => t.symbol === "AAPL");
    expect(apple).toBeDefined();
    expect(apple?.companyName).toContain("Apple");
  });

  it("should search tickers by company name", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.tickers.search({ query: "Microsoft" });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    const msft = results.find(t => t.symbol === "MSFT");
    expect(msft).toBeDefined();
  });

  it("should get ticker by symbol", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const ticker = await caller.tickers.getBySymbol({ symbol: "AAPL" });

    expect(ticker).toBeDefined();
    expect(ticker?.symbol).toBe("AAPL");
    expect(ticker?.companyName).toContain("Apple");
    expect(ticker?.sector).toBe("Technology");
  });

  it("should get financial data for ticker", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const data = await caller.tickers.getFinancialData({ symbol: "AAPL" });

    expect(data).toBeDefined();
    expect(data?.price).toBeDefined();
    expect(data?.price?.current).toBeGreaterThan(0);
    expect(data?.profile).toBeDefined();
    expect(data?.ratios).toBeDefined();
    expect(data?.financials).toBeDefined();
    expect(Array.isArray(data?.financials)).toBe(true);
  });

  it("should return null for non-existent ticker", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const ticker = await caller.tickers.getBySymbol({ symbol: "INVALID" });

    expect(ticker).toBeUndefined();
  });
});

describe("analyses router", () => {
  it("should run analysis for a ticker", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analyses.runAnalysis({
      symbol: "AAPL",
      mode: "quick",
    });

    expect(result).toBeDefined();
    expect(result.analyses).toBeDefined();
    expect(Array.isArray(result.analyses)).toBe(true);
    expect(result.analyses.length).toBeGreaterThan(0);

    // Check first analysis structure
    const analysis = result.analyses[0];
    expect(analysis.ticker).toBe("AAPL");
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
    expect(analysis.verdict).toBeDefined();
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(analysis.summaryBullets)).toBe(true);
    expect(Array.isArray(analysis.criteria)).toBe(true);
    expect(Array.isArray(analysis.keyRisks)).toBe(true);
    expect(Array.isArray(analysis.whatWouldChangeMind)).toBe(true);
  });

  it("should run analysis for specific personas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Get Warren Buffett persona
    const personas = await caller.personas.list();
    const buffett = personas.find(p => p.personaId === "warren_buffett");
    expect(buffett).toBeDefined();

    const result = await caller.analyses.runAnalysis({
      symbol: "AAPL",
      personaIds: [buffett!.id],
      mode: "quick",
    });

    expect(result.analyses.length).toBe(1);
    expect(result.analyses[0].personaId).toBe("warren_buffett");
  });

  it("should get latest analyses for ticker", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // First run an analysis
    await caller.analyses.runAnalysis({
      symbol: "MSFT",
      mode: "quick",
    });

    // Then retrieve it
    const analyses = await caller.analyses.getLatestForTicker({ symbol: "MSFT" });

    expect(analyses).toBeDefined();
    expect(Array.isArray(analyses)).toBe(true);
    expect(analyses.length).toBeGreaterThan(0);
  });

  it("should enforce structured output schema", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analyses.runAnalysis({
      symbol: "NVDA",
      mode: "quick",
    });

    const analysis = result.analyses[0];

    // Verify all required fields exist
    expect(analysis).toHaveProperty("id");
    expect(analysis).toHaveProperty("runId");
    expect(analysis).toHaveProperty("ticker");
    expect(analysis).toHaveProperty("personaId");
    expect(analysis).toHaveProperty("personaName");
    expect(analysis).toHaveProperty("score");
    expect(analysis).toHaveProperty("verdict");
    expect(analysis).toHaveProperty("confidence");
    expect(analysis).toHaveProperty("summaryBullets");
    expect(analysis).toHaveProperty("criteria");
    expect(analysis).toHaveProperty("keyRisks");
    expect(analysis).toHaveProperty("whatWouldChangeMind");
    expect(analysis).toHaveProperty("dataUsed");
    expect(analysis).toHaveProperty("runMetadata");
    expect(analysis).toHaveProperty("runTimestamp");

    // Verify criteria structure
    expect(analysis.criteria.length).toBeGreaterThan(0);
    const criterion = analysis.criteria[0];
    expect(criterion).toHaveProperty("name");
    expect(criterion).toHaveProperty("weight");
    expect(criterion).toHaveProperty("status");
    expect(criterion).toHaveProperty("metricsUsed");
    expect(criterion).toHaveProperty("explanation");
    expect(["pass", "fail", "partial"]).toContain(criterion.status);

    // Verify run metadata structure
    expect(analysis.runMetadata).toHaveProperty("model");
    expect(analysis.runMetadata).toHaveProperty("version");
    expect(analysis.runMetadata).toHaveProperty("runTime");
    expect(analysis.runMetadata).toHaveProperty("inputsHash");
    expect(analysis.runMetadata).toHaveProperty("mode");
  });
});
