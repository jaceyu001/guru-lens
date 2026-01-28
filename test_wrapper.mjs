import { getStockData } from './server/services/alphaVantageWrapper.ts';

async function test() {
  try {
    const data = await getStockData('TSLA');
    console.log('Stock Data Response:');
    console.log(JSON.stringify({
      quote: data.quote,
      ratios: data.ratios,
      profile: {
        companyName: data.profile.companyName,
        sector: data.profile.sector,
      }
    }, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
