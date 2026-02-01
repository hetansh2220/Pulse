'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSolanaWallet } from './use-solana-wallet';
import { createV2Market, createV3Market } from '@/lib/pnp-adapter';

export type MarketCategory = 'general' | 'twitter' | 'youtube' | 'coin';
export type MarketType = 'v2' | 'p2p';
export type P2PSide = 'yes' | 'no';

export interface CreateMarketParams {
  question: string;
  category: MarketCategory;
  marketType: MarketType;
  endTime: Date;
  initialLiquidity: number; // In USDC
  tweetUrl?: string;
  youtubeUrl?: string;
  protocolName?: string;
  tokenAddress?: string;
  side?: P2PSide;
  creatorSideCap?: number; // In USDC
}

export interface CreateMarketResult {
  success: boolean;
  signature: string;
  marketType: MarketType;
}

export function useCreateMarket() {
  const { wallet, isConnected } = useSolanaWallet();
  const queryClient = useQueryClient();

  return useMutation<CreateMarketResult, Error, CreateMarketParams>({
    mutationFn: async (params) => {
      if (!wallet) {
        throw new Error('Wallet not connected. Please connect your wallet to create a market.');
      }

      if (!isConnected) {
        throw new Error('Please login to create a market');
      }

      // Validate inputs
      if (params.question.length < 10 || params.question.length > 200) {
        throw new Error('Question must be between 10 and 200 characters');
      }

      if (params.endTime <= new Date()) {
        throw new Error('End time must be in the future');
      }

      if (params.initialLiquidity <= 0) {
        throw new Error('Liquidity must be greater than 0');
      }

      // Build question with category-specific metadata
      let fullQuestion = params.question;

      if (params.category === 'twitter' && params.tweetUrl) {
        fullQuestion = `${params.question} [Tweet: ${params.tweetUrl}]`;
      } else if (params.category === 'youtube' && params.youtubeUrl) {
        fullQuestion = `${params.question} [Video: ${params.youtubeUrl}]`;
      } else if (params.category === 'coin' && params.protocolName) {
        fullQuestion = `${params.question} [Protocol: ${params.protocolName}]`;
      }

      let result: { txSig: string; marketAddress: string };

      if (params.marketType === 'v2') {
        // Create V2 AMM market
        result = await createV2Market(wallet, {
          question: fullQuestion,
          initialLiquidity: params.initialLiquidity,
          endTime: params.endTime,
        });
      } else {
        // Create V3 P2P market
        if (!params.side) {
          throw new Error('Side is required for P2P markets');
        }

        result = await createV3Market(wallet, {
          question: fullQuestion,
          amount: params.initialLiquidity,
          side: params.side,
          creatorSideCap: params.creatorSideCap,
          endTime: params.endTime,
        });
      }

      return {
        success: true,
        signature: result.txSig,
        marketType: params.marketType,
      };
    },
    onSuccess: (data) => {
      toast.success('Market created successfully!', {
        description: `Transaction: ${data.signature.slice(0, 8)}...`,
      });

      // Invalidate markets query to refetch
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
    onError: (error) => {
      console.error('Market creation failed:', error);
      toast.error('Failed to create market', {
        description: error.message,
      });
    },
  });
}
