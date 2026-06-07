import { useState } from 'react';
import { fetchDeepBinanceKlines, parseYahooCSV, runBacktest, type BacktestResult } from '../lib/scanner/backtest';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, UploadCloud, Play, Download, TrendingUp, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function Backtest() {
  const [mode, setMode] = useState<'Crypto' | 'Forex'>('Crypto');
  const [symbol, setSymbol] = useState(mode === 'Crypto' ? 'BTCUSDT' : 'EURUSD=X');
  const [capital, setCapital] = useState(50000);
  const [riskPct, setRiskPct] = useState(1.0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRunCrypto = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      toast.loading('Fetching 5 years of Binance data...', { id: 'bt' });
      const klines = await fetchDeepBinanceKlines(symbol.toUpperCase(), 1825);
      if (klines.length < 200) {
        throw new Error("Not enough historical data for this coin.");
      }
      
      toast.loading('Running simulation...', { id: 'bt' });
      const res = runBacktest(klines, 'Crypto', capital, riskPct);
      setResult(res);
      toast.success('Backtest complete!', { id: 'bt' });
    } catch (e: any) {
      toast.error(e.message || 'Backtest failed', { id: 'bt' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRunning(true);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const klines = parseYahooCSV(csv);
        if (klines.length < 200) {
          throw new Error("CSV has too few rows (need at least 200 for EMA).");
        }
        const res = runBacktest(klines, 'Forex', capital, riskPct);
        setResult(res);
        toast.success('CSV Backtest complete!');
      } catch (err: any) {
        toast.error('Error parsing CSV: ' + err.message);
      } finally {
        setIsRunning(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto pb-24 bg-slate-900 text-white animate-fade-in">
      <div className="p-4 space-y-6">
        
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
          <Activity size={24} className="text-blue-500" /> Backtest Engine
        </h1>

        <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
          <button 
            onClick={() => { setMode('Crypto'); setSymbol('BTCUSDT'); setResult(null); }}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Crypto' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Crypto (Auto)
          </button>
          <button 
            onClick={() => { setMode('Forex'); setSymbol('EURUSD=X'); setResult(null); }}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Forex' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Forex (CSV)
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Initial Capital (฿)</label>
              <input 
                type="number" 
                value={capital}
                onChange={e => setCapital(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Risk Per Trade (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={riskPct}
                onChange={e => setRiskPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'Crypto' ? (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Coin Symbol (Binance)</label>
                <input 
                  type="text" 
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. BTCUSDT"
                />
              </div>
              <button 
                onClick={handleRunCrypto}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg flex justify-center items-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRunning ? <Activity size={18} className="animate-spin mr-2" /> : <Play size={18} className="mr-2" />}
                Auto-Fetch 5 Years & Run Backtest
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 text-xs text-indigo-200">
                <p className="flex items-start mb-2 font-bold text-indigo-300">
                  <AlertCircle size={16} className="mr-2 shrink-0 mt-0.5" />
                  Forex 5-Year Data Download
                </p>
                <p className="mb-3">For free high-quality daily data, download a 5-year CSV from Yahoo Finance and upload it below.</p>
                <a 
                  href={`https://finance.yahoo.com/quote/${symbol}/history/`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-3 py-2 rounded-md font-bold transition-colors"
                >
                  <Download size={14} className="mr-2" /> Get {symbol} CSV from Yahoo
                </a>
              </div>
              
              <div className="relative border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-900/50 transition-colors group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isRunning}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <UploadCloud size={32} className="text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-300">Tap to upload Yahoo Finance CSV</p>
                <p className="text-xs text-slate-500 mt-1">Runs backtest automatically upon upload</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp size={18} className="text-blue-400"/> Backtest Results</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Win Rate</p>
                <p className={clsx("text-xl font-black", result.winRate >= 50 ? "text-success" : "text-danger")}>
                  {result.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Net Profit</p>
                <p className={clsx("text-xl font-black font-mono", result.netProfit >= 0 ? "text-success" : "text-danger")}>
                  {result.netProfit > 0 ? '+' : ''}฿{result.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Trades</p>
                <p className="text-xl font-black">{result.totalTrades}</p>
                <p className="text-xs text-slate-500 mt-0.5">{result.wins}W / {result.losses}L</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Max Drawdown</p>
                <p className="text-xl font-black text-danger">-{result.maxDrawdownPct.toFixed(1)}%</p>
              </div>
            </div>

            {/* Equity Curve Chart */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg mt-4">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Equity Curve (5 Years)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickMargin={10} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickFormatter={(val) => `฿${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} 
                      width={45} 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                      formatter={(val: any) => [`฿${Number(val).toLocaleString(undefined, {maximumFractionDigits:0})}`, 'Equity']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#60a5fa" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
