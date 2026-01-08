/**
 * Financial Modeling Prep API Client
 * 
 * Provides real-time and historical financial data for stocks
 * API Docs: https://site.financialmodelingprep.com/developer/docs/
 */

import { ENV } from "../_core/env";

export interface Quote {
  symbol: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
  timestamp: number;
}

export interface Profile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  employees: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  dcfValue: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: number;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebit: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
}

export interface BalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: number;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantAndEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssetsDeferred: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayable: number;
  shortTermDebt: number;
  taxPayable: number;
  deferredRevenueShortTerm: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrentLiabilities: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  totalLiabilities: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalEquity: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestedCapital: number;
  totalDebt: number;
  netDebt: number;
  link: string;
  finalLink: string;
}

export interface CashFlow {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: number;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  stockBasedCompensation: number;
  deferredIncomeTax: number;
  otherNonCashItems: number;
  changesInOperatingAssets: number;
  changesInOperatingLiabilities: number;
  accountsReceivableChange: number;
  accountsPayableChange: number;
  otherWorkingCapitalChange: number;
  otherOperatingCashFlow: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivities: number;
  netCashUsedForInvestingActivities: number;
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivities: number;
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  link: string;
  finalLink: string;
}

export interface KeyMetrics {
  date: string;
  symbol: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToRevenue: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEbitda: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDevelopmentToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averageInventory: number;
  averageTotalAssets: number;
  averageStockholdersEquity: number;
  daysInventoryOutstanding: number;
  daysPayableOutstanding: number;
  daysSalesOutstanding: number;
  cashConversionCycle: number;
  receivablesTurnover: number;
  inventoryTurnover: number;
  assetTurnover: number;
  freeCashFlowOperatingCashFlowRatio: number;
  operatingCashFlowNetIncomeRatio: number;
  operatingCashFlowToNetIncome: number;
  freeCashFlowToNetIncome: number;
}

export class FMPClient {
  private apiKey: string;
  private baseUrl = "https://financialmodelingprep.com/api/v3";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ENV.fmpApiKey;
    if (!this.apiKey) {
      throw new Error("FMP_API_KEY environment variable is required");
    }
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}?apikey=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // FMP returns error messages in the response
      if (data.error) {
        throw new Error(`FMP API error: ${data.error}`);
      }
      
      return data;
    } catch (error) {
      console.error(`[FMP Client] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    const data = await this.fetch<Quote[]>(`/quote/${symbol}`);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No quote data found for ${symbol}`);
    }
    return data[0];
  }

  async getProfile(symbol: string): Promise<Profile> {
    const data = await this.fetch<Profile[]>(`/profile/${symbol}`);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No profile data found for ${symbol}`);
    }
    return data[0];
  }

  async getIncomeStatement(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit: number = 5
  ): Promise<IncomeStatement[]> {
    const data = await this.fetch<IncomeStatement[]>(
      `/income-statement/${symbol}?period=${period}&limit=${limit}`
    );
    if (!Array.isArray(data)) {
      throw new Error(`Invalid income statement data for ${symbol}`);
    }
    return data;
  }

  async getBalanceSheet(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit: number = 5
  ): Promise<BalanceSheet[]> {
    const data = await this.fetch<BalanceSheet[]>(
      `/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}`
    );
    if (!Array.isArray(data)) {
      throw new Error(`Invalid balance sheet data for ${symbol}`);
    }
    return data;
  }

  async getCashFlow(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit: number = 5
  ): Promise<CashFlow[]> {
    const data = await this.fetch<CashFlow[]>(
      `/cash-flow-statement/${symbol}?period=${period}&limit=${limit}`
    );
    if (!Array.isArray(data)) {
      throw new Error(`Invalid cash flow data for ${symbol}`);
    }
    return data;
  }

  async getKeyMetrics(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit: number = 5
  ): Promise<KeyMetrics[]> {
    const data = await this.fetch<KeyMetrics[]>(
      `/key-metrics/${symbol}?period=${period}&limit=${limit}`
    );
    if (!Array.isArray(data)) {
      throw new Error(`Invalid key metrics data for ${symbol}`);
    }
    return data;
  }
}

export const fmpClient = new FMPClient();
