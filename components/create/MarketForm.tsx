'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MARKET_CATEGORIES, MARKET_TYPES, MIN_MARKET_LIQUIDITY } from '@/lib/constants';
import type { MarketCategory } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function MarketForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    category: 'general' as MarketCategory,
    marketType: 'v2' as 'v2' | 'p2p',
    endDate: '',
    endTime: '',
    initialLiquidity: '',
    // Category-specific fields
    tweetUrl: '',
    youtubeUrl: '',
    protocolName: '',
    tokenAddress: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question || formData.question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters';
    } else if (formData.question.length > 200) {
      newErrors.question = 'Question must be at most 200 characters';
    }

    // Category-specific validation
    if (formData.category === 'twitter' && !formData.tweetUrl) {
      newErrors.tweetUrl = 'Twitter/X URL is required for Twitter predictions';
    } else if (formData.category === 'twitter' && formData.tweetUrl) {
      // Basic URL validation for Twitter
      if (!formData.tweetUrl.includes('twitter.com') && !formData.tweetUrl.includes('x.com')) {
        newErrors.tweetUrl = 'Please enter a valid Twitter/X URL';
      }
    }

    if (formData.category === 'youtube' && !formData.youtubeUrl) {
      newErrors.youtubeUrl = 'YouTube URL is required for YouTube predictions';
    } else if (formData.category === 'youtube' && formData.youtubeUrl) {
      // Basic URL validation for YouTube
      if (!formData.youtubeUrl.includes('youtube.com') && !formData.youtubeUrl.includes('youtu.be')) {
        newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
      }
    }

    if (formData.category === 'coin') {
      if (!formData.protocolName) {
        newErrors.protocolName = 'Protocol name is required for coin predictions';
      }
      if (!formData.tokenAddress) {
        newErrors.tokenAddress = 'Token address is required for coin predictions';
      }
    }

    if (!formData.endDate || !formData.endTime) {
      newErrors.endTime = 'End date and time are required';
    } else {
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      if (endDateTime <= new Date()) {
        newErrors.endTime = 'End time must be in the future';
      }
    }

    const liquidity = parseFloat(formData.initialLiquidity);
    if (!formData.initialLiquidity || isNaN(liquidity)) {
      newErrors.initialLiquidity = 'Initial liquidity is required';
    } else if (liquidity < MIN_MARKET_LIQUIDITY / 1_000_000) {
      newErrors.initialLiquidity = `Minimum liquidity is ${MIN_MARKET_LIQUIDITY / 1_000_000} USDC`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const response = await fetch('/api/create-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          category: formData.category,
          marketType: formData.marketType,
          endTime: endDateTime.toISOString(),
          initialLiquidity: formData.initialLiquidity,
          // Include category-specific fields
          tweetUrl: formData.tweetUrl || undefined,
          youtubeUrl: formData.youtubeUrl || undefined,
          protocolName: formData.protocolName || undefined,
          tokenAddress: formData.tokenAddress || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Market created successfully!');
        router.push(`/markets/${result.marketPublicKey}`);
      } else {
        toast.error(result.error || 'Failed to create market', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Market Question</h3>
            <p className="text-sm text-muted-foreground">
              Write a clear, unambiguous question with a binary YES/NO outcome
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="Will Bitcoin reach $100,000 by end of 2026?"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.question || 'At least 10 characters'}</span>
              <span>{formData.question.length}/200</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as MarketCategory })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category-specific fields */}
          {formData.category === 'twitter' && (
            <div className="space-y-2">
              <Label htmlFor="tweetUrl">Twitter/X Post URL</Label>
              <Input
                id="tweetUrl"
                type="url"
                placeholder="https://x.com/username/status/1234567890"
                value={formData.tweetUrl}
                onChange={(e) => setFormData({ ...formData, tweetUrl: e.target.value })}
              />
              {errors.tweetUrl ? (
                <p className="text-xs text-destructive">{errors.tweetUrl}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Paste the full URL of the tweet/post to predict about
                </p>
              )}
            </div>
          )}

          {formData.category === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
              <Input
                id="youtubeUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              />
              {errors.youtubeUrl ? (
                <p className="text-xs text-destructive">{errors.youtubeUrl}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Paste the full URL of the YouTube video to predict about
                </p>
              )}
            </div>
          )}

          {formData.category === 'coin' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="protocolName">Protocol Name</Label>
                <Input
                  id="protocolName"
                  placeholder="e.g., Jupiter, Raydium, Orca"
                  value={formData.protocolName}
                  onChange={(e) => setFormData({ ...formData, protocolName: e.target.value })}
                />
                {errors.protocolName ? (
                  <p className="text-xs text-destructive">{errors.protocolName}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Name of the DeFi protocol or project
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Address</Label>
                <Input
                  id="tokenAddress"
                  placeholder="Solana token mint address"
                  value={formData.tokenAddress}
                  onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                />
                {errors.tokenAddress ? (
                  <p className="text-xs text-destructive">{errors.tokenAddress}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The Solana token mint address for price tracking
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Market Parameters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Market Parameters</h3>
            <p className="text-sm text-muted-foreground">
              Configure the market type, end time, and initial liquidity
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketType">Market Type</Label>
            <Select
              value={formData.marketType}
              onValueChange={(value) => setFormData({ ...formData, marketType: value as 'v2' | 'p2p' })}
            >
              <SelectTrigger id="marketType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          {errors.endTime && (
            <p className="text-xs text-destructive">{errors.endTime}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="initialLiquidity">Initial Liquidity (USDC)</Label>
            <Input
              id="initialLiquidity"
              type="number"
              placeholder="100"
              min={MIN_MARKET_LIQUIDITY / 1_000_000}
              step="1"
              value={formData.initialLiquidity}
              onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
            />
            {errors.initialLiquidity ? (
              <p className="text-xs text-destructive">{errors.initialLiquidity}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Minimum: {MIN_MARKET_LIQUIDITY / 1_000_000} USDC
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Market'
          )}
        </Button>
      </div>
    </form>
  );
}
