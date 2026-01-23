'use client';

import { usePositions } from '@/hooks/use-positions';
import PositionList from '@/components/portfolio/PositionList';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Wallet, Activity } from 'lucide-react';
import { formatUsdc, formatPnL } from '@/lib/format';

export default function PortfolioPage() {
  const { data, isLoading } = usePositions();

  const totalPnL = data ? parseFloat(data.summary.totalPnL) : 0;
  const isProfit = totalPnL > 0;
  const isLoss = totalPnL < 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center">
            <Briefcase className="size-5 text-[#c8ff00]" />
          </div>
          <div>
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider">// Portfolio</p>
            <h1 className="text-2xl font-bold">Your Positions</h1>
          </div>
        </div>
        <p className="text-[#6b6b7b] mt-2">
          Track and manage your prediction market positions
        </p>
      </div>

      {/* Portfolio Summary Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[#12121a] border border-[#c8ff00]/10 p-6 animate-pulse"
            >
              <div className="h-4 w-20 bg-[#1a1a24] mb-4" />
              <div className="h-8 w-32 bg-[#1a1a24]" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {/* Total Value */}
          <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6 hover:border-[#c8ff00]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">
                Total Value
              </span>
              <div className="size-8 bg-[#c8ff00]/10 flex items-center justify-center">
                <DollarSign className="size-4 text-[#c8ff00]" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-[#e8e8e8]">
              {formatUsdc(data.summary.totalValue)}
            </div>
            <div className="text-xs font-mono text-[#6b6b7b] mt-2">
              Current portfolio worth
            </div>
          </div>

          {/* Total Invested */}
          <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6 hover:border-[#c8ff00]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">
                Total Invested
              </span>
              <div className="size-8 bg-[#1a1a24] flex items-center justify-center">
                <Wallet className="size-4 text-[#6b6b7b]" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-[#e8e8e8]">
              {formatUsdc(data.summary.totalInvested)}
            </div>
            <div className="text-xs font-mono text-[#6b6b7b] mt-2">
              Capital deployed
            </div>
          </div>

          {/* Total P&L */}
          <div className={`bg-[#12121a] border p-6 transition-colors ${
            isProfit ? 'border-[#2ed573]/30 hover:border-[#2ed573]/50' :
            isLoss ? 'border-[#ff4757]/30 hover:border-[#ff4757]/50' :
            'border-[#c8ff00]/10 hover:border-[#c8ff00]/30'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-mono text-[#6b6b7b] uppercase tracking-wider">
                Total P&L
              </span>
              <div className={`size-8 flex items-center justify-center ${
                isProfit ? 'bg-[#2ed573]/10' :
                isLoss ? 'bg-[#ff4757]/10' :
                'bg-[#1a1a24]'
              }`}>
                {isProfit ? (
                  <TrendingUp className="size-4 text-[#2ed573]" />
                ) : isLoss ? (
                  <TrendingDown className="size-4 text-[#ff4757]" />
                ) : (
                  <Activity className="size-4 text-[#6b6b7b]" />
                )}
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono ${
              isProfit ? 'text-[#2ed573]' :
              isLoss ? 'text-[#ff4757]' :
              'text-[#e8e8e8]'
            }`}>
              {formatPnL(totalPnL).value}
            </div>
            {data.summary.totalPnLPercent !== 0 && (
              <div className={`text-xs font-mono mt-2 ${
                isProfit ? 'text-[#2ed573]' :
                isLoss ? 'text-[#ff4757]' :
                'text-[#6b6b7b]'
              }`}>
                {isProfit ? '+' : ''}{data.summary.totalPnLPercent.toFixed(2)}% return
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Quick Stats Bar */}
      {data && data.positions.length > 0 && (
        <div className="flex items-center gap-6 py-4 px-6 bg-[#12121a] border border-[#c8ff00]/10 mb-8">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-[#c8ff00]" />
            <span className="text-xs font-mono text-[#6b6b7b]">
              {data.positions.filter(p => !p.marketResolved).length} Active
            </span>
          </div>
          <div className="w-px h-4 bg-[#c8ff00]/20" />
          <div className="flex items-center gap-2">
            <div className="size-2 bg-[#6b6b7b]" />
            <span className="text-xs font-mono text-[#6b6b7b]">
              {data.positions.filter(p => p.marketResolved).length} Settled
            </span>
          </div>
          <div className="w-px h-4 bg-[#c8ff00]/20" />
          <div className="flex items-center gap-2">
            <div className="size-2 bg-[#2ed573]" />
            <span className="text-xs font-mono text-[#6b6b7b]">
              {data.positions.filter(p => p.claimable).length} Claimable
            </span>
          </div>
        </div>
      )}

      {/* Positions List */}
      <PositionList />
    </div>
  );
}
