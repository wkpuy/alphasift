import { calculateEMA, calculateRSI, calculateATR } from './indicators';
import type { Kline } from '../api/binance';

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  finalCapital: number;
  maxDrawdownPct: number;
  equityCurve: { time: string; equity: number }[];
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryTime: string;
  exitTime: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  status: 'win' | 'loss';
}

// 1. Fetch Binance Deep Historical (approx 5 years = 1825 days)
export async function fetchDeepBinanceKlines(symbol: string, days: number = 1825): Promise<Kline[]> {
  const klines: Kline[] = [];
  const limit = 1000;
  let endTime = Date.now();

  while (klines.length < days) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${limit}&endTime=${endTime}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (data.length === 0) break;

    const chunk = data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    }));

    klines.unshift(...chunk);
    endTime = data[0][0] - 1; // Set end time to just before the earliest candle in this chunk
    
    if (data.length < limit) break; // Reached the beginning of the coin's history
  }

  // Ensure chronological order
  klines.sort((a, b) => a.time - b.time);
  return klines.slice(-days); // Return only requested number of days
}

// 2. Parse Yahoo Finance CSV
export function parseYahooCSV(csv: string): Kline[] {
  const lines = csv.trim().split('\n');
  const klines: Kline[] = [];
  
  // Skip header (Date,Open,High,Low,Close,Adj Close,Volume)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;
    if (cols[1] === 'null') continue; // Skip days with no data

    klines.push({
      time: new Date(cols[0]).getTime(),
      open: parseFloat(cols[1]),
      high: parseFloat(cols[2]),
      low: parseFloat(cols[3]),
      close: parseFloat(cols[4]),
      volume: parseFloat(cols[6] || '0')
    });
  }
  
  return klines.sort((a, b) => a.time - b.time);
}

