import { create } from 'zustand';

export interface Trade {
  id: string;
  marketId: string;
  userId: string;
  type: 'YES' | 'NO';
  amount: number;
  shares: number;
  price: number;
  timestamp: number;
}

interface UserState {
  userId: string;
  balance: number;
  trades: Trade[];
  setUserId: (id: string) => void;
  setBalance: (balance: number) => void;
  addTrade: (trade: Trade) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: 'user_' + Math.random().toString(36).substring(7), // Mock user ID
  balance: 10000, // Starting balance
  trades: [],
  setUserId: (userId) => set({ userId }),
  setBalance: (balance) => set({ balance }),
  addTrade: (trade) => set((state) => ({ 
    trades: [trade, ...state.trades],
    balance: state.balance - trade.amount
  }))
}));
