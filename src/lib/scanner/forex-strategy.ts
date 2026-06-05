import { calculateEMA, calculateRSI, calculateATR } from './indicators';
import { fetchTwelveDataKlines, aggregateH4ToDaily } from '../api/twelvedata';

export interface ForexSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NONE';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasons: string[];
}

export async function scanForexPair(symbol: string, apiKey: string): Promise<ForexSignal> {
  // Fetch 2000 H4 candles (~330 trading days) using only 1 API Credit
  // This helps avoid TwelveData's 8 requests/minute Free Tier limit for 7 pairs.
  const hourlyKlines = await fetchTwelveDataKlines(symbol, '4h', 2000, apiKey);
  const dailyKlines = aggregateH4ToDaily(hourlyKlines);
  
  const dCloses = dailyKlines.map(k => k.close);
  const hCloses = hourlyKlines.map(k => k.close);
  const hHighs = hourlyKlines.map(k => k.high);
  const hLows = hourlyKlines.map(k => k.low);
  
  const ema50D = calculateEMA(dCloses, 50);
  const ema200D = calculateEMA(dCloses, 200);
  const rsi14H = calculateRSI(hCloses, 14);
  const atr14H = calculateATR(hHighs, hLows, hCloses, 14);

  const lastD = dCloses.length - 1;
  const currentDailyPrice = dCloses[lastD];
  const lEma50 = ema50D[lastD];
  const lEma200 = ema200D[lastD];
  
  const lastH = hCloses.length - 1;
  const currentPrice = hCloses[lastH];
  const lRsi14 = rsi14H[lastH];
  const lAtr14 = atr14H[lastH];
  
  const prevRsi14 = rsi14H[lastH - 1];

  let signal: 'BUY' | 'SELL' | 'NONE' = 'NONE';
  const reasons: string[] = [];

  let trend = 'NONE';
  if (lEma50 !== null && lEma200 !== null) {
    if (currentDailyPrice > lEma50 && lEma50 > lEma200) trend = 'UP';
    else if (currentDailyPrice < lEma50 && lEma50 < lEma200) trend = 'DOWN';
  }

  reasons.push(`Trend (Daily): ${trend}`);

  if (trend === 'UP') {
    if (lRsi14 !== null && prevRsi14 !== null) {
      if (prevRsi14 >= 35 && prevRsi14 <= 55 && lRsi14 > prevRsi14) {
        reasons.push(`Signal: RSI(14) Hooked Up from ${prevRsi14.toFixed(1)} to ${lRsi14.toFixed(1)}`);
        signal = 'BUY';
      } else {
        reasons.push(`Wait: RSI(14) is ${lRsi14.toFixed(1)} (Need 35-55 Hook)`);
      }
    }
  } else if (trend === 'DOWN') {
    if (lRsi14 !== null && prevRsi14 !== null) {
      if (prevRsi14 >= 45 && prevRsi14 <= 65 && lRsi14 < prevRsi14) {
        reasons.push(`Signal: RSI(14) Hooked Down from ${prevRsi14.toFixed(1)} to ${lRsi14.toFixed(1)}`);
        signal = 'SELL';
      } else {
        reasons.push(`Wait: RSI(14) is ${lRsi14.toFixed(1)} (Need 45-65 Hook)`);
      }
    }
  }

  let stopLoss = 0;
  let takeProfit = 0;

  if (signal !== 'NONE' && lAtr14 !== null) {
    const slDistance = lAtr14 * 1.5;
    if (signal === 'BUY') {
      stopLoss = currentPrice - slDistance;
      takeProfit = currentPrice + (slDistance * 2);
    } else {
      stopLoss = currentPrice + slDistance;
      takeProfit = currentPrice - (slDistance * 2);
    }
  }

  return {
    symbol,
    signal,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    reasons
  };
}
