#!/usr/bin/env python3
"""
yfinance Wrapper Service
Provides real financial data for stocks via yfinance
This script is called from Node.js to fetch stock data
"""

import json
import sys
import os
import ssl
import urllib3
import yfinance as yf
from datetime import datetime
import math

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure SSL to be more lenient
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

# Set environment variables for certificate handling
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

def get_stock_data(symbol):
    """Fetch comprehensive stock data for a given symbol"""
    try:
        # Create ticker object - let yfinance handle the session
        # Don't pass a custom session, let yfinance use its default curl_cffi session
        ticker = yf.Ticker(symbol)
        
        # Get current quote
        info = ticker.info
        
        # Get historical data (last 1 year)
        hist = ticker.history(period="1y")
        
        # Get latest price
        latest_price = hist['Close'].iloc[-1] if len(hist) > 0 else info.get('currentPrice', 0)
        previous_close = hist['Close'].iloc[-2] if len(hist) > 1 else info.get('previousClose', 0)
        
        # Calculate change
        change = latest_price - previous_close if previous_close > 0 else 0
        change_percent = (change / previous_close * 100) if previous_close > 0 else 0
        
        # Get OHLCV from latest bar
        latest_bar = hist.iloc[-1] if len(hist) > 0 else None
        
        # Build response
        result = {
            "symbol": symbol,
            "price": {
                "current": float(latest_price),
                "open": float(latest_bar['Open']) if latest_bar is not None else float(latest_price),
                "high": float(latest_bar['High']) if latest_bar is not None else float(latest_price),
                "low": float(latest_bar['Low']) if latest_bar is not None else float(latest_price),
                "close": float(latest_price),
                "volume": int(latest_bar['Volume']) if latest_bar is not None else 0,
                "previousClose": float(previous_close),
                "change": float(change),
                "changePercent": float(change_percent),
                "timestamp": datetime.now().isoformat()
            },
            "profile": {
                "companyName": info.get('longName', symbol),
                "sector": info.get('sector', 'Unknown'),
                "industry": info.get('industry', 'Unknown'),
                "description": info.get('longBusinessSummary', ''),
                "employees": info.get('fullTimeEmployees', 0),
                "website": info.get('website', ''),
                "marketCap": float(info.get('marketCap', 0))
            },
            "ratios": {
                "pe": float(info.get('trailingPE', 0)) or float(info.get('forwardPE', 0)) or 0,
                "pb": float(info.get('priceToBook', 0)) or 0,
                "ps": float(info.get('priceToSalesTrailing12Months', 0)) or 0,
                "currentRatio": float(info.get('currentRatio', 0)) or 0,
                "debtToEquity": float(info.get('debtToEquity', 0)) or 0,
                "interestCoverage": float(info.get('interestCoverage', 0)) or 0,
                "roe": (float(info.get('returnOnEquity', 0)) or 0) * 100,
                "roic": (float(info.get('returnOnCapital', 0)) or 0) * 100,
                "grossMargin": (float(info.get('grossMargins', 0)) or 0) * 100,
                "operatingMargin": (float(info.get('operatingMargins', 0)) or 0) * 100,
                "netMargin": (float(info.get('profitMargins', 0)) or 0) * 100,
                "dividendYield": (float(info.get('dividendYield', 0)) or 0) * 100,
                "revenueGrowth": (float(info.get('revenueGrowth', 0)) or 0),
                "earningsGrowth": (float(info.get('earningsGrowth', 0)) or 0)
            },
            "dataQualityFlags": {
                "debtToEquityAnomalous": float(info.get('debtToEquity', 0)) > 200,
                "roicZero": (float(info.get('returnOnCapital', 0)) or 0) * 100 == 0,
                "interestCoverageZero": float(info.get('interestCoverage', 0)) == 0,
                "peNegative": float(info.get('trailingPE', 0)) < 0 or float(info.get('forwardPE', 0)) < 0,
                "marketCapZero": float(info.get('marketCap', 0)) == 0,
                "pbAnomalous": float(info.get('priceToBook', 0)) > 100 or float(info.get('priceToBook', 0)) < 0,
                "peAnomalous": float(info.get('trailingPE', 0)) > 200,
                "roeNegative": (float(info.get('returnOnEquity', 0)) or 0) * 100 < 0,
                "currentRatioAnomalous": float(info.get('currentRatio', 0)) < 0.5 or float(info.get('currentRatio', 0)) > 50
            },
            "financials": [],
            "quarterlyFinancials": [],
            "balanceSheet": {
                "totalAssets": 0,
                "totalLiabilities": 0,
                "totalEquity": 0,
                "bookValuePerShare": 0,
                "tangibleBookValuePerShare": 0
            }
        }
        
        # Get annual financials with FCF data
        try:
            # Get cash flow statement for FCF data
            cashflow = ticker.cashflow
            fcf_data = {}
            if cashflow is not None and not cashflow.empty and 'Free Cash Flow' in cashflow.index:
                for col in cashflow.columns:
                    try:
                        fcf = float(cashflow.loc['Free Cash Flow', col])
                        if not math.isnan(fcf):
                            fcf_data[str(col)[:10]] = fcf
                    except (ValueError, KeyError, TypeError):
                        pass
            
            # Use income_stmt which provides annual data
            income_stmt = ticker.income_stmt
            if income_stmt is not None and not income_stmt.empty:
                # Get the most recent 3 years of annual data
                for idx, col in enumerate(income_stmt.columns[:3]):
                    try:
                        revenue = float(income_stmt.loc['Total Revenue', col]) if 'Total Revenue' in income_stmt.index else 0
                        net_income = float(income_stmt.loc['Net Income', col]) if 'Net Income' in income_stmt.index else 0
                        operating_income = float(income_stmt.loc['Operating Income', col]) if 'Operating Income' in income_stmt.index else 0
                        fcf = fcf_data.get(str(col)[:10], 0)
                        
                        result["financials"].append({
                            "period": str(col)[:10],
                            "fiscalYear": int(str(col)[:4]),
                            "revenue": revenue,
                            "netIncome": net_income,
                            "eps": float(info.get('trailingEps', 0)) or 0,
                            "operatingIncome": operating_income,
                            "freeCashFlow": fcf
                        })
                    except (ValueError, KeyError, TypeError):
                        pass
        except Exception as e:
            pass
        
        # If no annual data, try quarterly as fallback
        if len(result["financials"]) == 0:
            try:
                quarterly_fin = ticker.quarterly_financials
                if quarterly_fin is not None and not quarterly_fin.empty:
                    # Get the most recent quarters (up to 4)
                    for idx, col in enumerate(quarterly_fin.columns[:4]):
                        try:
                            revenue = float(quarterly_fin.loc['Total Revenue', col]) if 'Total Revenue' in quarterly_fin.index else 0
                            net_income = float(quarterly_fin.loc['Net Income', col]) if 'Net Income' in quarterly_fin.index else 0
                            operating_income = float(quarterly_fin.loc['Operating Income', col]) if 'Operating Income' in quarterly_fin.index else 0
                            
                            result["financials"].append({
                                "period": str(col)[:10],
                                "fiscalYear": int(str(col)[:4]),
                                "revenue": revenue,
                                "netIncome": net_income,
                                "eps": float(info.get('trailingEps', 0)) or 0,
                                "operatingIncome": operating_income,
                                "freeCashFlow": 0
                            })
                        except (ValueError, KeyError, TypeError):
                            pass
            except Exception as e:
                pass
        
        # Get quarterly financials with FCF data (for TTM calculations)
        try:
            # Get quarterly cash flow statement for FCF data
            quarterly_cf = ticker.quarterly_cashflow
            quarterly_fcf_data = {}
            if quarterly_cf is not None and not quarterly_cf.empty and 'Free Cash Flow' in quarterly_cf.index:
                for col in quarterly_cf.columns:
                    try:
                        fcf = float(quarterly_cf.loc['Free Cash Flow', col])
                        if not math.isnan(fcf):
                            quarterly_fcf_data[str(col)[:10]] = fcf
                    except (ValueError, KeyError, TypeError):
                        pass
            
            quarterly_fin = ticker.quarterly_financials
            if quarterly_fin is not None and not quarterly_fin.empty:
                # Get the most recent quarters (up to 8 for 2 years of data)
                for idx, col in enumerate(quarterly_fin.columns[:8]):
                    try:
                        revenue = float(quarterly_fin.loc['Total Revenue', col]) if 'Total Revenue' in quarterly_fin.index else 0
                        net_income = float(quarterly_fin.loc['Net Income', col]) if 'Net Income' in quarterly_fin.index else 0
                        operating_income = float(quarterly_fin.loc['Operating Income', col]) if 'Operating Income' in quarterly_fin.index else 0
                        fcf = quarterly_fcf_data.get(str(col)[:10], 0)
                        
                        # Parse quarter from date
                        period_str = str(col)[:10]
                        period_date = datetime.strptime(period_str, "%Y-%m-%d")
                        quarter_num = (period_date.month - 1) // 3 + 1
                        quarter_str = f"{period_date.year}-Q{quarter_num}"
                        
                        result["quarterlyFinancials"].append({
                            "period": period_str,
                            "quarter": quarter_str,
                            "fiscalYear": int(str(col)[:4]),
                            "revenue": revenue,
                            "netIncome": net_income,
                            "eps": float(info.get('trailingEps', 0)) or 0,
                            "operatingIncome": operating_income,
                            "freeCashFlow": fcf
                        })
                    except (ValueError, KeyError, TypeError):
                        pass
        except Exception as e:
            pass
        
        # If still no financials, add a placeholder
        if len(result["financials"]) == 0:
            result["financials"].append({
                "period": datetime.now().strftime("%Y-%m-%d"),
                "fiscalYear": datetime.now().year,
                "revenue": 0,
                "netIncome": 0,
                "eps": float(info.get('trailingEps', 0)) or 0,
                "operatingIncome": 0,
                "freeCashFlow": 0
            })
        
        # Extract balance sheet data
        try:
            balance_sheet = ticker.balance_sheet
            if balance_sheet is not None and not balance_sheet.empty:
                # Get the most recent balance sheet
                col = balance_sheet.columns[0]
                total_assets = float(balance_sheet.loc['Total Assets', col]) if 'Total Assets' in balance_sheet.index else 0
                stockholders_equity = float(balance_sheet.loc['Stockholders Equity', col]) if 'Stockholders Equity' in balance_sheet.index else 0
                total_liabilities = total_assets - stockholders_equity if total_assets > 0 else 0
                
                # Calculate book value per share
                shares_out = result.get('sharesOutstanding', 0) or 1
                book_value_per_share = stockholders_equity / shares_out if shares_out > 0 else 0
                
                # Get tangible book value (if available)
                tangible_bv = float(balance_sheet.loc['Tangible Book Value', col]) if 'Tangible Book Value' in balance_sheet.index else stockholders_equity
                tangible_bv_per_share = tangible_bv / shares_out if shares_out > 0 else 0
                
                result["balanceSheet"] = {
                    "totalAssets": total_assets,
                    "totalLiabilities": total_liabilities,
                    "totalEquity": stockholders_equity,
                    "bookValuePerShare": book_value_per_share,
                    "tangibleBookValuePerShare": tangible_bv_per_share
                }
        except Exception as e:
            pass
        
        # Add historical bars (last 30 days)
        result["historicalBars"] = []
        for date, row in hist.tail(30).iterrows():
            result["historicalBars"].append({
                "date": date.strftime("%Y-%m-%d"),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        # Sort quarterly financials by date (most recent first)
        result["quarterlyFinancials"] = sorted(
            result["quarterlyFinancials"],
            key=lambda x: x["period"],
            reverse=True
        )
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "symbol": symbol
        }

def convert_nan_to_none(obj):
    """Recursively convert NaN and Inf values to None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_nan_to_none(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_nan_to_none(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Symbol required"}))
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    data = get_stock_data(symbol)
    # Convert NaN and Inf to None before JSON serialization
    data = convert_nan_to_none(data)
    print(json.dumps(data))

if __name__ == "__main__":
    main()
