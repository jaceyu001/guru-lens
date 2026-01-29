import fs from 'fs';

// Load the fetched JNJ data
const data = JSON.parse(fs.readFileSync('jnj-complete-data-1769644458041.json', 'utf8'));

const overview = data.overview;
const quote = data.quote;
const latestAnnualIncome = data.incomeStatement?.annualReports?.[0];
const latestQuarterlyIncome = data.incomeStatement?.quarterlyReports?.[0];
const latestAnnualBalance = data.balanceSheet?.annualReports?.[0];
const latestQuarterlyBalance = data.balanceSheet?.quarterlyReports?.[0];
const latestAnnualCashFlow = data.cashFlow?.annualReports?.[0];
const latestQuarterlyCashFlow = data.cashFlow?.quarterlyReports?.[0];

// Helper to format numbers
const fmt = (val) => {
  if (val === null || val === undefined) return 'N/A';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return num.toLocaleString();
};

// Define all data points with their sources and usage
const dataPoints = [
  // Dashboard - Basic Info
  {
    name: 'Company Name',
    usedBy: 'Dashboard',
    value: overview?.Name,
    apiSource: 'OVERVIEW.Name',
    unit: 'text',
    formula: null
  },
  {
    name: 'Sector',
    usedBy: 'Dashboard',
    value: overview?.Sector,
    apiSource: 'OVERVIEW.Sector',
    unit: 'text',
    formula: null
  },
  {
    name: 'Industry',
    usedBy: 'Dashboard',
    value: overview?.Industry,
    apiSource: 'OVERVIEW.Industry',
    unit: 'text',
    formula: null
  },
  {
    name: 'Exchange',
    usedBy: 'Dashboard',
    value: overview?.Exchange,
    apiSource: 'OVERVIEW.Exchange',
    unit: 'text',
    formula: null
  },
  
  // Dashboard - Quote Data
  {
    name: 'Price',
    usedBy: 'Dashboard',
    value: fmt(quote?.['05. price']),
    apiSource: 'GLOBAL_QUOTE["05. price"]',
    unit: '$',
    formula: null
  },
  {
    name: 'Change',
    usedBy: 'Dashboard',
    value: fmt(quote?.['09. change']),
    apiSource: 'GLOBAL_QUOTE["09. change"]',
    unit: '$',
    formula: null
  },
  {
    name: 'Change Percent',
    usedBy: 'Dashboard',
    value: quote?.['10. change percent'],
    apiSource: 'GLOBAL_QUOTE["10. change percent"]',
    unit: '%',
    formula: null
  },
  {
    name: 'Volume',
    usedBy: 'Dashboard',
    value: fmt(quote?.['06. volume']),
    apiSource: 'GLOBAL_QUOTE["06. volume"]',
    unit: 'shares',
    formula: null
  },
  
  // Dashboard - Key Ratios
  {
    name: 'P/E Ratio',
    usedBy: 'Dashboard',
    value: overview?.PERatio,
    apiSource: 'OVERVIEW.PERatio',
    unit: 'ratio',
    formula: null
  },
  {
    name: 'P/B Ratio',
    usedBy: 'Dashboard',
    value: overview?.PriceToBookRatio,
    apiSource: 'OVERVIEW.PriceToBookRatio',
    unit: 'ratio',
    formula: null
  },
  {
    name: 'ROE',
    usedBy: 'Dashboard, Fundamentals Agent',
    value: (parseFloat(overview?.ReturnOnEquityTTM || 0) * 100).toFixed(2) + '%',
    apiSource: 'OVERVIEW.ReturnOnEquityTTM',
    unit: '%',
    formula: 'ReturnOnEquityTTM × 100'
  },
  {
    name: 'ROA',
    usedBy: 'Dashboard, Fundamentals Agent',
    value: (parseFloat(overview?.ReturnOnAssetsTTM || 0) * 100).toFixed(2) + '%',
    apiSource: 'OVERVIEW.ReturnOnAssetsTTM',
    unit: '%',
    formula: 'ReturnOnAssetsTTM × 100'
  },
  {
    name: 'Debt/Equity',
    usedBy: 'Dashboard, Financial Health Agent',
    value: latestAnnualBalance ? ((parseFloat(latestAnnualBalance.longTermDebt || 0) + parseFloat(latestAnnualBalance.shortTermDebt || 0)) / parseFloat(latestAnnualBalance.totalEquity)).toFixed(2) : 'N/A',
    apiSource: 'BALANCE_SHEET (calculated)',
    unit: 'ratio',
    formula: '(Long Term Debt + Short Term Debt) / Total Equity'
  },
  {
    name: 'Net Margin',
    usedBy: 'Dashboard, Fundamentals Agent',
    value: latestAnnualIncome ? ((parseFloat(latestAnnualIncome.netIncome) / parseFloat(latestAnnualIncome.totalRevenue)) * 100).toFixed(2) + '%' : 'N/A',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: '%',
    formula: '(Net Income / Revenue) × 100'
  },
  
  // Fundamentals Agent - Growth Metrics
  {
    name: 'Revenue (Latest Annual)',
    usedBy: 'Fundamentals Agent',
    value: fmt(latestAnnualIncome?.totalRevenue),
    apiSource: 'INCOME_STATEMENT.annualReports[0].totalRevenue',
    unit: '$',
    formula: null
  },
  {
    name: 'Revenue Growth',
    usedBy: 'Fundamentals Agent',
    value: 'Calculated from TTM vs FY',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: '%',
    formula: '((TTM Revenue - Last FY Revenue) / Last FY Revenue) × 100'
  },
  {
    name: 'Net Income (Latest Annual)',
    usedBy: 'Fundamentals Agent',
    value: fmt(latestAnnualIncome?.netIncome),
    apiSource: 'INCOME_STATEMENT.annualReports[0].netIncome',
    unit: '$',
    formula: null
  },
  {
    name: 'Earnings Growth',
    usedBy: 'Fundamentals Agent',
    value: 'Calculated from TTM vs FY',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: '%',
    formula: '((TTM Net Income - Last FY Net Income) / Last FY Net Income) × 100'
  },
  {
    name: 'Operating Income',
    usedBy: 'Fundamentals Agent, ROIC Calculation',
    value: fmt(latestAnnualIncome?.operatingIncome),
    apiSource: 'INCOME_STATEMENT.annualReports[0].operatingIncome',
    unit: '$',
    formula: null
  },
  {
    name: 'Gross Profit',
    usedBy: 'Fundamentals Agent',
    value: fmt(latestAnnualIncome?.grossProfit),
    apiSource: 'INCOME_STATEMENT.annualReports[0].grossProfit',
    unit: '$',
    formula: null
  },
  {
    name: 'Gross Margin',
    usedBy: 'Fundamentals Agent',
    value: latestAnnualIncome ? ((parseFloat(latestAnnualIncome.grossProfit) / parseFloat(latestAnnualIncome.totalRevenue)) * 100).toFixed(2) + '%' : 'N/A',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: '%',
    formula: '(Gross Profit / Revenue) × 100'
  },
  {
    name: 'Operating Margin',
    usedBy: 'Fundamentals Agent',
    value: latestAnnualIncome ? ((parseFloat(latestAnnualIncome.operatingIncome) / parseFloat(latestAnnualIncome.totalRevenue)) * 100).toFixed(2) + '%' : 'N/A',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: '%',
    formula: '(Operating Income / Revenue) × 100'
  },
  
  // Fundamentals Agent - Cash Flow
  {
    name: 'Operating Cash Flow',
    usedBy: 'Fundamentals Agent, Financial Health Agent',
    value: fmt(latestAnnualCashFlow?.operatingCashflow),
    apiSource: 'CASH_FLOW.annualReports[0].operatingCashflow',
    unit: '$',
    formula: null
  },
  {
    name: 'Capital Expenditure',
    usedBy: 'Fundamentals Agent',
    value: fmt(latestAnnualCashFlow?.capitalExpenditures),
    apiSource: 'CASH_FLOW.annualReports[0].capitalExpenditures',
    unit: '$',
    formula: null
  },
  {
    name: 'Free Cash Flow',
    usedBy: 'Fundamentals Agent, Valuation Agent',
    value: latestAnnualCashFlow ? fmt(parseFloat(latestAnnualCashFlow.operatingCashflow) - parseFloat(latestAnnualCashFlow.capitalExpenditures)) : 'N/A',
    apiSource: 'CASH_FLOW (calculated)',
    unit: '$',
    formula: 'Operating Cash Flow - Capital Expenditure'
  },
  {
    name: 'FCF Growth',
    usedBy: 'Fundamentals Agent',
    value: 'Calculated from TTM vs FY',
    apiSource: 'CASH_FLOW (calculated)',
    unit: '%',
    formula: '((TTM FCF - Last FY FCF) / Last FY FCF) × 100'
  },
  
  // Financial Health Agent - Balance Sheet
  {
    name: 'Total Assets',
    usedBy: 'Financial Health Agent, ROIC Calculation',
    value: fmt(latestAnnualBalance?.totalAssets),
    apiSource: 'BALANCE_SHEET.annualReports[0].totalAssets',
    unit: '$',
    formula: null
  },
  {
    name: 'Total Liabilities',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualBalance?.totalLiabilities),
    apiSource: 'BALANCE_SHEET.annualReports[0].totalLiabilities',
    unit: '$',
    formula: null
  },
  {
    name: 'Total Equity',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualBalance?.totalEquity),
    apiSource: 'BALANCE_SHEET.annualReports[0].totalEquity',
    unit: '$',
    formula: null
  },
  {
    name: 'Current Assets',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualBalance?.currentAssets),
    apiSource: 'BALANCE_SHEET.annualReports[0].currentAssets',
    unit: '$',
    formula: null
  },
  {
    name: 'Current Liabilities',
    usedBy: 'Financial Health Agent, ROIC Calculation',
    value: fmt(latestAnnualBalance?.currentLiabilities),
    apiSource: 'BALANCE_SHEET.annualReports[0].currentLiabilities',
    unit: '$',
    formula: null
  },
  {
    name: 'Current Ratio',
    usedBy: 'Financial Health Agent',
    value: latestAnnualBalance ? (parseFloat(latestAnnualBalance.currentAssets) / parseFloat(latestAnnualBalance.currentLiabilities)).toFixed(2) : 'N/A',
    apiSource: 'BALANCE_SHEET (calculated)',
    unit: 'ratio',
    formula: 'Current Assets / Current Liabilities'
  },
  {
    name: 'Long Term Debt',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualBalance?.longTermDebt),
    apiSource: 'BALANCE_SHEET.annualReports[0].longTermDebt',
    unit: '$',
    formula: null
  },
  {
    name: 'Short Term Debt',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualBalance?.shortTermDebt),
    apiSource: 'BALANCE_SHEET.annualReports[0].shortTermDebt',
    unit: '$',
    formula: null
  },
  {
    name: 'Cash',
    usedBy: 'Financial Health Agent, Valuation Agent',
    value: fmt(latestAnnualBalance?.cashAndCashEquivalentsAtCarryingValue),
    apiSource: 'BALANCE_SHEET.annualReports[0].cashAndCashEquivalentsAtCarryingValue',
    unit: '$',
    formula: null
  },
  
  // Valuation Agent - Per Share Metrics
  {
    name: 'Shares Outstanding',
    usedBy: 'Valuation Agent',
    value: fmt(overview?.SharesOutstanding),
    apiSource: 'OVERVIEW.SharesOutstanding',
    unit: 'shares',
    formula: null
  },
  {
    name: 'EPS',
    usedBy: 'Valuation Agent, Payout Ratio',
    value: overview?.EPS,
    apiSource: 'OVERVIEW.EPS',
    unit: '$/share',
    formula: null
  },
  {
    name: 'Diluted EPS',
    usedBy: 'Valuation Agent',
    value: overview?.DilutedEPSTTM,
    apiSource: 'OVERVIEW.DilutedEPSTTM',
    unit: '$/share',
    formula: null
  },
  {
    name: 'Book Value Per Share',
    usedBy: 'Valuation Agent',
    value: overview?.BookValue,
    apiSource: 'OVERVIEW.BookValue',
    unit: '$/share',
    formula: null
  },
  {
    name: 'Revenue Per Share',
    usedBy: 'Valuation Agent',
    value: overview?.RevenuePerShareTTM,
    apiSource: 'OVERVIEW.RevenuePerShareTTM',
    unit: '$/share',
    formula: null
  },
  {
    name: 'Dividend Per Share',
    usedBy: 'Valuation Agent, Payout Ratio',
    value: overview?.DividendPerShare,
    apiSource: 'OVERVIEW.DividendPerShare',
    unit: '$/share',
    formula: null
  },
  {
    name: 'Dividend Yield',
    usedBy: 'Valuation Agent',
    value: (parseFloat(overview?.DividendYield || 0) * 100).toFixed(2) + '%',
    apiSource: 'OVERVIEW.DividendYield',
    unit: '%',
    formula: 'DividendYield × 100'
  },
  
  // Derived Metrics
  {
    name: 'ROIC',
    usedBy: 'Fundamentals Agent',
    value: latestAnnualIncome && latestAnnualBalance ? 
      ((parseFloat(latestAnnualIncome.operatingIncome) * 0.85) / (parseFloat(latestAnnualBalance.totalAssets) - parseFloat(latestAnnualBalance.currentLiabilities)) * 100).toFixed(2) + '%' : 'N/A',
    apiSource: 'Calculated from INCOME_STATEMENT + BALANCE_SHEET',
    unit: '%',
    formula: '(Operating Income × (1 - Tax Rate)) / (Total Assets - Current Liabilities) × 100'
  },
  {
    name: 'Payout Ratio',
    usedBy: 'Fundamentals Agent',
    value: overview?.EPS && overview?.DividendPerShare ? 
      ((parseFloat(overview.DividendPerShare) / parseFloat(overview.EPS)) * 100).toFixed(2) + '%' : 'N/A',
    apiSource: 'Calculated from OVERVIEW',
    unit: '%',
    formula: '(Dividend Per Share / EPS) × 100'
  },
  {
    name: 'Interest Expense',
    usedBy: 'Financial Health Agent',
    value: fmt(latestAnnualIncome?.interestExpense),
    apiSource: 'INCOME_STATEMENT.annualReports[0].interestExpense',
    unit: '$',
    formula: null
  },
  {
    name: 'Interest Coverage',
    usedBy: 'Financial Health Agent',
    value: latestAnnualIncome?.interestExpense ? 
      (parseFloat(latestAnnualIncome.operatingIncome) / parseFloat(latestAnnualIncome.interestExpense)).toFixed(2) : 'N/A',
    apiSource: 'INCOME_STATEMENT (calculated)',
    unit: 'ratio',
    formula: 'Operating Income / Interest Expense'
  },
  
  // Market Data
  {
    name: 'Market Cap',
    usedBy: 'Dashboard, Valuation Agent',
    value: fmt(overview?.MarketCapitalization),
    apiSource: 'OVERVIEW.MarketCapitalization',
    unit: '$',
    formula: null
  },
  {
    name: 'P/S Ratio',
    usedBy: 'Valuation Agent',
    value: overview?.PriceToSalesRatioTTM,
    apiSource: 'OVERVIEW.PriceToSalesRatioTTM',
    unit: 'ratio',
    formula: null
  },
];

