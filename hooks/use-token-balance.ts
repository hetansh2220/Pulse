'use client';

import { useQuery } from '@tanstack/react-query';
import { useSolanaWallet } from './use-solana-wallet';
import { getConnection } from '@/lib/pnp-adapter';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export interface MarketTokenBalances {
  yesBalance: number; // In tokens (human-readable)
  noBalance: number;
  yesFormatted: string;
  noFormatted: string;
}

export function useMarketTokenBalances(
  yesTokenMint: string | undefined,
  noTokenMint: string | undefined
) {
  const { address, isConnected } = useSolanaWallet();

  return useQuery<MarketTokenBalances>({
    queryKey: ['tokenBalances', address, yesTokenMint, noTokenMint],
    queryFn: async (): Promise<MarketTokenBalances> => {
      if (!address || !yesTokenMint || !noTokenMint) {
        return {
          yesBalance: 0,
          noBalance: 0,
          yesFormatted: '0.00',
          noFormatted: '0.00',
        };
      }

      const connection = getConnection();
      const walletPubkey = new PublicKey(address);

      let yesBalance = 0;
      let noBalance = 0;

      // Get YES token balance
      try {
        const yesATA = await getAssociatedTokenAddress(
          new PublicKey(yesTokenMint),
          walletPubkey
        );
        const yesAccount = await getAccount(connection, yesATA);
        yesBalance = Number(yesAccount.amount) / 1_000_000; // 6 decimals
      } catch {
        // Account doesn't exist or error - balance is 0
      }

      // Get NO token balance
      try {
        const noATA = await getAssociatedTokenAddress(
          new PublicKey(noTokenMint),
          walletPubkey
        );
        const noAccount = await getAccount(connection, noATA);
        noBalance = Number(noAccount.amount) / 1_000_000; // 6 decimals
      } catch {
        // Account doesn't exist or error - balance is 0
      }

      return {
        yesBalance,
        noBalance,
        yesFormatted: yesBalance.toFixed(2),
        noFormatted: noBalance.toFixed(2),
      };
    },
    enabled: isConnected && !!address && !!yesTokenMint && !!noTokenMint,
    staleTime: 10_000, // 10 seconds
    refetchInterval: 20_000, // 20 seconds
  });
}
