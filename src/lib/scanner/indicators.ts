export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result = new Array(data.length).fill(null);
  if (data.length < period) return result;
  
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - prevEMA) * k + prevEMA;
    result[i] = ema;
    prevEMA = ema;
  }
  return result;
}

export function calculateRSI(data: number[], period: number): number[] {
  const rsi = new Array(data.length).fill(null);
  if (data.length < period + 1) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    let rs = avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));
  }

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    let gain = 0;
    let loss = 0;
    if (diff > 0) gain = diff;
    else loss = -diff;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      let rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const atr = new Array(highs.length).fill(null);
  const tr = new Array(highs.length).fill(0);
  
  if (highs.length < period + 1) return atr;

  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hl, hpc, lpc);
  }

  let sumTR = 0;
  for (let i = 1; i <= period; i++) {
    sumTR += tr[i];
  }
  
  let prevATR = sumTR / period;
  atr[period] = prevATR;

  for (let i = period + 1; i < tr.length; i++) {
    prevATR = (prevATR * (period - 1) + tr[i]) / period;
    atr[i] = prevATR;
  }

  return atr;
}

export function calculateADX(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const adx = new Array(highs.length).fill(null);
  if (highs.length < period * 2) return adx;

  const tr = new Array(highs.length).fill(0);
  const plusDM = new Array(highs.length).fill(0);
  const minusDM = new Array(highs.length).fill(0);

  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hl, hpc, lpc);

    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) plusDM[i] = upMove;
    else plusDM[i] = 0;

    if (downMove > upMove && downMove > 0) minusDM[i] = downMove;
    else minusDM[i] = 0;
  }

  let smoothedTR = 0, smoothedPlusDM = 0, smoothedMinusDM = 0;
  for(let i=1; i<=period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  const dx = new Array(highs.length).fill(null);
  
  let plusDI = (smoothedPlusDM / smoothedTR) * 100;
  let minusDI = (smoothedMinusDM / smoothedTR) * 100;
  dx[period] = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;

  for (let i = period + 1; i < highs.length; i++) {
    smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];

    plusDI = (smoothedPlusDM / smoothedTR) * 100;
    minusDI = (smoothedMinusDM / smoothedTR) * 100;
    
    if (plusDI + minusDI === 0) {
      dx[i] = 0;
    } else {
      dx[i] = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    }
  }

  let adxSum = 0;
  for (let i = period; i < period * 2; i++) {
    adxSum += dx[i];
  }
  adx[period * 2 - 1] = adxSum / period;

  for (let i = period * 2; i < dx.length; i++) {
    adx[i] = ((adx[i - 1] * (period - 1)) + dx[i]) / period;
  }

  return adx;
}

export function calculateBollingerBands(closes: number[], period: number, stdDev: number): { upper: number[], middle: number[], lower: number[] } {
  const upper = new Array(closes.length).fill(null);
  const middle = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  if (closes.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += closes[i - j];
    }
    const sma = sum / period;
    
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closes[i - j] - sma, 2);
    }
    const variance = varianceSum / period;
    const sd = Math.sqrt(variance);

    middle[i] = sma;
    upper[i] = sma + (stdDev * sd);
    lower[i] = sma - (stdDev * sd);
  }

  return { upper, middle, lower };
}

export function calculateStochastic(highs: number[], lows: number[], closes: number[], periodK: number, smoothK: number, smoothD: number): { k: number[], d: number[] } {
  const kLine = new Array(closes.length).fill(null);
  const dLine = new Array(closes.length).fill(null);
  const fastK = new Array(closes.length).fill(null);

  if (closes.length < periodK) return { k: kLine, d: dLine };

  for (let i = periodK - 1; i < closes.length; i++) {
    let highestHigh = highs[i];
    let lowestLow = lows[i];
    for (let j = 1; j < periodK; j++) {
      if (highs[i - j] > highestHigh) highestHigh = highs[i - j];
      if (lows[i - j] < lowestLow) lowestLow = lows[i - j];
    }
    
    if (highestHigh === lowestLow) {
      fastK[i] = 100;
    } else {
      fastK[i] = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
    }
  }

  // Smooth %K
  for (let i = periodK - 1 + smoothK - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothK; j++) {
      sum += fastK[i - j];
    }
    kLine[i] = sum / smoothK;
  }

  // Smooth %D
  for (let i = periodK - 1 + smoothK - 1 + smoothD - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothD; j++) {
      sum += kLine[i - j];
    }
    dLine[i] = sum / smoothD;
  }

  return { k: kLine, d: dLine };
}