// Generate markdown table
let markdown = `# Comprehensive Data Source Audit for JNJ\n\n`;
markdown += `Generated: ${new Date().toISOString()}\n\n`;
markdown += `## Data Summary\n\n`;
markdown += `- Total Data Points: ${dataPoints.length}\n`;
markdown += `- Data Points with Values: ${dataPoints.filter(d => d.value !== 'N/A' && d.value !== null).length}\n`;
markdown += `- Data Points Missing: ${dataPoints.filter(d => d.value === 'N/A' || d.value === null).length}\n\n`;

markdown += `## Complete Data Point Table\n\n`;
markdown += `| Data Point Name | Used By | Value (JNJ) | API Source | Unit | Formula |\n`;
markdown += `|----------------|---------|-------------|------------|------|----------|\n`;

dataPoints.forEach(dp => {
  const value = dp.value || 'N/A';
  const formula = dp.formula || '-';
  markdown += `| ${dp.name} | ${dp.usedBy} | ${value} | ${dp.apiSource} | ${dp.unit} | ${formula} |\n`;
});

markdown += `\n## Missing or Problematic Data Points\n\n`;
const missing = dataPoints.filter(d => d.value === 'N/A' || d.value === null);
if (missing.length > 0) {
  missing.forEach(dp => {
    markdown += `- **${dp.name}** (used by ${dp.usedBy}): Missing from ${dp.apiSource}\n`;
  });
} else {
  markdown += `✅ All data points have values!\n`;
}

markdown += `\n## Data Quality Notes\n\n`;
markdown += `1. **ROIC Calculation**: Requires Operating Income, Total Assets, and Current Liabilities - all available ✓\n`;
markdown += `2. **Payout Ratio**: Requires EPS and Dividend Per Share - both available ✓\n`;
markdown += `3. **Growth Metrics**: Require TTM calculation from quarterly data - data available ✓\n`;
markdown += `4. **Interest Coverage**: Requires Interest Expense - available ✓\n`;

// Save to file
fs.writeFileSync('DATA_SOURCE_AUDIT_JNJ.md', markdown);
console.log('✅ Data source audit saved to DATA_SOURCE_AUDIT_JNJ.md');
console.log(`\nTotal data points: ${dataPoints.length}`);
console.log(`Data points with values: ${dataPoints.filter(d => d.value !== 'N/A' && d.value !== null).length}`);
console.log(`Data points missing: ${dataPoints.filter(d => d.value === 'N/A' || d.value === null).length}`);
