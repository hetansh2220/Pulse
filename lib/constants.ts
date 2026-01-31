// App-wide constants

export const MARKET_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'coin', label: 'Coin' },
] as const;

export type MarketCategory = typeof MARKET_CATEGORIES[number]['value'];

export const MARKET_TYPES = [
  { value: 'v2', label: 'V2 AMM', description: 'Automated market maker with equal liquidity for both outcomes' },
  { value: 'p2p', label: 'P2P', description: 'Peer-to-peer market with creator taking position' },
] as const;

export type MarketType = typeof MARKET_TYPES[number]['value'];

export const MARKET_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;

export type MarketStatus = typeof MARKET_STATUS[number]['value'];

// Buffer period: 15 minutes after market creation before trading is allowed
export const BUFFER_PERIOD_MS = 15 * 60 * 1000;

// USDC token mints (SPL token)
export const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_MINT_DEVNET = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'; // SPL Token Faucet USDC

// Get USDC mint based on network
export const USDC_MINT = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
  ? USDC_MINT_MAINNET
  : USDC_MINT_DEVNET;

// Default slippage tolerance (1%)
export const DEFAULT_SLIPPAGE = 1;

// Minimum market liquidity (in USDC, 6 decimals)
export const MIN_MARKET_LIQUIDITY = 100 * 1_000_000; // 100 USDC

// Query stale times (milliseconds)
export const STALE_TIME_MARKETS = 30_000; // 30 seconds
export const STALE_TIME_MARKET = 15_000; // 15 seconds
export const STALE_TIME_POSITIONS = 20_000; // 20 seconds

// Refetch intervals (milliseconds)
export const REFETCH_INTERVAL_MARKETS = 60_000; // 1 minute
export const REFETCH_INTERVAL_MARKET = 30_000; // 30 seconds
export const REFETCH_INTERVAL_POSITIONS = 30_000; // 30 seconds
