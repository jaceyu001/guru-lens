import { describe, it, expect } from "vitest";
import { FMPClient } from "./services/fmpClient";

describe("FMP API Client", () => {
  it("should successfully fetch quote data for a valid ticker", async () => {
    const client = new FMPClient();
    
    // Test with AAPL - most liquid and reliable
    const quote = await client.getQuote("AAPL");
    
    expect(quote).toBeDefined();
    expect(quote.symbol).toBe("AAPL");
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.marketCap).toBeGreaterThan(0);
    expect(quote.pe).toBeGreaterThan(0);
    
    console.log(`✓ FMP API credentials valid - AAPL price: $${quote.price}`);
  });

  it("should successfully fetch company profile", async () => {
    const client = new FMPClient();
    
    const profile = await client.getProfile("AAPL");
    
    expect(profile).toBeDefined();
    expect(profile.symbol).toBe("AAPL");
    expect(profile.companyName).toBe("Apple Inc.");
    expect(profile.sector).toBe("Technology");
    expect(profile.industry).toBe("Consumer Electronics");
    
    console.log(`✓ Company profile fetched: ${profile.companyName}`);
  });

  it("should successfully fetch income statement", async () => {
    const client = new FMPClient();
    
    const statements = await client.getIncomeStatement("AAPL", "annual", 1);
    
    expect(statements).toBeDefined();
    expect(Array.isArray(statements)).toBe(true);
    expect(statements.length).toBeGreaterThan(0);
    
    const latest = statements[0];
    expect(latest.symbol).toBe("AAPL");
    expect(latest.revenue).toBeGreaterThan(0);
    expect(latest.netIncome).toBeGreaterThan(0);
    
    console.log(`✓ Income statement fetched - Revenue: $${(latest.revenue / 1e9).toFixed(1)}B`);
  });

  it("should successfully fetch key metrics", async () => {
    const client = new FMPClient();
    
    const metrics = await client.getKeyMetrics("AAPL", "annual", 1);
    
    expect(metrics).toBeDefined();
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
    
    const latest = metrics[0];
    expect(latest.symbol).toBe("AAPL");
    expect(latest.peRatio).toBeGreaterThan(0);
    expect(latest.roe).toBeGreaterThan(0);
    
    console.log(`✓ Key metrics fetched - P/E: ${latest.peRatio.toFixed(1)}, ROE: ${(latest.roe * 100).toFixed(1)}%`);
  });
});
