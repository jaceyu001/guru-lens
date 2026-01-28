import { describe, it } from "vitest";
import { getDb } from "./db";
import { stockFinancialCache } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Debug Cache Data", () => {
  it("should inspect JNJ cache entry", async () => {
    const db = await getDb();
    if (!db) {
      console.log("Database not available");
      return;
    }

    const cached = await db
      .select()
      .from(stockFinancialCache)
      .where(eq(stockFinancialCache.ticker, "JNJ"))
      .limit(1);

    if (cached.length === 0) {
      console.log("No cache entry for JNJ");
      return;
    }

    const entry = cached[0];
    console.log("\n=== JNJ Cache Entry ===");
    console.log("Ticker:", entry.ticker);
    console.log("Company:", entry.companyName);
    console.log("P/E Ratio:", entry.peRatio);
    console.log("ROE:", entry.roe);
    console.log("Financial Data JSON type:", typeof entry.financialDataJson);
    console.log("Financial Data JSON is null:", entry.financialDataJson === null);
    console.log("Financial Data JSON keys:", entry.financialDataJson ? Object.keys(entry.financialDataJson) : "N/A");
    
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
          const firstReport = jsonData.financials.annualReports[0];
          console.log("First annual report keys:", Object.keys(firstReport).slice(0, 10));
          console.log("First annual report totalRevenue:", firstReport.totalRevenue);
          console.log("First annual report netIncome:", firstReport.netIncome);
        }
      }
      
      if (jsonData.balanceSheet) {
        console.log("\n=== Balance Sheet Data ===");
        console.log("Annual Reports count:", jsonData.balanceSheet.annualReports?.length || 0);
        console.log("Quarterly Reports count:", jsonData.balanceSheet.quarterlyReports?.length || 0);
        
        if (jsonData.balanceSheet.annualReports && jsonData.balanceSheet.annualReports.length > 0) {
          const firstReport = jsonData.balanceSheet.annualReports[0];
          console.log("First annual report keys:", Object.keys(firstReport).slice(0, 10));
        }
      }
      
      if (jsonData.cashFlow) {
        console.log("\n=== Cash Flow Data ===");
        console.log("Annual Reports count:", jsonData.cashFlow.annualReports?.length || 0);
        console.log("Quarterly Reports count:", jsonData.cashFlow.quarterlyReports?.length || 0);
        
        if (jsonData.cashFlow.annualReports && jsonData.cashFlow.annualReports.length > 0) {
          const firstReport = jsonData.cashFlow.annualReports[0];
          console.log("First annual report keys:", Object.keys(firstReport).slice(0, 10));
        }
      }
    } else {
      console.log("\nfinancialDataJson is NULL or undefined!");
    }
  });
});
