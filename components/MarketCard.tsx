'use client';

import { Market } from '@/store/useMarketStore';
import { motion } from 'motion/react';
import Image from 'next/image';

interface MarketCardProps {
  market: Market;
  onTradeClick: (market: Market, type: 'YES' | 'NO') => void;
}

export function MarketCard({ market, onTradeClick }: MarketCardProps) {
  const yesProb = Math.round(market.probability * 100);
  const noProb = 100 - yesProb;

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-surface rounded-3xl overflow-hidden mb-4 border border-white/5 shadow-lg"
    >
      {/* Image Header */}
      {market.image && (
        <div className="relative h-48 w-full">
          <Image 
            src={market.image} 
            alt={market.title}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-blue bg-accent-blue/10 px-2 py-1 rounded-full backdrop-blur-md">
              {market.category}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="text-xl font-semibold text-text-primary leading-tight mb-4">
          {market.title}
        </h2>

        <div className="flex items-center justify-between mb-6 text-sm text-text-secondary">
          <span>Vol: {formatVolume(market.volume)}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-yes animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => onTradeClick(market, 'YES')}
            className="flex-1 bg-accent-yes/10 hover:bg-accent-yes/20 active:bg-accent-yes/30 border border-accent-yes/20 rounded-2xl py-4 flex flex-col items-center justify-center transition-colors relative overflow-hidden"
          >
            <span className="text-accent-yes font-bold text-lg mb-1">YES</span>
            <span className="text-accent-yes/80 font-medium">{yesProb}%</span>
            {/* Progress bar background */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-accent-yes/30" 
              style={{ width: `${yesProb}%` }}
            />
          </button>
          
          <button 
            onClick={() => onTradeClick(market, 'NO')}
            className="flex-1 bg-accent-no/10 hover:bg-accent-no/20 active:bg-accent-no/30 border border-accent-no/20 rounded-2xl py-4 flex flex-col items-center justify-center transition-colors relative overflow-hidden"
          >
            <span className="text-accent-no font-bold text-lg mb-1">NO</span>
            <span className="text-accent-no/80 font-medium">{noProb}%</span>
            {/* Progress bar background */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-accent-no/30" 
              style={{ width: `${noProb}%` }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
