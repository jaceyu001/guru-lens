import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function checkQuarterlyData() {
  console.log('\n=== Comprehensive Quarterly Data Check (Including 2025) ===\n');
  
  try {
    // Check Income Statement
    console.log('📊 INCOME STATEMENT - Quarterly Reports\n');
    const incomeResponse = await axios.get(BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const quarterlyReports = incomeResponse.data?.quarterlyReports || [];
    console.log(`Total Quarterly Reports: ${quarterlyReports.length}`);
    
    if (quarterlyReports.length > 0) {
      console.log('\nAll Available Quarterly Reports:');
      quarterlyReports.forEach((report, idx) => {
        const date = report.fiscalDateEnding;
        const revenue = parseInt(report.totalRevenue) / 1e9;
        console.log(`${idx + 1}. ${date} - Revenue: $${revenue.toFixed(2)}B`);
      });
      
      // Check for 2025 data
      console.log('\n=== 2025 QUARTERLY DATA ===');
      const q1_2025 = quarterlyReports.find(r => r.fiscalDateEnding === '2025-03-31');
      const q2_2025 = quarterlyReports.find(r => r.fiscalDateEnding === '2025-06-30');
      const q3_2025 = quarterlyReports.find(r => r.fiscalDateEnding === '2025-09-30');
      
      console.log(`2025 Q1 (March 31): ${q1_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q2 (June 30): ${q2_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q3 (Sept 30): ${q3_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      
      if (q1_2025) {
        console.log(`\n2025 Q1 Details:`);
        console.log(`  Revenue: $${(parseInt(q1_2025.totalRevenue) / 1e9).toFixed(2)}B`);
        console.log(`  Net Income: $${(parseInt(q1_2025.netIncome) / 1e9).toFixed(2)}B`);
        console.log(`  Operating Income: $${(parseInt(q1_2025.operatingIncome) / 1e9).toFixed(2)}B`);
      }
    }

    // Check Balance Sheet
    console.log('\n\n💰 BALANCE SHEET - Quarterly Reports\n');
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
      console.log('\nAll Available Balance Sheet Reports:');
      balanceQuarterly.forEach((report, idx) => {
        const date = report.fiscalDateEnding;
        const assets = parseInt(report.totalAssets) / 1e9;
        console.log(`${idx + 1}. ${date} - Total Assets: $${assets.toFixed(2)}B`);
      });
      
      // Check for 2025 data
      console.log('\n=== 2025 BALANCE SHEET DATA ===');
      const bs_q1_2025 = balanceQuarterly.find(r => r.fiscalDateEnding === '2025-03-31');
      const bs_q2_2025 = balanceQuarterly.find(r => r.fiscalDateEnding === '2025-06-30');
      const bs_q3_2025 = balanceQuarterly.find(r => r.fiscalDateEnding === '2025-09-30');
      
      console.log(`2025 Q1 Balance Sheet: ${bs_q1_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q2 Balance Sheet: ${bs_q2_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q3 Balance Sheet: ${bs_q3_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
    }

    // Check Cash Flow
    console.log('\n\n💵 CASH FLOW - Quarterly Reports\n');
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
      console.log('\nAll Available Cash Flow Reports:');
      cashFlowQuarterly.forEach((report, idx) => {
        const date = report.fiscalDateEnding;
        const ocf = parseInt(report.operatingCashFlow) / 1e9;
        console.log(`${idx + 1}. ${date} - Operating Cash Flow: $${ocf.toFixed(2)}B`);
      });
      
      // Check for 2025 data
      console.log('\n=== 2025 CASH FLOW DATA ===');
      const cf_q1_2025 = cashFlowQuarterly.find(r => r.fiscalDateEnding === '2025-03-31');
      const cf_q2_2025 = cashFlowQuarterly.find(r => r.fiscalDateEnding === '2025-06-30');
      const cf_q3_2025 = cashFlowQuarterly.find(r => r.fiscalDateEnding === '2025-09-30');
      
      console.log(`2025 Q1 Cash Flow: ${cf_q1_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q2 Cash Flow: ${cf_q2_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      console.log(`2025 Q3 Cash Flow: ${cf_q3_2025 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkQuarterlyData();
