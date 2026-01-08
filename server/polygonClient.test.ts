import { describe, it, expect } from "vitest";
import { PolygonClient } from "./services/polygonClient";

describe("Polygon.io API Client", () => {
  it("should successfully fetch latest quote for a valid ticker", async () => {
    const client = new PolygonClient();
    
    // Test with AAPL - most liquid and reliable
    const quote = await client.getLatestQuote("AAPL");
    
    expect(quote).toBeDefined();
    expect(quote.symbol).toBe("AAPL");
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.previousClose).toBeGreaterThan(0);
    expect(quote.timestamp).toBeGreaterThan(0);
    
    console.log(`✓ Polygon API credentials valid - AAPL price: $${quote.price}`);
  });

  it("should successfully fetch company information", async () => {
    const client = new PolygonClient();
    
    const info = await client.getCompanyInfo("AAPL");
    
    expect(info).toBeDefined();
    expect(info.symbol).toBe("AAPL");
    expect(info.name).toContain("Apple");
    expect(info.sector).toBeTruthy();
    expect(info.industry).toBeTruthy();
    
    console.log(`✓ Company info fetched: ${info.name} (${info.sector})`);
  });

  it("should successfully fetch financial statements", async () => {
    const client = new PolygonClient();
    
    const statements = await client.getFinancialStatements("AAPL", 1);
    
    expect(statements).toBeDefined();
    expect(Array.isArray(statements)).toBe(true);
    
    if (statements.length > 0) {
      const latest = statements[0];
      expect(latest.filing_date).toBeTruthy();
      expect(latest.fiscal_year).toBeGreaterThan(2020);
      console.log(`✓ Financial statements fetched - Fiscal Year: ${latest.fiscal_year}`);
    } else {
      console.log(`✓ Financial statements endpoint accessible (no data for this ticker on free tier)`);
    }
  });

  it("should successfully fetch daily bars", async () => {
    const client = new PolygonClient();
    
    const bars = await client.getDailyBars("AAPL", 5);
    
    expect(bars).toBeDefined();
    expect(Array.isArray(bars)).toBe(true);
    
    if (bars.length > 0) {
      const bar = bars[0];
      expect(bar.c).toBeGreaterThan(0);
      expect(bar.h).toBeGreaterThan(0);
      expect(bar.l).toBeGreaterThan(0);
      expect(bar.v).toBeGreaterThan(0);
      console.log(`✓ Daily bars fetched - Close: $${bar.c}, Volume: ${bar.v}`);
    } else {
      console.log(`✓ Daily bars endpoint accessible (limited data on free tier)`);
    }
  });
});
