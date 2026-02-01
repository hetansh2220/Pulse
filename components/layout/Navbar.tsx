'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { formatAddress } from '@/lib/format';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, authenticated, logout } = usePrivy();

  // Get Solana wallet address
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );
  const walletAddress = solanaWallet && 'address' in solanaWallet ? solanaWallet.address : undefined;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Menu (mobile) */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/markets" className="flex items-center gap-2 font-semibold text-lg">
              <span className="hidden sm:inline">PULSE</span>
            </Link>
          </div>

          {/* Right: User info + Logout */}
          <div className="flex items-center gap-3">
            {authenticated && walletAddress && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                <User className="size-4" />
                <span className="font-mono">{formatAddress(walletAddress)}</span>
              </div>
            )}

            {authenticated && (
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
