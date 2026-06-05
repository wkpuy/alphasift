import { useEffect, useState } from 'react';
import { getAllTrades, type Trade } from '../lib/storage/db';
import { useSettingsStore } from '../lib/store/useAppStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { TrendingUp, Target, Activity, Wallet } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [mode, setMode] = useState<'Forex' | 'Crypto'>('Forex');
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const forexCapital = useSettingsStore(state => state.forexCapital);
  const cryptoCapital = useSettingsStore(state => state.cryptoCapital);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    const data = await getAllTrades();
    setTrades(data);
  };

  // Filter and calculate
  const filteredTrades = trades.filter(t => t.type === mode);
  const closedTrades = filteredTrades.filter(t => t.status === 'win' || t.status === 'loss').sort((a, b) => a.timestamp - b.timestamp);
  
  const winTrades = closedTrades.filter(t => t.status === 'win');
  const lossTrades = closedTrades.filter(t => t.status === 'loss');
  
  const totalTrades = closedTrades.length;
  const winRate = totalTrades > 0 ? Math.round((winTrades.length / totalTrades) * 100) : 0;
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const currentCapital = mode === 'Forex' ? forexCapital : cryptoCapital;

  // Prepare data for Line Chart (Cumulative PnL)
  let cumulative = 0;
  const pnlData = closedTrades.map(t => {
    cumulative += t.pnl;
    return {
      name: new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      pnl: cumulative
    };
  });
  
  // Add initial point
  if (pnlData.length > 0) {
    pnlData.unshift({ name: 'Start', pnl: 0 });
  }

  // Prepare data for Pie Chart
  const pieData = [
    { name: 'Wins', value: winTrades.length, color: '#10b981' }, // success green
    { name: 'Losses', value: lossTrades.length, color: '#ef4444' } // danger red
  ];

  return (
    <div className="h-full overflow-y-auto pb-24 bg-slate-900 text-white animate-fade-in">
      <div className="p-4 space-y-6">
        
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
          <Activity size={24} className="text-blue-500" /> Dashboard
        </h1>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
          <button 
            onClick={() => setMode('Forex')}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Forex' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Forex Stats
          </button>
          <button 
            onClick={() => setMode('Crypto')}
            className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", mode === 'Crypto' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
          >
            Crypto Stats
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Wallet size={14} className="mr-1"/> Balance
            </div>
            <div className="text-xl font-black font-mono">
              ฿{currentCapital.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp size={14} className="mr-1"/> Total PnL
            </div>
            <div className={clsx("text-xl font-black font-mono", totalPnl >= 0 ? "text-success" : "text-danger")}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Target size={14} className="mr-1"/> Win Rate
            </div>
            <div className="text-xl font-black">
              {winRate}%
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Activity size={14} className="mr-1"/> Closed Trades
            </div>
            <div className="text-xl font-black">
              {totalTrades}
            </div>
          </div>
        </div>

        {totalTrades === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center text-slate-400 mt-6">
            No closed trades yet to generate charts.
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* PnL Growth Chart */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">PnL Growth</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pnlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `฿${val}`} width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line type="monotone" dataKey="pnl" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win/Loss Pie Chart */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider w-full text-left">Win/Loss Ratio</h3>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black">{winRate}%</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Win Rate</span>
                </div>
              </div>
              <div className="flex gap-6 mt-2 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div> Wins: {winTrades.length}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger"></div> Losses: {lossTrades.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
