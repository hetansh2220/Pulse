'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getMarketImage, CATEGORY_PLACEHOLDERS } from '@/lib/market-images';
import { Globe, MessageCircle, Play, Coins } from 'lucide-react';

interface MarketImageProps {
  market: {
    category: string;
    question: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

// Category icons as fallback when no image available
const categoryIcons: Record<string, typeof Globe> = {
  twitter: MessageCircle,
  youtube: Play,
  coin: Coins,
  general: Globe,
};

const categoryColors: Record<string, string> = {
  twitter: '#00f5ff',
  youtube: '#ff4757',
  coin: '#c8ff00',
  general: '#a855f7',
};

export default function MarketImage({ market, size = 'md', className = '' }: MarketImageProps) {
  const { imageUrl, fallbackUrl } = getMarketImage(market);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dimension = sizeMap[size];
  const Icon = categoryIcons[market.category] || Globe;
  const color = categoryColors[market.category] || '#a855f7';

  // If no image URL or error occurred, show icon fallback
  const showIconFallback = !imageUrl || hasError;

  if (showIconFallback) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: dimension,
          height: dimension,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon
          style={{ color }}
          className={size === 'sm' ? 'size-4' : size === 'md' ? 'size-6' : 'size-8'}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: `${color}15` }}
        />
      )}
      <Image
        src={imageUrl}
        alt=""
        width={dimension}
        height={dimension}
        className="object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        unoptimized // For external URLs
      />
    </div>
  );
}
