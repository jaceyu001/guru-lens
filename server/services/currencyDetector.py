"""
Currency Detection Utility
Provides reusable currency detection and conversion for all yfinance data fetching

This module should be imported and used in ALL services that fetch data from yfinance
to ensure consistent currency handling across the application.

Uses live exchange rates from yfinance for all currency conversions.
"""

import yfinance as yf
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Fallback rates in case live rates cannot be fetched
# These are updated periodically but should not be relied upon
FALLBACK_CURRENCY_RATES = {
    'CNY': 1 / 7.0,      # Chinese Yuan to USD
    'HKD': 1 / 7.8,      # Hong Kong Dollar to USD
    'JPY': 1 / 150.0,    # Japanese Yen to USD
    'EUR': 1.1,          # Euro to USD
    'GBP': 1.27,         # British Pound to USD
    'INR': 1 / 83.0,     # Indian Rupee to USD
    'SGD': 1 / 1.35,     # Singapore Dollar to USD
    'AUD': 1 / 1.55,     # Australian Dollar to USD
    'CAD': 1 / 1.38,     # Canadian Dollar to USD
    'CHF': 1.1,          # Swiss Franc to USD
    'SEK': 1 / 10.5,     # Swedish Krona to USD
    'NZD': 1 / 1.75,     # New Zealand Dollar to USD
    'MXN': 1 / 17.0,     # Mexican Peso to USD
    'BRL': 1 / 5.0,      # Brazilian Real to USD
    'ZAR': 1 / 18.0,     # South African Rand to USD
}

# Cache for exchange rates to avoid repeated API calls
_EXCHANGE_RATE_CACHE: Dict[str, float] = {}


def get_live_exchange_rate(currency_code: str) -> float:
    """
    Fetch live exchange rate from yfinance for a given currency to USD
    
    Uses currency pair tickers like CNYUSD=X, EURUSD=X, etc.
    Falls back to cached or hardcoded rates if live fetch fails.
    
    Args:
        currency_code: Currency code (e.g., 'CNY', 'EUR', 'JPY')
        
    Returns:
        Exchange rate (multiply by this to convert to USD)
        
    Example:
        >>> rate = get_live_exchange_rate('CNY')
        >>> print(rate)  # Output: 0.1429 (or current live rate)
    """
    currency_code = currency_code.upper()
    
    # Return USD as-is
    if currency_code == 'USD':
        return 1.0
    
    # Check cache first
    if currency_code in _EXCHANGE_RATE_CACHE:
        return _EXCHANGE_RATE_CACHE[currency_code]
    
    try:
        # Construct yfinance currency pair ticker
        # Format: XXXUSD=X (e.g., CNYUSD=X, EURUSD=X)
        ticker_symbol = f"{currency_code}USD=X"
        
        # Fetch the exchange rate
        ticker = yf.Ticker(ticker_symbol)
        data = ticker.history(period='1d')
        
        if not data.empty:
            # Get the latest closing price
            latest_price = data['Close'].iloc[-1]
            
            # yfinance returns the rate as USD per unit of foreign currency
            # (e.g., CNYUSD=X returns 0.1429 = 1 CNY costs 0.1429 USD)
            # So we use the price directly as the conversion rate
            exchange_rate = latest_price if latest_price > 0 else FALLBACK_CURRENCY_RATES.get(currency_code, 1.0)
            
            # Cache the rate
            _EXCHANGE_RATE_CACHE[currency_code] = exchange_rate
            
            logger.info(f"Live exchange rate for {currency_code}: {exchange_rate:.6f}")
            return exchange_rate
        else:
            logger.warning(f"No data found for {ticker_symbol}, using fallback rate")
            rate = FALLBACK_CURRENCY_RATES.get(currency_code, 1.0)
            _EXCHANGE_RATE_CACHE[currency_code] = rate
            return rate
            
    except Exception as e:
        logger.warning(f"Failed to fetch live exchange rate for {currency_code}: {str(e)}, using fallback")
        rate = FALLBACK_CURRENCY_RATES.get(currency_code, 1.0)
        _EXCHANGE_RATE_CACHE[currency_code] = rate
        return rate


