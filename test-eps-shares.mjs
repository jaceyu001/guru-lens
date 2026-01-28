import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function checkEPSAndShares() {
  console.log('\n=== Checking for EPS and Shares Outstanding ===\n');
  
  try {
    // Check Overview for shares outstanding
    console.log('📊 COMPANY OVERVIEW\n');
    const overviewResponse = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const overview = overviewResponse.data;
    console.log('Overview Fields Available:');
    console.log(JSON.stringify(overview, null, 2).substring(0, 2000));
    
    console.log('\n\nShares Outstanding:', overview.SharesOutstanding);
    console.log('EPS (TTM):', overview.EPS);
    console.log('Book Value Per Share:', overview.BookValue);
    console.log('Dividend Per Share:', overview.DividendPerShare);

    // Check Income Statement for EPS
    console.log('\n\n📈 INCOME STATEMENT - Checking for EPS\n');
    const incomeResponse = await axios.get(BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const annualReports = incomeResponse.data?.annualReports || [];
    if (annualReports.length > 0) {
      console.log('Annual Report 2024 Fields:');
      console.log(JSON.stringify(annualReports[0], null, 2).substring(0, 1500));
      
      console.log('\n\nLooking for EPS fields:');
      const report = annualReports[0];
      console.log('basicEPS:', report.basicEPS);
      console.log('dilutedEPS:', report.dilutedEPS);
      console.log('basicAverageShares:', report.basicAverageShares);
      console.log('dilutedAverageShares:', report.dilutedAverageShares);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEPSAndShares();
