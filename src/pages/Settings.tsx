import { useSettingsStore } from '../lib/store/useAppStore';
import { getAllTrades, saveTrade } from '../lib/storage/db';
import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Wallet, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Settings() {
  const store = useSettingsStore();
  const [forexCap, setForexCap] = useState(store.forexCapital.toString());
  const [cryptoCap, setCryptoCap] = useState(store.cryptoCapital.toString());
  const [tdToken, setTdToken] = useState(store.twelveDataToken);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    store.setForexCapital(Number(forexCap) || 0);
    store.setCryptoCapital(Number(cryptoCap) || 0);
    store.setTwelveDataToken(tdToken);
    toast.success('Settings saved successfully!');
  };

  const handleExport = async () => {
    const trades = await getAllTrades();
    const data = {
      settings: {
        forexCapital: store.forexCapital,
        cryptoCapital: store.cryptoCapital,
        twelveDataToken: store.twelveDataToken
      },
      trades
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alphasift_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings) {
          store.setForexCapital(json.settings.forexCapital || 50000);
          store.setCryptoCapital(json.settings.cryptoCapital || 100000);
          store.setTwelveDataToken(json.settings.twelveDataToken || '');
          setForexCap(json.settings.forexCapital?.toString() || '50000');
          setCryptoCap(json.settings.cryptoCapital?.toString() || '100000');
          setTdToken(json.settings.twelveDataToken || '');
        }
        if (json.trades && Array.isArray(json.trades)) {
          for (const trade of json.trades) {
            await saveTrade(trade);
          }
        }
        toast.success('Data imported successfully!');
      } catch (err) {
        toast.error('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    localStorage.removeItem('api_cache');
    toast.success('Cache cleared!');
    setIsClearCacheModalOpen(false);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-24 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">System Settings</h2>
      
      <div className="bg-cardBg p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2 flex items-center">
          <Wallet size={16} className="mr-2" /> Capital Setup
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Forex Capital (THB)</label>
            <input 
              type="number" 
              value={forexCap} 
              onChange={(e) => setForexCap(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Crypto Capital (THB)</label>
            <input 
              type="number" 
              value={cryptoCap} 
              onChange={(e) => setCryptoCap(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-blue-500" 
            />
          </div>
        </div>
      </div>

      <div className="bg-cardBg p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2 flex items-center">
          <Key size={16} className="mr-2" /> API Configuration
        </h3>
        <div>
          <p className="text-[10px] text-slate-500 mt-2 mb-4">
            ✅ Crypto data is fetched via Binance (Public API - No Key needed).<br/>
          </p>
          <label className="text-xs text-slate-400 block mb-1">TwelveData API Key (Forex)</label>
          <input 
            type="password" 
            value={tdToken} 
            onChange={(e) => setTdToken(e.target.value)}
            placeholder="Paste TwelveData API Key..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-blue-500" 
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"
      >
        Save Settings
      </button>

      <div className="bg-cardBg p-4 rounded-xl border border-slate-700 shadow-md space-y-3">
        <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider border-b border-slate-700 pb-2">
          Data Management
        </h3>
        
        <button onClick={handleExport} className="w-full bg-slate-800 border border-slate-700 py-3 rounded-lg text-sm px-4 flex items-center hover:bg-slate-700 transition-colors">
          <Download size={16} className="text-blue-400 mr-3" />
          <span>Export Data (Backup)</span>
        </button>
        
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleImport} 
          className="hidden" 
        />
        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-800 border border-slate-700 py-3 rounded-lg text-sm px-4 flex items-center hover:bg-slate-700 transition-colors">
          <Upload size={16} className="text-success mr-3" />
          <span>Import Data</span>
        </button>

        <button onClick={() => setIsClearCacheModalOpen(true)} className="w-full bg-danger/10 border border-danger/30 text-danger py-3 rounded-lg text-sm px-4 flex items-center hover:bg-danger/20 transition-colors mt-4">
          <Trash2 size={16} className="mr-3" />
          <span>Force Clear Cache</span>
        </button>
      </div>

      <p className="text-center text-slate-600 text-[10px] pb-4 font-mono">Version 1.0.0 (PWA)</p>

      <ConfirmModal
        isOpen={isClearCacheModalOpen}
        title="Clear API Cache?"
        message="Are you sure you want to clear the local API cache? This will not delete your trades."
        confirmText="Clear Cache"
        type="warning"
        onConfirm={handleClearCache}
        onCancel={() => setIsClearCacheModalOpen(false)}
      />
    </div>
  );
}
