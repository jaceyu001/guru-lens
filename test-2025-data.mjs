import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function checkAvailableData() {
  console.log('\n=== Checking 2025 Data Availability from Alpha Vantage ===\n');
  
  try {
    // Check Income Statement
    console.log('Fetching Income Statement for JNJ...');
    const incomeResponse = await axios.get(BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const quarterlyReports = incomeResponse.data?.quarterlyReports || [];
    console.log(`\nTotal Quarterly Reports Available: ${quarterlyReports.length}`);
    
    if (quarterlyReports.length > 0) {
      console.log('\nMost Recent Quarterly Reports:');
      quarterlyReports.slice(0, 10).forEach((report, idx) => {
        console.log(`${idx + 1}. ${report.fiscalDateEnding} - Revenue: $${(parseInt(report.totalRevenue) / 1e9).toFixed(2)}B`);
      });
      
      // Check for 2025 data
      const has2025Q1 = quarterlyReports.some(r => r.fiscalDateEnding.startsWith('2025-03'));
      const has2025Q2 = quarterlyReports.some(r => r.fiscalDateEnding.startsWith('2025-06'));
      const has2025Q3 = quarterlyReports.some(r => r.fiscalDateEnding.startsWith('2025-09'));
      
      console.log('\n=== 2025 Data Availability ===');
      console.log(`2025 Q1 (March 31): ${has2025Q1 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q2 (June 30): ${has2025Q2 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q3 (Sept 30): ${has2025Q3 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      
      // Show earliest available data
      const earliestReport = quarterlyReports[quarterlyReports.length - 1];
      const latestReport = quarterlyReports[0];
      console.log(`\nData Range: ${earliestReport.fiscalDateEnding} to ${latestReport.fiscalDateEnding}`);
    }

    // Check Balance Sheet
    console.log('\n\nFetching Balance Sheet for JNJ...');
    const balanceResponse = await axios.get(BASE_URL, {
      params: {
        function: 'BALANCE_SHEET',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const balanceQuarterly = balanceResponse.data?.quarterlyReports || [];
    console.log(`Total Quarterly Balance Sheet Reports: ${balanceQuarterly.length}`);
    
    if (balanceQuarterly.length > 0) {
      console.log('\nMost Recent Balance Sheet Reports:');
      balanceQuarterly.slice(0, 5).forEach((report, idx) => {
        console.log(`${idx + 1}. ${report.fiscalDateEnding}`);
      });
    }

    // Check Cash Flow
    console.log('\n\nFetching Cash Flow for JNJ...');
    const cashFlowResponse = await axios.get(BASE_URL, {
      params: {
        function: 'CASH_FLOW',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const cashFlowQuarterly = cashFlowResponse.data?.quarterlyReports || [];
    console.log(`Total Quarterly Cash Flow Reports: ${cashFlowQuarterly.length}`);
    
    if (cashFlowQuarterly.length > 0) {
      console.log('\nMost Recent Cash Flow Reports:');
      cashFlowQuarterly.slice(0, 5).forEach((report, idx) => {
        console.log(`${idx + 1}. ${report.fiscalDateEnding}`);
      });
    }

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

checkAvailableData();
