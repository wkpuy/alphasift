import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Trade {
  id: string;
  coin: string;
  type: 'Forex' | 'Crypto';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskPct: number;
  riskAmount: number;
  expectedProfit: number;
  positionSize: number;
  capitalAtTime: number;
  status: 'pending' | 'active' | 'win' | 'loss' | 'expired';
  pnl: number; // 0 if active/pending, positive/negative if closed
  timestamp: number;
  strategy: string;
  direction: 'BUY' | 'SELL';
}

interface AlphaSiftDB extends DBSchema {
  journal: {
    key: string;
    value: Trade;
    indexes: { 'by-status': string };
  };
  cache: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AlphaSiftDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AlphaSiftDB>('alphasift-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('journal')) {
          const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
          journalStore.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Helpers
export const saveTrade = async (trade: Trade) => {
  const db = await getDB();
  await db.put('journal', trade);
};

export const updateTrade = async (trade: Trade) => {
  const db = await getDB();
  await db.put('journal', trade);
};

export const getAllTrades = async (): Promise<Trade[]> => {
  const db = await getDB();
  return db.getAll('journal');
};

export const getActiveTrades = async (): Promise<Trade[]> => {
  const db = await getDB();
  return db.getAllFromIndex('journal', 'by-status', 'active');
};
