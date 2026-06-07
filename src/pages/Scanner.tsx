import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, AlertCircle, Check, X, ChevronRight } from 'lucide-react';
import { scanCryptoPair, type CryptoSignal } from '../lib/scanner/crypto-strategy';
import { scanForexPair, type ForexSignal } from '../lib/scanner/forex-strategy';
import { fetchUpcomingNews, getNewsWarningsForPair } from '../lib/api/forexfactory';
import { getTopCryptoPairsByMarketCap } from '../lib/api/coingecko';
import { useSettingsStore, useScannerStore } from '../lib/store/useAppStore';
import { getAllTrades } from '../lib/storage/db';
import EconomicCalendar from '../components/EconomicCalendar';
import clsx from 'clsx';

// Extend signal interfaces for UI display
type ScannedSignal = (CryptoSignal | ForexSignal) & { 
  newsWarnings?: string[];
  correlationWarning?: string;
};

// Groups for USD correlation
const USD_BASE_PAIRS = ['EUR/USD', 'GBP/USD', 'AUD/USD', 'XAU/USD']; // Shorting USD means BUY these
const USD_QUOTE_PAIRS = ['USD/JPY', 'USD/CHF', 'USD/CAD']; // Shorting USD means SELL these

export default function Scanner() {
  const { lastMode, lastResults, setLastMode, setLastResults } = useScannerStore();
  const [mode, setMode] = useState<'Forex' | 'Crypto'>(lastMode);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScannedSignal[]>(lastResults);
  const [error, setError] = useState('');
  const tdToken = useSettingsStore(state => state.twelveDataToken);
  const navigate = useNavigate();

  const handleScan = async () => {
    setIsScanning(true);
    setError('');
    setResults([]);
    
    try {
      if (mode === 'Crypto') {
        const pairs = await getTopCryptoPairsByMarketCap(1000000000); 
        const promises = pairs.map(p => scanCryptoPair(p).catch(err => {
          console.warn(`Skipped ${p}: ${err.message}`);
          return null;
        }));
        const res = await Promise.all(promises);
        const validRes = res.filter(r => r !== null) as CryptoSignal[];
        setResults(validRes);
        setLastResults(validRes);
      } else {
        if (!tdToken) {
          setError('TwelveData API Key is missing. Please add it in Settings.');
          setIsScanning(false);
          return;
        }

        const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'XAU/USD'];
        const promises = pairs.map(p => scanForexPair(p, tdToken).catch(err => {
          console.warn(`Skipped ${p}: ${err.message}`);
          return null;
        }));
        
        const res = await Promise.all(promises);
        const validRes = res.filter(r => r !== null) as ScannedSignal[];
        
        const hasAnySignal = validRes.some(r => r.signal !== 'NONE');
        
        if (hasAnySignal) {
          // 1. Fetch News Warnings
          const newsData = await fetchUpcomingNews();
          
          // 2. Fetch Active Trades for Correlation Check
          const activeTrades = (await getAllTrades()).filter(t => t.status === 'active' || t.status === 'pending');
          const isShortUsd = activeTrades.some(t => 
            (USD_BASE_PAIRS.includes(t.coin) && t.direction === 'BUY') || 
            (USD_QUOTE_PAIRS.includes(t.coin) && t.direction === 'SELL')
          );
          const isLongUsd = activeTrades.some(t => 
            (USD_BASE_PAIRS.includes(t.coin) && t.direction === 'SELL') || 
            (USD_QUOTE_PAIRS.includes(t.coin) && t.direction === 'BUY')
          );

          for (const signal of validRes) {
            if (signal.signal !== 'NONE') {
              // Add News Warnings
              const warnings = getNewsWarningsForPair(signal.symbol, newsData);
              if (warnings.length > 0) {
                signal.newsWarnings = warnings;
              }

              // Add Correlation Warnings
              const signalShortsUsd = (USD_BASE_PAIRS.includes(signal.symbol) && signal.signal === 'BUY') || 
                                      (USD_QUOTE_PAIRS.includes(signal.symbol) && signal.signal === 'SELL');
              const signalLongsUsd = (USD_BASE_PAIRS.includes(signal.symbol) && signal.signal === 'SELL') || 
                                     (USD_QUOTE_PAIRS.includes(signal.symbol) && signal.signal === 'BUY');
              
              if (signalShortsUsd && isShortUsd) {
                signal.correlationWarning = "Correlation Risk: You already have positions betting on USD weakness. Taking this trade increases your exposure to USD recovery.";
              } else if (signalLongsUsd && isLongUsd) {
                signal.correlationWarning = "Correlation Risk: You already have positions betting on USD strength. Taking this trade increases your exposure to USD drops.";
              }
            }
          }
        }
        
        setResults(validRes);
        setLastResults(validRes);
      }
    } catch (err: any) {
      setError(err.message || 'Error scanning pairs');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelect = (result: ScannedSignal) => {
    if (result.signal !== 'NONE') {
      navigate('/scanner/risk', { state: { result, mode } });
    }
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex p-1 bg-slate-800 rounded-lg">
        <button 
          onClick={() => { setMode('Forex'); setLastMode('Forex'); setResults([]); setLastResults([]); setError(''); }}
          className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-all", mode === 'Forex' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
        >
          Forex
        </button>
        <button 
          onClick={() => { setMode('Crypto'); setLastMode('Crypto'); setResults([]); setLastResults([]); setError(''); }}
          className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-all", mode === 'Crypto' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
        >
          Crypto
        </button>
      </div>

      {mode === 'Forex' && new Date().getDay() === 5 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 mt-4 flex items-start">
          <AlertCircle size={16} className="text-amber-400 mr-2 shrink-0 mt-0.5" />
          <p>
            <strong>Friday Warning:</strong> Professional traders recommend to <strong>AVOID</strong> opening new Forex positions on Friday afternoon. Holding positions over the weekend exposes you to severe "gap" risks if unexpected news breaks.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-6 border-b border-slate-700 pb-8">
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 flex flex-col items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-70"
        >
          <Radar size={36} className={clsx("mb-2", isScanning && "animate-spin text-blue-200")} />
          <span className="font-bold tracking-wider">{isScanning ? 'SCANNING' : 'SCAN'}</span>
        </button>
        <p className="mt-4 text-slate-400 text-sm">
          {error ? <span className="text-danger flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</span> : `Tap to scan for ${mode} signals`}
        </p>
      </div>

      {results.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-bold text-slate-300 pb-2">Candidates Found:</h3>
          {results.map((res, i) => {
            const hasSignal = res.signal !== 'NONE';
            return (
              <div 
                key={i} 
                onClick={() => handleSelect(res)}
                className={clsx(
                  "bg-cardBg border rounded-xl p-4 transition-colors relative overflow-hidden",
                  hasSignal ? "border-slate-700 hover:border-blue-500 cursor-pointer group" : "border-slate-800 opacity-60"
                )}
              >
                {hasSignal && (
                  <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-blue-500/10 to-transparent flex items-center justify-end pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-blue-400" />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className={clsx("font-bold text-lg", hasSignal && "group-hover:text-blue-400 transition-colors")}>{res.symbol}</h4>
                    {mode === 'Forex' && hasSignal && ('adxScore' in res) && res.adxScore && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ADX Score: <span className={clsx("font-bold", res.adxScore > 25 ? "text-blue-400" : "text-slate-500")}>{res.adxScore.toFixed(1)}</span>
                        {('rsiDepth' in res) && res.rsiDepth && <span className="ml-2">| RSI: {res.rsiDepth.toFixed(1)}</span>}
                      </p>
                    )}
                  </div>
                  <span className={clsx(
                    "text-[10px] px-2 py-1 rounded font-mono border",
                    res.signal === 'BUY' ? "bg-success/20 text-success border-success/30" : 
                    res.signal === 'SELL' ? "bg-danger/20 text-danger border-danger/30" : 
                    "bg-slate-700 text-slate-400 border-slate-600"
                  )}>
                    {res.signal === 'NONE' ? 'NO SIGNAL' : `${res.signal} SETUP`}
                  </span>
                </div>
                
                <div className="text-[10px] text-slate-400 space-y-1 mt-3 bg-slate-800/50 p-2 rounded">
                  {res.reasons.map((r, idx) => {
                    const isWaitOrNo = r.startsWith('Wait') || r.includes('No Buy');
                    return (
                      <p key={idx} className="flex items-start">
                        {isWaitOrNo ? <X size={12} className="text-danger mr-1 mt-0.5 flex-shrink-0" /> : <Check size={12} className="text-success mr-1 mt-0.5 flex-shrink-0" />}
                        <span>{r}</span>
                      </p>
                    )
                  })}
                </div>

                {/* Warnings Section */}
                <div className="mt-3 space-y-1 animate-fade-in">
                  {/* Correlation Warning */}
                  {res.correlationWarning && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1.5 flex items-start text-xs text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)] mb-1">
                      <AlertCircle size={14} className="mr-1 mt-0.5 shrink-0" />
                      <span>{res.correlationWarning}</span>
                    </div>
                  )}

                  {/* News Warnings */}
                  {res.newsWarnings && res.newsWarnings.length > 0 && res.newsWarnings.map((w, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-start text-xs text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <span className="mr-1 mt-0.5">⚠️</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'Forex' && <EconomicCalendar />}
    </div>
  );
}
