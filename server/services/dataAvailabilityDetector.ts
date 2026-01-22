/**
 * Data Availability Detector
 * 
 * Analyzes financial data from yfinance to determine:
 * - Latest annual year available
 * - Latest quarterly data available
 * - Whether TTM (Trailing Twelve Months) can be calculated
 * - Which comparison period should be used for growth calculations
 */

export interface DataAvailability {
  latestAnnualYear: number;
  latestAnnualComplete: boolean;
  latestQuarterlyYear: number;
  latestQuarterlyQ: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quartersAvailable: string[]; // ['2025-Q2', '2025-Q1', '2024-Q4', '2024-Q3']
  ttmAvailable: boolean;
  ttmYear: number; // Year for which TTM is available
  currentYearQuartersCount: number; // How many quarters of current year available
}

/**
 * Detect data availability from financial data
 * 
 * @param financialData - Financial data object from yfinance wrapper
 * @returns DataAvailability object with period information
 */
export function detectDataAvailability(financialData: any): DataAvailability {
  // Extract annual data info
  const annualData = financialData.financials || [];
  let latestAnnualYear = new Date().getFullYear() - 1;
  
  if (annualData.length > 0) {
    latestAnnualYear = annualData[0]?.fiscalYear || latestAnnualYear;
  }
  
  // Extract quarterly data info
  const quarterlyData = financialData.quarterlyFinancials || [];
  let latestQuarterlyYear = latestAnnualYear;
  let latestQuarterlyQ: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q1';
  const quartersAvailable: string[] = [];
  
  if (quarterlyData.length > 0) {
    // Parse quarterly data to extract quarters
    for (const q of quarterlyData.slice(0, 4)) {
      const quarter = parseQuarter(q.period);
      if (quarter) {
        quartersAvailable.push(quarter);
      }
    }
    
    // Get latest quarter info
    if (quartersAvailable.length > 0) {
      const [year, q] = parseQuarterString(quartersAvailable[0]);
      latestQuarterlyYear = year;
      latestQuarterlyQ = q;
    }
  }
  
  // Count quarters available in current year
  const currentYearQuartersCount = quartersAvailable.filter(
    (q) => q.startsWith(String(latestQuarterlyYear))
  ).length;
  
  // TTM is available if we have at least 2 quarters from current year
  // This ensures we can calculate a meaningful 12-month trailing value
  const ttmAvailable = currentYearQuartersCount >= 2;
  
  // TTM year is the current year if available, otherwise previous year
  const ttmYear = ttmAvailable ? latestQuarterlyYear : latestQuarterlyYear - 1;
  
  return {
    latestAnnualYear,
    latestAnnualComplete: true,
    latestQuarterlyYear,
    latestQuarterlyQ,
    quartersAvailable,
    ttmAvailable,
    ttmYear,
    currentYearQuartersCount,
  };
}

/**
 * Parse period string to quarter format
 * 
 * @param periodString - Period string like "2025-03-31" or "2025-Q1"
 * @returns Quarter string like "2025-Q1" or null if invalid
 */
function parseQuarter(periodString: string): string | null {
  try {
    // If already in Q format, return as-is
    if (periodString.includes('Q')) {
      return periodString;
    }
    
    // Parse date format (YYYY-MM-DD)
    const date = new Date(periodString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const q = Math.ceil(month / 3);
    
    return `${year}-Q${q}`;
  } catch {
    return null;
  }
}

/**
 * Parse quarter string to extract year and quarter number
 * 
 * @param quarterStr - Quarter string like "2025-Q2"
 * @returns Tuple of [year, quarter] like [2025, 'Q2']
 */
function parseQuarterString(
  quarterStr: string
): [number, 'Q1' | 'Q2' | 'Q3' | 'Q4'] {
  const [yearStr, qStr] = quarterStr.split('-');
  const year = parseInt(yearStr, 10);
  const q = qStr as 'Q1' | 'Q2' | 'Q3' | 'Q4';
  return [year, q];
}

/**
 * Determine which comparison type should be used for growth calculations
 * 
 * @param availability - DataAvailability object
 * @returns Object with comparison details
 */
export function determineComparisonType(availability: DataAvailability) {
  const isQ2OrLater = availability.latestQuarterlyQ !== 'Q1';
  const ttmAvailable = availability.ttmAvailable;
  
  if (isQ2OrLater && ttmAvailable) {
    // Use TTM vs Full Year
    return {
      type: 'TTM_VS_FY' as const,
      currentPeriod: `${availability.ttmYear} TTM`,
      priorPeriod: `${availability.ttmYear - 1} FY`,
      description: `Trailing Twelve Months (${availability.ttmYear}) vs Full Year (${availability.ttmYear - 1})`,
    };
  } else if (availability.latestQuarterlyQ === 'Q1') {
    // When only Q1 available, don't use FY_VS_FY (current year FY doesn't exist)
    // Let growthCalculator handle TTM fallback
    return {
      type: 'INSUFFICIENT_DATA' as const,
      currentPeriod: 'N/A',
      priorPeriod: 'N/A',
      description: 'Only Q1 data available - insufficient for FY comparison',
    };
  } else if (!ttmAvailable) {
    // Use Full Year vs Full Year (most recent complete years)
    return {
      type: 'FY_VS_FY' as const,
      currentPeriod: `${availability.latestQuarterlyYear - 1} FY`,
      priorPeriod: `${availability.latestQuarterlyYear - 2} FY`,
      description: `Full Year (${availability.latestQuarterlyYear - 1}) vs Full Year (${availability.latestQuarterlyYear - 2})`,
    };
  } else {
    // Insufficient data
    return {
      type: 'INSUFFICIENT_DATA' as const,
      currentPeriod: 'N/A',
      priorPeriod: 'N/A',
      description: 'Insufficient data for growth comparison',
    };
  }
}

/**
 * Get data quality flags based on availability
 * 
 * @param availability - DataAvailability object
 * @returns Object with data quality flags
 */
export function getDataQualityFlags(availability: DataAvailability) {
  return {
    onlyQ1Available: availability.latestQuarterlyQ === 'Q1',
    ttmNotAvailable: !availability.ttmAvailable,
    limitedQuarterlyData: availability.currentYearQuartersCount < 2,
    singleQuarterAvailable: availability.currentYearQuartersCount === 1,
  };
}
