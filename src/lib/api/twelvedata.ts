import type { Kline } from './binance';

const cache = new Map<string, { data: Kline[], timestamp: number }>();

export async function fetchTwelveDataKlines(symbol: string, interval: string, outputsize: number, apikey: string): Promise<Kline[]> {
  const cacheKey = `${symbol}-${interval}`;
  const now = Date.now();

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    // Cache for 5 minutes to prevent TwelveData 8 req/min rate limit errors
    if (now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apikey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(data.message || 'TwelveData API Error');
  }

  if (!data.values) {
    return [];
  }

  // TwelveData returns DESCENDING order (newest first). We need ASCENDING (oldest first).
  const values = data.values.reverse();

  const klines = values.map((v: any) => ({
    time: new Date(v.datetime).getTime(),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: parseFloat(v.volume || '0')
  }));

  cache.set(cacheKey, { data: klines, timestamp: now });
  return klines;
}

export function aggregateH4ToDaily(h4Klines: Kline[]): Kline[] {
  const dailyKlines: Kline[] = [];
  let currentDay = '';
  let currentDaily: any = null;

  for (const k of h4Klines) {
    // Get YYYY-MM-DD
    const date = new Date(k.time);
    const dayStr = date.toISOString().split('T')[0];

    if (dayStr !== currentDay) {
      if (currentDaily) {
        dailyKlines.push(currentDaily);
      }
      currentDay = dayStr;
      currentDaily = {
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume
      };
    } else {
      currentDaily.high = Math.max(currentDaily.high, k.high);
      currentDaily.low = Math.min(currentDaily.low, k.low);
      currentDaily.close = k.close; // Last H4 close of the day
      currentDaily.volume += k.volume;
    }
  }

  if (currentDaily) {
    dailyKlines.push(currentDaily);
  }

  return dailyKlines;
}
