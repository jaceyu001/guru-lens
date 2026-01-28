import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

console.log(`[alphaVantageWrapper] Using API Key: ${API_KEY?.substring(0, 8)}... (from ${process.env.ALPHA_VANTAGE_API_KEY ? 'env' : 'fallback'})`);

// Maximum years of financial data to fetch (TTM + 3 full years)
const MAX_DATA_YEARS = 4;

interface StockDataResponse {
  ticker: string;
  profile: {
    companyName: string;
    sector: string;
    industry: string;
    marketCap: number;
    currency: string;
    exchange: string;
  };
  quote: {
    price: number;
    volume: number;
    change: number;
    changePercent: number;
    timestamp: string;
  };
  ratios: {
    pe: number | null;
    pb: number | null;
    ps: number | null;
    roe: number | null;
    roa: number | null;
    roic: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    currentRatio: number | null;
    debtToEquity: number | null;
    dividendYield: number | null;
    interestCoverage: number | null;
  };
  financials: {
    annualReports: Array<{
      fiscalDateEnding: string;
      revenue: number;
      operatingIncome: number;
      netIncome: number;
      grossProfit: number;
      totalAssets: number;
      totalLiabilities: number;
      totalEquity: number;
      operatingCashFlow: number;
      capitalExpenditure: number;
      freeCashFlow: number;
    }>;
    quarterlyReports: Array<{
      fiscalDateEnding: string;
      revenue: number;
      operatingIncome: number;
      netIncome: number;
      grossProfit: number;
      totalAssets: number;
      totalLiabilities: number;
      totalEquity: number;
      operatingCashFlow: number;
      capitalExpenditure: number;
      freeCashFlow: number;
    }>;
  };
  balanceSheet: {
    annualReports: Array<{
      fiscalDateEnding: string;
      totalAssets: number;
      totalLiabilities: number;
      totalEquity: number;
      currentAssets: number;
      currentLiabilities: number;
      cash: number;
      inventory: number;
      accountsReceivable: number;
      longTermDebt: number;
      shortTermDebt: number;
    }>;
    quarterlyReports: Array<{
      fiscalDateEnding: string;
      totalAssets: number;
      totalLiabilities: number;
      totalEquity: number;
      currentAssets: number;
      currentLiabilities: number;
      cash: number;
      inventory: number;
      accountsReceivable: number;
      longTermDebt: number;
      shortTermDebt: number;
    }>;
  };
  cashFlow: {
    annualReports: Array<{
      fiscalDateEnding: string;
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      capitalExpenditure: number;
    }>;
    quarterlyReports: Array<{
      fiscalDateEnding: string;
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      capitalExpenditure: number;
    }>;
  };
  dataYears: number;
  lastUpdated: string;
}

/**
 * Fetch company overview from Alpha Vantage
 */
