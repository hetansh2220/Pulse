'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Briefcase, PlusCircle, Copy, Check, Send, Download, Key, Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth/solana';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { useUSDCBalance } from '@/hooks/use-balance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const navigation = [
  { name: 'Markets', href: '/markets', icon: LayoutGrid },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Create Market', href: '/create', icon: PlusCircle },
];

type TabType = 'deposit' | 'withdraw' | 'export';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { wallets } = useWallets();
  const { exportWallet, authenticated } = usePrivy();
  const { address } = useSolanaWallet();
  const { data: usdcBalance } = useUSDCBalance();

  const primaryWallet = wallets[0];
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const explorerUrl = address
    ? network === 'mainnet-beta'
      ? `https://explorer.solana.com/address/${address}`
      : `https://explorer.solana.com/address/${address}?cluster=devnet`
    : '';

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    if (!primaryWallet || !withdrawAddress || !withdrawAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsWithdrawing(true);

      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(withdrawAddress);
      } catch {
        toast.error('Invalid recipient address');
        setIsWithdrawing(false);
        return;
      }

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
      const connection = new Connection(rpcUrl, 'confirmed');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(primaryWallet.address),
          toPubkey: recipientPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(primaryWallet.address);

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const result = await primaryWallet.signTransaction({
        transaction: serialized,
      });

      const signature = await connection.sendRawTransaction(result.signedTransaction);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Withdrawal successful!', {
        description: `Sent ${amount} SOL. Tx: ${signature.slice(0, 8)}...`,
      });

      setWithdrawAddress('');
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleExportKey = async () => {
    try {
      setIsExporting(true);
      await exportWallet();
      toast.success('Private key exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export private key');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-200 md:sticky md:translate-x-0 flex flex-col overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 flex-shrink-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="size-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Wallet Section */}
      
          <div className="mt-auto border-t border-[#1e1e2e] bg-[#0a0a0f] flex-shrink-0 overflow-y-auto">
            {/* Wallet Header */}
            <div className="p-3 border-b border-[#1e1e2e]">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Wallet className="size-4 text-[#c8ff00]" />
                Wallet
              </div>
            </div>

            {/* Loading State */}
            {!address && (
              <div className="p-4 text-center">
                <Loader2 className="size-6 animate-spin mx-auto text-[#c8ff00] mb-2" />
                <p className="text-xs text-[#6b6b7b]">Loading wallet...</p>
              </div>
            )}

            {/* Wallet Content */}
            {address && (
              <>
                {/* Tabs */}
                <div className="grid grid-cols-3 border-b border-[#1e1e2e]">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className={`py-2 text-xs font-medium transition-colors ${
                      activeTab === 'deposit'
                        ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                        : 'text-[#6b6b7b] hover:text-white'
                    }`}
                  >
                    <ArrowDownToLine className="size-3 mx-auto mb-0.5" />
                    Deposit
                  </button>
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`py-2 text-xs font-medium transition-colors ${
                      activeTab === 'withdraw'
                        ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                        : 'text-[#6b6b7b] hover:text-white'
                    }`}
                  >
                    <ArrowUpFromLine className="size-3 mx-auto mb-0.5" />
                    Withdraw
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    className={`py-2 text-xs font-medium transition-colors ${
                      activeTab === 'export'
                        ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                        : 'text-[#6b6b7b] hover:text-white'
                    }`}
                  >
                    <Key className="size-3 mx-auto mb-0.5" />
                    Export
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-3 max-h-64 overflow-y-auto">
                  {/* Deposit Tab */}
                  {activeTab === 'deposit' && (
                    <div className="space-y-3">
                      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-3">
                        <p className="text-[10px] text-[#6b6b7b] uppercase tracking-wide mb-1">
                          Your Address
                        </p>
                        <p className="font-mono text-[10px] text-white break-all mb-2">
                          {address}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            onClick={handleCopyAddress}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs bg-[#1e1e2e] border-[#2a2a3a] hover:bg-[#2a2a3a]"
                          >
                            {copied ? (
                              <Check className="size-3 text-[#2ed573]" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => window.open(explorerUrl, '_blank')}
                            variant="outline"
                            size="sm"
                            className="h-7 bg-[#1e1e2e] border-[#2a2a3a] hover:bg-[#2a2a3a]"
                          >
                            <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-2 bg-[#12121a] border border-[#1e1e2e] rounded-lg">
                        <p className="text-[10px] text-[#6b6b7b]">USDC Balance</p>
                        <p className="text-sm font-bold text-white">
                          {usdcBalance?.formatted ?? '0.00'} USDC
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Withdraw Tab */}
                  {activeTab === 'withdraw' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-[#6b6b7b] uppercase tracking-wide mb-1">
                          Recipient
                        </label>
                        <Input
                          value={withdrawAddress}
                          onChange={(e) => setWithdrawAddress(e.target.value)}
                          placeholder="Solana address..."
                          className="h-8 text-xs bg-[#12121a] border-[#1e1e2e] focus:border-[#c8ff00]/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#6b6b7b] uppercase tracking-wide mb-1">
                          Amount (SOL)
                        </label>
                        <Input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.001"
                          className="h-8 text-xs bg-[#12121a] border-[#1e1e2e] focus:border-[#c8ff00]/50"
                        />
                      </div>

                      <Button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !withdrawAddress || !withdrawAmount}
                        size="sm"
                        className="w-full h-8 text-xs bg-[#c8ff00] text-black hover:bg-[#a8df00] disabled:opacity-50"
                      >
                        {isWithdrawing ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="size-3 mr-1" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Export Tab */}
                  {activeTab === 'export' && (
                    <div className="space-y-2 text-center">
                      <div className="p-2 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg">
                        <Key className="size-5 mx-auto mb-1 text-[#ff4757]" />
                        <p className="text-[10px] text-[#6b6b7b]">
                          Never share your private key
                        </p>
                      </div>

                      <Button
                        onClick={handleExportKey}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-[#ff4757] text-[#ff4757] hover:bg-[#ff4757]/10"
                      >
                        {isExporting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <Download className="size-3 mr-1" />
                            Export Key
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
     
      </aside>
    </>
  );
}