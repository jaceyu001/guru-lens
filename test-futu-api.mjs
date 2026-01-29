import fetch from 'node-fetch';

const API_KEY = '99OB7DPSQG1NNK15';

async function testFUTU() {
  console.log('Testing FUTU with Alpha Vantage API...\n');
  
  // Test GLOBAL_QUOTE
  console.log('1. Testing GLOBAL_QUOTE:');
  const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=FUTU&apikey=${API_KEY}`;
  const quoteRes = await fetch(quoteUrl);
  const quoteData = await quoteRes.json();
  console.log('Quote response:', JSON.stringify(quoteData, null, 2));
  
  // Test INCOME_STATEMENT
  console.log('\n2. Testing INCOME_STATEMENT:');
  const incomeUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=FUTU&apikey=${API_KEY}`;
  const incomeRes = await fetch(incomeUrl);
  const incomeData = await incomeRes.json();
  console.log('Income statement response (first 500 chars):', JSON.stringify(incomeData, null, 2).substring(0, 500));
  
  // Test BALANCE_SHEET
  console.log('\n3. Testing BALANCE_SHEET:');
  const balanceUrl = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=FUTU&apikey=${API_KEY}`;
  const balanceRes = await fetch(balanceUrl);
  const balanceData = await balanceRes.json();
  console.log('Balance sheet response (first 500 chars):', JSON.stringify(balanceData, null, 2).substring(0, 500));
}

testFUTU().catch(console.error);
