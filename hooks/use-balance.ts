'use client';

import { useQuery } from '@tanstack/react-query';
import { useSolanaWallet } from './use-solana-wallet';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { USDC_MINT } from '@/lib/constants';

export interface USDCBalance {
  balance: number; // In USDC (human-readable)
  formatted: string; // Formatted string with 2 decimals
}

async function fetchTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC URL not configured');
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mintAddress);

  try {
    // Get the associated token account address
    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

    // Get the token account info
    const tokenAccount = await getAccount(connection, ata);

    // Convert from base units (6 decimals for USDC) to human-readable
    return Number(tokenAccount.amount) / 1_000_000;
  } catch (error) {
    // If token account doesn't exist, balance is 0
    console.log('Token account not found or error:', error);
    return 0;
  }
}

export function useUSDCBalance() {
  const { address, isConnected } = useSolanaWallet();

  return useQuery<USDCBalance>({
    queryKey: ['balance', 'usdc', address, USDC_MINT],
    queryFn: async () => {
      if (!address) {
        return { balance: 0, formatted: '0.00' };
      }

      try {
        console.log('Fetching balance for:', address, 'USDC mint:', USDC_MINT);
        const balance = await fetchTokenBalance(address, USDC_MINT);
        console.log('Balance fetched:', balance);
        return {
          balance,
          formatted: balance.toFixed(2),
        };
      } catch (error) {
        console.error('Failed to fetch USDC balance:', error);
        return { balance: 0, formatted: '0.00' };
      }
    },
    enabled: isConnected && !!address,
    staleTime: 15_000, // 15 seconds
    refetchInterval: 30_000, // 30 seconds
  });
}
