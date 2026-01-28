import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getStockData } from "./alphaVantageWrapper";
import { getFinancialDataWithFallback } from "./cacheFirstDataFetcher";

/**
 * Comprehensive test suite for Alpha Vantage API integration
 * Tests the entire data flow from API parsing through agent usage
 */
describe("Alpha Vantage API Integration", () => {
  const testTickers = ["AAPL", "MSFT", "GOOGL"];

  describe("API Response Parsing", () => {
    it("should parse GLOBAL_QUOTE price field correctly", async () => {
      const data = await getStockData("AAPL");
      
      expect(data).toBeDefined();
      expect(data.ticker).toBe("AAPL");
      expect(data.quote).toBeDefined();
      expect(data.quote.price).toBeDefined();
      expect(typeof data.quote.price).toBe("number");
      expect(data.quote.price).toBeGreaterThan(0);
      
      console.log(`✓ AAPL price parsed correctly: $${data.quote.price}`);
    });

    it("should parse OVERVIEW ratios correctly", async () => {
      const data = await getStockData("AAPL");
      
      expect(data.ratios).toBeDefined();
      expect(data.ratios.pe).toBeDefined();
      expect(data.ratios.pb).toBeDefined();
      expect(data.ratios.roe).toBeDefined();
      
      // Ratios can be null but if present should be numbers
      if (data.ratios.pe !== null) {
        expect(typeof data.ratios.pe).toBe("number");
        expect(data.ratios.pe).toBeGreaterThan(0);
      }
      
      console.log(`✓ AAPL ratios parsed: P/E=${data.ratios.pe}, P/B=${data.ratios.pb}, ROE=${data.ratios.roe}`);
    });

    it("should parse INCOME_STATEMENT financial data correctly", async () => {
      const data = await getStockData("AAPL");
      
      expect(data.financials).toBeDefined();
      expect(data.financials.annualReports).toBeDefined();
      expect(Array.isArray(data.financials.annualReports)).toBe(true);
      
      if (data.financials.annualReports.length > 0) {
        const latestReport = data.financials.annualReports[0];
        expect(latestReport.revenue).toBeDefined();
        expect(typeof latestReport.revenue).toBe("number");
        expect(latestReport.netIncome).toBeDefined();
        expect(typeof latestReport.netIncome).toBe("number");
        
        console.log(`✓ AAPL financials parsed: Revenue=${latestReport.revenue}, Net Income=${latestReport.netIncome}`);
      }
    });

    it("should parse BALANCE_SHEET data correctly", async () => {
      const data = await getStockData("AAPL");
      
      expect(data.balanceSheet).toBeDefined();
      expect(data.balanceSheet.annualReports).toBeDefined();
      expect(Array.isArray(data.balanceSheet.annualReports)).toBe(true);
      
      if (data.balanceSheet.annualReports.length > 0) {
        const latestReport = data.balanceSheet.annualReports[0];
        expect(latestReport.totalAssets).toBeDefined();
        expect(typeof latestReport.totalAssets).toBe("number");
        expect(latestReport.totalEquity).toBeDefined();
        expect(typeof latestReport.totalEquity).toBe("number");
        
        console.log(`✓ AAPL balance sheet parsed: Assets=${latestReport.totalAssets}, Equity=${latestReport.totalEquity}`);
      }
    });

    it("should parse CASH_FLOW data correctly", async () => {
      const data = await getStockData("AAPL");
      
      expect(data.cashFlow).toBeDefined();
      expect(data.cashFlow.annualReports).toBeDefined();
      expect(Array.isArray(data.cashFlow.annualReports)).toBe(true);
      
      if (data.cashFlow.annualReports.length > 0) {
        const latestReport = data.cashFlow.annualReports[0];
        expect(latestReport.operatingCashFlow).toBeDefined();
        expect(typeof latestReport.operatingCashFlow).toBe("number");
        
        console.log(`✓ AAPL cash flow parsed: Operating CF=${latestReport.operatingCashFlow}`);
      }
    });
  });

  describe("Cache Storage and Retrieval", () => {
    it("should store price correctly in cache", async () => {
      const result = await getFinancialDataWithFallback("AAPL", true);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.quote).toBeDefined();
      expect(result.data.quote.price).toBeDefined();
      expect(result.data.quote.price).toBeGreaterThan(0);
      
      console.log(`✓ Cache stored price correctly: $${result.data.quote.price}`);
    });

    it("should retrieve cached data with correct structure", async () => {
      // First fetch to populate cache
      await getFinancialDataWithFallback("MSFT", true);
      
      // Second fetch should use cache
      const result = await getFinancialDataWithFallback("MSFT", false);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.ticker).toBe("MSFT");
      expect(result.data.quote).toBeDefined();
      expect(result.data.quote.price).toBeGreaterThan(0);
      expect(result.data.ratios).toBeDefined();
      
      console.log(`✓ Cache retrieval successful for MSFT: $${result.data.quote.price}`);
    });
  });

  describe("Data Flow to Agents", () => {
    it("should provide complete data for Fundamentals Agent", async () => {
      const result = await getFinancialDataWithFallback("GOOGL", true);
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Fundamentals agent needs:
      // - Revenue and net income for growth calculation
      // - Margins for profitability assessment
      // - ROE for capital efficiency
      
      expect(data.financials).toBeDefined();
      expect(data.financials.annualReports).toBeDefined();
      expect(data.financials.annualReports.length).toBeGreaterThan(0);
      
      const latestReport = data.financials.annualReports[0];
      expect(latestReport.revenue).toBeDefined();
      expect(latestReport.netIncome).toBeDefined();
      
      expect(data.ratios).toBeDefined();
      expect(data.ratios.netMargin).toBeDefined();
      expect(data.ratios.roe).toBeDefined();
      
      console.log(`✓ Fundamentals Agent data complete for GOOGL`);
    });

    it("should provide complete data for Valuation Agent", async () => {
      const result = await getFinancialDataWithFallback("AAPL", true);
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Valuation agent needs:
      // - Current price for valuation methods
      // - Financial statements for DCF
      // - Balance sheet for asset-based valuation
      // - Cash flow for free cash flow calculation
      
      expect(data.quote).toBeDefined();
      expect(data.quote.price).toBeGreaterThan(0);
      
      expect(data.financials).toBeDefined();
      expect(data.financials.annualReports.length).toBeGreaterThan(0);
      
      expect(data.balanceSheet).toBeDefined();
      expect(data.balanceSheet.annualReports.length).toBeGreaterThan(0);
      
      expect(data.cashFlow).toBeDefined();
      expect(data.cashFlow.annualReports.length).toBeGreaterThan(0);
      
      console.log(`✓ Valuation Agent data complete for AAPL`);
    });

    it("should provide complete data for Persona Ratings", async () => {
      const result = await getFinancialDataWithFallback("MSFT", true);
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Persona ratings need:
      // - Price and ratios (P/E, P/B, ROE, etc.)
      // - Financial metrics (margins, growth)
      // - Balance sheet metrics (debt, equity)
      
      expect(data.quote).toBeDefined();
      expect(data.quote.price).toBeGreaterThan(0);
      
      expect(data.ratios).toBeDefined();
      expect(data.ratios.pe).toBeDefined();
      expect(data.ratios.pb).toBeDefined();
      expect(data.ratios.roe).toBeDefined();
      expect(data.ratios.debtToEquity).toBeDefined();
      
      expect(data.financials).toBeDefined();
      expect(data.balanceSheet).toBeDefined();
      
      console.log(`✓ Persona Ratings data complete for MSFT`);
    });
  });

  describe("Data Quality and Validation", () => {
    it("should handle missing data gracefully", async () => {
      const result = await getFinancialDataWithFallback("AAPL", true);
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Some ratios might be null, but structure should be intact
      expect(data.ratios).toBeDefined();
      expect(Object.keys(data.ratios).length).toBeGreaterThan(0);
      
      console.log(`✓ Missing data handled gracefully`);
    });

    it("should not have NaN or Infinity values in numeric fields", async () => {
      const result = await getFinancialDataWithFallback("AAPL", true);
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Check quote values
      expect(isFinite(data.quote.price)).toBe(true);
      expect(isFinite(data.quote.volume)).toBe(true);
      
      // Check ratios
      Object.entries(data.ratios).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          expect(isFinite(value as number)).toBe(true);
        }
      });
      
      console.log(`✓ No NaN or Infinity values found`);
    });
  });

  describe("Multi-Ticker Batch Processing", () => {
    it("should fetch data for multiple tickers without errors", async () => {
      const results = await Promise.all(
        testTickers.map(ticker => getFinancialDataWithFallback(ticker, true))
      );
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.quote.price).toBeGreaterThan(0);
      });
      
      console.log(`✓ Successfully fetched data for ${testTickers.length} tickers`);
    });
  });
});
