'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

// Configure Solana wallet connectors (Phantom, Solflare, etc.)
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

// Devnet is now the primary RPC
const rpcUrlDevnet = process.env.NEXT_PUBLIC_RPC_URL!;
const rpcUrlMainnet = process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://api.mainnet-beta.solana.com';
// Convert https to wss for subscriptions
const wsUrlDevnet = rpcUrlDevnet.replace('https://', 'wss://');
const wsUrlMainnet = rpcUrlMainnet.replace('https://', 'wss://');

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create query client with default options
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
        config={{
          appearance: {
            walletList: ['phantom', 'solflare', 'backpack'],
          },
          loginMethods: ['email', 'wallet'],
          embeddedWallets: {
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
          solana: {
            rpcs: {
              'solana:mainnet': {
                rpc: createSolanaRpc(rpcUrlMainnet),
                rpcSubscriptions: createSolanaRpcSubscriptions(wsUrlMainnet)
              },
              'solana:devnet': {
                rpc: createSolanaRpc(rpcUrlDevnet),
                rpcSubscriptions: createSolanaRpcSubscriptions(wsUrlDevnet),
              },
            },
          },
        }}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </PrivyProvider>
    </QueryClientProvider>
  );
}
