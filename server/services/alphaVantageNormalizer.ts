import type { AlphaVantageResponses } from './alphaVantageWrapper';
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
  annualIncomeReports.forEach((report) => {
    const year = report.fiscalDateEnding?.split('-')[0] || '';
    if (!annualByYear.has(year)) {
      annualByYear.set(year, { fiscalYear: parseInt(year) });
    }
    const entry = annualByYear.get(year)!;
    entry.revenue = parseCurrency(report.totalRevenue) || 0;
    entry.netIncome = parseCurrency(report.netIncome) || 0;
    entry.eps = parseCurrency(report.netIncome) ? (parseCurrency(report.netIncome)! * 1000000) / (parseCurrency(overview!.SharesOutstanding) || 1) : 0;
    entry.period = 'FY';
    entry.operatingIncome = parseCurrency(report.operatingIncome) || 0;
  });

  // Add balance sheet and cash flow data
  annualBalanceReports.forEach((report) => {
    const year = report.fiscalDateEnding?.split('-')[0] || '';
    if (annualByYear.has(year)) {
      const entry = annualByYear.get(year)!;
      entry.freeCashFlow = (parseCurrency(report.totalAssets) || 0) - (parseCurrency(report.totalLiabilities) || 0);
    }
  });

  const financials = Array.from(annualByYear.values());
  console.log('[alphaVantageNormalizer] Built financials array with', financials.length, 'records');

  // ============ Build Quarterly Financials Array ============
  const quarterlyIncomeReports = incomeStatement?.quarterlyReports || [];
  const quarterlyBalanceReports = balanceSheet?.quarterlyReports || [];
  const quarterlyCashFlowReports = cashFlow?.quarterlyReports || [];

  // Create a map of quarterly reports by fiscal period
  const quarterlyByPeriod = new Map<string, any>();

  // Add income statement data
  quarterlyIncomeReports.forEach((report) => {
    const period = report.fiscalDateEnding || '';
    if (!quarterlyByPeriod.has(period)) {
      const [year, month, day] = period.split('-');
      const quarterNum = Math.ceil(parseInt(month) / 3);
      quarterlyByPeriod.set(period, {
        fiscalYear: parseInt(year),
        quarter: `Q${quarterNum}`,
        period: `Q${quarterNum} ${year}`,
      });
    }
    const entry = quarterlyByPeriod.get(period)!;
    entry.revenue = parseCurrency(report.totalRevenue) || 0;
    entry.netIncome = parseCurrency(report.netIncome) || 0;
    entry.eps = parseCurrency(report.netIncome) ? (parseCurrency(report.netIncome)! * 1000000) / (parseCurrency(overview!.SharesOutstanding) || 1) : 0;
    entry.operatingIncome = parseCurrency(report.operatingIncome) || 0;
  });

  // Add cash flow data
  quarterlyCashFlowReports.forEach((report) => {
    const period = report.fiscalDateEnding || '';
    if (quarterlyByPeriod.has(period)) {
      const entry = quarterlyByPeriod.get(period)!;
      entry.operatingCashFlow = parseCurrency(report.operatingCashflow) || 0;
      entry.freeCashFlow = (parseCurrency(report.operatingCashflow) || 0) - (parseCurrency(report.capitalExpenditures) || 0);
    }
  });

  const quarterlyFinancials = Array.from(quarterlyByPeriod.values());
  console.log('[alphaVantageNormalizer] Built quarterly financials array with', quarterlyFinancials.length, 'records');

  // ============ Parse Metrics from Overview ============
  const peRatio = parsePercentage(overview.PERatio);
  const pbRatio = parsePercentage(overview.PriceToBookRatio);
  const psRatio = parsePercentage(overview.PriceToSalesRatioTTM);
  const roe = parsePercentage(overview.ReturnOnEquityTTM);
  const roa = parsePercentage(overview.ReturnOnAssetsTTM);
  const profitMargin = parsePercentage(overview.ProfitMargin);
  const operatingMargin = parsePercentage(overview.OperatingMarginTTM);
  const dividendYield = parsePercentage(overview.DividendYield);
  const revenueGrowth = parsePercentage(overview.QuarterlyRevenueGrowthYOY);
  const earningsGrowth = parsePercentage(overview.QuarterlyEarningsGrowthYOY);

  // Get most recent balance sheet for balance sheet data
  const latestBalanceSheet = annualBalanceReports?.[0];

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
      grossMargin: profitMargin ? profitMargin * 100 : 0,
      operatingMargin: operatingMargin ? operatingMargin * 100 : 0,
      netMargin: profitMargin ? profitMargin * 100 : 0,
      revenueGrowth: revenueGrowth ? revenueGrowth * 100 : 0,
      earningsGrowth: earningsGrowth ? earningsGrowth * 100 : 0,
    },
    balanceSheet: {
      totalAssets: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalAssets) || 0 : 0,
      totalLiabilities: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalLiabilities) || 0 : 0,
      totalEquity: latestBalanceSheet ? parseCurrency(latestBalanceSheet.totalShareholderEquity) || 0 : 0,
      totalDebt: latestBalanceSheet ? ((parseCurrency(latestBalanceSheet.shortTermDebt) || 0) + (parseCurrency(latestBalanceSheet.longTermDebt) || 0)) : 0,
      cash: latestBalanceSheet ? parseCurrency(latestBalanceSheet.cashAndCashEquivalentsAtCarryingValue) || 0 : 0,
    },
  };
  
  console.log('[alphaVantageNormalizer] Normalization complete. Price:', financialData.price?.current, 'Financials:', financialData.financials?.length);

  return financialData;
}
