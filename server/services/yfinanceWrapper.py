"""
yfinance Wrapper Service - With Socket Timeout
Provides real financial data for stocks via yfinance with timeout handling
This script is called from Node.js to fetch stock data
"""

import json
import sys
import os
import time
import random
import socket
import yfinance as yf
from datetime import datetime
import math

# Set global socket timeout to prevent hanging on rate limits
socket.setdefaulttimeout(10)

# Import currency detection utility
try:
    from currencyDetector import (
        detect_financial_currency,
        get_currency_info_dict,
        convert_to_usd
    )
except ImportError:
    def detect_financial_currency(info):
        return info.get('financialCurrency', 'USD')
    def get_currency_info_dict(currency):
        return {'reportingCurrency': currency, 'conversionApplied': False, 'conversionRate': 1.0}
    def convert_to_usd(value, currency):
        return value

def calculate_interest_coverage(ticker):
    """Calculate interest coverage ratio from EBIT / Interest Expense"""
    try:
        income_stmt = ticker.income_stmt
        if income_stmt is not None and not income_stmt.empty:
            latest_year = income_stmt.columns[0]
            
            ebit = None
            if 'EBIT' in income_stmt.index:
                ebit = float(income_stmt.loc['EBIT', latest_year])
            
            interest_expense = None
            if 'Interest Expense' in income_stmt.index:
                interest_expense = float(income_stmt.loc['Interest Expense', latest_year])
            
            if ebit and interest_expense and interest_expense != 0 and not math.isnan(ebit) and not math.isnan(interest_expense):
                return ebit / interest_expense
    except Exception as e:
        pass
    
    return 0

def get_stock_data(symbol, retry_count=0, max_retries=2):
    """Fetch comprehensive stock data for a given symbol"""
    try:
        print(f"[DEBUG] Fetching data for {symbol} (attempt {retry_count + 1}/{max_retries + 1})", file=sys.stderr)
        
        # Add exponential backoff for retries
        if retry_count > 0:
            wait_time = min(2 ** retry_count + random.uniform(0, 1), 5)
            print(f"[DEBUG] Waiting {wait_time:.1f}s before retry for {symbol}", file=sys.stderr)
            time.sleep(wait_time)
        
        # Create ticker - socket timeout will apply
        ticker = yf.Ticker(symbol)
        
        print(f"[DEBUG] Fetching info for {symbol}", file=sys.stderr)
        info = ticker.info
        
        if not info or not isinstance(info, dict):
            print(f"[WARNING] Invalid info for {symbol}: {type(info)}", file=sys.stderr)
            if retry_count < max_retries:
                return get_stock_data(symbol, retry_count + 1, max_retries)
            info = {}
        
        print(f"[DEBUG] Fetching historical data for {symbol}", file=sys.stderr)
        hist = ticker.history(period="1y")
        
        try:
            latest_price = hist['Close'].iloc[-1] if len(hist) > 0 else info.get('currentPrice', 0)
            previous_close = hist['Close'].iloc[-2] if len(hist) > 1 else info.get('previousClose', 0)
        except (IndexError, KeyError) as e:
            print(f"[WARNING] Error getting price data for {symbol}: {e}", file=sys.stderr)
            latest_price = info.get('currentPrice', 0)
            previous_close = info.get('previousClose', 0)
        
        change = latest_price - previous_close if previous_close > 0 else 0
        change_percent = (change / previous_close * 100) if previous_close > 0 else 0
        
        latest_bar = hist.iloc[-1] if len(hist) > 0 else None
        
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
                "marketCap": float(info.get('marketCap', 0)),
                "dilutedSharesOutstanding": float(info.get('sharesOutstanding', 0)) / 1e9 if info.get('sharesOutstanding') else 0
            },
            "ratios": {
                "pe": float(info.get('trailingPE', 0)) or float(info.get('forwardPE', 0)) or 0,
                "pb": float(info.get('priceToBook', 0)) or 0,
                "ps": float(info.get('priceToSalesTrailing12Months', 0)) or 0,
                "currentRatio": float(info.get('currentRatio', 0)) or 0,
                "debtToEquity": (float(info.get('debtToEquity', 0)) or 0) / 100,
                "interestCoverage": calculate_interest_coverage(ticker),
                "roe": (float(info.get('returnOnEquity', 0)) or 0) * 100,
                "roic": (float(info.get('returnOnCapital', 0)) or 0) * 100,
                "roa": (float(info.get('returnOnAssets', 0)) or 0) * 100,
                "grossMargin": (float(info.get('grossMargins', 0)) or 0) * 100,
                "operatingMargin": (float(info.get('operatingMargins', 0)) or 0) * 100,
                "netMargin": (float(info.get('profitMargins', 0)) or 0) * 100,
                "dividendYield": (float(info.get('dividendYield', 0)) or 0) * 100,
                "revenueGrowth": (float(info.get('revenueGrowth', 0)) or 0),
                "earningsGrowth": (float(info.get('earningsGrowth', 0)) or 0)
            },
            "financials": [],
            "quarterlyFinancials": [],
            "balanceSheet": {
                "totalAssets": 0,
                "totalLiabilities": 0,
                "totalEquity": 0,
                "bookValuePerShare": 0,
                "tangibleBookValuePerShare": 0,
                "totalDebt": 0,
                "cash": 0
            },
            "currencyInfo": {
                "reportingCurrency": "USD",
                "conversionApplied": False,
                "conversionRate": 1.0
            }
        }
        
        print(f"[DEBUG] Successfully fetched data for {symbol}", file=sys.stderr)
        return result
        
    except socket.timeout:
        print(f"[ERROR] Socket timeout for {symbol}", file=sys.stderr)
        if retry_count < max_retries:
            return get_stock_data(symbol, retry_count + 1, max_retries)
        raise Exception(f"Timeout fetching {symbol} after {max_retries + 1} attempts")
    except Exception as e:
        print(f"[ERROR] Failed to fetch {symbol}: {str(e)}", file=sys.stderr)
        if retry_count < max_retries:
            return get_stock_data(symbol, retry_count + 1, max_retries)
        raise

def get_stock_data_batch(symbols):
    """Fetch data for multiple symbols with rate limiting"""
    results = {}
    
    for i, symbol in enumerate(symbols):
        try:
            print(f"[DEBUG] Processing {i+1}/{len(symbols)}: {symbol}", file=sys.stderr)
            data = get_stock_data(symbol)
            results[symbol] = data
            
            # Add delay between requests to avoid rate limiting
            if i < len(symbols) - 1:
                delay = random.uniform(1.5, 3.0)
                print(f"[DEBUG] Waiting {delay:.1f}s before next request", file=sys.stderr)
                time.sleep(delay)
                
        except Exception as e:
            print(f"[ERROR] Failed to process {symbol}: {str(e)}", file=sys.stderr)
            results[symbol] = {"error": str(e), "symbol": symbol}
    
    return results

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No symbols provided"}))
            sys.exit(1)
        
        symbols_input = sys.argv[1]
        
        # Check if batch mode (comma-separated symbols)
        if ',' in symbols_input:
            symbols = [s.strip().upper() for s in symbols_input.split(',')]
            print(f"[DEBUG] Batch mode: {len(symbols)} symbols", file=sys.stderr)
            results = get_stock_data_batch(symbols)
            print(json.dumps(results))
        else:
            # Single symbol mode
            symbol = symbols_input.strip().upper()
            print(f"[DEBUG] Single mode: {symbol}", file=sys.stderr)
            data = get_stock_data(symbol)
            print(json.dumps(data))
            
    except Exception as e:
        print(f"[ERROR] Fatal error: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
