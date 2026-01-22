import { getStockData } from "./server/services/realFinancialData";
import { calculateEPV } from "./server/services/epvCalculator";
import { extractMarketGrowthRate } from "./server/services/growthRateExtractor";

async function debugPDD() {
  console.log("=== PDD EPV Debug ===\n");

  try {
    const financialData = await getStockData("PDD");
    
    console.log("Financial Data:");
    console.log(`- Revenue (FY2024): ${financialData.financials[1]?.revenue}B`);
    console.log(`- Operating Income (FY2024): ${financialData.financials[1]?.operatingIncome}B`);
    console.log(`- TTM Operating Income: ${financialData.financials[0]?.operatingIncome}B`);
    
    console.log("\nBalance Sheet:");
    console.log(`- Total Debt: ${financialData.balanceSheet?.totalDebt}B`);
    console.log(`- Cash: ${financialData.balanceSheet?.cash}B`);
    console.log(`- Diluted Shares: ${financialData.profile?.dilutedSharesOutstanding}B`);
    
    console.log("\nCurrent Price: $" + financialData.price.current);
    
    // Calculate EPV
    const epvResult = await calculateEPV(
      financialData,
      financialData.price.current
    );
    
    console.log("\nEPV Result:");
    console.log(`- Normalized NOPAT: $${epvResult.normalizedNopat}B`);
    console.log(`- Conservative (0%): $${epvResult.conservativeScenario.intrinsicValue}/share`);
    console.log(`- Base Case (${epvResult.baseScenario.growthRate}%): $${epvResult.baseScenario.intrinsicValue}/share`);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

debugPDD();
