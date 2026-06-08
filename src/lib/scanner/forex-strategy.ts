import { calculateEMA, calculateRSI, calculateATR, calculateADX, calculateBollingerBands, calculateStochastic } from './indicators';
import { fetchTwelveDataKlines, aggregateH4ToDaily } from '../api/twelvedata';

export interface ForexSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NONE';
  regime: 'TRENDING' | 'SIDEWAY' | 'UNKNOWN';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasons: string[];
  adxScore?: number;
  rsiDepth?: number;
}

export async function scanForexPair(symbol: string, apiKey: string): Promise<ForexSignal> {
  const hourlyKlines = await fetchTwelveDataKlines(symbol, '4h', 2000, apiKey);
  const dailyKlines = aggregateH4ToDaily(hourlyKlines);
  
  const dCloses = dailyKlines.map(k => k.close);
  const dHighs = dailyKlines.map(k => k.high);
  const dLows = dailyKlines.map(k => k.low);
  const hCloses = hourlyKlines.map(k => k.close);
  const hHighs = hourlyKlines.map(k => k.high);
  const hLows = hourlyKlines.map(k => k.low);
  
  const ema50D = calculateEMA(dCloses, 50);
  const ema200D = calculateEMA(dCloses, 200);
  const adxD = calculateADX(dHighs, dLows, dCloses, 14);
  const rsi14H = calculateRSI(hCloses, 14);
  const atr14H = calculateATR(hHighs, hLows, hCloses, 14);
  
  const bb20H = calculateBollingerBands(hCloses, 20, 2);
  const stochH = calculateStochastic(hHighs, hLows, hCloses, 14, 3, 3);

  const lastD = dCloses.length - 1;
  const currentDailyPrice = dCloses[lastD];
  const lEma50 = ema50D[lastD];
  const lEma200 = ema200D[lastD];
  const lAdx = adxD[lastD];
  
  const lastH = hCloses.length - 1;
  const currentPrice = hCloses[lastH];
  const lRsi14 = rsi14H[lastH];
  const lAtr14 = atr14H[lastH];
  const lBBLower = bb20H.lower[lastH];
  const lBBUpper = bb20H.upper[lastH];
  const lBBMiddle = bb20H.middle[lastH];
  const lStochK = stochH.k[lastH];
  
  const prevRsi14 = rsi14H[lastH - 1];

  let signal: 'BUY' | 'SELL' | 'NONE' = 'NONE';
  let regime: 'TRENDING' | 'SIDEWAY' | 'UNKNOWN' = 'UNKNOWN';
  const reasons: string[] = [];
  
  let stopLoss = 0;
  let takeProfit = 0;

  if (lAdx === null) {
    return { symbol, signal, regime, entryPrice: currentPrice, stopLoss, takeProfit, reasons };
  }

  regime = lAdx >= 20 ? 'TRENDING' : 'SIDEWAY';
  reasons.push(`Market Regime: ${regime} (ADX: ${lAdx.toFixed(1)})`);

  if (regime === 'TRENDING') {
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
    
  } else if (regime === 'SIDEWAY') {
    if (lBBLower !== null && lBBUpper !== null && lBBMiddle !== null && lStochK !== null) {
      if (currentPrice <= lBBLower && lStochK < 20) {
        reasons.push(`Signal: Price at BB Lower (${lBBLower.toFixed(4)}) & Stoch K Oversold (${lStochK.toFixed(1)})`);
        signal = 'BUY';
        stopLoss = currentPrice - (lAtr14 || 0.0010);
        takeProfit = lBBMiddle;
      } else if (currentPrice >= lBBUpper && lStochK > 80) {
        reasons.push(`Signal: Price at BB Upper (${lBBUpper.toFixed(4)}) & Stoch K Overbought (${lStochK.toFixed(1)})`);
        signal = 'SELL';
        stopLoss = currentPrice + (lAtr14 || 0.0010);
        takeProfit = lBBMiddle;
      } else {
        reasons.push(`Wait: Price inside range. Stoch K: ${lStochK.toFixed(1)}`);
      }
    }
  }

  return {
    symbol,
    signal,
    regime,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    reasons,
    adxScore: lAdx,
    rsiDepth: lRsi14 !== null ? lRsi14 : undefined
  };
}
