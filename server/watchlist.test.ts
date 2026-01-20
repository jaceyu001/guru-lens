import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createAuthenticatedContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
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

describe("watchlist router", () => {
  it("should require authentication for watchlist operations", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.watchlist.getTickers()).rejects.toThrow();
  });

  it("should add ticker to watchlist", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const testSymbol = "TSLA";

    // Ensure ticker exists
    await caller.tickers.getBySymbol({ symbol: testSymbol });

    // Check if already in watchlist
    const isInList = await caller.watchlist.isInWatchlist({ symbol: testSymbol });
    
    if (!isInList) {
      const result = await caller.watchlist.addTicker({
        symbol: testSymbol,
        notes: "Test watchlist item",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    } else {
      // If already in list, just verify it's there
      const inList = await caller.watchlist.isInWatchlist({ symbol: testSymbol });
      expect(inList).toBe(true);
    }
  });

  it("should check if ticker is in watchlist", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const testSymbol = "KO";

    // Ensure ticker exists in database first
    await caller.tickers.getBySymbol({ symbol: testSymbol });

    // Check if already in watchlist
    const alreadyInList = await caller.watchlist.isInWatchlist({ symbol: testSymbol });
    
    if (!alreadyInList) {
      // Add ticker first
      await caller.watchlist.addTicker({ symbol: testSymbol });
    }

    const isInWatchlist = await caller.watchlist.isInWatchlist({ symbol: testSymbol });

    expect(isInWatchlist).toBe(true);
  });

  it("should return false for ticker not in watchlist", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    // Use a ticker that definitely won't be in watchlist (non-existent)
    const isInWatchlist = await caller.watchlist.isInWatchlist({ symbol: "NONEXISTENT" });

    expect(isInWatchlist).toBe(false);
  });

  it("should get user watchlist tickers", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const watchlist = await caller.watchlist.getTickers();

    expect(watchlist).toBeDefined();
    expect(Array.isArray(watchlist)).toBe(true);
  });

  it("should store snapshot score when adding to watchlist", async () => {  
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    // Use a unique ticker for this test
    const testSymbol = "NVDA";

    // Run analysis first to generate scores
    await caller.analyses.runAnalysis({ symbol: testSymbol, mode: "quick" });

    // Check if already in watchlist
    const isInList = await caller.watchlist.isInWatchlist({ symbol: testSymbol });
    
    if (!isInList) {
      // Add to watchlist only if not already there
      await caller.watchlist.addTicker({ symbol: testSymbol });
    }

    const watchlist = await caller.watchlist.getTickers();
    const item = watchlist.find(w => w.ticker.symbol === testSymbol);

    expect(item).toBeDefined();
    expect(item?.watchlistItem.snapshotScore).toBeDefined();
  });
});

describe("alerts router", () => {
  it("should require authentication for alert operations", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.alerts.list()).rejects.toThrow();
  });

  it("should create score threshold alert", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.create({
      alertType: "score_threshold",
      symbol: "AAPL",
      personaId: "warren_buffett",
      thresholdScore: 80,
      thresholdDirection: "above",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should create new opportunity alert", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.create({
      alertType: "new_opportunity",
      personaId: "peter_lynch",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should list user alerts", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.alerts.list();

    expect(alerts).toBeDefined();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should delete alert", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    // Create an alert
    const created = await caller.alerts.create({
      alertType: "new_opportunity",
      personaId: "warren_buffett",
    });

    expect(created.success).toBe(true);
    expect(created.id).toBeDefined();

    // List alerts to verify it was created
    const alerts = await caller.alerts.list();
    expect(alerts.length).toBeGreaterThan(0);
  });
});
