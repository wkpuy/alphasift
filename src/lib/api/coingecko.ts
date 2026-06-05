export async function getTopCryptoPairsByMarketCap(minMarketCap: number = 1000000000): Promise<string[]> {
  try {
    // Fetch top 20 coins
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1';
    const response = await fetch(url);
    
    // Fallback if CoinGecko rate limits us
    if (!response.ok) {
      console.warn('CoinGecko API limit reached, using fallback list');
      return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    }
    
    const data = await response.json();
    
    // Filter by Market Cap
    const filtered = data.filter((coin: any) => coin.market_cap >= minMarketCap);
    
    // Map to Binance symbol format
    const symbols = filtered.map((coin: any) => coin.symbol.toUpperCase() + 'USDT');
    
    // Ignore stablecoins and wrapped tokens
    const ignoreList = [
      'USDTUSDT', 'USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 
      'USDDUSDT', 'FRAXUSDT', 'WBTCUSDT', 'WETHUSDT', 'STETHUSDT'
    ];
    
    return symbols.filter((s: string) => !ignoreList.includes(s));
  } catch (error) {
    console.error('Failed to fetch from CoinGecko, using fallback');
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
  }
}
