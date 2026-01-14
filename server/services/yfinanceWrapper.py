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
                "roe": float(info.get('returnOnEquity', 0)) or 0,
                "roic": float(info.get('returnOnCapital', 0)) or 0,
                "currentRatio": float(info.get('currentRatio', 0)) or 0,
                "debtToEquity": float(info.get('debtToEquity', 0)) or 0,
                "grossMargin": float(info.get('grossMargins', 0)) or 0,
                "operatingMargin": float(info.get('operatingMargins', 0)) or 0,
                "netMargin": float(info.get('profitMargins', 0)) or 0,
                "dividendYield": float(info.get('dividendYield', 0)) or 0,
                "interestCoverage": float(info.get('interestCoverage', 0)) or 0
            },
            "dataQualityFlags": {
                "debtToEquityAnomalous": float(info.get('debtToEquity', 0)) > 10,
                "roicZero": float(info.get('returnOnCapital', 0)) == 0,
                "interestCoverageZero": float(info.get('interestCoverage', 0)) == 0,
                "peNegative": float(info.get('trailingPE', 0)) < 0 or float(info.get('forwardPE', 0)) < 0,
                "marketCapZero": float(info.get('marketCap', 0)) == 0,
                "pbAnomalous": float(info.get('priceToBook', 0)) > 100 or float(info.get('priceToBook', 0)) < 0,
                "peAnomalous": float(info.get('trailingPE', 0)) > 200,
                "roeNegative": float(info.get('returnOnEquity', 0)) < 0,
                "currentRatioAnomalous": float(info.get('currentRatio', 0)) < 0.5 or float(info.get('currentRatio', 0)) > 50
            },
            "financials": []
        }
        
        # Get annual financials using quarterly_financials
        try:
            # Try to get quarterly financials
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
        
        # If no quarterly data, try annual
        if len(result["financials"]) == 0:
            try:
                annual_fin = ticker.annual_financials
                if annual_fin is not None and not annual_fin.empty:
                    for idx, col in enumerate(annual_fin.columns[:3]):
                        try:
                            revenue = float(annual_fin.loc['Total Revenue', col]) if 'Total Revenue' in annual_fin.index else 0
                            net_income = float(annual_fin.loc['Net Income', col]) if 'Net Income' in annual_fin.index else 0
                            operating_income = float(annual_fin.loc['Operating Income', col]) if 'Operating Income' in annual_fin.index else 0
                            
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
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "symbol": symbol
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Symbol required"}))
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    data = get_stock_data(symbol)
    print(json.dumps(data))

if __name__ == "__main__":
    main()
