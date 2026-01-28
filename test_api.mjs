import axios from 'axios';

const API_KEY = '99OB7DPSQG1NNK15';
const BASE_URL = 'https://www.alphavantage.co/query';

async function testAPI() {
  try {
    console.log('\n=== TESTING ALPHA VANTAGE API ===\n');
    
    // Test 1: OVERVIEW (company info and ratios)
    console.log('1. OVERVIEW Response:');
    const overview = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: 'BIDU',
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('Key fields in OVERVIEW:');
    console.log('- PERatio:', overview.data.PERatio, '(type: ratio, unit: unitless)');
    console.log('- PriceToBookRatio:', overview.data.PriceToBookRatio, '(type: ratio, unit: unitless)');
    console.log('- ReturnOnEquityTTM:', overview.data.ReturnOnEquityTTM, '(type: %, unit: decimal 0-1)');
    console.log('- ReturnOnAssetsTTM:', overview.data.ReturnOnAssetsTTM, '(type: %, unit: decimal 0-1)');
    console.log('- PriceToSalesRatioTTM:', overview.data.PriceToSalesRatioTTM, '(type: ratio, unit: unitless)');
    console.log('- DividendYield:', overview.data.DividendYield, '(type: %, unit: decimal 0-1)');
    console.log('- MarketCapitalization:', overview.data.MarketCapitalization, '(type: number, unit: dollars)');
    console.log('');
    
    // Test 2: GLOBAL_QUOTE (price data)
    console.log('2. GLOBAL_QUOTE Response:');
    const quote = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'BIDU',
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('Key fields in GLOBAL_QUOTE:');
    console.log('- 05. price:', quote.data['05. price'], '(type: price, unit: dollars)');
    console.log('- 06. volume:', quote.data['06. volume'], '(type: volume, unit: shares)');
    console.log('- 09. change:', quote.data['09. change'], '(type: change, unit: dollars)');
    console.log('- 10. change percent:', quote.data['10. change percent'], '(type: %, unit: string with %)');
    console.log('- 07. latest trading day:', quote.data['07. latest trading day'], '(type: date, unit: YYYY-MM-DD)');
    console.log('');
    
    // Test 3: INCOME_STATEMENT (annual)
    console.log('3. INCOME_STATEMENT (Annual) Response:');
    const income = await axios.get(BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: 'BIDU',
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    if (income.data.annualReports && income.data.annualReports.length > 0) {
      const latest = income.data.annualReports[0];
      console.log('Latest annual report (', latest.fiscalDateEnding, '):');
      console.log('- totalRevenue:', latest.totalRevenue, '(type: number, unit: dollars)');
      console.log('- netIncome:', latest.netIncome, '(type: number, unit: dollars)');
      console.log('- operatingIncome:', latest.operatingIncome, '(type: number, unit: dollars)');
      console.log('- grossProfit:', latest.grossProfit, '(type: number, unit: dollars)');
    }
    console.log('');
    
    // Test 4: INCOME_STATEMENT (quarterly)
    console.log('4. INCOME_STATEMENT (Quarterly) Response:');
    if (income.data.quarterlyReports && income.data.quarterlyReports.length > 0) {
      const latest = income.data.quarterlyReports[0];
      console.log('Latest quarterly report (', latest.fiscalDateEnding, '):');
      console.log('- totalRevenue:', latest.totalRevenue, '(type: number, unit: dollars)');
      console.log('- netIncome:', latest.netIncome, '(type: number, unit: dollars)');
      console.log('- operatingIncome:', latest.operatingIncome, '(type: number, unit: dollars)');
      console.log('- grossProfit:', latest.grossProfit, '(type: number, unit: dollars)');
    }
    console.log('');
    
    // Test 5: BALANCE_SHEET (annual)
    console.log('5. BALANCE_SHEET (Annual) Response:');
    const balance = await axios.get(BASE_URL, {
      params: {
        function: 'BALANCE_SHEET',
        symbol: 'BIDU',
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    if (balance.data.annualReports && balance.data.annualReports.length > 0) {
      const latest = balance.data.annualReports[0];
      console.log('Latest annual balance sheet (', latest.fiscalDateEnding, '):');
      console.log('- totalAssets:', latest.totalAssets, '(type: number, unit: dollars)');
      console.log('- totalLiabilities:', latest.totalLiabilities, '(type: number, unit: dollars)');
      console.log('- totalShareholderEquity:', latest.totalShareholderEquity, '(type: number, unit: dollars)');
      console.log('- totalCurrentAssets:', latest.totalCurrentAssets, '(type: number, unit: dollars)');
      console.log('- totalCurrentLiabilities:', latest.totalCurrentLiabilities, '(type: number, unit: dollars)');
      console.log('- longTermDebt:', latest.longTermDebt, '(type: number, unit: dollars)');
      console.log('- shortTermDebt:', latest.shortTermDebt, '(type: number, unit: dollars)');
    }
    console.log('');
    
    // Test 6: CASH_FLOW (annual)
    console.log('6. CASH_FLOW (Annual) Response:');
    const cashFlow = await axios.get(BASE_URL, {
      params: {
        function: 'CASH_FLOW',
        symbol: 'BIDU',
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    if (cashFlow.data.annualReports && cashFlow.data.annualReports.length > 0) {
      const latest = cashFlow.data.annualReports[0];
      console.log('Latest annual cash flow (', latest.fiscalDateEnding, '):');
      console.log('- operatingCashFlow:', latest.operatingCashFlow, '(type: number, unit: dollars)');
      console.log('- capitalExpenditures:', latest.capitalExpenditures, '(type: number, unit: dollars)');
      console.log('- investingCashFlow:', latest.investingCashFlow, '(type: number, unit: dollars)');
      console.log('- financingCashFlow:', latest.financingCashFlow, '(type: number, unit: dollars)');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
