'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth/solana';
import { usePrivy } from '@privy-io/react-auth';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { useUSDCBalance } from '@/hooks/use-balance';
import { formatAddress } from '@/lib/format';
import {
  Copy,
  Check,
  Send,
  Download,
  Key,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

type TabType = 'deposit' | 'withdraw' | 'export';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { wallets } = useWallets();
  const { exportWallet } = usePrivy();
  const { address, isConnected } = useSolanaWallet();
  const { data: usdcBalance } = useUSDCBalance();

  const primaryWallet = wallets[0];

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

      // Validate recipient address
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

      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(primaryWallet.address),
          toPubkey: recipientPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(primaryWallet.address);

      // Serialize and sign
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const result = await primaryWallet.signTransaction({
        transaction: serialized,
      });

      // Send transaction
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

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const explorerUrl = address
    ? network === 'mainnet-beta'
      ? `https://explorer.solana.com/address/${address}`
      : `https://explorer.solana.com/address/${address}?cluster=devnet`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-[#0a0a0f] border-[#1e1e2e] p-0 max-w-md overflow-hidden"
        showCloseButton={true}
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1e1e2e]">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="size-5 text-[#c8ff00]" />
            Wallet
          </DialogTitle>
          <p className="text-sm text-[#6b6b7b] mt-1">
            Manage your funds
          </p>
        </div>

        {/* Loading/No Wallet State */}
        {!address && (
          <div className="p-8 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-[#c8ff00] mb-4" />
            <p className="text-[#6b6b7b]">Loading wallet...</p>
          </div>
        )}

        {/* Tabs */}
        {address && (
          <>
          <div className="grid grid-cols-3 border-b border-[#1e1e2e]">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-3 text-sm font-medium transition-colors ${
              activeTab === 'deposit'
                ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                : 'text-[#6b6b7b] hover:text-white'
            }`}
          >
            <ArrowDownToLine className="size-4 mx-auto mb-1" />
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`py-3 text-sm font-medium transition-colors ${
              activeTab === 'withdraw'
                ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                : 'text-[#6b6b7b] hover:text-white'
            }`}
          >
            <ArrowUpFromLine className="size-4 mx-auto mb-1" />
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-[#c8ff00] border-b-2 border-[#c8ff00]'
                : 'text-[#6b6b7b] hover:text-white'
            }`}
          >
            <Key className="size-4 mx-auto mb-1" />
            Export
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-[#6b6b7b] mb-4">
                  Send SOL or tokens to this address to deposit funds
                </p>

                {/* Address Box */}
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-4">
                  <p className="text-xs text-[#6b6b7b] uppercase tracking-wide mb-2">
                    Your Wallet Address
                  </p>
                  <p className="font-mono text-sm text-white break-all mb-3">
                    {address}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyAddress}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-[#1e1e2e] border-[#2a2a3a] hover:bg-[#2a2a3a]"
                    >
                      {copied ? (
                        <>
                          <Check className="size-4 mr-2 text-[#2ed573]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => window.open(explorerUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="bg-[#1e1e2e] border-[#2a2a3a] hover:bg-[#2a2a3a]"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="mt-4 p-3 bg-[#12121a] border border-[#1e1e2e] rounded-lg">
                  <p className="text-xs text-[#6b6b7b]">Current USDC Balance</p>
                  <p className="text-lg font-bold text-white">
                    {usdcBalance?.formatted ?? '0.00'} USDC
                  </p>
                </div>

                <p className="text-xs text-[#6b6b7b] mt-4">
                  Network: <span className="text-[#c8ff00] uppercase">{network}</span>
                </p>
              </div>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <p className="text-sm text-[#6b6b7b] text-center mb-4">
                Send SOL to another wallet
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#6b6b7b] uppercase tracking-wide mb-2">
                    Recipient Address
                  </label>
                  <Input
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Enter Solana address..."
                    className="bg-[#12121a] border-[#1e1e2e] focus:border-[#c8ff00]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#6b6b7b] uppercase tracking-wide mb-2">
                    Amount (SOL)
                  </label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.001"
                    className="bg-[#12121a] border-[#1e1e2e] focus:border-[#c8ff00]/50"
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAddress || !withdrawAmount}
                  className="w-full bg-[#c8ff00] text-black hover:bg-[#a8df00] disabled:opacity-50"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-2" />
                      Send SOL
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-[#6b6b7b] text-center">
                Make sure you have enough SOL for transaction fees
              </p>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg">
                <Key className="size-8 mx-auto mb-3 text-[#ff4757]" />
                <h3 className="font-semibold text-white mb-2">Export Private Key</h3>
                <p className="text-sm text-[#6b6b7b]">
                  Your private key gives full access to your wallet. Never share it with anyone.
                </p>
              </div>

              <Button
                onClick={handleExportKey}
                disabled={isExporting}
                variant="outline"
                className="w-full border-[#ff4757] text-[#ff4757] hover:bg-[#ff4757]/10"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Export Private Key
                  </>
                )}
              </Button>

              <p className="text-xs text-[#6b6b7b]">
                This will open Privy's secure export interface
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
