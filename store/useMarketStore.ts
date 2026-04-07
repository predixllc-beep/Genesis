import { create } from 'zustand';

export interface Market {
  id: string;
  title: string;
  category: string;
  probability: number;
  volume: number;
  resolved: boolean;
  resolution?: 'YES' | 'NO';
  image?: string;
}

interface MarketState {
  markets: Market[];
  setMarkets: (markets: Market[]) => void;
  updateMarket: (market: Market) => void;
  isConnected: boolean;
  setIsConnected: (status: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [],
  isConnected: false,
  setMarkets: (markets) => set({ markets }),
  updateMarket: (updatedMarket) => set((state) => ({
    markets: state.markets.map(m => m.id === updatedMarket.id ? updatedMarket : m)
  })),
  setIsConnected: (isConnected) => set({ isConnected })
}));
