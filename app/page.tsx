'use client';

import { useState } from 'react';
import { Feed } from '@/components/Feed';
import { ActionHub } from '@/components/ActionHub';
import { TradeBottomSheet } from '@/components/TradeBottomSheet';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Market } from '@/store/useMarketStore';
import { useUserStore } from '@/store/useUserStore';
import { motion } from 'motion/react';

export default function Home() {
  // Initialize WebSocket connection
  useWebSocket();
  
  const { balance } = useUserStore();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [tradeType, setTradeType] = useState<'YES' | 'NO'>('YES');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleTradeClick = (market: Market, type: 'YES' | 'NO') => {
    setSelectedMarket(market);
    setTradeType(type);
    setIsSheetOpen(true);
    // Vibrate if supported
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  return (
    <main className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent-blue/30">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center pt-safe">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-accent-blue rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(41,98,255,0.5)]">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight">Predix</h1>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-bg-surface px-4 py-2 rounded-full border border-white/10 flex items-center gap-2"
        >
          <span className="text-text-secondary text-sm">Balance</span>
          <span className="font-bold text-accent-yes">${balance.toFixed(2)}</span>
        </motion.div>
      </header>

      {/* Main Feed */}
      <Feed onTradeClick={handleTradeClick} />

      {/* Bottom Navigation */}
      <ActionHub />

      {/* Trade Modal */}
      <TradeBottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        market={selectedMarket}
        initialType={tradeType}
      />
    </main>
  );
}
