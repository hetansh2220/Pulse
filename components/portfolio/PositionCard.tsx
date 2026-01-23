import type { Position } from '@/types/position';
import { formatUsdc, formatPnL, truncate } from '@/lib/format';
import { TrendingUp, TrendingDown, ExternalLink, Loader2, Gift } from 'lucide-react';
import Link from 'next/link';

interface PositionCardProps {
  position: Position;
  onRedeem?: (marketId: string) => void;
  isRedeeming?: boolean;
}

export default function PositionCard({ position, onRedeem, isRedeeming }: PositionCardProps) {
  const pnl = formatPnL(parseFloat(position.unrealizedPnL));

  return (
    <div className="bg-[#12121a] border border-[#c8ff00]/10 hover:border-[#c8ff00]/30 transition-all">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/markets/${position.marketId}`}
            className="flex-1 group"
          >
            <h3 className="font-semibold line-clamp-2 text-[#e8e8e8] group-hover:text-[#c8ff00] transition-colors">
              {truncate(position.marketQuestion, 80)}
            </h3>
          </Link>
          <Link
            href={`/markets/${position.marketId}`}
            className="size-8 bg-[#1a1a24] flex items-center justify-center hover:bg-[#c8ff00]/10 transition-colors shrink-0"
          >
            <ExternalLink className="size-4 text-[#6b6b7b]" />
          </Link>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          {position.marketResolved ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono bg-[#6b6b7b]/10 text-[#6b6b7b] border border-[#6b6b7b]/20">
              Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20">
              <span className="size-1.5 bg-[#c8ff00] animate-pulse" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Token Balances */}
      <div className="grid grid-cols-2 gap-px bg-[#c8ff00]/5">
        <div className="bg-[#12121a] p-4">
          <div className="text-xs font-mono text-[#6b6b7b] mb-1">YES Tokens</div>
          <div className="text-lg font-bold font-mono text-[#2ed573]">
            {parseFloat(position.yesTokenBalance).toFixed(2)}
          </div>
        </div>
        <div className="bg-[#12121a] p-4">
          <div className="text-xs font-mono text-[#6b6b7b] mb-1">NO Tokens</div>
          <div className="text-lg font-bold font-mono text-[#ff4757]">
            {parseFloat(position.noTokenBalance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="p-5 pt-4 space-y-3 border-t border-[#c8ff00]/5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">Invested</span>
          <span className="font-mono text-[#e8e8e8]">{formatUsdc(position.totalInvested)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">Current Value</span>
          <span className="font-mono text-[#e8e8e8]">{formatUsdc(position.currentValue)}</span>
        </div>
        <div className="h-px bg-[#c8ff00]/10" />
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">Unrealized P&L</span>
          <div className="flex items-center gap-2">
            {pnl.isPositive && (
              <div className="size-6 bg-[#2ed573]/10 flex items-center justify-center">
                <TrendingUp className="size-3.5 text-[#2ed573]" />
              </div>
            )}
            {pnl.isNegative && (
              <div className="size-6 bg-[#ff4757]/10 flex items-center justify-center">
                <TrendingDown className="size-3.5 text-[#ff4757]" />
              </div>
            )}
            <span
              className={`font-mono font-bold ${
                pnl.isPositive ? 'text-[#2ed573]' :
                pnl.isNegative ? 'text-[#ff4757]' :
                'text-[#e8e8e8]'
              }`}
            >
              {pnl.value}
            </span>
          </div>
        </div>
      </div>

      {/* Redeem Action */}
      {position.claimable && onRedeem && (
        <div className="p-4 pt-0">
          <button
            onClick={() => onRedeem(position.marketId)}
            disabled={isRedeeming}
            className="w-full py-3 bg-[#2ed573] text-[#0a0a0f] font-semibold font-mono text-sm hover:glow-lime transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRedeeming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redeeming...
              </>
            ) : (
              <>
                <Gift className="size-4" />
                Redeem Winnings
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
