"""
Currency Detection Utility
Provides reusable currency detection and conversion for all yfinance data fetching

This module should be imported and used in ALL services that fetch data from yfinance
to ensure consistent currency handling across the application.
"""

# Currency conversion rates (can be updated periodically)
CURRENCY_RATES = {
    'CNY': 1 / 7.0,      # Chinese Yuan to USD
    'HKD': 1 / 7.8,      # Hong Kong Dollar to USD
    'JPY': 1 / 150.0,    # Japanese Yen to USD
    'EUR': 1.1,          # Euro to USD
    'GBP': 1.27,         # British Pound to USD
    'INR': 1 / 83.0,     # Indian Rupee to USD
}

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
    
    Args:
        financial_currency: Currency code (e.g., 'CNY', 'JPY')
        
    Returns:
        Conversion rate (multiply by this to convert to USD)
        
    Example:
        >>> rate = get_conversion_rate('CNY')
        >>> print(rate)  # Output: 0.14285714...
        >>> value_usd = 1000 * rate  # 1000 CNY to USD
    """
    currency_code = financial_currency.upper()
    return CURRENCY_RATES.get(currency_code, 1.0)


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
        >>> print(value_usd)  # Output: ~142.86
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
        Dictionary with currency information
        
    Example:
        >>> info = get_currency_info_dict('CNY')
        >>> print(info)
        {
            'reportingCurrency': 'CNY (converted to USD)',
            'conversionApplied': True,
            'conversionRate': 0.14285714...
        }
    """
    needs_conversion = needs_currency_conversion(financial_currency)
    conversion_rate = get_conversion_rate(financial_currency)
    
    if needs_conversion:
        reporting_currency = f"{financial_currency} (converted to USD)"
    else:
        reporting_currency = financial_currency
    
    return {
        'reportingCurrency': reporting_currency,
        'conversionApplied': needs_conversion,
        'conversionRate': conversion_rate,
    }


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

# Get currency info for response
currency_info = get_currency_info_dict(financial_currency)

# Convert financial values
operating_income_cny = 1000  # in millions
operating_income_usd = convert_to_usd(operating_income_cny / 1e9, financial_currency)

# Use in response
result = {
    'currencyInfo': currency_info,
    'operatingIncome': operating_income_usd,
}
"""
