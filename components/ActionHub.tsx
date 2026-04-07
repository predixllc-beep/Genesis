'use client';

import { Home, Search, Activity, User } from 'lucide-react';
import { motion } from 'motion/react';

export function ActionHub() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-surface/80 backdrop-blur-xl border-t border-white/5 pb-safe z-30">
      <div className="flex justify-around items-center h-16 px-4">
        <button className="p-3 text-white flex flex-col items-center gap-1">
          <Home size={24} />
          <span className="text-[10px] font-medium">Markets</span>
        </button>
        
        <button className="p-3 text-text-secondary hover:text-white transition-colors flex flex-col items-center gap-1">
          <Search size={24} />
          <span className="text-[10px] font-medium">Discover</span>
        </button>

        {/* Center Action Button - could be used for quick trade or portfolio */}
        <div className="relative -top-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-accent-blue rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(41,98,255,0.4)] text-white"
          >
            <Activity size={28} />
          </motion.button>
        </div>

        <button className="p-3 text-text-secondary hover:text-white transition-colors flex flex-col items-center gap-1">
          <Activity size={24} />
          <span className="text-[10px] font-medium">Portfolio</span>
        </button>

        <button className="p-3 text-text-secondary hover:text-white transition-colors flex flex-col items-center gap-1">
          <User size={24} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
