import { formatDistanceToNow, format as formatDate } from 'date-fns';

/**
 * Format a number as USD currency
 */
export function formatCurrency(
  amount: number | bigint | string,
  options?: { decimals?: number; compact?: boolean }
): string {
  const num = typeof amount === 'bigint' ? Number(amount) : typeof amount === 'string' ? parseFloat(amount) : amount;
  const decimals = options?.decimals ?? 2;

  if (options?.compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: decimals,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format USDC amount (6 decimals) to human-readable number
 */
export function formatUsdc(amount: bigint | string): string {
  const num = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatCurrency(Number(num) / 1_000_000);
}

/**
 * Convert human-readable USDC to on-chain amount (6 decimals)
 */
export function parseUsdc(amount: number | string): bigint {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * 1_000_000));
}

/**
 * Format a number as a percentage
 */
export function formatPercent(
  value: number,
  options?: { decimals?: number; showSign?: boolean }
): string {
  const decimals = options?.decimals ?? 2;
  const sign = options?.showSign && value > 0 ? '+' : '';

  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a price (0-1 range) as a percentage with $ sign
 */
export function formatPrice(price: number): string {
  return `$${(price * 100).toFixed(1)}¢`;
}

/**
 * Format a price (0-1 range) as dollar amount with 4 decimals (like pnp.exchange)
 * e.g., 0.1648 -> "$0.1648"
 */
export function formatTokenPrice(price: number, decimals = 4): string {
  return `$${price.toFixed(decimals)}`;
}

/**
 * Format a price as probability percentage
 * e.g., 0.65 -> "65%"
 */
export function formatProbability(price: number, decimals = 1): string {
  return `${(price * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format a timestamp or date to relative time (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a timestamp or date to absolute time
 */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDate(d, 'PPp'); // e.g., "Apr 29, 2023, 9:00 AM"
}

/**
 * Format time remaining until a date
 */
export function formatTimeRemaining(endTime: Date | string | number): string {
  const end = typeof endTime === 'string' || typeof endTime === 'number' ? new Date(endTime) : endTime;
  const now = new Date();

  if (end <= now) {
    return 'Ended';
  }

  return formatDistanceToNow(end, { addSuffix: false });
}

/**
 * Format a Solana address (truncate middle)
 */
export function formatAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format P&L with color indicator
 */
export function formatPnL(pnl: number, options?: { showSign?: boolean }): {
  value: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  const formattedValue = formatCurrency(pnl);
  const sign = options?.showSign && pnl > 0 ? '+' : '';

  return {
    value: sign + formattedValue,
    isPositive: pnl > 0,
    isNegative: pnl < 0,
    isNeutral: pnl === 0,
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
