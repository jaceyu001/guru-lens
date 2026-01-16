import { describe, it, expect, vi } from "vitest";
import { getFinancialData } from "./financialData";
import type { FinancialData } from "../../shared/types";

describe("financialData", () => {
  describe("getFinancialData", () => {
    it("should return FinancialData type with all required fields", async () => {
      // Test with AAPL - this will fetch real data
      const data = await getFinancialData("AAPL");

      // Check all required fields exist
      expect(data.ticker).toBeDefined();
      expect(data.currentPrice).toBeDefined();
      expect(data.sharesOutstanding).toBeDefined();
      expect(data.financials).toBeDefined();
      expect(data.ratios).toBeDefined();
      expect(data.growth).toBeDefined();
      expect(data.dataQualityFlags).toBeDefined();
    }, 60000); // Increase timeout for API call

    describe("Data Type Validation", () => {
      it("should have correct types for all fields", async () => {
        const data = await getFinancialData("MSFT");

        expect(typeof data.ticker).toBe("string");
        expect(typeof data.currentPrice).toBe("number");
        expect(typeof data.sharesOutstanding).toBe("number");
        expect(Array.isArray(data.financials)).toBe(true);
        expect(typeof data.ratios).toBe("object");
        expect(typeof data.growth).toBe("object");
        expect(typeof data.dataQualityFlags).toBe("object");
      }, 60000);
    });

    describe("Financial Metrics", () => {
      it("should include positive price for liquid stocks", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.currentPrice).toBeGreaterThan(0);
        expect(data.currentPrice).toBeLessThan(10000); // Reasonable upper bound
      }, 60000);

      it("should include reasonable shares outstanding", async () => {
        const data = await getFinancialData("MSFT");

        expect(data.sharesOutstanding).toBeGreaterThan(100); // At least 100M shares
        expect(data.sharesOutstanding).toBeLessThan(100000); // Less than 100B shares
      }, 60000);

      it("should have positive revenue for operating companies", async () => {
        const data = await getFinancialData("AAPL");
        const latest = data.financials?.[0];

        expect(latest?.revenue).toBeGreaterThan(0);
      }, 60000);
    });

    describe("Data Quality Flags", () => {
      it("should include data quality flags object", async () => {
        const data = await getFinancialData("AAPL");

        expect(data.dataQualityFlags).toBeDefined();
        expect(typeof data.dataQualityFlags).toBe("object");
      }, 60000);

      it("should have boolean values for all quality flags", async () => {
        const data = await getFinancialData("MSFT");
        const flags = data.dataQualityFlags;

        if (flags) {
          Object.values(flags).forEach((value) => {
            expect(typeof value).toBe("boolean");
          });
        }
      }, 60000);
    });

    describe("Consistency Checks", () => {
      it("should have consistent ticker", async () => {
        const data = await getFinancialData("AAPL");
        expect(data.ticker).toBe("AAPL");
      }, 60000);

      it("should have consistent ticker for different stocks", async () => {
        const aapl = await getFinancialData("AAPL");
        const msft = await getFinancialData("MSFT");

        expect(aapl.ticker).toBe("AAPL");
        expect(msft.ticker).toBe("MSFT");
        expect(aapl.ticker).not.toBe(msft.ticker);
      }, 60000);
    });
  });
});
