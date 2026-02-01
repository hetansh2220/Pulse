'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Market } from '@/types/market';
import { useTradingMutation } from '@/hooks/use-trading';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { useUSDCBalance } from '@/hooks/use-balance';
import { estimateTokensReceived, calculatePriceImpact } from '@/lib/market-utils';
import { formatCurrency } from '@/lib/format';
import { Loader2, ChevronUp, ChevronDown, Wallet } from 'lucide-react';

interface TradingModalProps {
  market: Market;
  tokenType: 'yes' | 'no';
  isOpen: boolean;
  onClose: () => void;
}

export default function TradingModal({ market, tokenType, isOpen, onClose }: TradingModalProps) {
  const [amount, setAmount] = useState<string>('');
  const buyMutation = useTradingMutation();
  const { wallet, isConnected } = useSolanaWallet();
  const { data: balanceData } = useUSDCBalance();

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  const multiplier = tokenType === 'yes' ? market.yesMultiplier : market.noMultiplier;
  const price = tokenType === 'yes' ? market.currentYesPrice : market.currentNoPrice;

  // Calculate estimations
  const amountNum = parseFloat(amount) || 0;
  const estimatedTokens = amountNum > 0
    ? estimateTokensReceived(
        amountNum,
        tokenType,
        market.yesTokenSupply,
        market.noTokenSupply
      )
    : 0;

  const priceImpact = amountNum > 0
    ? calculatePriceImpact(
        amountNum,
        tokenType,
        market.yesTokenSupply,
        market.noTokenSupply
      )
    : 0;

  // Estimated returns if market resolves in favor
  const estimatedReturns = estimatedTokens > 0 ? estimatedTokens - amountNum : 0;

  const balance = balanceData?.balance ?? 0;
  const hasInsufficientBalance = amountNum > balance;
  const canTrade = isConnected && wallet && amountNum > 0 && !hasInsufficientBalance && !buyMutation.isPending;

  const handleTrade = () => {
    if (!canTrade || !wallet) return;

    buyMutation.mutate(
      {
        marketId: market.id,
        tokenType,
        amount: amountNum,
        creatorAddress: market.creator,
        version: market.version,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handlePercentage = (pct: number) => {
    const val = (balance * pct) / 100;
    setAmount(val.toFixed(2));
  };

  const incrementAmount = () => {
    const current = parseFloat(amount) || 0;
    setAmount((current + 1).toFixed(2));
  };

  const decrementAmount = () => {
    const current = parseFloat(amount) || 0;
    if (current > 0) {
      setAmount(Math.max(0, current - 1).toFixed(2));
    }
  };

  const isYes = tokenType === 'yes';
  const accentColor = isYes ? '#2ed573' : '#ff4757';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-[#0a0a0f] border-[#1e1e2e] p-6 max-w-md"
        showCloseButton={true}
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="mb-6">
          <DialogTitle className="text-xl font-bold text-white mb-1">
            Buy {isYes ? 'Yes' : 'No'} Tokens
          </DialogTitle>
          <p className="text-sm text-[#6b6b7b] line-clamp-2 mb-2">
            {market.question}
          </p>
          {multiplier && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="text-sm font-mono uppercase tracking-wide"
                style={{ color: accentColor }}
              >
                {multiplier.toFixed(2)}x Payout
              </span>
            </div>
          )}
        </div>

        {/* Not connected state */}
        {!isConnected && (
          <div className="text-center py-6">
            <Wallet className="size-12 mx-auto mb-4 text-[#6b6b7b]" />
            <h3 className="font-semibold mb-2 text-white">Connect Wallet to Trade</h3>
            <p className="text-sm text-[#6b6b7b]">
              Please login to start trading.
            </p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Input Section */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#6b6b7b] uppercase tracking-wide">Amount (USDC)</span>
                <span className="text-xs text-[#6b6b7b]">
                  Bal: {balance.toFixed(2)} USDC
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Amount Input */}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-3xl font-light text-white outline-none placeholder:text-[#3a3a4a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* Increment/Decrement */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={incrementAmount}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ChevronUp className="size-4 text-[#6b6b7b]" />
                  </button>
                  <button
                    onClick={decrementAmount}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ChevronDown className="size-4 text-[#6b6b7b]" />
                  </button>
                </div>

                {/* Token Badge */}
                <div className="flex items-center gap-2 bg-[#1e1e2e] px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-white">USDC</span>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {hasInsufficientBalance && (
                <p className="text-xs text-[#ff4757] mt-2">Insufficient balance</p>
              )}

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[10, 25, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercentage(pct)}
                    className="py-2 px-3 bg-[#1e1e2e] hover:bg-[#2a2a3a] border border-[#2a2a3a] rounded-lg text-sm text-white font-medium transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  onClick={() => handlePercentage(100)}
                  className="py-2 px-3 bg-[#1e1e2e] hover:bg-[#2a2a3a] border border-[#2a2a3a] rounded-lg text-sm text-white font-medium transition-colors"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b7b] uppercase tracking-wide">Current Price</span>
                <span className="text-sm font-medium text-white">
                  ${price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b7b] uppercase tracking-wide">You Receive</span>
                <span className="text-sm font-medium text-white">
                  {estimatedTokens.toFixed(2)} {isYes ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b7b] uppercase tracking-wide">Price Impact</span>
                <span className={`text-sm font-medium ${priceImpact > 5 ? 'text-[#ff4757]' : 'text-white'}`}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b7b] uppercase tracking-wide">Est. Returns</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: estimatedReturns > 0 ? accentColor : '#6b6b7b' }}
                >
                  {formatCurrency(estimatedReturns)}
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleTrade}
              disabled={!canTrade}
              className="w-full py-6 text-base font-semibold uppercase tracking-wider bg-[#1e1e2e] hover:bg-[#2a2a3a] text-[#6b6b7b] hover:text-white border border-[#2a2a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={canTrade ? { backgroundColor: accentColor, color: '#000', borderColor: accentColor } : undefined}
            >
              {buyMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Buy ${isYes ? 'Yes' : 'No'}`
              )}
            </Button>

            <p className="text-xs text-[#6b6b7b] text-center mt-4">
              Network: Mainnet | Prices may vary due to market activity
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
