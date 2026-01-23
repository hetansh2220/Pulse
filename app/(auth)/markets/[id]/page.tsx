'use client';

import { use, useState } from 'react';
import { useMarket } from '@/hooks/use-market';
import { useTradingMutation, useSellMutation } from '@/hooks/use-trading';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  ExternalLink,
  Activity
} from 'lucide-react';
import { estimateTokensReceived, estimateUsdcReceived, getBufferTimeRemaining } from '@/lib/market-utils';
import { formatCurrency, formatTokenPrice, formatProbability } from '@/lib/format';

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: market, isLoading, error } = useMarket(id);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [tokenType, setTokenType] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<string>('');
  const tradingMutation = useTradingMutation();
  const sellMutation = useSellMutation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-[#1a1a24] animate-pulse" />
        <div className="h-10 w-full bg-[#1a1a24] animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-[#12121a] border border-[#c8ff00]/10 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-[#12121a] border border-[#c8ff00]/10 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="size-12 mx-auto mb-4 text-[#ff4757]" />
        <p className="text-[#ff4757] mb-4 font-mono">Failed to load market</p>
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Markets
        </Link>
      </div>
    );
  }

  const bufferTimeRemaining = getBufferTimeRemaining(market.creationTime);
  const isInBuffer = bufferTimeRemaining > 0;
  const isResolved = market.resolved;
  const isEnded = new Date(market.endTime) <= new Date();
  const canTrade = !isInBuffer && !isResolved && !isEnded && amount && parseFloat(amount) > 0;
  const isPending = tradingMutation.isPending || sellMutation.isPending;

  // Estimation for buy
  const estimatedTokens =
    tradeAction === 'buy' && amount && parseFloat(amount) > 0
      ? estimateTokensReceived(
          parseFloat(amount),
          tokenType,
          market.yesTokenSupply,
          market.noTokenSupply
        )
      : 0;

  // Estimation for sell
  const estimatedUsdc =
    tradeAction === 'sell' && amount && parseFloat(amount) > 0
      ? estimateUsdcReceived(
          parseFloat(amount),
          tokenType,
          market.yesTokenSupply,
          market.noTokenSupply
        )
      : 0;

  const effectivePrice =
    tradeAction === 'buy' && estimatedTokens > 0
      ? parseFloat(amount) / estimatedTokens
      : tradeAction === 'sell' && parseFloat(amount) > 0
      ? estimatedUsdc / parseFloat(amount)
      : 0;

  const handleTrade = () => {
    if (!canTrade) return;
    const params = {
      marketId: market.id,
      tokenType,
      amount: parseFloat(amount),
    };
    if (tradeAction === 'buy') {
      tradingMutation.mutate(params);
    } else {
      sellMutation.mutate(params);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/markets"
        className="inline-flex items-center gap-2 text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Markets
      </Link>

      {/* Market Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`px-2 py-1 text-xs font-mono uppercase tracking-wider ${
            isResolved
              ? 'text-[#6b6b7b] border border-[#6b6b7b]/30'
              : 'text-[#c8ff00] border border-[#c8ff00]/30'
          }`}>
            {isResolved ? 'Resolved' : isEnded ? 'Ended' : isInBuffer ? 'Upcoming' : 'Active'}
          </span>
          <span className="px-2 py-1 text-xs font-mono text-[#00f5ff] border border-[#00f5ff]/30 capitalize">
            {market.category}
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{market.question}</h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart Section */}
          <div className="bg-[#12121a] border border-[#c8ff00]/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-[#c8ff00]" />
                <span className="font-mono text-sm text-[#6b6b7b]">Price Chart</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-[#2ed573]" />
                  YES {formatTokenPrice(market.currentYesPrice)} ({formatProbability(market.currentYesPrice)})
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-[#ff4757]" />
                  NO {formatTokenPrice(market.currentNoPrice)} ({formatProbability(market.currentNoPrice)})
                </span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 bg-[#0a0a0f]/50 rounded-lg overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0">
                {[0.25, 0.5, 0.75].map((y) => (
                  <div
                    key={y}
                    className="absolute w-full border-t border-[#2a2a3a]/50"
                    style={{ top: `${y * 100}%` }}
                  />
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-2 text-[10px] font-mono text-[#6b6b7b]">
                <span>$1.00</span>
                <span>$0.75</span>
                <span>$0.50</span>
                <span>$0.25</span>
                <span>$0.00</span>
              </div>

              {/* Bar Chart */}
              <div className="absolute left-10 right-4 top-4 bottom-8 flex items-end justify-around gap-1">
                {[...Array(24)].map((_, i) => {
                  // Generate price history simulation based on current price
                  const baseYes = market.currentYesPrice;
                  const variance = Math.sin((i / 24) * Math.PI * 3 + baseYes * 5) * 0.15;
                  const historicalYes = Math.max(0.05, Math.min(0.95, baseYes + variance - (24 - i) * 0.005));
                  const isRecent = i >= 20;

                  return (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 h-full justify-end">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${historicalYes * 100}%`,
                          backgroundColor: isRecent ? '#2ed573' : '#2ed573',
                          opacity: isRecent ? 1 : 0.3 + (i / 24) * 0.4
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Trend Line */}
              <svg className="absolute left-10 right-4 top-4 bottom-8" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#c8ff00" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path
                  d={`M0,${(1 - market.currentYesPrice + 0.1) * 100}% ${[...Array(12)].map((_, i) => {
                    const x = (i + 1) * (100 / 12);
                    const variance = Math.sin((i / 12) * Math.PI * 2 + market.currentYesPrice * 4) * 10;
                    const y = (1 - market.currentYesPrice) * 100 + variance - (i * 0.8);
                    return `L${x}%,${Math.max(5, Math.min(95, y))}%`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="url(#chart-gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Current Price Indicator */}
              <div
                className="absolute right-4 w-24 flex items-center gap-1"
                style={{ top: `${(1 - market.currentYesPrice) * 100}%`, transform: 'translateY(-50%)' }}
              >
                <div className="flex-1 border-t-2 border-dashed border-[#c8ff00]" />
                <span className="text-xs font-mono text-[#c8ff00] bg-[#12121a] px-1">
                  {formatTokenPrice(market.currentYesPrice)}
                </span>
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-2 px-10 text-[10px] font-mono text-[#6b6b7b]">
              <span>24h ago</span>
              <span>12h ago</span>
              <span>Now</span>
            </div>

            {/* Price Distribution Bar */}
            <div className="mt-6 pt-6 border-t border-[#2a2a3a]">
              <p className="text-xs font-mono text-[#6b6b7b] mb-3">Current Distribution</p>
              <div className="h-8 flex rounded-lg overflow-hidden">
                <div
                  className="h-full bg-[#2ed573] flex items-center justify-center transition-all duration-500"
                  style={{ width: `${market.currentYesPrice * 100}%` }}
                >
                  <span className="text-[#0a0a0f] font-bold text-sm">
                    YES {(market.currentYesPrice * 100).toFixed(0)}%
                  </span>
                </div>
                <div
                  className="h-full bg-[#ff4757] flex items-center justify-center transition-all duration-500"
                  style={{ width: `${market.currentNoPrice * 100}%` }}
                >
                  <span className="text-white font-bold text-sm">
                    NO {(market.currentNoPrice * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Prices */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#12121a] border border-[#2ed573]/20 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-[#6b6b7b]">YES Price</span>
                <TrendingUp className="size-4 text-[#2ed573]" />
              </div>
              <p className="text-4xl font-bold text-[#2ed573] tabular-nums">
                {formatTokenPrice(market.currentYesPrice)}
              </p>
              <p className="text-sm font-mono text-[#6b6b7b] mt-2">
                {formatProbability(market.currentYesPrice)} probability
              </p>
            </div>
            <div className="bg-[#12121a] border border-[#ff4757]/20 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-[#6b6b7b]">NO Price</span>
                <TrendingUp className="size-4 text-[#ff4757] rotate-180" />
              </div>
              <p className="text-4xl font-bold text-[#ff4757] tabular-nums">
                {formatTokenPrice(market.currentNoPrice)}
              </p>
              <p className="text-sm font-mono text-[#6b6b7b] mt-2">
                {formatProbability(market.currentNoPrice)} probability
              </p>
            </div>
          </div>

          {/* Market Info */}
          <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6">
            <h3 className="font-semibold mb-4">Market Details</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-[#6b6b7b]" />
                <div>
                  <p className="text-[#6b6b7b]">End Date</p>
                  <p className="font-mono">{new Date(market.endTime).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-[#6b6b7b]" />
                <div>
                  <p className="text-[#6b6b7b]">Created</p>
                  <p className="font-mono">{new Date(market.creationTime).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-[#6b6b7b] mt-4 leading-relaxed">
              Buy YES tokens if you believe this event will occur, or NO tokens if you believe it won't.
              When the market resolves, winning tokens can be redeemed for $1.00 USDC each.
            </p>
            {market.publicKey && (
              <a
                href={`https://solscan.io/account/${market.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-xs text-[#00f5ff] hover:underline"
              >
                View on Solscan <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Trading Panel */}
        <div className="space-y-6">
          <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-[#c8ff00]" />
              Trade
            </h3>

            {/* Buy/Sell Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setTradeAction('buy')}
                disabled={isInBuffer || isResolved || isEnded}
                className={`py-3 px-4 text-sm font-medium transition-all ${
                  tradeAction === 'buy'
                    ? 'bg-[#2ed573] text-[#0a0a0f]'
                    : 'bg-[#1a1a24] text-[#6b6b7b] hover:bg-[#1a1a24]/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeAction('sell')}
                disabled={isInBuffer || isResolved || isEnded}
                className={`py-3 px-4 text-sm font-medium transition-all ${
                  tradeAction === 'sell'
                    ? 'bg-[#ff4757] text-white'
                    : 'bg-[#1a1a24] text-[#6b6b7b] hover:bg-[#1a1a24]/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Sell
              </button>
            </div>

            {/* Trading Status Messages */}
            {isInBuffer && (
              <div className="flex items-start gap-3 p-4 bg-[#c8ff00]/5 border border-[#c8ff00]/20 mb-6">
                <AlertCircle className="size-5 text-[#c8ff00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Trading Not Available</p>
                  <p className="text-xs text-[#6b6b7b] mt-1">
                    Buffer period active. Trading starts in {Math.ceil(bufferTimeRemaining / 60000)} min.
                  </p>
                </div>
              </div>
            )}

            {isResolved && (
              <div className="flex items-start gap-3 p-4 bg-[#00f5ff]/5 border border-[#00f5ff]/20 mb-6">
                <AlertCircle className="size-5 text-[#00f5ff] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Market Resolved</p>
                  <p className="text-xs text-[#6b6b7b] mt-1">
                    {market.winningToken ? `Winning outcome: ${market.winningToken.toUpperCase()}` : 'Trading closed.'}
                  </p>
                </div>
              </div>
            )}

            {isEnded && !isResolved && (
              <div className="flex items-start gap-3 p-4 bg-[#6b6b7b]/10 border border-[#6b6b7b]/20 mb-6">
                <AlertCircle className="size-5 text-[#6b6b7b] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Market Ended</p>
                  <p className="text-xs text-[#6b6b7b] mt-1">Awaiting resolution.</p>
                </div>
              </div>
            )}

            {/* Token Selection */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setTokenType('yes')}
                disabled={isInBuffer || isResolved || isEnded}
                className={`p-4 text-center transition-all ${
                  tokenType === 'yes'
                    ? 'bg-[#2ed573]/20 border-2 border-[#2ed573] text-[#2ed573]'
                    : 'bg-[#1a1a24] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#2ed573]/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <p className="text-xs font-mono mb-1">YES</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatTokenPrice(market.currentYesPrice)}
                </p>
                <p className="text-xs font-mono mt-1 opacity-70">
                  {formatProbability(market.currentYesPrice)}
                </p>
              </button>
              <button
                onClick={() => setTokenType('no')}
                disabled={isInBuffer || isResolved || isEnded}
                className={`p-4 text-center transition-all ${
                  tokenType === 'no'
                    ? 'bg-[#ff4757]/20 border-2 border-[#ff4757] text-[#ff4757]'
                    : 'bg-[#1a1a24] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#ff4757]/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <p className="text-xs font-mono mb-1">NO</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatTokenPrice(market.currentNoPrice)}
                </p>
                <p className="text-xs font-mono mt-1 opacity-70">
                  {formatProbability(market.currentNoPrice)}
                </p>
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                {tradeAction === 'buy' ? 'Amount (USDC)' : 'Tokens to Sell'}
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isInBuffer || isResolved || isEnded}
                className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30 text-lg font-mono"
                min="0"
                step="0.01"
              />
            </div>

            {/* Estimation */}
            {((tradeAction === 'buy' && estimatedTokens > 0) || (tradeAction === 'sell' && estimatedUsdc > 0)) && (
              <div className="p-4 bg-[#1a1a24] border border-[#c8ff00]/10 mb-6 space-y-2 text-sm">
                {tradeAction === 'buy' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#6b6b7b] font-mono">Est. Tokens</span>
                      <span className="font-mono font-medium">{estimatedTokens.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b6b7b] font-mono">Eff. Price</span>
                      <span className="font-mono font-medium">{formatTokenPrice(effectivePrice)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#c8ff00]/10">
                      <span className="text-[#6b6b7b] font-mono">Potential Return</span>
                      <span className={`font-mono font-medium ${tokenType === 'yes' ? 'text-[#2ed573]' : 'text-[#ff4757]'}`}>
                        {formatCurrency(estimatedTokens - parseFloat(amount))}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#6b6b7b] font-mono">Est. USDC</span>
                      <span className="font-mono font-medium">{formatCurrency(estimatedUsdc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b6b7b] font-mono">Eff. Price</span>
                      <span className="font-mono font-medium">{formatTokenPrice(effectivePrice)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Trade Button */}
            <button
              onClick={handleTrade}
              disabled={!canTrade || isPending}
              className={`w-full py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                tradeAction === 'buy'
                  ? (tokenType === 'yes' ? 'bg-[#2ed573] text-[#0a0a0f]' : 'bg-[#ff4757] text-white')
                  : 'bg-[#ff4757] text-white'
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Executing...
                </span>
              ) : (
                `${tradeAction === 'buy' ? 'Buy' : 'Sell'} ${tokenType.toUpperCase()}`
              )}
            </button>

            <p className="text-xs text-center text-[#6b6b7b] mt-4 font-mono">
              Prices may vary. {tradeAction === 'buy' ? 'Tokens received' : 'USDC received'} may differ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
