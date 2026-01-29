import { getStockData } from './server/services/alphaVantageWrapper.ts';

async function testQuarterlyStructure() {
  try {
    const data = await getStockData('BIDU');
    
    console.log('\n=== QUARTERLY DATA STRUCTURE ===');
    console.log('Number of quarterly reports:', data.financials.quarterlyReports.length);
    
    if (data.financials.quarterlyReports.length > 0) {
      const q1 = data.financials.quarterlyReports[0];
      console.log('\nFirst quarterly report fields:');
      console.log(JSON.stringify(q1, null, 2));
      
      console.log('\nChecking for metric fields:');
      console.log('- revenue:', q1.revenue);
      console.log('- netIncome:', q1.netIncome);
      console.log('- operatingIncome:', q1.operatingIncome);
      console.log('- freeCashFlow:', q1.freeCashFlow);
      console.log('- operatingCashFlow:', q1.operatingCashFlow);
    }
    
    console.log('\n=== ANNUAL DATA STRUCTURE ===');
    console.log('Number of annual reports:', data.financials.annualReports.length);
    
    if (data.financials.annualReports.length > 0) {
      const fy = data.financials.annualReports[0];
      console.log('\nFirst annual report fields:');
      console.log(JSON.stringify(fy, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuarterlyStructure();
