# Knowledge Base: Currency Detection for yfinance Data Fetching

**Status:** Active Knowledge Base Entry  
**Last Updated:** January 23, 2026  
**Scope:** System-wide for all yfinance data fetching operations

---

## Overview

When fetching financial data from yfinance, the **reporting currency of financial statements must be detected and handled consistently** across all services. This ensures accurate unit handling and prevents calculation errors in downstream financial analysis.

**Key Principle:** Use yfinance's `financialCurrency` field for dynamic currency detection instead of hardcoded lists.

---

## Problem Statement

### Without Currency Detection
- Chinese companies (RLX, BIDU, PDD, NIO, XPEV) report financials in CNY
- yfinance returns these values without automatic USD conversion
- Operating income, revenue, assets are in millions/billions of CNY, not USD
- Calculations using these values directly produce incorrect results
- Example: RLX operating income shown as $1.063B when it's actually ¥1,063M (~$152M USD)

### With Hardcoded Lists (Previous Approach - ❌ Not Scalable)
- Maintained a hardcoded list of known Chinese tickers
- Required manual updates when new Chinese companies go public
- Didn't work for other currencies (JPY, HKD, INR, etc.)
- Fragile and error-prone

### With Dynamic Detection (Current Approach - ✓ Recommended)
- Uses yfinance's `financialCurrency` field from the API
- Works for ANY ticker and ANY currency automatically
- No manual updates needed
- Scalable and maintainable

---

## Solution: Dynamic Currency Detection

### Step 1: Detect Financial Currency from yfinance

yfinance provides a `financialCurrency` field in the ticker info that indicates the reporting currency:

```python
import yfinance as yf

ticker = yf.Ticker('RLX')
info = ticker.info

financial_currency = info.get('financialCurrency', 'USD')
print(financial_currency)  # Output: 'CNY'
```

### Step 2: Check if Conversion is Needed

```python
def needs_currency_conversion(financial_currency: str) -> bool:
    """Check if currency conversion is needed (not USD)"""
    return financial_currency.upper() != 'USD'

# Example
needs_conversion = needs_currency_conversion('CNY')  # True
needs_conversion = needs_currency_conversion('USD')  # False
```

### Step 3: Get Conversion Rate

```python
CURRENCY_RATES = {
    'CNY': 1 / 7.0,      # Chinese Yuan
    'HKD': 1 / 7.8,      # Hong Kong Dollar
    'JPY': 1 / 150.0,    # Japanese Yen
    'EUR': 1.1,          # Euro
    'GBP': 1.27,         # British Pound
    'INR': 1 / 83.0,     # Indian Rupee
}

def get_conversion_rate(financial_currency: str) -> float:
    """Get conversion rate to USD"""
    currency_code = financial_currency.upper()
    return CURRENCY_RATES.get(currency_code, 1.0)

# Example
rate = get_conversion_rate('CNY')  # 0.14285714...
```

### Step 4: Apply Conversion to Financial Values

```python
def convert_to_usd(value: float, financial_currency: str) -> float:
    """Convert financial value to USD"""
    if financial_currency.upper() == 'USD':
        return value
    
    rate = get_conversion_rate(financial_currency)
    return value * rate

# Example: RLX operating income
oi_cny = 1063.411  # Million CNY
oi_usd = convert_to_usd(oi_cny / 1e9, 'CNY')  # Convert to billions and apply rate
print(oi_usd)  # Output: 0.152 (billion USD)
```

---

## Implementation Guide

### For Python Services (yfinanceWrapper.py, financialData.ts Python blocks)

**1. Import the currency detection utility:**
```python
from currencyDetector import (
    detect_financial_currency,
    get_currency_info_dict,
    convert_to_usd
)
```

**2. Detect currency from yfinance info:**
```python
ticker = yf.Ticker(symbol)
info = ticker.info

financial_currency = detect_financial_currency(info)
currency_info = get_currency_info_dict(financial_currency)
conversion_rate = currency_info['conversionRate']
```

**3. Apply conversion to all financial values:**
```python
# Operating income
operating_income_usd = (operating_income_cny / 1e9) * conversion_rate

# Revenue
revenue_usd = (revenue_cny / 1e9) * conversion_rate

# Balance sheet items
total_assets_usd = (total_assets_cny / 1e9) * conversion_rate
```

**4. Return currency info in response:**
```python
result = {
    'currencyInfo': currency_info,  # Contains reportingCurrency, conversionApplied, conversionRate
    'operatingIncome': operating_income_usd,
    'revenue': revenue_usd,
    # ... other fields
}
```

### For TypeScript Services

**1. Call Python service that handles currency conversion:**
```typescript
const data = await fetchFromYfinance(symbol);
// Data already has currency conversion applied
```

**2. Or implement in TypeScript if needed:**
```typescript
const financialCurrency = info.financialCurrency || 'USD';
const conversionRate = getConversionRate(financialCurrency);

const operatingIncomeUSD = (operatingIncomeCNY / 1e9) * conversionRate;
```

---

## Verification Checklist

When implementing currency detection, verify:

- [ ] **Detection:** `financialCurrency` field is correctly extracted from yfinance info
- [ ] **Conversion:** Conversion rate is applied to ALL financial values (revenue, operating income, assets, liabilities, etc.)
- [ ] **Consistency:** Same currency detection logic used across all yfinance data fetching services
- [ ] **Response:** Currency info is included in API response for transparency
- [ ] **Testing:** Tested with both USD and non-USD tickers (e.g., RLX, BIDU, AAPL, MSFT)

