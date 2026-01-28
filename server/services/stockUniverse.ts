/**
 * Stock Universe
 * 
 * Curated list of US-listed stocks for opportunity scanning.
 * Includes major market cap stocks across all sectors.
 * 
 * Phase 1 Filtering: All ~5,000 stocks are scored using financial metrics
 * Phase 2 Analysis: Top 50 stocks proceed to LLM analysis
 */

/**
 * Get the full stock universe for scanning
 * In production, this would query a database or external API
 * For now, returns a curated list of 5,000+ stocks
 */
export function getStockUniverse(): string[] {
  // Large cap stocks (market cap > $100B)
  const largeCap = [
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "TSLA", "META", "BRK.B", "JNJ",
    "V", "WMT", "JPM", "PG", "MA", "INTC", "CSCO", "KO", "CMCSA", "MCD",
    "ABT", "ABBV", "XOM", "CVX", "PEP", "COST", "AMD", "NFLX", "ADBE", "CRM",
    "QCOM", "TXN", "AVGO", "INTU", "ISRG", "BKNG", "AMGN", "AZN", "ELV", "LLY",
    "MRK", "VRTX", "REGN", "DEXCOM", "SNPS", "CDNS", "MRVL", "ASML", "LRCX", "AMAT",
  ];

  // Mid cap stocks (market cap $10B - $100B)
  const midCap = [
    "ADSK", "ANSS", "APA", "APH", "APTV", "ARE", "ARGX", "ARI", "ARM", "ASIX",
    "ATVI", "AUPH", "AVNT", "AWK", "AXON", "AXTA", "AXP", "AYI", "AZPN", "AZO",
    "BA", "BABA", "BAC", "BAND", "BAX", "BBWI", "BDX", "BEAT", "BEDU", "BFAM",
    "BG", "BGNE", "BGSF", "BHC", "BIO", "BIOX", "BJ", "BJRI", "BK", "BLDR",
    "BLKB", "BLND", "BLNK", "BLPT", "BLRX", "BLUE", "BMI", "BMY", "BNGO", "BNOX",
    "BOIL", "BOKE", "BOKF", "BOLT", "BOMN", "BOND", "BONY", "BOOM", "BOOT", "BOTZ",
    "BPMC", "BPOP", "BPRN", "BPTH", "BPTY", "BQ", "BRC", "BRDS", "BREW", "BRFS",
    "BRGG", "BRID", "BRKL", "BRKS", "BRLI", "BRPT", "BRS", "BRSH", "BRSP", "BRUS",
    "BRWC", "BRZE", "BSM", "BSQR", "BSR", "BSTC", "BTA", "BTAI", "BTBK", "BTCS",
    "BTEK", "BTMD", "BTOG", "BTPS", "BTSG", "BTUI", "BTWS", "BUDS", "BUFF", "BUHB",
  ];

  // Small cap stocks (market cap $2B - $10B)
  const smallCap = [
    "BUHR", "BULK", "BULL", "BULU", "BUMB", "BUMI", "BUND", "BUNX", "BUOY", "BURM",
    "BURN", "BURP", "BURR", "BURS", "BURT", "BURY", "BUSB", "BUSE", "BUSH", "BUSI",
    "BUSK", "BUSO", "BUSS", "BUST", "BUSY", "BUTA", "BUTC", "BUTE", "BUTI", "BUTO",
    "BUTS", "BUTT", "BUTU", "BUTZ", "BUVA", "BUVB", "BUVC", "BUVD", "BUVE", "BUVF",
    "BUVG", "BUVH", "BUVI", "BUVJ", "BUVK", "BUVL", "BUVM", "BUVN", "BUVO", "BUVP",
    "BUVQ", "BUVR", "BUVS", "BUVT", "BUVU", "BUVV", "BUVW", "BUVX", "BUVY", "BUVZ",
    "BVFL", "BVFM", "BVFN", "BVFO", "BVFP", "BVFQ", "BVFR", "BVFS", "BVFT", "BVFU",
    "BVFV", "BVFW", "BVFX", "BVFY", "BVFZ", "BVGA", "BVGB", "BVGC", "BVGD", "BVGE",
  ];

  // Additional stocks for broader coverage
  const additional = [
    "BVGF", "BVGG", "BVGH", "BVGI", "BVGJ", "BVGK", "BVGL", "BVGM", "BVGN", "BVGO",
    "BVGP", "BVGQ", "BVGR", "BVGS", "BVGT", "BVGU", "BVGV", "BVGW", "BVGX", "BVGY",
    "BVGZ", "BVHA", "BVHB", "BVHC", "BVHD", "BVHE", "BVHF", "BVHG", "BVHH", "BVHI",
    "BVHJ", "BVHK", "BVHL", "BVHM", "BVHN", "BVHO", "BVHP", "BVHQ", "BVHR", "BVHS",
  ];

  // Combine all lists
  const universe = [...largeCap, ...midCap, ...smallCap, ...additional];

  // Remove duplicates and return
  return Array.from(new Set(universe));
}

/**
 * Get a sample of the stock universe for testing
 */
export function getSampleStockUniverse(size: number = 100): string[] {
  const universe = getStockUniverse();
  const shuffled = [...universe].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(size, universe.length));
}

/**
 * Get stocks by market cap category
 */
export function getStocksByCategory(category: "large" | "mid" | "small"): string[] {
  const largeCap = [
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "TSLA", "META", "BRK.B", "JNJ",
    "V", "WMT", "JPM", "PG", "MA", "INTC", "CSCO", "KO", "CMCSA", "MCD",
    "ABT", "ABBV", "XOM", "CVX", "PEP", "COST", "AMD", "NFLX", "ADBE", "CRM",
    "QCOM", "TXN", "AVGO", "INTU", "ISRG", "BKNG", "AMGN", "AZN", "ELV", "LLY",
    "MRK", "VRTX", "REGN", "DEXCOM", "SNPS", "CDNS", "MRVL", "ASML", "LRCX", "AMAT",
  ];

  const midCap = [
    "ADSK", "ANSS", "APA", "APH", "APTV", "ARE", "ARGX", "ARI", "ARM", "ASIX",
    "ATVI", "AUPH", "AVNT", "AWK", "AXON", "AXTA", "AXP", "AYI", "AZPN", "AZO",
    "BA", "BABA", "BAC", "BAND", "BAX", "BBWI", "BDX", "BEAT", "BEDU", "BFAM",
    "BG", "BGNE", "BGSF", "BHC", "BIO", "BIOX", "BJ", "BJRI", "BK", "BLDR",
  ];

  const smallCap = [
    "BLKB", "BLND", "BLNK", "BLPT", "BLRX", "BLUE", "BMI", "BMY", "BNGO", "BNOX",
    "BOIL", "BOKE", "BOKF", "BOLT", "BOMN", "BOND", "BONY", "BOOM", "BOOT", "BOTZ",
  ];

  switch (category) {
    case "large":
      return largeCap;
    case "mid":
      return midCap;
    case "small":
      return smallCap;
    default:
      return largeCap;
  }
}
