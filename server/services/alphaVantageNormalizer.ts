import {
  parsePercentage,
  parseCurrency,
  parseInt64,
} from './alphaVantageWrapper';
import type { FinancialData } from '../../shared/types';

/**
 * Normalize Alpha Vantage responses to internal FinancialData schema
 * Handles all annual and quarterly data from INCOME_STATEMENT, BALANCE_SHEET, and CASH_FLOW
 */
export function normalizeToFinancialData(responses: AlphaVantageResponses): FinancialData {
  console.log('[alphaVantageNormalizer] Starting normalization');
  const { overview, quote, incomeStatement, balanceSheet, cashFlow } = responses;

  if (!overview) {
    console.error('[alphaVantageNormalizer] No overview data received');
    throw new Error('Overview data is required');
  }
  
  console.log('[alphaVantageNormalizer] Overview:', overview.Symbol, overview.Name);
  console.log('[alphaVantageNormalizer] Quote available:', !!quote);
  console.log('[alphaVantageNormalizer] Income statement reports:', incomeStatement?.annualReports?.length || 0, 'annual,', incomeStatement?.quarterlyReports?.length || 0, 'quarterly');
  console.log('[alphaVantageNormalizer] Balance sheet reports:', balanceSheet?.annualReports?.length || 0, 'annual,', balanceSheet?.quarterlyReports?.length || 0, 'quarterly');
  console.log('[alphaVantageNormalizer] Cash flow reports:', cashFlow?.annualReports?.length || 0, 'annual,', cashFlow?.quarterlyReports?.length || 0, 'quarterly');

  // Extract quote data
  const quoteData = quote?.['Global Quote'];
  console.log('[alphaVantageNormalizer] Quote data:', quoteData);
  const currentPrice = quoteData ? parseFloat(quoteData['05. price']) : 0;
  console.log('[alphaVantageNormalizer] Current price extracted:', currentPrice);
  const volume = quoteData ? parseInt(quoteData['06. volume'], 10) : 0;
  const change = quoteData ? parseFloat(quoteData['09. change']) : 0;
  const changePercent = quoteData ? parseFloat(quoteData['10. change percent'].replace('%', '')) : 0;

  // ============ Build Financials Array (Annual) ============
  const annualIncomeReports = incomeStatement?.annualReports || [];
  const annualBalanceReports = balanceSheet?.annualReports || [];
  const annualCashFlowReports = cashFlow?.annualReports || [];

  // Create a map of annual reports by fiscal year for easy merging
  const annualByYear = new Map<string, any>();

  // Add income statement data
  annualIncomeReports.forEach((report: any) => {
    const year = report.fiscalDateEnding?.split('-')[0] || '';
    if (!annualByYear.has(year)) {
      annualByYear.set(year, { fiscalYear: parseInt(year) });
    }
    const entry = annualByYear.get(year)!;
    entry.revenue = parseCurrency(report.totalRevenue);
    entry.operatingIncome = parseCurrency(report.operatingIncome);
    entry.netIncome = parseCurrency(report.netIncome);
    entry.grossProfit = parseCurrency(report.grossProfit);
    entry.interestExpense = parseCurrency(report.interestExpense);
  });

  // Add balance sheet data
  annualBalanceReports.forEach((report: any) => {
    const year = report.fiscalDateEnding?.split('-')[0] || '';
    if (!annualByYear.has(year)) {
      annualByYear.set(year, { fiscalYear: parseInt(year) });
    }
    const entry = annualByYear.get(year)!;
    entry.totalAssets = parseCurrency(report.totalAssets);
    entry.totalLiabilities = parseCurrency(report.totalLiabilities);
    entry.totalEquity = parseCurrency(report.totalShareholderEquity);
    entry.currentAssets = parseCurrency(report.totalCurrentAssets);
    entry.currentLiabilities = parseCurrency(report.totalCurrentLiabilities);
    entry.shortTermDebt = parseCurrency(report.shortTermDebt);
    entry.longTermDebt = parseCurrency(report.longTermDebt);
  });

  // Add cash flow data
  annualCashFlowReports.forEach((report: any) => {
    const year = report.fiscalDateEnding?.split('-')[0] || '';
    if (!annualByYear.has(year)) {
      annualByYear.set(year, { fiscalYear: parseInt(year) });
    }
    const entry = annualByYear.get(year)!;
    entry.operatingCashFlow = parseCurrency(report.operatingCashflow);
    entry.capitalExpenditure = parseCurrency(report.capitalExpenditures);
    entry.freeCashFlow = (entry.operatingCashFlow || 0) - (entry.capitalExpenditure || 0);
  });

  const financials = Array.from(annualByYear.values()).sort((a, b) => b.fiscalYear - a.fiscalYear);

  // ============ Build Quarterly Financials Array ============
  const quarterlyByPeriod = new Map<string, any>();

  const quarterlyIncomeReports = incomeStatement?.quarterlyReports || [];
  const quarterlyBalanceReports = balanceSheet?.quarterlyReports || [];
  const quarterlyCashFlowReports = cashFlow?.quarterlyReports || [];

  quarterlyIncomeReports.forEach((report: any) => {
    const period = report.fiscalDateEnding || '';
    if (!quarterlyByPeriod.has(period)) {
      quarterlyByPeriod.set(period, { fiscalPeriod: period });
    }
    const entry = quarterlyByPeriod.get(period)!;
    entry.revenue = parseCurrency(report.totalRevenue);
    entry.operatingIncome = parseCurrency(report.operatingIncome);
    entry.netIncome = parseCurrency(report.netIncome);
  });

  quarterlyBalanceReports.forEach((report: any) => {
    const period = report.fiscalDateEnding || '';
    if (!quarterlyByPeriod.has(period)) {
      quarterlyByPeriod.set(period, { fiscalPeriod: period });
    }
    const entry = quarterlyByPeriod.get(period)!;
    entry.totalAssets = parseCurrency(report.totalAssets);
    entry.totalEquity = parseCurrency(report.totalShareholderEquity);
  });

  const quarterlyFinancials = Array.from(quarterlyByPeriod.values()).sort((a, b) => 
    new Date(b.fiscalPeriod).getTime() - new Date(a.fiscalPeriod).getTime()
  );

  // ============ Parse Metrics from Overview ============
  const peRatio = parsePercentage(overview.PERatio);
  const pbRatio = parsePercentage(overview.PriceToBookRatio);
  const psRatio = parsePercentage(overview.PriceToSalesRatioTTM);
  const roe = parsePercentage(overview.ReturnOnEquityTTM);
  const roa = parsePercentage(overview.ReturnOnAssetsTTM);
  const netMargin = parsePercentage(overview.ProfitMargin); // ProfitMargin = Net Margin
  const operatingMargin = parsePercentage(overview.OperatingMarginTTM);
  const dividendYield = parsePercentage(overview.DividendYield);
  // NOTE: Don't use quarterly growth rates from OVERVIEW - the fundamentals agent calculates
  // annual TTM growth from the annual financial data we're extracting

  // Get most recent balance sheet and income statement for derived metrics
  const latestBalanceSheet = annualBalanceReports?.[0];
  const latestIncomeStatement = annualIncomeReports?.[0];
  
  // Calculate Gross Margin from GrossProfitTTM and RevenueTTM
  const grossProfitTTM = parseCurrency(overview.GrossProfitTTM) || 0;
  const revenueTTM = parseCurrency(overview.RevenueTTM) || 0;
  const grossMargin = revenueTTM > 0 ? (grossProfitTTM / revenueTTM) : 0;
  
  // Calculate ROIC from OperatingIncome and Total Capital
  const operatingIncome = latestIncomeStatement ? (parseCurrency(latestIncomeStatement.operatingIncome) || 0) : 0;
  const totalEquity = latestBalanceSheet ? (parseCurrency(latestBalanceSheet.totalShareholderEquity) || 0) : 0;
  const totalDebt = latestBalanceSheet ? (parseCurrency(latestBalanceSheet.shortTermDebt) || 0) + (parseCurrency(latestBalanceSheet.longTermDebt) || 0) : 0;
  const totalCapital = (totalEquity || 0) + (totalDebt || 0);
  const roic = totalCapital > 0 ? ((operatingIncome || 0) / totalCapital) : 0;
  
  // Calculate Debt/Equity
  const debtToEquity = (totalEquity || 0) > 0 ? ((totalDebt || 0) / (totalEquity || 0)) : 0;
  
  // Calculate Current Ratio
  const currentAssets = latestBalanceSheet ? (parseCurrency(latestBalanceSheet.totalCurrentAssets) || 0) : 0;
  const currentLiabilities = latestBalanceSheet ? (parseCurrency(latestBalanceSheet.totalCurrentLiabilities) || 0) : 0;
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0;
  
  // Calculate Interest Coverage
  const interestExpense = latestIncomeStatement ? (parseCurrency(latestIncomeStatement.interestExpense) || 0) : 0;
  const interestCoverage = interestExpense > 0 ? ((operatingIncome || 0) / interestExpense) : 0;

  // ============ Build Internal FinancialData Object ============
  const financialData: FinancialData = {
    symbol: overview.Symbol,
    sharesOutstanding: parseCurrency(overview.SharesOutstanding) ? (parseCurrency(overview.SharesOutstanding) || 0) / 1000000 : 0,
    price: {
      current: currentPrice,
      change,
      changePercent,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      volume,
      timestamp: new Date(),
    },
    profile: {
      sector: overview.Sector || 'Unknown',
      industry: overview.Industry || 'Unknown',
      description: `${overview.Name} is a company in the ${overview.Industry} industry.`,
      employees: 0,
      website: overview.OfficialSite || '',
    },
    financials,
    quarterlyFinancials,
    ratios: {
      pe: peRatio || 0,
      pb: pbRatio || 0,
      ps: psRatio || 0,
      roe: roe ? roe * 100 : 0,
      roa: roa ? roa * 100 : 0,
      roic: roic * 100, // Convert to percentage
      grossMargin: grossMargin * 100, // Convert to percentage
      operatingMargin: operatingMargin ? operatingMargin * 100 : 0,
      netMargin: netMargin ? netMargin * 100 : 0,
      debtToEquity: debtToEquity * 100, // Convert to percentage
      currentRatio: currentRatio,
      interestCoverage: interestCoverage || 0,
      // Growth rates will be calculated by fundamentals agent from annual financials
      revenueGrowth: 0,
      earningsGrowth: 0,
    },
    balanceSheet: {
      totalAssets: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalAssets) || 0 : 0,
      totalLiabilities: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalLiabilities) || 0 : 0,
      totalEquity: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalShareholderEquity) || 0 : 0,
      totalDebt: totalDebt,
      cash: latestBalanceSheet ? (parseCurrency(latestBalanceSheet.cashAndCashEquivalentsAtCarryingValue) || 0) : 0,
    },
  };

  console.log('[alphaVantageNormalizer] Normalization complete. Price:', financialData.price?.current, 'Financials:', financials.length);
  return financialData;
}

// Type definitions for Alpha Vantage responses
export interface AlphaVantageResponses {
  overview: any;
  quote: any;
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
}
