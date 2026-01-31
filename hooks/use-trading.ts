'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSolanaWallet } from './use-solana-wallet';
import {
  buyYesTokenV2,
  buyNoTokenV2,
  sellYesTokenV2,
  sellNoTokenV2,
  buyYesV3,
  buyNoV3,
} from '@/lib/pnp-adapter';

export interface BuyTokensParams {
  marketId: string;
  tokenType: 'yes' | 'no';
  amount: number; // In USDC
  creatorAddress: string;
  version: 1 | 2 | 3; // Market version from market data
}

export interface SellTokensParams {
  marketId: string;
  tokenType: 'yes' | 'no';
  amount: number; // In tokens
  creatorAddress: string;
  version: 1 | 2 | 3; // Market version from market data
}

export interface TradeResult {
  success: boolean;
  signature: string;
  marketVersion: 1 | 2 | 3;
}

export function useTradingMutation() {
  const { wallet } = useSolanaWallet();
  const queryClient = useQueryClient();

  return useMutation<TradeResult, Error, BuyTokensParams>({
    mutationFn: async (params) => {
      if (!wallet) {
        throw new Error('Wallet not connected. Please connect your wallet to trade.');
      }

      if (params.version === 1) {
        throw new Error('V1 markets are not supported for trading');
      }

      let signature: string;

      if (params.version === 2) {
        // V2 market - use mint functions
        if (params.tokenType === 'yes') {
          signature = await buyYesTokenV2(
            wallet,
            params.marketId,
            params.amount,
            params.creatorAddress
          );
        } else {
          signature = await buyNoTokenV2(
            wallet,
            params.marketId,
            params.amount,
            params.creatorAddress
          );
        }
      } else {
        // V3 market - use buy functions
        if (params.tokenType === 'yes') {
          signature = await buyYesV3(wallet, params.marketId, params.amount);
        } else {
          signature = await buyNoV3(wallet, params.marketId, params.amount);
        }
      }

      return {
        success: true,
        signature,
        marketVersion: params.version,
      };
    },
    onSuccess: (data, variables) => {
      toast.success('Trade executed successfully!', {
        description: `Bought ${variables.tokenType.toUpperCase()} tokens. Tx: ${data.signature.slice(0, 8)}...`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] });
    },
    onError: (error: Error) => {
      console.error('Trade error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error('Trade failed', {
        description: error.message,
      });
    },
  });
}

export function useSellMutation() {
  const { wallet } = useSolanaWallet();
  const queryClient = useQueryClient();

  return useMutation<TradeResult, Error, SellTokensParams>({
    mutationFn: async (params) => {
      if (!wallet) {
        throw new Error('Wallet not connected. Please connect your wallet to trade.');
      }

      if (params.version !== 2) {
        throw new Error('Selling is only supported for V2 markets');
      }

      let signature: string;

      if (params.tokenType === 'yes') {
        signature = await sellYesTokenV2(
          wallet,
          params.marketId,
          params.amount,
          params.creatorAddress
        );
      } else {
        signature = await sellNoTokenV2(
          wallet,
          params.marketId,
          params.amount,
          params.creatorAddress
        );
      }

      return {
        success: true,
        signature,
        marketVersion: params.version,
      };
    },
    onSuccess: (data, variables) => {
      toast.success('Sell executed successfully!', {
        description: `Sold ${variables.tokenType.toUpperCase()} tokens. Tx: ${data.signature.slice(0, 8)}...`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] });
    },
    onError: (error: Error) => {
      console.error('Sell error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error('Sell failed', {
        description: error.message,
      });
    },
  });
}
