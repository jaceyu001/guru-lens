import axios from 'axios';
import fs from 'fs';

const API_KEY = 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';
const TICKER = 'JNJ';

async function fetchAllData() {
  console.log(`Fetching complete data for ${TICKER}...\n`);
  
  const data = {
    ticker: TICKER,
    overview: null,
    quote: null,
    incomeStatement: null,
    balanceSheet: null,
    cashFlow: null,
  };
  
  try {
    // Fetch OVERVIEW
    console.log('Fetching OVERVIEW...');
    const overviewUrl = `${BASE_URL}?function=OVERVIEW&symbol=${TICKER}&apikey=${API_KEY}`;
    const overviewResponse = await axios.get(overviewUrl);
    data.overview = overviewResponse.data;
    console.log('✓ OVERVIEW fetched');
    
    // Wait to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Fetch GLOBAL_QUOTE
    console.log('Fetching GLOBAL_QUOTE...');
    const quoteUrl = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${TICKER}&apikey=${API_KEY}`;
    const quoteResponse = await axios.get(quoteUrl);
    data.quote = quoteResponse.data['Global Quote'];
    console.log('✓ GLOBAL_QUOTE fetched');
    
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Fetch INCOME_STATEMENT
    console.log('Fetching INCOME_STATEMENT...');
    const incomeUrl = `${BASE_URL}?function=INCOME_STATEMENT&symbol=${TICKER}&apikey=${API_KEY}`;
    const incomeResponse = await axios.get(incomeUrl);
    data.incomeStatement = incomeResponse.data;
    console.log('✓ INCOME_STATEMENT fetched');
    
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Fetch BALANCE_SHEET
    console.log('Fetching BALANCE_SHEET...');
    const balanceUrl = `${BASE_URL}?function=BALANCE_SHEET&symbol=${TICKER}&apikey=${API_KEY}`;
    const balanceResponse = await axios.get(balanceUrl);
    data.balanceSheet = balanceResponse.data;
    console.log('✓ BALANCE_SHEET fetched');
    
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Fetch CASH_FLOW
    console.log('Fetching CASH_FLOW...');
    const cashFlowUrl = `${BASE_URL}?function=CASH_FLOW&symbol=${TICKER}&apikey=${API_KEY}`;
    const cashFlowResponse = await axios.get(cashFlowUrl);
    data.cashFlow = cashFlowResponse.data;
    console.log('✓ CASH_FLOW fetched');
    
    // Save to file
    const filename = `jnj-complete-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\n✅ All data saved to ${filename}`);
    
    // Print summary
    console.log('\n=== DATA SUMMARY ===');
    console.log('Overview fields:', Object.keys(data.overview || {}).length);
    console.log('Quote fields:', Object.keys(data.quote || {}).length);
    console.log('Annual Income Reports:', data.incomeStatement?.annualReports?.length || 0);
    console.log('Quarterly Income Reports:', data.incomeStatement?.quarterlyReports?.length || 0);
    console.log('Annual Balance Reports:', data.balanceSheet?.annualReports?.length || 0);
    console.log('Quarterly Balance Reports:', data.balanceSheet?.quarterlyReports?.length || 0);
    console.log('Annual Cash Flow Reports:', data.cashFlow?.annualReports?.length || 0);
    console.log('Quarterly Cash Flow Reports:', data.cashFlow?.quarterlyReports?.length || 0);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

fetchAllData();
