import { describe, it, expect, vi } from "vitest";
import { buildEnrichedPrompt } from "./aiAnalysisEngine";
import type { FinancialData, FundamentalsFindings, ValuationFindings } from "../../shared/types";

// Mock financial data
const createMockFinancialData = (overrides?: Partial<FinancialData>): FinancialData => ({
  ticker: "TEST",
  currentPrice: 100,
  sharesOutstanding: 1000,
  financials: [
    {
      revenue: 50000,
      netIncome: 10000,
      operatingIncome: 12000,
      grossProfit: 25000,
      eps: 10,
      fcf: 8000,
    },
  ],
  ratios: {
    pe: 10,
    pb: 2,
    ps: 5,
    roe: 50,
    roic: 25,
    debtToEquity: 0.5,
    currentRatio: 1.5,
    interestCoverage: 5,
    fcfMargin: 16,
    netMargin: 20,
    operatingMargin: 24,
    grossMargin: 50,
  },
  growth: {
    revenueGrowth: 10,
    earningsGrowth: 15,
    fcfGrowth: 12,
  },
  dataQualityFlags: {
    peAnomalous: false,
    pbAnomalous: false,
    psAnomalous: false,
    roeAnomalous: false,
    roicZero: false,
    debtToEquityAnomalous: false,
    currentRatioAnomalous: false,
    interestCoverageZero: false,
    fcfMarginAnomalous: false,
    netMarginAnomalous: false,
  },
  ...overrides,
});

// Mock fundamentals findings
const createMockFundamentalsFindings = (
  overrides?: Partial<FundamentalsFindings>
): FundamentalsFindings => ({
  ticker: "TEST",
  findings: {
    growth: {
      assessment: "MODERATE",
      details: "Revenue growing at 10% YoY",
      keyMetrics: {
        revenueGrowth: 10,
        earningsGrowth: 15,
        fcfGrowth: 12,
      },
      confidence: 85,
    },
    profitability: {
      assessment: "EXCELLENT",
      details: "Net margin of 20% is strong",
      keyMetrics: {
        netMargin: 20,
        operatingMargin: 24,
        grossMargin: 50,
      },
      confidence: 90,
    },
    capitalEfficiency: {
      assessment: "GOOD",
      details: "ROE of 50% is healthy",
      keyMetrics: {
        roe: 50,
        roic: 25,
      },
      confidence: 85,
    },
    financialHealth: {
      assessment: "STABLE",
      details: "D/E of 0.5 is conservative",
      keyMetrics: {
        debtToEquity: 0.5,
        currentRatio: 1.5,
        interestCoverage: 5,
      },
      confidence: 80,
    },
    cashFlow: {
      assessment: "STRONG",
      details: "FCF margin of 16% is solid",
      keyMetrics: {
        fcfMargin: 16,
        fcfGrowth: 12,
      },
      confidence: 85,
    },
  },
  summary: "Strong fundamentals with healthy growth and profitability",
  dataQualityWarnings: [],
  recommendationsForPersonas: {
    strength: ["Strong profitability", "Healthy growth"],
    weakness: [],
    unavailableMetrics: [],
  },
  ...overrides,
});

// Mock valuation findings
const createMockValuationFindings = (
  overrides?: Partial<ValuationFindings>
): ValuationFindings => ({
  ticker: "TEST",
  findings: {
    methods: [
      {
        name: "Comparable",
        intrinsicValue: 75,
        upside: -25,
        assessment: "OVERVALUED",
        confidence: 75,
        narrative: "Stock appears overvalued at current price",
        assumptions: {},
        limitations: [],
      },
    ],
    consensusValuation: {
      intrinsicValue: 75,
      upside: -25,
      assessment: "OVERVALUED",
    },
    methodAgreement: {
      score: 75,
      assessment: "STRONG",
    },
    marginOfSafety: {
      percentage: -25,
      assessment: "Low",
    },
    confidence: 75,
  },
  summary: "Stock appears overvalued at current price",
  dataQualityWarnings: [],
  recommendationsForPersonas: {
    strengths: [],
    concerns: ["Stock trading at premium to intrinsic value"],
  },
  ...overrides,
});

