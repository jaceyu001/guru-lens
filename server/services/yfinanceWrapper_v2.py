"""
yfinance Wrapper Service - Simplified Version
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
import signal
import time

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

class TimeoutException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutException("Operation timed out")

def get_basic_stock_data(symbol):
    """Fetch basic stock data with timeout protection"""
    try:
        print(f"[DEBUG] Fetching data for {symbol}", file=sys.stderr)
        
        # Set 20 second timeout for the entire operation
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(20)
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}
            
            # Get historical data
            hist = ticker.history(period="1y")
            
            signal.alarm(0)  # Cancel alarm
            
            # Extract basic data
            latest_price = 0
            if hist is not None and len(hist) > 0:
                latest_price = float(hist['Close'].iloc[-1])
            elif info.get('currentPrice'):
                latest_price = float(info.get('currentPrice'))
            
            result = {
                "symbol": symbol,
                "price": {
                    "current": latest_price,
                    "timestamp": datetime.now().isoformat()
                },
                "profile": {
                    "companyName": info.get('longName') or symbol,
                    "sector": info.get('sector') or 'Unknown',
                    "marketCap": float(info.get('marketCap') or 0),
                },
                "ratios": {
                    "pe": float(info.get('trailingPE') or 0),
                    "pb": float(info.get('priceToBook') or 0),
                    "ps": float(info.get('priceToSalesTrailing12Months') or 0),
                    "roe": (float(info.get('returnOnEquity') or 0)) * 100,
                    "roa": (float(info.get('returnOnAssets') or 0)) * 100,
                    "dividendYield": (float(info.get('dividendYield') or 0)) * 100,
                }
            }
            
            return {symbol: result}
            
        except TimeoutException:
            signal.alarm(0)  # Cancel alarm
            print(f"[ERROR] Timeout fetching data for {symbol}", file=sys.stderr)
            return {symbol: {"error": "Timeout fetching data", "symbol": symbol}}
        except Exception as e:
            signal.alarm(0)  # Cancel alarm
            print(f"[ERROR] Error fetching data for {symbol}: {str(e)}", file=sys.stderr)
            return {symbol: {"error": str(e), "symbol": symbol}}
            
    except Exception as e:
        print(f"[ERROR] Unexpected error for {symbol}: {str(e)}", file=sys.stderr)
        return {symbol: {"error": str(e), "symbol": symbol}}

def clean_nan_values(obj):
    """Recursively clean NaN and Inf values from JSON-serializable objects"""
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0
        return obj
    return obj

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            arg = sys.argv[1]
            
            if ',' in arg:
                # Batch mode
                symbols = [s.strip().upper() for s in arg.split(',')]
                print(f"[DEBUG] Processing batch: {symbols}", file=sys.stderr)
                results = {}
                for symbol in symbols:
                    result = get_basic_stock_data(symbol)
                    results.update(result)
                data = results
            else:
                # Single mode
                symbol = arg.upper()
                print(f"[DEBUG] Processing single: {symbol}", file=sys.stderr)
                data = get_basic_stock_data(symbol)
            
            data = clean_nan_values(data)
            print(json.dumps(data, indent=2))
        else:
            print(json.dumps({"error": "Symbol required"}, indent=2))
    except Exception as e:
        import traceback
        print(f"[ERROR] Fatal error: {str(e)}", file=sys.stderr)
        print(f"[ERROR] Traceback: {traceback.format_exc()}", file=sys.stderr)
        error_msg = {"error": str(e), "type": type(e).__name__}
        print(json.dumps(error_msg, indent=2))
        sys.exit(1)
