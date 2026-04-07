'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Market } from '@/store/useMarketStore';
import { useUserStore } from '@/store/useUserStore';
import { X } from 'lucide-react';

interface TradeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  initialType: 'YES' | 'NO';
}

export function TradeBottomSheet({ isOpen, onClose, market, initialType }: TradeBottomSheetProps) {
  const [amount, setAmount] = useState<number>(10);
  const [type, setType] = useState<'YES' | 'NO'>(initialType);
  const { userId, balance } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      // We use a small timeout to avoid the synchronous setState warning
      // and ensure it happens after the render cycle that opened it
      const timer = setTimeout(() => {
        setType(initialType);
        setAmount(10);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialType]);

  if (!market) return null;

  const currentProb = type === 'YES' ? market.probability : 1 - market.probability;
  const estimatedShares = amount / currentProb;
  const potentialReturn = estimatedShares * 1; // 1 share = $1 if correct
  const roi = ((potentialReturn - amount) / amount) * 100;

  const handleTrade = async () => {
    if (amount > balance) return;
    
    setIsSubmitting(true);
    // Vibrate if supported (simulating Expo Haptics)
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    try {
      // Call the future API route for placing orders
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          userId,
          side: type,
          amount,
          type: 'MARKET' // Default to market order for now
        })
      });
    } catch (e) {
      console.error('Failed to place order', e);
    }
    
    // Optimistic close after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  const amounts = [10, 50, 100, 500];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-bg-elevated rounded-t-[32px] z-50 overflow-hidden border-t border-white/10 pb-safe"
            style={{ touchAction: 'none' }} // Prevent scrolling while dragging
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pb-8 pt-2">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold text-text-primary pr-8 leading-tight">
                  {market.title}
                </h3>
                <button onClick={onClose} className="p-2 -mr-2 bg-white/5 rounded-full text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Type Selector */}
              <div className="flex bg-bg-surface rounded-2xl p-1 mb-6 border border-white/5">
                <button
                  onClick={() => setType('YES')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    type === 'YES' 
                      ? 'bg-accent-yes text-black shadow-lg' 
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  YES {(market.probability * 100).toFixed(0)}%
                </button>
                <button
                  onClick={() => setType('NO')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    type === 'NO' 
                      ? 'bg-accent-no text-black shadow-lg' 
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  NO {((1 - market.probability) * 100).toFixed(0)}%
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2 text-text-secondary">
                  <span>Amount</span>
                  <span>Balance: ${balance.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-text-secondary">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-bg-surface border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
                  />
                </div>
                
                {/* Quick Amounts */}
                <div className="flex gap-2 mt-3">
                  {amounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-text-secondary transition-colors"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-bg-surface rounded-2xl p-4 mb-6 border border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Avg Price</span>
                  <span className="font-medium text-white">${currentProb.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Est. Shares</span>
                  <span className="font-medium text-white">{estimatedShares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Potential Return</span>
                  <span className="font-medium text-accent-yes">${potentialReturn.toFixed(2)} (+{roi.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleTrade}
                disabled={amount <= 0 || amount > balance || isSubmitting}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  amount > balance
                    ? 'bg-white/10 text-text-secondary cursor-not-allowed'
                    : type === 'YES'
                      ? 'bg-accent-yes text-black hover:bg-accent-yes/90 active:scale-[0.98]'
                      : 'bg-accent-no text-black hover:bg-accent-no/90 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? 'Processing...' : amount > balance ? 'Insufficient Balance' : `Buy ${type}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
