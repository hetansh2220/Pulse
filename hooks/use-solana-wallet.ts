'use client';

import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { Transaction } from '@solana/web3.js';

export interface SolanaWallet {
  address: string;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

export function useSolanaWallet() {
  const { authenticated, ready, user } = usePrivy();

  const wallet = useMemo(() => {
    if (!authenticated || !user) {
      return null;
    }

    // Find the Privy-created Solana wallet from linked accounts
    const solanaWallet = user.linkedAccounts?.find(
      (account) => account.type === 'wallet' && account.walletClientType === 'privy'
    );

    if (!solanaWallet || !('address' in solanaWallet)) {
      return null;
    }

    return {
      address: solanaWallet.address as string,
      // Note: For actual signing, the trading API handles this server-side
      signTransaction: async (tx: Transaction): Promise<Transaction> => {
        // Client-side signing is not needed since trading goes through API
        throw new Error('Client-side signing not implemented - use API routes');
      },
    } as SolanaWallet;
  }, [authenticated, user]);

  return {
    wallet,
    isConnected: authenticated && !!wallet,
    isReady: ready,
    address: wallet?.address,
  };
}
