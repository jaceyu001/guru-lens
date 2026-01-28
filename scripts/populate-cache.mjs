#!/usr/bin/env node

import { getStockData } from '../server/services/alphaVantageWrapper.ts';
import { updateCache } from '../server/services/cacheFirstDataFetcher.ts';

async function populateCache() {
  const tickers = ['BIDU', 'AAPL', 'MSFT', 'GOOGL', 'TSLA'];
  
  for (const ticker of tickers) {
    try {
      console.log(`Fetching data for ${ticker}...`);
      const data = await getStockData(ticker);
      
      if (data) {
        console.log(`Updating cache for ${ticker}...`);
        const success = await updateCache(ticker, data);
        if (success) {
          console.log(`✓ ${ticker} cached successfully`);
          console.log(`  Price: $${data.quote?.price || 'N/A'}`);
          console.log(`  P/E: ${data.ratios?.pe || 'N/A'}`);
          console.log(`  P/B: ${data.ratios?.pb || 'N/A'}`);
        } else {
          console.log(`✗ Failed to cache ${ticker}`);
        }
      } else {
        console.log(`✗ No data returned for ${ticker}`);
      }
    } catch (error) {
      console.error(`Error processing ${ticker}:`, error);
    }
  }
}

populateCache().catch(console.error);
