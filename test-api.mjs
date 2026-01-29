import { getStockData } from './server/services/alphaVantageWrapper.ts';

try {
  const data = await getStockData('JNJ');
  console.log('API Response Structure:');
  console.log('- financials type:', typeof data.financials);
  console.log('- financials is array:', Array.isArray(data.financials));
  console.log('- financials keys:', Object.keys(data.financials || {}));
  console.log('- annualReports count:', data.financials?.annualReports?.length || 0);
  console.log('- quarterlyReports count:', data.financials?.quarterlyReports?.length || 0);
  
  if (data.financials?.quarterlyReports && data.financials.quarterlyReports.length > 0) {
    console.log('\nFirst quarterly report:', JSON.stringify(data.financials.quarterlyReports[0], null, 2).substring(0, 500));
  }
  
  console.log('\nQuote:', data.quote);
  console.log('Ratios:', data.ratios);
} catch (error) {
  console.error('Error:', error.message);
}