// 3. Run Simulation Loop
export function runBacktest(
  klines: Kline[], 
  strategy: 'Forex' | 'Crypto', 
  initialCapital: number, 
  riskPct: number
): BacktestResult {
  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);

  const equityCurve: { time: string; equity: number }[] = [];
  const trades: BacktestTrade[] = [];
  
  let capital = initialCapital;
  let maxCapital = initialCapital;
  let maxDrawdownPct = 0;
  
  // Active trade state
  let inTrade = false;
  let entryPrice = 0;
  let stopLoss = 0;
  let takeProfit = 0;
  let positionSize = 0;
  let riskAmount = 0;
  let tradeDirection: 'BUY' | 'SELL' = 'BUY';
  let entryTimeStr = '';

  // Calculate generic indicators
  const ema200 = calculateEMA(closes, 200);
  const ema50 = calculateEMA(closes, 50);
  const ema5 = calculateEMA(closes, 5);
  const rsi2 = calculateRSI(closes, 2);
  const rsi14 = calculateRSI(closes, 14);
  const atr7 = calculateATR(highs, lows, closes, 7);
  const atr14 = calculateATR(highs, lows, closes, 14);

  // Start loop from index 200 (to ensure EMA200 is warm)
  for (let i = 200; i < klines.length; i++) {
    const k = klines[i];
    const prevK = klines[i-1];
    const timeStr = new Date(k.time).toISOString().split('T')[0];

    // Record Equity Curve daily if not in trade, or float if in trade
    let currentEquity = capital;
    if (inTrade) {
      const pnl = tradeDirection === 'BUY' 
        ? (k.close - entryPrice) * positionSize 
        : (entryPrice - k.close) * positionSize;
      currentEquity = capital + pnl; 
    }
    equityCurve.push({ time: timeStr, equity: currentEquity });

    if (!inTrade) {
      // --- Entry Logic ---
      if (strategy === 'Crypto') {
        const cPrice = k.close;
        const e200 = ema200[i];
        const e5 = ema5[i];
        const r2 = rsi2[i];
        const a7 = atr7[i];

        if (e200 && e5 && r2 && a7) {
          if (cPrice > e200 && cPrice < e5 && r2 < 20) {
            inTrade = true;
            tradeDirection = 'BUY';
            entryPrice = cPrice;
            entryTimeStr = timeStr;
            const atrStop = cPrice - (a7 * 1.5);
            stopLoss = Math.max(prevK.low, atrStop);
            
            riskAmount = capital * (riskPct / 100);
            const dist = Math.abs(entryPrice - stopLoss);
            positionSize = dist > 0 ? riskAmount / dist : 0;
          }
        }
      } else {
        // Forex (Daily)
        const cPrice = k.close;
        const e50 = ema50[i];
        const e200 = ema200[i];
        const r14 = rsi14[i];
        const prevR14 = rsi14[i-1];
        const a14 = atr14[i];

        if (e50 && e200 && r14 && prevR14 && a14) {
          const trendUp = cPrice > e50 && e50 > e200;
          const trendDown = cPrice < e50 && e50 < e200;

          if (trendUp && prevR14 >= 35 && prevR14 <= 55 && r14 > prevR14) {
            inTrade = true;
            tradeDirection = 'BUY';
            entryPrice = cPrice;
            entryTimeStr = timeStr;
            const dist = a14 * 1.5;
            stopLoss = cPrice - dist;
            takeProfit = cPrice + (dist * 2);
            riskAmount = capital * (riskPct / 100);
            positionSize = dist > 0 ? riskAmount / dist : 0;
          } 
          else if (trendDown && prevR14 >= 45 && prevR14 <= 65 && r14 < prevR14) {
            inTrade = true;
            tradeDirection = 'SELL';
            entryPrice = cPrice;
            entryTimeStr = timeStr;
            const dist = a14 * 1.5;
            stopLoss = cPrice + dist;
            takeProfit = cPrice - (dist * 2);
            riskAmount = capital * (riskPct / 100);
            positionSize = dist > 0 ? riskAmount / dist : 0;
          }
        }
      }
    } else {
      // --- Exit Logic ---
      let exitPrice = 0;
      let closed = false;
      let status: 'win' | 'loss' = 'loss';

      if (strategy === 'Crypto') {
        // Crypto Exit: SL or RSI2 > 70
        if (k.low <= stopLoss) {
          exitPrice = stopLoss;
          closed = true;
          status = 'loss';
        } else if (rsi2[i] > 70) {
          exitPrice = k.close; // exit at close
          closed = true;
          status = exitPrice > entryPrice ? 'win' : 'loss';
        }
      } else {
        // Forex Exit: SL or TP
        if (tradeDirection === 'BUY') {
          if (k.low <= stopLoss) {
            exitPrice = stopLoss;
            closed = true;
            status = 'loss';
          } else if (k.high >= takeProfit) {
            exitPrice = takeProfit;
            closed = true;
            status = 'win';
          }
        } else {
          if (k.high >= stopLoss) {
            exitPrice = stopLoss;
            closed = true;
            status = 'loss';
          } else if (k.low <= takeProfit) {
            exitPrice = takeProfit;
            closed = true;
            status = 'win';
          }
        }
      }

      if (closed) {
        const pnl = tradeDirection === 'BUY' 
          ? (exitPrice - entryPrice) * positionSize 
          : (entryPrice - exitPrice) * positionSize;
          
        capital += pnl;
        
        trades.push({
          entryTime: entryTimeStr,
          exitTime: timeStr,
          type: tradeDirection,
          entryPrice,
          exitPrice,
          pnl,
          status
        });

        // Update max drawdown
        if (capital > maxCapital) {
          maxCapital = capital;
        } else {
          const dd = ((maxCapital - capital) / maxCapital) * 100;
          if (dd > maxDrawdownPct) maxDrawdownPct = dd;
        }

        inTrade = false;
      }
    }
  }

  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.length - wins;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  return {
    totalTrades: trades.length,
    wins,
    losses,
    winRate,
    netProfit: capital - initialCapital,
    finalCapital: capital,
    maxDrawdownPct,
    equityCurve,
    trades
  };
}
