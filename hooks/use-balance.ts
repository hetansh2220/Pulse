'use client';

import { useQuery } from '@tanstack/react-query';
import { useSolanaWallet } from './use-solana-wallet';
import { fetchUSDCBalance } from '@/lib/pnp-adapter';

export function useUSDCBalance() {
  const { address, isConnected } = useSolanaWallet();

  return useQuery({
    queryKey: ['usdc-balance', address],
    queryFn: async () => {
      if (!address) {
        return { balance: 0 };
      }

      const balance = await fetchUSDCBalance(address);
      return { balance };
    },
    enabled: isConnected && !!address,
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // 30 seconds
  });
}
