/**
 * Polygon.io API Client
 * 
 * Provides real-time and historical financial data for stocks
 * API Docs: https://polygon.io/docs/stocks/
 * Free tier includes: Real-time quotes, company profiles, financial statements
 */

import { ENV } from "../_core/env";

export interface StockQuote {
  symbol: string;
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  vwap: number;
  timestamp: number;
  afterHours?: number;
  preMarket?: number;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  sic_code: string;
  homepage_url: string;
  total_employees: number;
  list_date: string;
  cik: string;
  bloomberg_ticker: string;
  lei_code: string;
  primary_exchange: string;
  share_class_shares_outstanding: number;
  weighted_shares_outstanding: number;
}

export interface FinancialStatement {
  filing_date: string;
  period_of_report_date: string;
  cik: string;
  fiscal_period: string;
  fiscal_year: number;
  form_type: string;
  source_url: string;
  financials: {
    balance_sheet?: {
      assets?: { value: number };
      liabilities?: { value: number };
      stockholders_equity?: { value: number };
      current_assets?: { value: number };
      current_liabilities?: { value: number };
      long_term_debt?: { value: number };
      cash_and_equivalents?: { value: number };
    };
    income_statement?: {
      revenues?: { value: number };
      operating_expenses?: { value: number };
      operating_income?: { value: number };
      net_income?: { value: number };
      cost_of_revenue?: { value: number };
      gross_profit?: { value: number };
      research_and_development?: { value: number };
      selling_general_and_administrative?: { value: number };
    };
    cash_flow?: {
      operating_cash_flow?: { value: number };
      investing_cash_flow?: { value: number };
      financing_cash_flow?: { value: number };
      free_cash_flow?: { value: number };
    };
  };
}

export interface DailyBar {
  c: number; // close
  h: number; // high
  l: number; // low
  n: number; // number of transactions
  o: number; // open
  t: number; // timestamp
  v: number; // volume
  vw: number; // volume weighted average price
}

export class PolygonClient {
  private apiKey: string;
  private baseUrl = "https://api.polygon.io";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ENV.polygonApiKey;
    if (!this.apiKey) {
      throw new Error("POLYGON_API_KEY environment variable is required");
    }
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append("apikey", this.apiKey);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Polygon API error: ${response.status} ${response.statusText} - ${error}`);
      }
      
      const data = await response.json();
      
      // Polygon returns status field
      if (data.status === "ERROR") {
        throw new Error(`Polygon API error: ${data.message || "Unknown error"}`);
      }
      
      return data;
    } catch (error) {
      console.error(`[Polygon Client] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get latest quote for a stock
   * Free tier: 5 calls/minute
   */
  async getLatestQuote(symbol: string): Promise<StockQuote> {
    const response = await this.fetch<{
      status: string;
      results: {
        symbol: string;
        price: number;
        last_updated: number;
        last_quote?: {
          exchange: number;
          price: number;
          size: number;
          timeframe: string;
          last_updated: number;
        };
        last_trade?: {
          conditions: number[];
          exchange: number;
          price: number;
          sip_timestamp: number;
          size: number;
          timeframe: string;
        };
        option_details?: {
          contract_type: string;
          exercise_style: string;
          expiration_date: string;
          shares_per_contract: number;
          strike_price: number;
        };
        market_status: string;
        name: string;
        post_market_change: number;
        post_market_change_percent: number;
        pre_market_change: number;
        pre_market_change_percent: number;
        previous_close: number;
        updated: number;
      };
    }>(`/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`);

    if (!response.results) {
      throw new Error(`No quote data found for ${symbol}`);
    }

    const result = response.results;
    
    return {
      symbol: result.symbol,
      price: result.price,
      previousClose: result.previous_close,
      open: result.price, // Polygon doesn't always provide open in snapshot
      high: result.price, // Use current price as fallback
      low: result.price,
      volume: 0, // Not in snapshot endpoint
      vwap: result.price,
      timestamp: result.last_updated,
      afterHours: result.post_market_change,
      preMarket: result.pre_market_change,
    };
  }

