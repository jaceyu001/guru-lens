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

# Import currency detection utility
try:
    from currencyDetector import (
        detect_financial_currency,
        get_currency_info_dict,
        convert_to_usd
    )
except ImportError:
    # Fallback if module not found
    def detect_financial_currency(info):
        return info.get('financialCurrency', 'USD')
    def get_currency_info_dict(currency):
        return {'reportingCurrency': currency, 'conversionApplied': False, 'conversionRate': 1.0}
    def convert_to_usd(value, currency):
        return value

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

# Note: Currency detection now uses yfinance's financialCurrency field via currencyDetector utility
# This ensures consistent currency handling across all yfinance data fetching in the application

def calculate_interest_coverage(ticker):
    """Calculate interest coverage ratio from EBIT / Interest Expense"""
    try:
        income_stmt = ticker.income_stmt
        if income_stmt is not None and not income_stmt.empty:
            latest_year = income_stmt.columns[0]
            
            # Get EBIT
            ebit = None
            if 'EBIT' in income_stmt.index:
                ebit = float(income_stmt.loc['EBIT', latest_year])
            
            # Get Interest Expense
            interest_expense = None
            if 'Interest Expense' in income_stmt.index:
                interest_expense = float(income_stmt.loc['Interest Expense', latest_year])
            
            # Calculate interest coverage
            if ebit and interest_expense and interest_expense != 0 and not math.isnan(ebit) and not math.isnan(interest_expense):
                return ebit / interest_expense
    except Exception as e:
        pass
    
    return 0