def detect_financial_currency(ticker_info: dict) -> str:
    """
    Detect the reporting currency of financial statements from yfinance info
    
    Args:
        ticker_info: The info dictionary from yfinance.Ticker.info
        
    Returns:
        Currency code (e.g., 'USD', 'CNY', 'JPY') or 'USD' if not found
        
    Example:
        >>> import yfinance as yf
        >>> ticker = yf.Ticker('RLX')
        >>> currency = detect_financial_currency(ticker.info)
        >>> print(currency)  # Output: 'CNY'
    """
    # Get financialCurrency field from yfinance info
    financial_currency = ticker_info.get('financialCurrency', 'USD')
    
    # Normalize to uppercase
    if financial_currency:
        return financial_currency.upper()
    
    return 'USD'


def needs_currency_conversion(financial_currency: str) -> bool:
    """
    Check if currency conversion is needed (i.e., not USD)
    
    Args:
        financial_currency: Currency code (e.g., 'CNY', 'USD')
        
    Returns:
        True if conversion needed, False if already in USD
        
    Example:
        >>> needs_currency_conversion('CNY')
        True
        >>> needs_currency_conversion('USD')
        False
    """
    return financial_currency.upper() != 'USD'


def get_conversion_rate(financial_currency: str) -> float:
    """
    Get the conversion rate from a currency to USD
    
    Uses live exchange rates from yfinance when available,
    falls back to cached or hardcoded rates.
    
    Args:
        financial_currency: Currency code (e.g., 'CNY', 'JPY')
        
    Returns:
        Conversion rate (multiply by this to convert to USD)
        
    Example:
        >>> rate = get_conversion_rate('CNY')
        >>> print(rate)  # Output: 0.1429 (live rate)
        >>> value_usd = 1000 * rate  # 1000 CNY to USD
    """
    currency_code = financial_currency.upper()
    
    # Return 1.0 for USD (no conversion needed)
    if currency_code == 'USD':
        return 1.0
    
    # Fetch live rate (with caching and fallback)
    return get_live_exchange_rate(currency_code)


def convert_to_usd(value: float, financial_currency: str) -> float:
    """
    Convert a financial value from the given currency to USD
    
    Args:
        value: The value to convert
        financial_currency: Currency code (e.g., 'CNY', 'JPY')
        
    Returns:
        Converted value in USD
        
    Example:
        >>> value_cny = 1000
        >>> value_usd = convert_to_usd(value_cny, 'CNY')
        >>> print(value_usd)  # Output: ~142.86 (using live rate)
    """
    if not needs_currency_conversion(financial_currency):
        return value
    
    rate = get_conversion_rate(financial_currency)
    return value * rate


def get_currency_info_dict(financial_currency: str) -> dict:
    """
    Generate a standardized currency info dictionary for API responses
    
    Args:
        financial_currency: Currency code from yfinance (e.g., 'CNY', 'USD')
        
    Returns:
        Dictionary with currency information including live exchange rate
        
    Example:
        >>> info = get_currency_info_dict('CNY')
        >>> print(info)
        {
            'reportingCurrency': 'CNY (converted to USD)',
            'conversionApplied': True,
            'conversionRate': 0.1429,
            'exchangeRateSource': 'yfinance (live)'
        }
    """
    needs_conversion = needs_currency_conversion(financial_currency)
    conversion_rate = get_conversion_rate(financial_currency)
    
    if needs_conversion:
        reporting_currency = f"{financial_currency} (converted to USD)"
        exchange_rate_source = "yfinance (live)"
    else:
        reporting_currency = financial_currency
        exchange_rate_source = "N/A (USD)"
    
    return {
        'reportingCurrency': reporting_currency,
        'conversionApplied': needs_conversion,
        'conversionRate': conversion_rate,
        'exchangeRateSource': exchange_rate_source,
    }


def clear_exchange_rate_cache():
    """
    Clear the exchange rate cache to force fresh rates on next call
    
    Useful for testing or when you need to ensure latest rates
    """
    global _EXCHANGE_RATE_CACHE
    _EXCHANGE_RATE_CACHE.clear()
    logger.info("Exchange rate cache cleared")


# Example usage in yfinance data fetching:
"""
import yfinance as yf
from currencyDetector import (
    detect_financial_currency,
    get_currency_info_dict,
    convert_to_usd
)

ticker = yf.Ticker('RLX')
info = ticker.info

# Detect currency
financial_currency = detect_financial_currency(info)

# Get currency info for response (includes live exchange rate)
currency_info = get_currency_info_dict(financial_currency)

# Convert financial values using live rates
operating_income_cny = 1000  # in millions
operating_income_usd = convert_to_usd(operating_income_cny / 1e9, financial_currency)

# Use in response
result = {
    'currencyInfo': currency_info,
    'operatingIncome': operating_income_usd,
}
"""