  /**
   * Get company details
   * Free tier: Included
   */
  async getCompanyInfo(symbol: string): Promise<CompanyInfo> {
    const response = await this.fetch<{
      status: string;
      results: {
        cik: string;
        composite_figi: string;
        share_class_figi: string;
        figi_uid: string;
        lei_code: string;
        legal_entity_identifier: string;
        symbol: string;
        name: string;
        type: string;
        active: boolean;
        primary_exchange: string;
        updated: string;
        url: string;
        description: string;
        list_date: string;
        homepage_url: string;
        total_employees: number;
        sector: string;
        industry_description: string;
        sic_code: string;
        sic_description: string;
        weighted_shares_outstanding: number;
        share_class_shares_outstanding: number;
        bloomberg_ticker: string;
        market_cap: number;
      };
    }>(`/v3/reference/tickers/${symbol}`);

    if (!response.results) {
      throw new Error(`No company info found for ${symbol}`);
    }

    const result = response.results;
    
    return {
      symbol: result.symbol,
      name: result.name,
      description: result.description || "",
      sector: result.sector || "",
      industry: result.industry_description || "",
      sic_code: result.sic_code || "",
      homepage_url: result.homepage_url || "",
      total_employees: result.total_employees || 0,
      list_date: result.list_date || "",
      cik: result.cik || "",
      bloomberg_ticker: result.bloomberg_ticker || "",
      lei_code: result.lei_code || "",
      primary_exchange: result.primary_exchange || "",
      share_class_shares_outstanding: result.share_class_shares_outstanding || 0,
      weighted_shares_outstanding: result.weighted_shares_outstanding || 0,
    };
  }

  /**
   * Get financial statements (10-K, 10-Q)
   * Free tier: Limited to last 5 years
   */
  async getFinancialStatements(
    symbol: string,
    limit: number = 5
  ): Promise<FinancialStatement[]> {
    const response = await this.fetch<{
      status: string;
      results: Array<{
        filing_date: string;
        period_of_report_date: string;
        cik: string;
        fiscal_period: string;
        fiscal_year: number;
        form_type: string;
        source_url: string;
        financials: {
          balance_sheet?: Record<string, { value: number }>;
          income_statement?: Record<string, { value: number }>;
          cash_flow?: Record<string, { value: number }>;
        };
      }>;
    }>(`/vX/reference/financials`, {
      ticker: symbol,
      limit,
      order: "desc",
      sort: "filing_date",
    });

    if (!response.results) {
      return [];
    }

    return response.results.map((stmt) => ({
      filing_date: stmt.filing_date,
      period_of_report_date: stmt.period_of_report_date,
      cik: stmt.cik,
      fiscal_period: stmt.fiscal_period,
      fiscal_year: stmt.fiscal_year,
      form_type: stmt.form_type,
      source_url: stmt.source_url,
      financials: {
        balance_sheet: {
          assets: stmt.financials.balance_sheet?.["assets"],
          liabilities: stmt.financials.balance_sheet?.["liabilities"],
          stockholders_equity: stmt.financials.balance_sheet?.["stockholders_equity"],
          current_assets: stmt.financials.balance_sheet?.["current_assets"],
          current_liabilities: stmt.financials.balance_sheet?.["current_liabilities"],
          long_term_debt: stmt.financials.balance_sheet?.["long_term_debt"],
          cash_and_equivalents: stmt.financials.balance_sheet?.["cash_and_equivalents"],
        },
        income_statement: {
          revenues: stmt.financials.income_statement?.["revenues"],
          operating_expenses: stmt.financials.income_statement?.["operating_expenses"],
          operating_income: stmt.financials.income_statement?.["operating_income"],
          net_income: stmt.financials.income_statement?.["net_income"],
          cost_of_revenue: stmt.financials.income_statement?.["cost_of_revenue"],
          gross_profit: stmt.financials.income_statement?.["gross_profit"],
          research_and_development: stmt.financials.income_statement?.["research_and_development"],
          selling_general_and_administrative: stmt.financials.income_statement?.["selling_general_and_administrative"],
        },
        cash_flow: {
          operating_cash_flow: stmt.financials.cash_flow?.["operating_cash_flow"],
          investing_cash_flow: stmt.financials.cash_flow?.["investing_cash_flow"],
          financing_cash_flow: stmt.financials.cash_flow?.["financing_cash_flow"],
          free_cash_flow: stmt.financials.cash_flow?.["free_cash_flow"],
        },
      },
    }));
  }

  /**
   * Get daily bars (OHLCV)
   * Free tier: 1 minute aggregates, delayed data
   */
  async getDailyBars(symbol: string, limit: number = 30): Promise<DailyBar[]> {
    const response = await this.fetch<{
      status: string;
      results?: Array<{
        c: number;
        h: number;
        l: number;
        n: number;
        o: number;
        t: number;
        v: number;
        vw: number;
      }>;
    }>(`/v2/aggs/ticker/${symbol}/range/1/day/2023-01-01/2024-12-31`, {
      limit,
      sort: "desc",
    });

    if (!response.results) {
      return [];
    }

    return response.results;
  }
}

export const polygonClient = new PolygonClient();