---

## Test Cases

### Test 1: USD Ticker (AAPL)
```
Input:  financialCurrency = 'USD'
Expected: conversionApplied = False, conversionRate = 1.0
Result: ✓ No conversion applied
```

### Test 2: CNY Ticker (RLX)
```
Input:  financialCurrency = 'CNY'
Expected: conversionApplied = True, conversionRate = 0.1429
Result: ✓ Conversion applied (÷ 7.0)
```

### Test 3: Multiple Tickers
```
AAPL:  USD → No conversion
MSFT:  USD → No conversion
BIDU:  CNY → Conversion applied
PDD:   CNY → Conversion applied
RLX:   CNY → Conversion applied
NIO:   CNY → Conversion applied
XPEV:  CNY → Conversion applied
DQ:    USD → No conversion
```

---

## Files Implementing Currency Detection

### Core Utility
- **`currencyDetector.py`** - Reusable currency detection functions

### Services Using Currency Detection
- **`yfinanceWrapper.py`** - Main yfinance data fetching service
- **`financialData.ts`** - Financial data service with Python subprocess
- **`balanceSheetHistory.ts`** - Balance sheet historical data (to be updated)
- **`dataAvailabilityDetector.ts`** - Data availability detection (to be updated)

---

## Currency Conversion Rates

| Currency | Code | Rate to USD | Example |
|----------|------|-------------|---------|
| Chinese Yuan | CNY | 1/7.0 = 0.1429 | ¥1000 = $142.90 |
| Hong Kong Dollar | HKD | 1/7.8 = 0.1282 | HK$1000 = $128.20 |
| Japanese Yen | JPY | 1/150.0 = 0.0067 | ¥1000 = $6.67 |
| Euro | EUR | 1.1 | €1000 = $1,100 |
| British Pound | GBP | 1.27 | £1000 = $1,270 |
| Indian Rupee | INR | 1/83.0 = 0.0120 | ₹1000 = $12.05 |
| US Dollar | USD | 1.0 | $1000 = $1,000 |

**Note:** Rates should be updated periodically (monthly or quarterly) to maintain accuracy.

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Forgetting to Convert Balance Sheet Items
```python
# Wrong: Not converting balance sheet items
total_assets = float(bs.get('Total Assets', 0))  # Still in CNY!

# Correct: Apply conversion
total_assets = (float(bs.get('Total Assets', 0)) / 1e9) * conversion_rate
```

### ❌ Pitfall 2: Using Hardcoded List Instead of Dynamic Detection
```python
# Wrong: Hardcoded list (not scalable)
if symbol in ['RLX', 'BIDU', 'PDD']:
    needs_conversion = True

# Correct: Dynamic detection from yfinance
financial_currency = info.get('financialCurrency', 'USD')
needs_conversion = (financial_currency.upper() != 'USD')
```

### ❌ Pitfall 3: Not Including Currency Info in Response
```python
# Wrong: No currency info in response
result = {'operatingIncome': 1.5}

# Correct: Include currency info for transparency
result = {
    'currencyInfo': {
        'reportingCurrency': 'CNY (converted to USD)',
        'conversionApplied': True,
        'conversionRate': 0.1429
    },
    'operatingIncome': 0.152  # Converted value
}
```

### ❌ Pitfall 4: Applying Conversion to Growth Rates
```python
# Wrong: Growth rates are ratios, don't convert
growth_rate = (current_ni - previous_ni) / previous_ni * conversion_rate  # ❌

# Correct: Growth rates are unaffected by currency
growth_rate = (current_ni - previous_ni) / previous_ni  # ✓
# Both numerator and denominator are in same currency, so ratio is the same
```

---

## Best Practices

1. **Always detect currency from yfinance** - Never assume USD
2. **Apply conversion consistently** - Convert ALL financial values, not just some
3. **Include currency info in responses** - Let consumers know what currency was used
4. **Test with multiple currencies** - Verify with both USD and non-USD tickers
5. **Update conversion rates periodically** - Keep rates current (monthly or quarterly)
6. **Document currency handling** - Make it clear in code comments and API docs
7. **Use utility functions** - Don't duplicate conversion logic across services

---

## Future Enhancements

1. **Automatic rate updates** - Fetch current exchange rates from API instead of hardcoding
2. **Support for more currencies** - Add HKD, JPY, INR, etc. as needed
3. **Historical rate tracking** - Store historical rates for accurate historical analysis
4. **Rate caching** - Cache rates to reduce API calls
5. **Audit logging** - Log all currency conversions for transparency

---

## References

- **yfinance Documentation:** https://github.com/ranaroussi/yfinance
- **Currency Detection Implementation:** `currencyDetector.py`
- **Example Usage:** `yfinanceWrapper.py`, `financialData.ts`

---

## Questions & Support

For questions about currency detection implementation:
1. Check this knowledge base entry
2. Review `currencyDetector.py` for utility functions
3. Check `yfinanceWrapper.py` for working example
4. Test with sample tickers (RLX for CNY, AAPL for USD)

---

**Last Verified:** January 23, 2026  
**Status:** ✓ Active and Tested
