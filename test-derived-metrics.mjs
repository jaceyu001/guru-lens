import axios from 'axios';

const API_KEY = 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function testDerivedMetrics() {
  console.log('Testing ROIC and Payout Ratio calculations for JNJ...\n');
  
  try {
    // Fetch overview data
    const overviewUrl = `${BASE_URL}?function=OVERVIEW&symbol=JNJ&apikey=${API_KEY}`;
    const overviewResponse = await axios.get(overviewUrl);
    const overview = overviewResponse.data;
    
    console.log('=== Overview Data ===');
    console.log('EPS:', overview.EPS);
    console.log('Dividend Per Share:', overview.DividendPerShare);
    console.log('ROE:', overview.ReturnOnEquityTTM);
    console.log('ROA:', overview.ReturnOnAssetsTTM);
    console.log('');
    
    // Fetch income statement
    const incomeUrl = `${BASE_URL}?function=INCOME_STATEMENT&symbol=JNJ&apikey=${API_KEY}`;
    const incomeResponse = await axios.get(incomeUrl);
    const latestAnnual = incomeResponse.data.annualReports?.[0];
    
    console.log('=== Latest Annual Income Statement ===');
    console.log('Fiscal Date:', latestAnnual?.fiscalDateEnding);
    console.log('Operating Income:', latestAnnual?.operatingIncome);
    console.log('');
    
    // Fetch balance sheet
    const balanceUrl = `${BASE_URL}?function=BALANCE_SHEET&symbol=JNJ&apikey=${API_KEY}`;
    const balanceResponse = await axios.get(balanceUrl);
    const latestBalance = balanceResponse.data.annualReports?.[0];
    
    console.log('=== Latest Annual Balance Sheet ===');
    console.log('Fiscal Date:', latestBalance?.fiscalDateEnding);
    console.log('Total Assets:', latestBalance?.totalAssets);
    console.log('Current Liabilities:', latestBalance?.currentLiabilities);
    console.log('Total Equity:', latestBalance?.totalEquity);
    console.log('');
    
    // Calculate ROIC manually
    const operatingIncome = parseFloat(latestAnnual?.operatingIncome || 0);
    const totalAssets = parseFloat(latestBalance?.totalAssets || 0);
    const currentLiabilities = parseFloat(latestBalance?.currentLiabilities || 0);
    const taxRate = 0.15;
    
    const nopat = operatingIncome * (1 - taxRate);
    const investedCapital = totalAssets - currentLiabilities;
    const roic = (nopat / investedCapital) * 100;
    
    console.log('=== ROIC Calculation ===');
    console.log('Operating Income:', operatingIncome.toLocaleString());
    console.log('Tax Rate:', (taxRate * 100) + '%');
    console.log('NOPAT:', nopat.toLocaleString());
    console.log('Total Assets:', totalAssets.toLocaleString());
    console.log('Current Liabilities:', currentLiabilities.toLocaleString());
    console.log('Invested Capital:', investedCapital.toLocaleString());
    console.log('ROIC:', roic.toFixed(2) + '%');
    console.log('');
    
    // Calculate Payout Ratio manually
    const eps = parseFloat(overview.EPS || 0);
    const dividendPerShare = parseFloat(overview.DividendPerShare || 0);
    const payoutRatio = (dividendPerShare / eps) * 100;
    
    console.log('=== Payout Ratio Calculation ===');
    console.log('EPS:', eps);
    console.log('Dividend Per Share:', dividendPerShare);
    console.log('Payout Ratio:', payoutRatio.toFixed(2) + '%');
    console.log('Retention Ratio:', (100 - payoutRatio).toFixed(2) + '%');
    console.log('');
    
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('Expected values in alphaVantageWrapper response:');
    console.log('- ratios.roic:', roic.toFixed(2));
    console.log('- ratios.payoutRatio:', payoutRatio.toFixed(2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDerivedMetrics();
