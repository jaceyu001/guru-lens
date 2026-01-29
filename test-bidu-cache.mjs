import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '.wrangler/state/d1/miniflare.db');

const db = new Database(dbPath);

try {
  const result = db.prepare(
    "SELECT ticker, financialDataJson FROM stockFinancialCache WHERE ticker = 'BIDU' LIMIT 1"
  ).get();
  
  if (result) {
    console.log('\n=== BIDU CACHED DATA ===');
    console.log('Ticker:', result.ticker);
    
    try {
      const financialData = JSON.parse(result.financialDataJson);
      
      console.log('\n=== QUARTERLY REPORTS STRUCTURE ===');
      if (financialData.financials && financialData.financials.quarterlyReports) {
        console.log('Number of quarterly reports:', financialData.financials.quarterlyReports.length);
        
        if (financialData.financials.quarterlyReports.length > 0) {
          const q1 = financialData.financials.quarterlyReports[0];
          console.log('\nFirst quarterly report:');
          console.log(JSON.stringify(q1, null, 2).substring(0, 500));
          
          console.log('\nKey fields:');
          console.log('- revenue:', q1.revenue);
          console.log('- netIncome:', q1.netIncome);
          console.log('- operatingIncome:', q1.operatingIncome);
          console.log('- freeCashFlow:', q1.freeCashFlow);
          console.log('- operatingCashFlow:', q1.operatingCashFlow);
          console.log('- fiscalDateEnding:', q1.fiscalDateEnding);
          console.log('- fiscalYear:', q1.fiscalYear);
        }
      }
      
      console.log('\n=== ANNUAL REPORTS STRUCTURE ===');
      if (financialData.financials && financialData.financials.annualReports) {
        console.log('Number of annual reports:', financialData.financials.annualReports.length);
        
        if (financialData.financials.annualReports.length > 0) {
          const fy = financialData.financials.annualReports[0];
          console.log('\nFirst annual report:');
          console.log(JSON.stringify(fy, null, 2).substring(0, 500));
        }
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  } else {
    console.log('No BIDU data found in cache');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
