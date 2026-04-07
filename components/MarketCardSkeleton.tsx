'use client';

export function MarketCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-3xl overflow-hidden mb-4 border border-white/5 shadow-lg animate-pulse">
      {/* Image Header Skeleton */}
      <div className="relative h-48 w-full bg-white/5">
        <div className="absolute bottom-4 left-4">
          <div className="h-6 w-24 bg-white/10 rounded-full" />
        </div>
      </div>

      <div className="p-5">
        {/* Title Skeleton */}
        <div className="h-6 bg-white/10 rounded-md w-3/4 mb-2" />
        <div className="h-6 bg-white/10 rounded-md w-1/2 mb-6" />

        {/* Info Row Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-white/10 rounded-md w-24" />
          <div className="h-4 bg-white/10 rounded-md w-16" />
        </div>

        {/* Trade Buttons Skeleton */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 flex flex-col items-center justify-center h-[88px]">
            <div className="h-5 bg-white/10 rounded-md w-12 mb-2" />
            <div className="h-4 bg-white/10 rounded-md w-8" />
          </div>
          
          <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 flex flex-col items-center justify-center h-[88px]">
            <div className="h-5 bg-white/10 rounded-md w-12 mb-2" />
            <div className="h-4 bg-white/10 rounded-md w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
