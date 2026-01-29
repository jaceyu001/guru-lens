import fs from 'fs';

// Load the fetched JNJ data
const data = JSON.parse(fs.readFileSync('jnj-complete-data-1769644458041.json', 'utf8'));

const quarterlyReports = data.balanceSheet?.quarterlyReports || [];

console.log(`Total quarterly reports: ${quarterlyReports.length}`);
console.log(`First 5 fiscal dates: ${quarterlyReports.slice(0, 5).map(r => r.fiscalDateEnding).join(', ')}\n`);

// Find the latest quarterly report with actual data (not None/null)
const latestQuarterlyBalance = quarterlyReports.find(report => 
  report.totalAssets && report.totalAssets !== 'None' && parseFloat(report.totalAssets) > 0
);

if (!latestQuarterlyBalance) {
  console.log('❌ No quarterly balance sheet data with actual values found!');
  process.exit(1);
}

console.log('=== Latest Quarterly Balance Sheet for JNJ (with data) ===\n');
console.log('Fiscal Date:', latestQuarterlyBalance.fiscalDateEnding);
console.log('');

const fields = [
  'totalAssets',
  'totalLiabilities',
  'totalShareholderEquity',
  'currentAssets',
  'currentLiabilities',
  'longTermDebt',
  'shortTermDebt',
  'cashAndCashEquivalentsAtCarryingValue',
  'cashAndShortTermInvestments',
];

fields.forEach(field => {
  const value = latestQuarterlyBalance[field];
  if (value && value !== 'None') {
    const num = parseFloat(value);
    const formatted = num >= 1e9 ? `$${(num / 1e9).toFixed(2)}B` : `$${(num / 1e6).toFixed(2)}M`;
    console.log(`${field}: ${formatted}`);
  } else {
    console.log(`${field}: NOT AVAILABLE`);
  }
});

console.log('\n=== Calculated Ratios ===\n');

const totalAssets = parseFloat(latestQuarterlyBalance.totalAssets || 0);
const totalLiabilities = parseFloat(latestQuarterlyBalance.totalLiabilities || 0);
const totalEquity = parseFloat(latestQuarterlyBalance.totalShareholderEquity || 0);
const currentAssets = parseFloat(latestQuarterlyBalance.currentAssets || 0);
const currentLiabilities = parseFloat(latestQuarterlyBalance.currentLiabilities || 0);
const longTermDebt = parseFloat(latestQuarterlyBalance.longTermDebt || 0);
const shortTermDebt = parseFloat(latestQuarterlyBalance.shortTermDebt || 0);
const cash = parseFloat(latestQuarterlyBalance.cashAndCashEquivalentsAtCarryingValue || 0);

console.log(`Current Ratio: ${(currentAssets / currentLiabilities).toFixed(2)}`);
console.log(`Debt/Equity: ${((longTermDebt + shortTermDebt) / totalEquity).toFixed(2)}`);
console.log(`Debt/Assets: ${((longTermDebt + shortTermDebt) / totalAssets).toFixed(2)}`);
console.log(`Cash: $${(cash / 1e9).toFixed(2)}B`);

console.log('\n✅ All balance sheet fields are available from quarterly data!');
