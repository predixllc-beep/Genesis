'use client';

import { useMarketStore, Market } from '@/store/useMarketStore';
import { MarketCard } from './MarketCard';
import { MarketCardSkeleton } from './MarketCardSkeleton';

interface FeedProps {
  onTradeClick: (market: Market, type: 'YES' | 'NO') => void;
}

export function Feed({ onTradeClick }: FeedProps) {
  const { markets } = useMarketStore();

  if (markets.length === 0) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
        {/* Render a few skeleton cards to simulate the feed loading */}
        {[1, 2, 3].map((i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {markets.map((market) => (
        <MarketCard 
          key={market.id} 
          market={market} 
          onTradeClick={onTradeClick} 
        />
      ))}
    </div>
  );
}
