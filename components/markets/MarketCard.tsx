'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { getMarketDisplayStatus, getStatusStyles } from '@/lib/market-utils';
import { formatTokenPrice } from '@/lib/format';
import type { Market } from '@/types/market';

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const displayStatus = getMarketDisplayStatus(market);
  const statusStyles = getStatusStyles(displayStatus);
  const isEnded = displayStatus === 'ended' || displayStatus === 'resolved';

  // Format volume
  const volumeNum = parseFloat(market.volume) / 1_000_000;
  const formattedVolume = volumeNum >= 1000
    ? `${(volumeNum / 1000).toFixed(2)}K`
    : volumeNum.toFixed(2);

  // Format end date
  const endDate = new Date(market.endTime);
  const formattedDate = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const handleClick = () => {
    console.log(`Navigating to ${JSON.stringify(market)}`);
    router.push(`/markets/${market.id}`);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-[#12121a] border border-[#1e1e2e] hover:border-[#c8ff00]/30 rounded-xl overflow-hidden cursor-pointer transition-all group ${isEnded ? 'opacity-75' : ''
        }`}
    >
      <div className="p-4">
        {/* Header: Status & Bookmark */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border rounded ${statusStyles.textClass} ${statusStyles.borderClass} ${statusStyles.bgClass}`}>
            {displayStatus}
          </span>
          <button
            onClick={handleBookmark}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bookmark
              className={`size-4 ${isBookmarked ? 'fill-[#c8ff00] text-[#c8ff00]' : 'text-[#6b6b7b] hover:text-white/80'}`}
            />
          </button>
        </div>

        {/* Question */}
        <h3 className="font-semibold text-[15px] leading-snug mb-4 line-clamp-2 group-hover:text-[#c8ff00] transition-colors min-h-[44px]">
          {market.question}
        </h3>

        {/* Price Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            className="flex-1 flex flex-col items-start px-3 py-2.5 bg-[#2ed573]/10 border border-[#2ed573]/30 rounded-lg hover:bg-[#2ed573]/20 hover:border-[#2ed573]/50 transition-all"
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-[#2ed573]">YES</span>
              <span className="text-base font-bold text-[#2ed573] tabular-nums">
                {formatTokenPrice(market.currentYesPrice)}
              </span>
            </div>
            {market.yesMultiplier && (
              <span className="text-[10px] text-[#2ed573]/70 font-mono mt-0.5">
                {market.yesMultiplier.toFixed(2)}x payout
              </span>
            )}
          </button>
          <button
            className="flex-1 flex flex-col items-start px-3 py-2.5 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg hover:bg-[#ff4757]/20 hover:border-[#ff4757]/50 transition-all"
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-[#ff4757]">NO</span>
              <span className="text-base font-bold text-[#ff4757] tabular-nums">
                {formatTokenPrice(market.currentNoPrice)}
              </span>
            </div>
            {market.noMultiplier && (
              <span className="text-[10px] text-[#ff4757]/70 font-mono mt-0.5">
                {market.noMultiplier.toFixed(2)}x payout
              </span>
            )}
          </button>
        </div>

        {/* Footer: Volume & Date */}
        <div className="flex items-center justify-between text-xs text-[#6b6b7b]">
          <span className="font-mono">
            Vol: {formattedVolume} USDC
          </span>
          <span className={`font-mono ${isEnded ? statusStyles.textClass : ''}`}>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
