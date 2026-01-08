/**
 * Backtesting Engine
 * 
 * Validates trading strategies historically and calculates performance metrics
 * Supports multiple strategy types and position management
 */

export interface Trade {
  entryDate: Date;
  entryPrice: number;
  exitDate: Date;
  exitPrice: number;
  quantity: number;
  positionSize: number; // % of portfolio
  pnl: number; // Profit/loss in dollars
  pnlPercent: number; // Profit/loss in %
  returnPercent: number; // Return %
  holdingDays: number;
  riskRewardRatio: number;
  winTrade: boolean;
}

export interface BacktestResult {
  ticker: string;
  strategyName: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number; // %
  annualizedReturn: number; // %
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number; // Gross profit / Gross loss
  avgWinSize: number; // $
  avgLossSize: number; // $
  largestWin: number; // $
  largestLoss: number; // $
  avgHoldingDays: number;
  maxDrawdown: number; // %
  sharpeRatio: number;
  sortinoRatio: number;
  trades: Trade[];
  equityCurve: Array<{ date: Date; value: number }>;
  monthlyReturns: Record<string, number>;
  timestamp: Date;
}

/**
 * Simulate a trade based on entry/exit prices
 */
export function simulateTrade(
  entryDate: Date,
  entryPrice: number,
  exitDate: Date,
  exitPrice: number,
  quantity: number,
  positionSize: number,
  riskRewardRatio: number
): Trade {
  const pnl = (exitPrice - entryPrice) * quantity;
  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
  const returnPercent = pnlPercent * (positionSize / 100);
  const holdingDays = Math.ceil(
    (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    entryDate,
    entryPrice,
    exitDate,
    exitPrice,
    quantity,
    positionSize,
    pnl,
    pnlPercent,
    returnPercent,
    holdingDays,
    riskRewardRatio,
    winTrade: pnl > 0,
  };
}

/**
 * Calculate backtest metrics
 */
export function calculateBacktestMetrics(
  trades: Trade[],
  initialCapital: number,
  startDate: Date,
  endDate: Date
): Omit<BacktestResult, "ticker" | "strategyName" | "trades" | "equityCurve" | "monthlyReturns"> {
  if (trades.length === 0) {
    return {
      startDate,
      endDate,
      initialCapital,
      finalCapital: initialCapital,
      totalReturn: 0,
      annualizedReturn: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgWinSize: 0,
      avgLossSize: 0,
      largestWin: 0,
      largestLoss: 0,
      avgHoldingDays: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      timestamp: new Date(),
    };
  }

  // Calculate capital changes
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const finalCapital = initialCapital + totalPnL;
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;

  // Annualized return
  const daysTraded = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const yearsTraded = daysTraded / 365;
  const annualizedReturn = (Math.pow(finalCapital / initialCapital, 1 / yearsTraded) - 1) * 100;

  // Win/loss statistics
  const winningTrades = trades.filter((t) => t.winTrade).length;
  const losingTrades = trades.length - winningTrades;
  const winRate = (winningTrades / trades.length) * 100;

  // Profit factor
  const grossProfit = trades.filter((t) => t.winTrade).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => !t.winTrade).reduce((sum, t) => sum + t.pnl, 0)
  );
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Average win/loss
  const avgWinSize = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLossSize = losingTrades > 0 ? grossLoss / losingTrades : 0;

  // Largest win/loss
  const largestWin = Math.max(...trades.map((t) => t.pnl), 0);
  const largestLoss = Math.min(...trades.map((t) => t.pnl), 0);

  // Average holding days
  const avgHoldingDays = Math.round(
    trades.reduce((sum, t) => sum + t.holdingDays, 0) / trades.length
  );

  // Max drawdown
  let maxDrawdown = 0;
  let peak = initialCapital;
  let currentCapital = initialCapital;

  trades.forEach((trade) => {
    currentCapital += trade.pnl;
    if (currentCapital > peak) {
      peak = currentCapital;
    }
    const drawdown = ((peak - currentCapital) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Sharpe Ratio (simplified)
  const returns = trades.map((t) => t.returnPercent);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Sortino Ratio (only downside volatility)
  const downReturns = returns.filter((r) => r < 0);
  const downVariance =
    downReturns.length > 0
      ? downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length
      : 0;
  const downStdDev = Math.sqrt(downVariance);
  const sortinoRatio = downStdDev > 0 ? (avgReturn / downStdDev) * Math.sqrt(252) : 0;

  return {
    startDate,
    endDate,
    initialCapital,
    finalCapital,
    totalReturn,
    annualizedReturn,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    avgWinSize,
    avgLossSize,
    largestWin,
    largestLoss,
    avgHoldingDays,
    maxDrawdown,
    sharpeRatio,
    sortinoRatio,
    timestamp: new Date(),
  };
}

/**
 * Generate equity curve from trades
 */
export function generateEquityCurve(
  trades: Trade[],
  initialCapital: number,
  startDate: Date
): Array<{ date: Date; value: number }> {
  const curve: Array<{ date: Date; value: number }> = [
    { date: startDate, value: initialCapital },
  ];

  let currentCapital = initialCapital;

  trades.forEach((trade) => {
    currentCapital += trade.pnl;
    curve.push({ date: trade.exitDate, value: currentCapital });
  });

  return curve;
}

/**
 * Calculate monthly returns
 */
export function calculateMonthlyReturns(
  trades: Trade[],
  initialCapital: number
): Record<string, number> {
  const monthlyReturns: Record<string, number> = {};

  trades.forEach((trade) => {
    const monthKey = `${trade.exitDate.getFullYear()}-${String(trade.exitDate.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyReturns[monthKey]) {
      monthlyReturns[monthKey] = 0;
    }

    monthlyReturns[monthKey] += (trade.pnl / initialCapital) * 100;
  });

  return monthlyReturns;
}

/**
 * Generate backtest report
 */
export function generateBacktestReport(result: BacktestResult): string {
  const report = `
BACKTEST REPORT: ${result.ticker}
Strategy: ${result.strategyName}
Period: ${result.startDate.toDateString()} to ${result.endDate.toDateString()}

PERFORMANCE METRICS
===================
Initial Capital: $${result.initialCapital.toFixed(2)}
Final Capital: $${result.finalCapital.toFixed(2)}
Total Return: ${result.totalReturn.toFixed(2)}%
Annualized Return: ${result.annualizedReturn.toFixed(2)}%

TRADE STATISTICS
================
Total Trades: ${result.totalTrades}
Winning Trades: ${result.winningTrades} (${result.winRate.toFixed(2)}%)
Losing Trades: ${result.losingTrades}
Profit Factor: ${result.profitFactor.toFixed(2)}x

TRADE DETAILS
=============
Average Win: $${result.avgWinSize.toFixed(2)}
Average Loss: $${result.avgLossSize.toFixed(2)}
Largest Win: $${result.largestWin.toFixed(2)}
Largest Loss: $${result.largestLoss.toFixed(2)}
Average Holding Days: ${result.avgHoldingDays}

RISK METRICS
============
Max Drawdown: ${result.maxDrawdown.toFixed(2)}%
Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}
Sortino Ratio: ${result.sortinoRatio.toFixed(2)}

Generated: ${result.timestamp.toISOString()}
`;

  return report;
}
