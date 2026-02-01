'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MARKET_CATEGORIES, MARKET_TYPES } from '@/lib/constants';
import type { MarketCategory } from '@/lib/constants';
import { useCreateMarket, type P2PSide } from '@/hooks/use-create-market';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { useUSDCBalance } from '@/hooks/use-balance';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  Loader2,
  MessageCircle,
  Play,
  Coins,
  Globe,
  AlertCircle,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  CalendarIcon,
  Clock
} from 'lucide-react';

// Generate time options (every 30 minutes)
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const time = `${hours.toString().padStart(2, '0')}:${minutes}`;
  const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { value: time, label };
});

const categoryIcons = {
  general: Globe,
  twitter: MessageCircle,
  youtube: Play,
  coin: Coins,
};

export default function CreateMarketPage() {
  const router = useRouter();
  const createMarket = useCreateMarket();
  const { wallet, isConnected, isLoading: walletLoading } = useSolanaWallet();
  const { data: usdcBalance } = useUSDCBalance();

  const [formData, setFormData] = useState({
    question: '',
    category: 'general' as MarketCategory,
    marketType: 'v2' as 'v2' | 'p2p',
    endDate: undefined as Date | undefined,
    endTime: '',
    initialLiquidity: '',
    tweetUrl: '',
    youtubeUrl: '',
    protocolName: '',
    tokenAddress: '',
    // P2P specific
    side: 'yes' as P2PSide,
    creatorSideCap: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question || formData.question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters';
    } else if (formData.question.length > 200) {
      newErrors.question = 'Question must be at most 200 characters';
    }

    if (formData.category === 'twitter' && !formData.tweetUrl) {
      newErrors.tweetUrl = 'Twitter/X URL is required';
    } else if (formData.category === 'twitter' && formData.tweetUrl) {
      if (!formData.tweetUrl.includes('twitter.com') && !formData.tweetUrl.includes('x.com')) {
        newErrors.tweetUrl = 'Please enter a valid Twitter/X URL';
      }
    }

    if (formData.category === 'youtube' && !formData.youtubeUrl) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (formData.category === 'youtube' && formData.youtubeUrl) {
      if (!formData.youtubeUrl.includes('youtube.com') && !formData.youtubeUrl.includes('youtu.be')) {
        newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
      }
    }

    if (formData.category === 'coin') {
      if (!formData.protocolName) {
        newErrors.protocolName = 'Protocol name is required';
      }
      if (!formData.tokenAddress) {
        newErrors.tokenAddress = 'Token address is required';
      }
    }

    if (!formData.endDate || !formData.endTime) {
      newErrors.endTime = 'End date and time are required';
    } else {
      const [hours, minutes] = formData.endTime.split(':').map(Number);
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(hours, minutes, 0, 0);
      if (endDateTime <= new Date()) {
        newErrors.endTime = 'End time must be in the future';
      }
    }

    const liquidity = parseFloat(formData.initialLiquidity);
    if (!formData.initialLiquidity || isNaN(liquidity)) {
      newErrors.initialLiquidity = 'Initial liquidity is required';
    } else if (liquidity <= 0) {
      newErrors.initialLiquidity = 'Liquidity must be greater than 0';
    } else if (usdcBalance && liquidity > usdcBalance.balance) {
      newErrors.initialLiquidity = `Insufficient balance. You have ${usdcBalance.formatted} USDC`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !wallet) {
      return;
    }

    if (!validate()) return;

    const [hours, minutes] = formData.endTime.split(':').map(Number);
    const endDateTime = new Date(formData.endDate!);
    endDateTime.setHours(hours, minutes, 0, 0);

    createMarket.mutate(
      {
        question: formData.question,
        category: formData.category,
        marketType: formData.marketType,
        endTime: endDateTime,
        initialLiquidity: parseFloat(formData.initialLiquidity),
        tweetUrl: formData.tweetUrl || undefined,
        youtubeUrl: formData.youtubeUrl || undefined,
        protocolName: formData.protocolName || undefined,
        tokenAddress: formData.tokenAddress || undefined,
        side: formData.marketType === 'p2p' ? formData.side : undefined,
        creatorSideCap: formData.creatorSideCap ? parseFloat(formData.creatorSideCap) : undefined,
      },
      {
        onSuccess: () => {
          // Navigate to markets page after successful creation
          router.push('/markets');
        },
      }
    );
  };

  const isSubmitting = createMarket.isPending;

  // Show wallet connection prompt
  if (!walletLoading && (!isConnected || !wallet)) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center">
              <PlusCircle className="size-5 text-[#c8ff00]" />
            </div>
            <div>
              <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider">// Create</p>
              <h1 className="text-2xl font-bold">New Market</h1>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#c8ff00]/10 p-12 text-center">
          <Wallet className="size-16 mx-auto mb-4 text-[#6b6b7b]" />
          <h3 className="font-semibold mb-2 text-lg">Connect Wallet to Create</h3>
          <p className="text-[#6b6b7b]">
            Please login to create a prediction market.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center">
            <PlusCircle className="size-5 text-[#c8ff00]" />
          </div>
          <div>
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider">// Create</p>
            <h1 className="text-2xl font-bold">New Market</h1>
          </div>
        </div>
        <p className="text-[#6b6b7b] mt-2">
          Create a prediction market for any binary outcome event
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Section */}
        <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-[#c8ff00] font-mono text-sm">01</span>
            Question
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                Market Question
              </label>
              <textarea
                placeholder="Will Bitcoin reach $100,000 by end of 2026?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                maxLength={200}
                rows={3}
                className="w-full p-4 bg-[#1a1a24] border border-[#c8ff00]/10 text-[#e8e8e8] placeholder:text-[#6b6b7b] resize-none focus:border-[#c8ff00]/30 focus:outline-none"
              />
              <div className="flex justify-between mt-2 text-xs font-mono">
                <span className={errors.question ? 'text-[#ff4757]' : 'text-[#6b6b7b]'}>
                  {errors.question || 'Clear YES/NO outcome'}
                </span>
                <span className="text-[#6b6b7b]">{formData.question.length}/200</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MARKET_CATEGORIES.map((cat) => {
                  const Icon = categoryIcons[cat.value as keyof typeof categoryIcons];
                  const isSelected = formData.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value as MarketCategory })}
                      className={`p-3 text-center transition-all ${
                        isSelected
                          ? 'bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00]'
                          : 'bg-[#1a1a24] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#c8ff00]/30'
                      }`}
                    >
                      <Icon className="size-5 mx-auto mb-1" />
                      <span className="text-xs font-mono">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category-specific fields */}
            {formData.category === 'twitter' && (
              <div>
                <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                  Twitter/X Post URL
                </label>
                <Input
                  type="url"
                  placeholder="https://x.com/username/status/..."
                  value={formData.tweetUrl}
                  onChange={(e) => setFormData({ ...formData, tweetUrl: e.target.value })}
                  className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30"
                />
                {errors.tweetUrl && (
                  <p className="text-xs text-[#ff4757] mt-1">{errors.tweetUrl}</p>
                )}
              </div>
            )}

            {formData.category === 'youtube' && (
              <div>
                <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                  YouTube Video URL
                </label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30"
                />
                {errors.youtubeUrl && (
                  <p className="text-xs text-[#ff4757] mt-1">{errors.youtubeUrl}</p>
                )}
              </div>
            )}

            {formData.category === 'coin' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                    Protocol Name
                  </label>
                  <Input
                    placeholder="e.g., Jupiter"
                    value={formData.protocolName}
                    onChange={(e) => setFormData({ ...formData, protocolName: e.target.value })}
                    className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30"
                  />
                  {errors.protocolName && (
                    <p className="text-xs text-[#ff4757] mt-1">{errors.protocolName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                    Token Address
                  </label>
                  <Input
                    placeholder="Solana mint address"
                    value={formData.tokenAddress}
                    onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                    className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30"
                  />
                  {errors.tokenAddress && (
                    <p className="text-xs text-[#ff4757] mt-1">{errors.tokenAddress}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parameters Section */}
        <div className="bg-[#12121a] border border-[#c8ff00]/10 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-[#c8ff00] font-mono text-sm">02</span>
            Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                Market Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MARKET_TYPES.map((type) => {
                  const isSelected = formData.marketType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, marketType: type.value as 'v2' | 'p2p' })}
                      className={`p-4 text-left transition-all ${
                        isSelected
                          ? 'bg-[#c8ff00]/10 border border-[#c8ff00] text-[#e8e8e8]'
                          : 'bg-[#1a1a24] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#c8ff00]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={`size-4 ${isSelected ? 'text-[#c8ff00]' : ''}`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs opacity-70">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* P2P Specific Fields */}
            {formData.marketType === 'p2p' && (
              <div className="space-y-4 p-4 bg-[#1a1a24] border border-[#c8ff00]/10 rounded-lg">
                <div>
                  <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                    Your Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, side: 'yes' })}
                      className={`p-4 text-center transition-all ${
                        formData.side === 'yes'
                          ? 'bg-[#2ed573]/20 border-2 border-[#2ed573] text-[#2ed573]'
                          : 'bg-[#12121a] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#2ed573]/50'
                      }`}
                    >
                      <ThumbsUp className="size-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">YES</span>
                      <p className="text-xs opacity-70 mt-1">Bet on outcome happening</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, side: 'no' })}
                      className={`p-4 text-center transition-all ${
                        formData.side === 'no'
                          ? 'bg-[#ff4757]/20 border-2 border-[#ff4757] text-[#ff4757]'
                          : 'bg-[#12121a] border border-[#c8ff00]/10 text-[#6b6b7b] hover:border-[#ff4757]/50'
                      }`}
                    >
                      <ThumbsDown className="size-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">NO</span>
                      <p className="text-xs opacity-70 mt-1">Bet against outcome</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                    Maximum Exposure (USDC)
                  </label>
                  <Input
                    type="number"
                    placeholder="500"
                    min={0}
                    step="1"
                    value={formData.creatorSideCap}
                    onChange={(e) => setFormData({ ...formData, creatorSideCap: e.target.value })}
                    className="h-12 bg-[#12121a] border-[#c8ff00]/10 focus:border-[#c8ff00]/30 font-mono"
                  />
                  <p className="text-xs text-[#6b6b7b] mt-1">
                    Maximum amount you're willing to risk on your position
                  </p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-[#1a1a24] border-[#c8ff00]/10 hover:bg-[#1a1a24] hover:border-[#c8ff00]/30",
                        !formData.endDate && "text-[#6b6b7b]"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#12121a] border-[#c8ff00]/20" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#6b6b7b] mb-2">
                  End Time
                </label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                >
                  <SelectTrigger className="w-full h-12 bg-[#1a1a24] border-[#c8ff00]/10 hover:border-[#c8ff00]/30">
                    <Clock className="mr-2 h-4 w-4 text-[#6b6b7b]" />
                    <SelectValue placeholder="Pick a time" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121a] border-[#c8ff00]/20 max-h-60">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.endTime && (
              <p className="text-xs text-[#ff4757]">{errors.endTime}</p>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono text-[#6b6b7b]">
                  Initial Liquidity (USDC)
                </label>
                <span className="text-xs text-[#6b6b7b]">
                  Balance: <span className="text-[#c8ff00]">{usdcBalance?.formatted ?? '0.00'}</span> USDC
                </span>
              </div>
              <Input
                type="number"
                placeholder="Enter amount"
                min={0}
                step="0.01"
                value={formData.initialLiquidity}
                onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                className="h-12 bg-[#1a1a24] border-[#c8ff00]/10 focus:border-[#c8ff00]/30 font-mono"
              />
              {errors.initialLiquidity && (
                <p className="text-xs text-[#ff4757] mt-1">{errors.initialLiquidity}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-[#c8ff00]/5 border border-[#c8ff00]/20">
          <AlertCircle className="size-5 text-[#c8ff00] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-[#e8e8e8]">15-minute buffer period</p>
            <p className="text-[#6b6b7b] mt-1">
              Trading will be disabled for 15 minutes after market creation to allow for initial setup.
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 py-4 border border-[#c8ff00]/20 text-[#6b6b7b] hover:text-[#e8e8e8] hover:border-[#c8ff00]/40 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isConnected}
            className="flex-1 py-4 bg-[#c8ff00] text-[#0a0a0f] font-semibold hover:glow-lime transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="size-4" />
                Create Market
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