async function getCompanyOverview(ticker: string): Promise<any> {
  try {
    console.log(`[alphaVantageWrapper] Fetching OVERVIEW for ${ticker}`);
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.Note) {
      throw new Error(`API rate limited: ${response.data.Note}`);
    }

    if (response.data.Error) {
      throw new Error(`API error: ${response.data.Error}`);
    }

    return response.data;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Error fetching overview for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch global quote from Alpha Vantage
 */
async function getGlobalQuote(ticker: string): Promise<any> {
  try {
    console.log(`[alphaVantageWrapper] Calling GLOBAL_QUOTE for ${ticker}`);
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    console.log(`[alphaVantageWrapper] Full API response for ${ticker}:`, JSON.stringify(response.data, null, 2).substring(0, 500));

    if (response.data.Note) {
      throw new Error(`API rate limited: ${response.data.Note}`);
    }

    if (response.data.Error) {
      throw new Error(`API error: ${response.data.Error}`);
    }

    const quote = response.data['Global Quote'] || {};
    console.log(`[alphaVantageWrapper] Extracted quote for ${ticker}:`, JSON.stringify(quote, null, 2));
    console.log(`[alphaVantageWrapper] Quote fields:`, Object.keys(quote).join(', '));
    console.log(`[alphaVantageWrapper] Price field '05. price':`, quote['05. price']);
    
    // Check if quote is empty
    if (Object.keys(quote).length === 0) {
      console.warn(`[alphaVantageWrapper] WARNING: Empty Global Quote for ${ticker}`);
      console.warn(`[alphaVantageWrapper] Full response keys:`, Object.keys(response.data));
      console.warn(`[alphaVantageWrapper] Full response:`, JSON.stringify(response.data, null, 2).substring(0, 1000));
      // Throw error instead of returning empty quote
      throw new Error(`Empty Global Quote returned for ${ticker}. API may be rate limited or ticker may be invalid.`);
    }
    
    return quote;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Error fetching quote for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch income statement from Alpha Vantage
 */
async function getIncomeStatement(ticker: string): Promise<any> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.Note) {
      throw new Error(`API rate limited: ${response.data.Note}`);
    }

    if (response.data.Error) {
      throw new Error(`API error: ${response.data.Error}`);
    }

    return response.data;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Error fetching income statement for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch balance sheet from Alpha Vantage
 */
async function getBalanceSheet(ticker: string): Promise<any> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'BALANCE_SHEET',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.Note) {
      throw new Error(`API rate limited: ${response.data.Note}`);
    }

    if (response.data.Error) {
      throw new Error(`API error: ${response.data.Error}`);
    }

    return response.data;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Error fetching balance sheet for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch cash flow statement from Alpha Vantage
 */
async function getCashFlow(ticker: string): Promise<any> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'CASH_FLOW',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.Note) {
      throw new Error(`API rate limited: ${response.data.Note}`);
    }

    if (response.data.Error) {
      throw new Error(`API error: ${response.data.Error}`);
    }

    return response.data;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Error fetching cash flow for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Limit financial data to maximum 4 years (TTM + 3 full years)
 */
