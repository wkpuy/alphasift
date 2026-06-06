import { useEffect, useState, useRef } from 'react';
import { getAllTrades, type Trade, updateTrade } from '../lib/storage/db';
import { useSettingsStore } from '../lib/store/useAppStore';
import { CheckCircle, XCircle, Trash2, Clock, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchBinanceKlines } from '../lib/api/binance';
import { fetchTwelveDataKlines } from '../lib/api/twelvedata';
import { calculateRSI } from '../lib/scanner/indicators';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Journal() {
  const [mode, setMode] = useState<'Forex' | 'Crypto'>('Forex');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [exitIndicators, setExitIndicators] = useState<Record<string, { rsi2?: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [modalState, setModalState] = useState<{isOpen: boolean, type: 'win' | 'loss' | 'cancel', trade: Trade | null}>({
    isOpen: false,
    type: 'cancel',
    trade: null
  });

  const updateCapitalAfterTrade = useSettingsStore(state => state.updateCapitalAfterTrade);
  const tdToken = useSettingsStore(state => state.twelveDataToken);
  
  const tradesRef = useRef(trades);
  tradesRef.current = trades;

  useEffect(() => {
    initJournal();
    const interval = setInterval(pollCurrentPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const initJournal = async () => {
    setIsLoading(true);
    let data = await getAllTrades();
    let updated = false;

    // Process pending trades
    for (const t of data) {
      if (t.status === 'pending') {
        const ageHours = (Date.now() - t.timestamp) / (1000 * 60 * 60);
        if (ageHours > 24) {
          t.status = 'expired';
          await updateTrade(t);
          updated = true;
          continue;
        }

        const crossed = await checkPriceCrossed(t);
        if (crossed) {
          t.status = 'active';
          await updateTrade(t);
          updated = true;
        }
      }
    }

    if (updated) {
      data = await getAllTrades();
    }
    
    setTrades(data.sort((a,b) => b.timestamp - a.timestamp));
    await pollCurrentPrices(data);
    setIsLoading(false);
  };

  const checkPriceCrossed = async (t: Trade) => {
    try {
      if (t.type === 'Crypto') {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${t.coin}&interval=15m&startTime=${t.timestamp}`);
        const data = await res.json();
        for (const k of data) {
          const high = parseFloat(k[2]);
          const low = parseFloat(k[3]);
          
          if (t.direction === 'BUY') {
            if (low <= t.stopLoss) {
              t.status = 'loss';
              t.pnl = -t.riskAmount;
              await updateTrade(t);
              updateCapitalAfterTrade(t.type, t.pnl);
              return false; // Skip active, go straight to loss
            }
            if (low <= t.entryPrice) return true;
          }
          
          if (t.direction === 'SELL') {
            if (high >= t.stopLoss) {
              t.status = 'loss';
              t.pnl = -t.riskAmount;
              await updateTrade(t);
              updateCapitalAfterTrade(t.type, t.pnl);
              return false;
            }
            if (high >= t.entryPrice) return true;
          }
        }
      } else {
        if (!tdToken) return false;
        const klines = await fetchTwelveDataKlines(t.coin, '1h', 50, tdToken);
        for (const k of klines) {
          if (k.time >= t.timestamp) {
            if (t.direction === 'BUY') {
              if (k.low <= t.stopLoss) {
                t.status = 'loss';
                t.pnl = -t.riskAmount;
                await updateTrade(t);
                updateCapitalAfterTrade(t.type, t.pnl);
                return false;
              }
              if (k.low <= t.entryPrice) return true;
            }
            if (t.direction === 'SELL') {
              if (k.high >= t.stopLoss) {
                t.status = 'loss';
                t.pnl = -t.riskAmount;
                await updateTrade(t);
                updateCapitalAfterTrade(t.type, t.pnl);
                return false;
              }
              if (k.high >= t.entryPrice) return true;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error checking historical prices:', e);
    }
    return false;
  };

  const pollCurrentPrices = async (manualTrades?: Trade[]) => {
    const currentTrades = manualTrades || tradesRef.current;
    const activeTrades = currentTrades.filter(t => t.status === 'active' || t.status === 'pending');
    if (activeTrades.length === 0) return;

    const newPrices: Record<string, number> = {};
    const newExitIndicators: Record<string, { rsi2?: number }> = {};
    
    const promises = activeTrades.map(async (t) => {
      try {
        if (t.type === 'Crypto') {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${t.coin}`);
          const data = await res.json();
          newPrices[t.coin] = parseFloat(data.price);
          
          if (t.status === 'active') {
            const klines = await fetchBinanceKlines(t.coin, '1d', 30);
            const closes = klines.map(k => k.close);
            const rsi2 = calculateRSI(closes, 2);
            newExitIndicators[t.coin] = { rsi2: rsi2[rsi2.length - 1] };
          }
        } else {
          if (tdToken) {
            const res = await fetch(`https://api.twelvedata.com/price?symbol=${t.coin}&apikey=${tdToken}`);
            const data = await res.json();
            if (data.price) newPrices[t.coin] = parseFloat(data.price);
          }
        }
      } catch (e) {}
    });

    await Promise.all(promises);
    
    setPrices(prev => ({ ...prev, ...newPrices }));
    setExitIndicators(prev => ({ ...prev, ...newExitIndicators }));
  };

  const handleWin = (trade: Trade) => {
    setModalState({ isOpen: true, type: 'win', trade });
  };

  const handleLoss = (trade: Trade) => {
    setModalState({ isOpen: true, type: 'loss', trade });
  };

  const handleCancel = (trade: Trade) => {
    setModalState({ isOpen: true, type: 'cancel', trade });
  };

  const executeModalAction = async () => {
    if (!modalState.trade) return;
    const trade = modalState.trade;

    if (modalState.type === 'win') {
      const pnl = trade.expectedProfit || (trade.type === 'Forex' ? trade.riskAmount * 2 : trade.riskAmount * 1.5);
      const updated = { ...trade, status: 'win' as const, pnl };
      await updateTrade(updated);
      updateCapitalAfterTrade(trade.type, pnl);
      toast.success('Trade marked as WIN!');
    } 
    else if (modalState.type === 'loss') {
      const pnl = -trade.riskAmount;
      const updated = { ...trade, status: 'loss' as const, pnl };
      await updateTrade(updated);
      toast.error('Trade marked as LOSS.');
    }
    else if (modalState.type === 'cancel') {
      const updated = { ...trade, status: 'expired' as const, pnl: 0 };
      await updateTrade(updated);
      updateCapitalAfterTrade(trade.type, 0); 
      toast.success('Order Cancelled.');
    }
    
    setModalState({ isOpen: false, type: 'cancel', trade: null });
    initJournal();
  };

  const filteredTrades = trades.filter(t => t.type === mode);

  // Stats calculation based on filtered trades
  // (Variables removed as they are now displayed in Dashboard)

  return (
    <div className="h-full overflow-y-auto pb-24 bg-slate-900 text-white animate-fade-in">
      <div className="p-4 space-y-4">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
          <button 
            onClick={() => setMode('Forex')}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Forex' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Forex Journal
          </button>
          <button 
            onClick={() => setMode('Crypto')}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Crypto' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Crypto Journal
          </button>
        </div>

        <h2 className="text-lg font-bold flex items-center gap-2 mt-2"><Activity size={18} className="text-blue-400"/> Trade History</h2>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500">Syncing with market data...</div>
        ) : filteredTrades.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            No {mode} trades in journal yet.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrades.map(t => {
              const currentPrice = prices[t.coin];
              let floatingPnl = 0;
              if (currentPrice && t.status === 'active') {
                if (t.direction === 'BUY') floatingPnl = (currentPrice - t.entryPrice) * t.positionSize;
                else floatingPnl = (t.entryPrice - currentPrice) * t.positionSize;
                // Convert USD floating PnL back to THB (assumes 34 THB/USD used in RiskCalc)
                floatingPnl = floatingPnl * 34;
              }

              return (
                <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider", t.type === 'Crypto' ? 'bg-blue-600/20 text-blue-400' : 'bg-indigo-600/20 text-indigo-400')}>{t.type}</span>
                      <span className="font-bold text-base flex items-center gap-1">
                        {t.coin} 
                        {t.direction === 'BUY' ? <TrendingUp size={14} className="text-success"/> : <TrendingDown size={14} className="text-danger"/>}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div className={clsx(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border",
                      t.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      t.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse' :
                      t.status === 'win' ? 'bg-success/10 text-success border-success/20' :
                      t.status === 'loss' ? 'bg-danger/10 text-danger border-danger/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    )}>
                      {t.status === 'pending' && <Clock size={12}/>}
                      {t.status === 'active' && <Activity size={12}/>}
                      {t.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Trade Info */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                      <div>
                        <p className="text-slate-500 mb-0.5">Entry</p>
                        <p className="font-mono font-medium">{t.entryPrice.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Risk / Capital</p>
                        <p className="font-mono font-medium">{t.riskPct}% of {t.capitalAtTime?.toLocaleString(undefined, {maximumFractionDigits:0}) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Take Profit</p>
                        <p className="font-mono text-success font-medium">{t.takeProfit?.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Stop Loss</p>
                        <p className="font-mono text-danger font-medium">{t.stopLoss?.toFixed(4)}</p>
                      </div>
                    </div>

                    {/* Exit Conditions Alert */}
                    {t.type === 'Crypto' && t.status === 'active' && exitIndicators[t.coin]?.rsi2 !== undefined && (
                      <div className={clsx(
                        "mt-3 rounded-lg p-3 flex justify-between items-center text-xs border font-bold",
                        exitIndicators[t.coin]!.rsi2! > 70 
                          ? "bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
                          : "bg-slate-800/80 border-slate-700 text-slate-400"
                      )}>
                        <span>Current RSI(2): {exitIndicators[t.coin]!.rsi2!.toFixed(1)}</span>
                        {exitIndicators[t.coin]!.rsi2! > 70 ? (
                          <span className="flex items-center gap-1">🔥 TAKE PROFIT NOW 🔥</span>
                        ) : (
                          <span className="font-normal">Waiting for &gt; 70</span>
                        )}
                      </div>
                    )}

                    {/* Floating PnL or Final PnL */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex justify-between items-center mt-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {t.status === 'active' ? 'Floating PnL' : t.status === 'pending' ? 'Current Price vs Entry' : 'Final PnL'}
                        </p>
                        {(t.status === 'active' || t.status === 'pending') ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-sm">{currentPrice?.toFixed(4) || 'Syncing...'}</span>
                            {t.status === 'active' && currentPrice && (
                              <span className={clsx("font-mono text-sm font-bold", floatingPnl >= 0 ? 'text-success' : 'text-danger')}>
                                {floatingPnl >= 0 ? '+' : ''}{floatingPnl.toLocaleString(undefined, {maximumFractionDigits:0})} THB
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className={clsx("font-mono text-lg font-bold mt-0.5", t.pnl >= 0 ? 'text-success' : 'text-danger')}>
                            {t.pnl > 0 ? '+' : ''}{t.pnl.toLocaleString(undefined, {maximumFractionDigits:0})} THB
                          </p>
                        )}
                      </div>
                      
                      {(t.status === 'active' || t.status === 'pending') && (
                        <div className="text-right text-[10px] font-mono">
                          <p className="text-success">Win: +{t.expectedProfit?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                          <p className="text-danger">Loss: -{t.riskAmount?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {(t.status === 'active' || t.status === 'pending') && (
                      <div className="flex gap-2 pt-2 w-full">
                        {t.status === 'pending' ? (
                          <button onClick={() => handleCancel(t)} className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg text-xs font-bold transition-colors flex justify-center items-center">
                            <Trash2 size={14} className="mr-2" /> Cancel Order
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-2 w-full">
                              <button onClick={() => handleWin(t)} className="flex-1 bg-success/20 hover:bg-success/30 text-success border border-success/30 py-2.5 rounded-lg text-xs font-bold transition-colors flex justify-center items-center">
                                <CheckCircle size={14} className="mr-2" /> Win
                              </button>
                              <button onClick={() => handleLoss(t)} className="flex-1 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 py-2.5 rounded-lg text-xs font-bold transition-colors flex justify-center items-center">
                                <XCircle size={14} className="mr-2" /> Loss
                              </button>
                            </div>
                            <button onClick={() => handleCancel(t)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-lg text-[10px] font-bold transition-colors flex justify-center items-center border border-slate-700">
                              <Trash2 size={12} className="mr-1" /> Void / Did Not Enter (Refund Margin)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={
          modalState.type === 'win' ? 'Mark as Win?' :
          modalState.type === 'loss' ? 'Mark as Loss?' :
          'Cancel/Void Order?'
        }
        message={
          modalState.type === 'win' ? 'Are you sure you want to close this trade with a profit?' :
          modalState.type === 'loss' ? 'Are you sure you want to close this trade with a loss?' :
          'Are you sure you want to cancel this order? The margin will be refunded.'
        }
        confirmText={
          modalState.type === 'win' ? 'Yes, Win!' :
          modalState.type === 'loss' ? 'Yes, Loss' :
          'Void Order'
        }
        type={modalState.type === 'win' ? 'success' : modalState.type === 'loss' ? 'danger' : 'warning'}
        onConfirm={executeModalAction}
        onCancel={() => setModalState({ ...modalState, isOpen: false })}
      />
    </div>
  );
}
