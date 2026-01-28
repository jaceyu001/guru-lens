import { describe, it, expect } from "vitest";

/**
 * Sanitize numeric value: convert NaN, Infinity, null, undefined to 0
 */
function sanitizeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (!isFinite(num)) return 0;
  return num;
}

/**
 * Sanitize string value: convert null, undefined to empty string or null
 */
function sanitizeString(value: any): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

describe("NaN Sanitization for Database Storage", () => {
  describe("sanitizeNumber", () => {
    it("should convert NaN to 0", () => {
      expect(sanitizeNumber(NaN)).toBe(0);
    });

    it("should convert Infinity to 0", () => {
      expect(sanitizeNumber(Infinity)).toBe(0);
    });

    it("should convert -Infinity to 0", () => {
      expect(sanitizeNumber(-Infinity)).toBe(0);
    });

    it("should convert null to 0", () => {
      expect(sanitizeNumber(null)).toBe(0);
    });

    it("should convert undefined to 0", () => {
      expect(sanitizeNumber(undefined)).toBe(0);
    });

    it("should preserve valid numbers", () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber(3.14)).toBe(3.14);
      expect(sanitizeNumber(-100)).toBe(-100);
      expect(sanitizeNumber(0)).toBe(0);
    });

    it("should convert string numbers to numbers", () => {
      expect(sanitizeNumber("42")).toBe(42);
      expect(sanitizeNumber("3.14")).toBe(3.14);
    });

    it("should convert invalid strings to 0", () => {
      expect(sanitizeNumber("abc")).toBe(0);
      expect(sanitizeNumber("")).toBe(0);
    });
  });

  describe("sanitizeString", () => {
    it("should convert null to null", () => {
      expect(sanitizeString(null)).toBe(null);
    });

    it("should convert undefined to null", () => {
      expect(sanitizeString(undefined)).toBe(null);
    });

    it("should preserve valid strings", () => {
      expect(sanitizeString("Apple Inc")).toBe("Apple Inc");
      expect(sanitizeString("Technology")).toBe("Technology");
      expect(sanitizeString("")).toBe("");
    });

    it("should convert numbers to strings", () => {
      expect(sanitizeString(42)).toBe("42");
      expect(sanitizeString(3.14)).toBe("3.14");
    });

    it("should convert booleans to strings", () => {
      expect(sanitizeString(true)).toBe("true");
      expect(sanitizeString(false)).toBe("false");
    });
  });

  describe("Financial Data Sanitization", () => {
    it("should sanitize all ratio fields correctly", () => {
      const dirtyData = {
        peRatio: NaN,
        pbRatio: Infinity,
        psRatio: undefined,
        roe: null,
        roa: 0.15,
        roic: "0.12",
      };

      const sanitized = {
        peRatio: sanitizeNumber(dirtyData.peRatio),
        pbRatio: sanitizeNumber(dirtyData.pbRatio),
        psRatio: sanitizeNumber(dirtyData.psRatio),
        roe: sanitizeNumber(dirtyData.roe),
        roa: sanitizeNumber(dirtyData.roa),
        roic: sanitizeNumber(dirtyData.roic),
      };

      expect(sanitized.peRatio).toBe(0);
      expect(sanitized.pbRatio).toBe(0);
      expect(sanitized.psRatio).toBe(0);
      expect(sanitized.roe).toBe(0);
      expect(sanitized.roa).toBe(0.15);
      expect(sanitized.roic).toBe(0.12);
    });

    it("should sanitize all string fields correctly", () => {
      const dirtyData = {
        companyName: null,
        sector: undefined,
        industry: "Software",
        exchange: "NASDAQ",
      };

      const sanitized = {
        companyName: sanitizeString(dirtyData.companyName),
        sector: sanitizeString(dirtyData.sector),
        industry: sanitizeString(dirtyData.industry),
        exchange: sanitizeString(dirtyData.exchange),
      };

      expect(sanitized.companyName).toBe(null);
      expect(sanitized.sector).toBe(null);
      expect(sanitized.industry).toBe("Software");
      expect(sanitized.exchange).toBe("NASDAQ");
    });

    it("should handle complete financial data with mixed valid and invalid values", () => {
      const financialData = {
        profile: {
          companyName: "Apple Inc",
          sector: "Technology",
          industry: null,
          exchange: "NASDAQ",
          currency: undefined,
          marketCap: 3000000000000,
        },
        quote: {
          price: 180.5,
          volume: NaN,
        },
        ratios: {
          pe: 28.5,
          pb: Infinity,
          ps: undefined,
          roe: 0.85,
          roa: NaN,
          roic: 0.35,
          grossMargin: null,
          operatingMargin: 0.31,
          netMargin: 0.25,
          debtToEquity: "0.15",
          currentRatio: 1.2,
          dividendYield: undefined,
        },
      };

      const cacheData = {
        ticker: "AAPL",
        companyName: sanitizeString(financialData.profile.companyName),
        sector: sanitizeString(financialData.profile.sector),
        industry: sanitizeString(financialData.profile.industry),
        exchange: sanitizeString(financialData.profile.exchange),
        currency: sanitizeString(financialData.profile.currency) || "USD",
        currentPrice: sanitizeNumber(financialData.quote.price),
        marketCap: sanitizeNumber(financialData.profile.marketCap),
        volume: sanitizeNumber(financialData.quote.volume),
        peRatio: sanitizeNumber(financialData.ratios.pe),
        pbRatio: sanitizeNumber(financialData.ratios.pb),
        psRatio: sanitizeNumber(financialData.ratios.ps),
        roe: sanitizeNumber(financialData.ratios.roe),
        roa: sanitizeNumber(financialData.ratios.roa),
        roic: sanitizeNumber(financialData.ratios.roic),
        grossMargin: sanitizeNumber(financialData.ratios.grossMargin),
        operatingMargin: sanitizeNumber(financialData.ratios.operatingMargin),
        netMargin: sanitizeNumber(financialData.ratios.netMargin),
        debtToEquity: sanitizeNumber(financialData.ratios.debtToEquity),
        currentRatio: sanitizeNumber(financialData.ratios.currentRatio),
        dividendYield: sanitizeNumber(financialData.ratios.dividendYield),
      };

      // Verify all values are valid for database storage
      expect(cacheData.companyName).toBe("Apple Inc");
      expect(cacheData.sector).toBe("Technology");
      expect(cacheData.industry).toBe(null);
      expect(cacheData.exchange).toBe("NASDAQ");
      expect(cacheData.currency).toBe("USD");
      expect(cacheData.currentPrice).toBe(180.5);
      expect(cacheData.marketCap).toBe(3000000000000);
      expect(cacheData.volume).toBe(0); // NaN converted to 0
      expect(cacheData.peRatio).toBe(28.5);
      expect(cacheData.pbRatio).toBe(0); // Infinity converted to 0
      expect(cacheData.psRatio).toBe(0); // undefined converted to 0
      expect(cacheData.roe).toBe(0.85);
      expect(cacheData.roa).toBe(0); // NaN converted to 0
      expect(cacheData.roic).toBe(0.35);
      expect(cacheData.grossMargin).toBe(0); // null converted to 0
      expect(cacheData.operatingMargin).toBe(0.31);
      expect(cacheData.netMargin).toBe(0.25);
      expect(cacheData.debtToEquity).toBe(0.15); // string "0.15" converted to number
      expect(cacheData.currentRatio).toBe(1.2);
      expect(cacheData.dividendYield).toBe(0); // undefined converted to 0

      // Verify no NaN or Infinity values exist in the cache data
      Object.entries(cacheData).forEach(([key, value]) => {
        if (typeof value === "number") {
          expect(isFinite(value)).toBe(true);
          expect(Number.isNaN(value)).toBe(false);
        }
      });
    });

    it("should ensure all numeric fields are database-safe", () => {
      const testCases = [
        { input: NaN, expected: 0, description: "NaN" },
        { input: Infinity, expected: 0, description: "Infinity" },
        { input: -Infinity, expected: 0, description: "-Infinity" },
        { input: null, expected: 0, description: "null" },
        { input: undefined, expected: 0, description: "undefined" },
        { input: 0, expected: 0, description: "zero" },
        { input: -0, expected: 0, description: "negative zero" },
        { input: 1.23456789, expected: 1.23456789, description: "decimal number" },
        { input: -999.99, expected: -999.99, description: "negative number" },
      ];

      testCases.forEach(({ input, expected, description }) => {
        const result = sanitizeNumber(input);
        // Handle -0 vs 0 case - both are acceptable
        if (expected === 0 && (input === 0 || input === -0)) {
          expect(result === 0 || result === -0).toBe(true);
        } else {
          expect(result).toBe(expected);
        }
        expect(isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      });
    });
  });
});
