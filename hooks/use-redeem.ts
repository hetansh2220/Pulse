'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSolanaWallet } from './use-solana-wallet';
import { redeemV2Position, redeemV3Position } from '@/lib/pnp-adapter';

export interface RedeemParams {
  marketAddress: string;
  marketCreatorAddress: string;
  yesTokenMint: string;
  noTokenMint: string;
  version: 1 | 2 | 3; // Market version from market data
}

export function useRedeemMutation() {
  const { wallet } = useSolanaWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedeemParams) => {
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      if (params.version === 1) {
        throw new Error('V1 markets are not supported for redemption');
      }

      let signature: string;

      if (params.version === 2) {
        signature = await redeemV2Position(
          wallet,
          params.marketAddress,
          params.marketCreatorAddress,
          params.yesTokenMint,
          params.noTokenMint
        );
      } else {
        // V3 only needs marketAddress
        signature = await redeemV3Position(wallet, params.marketAddress);
      }

      return { signature, marketVersion: params.version };
    },
    onSuccess: (data, variables) => {
      toast.success('Position redeemed successfully!', {
        description: `Transaction: ${data.signature.slice(0, 8)}...`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({
        queryKey: ['market', variables.marketAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances'],
      });
    },
    onError: (error: Error) => {
      toast.error('Redemption failed', {
        description: error.message,
      });
    },
  });
}
