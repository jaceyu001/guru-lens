import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function checkDetailedData() {
  console.log('\n=== Detailed API Response Check ===\n');
  
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

    console.log('\nIncome Statement Response Keys:', Object.keys(incomeResponse.data));
    console.log('Full Response:', JSON.stringify(incomeResponse.data, null, 2).substring(0, 1000));
    
    if (incomeResponse.data.Note) {
      console.log('\n⚠️ API RATE LIMITED:', incomeResponse.data.Note);
    }
    
    if (incomeResponse.data.Error) {
      console.log('\n❌ API ERROR:', incomeResponse.data.Error);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDetailedData();
