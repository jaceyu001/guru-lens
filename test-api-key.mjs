#!/usr/bin/env node

import axios from 'axios';

const API_KEY = '99OB7DPSQG1NNK15';
const BASE_URL = 'https://www.alphavantage.co/query';

async function testAPIKey() {
  try {
    console.log(`Testing Alpha Vantage API with key: ${API_KEY.substring(0, 8)}...`);
    
    // Test with a simple quote request
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'JNJ',
        apikey: API_KEY,
      },
      timeout: 10000,
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data['Global Quote'] && Object.keys(response.data['Global Quote']).length > 0) {
      const quote = response.data['Global Quote'];
      console.log('\n✅ SUCCESS: API key is working!');
      console.log(`   Price: ${quote['05. price']}`);
      console.log(`   Volume: ${quote['06. volume']}`);
      return true;
    } else {
      console.log('\n❌ FAILED: Empty quote returned');
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

testAPIKey().then(success => {
  process.exit(success ? 0 : 1);
});