describe("aiAnalysisEngine", () => {
  describe("buildEnrichedPrompt", () => {
    it("should build a prompt with financial data", () => {
      const financialData = createMockFinancialData();
      const prompt = buildEnrichedPrompt(
        "Test Persona",
        financialData,
        undefined,
        undefined
      );

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("should include ticker in prompt", () => {
      const financialData = createMockFinancialData({ ticker: "AAPL" });
      const prompt = buildEnrichedPrompt(
        "Test Persona",
        financialData,
        undefined,
        undefined
      );

      expect(prompt).toContain("AAPL");
    });

    it("should include current price in prompt", () => {
      const financialData = createMockFinancialData({ currentPrice: 150 });
      const prompt = buildEnrichedPrompt(
        "Test Persona",
        financialData,
        undefined,
        undefined
      );

      expect(prompt).toContain("150");
    });

    it("should include financial metrics in prompt", () => {
      const financialData = createMockFinancialData();
      const prompt = buildEnrichedPrompt(
        "Test Persona",
        financialData,
        undefined,
        undefined
      );

      // Should include key metrics
      expect(prompt).toContain("P/E");
      expect(prompt).toContain("P/B");
    });

    describe("Fundamentals Enrichment", () => {
      it("should include fundamentals findings when provided", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("Fundamentals");
      });

      it("should include growth assessment from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings({
          findings: {
            ...createMockFundamentalsFindings().findings,
            growth: {
              assessment: "STRONG",
              details: "Revenue growing at 20% YoY",
              keyMetrics: {
                revenueGrowth: 20,
                earningsGrowth: 25,
                fcfGrowth: 18,
              },
              confidence: 90,
            },
          },
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("STRONG");
        expect(prompt).toContain("20");
      });

      it("should include profitability assessment from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("EXCELLENT");
      });

      it("should include capital efficiency from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("ROE");
      });

      it("should include financial health from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("Debt");
      });

      it("should include cash flow from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("FCF");
      });

      it("should include fundamentals recommendations", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings({
          recommendationsForPersonas: {
            strength: ["Strong profitability", "Healthy growth"],
            weakness: ["Slowing growth"],
            unavailableMetrics: [],
          },
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("profitability");
      });

      it("should include data quality warnings from fundamentals", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings({
          dataQualityWarnings: [
            {
              metric: "ROE",
              issue: "Anomalously high",
              impact: "May not reflect true capital efficiency",
            },
          ],
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("ROE");
      });
    });

    describe("Valuation Enrichment", () => {
      it("should include valuation findings when provided", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("Valuation");
      });

      it("should include intrinsic value from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings({
          findings: {
            ...createMockValuationFindings().findings,
            consensusValuation: {
              intrinsicValue: 85,
              upside: -15,
              assessment: "OVERVALUED",
            },
          },
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("85");
      });

      it("should include upside potential from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("upside");
      });

      it("should include valuation assessment from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("OVERVALUED");
      });

      it("should include margin of safety from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("margin");
      });

      it("should include method agreement from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("STRONG");
      });

      it("should include valuation recommendations", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings({
          recommendationsForPersonas: {
            strengths: ["Reasonable valuation"],
            concerns: ["Stock trading at premium"],
          },
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("premium");
      });

      it("should include data quality warnings from valuation", () => {
        const financialData = createMockFinancialData();
        const valuation = createMockValuationFindings({
          dataQualityWarnings: [
            {
              metric: "FCF",
              issue: "Data unavailable",
              impact: "DCF valuation not calculated",
            },
          ],
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          valuation
        );

        expect(prompt).toContain("FCF");
      });
    });

    describe("Combined Enrichment", () => {
      it("should include both fundamentals and valuation findings", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toContain("Fundamentals");
        expect(prompt).toContain("Valuation");
      });

      it("should create coherent narrative with both agents", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings({
          findings: {
            ...createMockFundamentalsFindings().findings,
            growth: {
              assessment: "STRONG",
              details: "Revenue growing at 20% YoY",
              keyMetrics: {
                revenueGrowth: 20,
                earningsGrowth: 25,
                fcfGrowth: 18,
              },
              confidence: 90,
            },
          },
        });
        const valuation = createMockValuationFindings({
          findings: {
            ...createMockValuationFindings().findings,
            consensusValuation: {
              intrinsicValue: 120,
              upside: 20,
              assessment: "UNDERVALUED",
            },
          },
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          valuation
        );

        // Should have both strong growth and undervalued signals
        expect(prompt).toContain("STRONG");
        expect(prompt).toContain("UNDERVALUED");
      });
    });

    describe("Persona-Specific Enrichment", () => {
      it("should work with Warren Buffett persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Warren Buffett",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("should work with Benjamin Graham persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Benjamin Graham",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("should work with Peter Lynch persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Peter Lynch",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("should work with Cathie Wood persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Cathie Wood",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("should work with Ray Dalio persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Ray Dalio",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("should work with Philip Fisher persona", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Philip Fisher",
          financialData,
          fundamentals,
          valuation
        );

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    describe("Prompt Quality", () => {
      it("should produce readable prompt", () => {
        const financialData = createMockFinancialData();
        const fundamentals = createMockFundamentalsFindings();
        const valuation = createMockValuationFindings();

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          valuation
        );

        // Should not have excessive newlines or formatting issues
        expect(prompt.split("\n\n").length).toBeLessThan(50);
      });

      it("should not include undefined values in prompt", () => {
        const financialData = createMockFinancialData();
        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          undefined,
          undefined
        );

        expect(prompt).not.toContain("undefined");
      });

      it("should include context about data quality", () => {
        const financialData = createMockFinancialData({
          dataQualityFlags: {
            ...createMockFinancialData().dataQualityFlags!,
            roeAnomalous: true,
          },
        });
        const fundamentals = createMockFundamentalsFindings({
          dataQualityWarnings: [
            {
              metric: "ROE",
              issue: "Anomalously high",
              impact: "May not reflect true capital efficiency",
            },
          ],
        });

        const prompt = buildEnrichedPrompt(
          "Test Persona",
          financialData,
          fundamentals,
          undefined
        );

        expect(prompt).toContain("data quality");
      });
    });
  });
});
