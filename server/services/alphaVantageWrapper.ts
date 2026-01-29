import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '99OB7DPSQG1NNK15';
const BASE_URL = 'https://www.alphavantage.co/query';

// Simple rate limiter: 75 calls per minute = 1 call every 800ms
let lastCallTime = 0;
const MIN_INTERVAL = 800; // milliseconds between calls

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - timeSinceLastCall));
  }
  lastCallTime = Date.now();
}

// ============ Type Definitions ============

export interface AlphaVantageOverview {
  Symbol: string;
  Name: string;
  Description?: string;
  Exchange: string;
  Currency: string;
  Country?: string;
  Sector: string;
  Industry: string;
  Address?: string;
  OfficialSite?: string;
  FiscalYearEnd?: string;
  LatestQuarter?: string;
  MarketCapitalization: string;
  EBITDA?: string;
  PERatio?: string;
  PEGRatio?: string;
  BookValue?: string;
  DividendPerShare?: string;
  DividendYield?: string;
  EPS?: string;
  RevenuePerShareTTM?: string;
  ProfitMargin?: string;
  OperatingMarginTTM?: string;
  ReturnOnAssetsTTM?: string;
  ReturnOnEquityTTM?: string;
  RevenueTTM?: string;
  GrossProfitTTM?: string;
  DilutedEPSTTM?: string;
  QuarterlyEarningsGrowthYOY?: string;
  QuarterlyRevenueGrowthYOY?: string;
  AnalystTargetPrice?: string;
  TrailingPE?: string;
  ForwardPE?: string;
  PriceToSalesRatioTTM?: string;
  PriceToBookRatio?: string;
  EVToRevenue?: string;
  EVToEBITDA?: string;
  Beta?: string;
  '52WeekHigh'?: string;
  '52WeekLow'?: string;
  '50DayMovingAverage'?: string;
  '200DayMovingAverage'?: string;
  SharesOutstanding?: string;
  SharesFloat?: string;
  PercentInsiders?: string;
  PercentInstitutions?: string;
  DividendDate?: string;
  ExDividendDate?: string;
}

export interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export interface IncomeStatementData {
  fiscalDateEnding: string;
  reportedCurrency: string;
  totalRevenue?: string;
  netIncome?: string;
  operatingIncome?: string;
  incomeBeforeTax?: string;
  incomeTaxExpense?: string;
  grossProfit?: string;
  ebitda?: string;
}

export interface AlphaVantageIncomeStatement {
  annualReports?: IncomeStatementData[];
  quarterlyReports?: IncomeStatementData[];
}

export interface BalanceSheetData {
  fiscalDateEnding: string;
  reportedCurrency: string;
  totalAssets?: string;
  totalCurrentAssets?: string;
  cashAndCashEquivalentsAtCarryingValue?: string;
  cashAndShortTermInvestments?: string;
  inventory?: string;
  currentNetReceivables?: string;
  totalNonCurrentAssets?: string;
  propertyPlantEquipment?: string;
  totalLiabilities?: string;
  totalCurrentLiabilities?: string;
  currentAccountsPayable?: string;
  shortTermDebt?: string;
  totalNonCurrentLiabilities?: string;
  longTermDebt?: string;
  currentLongTermDebt?: string;
  shortLongTermDebtTotal?: string;
  totalShareholderEquity?: string;
  retainedEarnings?: string;
  commonStock?: string;
  commonStockSharesOutstanding?: string;
}

export interface AlphaVantageBalanceSheet {
  annualReports?: BalanceSheetData[];
  quarterlyReports?: BalanceSheetData[];
}

export interface CashFlowData {
  fiscalDateEnding: string;
  reportedCurrency: string;
  operatingCashflow?: string;
  capitalExpenditures?: string;
  cashflowFromInvestment?: string;
  cashflowFromFinancing?: string;
  dividendPayout?: string;
  netIncome?: string;
  depreciationDepletionAndAmortization?: string;
}

export interface AlphaVantageCashFlow {
  annualReports?: CashFlowData[];
  quarterlyReports?: CashFlowData[];
}

export interface AlphaVantageResponses {
  overview: AlphaVantageOverview | null;
  quote: AlphaVantageQuote | null;
  incomeStatement: AlphaVantageIncomeStatement | null;
  balanceSheet: AlphaVantageBalanceSheet | null;
  cashFlow: AlphaVantageCashFlow | null;
}

// ============ API Calls ============

/**
 * Make rate-limited API call to Alpha Vantage
 */
async function makeApiCall<T>(params: Record<string, string>): Promise<T | null> {
  try {
    await rateLimit();
    const result = await axios.get<T>(BASE_URL, {
      params: {
        apikey: API_KEY,
        ...params,
      },
      timeout: 15000,
    });
    const response = result.data;

    // Check for error message in response
    if (response && typeof response === 'object' && 'Error Message' in response) {
      console.error(`[Alpha Vantage] Error: ${(response as any)['Error Message']}`);
      return null;
    }

    if (response && typeof response === 'object' && 'Note' in response) {
      console.warn(`[Alpha Vantage] Rate limit: ${(response as any)['Note']}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error(`[Alpha Vantage] API call failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fetch company overview data
 */
export async function fetchOverview(symbol: string): Promise<AlphaVantageOverview | null> {
  const data = await makeApiCall<AlphaVantageOverview>({
    function: 'OVERVIEW',
    symbol: symbol.toUpperCase(),
  });
  return data || null;
}

/**
 * Fetch current quote data
 */
export async function fetchQuote(symbol: string): Promise<AlphaVantageQuote | null> {
  const data = await makeApiCall<AlphaVantageQuote>({
    function: 'GLOBAL_QUOTE',
    symbol: symbol.toUpperCase(),
  });
  return data || null;
}

/**
 * Fetch income statement (annual and quarterly)
 */
export async function fetchIncomeStatement(symbol: string): Promise<AlphaVantageIncomeStatement | null> {
  const data = await makeApiCall<AlphaVantageIncomeStatement>({
    function: 'INCOME_STATEMENT',
    symbol: symbol.toUpperCase(),
  });
  return data || null;
}

/**
 * Fetch balance sheet (annual and quarterly)
 */
export async function fetchBalanceSheet(symbol: string): Promise<AlphaVantageBalanceSheet | null> {
  const data = await makeApiCall<AlphaVantageBalanceSheet>({
    function: 'BALANCE_SHEET',
    symbol: symbol.toUpperCase(),
  });
  return data || null;
}

/**
 * Fetch cash flow (annual and quarterly)
 */
export async function fetchCashFlow(symbol: string): Promise<AlphaVantageCashFlow | null> {
  const data = await makeApiCall<AlphaVantageCashFlow>({
    function: 'CASH_FLOW',
    symbol: symbol.toUpperCase(),
  });
  return data || null;
}

/**
 * Fetch all data for a ticker
 */
export async function fetchAllData(symbol: string): Promise<AlphaVantageResponses> {
  console.log(`[Alpha Vantage] Fetching data for ${symbol}`);

  const [overview, quote, incomeStatement, balanceSheet, cashFlow] = await Promise.all([
    fetchOverview(symbol),
    fetchQuote(symbol),
    fetchIncomeStatement(symbol),
    fetchBalanceSheet(symbol),
    fetchCashFlow(symbol),
  ]);

  return {
    overview,
    quote,
    incomeStatement,
    balanceSheet,
    cashFlow,
  };
}

// ============ Parsing Utilities ============

/**
 * Parse percentage string to number (as decimal)
 */
export function parsePercentage(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse integer string
 */
export function parseInt64(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}