# Currency detection and conversion functions are now in currencyDetector.py
# Use detect_financial_currency() and convert_to_usd() from that module

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
                "marketCap": float(info.get('marketCap', 0)),
                "dilutedSharesOutstanding": float(info.get('sharesOutstanding', 0)) / 1e9  # Convert to billions
            },
            "ratios": {
                "pe": float(info.get('trailingPE', 0)) or float(info.get('forwardPE', 0)) or 0,
                "pb": float(info.get('priceToBook', 0)) or 0,
                "ps": float(info.get('priceToSalesTrailing12Months', 0)) or 0,
                "currentRatio": float(info.get('currentRatio', 0)) or 0,
                "debtToEquity": float(info.get('debtToEquity', 0)) or 0,
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
            
            # First, calculate TTM from quarterly data
            ttm_data = {"revenue": 0, "net_income": 0, "operating_income": 0, "fcf": 0}
            quarterly_fin = ticker.quarterly_financials
            quarterly_cf = ticker.quarterly_cashflow
            quarterly_fcf_data = {}
            
            if quarterly_cf is not None and not quarterly_cf.empty and 'Free Cash Flow' in quarterly_cf.index:
                for col in quarterly_cf.columns[:4]:  # Last 4 quarters
                    try:
                        fcf = float(quarterly_cf.loc['Free Cash Flow', col])
                        if not math.isnan(fcf):
                            quarterly_fcf_data[str(col)[:10]] = fcf
                            ttm_data["fcf"] += fcf
                    except (ValueError, KeyError, TypeError):
                        pass
            
            if quarterly_fin is not None and not quarterly_fin.empty:
                for col in quarterly_fin.columns[:4]:  # Last 4 quarters
                    try:
                        revenue = float(quarterly_fin.loc['Total Revenue', col]) if 'Total Revenue' in quarterly_fin.index else 0
                        net_income = float(quarterly_fin.loc['Net Income', col]) if 'Net Income' in quarterly_fin.index else 0
                        operating_income = float(quarterly_fin.loc['Operating Income', col]) if 'Operating Income' in quarterly_fin.index else 0
                        ttm_data["revenue"] += revenue
                        ttm_data["net_income"] += net_income
                        ttm_data["operating_income"] += operating_income
                    except (ValueError, KeyError, TypeError):
                        pass
            
            # Detect currency and get conversion info
            financial_currency = detect_financial_currency(info)
            currency_info = get_currency_info_dict(financial_currency)
            result["currencyInfo"] = currency_info
            conversion_rate = currency_info["conversionRate"]
            
            # Add TTM as the first entry
            if ttm_data["revenue"] > 0 or ttm_data["operating_income"] > 0:
                result["financials"].append({
                    "period": "TTM",
                    "fiscalYear": datetime.now().year,
                    "revenue": (ttm_data["revenue"] / 1e9) * conversion_rate,  # Convert to billions and apply currency conversion
                    "netIncome": (ttm_data["net_income"] / 1e9) * conversion_rate,  # Convert to billions and apply currency conversion
                    "eps": float(info.get('trailingEps', 0)) or 0,
                    "operatingIncome": (ttm_data["operating_income"] / 1e9) * conversion_rate,  # Convert to billions and apply currency conversion
                    "freeCashFlow": (ttm_data["fcf"] / 1e9) * conversion_rate  # Convert to billions and apply currency conversion
                })
            
            # Use income_stmt which provides annual data
            income_stmt = ticker.income_stmt
            if income_stmt is not None and not income_stmt.empty:
                # Get the most recent 3 years of annual data
                for idx, col in enumerate(income_stmt.columns[:3]):
                    try:
                        revenue = float(income_stmt.loc['Total Revenue', col]) if 'Total Revenue' in income_stmt.index else 0
                        net_income = float(income_stmt.loc['Net Income', col]) if 'Net Income' in income_stmt.index else 0
                        operating_income = float(income_stmt.loc['Operating Income', col]) if 'Operating Income' in income_stmt.index else 0
                        
                        # Get FCF for this year if available
                        year_str = str(col)[:10]
                        fcf = fcf_data.get(year_str, 0)
                        
                        result["financials"].append({
                            "period": year_str,
                            "fiscalYear": int(str(col)[:4]),
                            "revenue": (revenue / 1e9) * conversion_rate,
                            "netIncome": (net_income / 1e9) * conversion_rate,
                            "eps": 0,
                            "operatingIncome": (operating_income / 1e9) * conversion_rate,
                            "freeCashFlow": (fcf / 1e9) * conversion_rate
                        })
                    except (ValueError, KeyError, TypeError):
                        pass
        except Exception as e:
            pass
        
        # ALWAYS add quarterly financials (not just as fallback)
        # This is critical for TTM-based growth rate calculations
        try:
            quarterly_fin = ticker.quarterly_financials
            quarterly_cf = ticker.quarterly_cashflow
            quarterly_fcf_data = {}
            
            # Get FCF data from quarterly cash flow
            if quarterly_cf is not None and not quarterly_cf.empty and 'Free Cash Flow' in quarterly_cf.index:
                for col in quarterly_cf.columns[:8]:  # Last 8 quarters
                    try:
                        fcf = float(quarterly_cf.loc['Free Cash Flow', col])
                        if not math.isnan(fcf):
                            quarterly_fcf_data[str(col)[:10]] = fcf
                    except (ValueError, KeyError, TypeError):
                        pass
            
            if quarterly_fin is not None and not quarterly_fin.empty:
                for idx, col in enumerate(quarterly_fin.columns[:8]):  # Last 8 quarters
                    try:
                        revenue = float(quarterly_fin.loc['Total Revenue', col]) if 'Total Revenue' in quarterly_fin.index else 0
                        net_income = float(quarterly_fin.loc['Net Income', col]) if 'Net Income' in quarterly_fin.index else 0
                        operating_income = float(quarterly_fin.loc['Operating Income', col]) if 'Operating Income' in quarterly_fin.index else 0
                        period_str = str(col)[:10]
                        fcf = quarterly_fcf_data.get(period_str, 0)
                        
                        result["quarterlyFinancials"].append({
                            "period": period_str,
                            "quarter": f"Q{(int(str(col)[5:7]) - 1) // 3 + 1}",
                            "fiscalYear": int(str(col)[:4]),
                            "revenue": (revenue / 1e9) * conversion_rate,
                            "netIncome": (net_income / 1e9) * conversion_rate,
                            "eps": 0,
                            "operatingIncome": (operating_income / 1e9) * conversion_rate,
                            "freeCashFlow": (fcf / 1e9) * conversion_rate
                        })
                    except (ValueError, KeyError, TypeError):
                        pass
        except Exception as e:
            pass
        
        # Get balance sheet data
        try:
            balance_sheet = ticker.balance_sheet
            if balance_sheet is not None and not balance_sheet.empty:
                # Get most recent balance sheet
                col = balance_sheet.columns[0]
                
                # Try multiple possible names for each field
                total_assets = 0
                for name in ['Total Assets', 'Assets']:
                    if name in balance_sheet.index:
                        try:
                            total_assets = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                total_liabilities = 0
                for name in ['Total Liabilities Net Minority Interest', 'Total Liabilities']:
                    if name in balance_sheet.index:
                        try:
                            total_liabilities = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                total_equity = 0
                for name in ['Stockholders Equity', 'Total Equity Gross Minority Interest', 'Total Equity']:
                    if name in balance_sheet.index:
                        try:
                            total_equity = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                book_value_per_share = 0
                for name in ['Tangible Book Value', 'Book Value Per Share']:
                    if name in balance_sheet.index:
                        try:
                            book_value_per_share = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                # Get debt data
                current_debt = 0
                for name in ['Current Debt', 'Current Portion Of Long Term Debt']:
                    if name in balance_sheet.index:
                        try:
                            current_debt = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                long_term_debt = 0
                for name in ['Long Term Debt', 'Long Term Debt And Capital Lease Obligation']:
                    if name in balance_sheet.index:
                        try:
                            long_term_debt = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                total_debt = current_debt + long_term_debt
                
                # Get cash data (including short-term investments)
                # Priority: Cash Cash Equivalents And Short Term Investments > Cash And Cash Equivalents
                cash = 0
                for name in ['Cash Cash Equivalents And Short Term Investments', 'Cash And Cash Equivalents', 'Cash', 'Cash And Short Term Investments']:
                    if name in balance_sheet.index:
                        try:
                            cash = float(balance_sheet.loc[name, col])
                            break
                        except:
                            pass
                
                # Handle NaN values
                if math.isnan(total_debt):
                    total_debt = 0
                if math.isnan(cash):
                    cash = 0
                if math.isnan(total_equity):
                    total_equity = 0
                if math.isnan(total_liabilities):
                    total_liabilities = 0
                if math.isnan(total_assets):
                    total_assets = 0
                
                result["balanceSheet"] = {
                    "totalAssets": (total_assets / 1e9) * conversion_rate,
                    "totalLiabilities": (total_liabilities / 1e9) * conversion_rate,
                    "totalEquity": (total_equity / 1e9) * conversion_rate,
                    "bookValuePerShare": book_value_per_share,
                    "tangibleBookValuePerShare": book_value_per_share,
                    "totalDebt": (total_debt / 1e9) * conversion_rate,
                    "cash": (cash / 1e9) * conversion_rate
                }
        except Exception as e:
            pass
        
        return result
    
    except Exception as e:
        return {
            "error": str(e),
            "symbol": symbol
        }

def clean_nan_values(obj):
    """Recursively convert NaN and Inf values to None for JSON serialization"""
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
    if len(sys.argv) > 1:
        symbol = sys.argv[1]
        data = get_stock_data(symbol)
        data = clean_nan_values(data)
        print(json.dumps(data, indent=2))
    else:
        print(json.dumps({"error": "Symbol required"}, indent=2))
