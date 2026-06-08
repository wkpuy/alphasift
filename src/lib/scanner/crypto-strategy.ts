import { calculateEMA, calculateRSI, calculateATR, calculateADX, calculateBollingerBands, calculateStochastic } from './indicators';
import { fetchBinanceKlines } from '../api/binance';

export interface CryptoSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NONE';
  regime: 'TRENDING' | 'SIDEWAY' | 'UNKNOWN';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasons: string[];
  adxScore?: number;
}

export async function scanCryptoPair(symbol: string): Promise<CryptoSignal> {
  const klines = await fetchBinanceKlines(symbol, '1d', 300);
  
  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  
  const ema200 = calculateEMA(closes, 200);
  const ema5 = calculateEMA(closes, 5);
  const rsi2 = calculateRSI(closes, 2);
  const atr7 = calculateATR(highs, lows, closes, 7);
  const adx14 = calculateADX(highs, lows, closes, 14);

  const bb20 = calculateBollingerBands(closes, 20, 2);
  const stoch = calculateStochastic(highs, lows, closes, 14, 3, 3);
  
  const lastIdx = closes.length - 1;
  const currentPrice = closes[lastIdx];
  const lastEma200 = ema200[lastIdx];
  const lastEma5 = ema5[lastIdx];
  const lastRsi2 = rsi2[lastIdx];
  const lastAtr7 = atr7[lastIdx];
  const lastAdx = adx14[lastIdx];
  
  const lBBLower = bb20.lower[lastIdx];
  const lBBUpper = bb20.upper[lastIdx];
  const lBBMiddle = bb20.middle[lastIdx];
  const lStochK = stoch.k[lastIdx];
  
  let signal: 'BUY' | 'SELL' | 'NONE' = 'NONE';
  let regime: 'TRENDING' | 'SIDEWAY' | 'UNKNOWN' = 'UNKNOWN';
  const reasons: string[] = [];
  
  let stopLoss = 0;
  let takeProfit = 0;

  if (lastAdx === null) {
    return { symbol, signal, regime, entryPrice: currentPrice, stopLoss, takeProfit, reasons };
  }

  regime = lastAdx >= 20 ? 'TRENDING' : 'SIDEWAY';
  reasons.push(`Market Regime: ${regime} (ADX: ${lastAdx.toFixed(1)})`);

  if (regime === 'TRENDING') {
    let isBuy = false;

    if (lastEma200 !== null && currentPrice > lastEma200) {
      if (lastEma5 !== null && currentPrice < lastEma5) {
        if (lastRsi2 !== null && lastRsi2 < 20) {
          isBuy = true;
          reasons.push(`Signal: Price < EMA(5) and RSI(2)=${lastRsi2.toFixed(1)} < 20 (Mean Reversion in Uptrend)`);
        } else {
          reasons.push(`Wait: RSI(2) is ${lastRsi2?.toFixed(1)} (Need < 20)`);
        }
      } else {
        reasons.push(`Wait: Price is above EMA(5)`);
      }
    } else {
      reasons.push(`Wait: Price is below EMA(200)`);
    }

    if (isBuy && lastAtr7 !== null) {
      signal = 'BUY';
      stopLoss = currentPrice - (lastAtr7 * 1.5);
      takeProfit = currentPrice + (lastAtr7 * 3.0); // Rough estimate
    }
  } else if (regime === 'SIDEWAY') {
    if (lBBLower !== null && lBBUpper !== null && lBBMiddle !== null && lStochK !== null) {
      if (currentPrice <= lBBLower && lStochK < 20) {
        reasons.push(`Signal: Price at BB Lower (${lBBLower.toFixed(2)}) & Stoch K Oversold (${lStochK.toFixed(1)})`);
        signal = 'BUY';
        stopLoss = currentPrice - (lastAtr7 || currentPrice * 0.02);
        takeProfit = lBBMiddle;
      } else if (currentPrice >= lBBUpper && lStochK > 80) {
        reasons.push(`Signal: Price at BB Upper (${lBBUpper.toFixed(2)}) & Stoch K Overbought (${lStochK.toFixed(1)})`);
        signal = 'SELL';
        stopLoss = currentPrice + (lastAtr7 || currentPrice * 0.02);
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
    adxScore: lastAdx
  };
}
