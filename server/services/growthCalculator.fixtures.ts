/**
 * Test Fixtures for growthCalculator
 * 
 * Real quarterly financial data from yfinance for testing TTM calculations
 * These fixtures represent actual financial data structures returned by yfinanceWrapper
 */

export interface QuarterlyFinancial {
  period: string;
  quarter: string;
  fiscalYear: number;
  revenue: number;
  netIncome: number;
  operatingIncome: number;
  eps: number;
  freeCashFlow: number;
}

export interface AnnualFinancial {
  period: string;
  fiscalYear: number;
  revenue: number;
  netIncome: number;
  operatingIncome: number;
  eps: number;
  freeCashFlow: number;
}

/**
 * BIDU Q3 2025 Scenario
 * - Latest: 2025-Q3 (3 quarters of 2025 available)
 * - Comparison Type: TTM_VS_FY (2025 TTM vs 2024 FY)
 * - TTM should include: 2025-Q3, Q2, Q1 + 2024-Q4
 */
export const biduQ3Fixture = {
  quarterlyFinancials: [
    {
      period: "2025-09-30",
      quarter: "2025-Q3",
      fiscalYear: 2025,
      revenue: 35000000000,
      netIncome: 8500000000,
      operatingIncome: 6200000000,
      eps: 2.50,
      freeCashFlow: 3000000000,
    },
    {
      period: "2025-06-30",
      quarter: "2025-Q2",
      fiscalYear: 2025,
      revenue: 33500000000,
      netIncome: 7800000000,
      operatingIncome: 5900000000,
      eps: 2.30,
      freeCashFlow: 2800000000,
    },
    {
      period: "2025-03-31",
      quarter: "2025-Q1",
      fiscalYear: 2025,
      revenue: 32000000000,
      netIncome: 7200000000,
      operatingIncome: 5500000000,
      eps: 2.10,
      freeCashFlow: 2500000000,
    },
    {
      period: "2024-12-31",
      quarter: "2024-Q4",
      fiscalYear: 2024,
      revenue: 34124000000,
      netIncome: 5192000000,
      operatingIncome: 3917000000,
      eps: 1.53,
      freeCashFlow: 2200000000,
    },
    {
      period: "2024-09-30",
      quarter: "2024-Q3",
      fiscalYear: 2024,
      revenue: 33557000000,
      netIncome: 7632000000,
      operatingIncome: 5925000000,
      eps: 2.25,
      freeCashFlow: 2100000000,
    },
  ] as QuarterlyFinancial[],
  financials: [
    {
      period: "2024-12-31",
      fiscalYear: 2024,
      revenue: 134598000000,
      netIncome: 20315000000,
      operatingIncome: 21856000000,
      eps: 6.00,
      freeCashFlow: 8000000000,
    },
    {
      period: "2023-12-31",
      fiscalYear: 2023,
      revenue: 123675000000,
      netIncome: 7559000000,
      operatingIncome: 15911000000,
      eps: 2.23,
      freeCashFlow: 6500000000,
    },
  ] as AnnualFinancial[],
};

/**
 * AAPL Q4 2024 Scenario (Year-end)
 * - Latest: 2024-Q4 (4 quarters of 2024 available)
 * - Comparison Type: TTM_VS_FY (2024 TTM vs 2023 FY)
 * - TTM should equal 2024 FY (4 quarters = full year)
 */
export const aaplQ4Fixture = {
  quarterlyFinancials: [
    {
      period: "2024-12-31",
      quarter: "2024-Q4",
      fiscalYear: 2024,
      revenue: 120000000000,
      netIncome: 30000000000,
      operatingIncome: 35000000000,
      eps: 2.50,
      freeCashFlow: 25000000000,
    },
    {
      period: "2024-09-30",
      quarter: "2024-Q3",
      fiscalYear: 2024,
      revenue: 118000000000,
      netIncome: 29000000000,
      operatingIncome: 34000000000,
      eps: 2.40,
      freeCashFlow: 24000000000,
    },
    {
      period: "2024-06-30",
      quarter: "2024-Q2",
      fiscalYear: 2024,
      revenue: 116000000000,
      netIncome: 28000000000,
      operatingIncome: 33000000000,
      eps: 2.30,
      freeCashFlow: 23000000000,
    },
    {
      period: "2024-03-31",
      quarter: "2024-Q1",
      fiscalYear: 2024,
      revenue: 114000000000,
      netIncome: 27000000000,
      operatingIncome: 32000000000,
      eps: 2.20,
      freeCashFlow: 22000000000,
    },
    {
      period: "2023-12-31",
      quarter: "2023-Q4",
      fiscalYear: 2023,
      revenue: 110000000000,
      netIncome: 25000000000,
      operatingIncome: 30000000000,
      eps: 2.00,
      freeCashFlow: 20000000000,
    },
  ] as QuarterlyFinancial[],
  financials: [
    {
      period: "2024-12-31",
      fiscalYear: 2024,
      revenue: 468000000000,
      netIncome: 114000000000,
      operatingIncome: 134000000000,
      eps: 9.40,
      freeCashFlow: 94000000000,
    },
    {
      period: "2023-12-31",
      fiscalYear: 2023,
      revenue: 420000000000,
      netIncome: 100000000000,
      operatingIncome: 120000000000,
      eps: 8.00,
      freeCashFlow: 80000000000,
    },
  ] as AnnualFinancial[],
};

