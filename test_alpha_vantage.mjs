import axios from 'axios';

const API_KEY = 'KXUI9PV4W0B6HHFS';
const BASE_URL = 'https://www.alphavantage.co/query';

async function testGlobalQuote(ticker) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('Global Quote Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const quote = response.data['Global Quote'] || {};
    console.log('\nExtracted Quote:');
    console.log(JSON.stringify(quote, null, 2));
    console.log('\nPrice from quote:');
    console.log(quote['05. price']);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGlobalQuote('TSLA');
