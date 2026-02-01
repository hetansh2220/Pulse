'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useState} from 'react';
import {Toaster} from 'sonner';

export default function Providers({children}: {children: React.ReactNode}) {
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
          loginMethods: ['email'],
          embeddedWallets: {
            solana: {
              createOnLogin: 'users-without-wallets'
            }
          }
        }}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </PrivyProvider>
    </QueryClientProvider>
  );
}