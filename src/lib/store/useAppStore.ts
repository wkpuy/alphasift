import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  forexCapital: number;
  cryptoCapital: number;
  oandaToken: string;
  twelveDataToken: string;
  setForexCapital: (val: number) => void;
  setCryptoCapital: (val: number) => void;
  setOandaToken: (val: string) => void;
  setTwelveDataToken: (token: string) => void;
  updateCapitalAfterTrade: (type: 'Forex' | 'Crypto', pnl: number) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      forexCapital: 50000,
      cryptoCapital: 100000,
      oandaToken: '',
      twelveDataToken: '',
      setForexCapital: (val) => set({ forexCapital: val }),
      setCryptoCapital: (val) => set({ cryptoCapital: val }),
      setOandaToken: (val) => set({ oandaToken: val }),
      setTwelveDataToken: (token) => set({ twelveDataToken: token }),
      updateCapitalAfterTrade: (type, pnl) => set((state) => ({
        forexCapital: type === 'Forex' ? state.forexCapital + pnl : state.forexCapital,
        cryptoCapital: type === 'Crypto' ? state.cryptoCapital + pnl : state.cryptoCapital,
      })),
      clearSettings: () => set({
        forexCapital: 50000,
        cryptoCapital: 100000,
        oandaToken: ''
      })
    }),
    {
      name: 'alphasift-settings',
    }
  )
);

// --- Scanner Cache Store (In-Memory, survives route changes) ---
interface ScannerState {
  lastMode: 'Forex' | 'Crypto';
  lastResults: any[];
  setLastMode: (mode: 'Forex' | 'Crypto') => void;
  setLastResults: (results: any[]) => void;
  clearScannerCache: () => void;
}

export const useScannerStore = create<ScannerState>()((set) => ({
  lastMode: 'Crypto',
  lastResults: [],
  setLastMode: (mode) => set({ lastMode: mode }),
  setLastResults: (results) => set({ lastResults: results }),
  clearScannerCache: () => set({ lastResults: [] })
}));
