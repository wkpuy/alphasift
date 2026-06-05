import { calculateEMA, calculateRSI, calculateADX, calculateATR } from './indicators';
import { fetchBinanceKlines } from '../api/binance';

export interface CryptoSignal {
  symbol: string;
  signal: 'BUY' | 'NONE';
  entryPrice: number;
  stopLoss: number;
  takeProfit: string;
  adxValue: number;
  rsiValue: number;
  reasons: string[];
}

export async function scanCryptoPair(symbol: string): Promise<CryptoSignal> {
  const klines = await fetchBinanceKlines(symbol, '1d', 300);
  
  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  
  const ema200 = calculateEMA(closes, 200);
  const ema5 = calculateEMA(closes, 5);
  const rsi2 = calculateRSI(closes, 2);
  const adx14 = calculateADX(highs, lows, closes, 14);
  const atr7 = calculateATR(highs, lows, closes, 7);

  const lastIdx = closes.length - 1;
  const currentPrice = closes[lastIdx];
  const lastEma200 = ema200[lastIdx];
  const lastEma5 = ema5[lastIdx];
  const lastRsi2 = rsi2[lastIdx];
  const lastAdx14 = adx14[lastIdx];
  const lastAtr7 = atr7[lastIdx];
  const prevLow = lows[lastIdx - 1];

  let isBuy = false;
  const reasons: string[] = [];

  if (lastEma200 !== null && currentPrice > lastEma200) {
    reasons.push(`Trend: Price > EMA200 (Uptrend)`);
    
    if (lastEma5 !== null && currentPrice < lastEma5) {
      if (lastRsi2 !== null && lastRsi2 < 20) {
        reasons.push(`Signal: RSI(2) = ${lastRsi2.toFixed(1)} (<20)`);
        isBuy = true;
      } else {
        reasons.push(`Wait: RSI(2) = ${lastRsi2?.toFixed(1)} (Not < 20)`);
      }
    } else {
      reasons.push(`Wait: Price >= EMA5`);
    }
  } else {
    reasons.push(`Trend: Price < EMA200 (No Buy in Downtrend)`);
  }

  let stopLoss = 0;
  if (isBuy && lastAtr7 !== null) {
    const atrStop = currentPrice - (lastAtr7 * 1.5);
    stopLoss = Math.max(prevLow, atrStop);
  }

  return {
    symbol,
    signal: isBuy ? 'BUY' : 'NONE',
    entryPrice: currentPrice,
    stopLoss,
    takeProfit: 'RSI(2) > 70',
    adxValue: lastAdx14 || 0,
    rsiValue: lastRsi2 || 0,
    reasons
  };
}
