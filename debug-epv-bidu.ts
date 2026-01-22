import { getStockData } from "./server/services/realFinancialData";
import { calculateEPV, calculateNormalizedNOPAT } from "./server/services/epvCalculator";

async function debugBIDU() {
  console.log("=== DEBUGGING BIDU EPV CALCULATION ===\n");

  try {
    const financialData = await getStockData("BIDU");
    
    console.log("FINANCIAL DATA EXTRACTED:");
    console.log("========================");
    
    console.log(`\nCurrent Price: $${financialData.price?.current}`);
    console.log(`Diluted Shares: ${financialData.profile?.dilutedSharesOutstanding}B`);
    
    console.log("\nANNUAL FINANCIALS:");
    financialData.financials?.slice(0, 4).forEach((fy) => {
      console.log(`\n${fy.period}:`);
      console.log(`  Revenue: $${fy.revenue}B`);
      console.log(`  Operating Income: $${fy.operatingIncome}B`);
      if (fy.revenue > 0) {
        console.log(`  Operating Margin: ${((fy.operatingIncome || 0) / fy.revenue * 100).toFixed(2)}%`);
      }
    });

    console.log("\nBALANCE SHEET DATA:");
    console.log(`  Total Debt: $${financialData.balanceSheet?.totalDebt}B`);
    console.log(`  Cash & Equivalents: $${financialData.balanceSheet?.cash}B`);
    console.log(`  Net Debt: $${((financialData.balanceSheet?.totalDebt || 0) - (financialData.balanceSheet?.cash || 0))}B`);

    const nopat = calculateNormalizedNOPAT(financialData);
    console.log("\n\nNORMALIZED NOPAT:");
    console.log("==================");
    console.log(`Normalized NOPAT: $${nopat.nopat.toFixed(2)}B`);
    console.log(`Data Points: ${nopat.dataPoints} years`);
    console.log(`Data Availability: ${nopat.dataAvailability}`);

    const epv = calculateEPV(
      financialData,
      financialData.price?.current || 100,
      0.05,
      {
        growthRate: 0.05,
        confidence: "high",
        sources: ["test"],
        reasoning: "test",
      }
    );

    console.log("\n\nEPV RESULTS:");
    console.log("============");
    console.log(`Conservative (0%): $${epv.scenarios.conservative.intrinsicValuePerShare.toFixed(2)}/share`);
    console.log(`Base Case (5%): $${epv.scenarios.baseCase.intrinsicValuePerShare.toFixed(2)}/share`);
    console.log(`Current Price: $${financialData.price?.current}`);
    console.log(`Valuation Range: $${epv.valuationRange.low.toFixed(2)} - $${epv.valuationRange.high.toFixed(2)}`);
    console.log(`Margin of Safety: ${(epv.marginOfSafety * 100).toFixed(1)}%`);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

debugBIDU();
