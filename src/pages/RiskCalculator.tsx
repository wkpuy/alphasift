import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../lib/store/useAppStore';
import { saveTrade } from '../lib/storage/db';
import { ArrowLeft, BookOpen, Sliders, Calculator, AlertCircle } from 'lucide-react';

export default function RiskCalculator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, mode } = location.state || {};
  
  const [riskPct, setRiskPct] = useState(1.0);
  const cryptoCap = useSettingsStore(state => state.cryptoCapital);
  const forexCap = useSettingsStore(state => state.forexCapital);

  if (!result) return <div className="p-4 text-center mt-10">No data. Go back to scanner.</div>;

  const capital = mode === 'Crypto' ? cryptoCap : forexCap;
  const riskAmt = capital * (riskPct / 100);
  const distance = Math.abs(result.entryPrice - result.stopLoss);
  
  let positionSize = 0;
  if (distance > 0) {
     positionSize = riskAmt / (distance * 34); // Assuming USD pair, 34 THB/USD
  }

  const expectedProfit = mode === 'Forex' 
    ? riskAmt * 2 
    : riskAmt * 1.5; // Estimate
    
  const handleSave = async () => {
    await saveTrade({
      id: Date.now().toString(),
      coin: result.symbol,
      type: mode as 'Forex' | 'Crypto',
      entryPrice: result.entryPrice,
      takeProfit: typeof result.takeProfit === 'number' ? result.takeProfit : 0,
      stopLoss: result.stopLoss,
      riskPct,
      riskAmount: riskAmt,
      expectedProfit,
      positionSize,
      capitalAtTime: capital,
      status: 'pending',
      pnl: 0,
      timestamp: Date.now(),
      strategy: result.reasons.join(' | '),
      direction: result.signal as 'BUY' | 'SELL'
    });
    toast.success('Saved to Journal! Margin temporarily allocated.');
    navigate('/journal');
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <button onClick={() => navigate('/scanner')} className="text-blue-400 mb-2 text-sm flex items-center hover:text-blue-300">
        <ArrowLeft size={16} className="mr-2" /> Back to Scanner
      </button>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-center mb-4 shadow-sm">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Available {mode} Balance</p>
          <p className="font-mono font-bold text-lg text-white">฿{capital.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-cardBg border border-blue-500/50 rounded-xl overflow-hidden shadow-lg shadow-blue-900/20">
        <div className={result.signal === 'BUY' ? "bg-gradient-to-r from-success/80 to-success/60 p-4" : "bg-gradient-to-r from-danger/80 to-danger/60 p-4"}>
          <h2 className="text-xl font-bold text-white mb-1">{result.symbol}</h2>
          <p className="text-white/80 text-xs font-mono">{result.signal} SETUP • Risk Calculator</p>
        </div>
        
        <div className="p-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-sm shadow-inner">
            <div>
              <p className="text-slate-400 text-[10px] uppercase">Entry (Current)</p>
              <p className="font-mono font-bold text-white">{result.entryPrice.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase">Take Profit</p>
              <p className="font-mono text-success font-bold">
                {typeof result.takeProfit === 'number' ? result.takeProfit.toFixed(4) : result.takeProfit}
              </p>
            </div>
            <div className="col-span-2 border-t border-slate-700/50 pt-2 mt-1 flex justify-between items-baseline">
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Stop Loss</p>
                <p className="font-mono text-danger font-bold">{result.stopLoss.toFixed(4)}</p>
              </div>
              <p className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">SL Dist: {distance.toFixed(4)}</p>
            </div>
          </div>

          <div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200 mb-4 flex items-start">
              <AlertCircle size={16} className="text-blue-400 mr-2 shrink-0 mt-0.5" />
              <p>
                <strong>Pro Tip:</strong> To survive long-term and keep your maximum drawdown under 6%, professional traders recommend risking <strong>no more than 1.0% to 1.5%</strong> of your total capital per trade.
              </p>
            </div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-slate-300 flex items-center"><Sliders size={16} className="text-blue-400 mr-2"/>Risk Slider</label>
              <span className="text-blue-400 font-mono font-bold bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{riskPct.toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.1" 
              value={riskPct} 
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" 
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>0.1%</span>
              <span>1.0% (฿{(capital * 0.01).toFixed(0)})</span>
              <span>2.0%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl text-white opacity-[0.02]"><Calculator /></div>
            
            <div className="flex justify-between items-end border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">If Loss (-SL)</span>
                <span className="font-mono font-bold text-danger text-lg">-฿{riskAmt.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">If Win (+TP)</span>
                <span className="font-mono font-bold text-success text-lg">+฿{expectedProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            </div>
            
            <div className="pt-1 flex justify-between items-center">
              <span className="text-[10px] text-blue-400 uppercase tracking-wider block mb-1 font-bold">Position Size</span>
              <span className="font-mono font-bold text-white text-xl bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                {positionSize.toFixed(4)} <span className="text-xs text-slate-400 ml-1">Units</span>
              </span>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center"
          >
            <BookOpen size={18} className="mr-2" /> Log Trade & Deduct Margin
          </button>
        </div>
      </div>
    </div>
  );
}
