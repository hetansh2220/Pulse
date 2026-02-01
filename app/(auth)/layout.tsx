'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-2 border-[#c8ff00]/30 border-t-[#c8ff00] rounded-full animate-spin" />
          <p className="text-[#6b6b7b] font-mono text-sm uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