function limitDataToMaxYears(reports: any[], maxYears: number = MAX_DATA_YEARS): any[] {
  if (!reports || reports.length === 0) return [];

  // Sort by fiscal date descending (newest first)
  const sorted = [...reports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  // Keep only the most recent maxYears reports
  return sorted.slice(0, maxYears);
}

/**
 * Parse and transform Alpha Vantage data to standard format
 */
function parseStockData(
  ticker: string,
  overview: any,
  quote: any,
  incomeStatement: any,
  balanceSheet: any,
  cashFlow: any
): StockDataResponse {
  // Extract annual reports (limited to 4 years)
  const annualIncomeReports = limitDataToMaxYears(incomeStatement?.annualReports || []);
  const annualBalanceReports = limitDataToMaxYears(balanceSheet?.annualReports || []);
  const annualCashFlowReports = limitDataToMaxYears(cashFlow?.annualReports || []);

  // Extract quarterly reports (limited to 4 years worth)
  const quarterlyIncomeReports = limitDataToMaxYears(incomeStatement?.quarterlyReports || []);
  const quarterlyBalanceReports = limitDataToMaxYears(balanceSheet?.quarterlyReports || []);
  const quarterlyCashFlowReports = limitDataToMaxYears(cashFlow?.quarterlyReports || []);

  // Calculate financial ratios from available data
  const latestAnnualIncome = annualIncomeReports[0];
  const latestAnnualBalance = annualBalanceReports[0];
  const latestQuarterlyIncome = quarterlyIncomeReports[0];
  
  console.log(`[parseStockData] ${ticker} balance sheet:`, {
    annualReports_length: annualBalanceReports.length,
    first_report_keys: annualBalanceReports[0] ? Object.keys(annualBalanceReports[0]) : [],
    debtToEquity_calc: latestAnnualBalance ? {
      longTermDebt: latestAnnualBalance.longTermDebt,
      shortTermDebt: latestAnnualBalance.shortTermDebt,
      totalEquity: latestAnnualBalance.totalEquity,
    } : null,
  });

  const ratios = {
    pe: overview?.PERatio ? parseFloat(overview.PERatio) : null,
    pb: overview?.PriceToBookRatio ? parseFloat(overview.PriceToBookRatio) : null,
    ps: overview?.PriceToSalesRatioTTM ? parseFloat(overview.PriceToSalesRatioTTM) : null,
    roe: overview?.ReturnOnEquityTTM ? parseFloat(overview.ReturnOnEquityTTM) : null,
    roa: overview?.ReturnOnAssetsTTM ? parseFloat(overview.ReturnOnAssetsTTM) : null,
    roic: null, // Will be calculated if needed
    grossMargin: latestAnnualIncome
      ? (parseFloat(latestAnnualIncome.grossProfit) / parseFloat(latestAnnualIncome.revenue)) * 100
      : null,
    operatingMargin: latestAnnualIncome
      ? (parseFloat(latestAnnualIncome.operatingIncome) / parseFloat(latestAnnualIncome.revenue)) *
        100
      : null,
    netMargin: latestAnnualIncome && latestAnnualIncome.netIncome && latestAnnualIncome.revenue
      ? (parseFloat(latestAnnualIncome.netIncome) / parseFloat(latestAnnualIncome.revenue)) * 100
      : null,
    currentRatio: latestAnnualBalance && latestAnnualBalance.currentAssets && latestAnnualBalance.currentLiabilities
      ? parseFloat(latestAnnualBalance.currentAssets) / parseFloat(latestAnnualBalance.currentLiabilities)
      : null,
    debtToEquity: latestAnnualBalance && latestAnnualBalance.totalEquity
      ? ((parseFloat(latestAnnualBalance.longTermDebt || 0) + parseFloat(latestAnnualBalance.shortTermDebt || 0)) /
        parseFloat(latestAnnualBalance.totalEquity))
      : null,
    dividendYield: overview?.DividendYield ? parseFloat(overview.DividendYield) * 100 : null,
    interestCoverage: null, // Will be calculated if needed
  };

  const quoteKeys = Object.keys(quote || {});
  console.log(`[parseStockData] ${ticker} quote data:`, {
    price_raw: quote?.['05. price'],
    price_parsed: quote?.['05. price'] ? parseFloat(quote['05. price']) : 0,
    quote_keys: quoteKeys,
    quote_empty: quoteKeys.length === 0,
  });
  
  return {
    ticker,
    profile: {
      companyName: overview?.Name || ticker,
      sector: overview?.Sector || 'N/A',
      industry: overview?.Industry || 'N/A',
      marketCap: overview?.MarketCapitalization ? parseInt(overview.MarketCapitalization) : 0,
      currency: overview?.Currency || 'USD',
      exchange: overview?.Exchange || 'N/A',
    },
    quote: {
      price: quote?.['05. price'] ? parseFloat(quote['05. price']) : 0,
      volume: quote?.['06. volume'] ? parseInt(quote['06. volume']) : 0,
      change: quote?.['09. change'] ? parseFloat(quote['09. change']) : 0,
      changePercent: quote?.['10. change percent']
        ? parseFloat(quote['10. change percent'].replace('%', ''))
        : 0,
      timestamp: quote?.['07. latest trading day'] || new Date().toISOString(),
    },
    ratios,
    financials: {
      annualReports: annualIncomeReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        revenue: parseInt(report.totalRevenue || report.revenue || 0),
        operatingIncome: parseInt(report.operatingIncome || 0),
        netIncome: parseInt(report.netIncome || 0),
        grossProfit: parseInt(report.grossProfit || 0),
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        operatingCashFlow: 0,
        capitalExpenditure: 0,
        freeCashFlow: 0,
      })),
      quarterlyReports: quarterlyIncomeReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        revenue: parseInt(report.totalRevenue || report.revenue || 0),
        operatingIncome: parseInt(report.operatingIncome || 0),
        netIncome: parseInt(report.netIncome || 0),
        grossProfit: parseInt(report.grossProfit || 0),
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        operatingCashFlow: 0,
        capitalExpenditure: 0,
        freeCashFlow: 0,
      })),
    },
    balanceSheet: {
      annualReports: annualBalanceReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        totalAssets: parseInt(report.totalAssets || 0),
        totalLiabilities: parseInt(report.totalLiabilities || 0),
        totalEquity: parseInt(report.totalShareholderEquity || 0),
        currentAssets: parseInt(report.totalCurrentAssets || 0),
        currentLiabilities: parseInt(report.totalCurrentLiabilities || 0),
        cash: parseInt(report.cashAndCashEquivalentsAtCarryingValue || 0),
        inventory: parseInt(report.inventory || 0),
        accountsReceivable: parseInt(report.accountsReceivable || 0),
        longTermDebt: parseInt(report.longTermDebt || 0),
        shortTermDebt: parseInt(report.shortTermDebt || 0),
      })),
      quarterlyReports: quarterlyBalanceReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        totalAssets: parseInt(report.totalAssets || 0),
        totalLiabilities: parseInt(report.totalLiabilities || 0),
        totalEquity: parseInt(report.totalShareholderEquity || 0),
        currentAssets: parseInt(report.totalCurrentAssets || 0),
        currentLiabilities: parseInt(report.totalCurrentLiabilities || 0),
        cash: parseInt(report.cashAndCashEquivalentsAtCarryingValue || 0),
        inventory: parseInt(report.inventory || 0),
        accountsReceivable: parseInt(report.accountsReceivable || 0),
        longTermDebt: parseInt(report.longTermDebt || 0),
        shortTermDebt: parseInt(report.shortTermDebt || 0),
      })),
    },
    cashFlow: {
      annualReports: annualCashFlowReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        operatingCashFlow: parseInt(report.operatingCashFlow || 0),
        investingCashFlow: parseInt(report.investingCashFlow || 0),
        financingCashFlow: parseInt(report.financingCashFlow || 0),
        capitalExpenditure: parseInt(report.capitalExpenditures || 0),
      })),
      quarterlyReports: quarterlyCashFlowReports.map((report: any) => ({
        fiscalDateEnding: report.fiscalDateEnding,
        operatingCashFlow: parseInt(report.operatingCashFlow || 0),
        investingCashFlow: parseInt(report.investingCashFlow || 0),
        financingCashFlow: parseInt(report.financingCashFlow || 0),
        capitalExpenditure: parseInt(report.capitalExpenditures || 0),
      })),
    },
    dataYears: MAX_DATA_YEARS,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Main function to fetch complete stock data from Alpha Vantage
 */
