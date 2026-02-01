'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';

export type MarketCategory = 'general' | 'twitter' | 'youtube' | 'coin';
export type MarketType = 'v2' | 'p2p';
export type P2PSide = 'yes' | 'no';

interface CreateMarketParams {
  question: string;
  category: MarketCategory;
  marketType: MarketType;
  endTime: Date;
  initialLiquidity: number;
  tweetUrl?: string;
  youtubeUrl?: string;
  protocolName?: string;
  tokenAddress?: string;
  side?: P2PSide;
  creatorSideCap?: number;
}

interface CreateMarketResult {
  success: boolean;
  signature?: string;
  marketPublicKey?: string;
  yesTokenMint?: string;
  noTokenMint?: string;
  error?: string;
}

export function useCreateMarket() {
  const { authenticated, getAccessToken } = usePrivy();
  const queryClient = useQueryClient();

  return useMutation<CreateMarketResult, Error, CreateMarketParams>({
    mutationFn: async (params) => {
      if (!authenticated) {
        throw new Error('Please login to create a market');
      }

      // Get Privy access token for server authentication
      const accessToken = await getAccessToken();

      const response = await fetch('/api/create-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          question: params.question,
          category: params.category,
          marketType: params.marketType,
          endTime: params.endTime.toISOString(),
          initialLiquidity: params.initialLiquidity,
          tweetUrl: params.tweetUrl,
          youtubeUrl: params.youtubeUrl,
          protocolName: params.protocolName,
          tokenAddress: params.tokenAddress,
          side: params.side,
          creatorSideCap: params.creatorSideCap,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create market');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create market');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('Market created successfully!');
    },
    onError: (error) => {
      console.error('Market creation failed:', error);
      toast.error(error.message || 'Failed to create market');
    },
  });
}