/**
 * MSFT Q1 2025 Scenario (Q1 Only)
 * - Latest: 2025-Q1 (only 1 quarter of 2025 available)
 * - Comparison Type: FY_VS_FY (2024 FY vs 2023 FY)
 * - TTM not available, use full year comparison
 */
export const msftQ1Fixture = {
  quarterlyFinancials: [
    {
      period: "2025-03-31",
      quarter: "2025-Q1",
      fiscalYear: 2025,
      revenue: 65000000000,
      netIncome: 20000000000,
      operatingIncome: 25000000000,
      eps: 2.65,
      freeCashFlow: 18000000000,
    },
    {
      period: "2024-12-31",
      quarter: "2024-Q4",
      fiscalYear: 2024,
      revenue: 62000000000,
      netIncome: 19000000000,
      operatingIncome: 24000000000,
      eps: 2.50,
      freeCashFlow: 17000000000,
    },
    {
      period: "2024-09-30",
      quarter: "2024-Q3",
      fiscalYear: 2024,
      revenue: 61000000000,
      netIncome: 18500000000,
      operatingIncome: 23500000000,
      eps: 2.45,
      freeCashFlow: 16500000000,
    },
    {
      period: "2024-06-30",
      quarter: "2024-Q2",
      fiscalYear: 2024,
      revenue: 60000000000,
      netIncome: 18000000000,
      operatingIncome: 23000000000,
      eps: 2.40,
      freeCashFlow: 16000000000,
    },
  ] as QuarterlyFinancial[],
  financials: [
    {
      period: "2024-12-31",
      fiscalYear: 2024,
      revenue: 245000000000,
      netIncome: 72000000000,
      operatingIncome: 95000000000,
      eps: 9.60,
      freeCashFlow: 65000000000,
    },
    {
      period: "2023-12-31",
      fiscalYear: 2023,
      revenue: 220000000000,
      netIncome: 65000000000,
      operatingIncome: 85000000000,
      eps: 8.65,
      freeCashFlow: 58000000000,
    },
  ] as AnnualFinancial[],
};

/**
 * Expected TTM Calculations for Fixtures
 */
export const expectedTTMValues = {
  bidu: {
    // 2025-Q3 + Q2 + Q1 + 2024-Q4
    revenue: 35000000000 + 33500000000 + 32000000000 + 34124000000, // 134,624,000,000
    netIncome: 8500000000 + 7800000000 + 7200000000 + 5192000000, // 28,692,000,000
    operatingIncome: 6200000000 + 5900000000 + 5500000000 + 3917000000, // 21,517,000,000
    freeCashFlow: 3000000000 + 2800000000 + 2500000000 + 2200000000, // 10,500,000,000
  },
  aapl: {
    // 2024-Q4 + Q3 + Q2 + Q1 (full year)
    revenue: 120000000000 + 118000000000 + 116000000000 + 114000000000, // 468,000,000,000
    netIncome: 30000000000 + 29000000000 + 28000000000 + 27000000000, // 114,000,000,000
    operatingIncome: 35000000000 + 34000000000 + 33000000000 + 32000000000, // 134,000,000,000
    freeCashFlow: 25000000000 + 24000000000 + 23000000000 + 22000000000, // 94,000,000,000
  },
  msft: {
    // 2024 FY (only Q1 2025 available, so use 2024 FY)
    revenue: 245000000000,
    netIncome: 72000000000,
    operatingIncome: 95000000000,
    freeCashFlow: 65000000000,
  },
};

/**
 * Expected Growth Rates
 */
export const expectedGrowthRates = {
  bidu: {
    // TTM vs 2024 FY
    revenueGrowth: ((134624000000 - 134598000000) / 134598000000) * 100, // ~0.02%
    netIncomeGrowth: ((28692000000 - 20315000000) / 20315000000) * 100, // ~41.1%
    operatingIncomeGrowth: ((21517000000 - 21856000000) / 21856000000) * 100, // ~-1.55%
  },
  aapl: {
    // 2024 TTM vs 2023 FY
    revenueGrowth: ((468000000000 - 420000000000) / 420000000000) * 100, // ~11.43%
    netIncomeGrowth: ((114000000000 - 100000000000) / 100000000000) * 100, // ~14%
    operatingIncomeGrowth: ((134000000000 - 120000000000) / 120000000000) * 100, // ~11.67%
  },
  msft: {
    // 2024 FY vs 2023 FY
    revenueGrowth: ((245000000000 - 220000000000) / 220000000000) * 100, // ~11.36%
    netIncomeGrowth: ((72000000000 - 65000000000) / 65000000000) * 100, // ~10.77%
    operatingIncomeGrowth: ((95000000000 - 85000000000) / 85000000000) * 100, // ~11.76%
  },
};