export async function getStockData(ticker: string): Promise<StockDataResponse> {
  try {
    console.log(`[alphaVantageWrapper] Fetching data for ${ticker}`);

    // Fetch all data in parallel
    const [overview, quote, incomeStatement, balanceSheet, cashFlow] = await Promise.all([
      getCompanyOverview(ticker),
      getGlobalQuote(ticker),
      getIncomeStatement(ticker),
      getBalanceSheet(ticker),
      getCashFlow(ticker),
    ]);

    // Parse and transform data
    const stockData = parseStockData(ticker, overview, quote, incomeStatement, balanceSheet, cashFlow);

    console.log(`[alphaVantageWrapper] Successfully fetched data for ${ticker}`);
    return stockData;
  } catch (error) {
    console.error(`[alphaVantageWrapper] Failed to fetch data for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Batch fetch stock data for multiple tickers
 */
export async function getStockDataBatch(tickers: string[]): Promise<Map<string, StockDataResponse>> {
  const results = new Map<string, StockDataResponse>();
  const errors = new Map<string, Error>();

  // Process with delay to avoid rate limiting
  for (const ticker of tickers) {
    try {
      const data = await getStockData(ticker);
      results.set(ticker, data);
      // Add delay between requests (Alpha Vantage free tier: 5 calls/min)
      await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds between calls
    } catch (error) {
      errors.set(ticker, error as Error);
      console.error(`[alphaVantageWrapper] Error fetching ${ticker}:`, error);
    }
  }

  if (errors.size > 0) {
    console.warn(`[alphaVantageWrapper] Batch fetch completed with ${errors.size} errors`);
  }

  return results;
}
