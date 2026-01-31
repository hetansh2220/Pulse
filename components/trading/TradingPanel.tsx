'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Market } from '@/types/market';
import { useTradingMutation, useSellMutation } from '@/hooks/use-trading';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { useUSDCBalance } from '@/hooks/use-balance';
import { useMarketTokenBalances } from '@/hooks/use-token-balance';
import { estimateTokensReceived, estimateUsdcReceived, getBufferTimeRemaining } from '@/lib/market-utils';
import { formatTokenPrice, formatProbability, formatCurrency } from '@/lib/format';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface TradingPanelProps {
  market: Market;
}

type TradeAction = 'buy' | 'sell';

export default function TradingPanel({ market }: TradingPanelProps) {
  const [tradeAction, setTradeAction] = useState<TradeAction>('buy');
  const [tokenType, setTokenType] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<string>('');

  // Wallet and balance hooks
  const { wallet, isConnected, isLoading: walletLoading } = useSolanaWallet();
  const { data: usdcBalance } = useUSDCBalance();
  const { data: tokenBalances } = useMarketTokenBalances(
    market.yesTokenMint,
    market.noTokenMint
  );

  const buyMutation = useTradingMutation();
  const sellMutation = useSellMutation();

  const bufferTimeRemaining = getBufferTimeRemaining(market.creationTime);
  const isInBuffer = bufferTimeRemaining > 0;
  const isResolved = market.resolved;
  const isEnded = new Date(market.endTime) <= new Date();

  // Calculate estimations based on trade action
  const estimatedTokens =
    tradeAction === 'buy' && amount && parseFloat(amount) > 0
      ? estimateTokensReceived(
          parseFloat(amount),
          tokenType,
          market.yesTokenSupply,
          market.noTokenSupply
        )
      : 0;

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

  // Check if user has sufficient balance
  const currentBalance = tradeAction === 'buy'
    ? usdcBalance?.balance ?? 0
    : tokenType === 'yes'
    ? tokenBalances?.yesBalance ?? 0
    : tokenBalances?.noBalance ?? 0;

  const hasInsufficientBalance = amount && parseFloat(amount) > currentBalance;

  const canTrade =
    isConnected &&
    wallet &&
    !isInBuffer &&
    !isResolved &&
    !isEnded &&
    amount &&
    parseFloat(amount) > 0 &&
    !hasInsufficientBalance;

  const isPending = buyMutation.isPending || sellMutation.isPending;

  const handleTrade = () => {
    if (!canTrade || !wallet) return;

    const params = {
      marketId: market.id,
      tokenType,
      amount: parseFloat(amount),
      creatorAddress: market.creator,
      version: market.version,
    };

    if (tradeAction === 'buy') {
      buyMutation.mutate(params);
    } else {
      sellMutation.mutate(params);
    }
  };

  const handleMaxClick = () => {
    setAmount(currentBalance.toFixed(2));
  };

  // Show loading state for wallet
  if (walletLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  // Show wallet connection prompt
  if (!isConnected || !wallet) {
    return (
      <Card className="p-6">
        <div className="text-center py-6">
          <Wallet className="size-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Connect Wallet to Trade</h3>
          <p className="text-sm text-muted-foreground">
            Please login to start trading on this market.
          </p>
        </div>
      </Card>
    );
  }

  // Show buffer period warning
  if (isInBuffer) {
    const minutes = Math.ceil(bufferTimeRemaining / (60 * 1000));
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Trading Not Yet Available</h3>
            <p className="text-sm text-muted-foreground">
              This market is in a 15-minute buffer period after creation. Trading will be available
              in approximately {minutes} {minutes === 1 ? 'minute' : 'minutes'}.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show resolved message
  if (isResolved) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Market Resolved</h3>
            <p className="text-sm text-muted-foreground">
              This market has been resolved. Trading is no longer available.
              {market.winningToken && ` Winning outcome: ${market.winningToken.toUpperCase()}`}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show ended message
  if (isEnded) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Market Ended</h3>
            <p className="text-sm text-muted-foreground">
              This market has ended. Waiting for resolution.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Trade</h3>

      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => {
            setTradeAction('buy');
            setAmount('');
          }}
          className={`py-3 px-4 text-sm font-medium rounded-lg transition-all ${
            tradeAction === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => {
            setTradeAction('sell');
            setAmount('');
          }}
          className={`py-3 px-4 text-sm font-medium rounded-lg transition-all ${
            tradeAction === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Token Selection */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-muted-foreground">Select Outcome</Label>
        <div className="grid grid-cols-2 gap-3">
          {/* YES Token */}
          <button
            onClick={() => {
              setTokenType('yes');
              setAmount('');
            }}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              tokenType === 'yes'
                ? 'border-green-500 bg-green-500/10'
                : 'border-border hover:border-green-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-green-500">YES</span>
              <TrendingUp className="size-4 text-green-500" />
            </div>
            <div className="text-xl font-bold">
              {formatTokenPrice(market.currentYesPrice)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatProbability(market.currentYesPrice)}
            </div>
          </button>

          {/* NO Token */}
          <button
            onClick={() => {
              setTokenType('no');
              setAmount('');
            }}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              tokenType === 'no'
                ? 'border-red-500 bg-red-500/10'
                : 'border-border hover:border-red-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-red-500">NO</span>
              <TrendingDown className="size-4 text-red-500" />
            </div>
            <div className="text-xl font-bold">
              {formatTokenPrice(market.currentNoPrice)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatProbability(market.currentNoPrice)}
            </div>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center">
          <Label htmlFor="amount">
            {tradeAction === 'buy' ? 'Amount (USDC)' : 'Tokens to Sell'}
          </Label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Balance: {tradeAction === 'buy'
                ? `${usdcBalance?.formatted ?? '0.00'} USDC`
                : tokenType === 'yes'
                ? `${tokenBalances?.yesFormatted ?? '0.00'} YES`
                : `${tokenBalances?.noFormatted ?? '0.00'} NO`
              }
            </span>
            <button
              onClick={handleMaxClick}
              className="text-primary hover:underline font-medium"
            >
              Max
            </button>
          </div>
        </div>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          className={hasInsufficientBalance ? 'border-red-500' : ''}
        />
        {hasInsufficientBalance && (
          <p className="text-xs text-red-500">Insufficient balance</p>
        )}
      </div>

      {/* Estimation */}
      {((tradeAction === 'buy' && estimatedTokens > 0) ||
        (tradeAction === 'sell' && estimatedUsdc > 0)) && (
        <div className="p-4 rounded-lg bg-secondary/50 space-y-3 text-sm mb-6">
          {tradeAction === 'buy' ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Tokens</span>
                <span className="font-medium">{estimatedTokens.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eff. Price</span>
                <span className="font-medium">{formatTokenPrice(effectivePrice)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Potential Return</span>
                <span className={`font-medium ${tokenType === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(estimatedTokens - parseFloat(amount))}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. USDC</span>
                <span className="font-medium">{formatCurrency(estimatedUsdc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eff. Price</span>
                <span className="font-medium">{formatTokenPrice(effectivePrice)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trade Button */}
      <Button
        className="w-full"
        onClick={handleTrade}
        disabled={!canTrade || isPending}
        variant={tradeAction === 'buy'
          ? (tokenType === 'yes' ? 'default' : 'destructive')
          : 'destructive'
        }
        style={tradeAction === 'buy' && tokenType === 'yes' ? { backgroundColor: '#16a34a' } : undefined}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Executing...
          </>
        ) : (
          `${tradeAction === 'buy' ? 'Buy' : 'Sell'} ${tokenType.toUpperCase()}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Prices may change due to market activity. Actual {tradeAction === 'buy' ? 'tokens received' : 'USDC received'} may vary.
      </p>
    </Card>
  );
}
