import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function checkCashFlowStructure() {
  console.log('\n=== Cash Flow Data Structure ===\n');
  
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'CASH_FLOW',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    const quarterly = response.data?.quarterlyReports || [];
    
    if (quarterly.length > 0) {
      console.log('Most Recent Quarterly Report (2025 Q3):');
      console.log(JSON.stringify(quarterly[0], null, 2));
      
      console.log('\n\nSecond Most Recent (2025 Q2):');
      console.log(JSON.stringify(quarterly[1], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCashFlowStructure();
