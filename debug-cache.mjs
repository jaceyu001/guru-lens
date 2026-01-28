import { getDb } from "./server/db.ts";
import { stockFinancialCache } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function debugCache() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const cached = await db
    .select()
    .from(stockFinancialCache)
    .where(eq(stockFinancialCache.ticker, "JNJ"))
    .limit(1);

  if (cached.length === 0) {
    console.log("No cache entry for JNJ");
    process.exit(0);
  }

  const entry = cached[0];
  console.log("=== JNJ Cache Entry ===");
  console.log("Ticker:", entry.ticker);
  console.log("Company:", entry.companyName);
  console.log("P/E Ratio:", entry.peRatio);
  console.log("ROE:", entry.roe);
  console.log("Financial Data JSON type:", typeof entry.financialDataJson);
  console.log("Financial Data JSON is null:", entry.financialDataJson === null);
  
  if (entry.financialDataJson) {
    const jsonData = typeof entry.financialDataJson === "string" 
      ? JSON.parse(entry.financialDataJson)
      : entry.financialDataJson;
    
    console.log("\n=== Parsed JSON Structure ===");
    console.log("Has quote:", !!jsonData.quote);
    console.log("Has ratios:", !!jsonData.ratios);
    console.log("Has financials:", !!jsonData.financials);
    console.log("Has balanceSheet:", !!jsonData.balanceSheet);
    console.log("Has cashFlow:", !!jsonData.cashFlow);
    
    if (jsonData.financials) {
      console.log("\n=== Financials Data ===");
      console.log("Annual Reports count:", jsonData.financials.annualReports?.length || 0);
      console.log("Quarterly Reports count:", jsonData.financials.quarterlyReports?.length || 0);
      
      if (jsonData.financials.annualReports && jsonData.financials.annualReports.length > 0) {
        console.log("First annual report keys:", Object.keys(jsonData.financials.annualReports[0]).slice(0, 5));
      }
    }
    
    if (jsonData.balanceSheet) {
      console.log("\n=== Balance Sheet Data ===");
      console.log("Annual Reports count:", jsonData.balanceSheet.annualReports?.length || 0);
      console.log("Quarterly Reports count:", jsonData.balanceSheet.quarterlyReports?.length || 0);
    }
    
    if (jsonData.cashFlow) {
      console.log("\n=== Cash Flow Data ===");
      console.log("Annual Reports count:", jsonData.cashFlow.annualReports?.length || 0);
      console.log("Quarterly Reports count:", jsonData.cashFlow.quarterlyReports?.length || 0);
    }
  } else {
    console.log("\nfinancialDataJson is NULL or undefined!");
  }
}

debugCache().catch(console.error);
