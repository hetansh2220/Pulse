'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  LayoutGrid,
  Briefcase,
  PlusCircle,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { formatAddress } from '@/lib/format';

const navigation = [
  { name: 'Explore', href: '/markets', icon: LayoutGrid, requiresAuth: false },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase, requiresAuth: true },
  { name: 'Create', href: '/create', icon: PlusCircle, requiresAuth: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );
  const walletAddress = solanaWallet && 'address' in solanaWallet ? solanaWallet.address : undefined;

  // Filter navigation based on auth status
  const visibleNavigation = navigation.filter(item => !item.requiresAuth || authenticated);

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

  return (
    <div className="min-h-screen bg-[#0a0a0f] noise">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#c8ff00]/10">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-[#6b6b7b] hover:text-[#c8ff00] transition-colors"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="size-9 bg-[#c8ff00] flex items-center justify-center group-hover:glow-lime transition-all">
                <TrendingUp className="size-5 text-[#0a0a0f]" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">PULSE</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                {walletAddress && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#c8ff00]/20 bg-[#c8ff00]/5">
                    <User className="size-4 text-[#c8ff00]" />
                    <span className="font-mono text-sm text-[#e8e8e8]">{formatAddress(walletAddress)}</span>
                  </div>
                )}
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#6b6b7b] hover:text-[#ff4757] transition-colors"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => login()}
                className="flex items-center gap-2 px-4 py-2 bg-[#c8ff00] text-[#0a0a0f] font-semibold text-sm hover:bg-[#d4ff33] transition-colors"
              >
                <LogIn className="size-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-[#0d0d12] border-r border-[#c8ff00]/10 transition-transform duration-200',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-[#c8ff00]/10 text-[#c8ff00] border-l-2 border-[#c8ff00]'
                    : 'text-[#6b6b7b] hover:text-[#e8e8e8] hover:bg-[#1a1a24] border-l-2 border-transparent'
                )}
              >
                <Icon className={cn('size-5', isActive && 'text-[#c8ff00]')} />
                {item.name}
                <ChevronRight className={cn(
                  'size-4 ml-auto opacity-0 -translate-x-2 transition-all',
                  'group-hover:opacity-100 group-hover:translate-x-0',
                  isActive && 'opacity-100 translate-x-0'
                )} />
              </Link>
            );
          })}

          {/* Show login prompt for auth-required items when not authenticated */}
          {!authenticated && (
            <div className="mt-4 p-4 border border-[#c8ff00]/10 bg-[#c8ff00]/5 rounded-lg">
              <p className="text-xs text-[#6b6b7b] mb-3">
                Login to access Portfolio and Create markets
              </p>
              <button
                onClick={() => login()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#c8ff00] text-[#0a0a0f] font-semibold text-sm hover:bg-[#d4ff33] transition-colors rounded"
              >
                <LogIn className="size-4" />
                Login
              </button>
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#c8ff00]/10">
          <div className="text-xs font-mono text-[#6b6b7b]">
            <p className="flex items-center gap-2">
              <span className="size-2 bg-[#2ed573] rounded-full animate-pulse" />
              Solana Mainnet
            </p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
