import { BUFFER_PERIOD_MS } from './constants';

/**
 * Calculate YES/NO prices from token supplies
 * Using AMM constant product formula
 * CLIENT-SAFE: Pure calculation, no SDK dependencies
 */
export function calculatePrices(
  yesSupply: string | bigint,
  noSupply: string | bigint
): { yesPrice: number; noPrice: number } {
  const yes = typeof yesSupply === 'string' ? BigInt(yesSupply) : yesSupply;
  const no = typeof noSupply === 'string' ? BigInt(noSupply) : noSupply;

  const totalSupply = yes + no;

  if (totalSupply === BigInt(0)) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }

  const yesPrice = Number(yes) / Number(totalSupply);
  const noPrice = Number(no) / Number(totalSupply);

  return { yesPrice, noPrice };
}

/**
 * Check if a market is in the buffer period (15 minutes after creation)
 * Trading is restricted during this period
 * CLIENT-SAFE: Pure calculation
 */
export function isInBufferPeriod(creationTime: string | Date): boolean {
  const creation = typeof creationTime === 'string' ? new Date(creationTime) : creationTime;
  const bufferEnd = creation.getTime() + BUFFER_PERIOD_MS;
  const now = Date.now();

  return now < bufferEnd;
}

/**
 * Get remaining time in buffer period (in milliseconds)
 * CLIENT-SAFE: Pure calculation
 */
export function getBufferTimeRemaining(creationTime: string | Date): number {
  const creation = typeof creationTime === 'string' ? new Date(creationTime) : creationTime;
  const bufferEnd = creation.getTime() + BUFFER_PERIOD_MS;
  const now = Date.now();

  return Math.max(0, bufferEnd - now);
}

/**
 * Check if a market has ended
 * CLIENT-SAFE: Pure calculation
 */
export function hasMarketEnded(endTime: string | Date): boolean {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  return end.getTime() <= Date.now();
}

/**
 * Estimate tokens to receive for a given USDC amount
 * This is a simplified estimation - actual amount may vary
 * CLIENT-SAFE: Pure calculation
 */
export function estimateTokensReceived(
  usdcAmount: number,
  tokenType: 'yes' | 'no',
  yesSupply: string | bigint,
  noSupply: string | bigint
): number {
  const { yesPrice, noPrice } = calculatePrices(yesSupply, noSupply);
  const price = tokenType === 'yes' ? yesPrice : noPrice;

  if (price === 0) return 0;

  // Simple estimation: amount / price
  // Note: This doesn't account for slippage or AMM price impact
  return usdcAmount / price;
}

/**
 * Market display status type
 */
export type MarketDisplayStatus = 'active' | 'ended' | 'resolved' | 'upcoming';

/**
 * Get the display status for a market
 * CLIENT-SAFE: Pure calculation
 */
export function getMarketDisplayStatus(market: {
  resolved: boolean;
  endTime: string;
  bufferPeriodActive: boolean;
}): MarketDisplayStatus {
  if (market.resolved) return 'resolved';
  if (market.bufferPeriodActive) return 'upcoming';
  if (hasMarketEnded(market.endTime)) return 'ended';
  return 'active';
}

/**
 * Get styling classes for a market status badge
 * Returns Neon Terminal themed colors
 */
export function getStatusStyles(status: MarketDisplayStatus): {
  textClass: string;
  borderClass: string;
  bgClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'active':
      return {
        textClass: 'text-[#c8ff00]',
        borderClass: 'border-[#c8ff00]/30',
        bgClass: 'bg-[#c8ff00]/10',
        dotClass: 'bg-[#c8ff00]',
      };
    case 'ended':
      return {
        textClass: 'text-[#ff9f43]',
        borderClass: 'border-[#ff9f43]/30',
        bgClass: 'bg-[#ff9f43]/10',
        dotClass: 'bg-[#ff9f43]',
      };
    case 'resolved':
      return {
        textClass: 'text-[#6b6b7b]',
        borderClass: 'border-[#6b6b7b]/30',
        bgClass: 'bg-[#6b6b7b]/10',
        dotClass: 'bg-[#6b6b7b]',
      };
    case 'upcoming':
      return {
        textClass: 'text-[#00f5ff]',
        borderClass: 'border-[#00f5ff]/30',
        bgClass: 'bg-[#00f5ff]/10',
        dotClass: 'bg-[#00f5ff]',
      };
  }
}

/**
 * Estimate USDC received when selling tokens
 * This is a simplified estimation - actual amount may vary
 * CLIENT-SAFE: Pure calculation
 */
export function estimateUsdcReceived(
  tokenAmount: number,
  tokenType: 'yes' | 'no',
  yesSupply: string | bigint,
  noSupply: string | bigint
): number {
  const { yesPrice, noPrice } = calculatePrices(yesSupply, noSupply);
  const price = tokenType === 'yes' ? yesPrice : noPrice;

  // Simple estimation: tokens * price
  // Note: This doesn't account for slippage or AMM price impact
  return tokenAmount * price;
}

/**
 * Calculate price impact for a trade
 * CLIENT-SAFE: Pure calculation
 */
export function calculatePriceImpact(
  usdcAmount: number,
  tokenType: 'yes' | 'no',
  yesSupply: string | bigint,
  noSupply: string | bigint
): number {
  const currentPrice = calculatePrices(yesSupply, noSupply);
  const basePrice = tokenType === 'yes' ? currentPrice.yesPrice : currentPrice.noPrice;

  // Estimate new supply after trade
  const tokensReceived = estimateTokensReceived(usdcAmount, tokenType, yesSupply, noSupply);

  const newYesSupply = tokenType === 'yes' ? BigInt(yesSupply) + BigInt(Math.floor(tokensReceived)) : BigInt(yesSupply);
  const newNoSupply = tokenType === 'no' ? BigInt(noSupply) + BigInt(Math.floor(tokensReceived)) : BigInt(noSupply);

  const newPrice = calculatePrices(newYesSupply, newNoSupply);
  const effectivePrice = tokenType === 'yes' ? newPrice.yesPrice : newPrice.noPrice;

  // Price impact as percentage
  return ((effectivePrice - basePrice) / basePrice) * 100;
}
