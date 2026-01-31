'use client';

import { useWallets, useStandardWallets } from '@privy-io/react-auth/solana';
import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';
import { Transaction } from '@solana/web3.js';
import type { PNPWallet } from '@/lib/pnp-adapter';

export interface UseSolanaWalletReturn {
  wallet: PNPWallet | null;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export function useSolanaWallet(): UseSolanaWalletReturn {
  const { wallets, ready } = useWallets();
  const { wallets: standardWallets } = useStandardWallets();
  const { user } = usePrivy();

  const primaryWallet = useMemo(() => {
    if (!ready || wallets.length === 0) return null;

    // Check if user logged in with an external wallet
    const externalWalletAccount = user?.linkedAccounts?.find(
      (account) => account.type === 'wallet' && account.walletClientType !== 'privy'
    );

    if (externalWalletAccount && 'address' in externalWalletAccount) {
      // Find the wallet that matches the external wallet address
      const externalWallet = wallets.find(w => w.address === externalWalletAccount.address);
      if (externalWallet) return externalWallet;
    }

    // Fallback to first wallet (embedded)
    return wallets[0];
  }, [wallets, ready, user, standardWallets]);

  const pnpWallet: PNPWallet | null = useMemo(() => {
    if (!primaryWallet) return null;

    // Create an adapter that converts between Privy's signTransaction interface
    // and the pnp-adapter expected interface
    const adaptedSignTransaction = async (tx: Transaction): Promise<Transaction> => {
      // Serialize the transaction to Uint8Array
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      // Call Privy's signTransaction with just the transaction bytes
      const result = await primaryWallet.signTransaction({
        transaction: serialized,
      });

      // Deserialize the signed transaction back to a Transaction object
      const signedTx = Transaction.from(result.signedTransaction);
      return signedTx;
    };

    return {
      address: primaryWallet.address,
      signTransaction: adaptedSignTransaction,
    };
  }, [primaryWallet]);

  return {
    wallet: pnpWallet,
    address: primaryWallet?.address ?? null,
    isConnected: !!primaryWallet,
    isLoading: !ready,
  };
}
