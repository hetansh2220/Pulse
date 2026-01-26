import { PNPClient } from 'pnp-sdk';
import type { Market } from '@/types/market';
// Import client-safe utilities
import {
  calculatePrices,
  isInBufferPeriod,
  getBufferTimeRemaining,
  hasMarketEnded,
  estimateTokensReceived,
  calculatePriceImpact,
} from './market-utils';

// Re-export client-safe utilities for backward compatibility
export {
  calculatePrices,
  isInBufferPeriod,
  getBufferTimeRemaining,
  hasMarketEnded,
  estimateTokensReceived,
  calculatePriceImpact,
};

/**
 * Create a read-only PNP client for fetching public data
 * SERVER-ONLY: Do not use in client components
 */
export function createReadClient(): PNPClient {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;

  if (!rpcUrl) {
    throw new Error('RPC_URL environment variable is not set');
  }

  return new PNPClient(rpcUrl);
}

/**
 * Create a PNP client with signing capability for write operations
 * Requires a private key
 * SERVER-ONLY: Do not use in client components
 */
export function createWriteClient(privateKey: string | Uint8Array): PNPClient {
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;

  if (!rpcUrl) {
    throw new Error('RPC_URL environment variable is not set');
  }

  return new PNPClient(rpcUrl, privateKey);
}

/**
 * Transform raw market data from PNP SDK to our Market type
 * SERVER-ONLY: Uses PNP SDK types
 */
export function transformMarketData(rawMarket: any): Market {
  // Convert bigint timestamps to milliseconds
  const endTimeMs = rawMarket.end_time
    ? Number(BigInt(rawMarket.end_time) * BigInt(1000))
    : Date.now() + 30 * 24 * 60 * 60 * 1000;
  const creationTimeMs = rawMarket.creation_time
    ? Number(BigInt(rawMarket.creation_time) * BigInt(1000))
    : Date.now();

  const endTimeISO = new Date(endTimeMs).toISOString();
  const creationTimeISO = new Date(creationTimeMs).toISOString();

  // Convert supply values (they're in token base units)
  const yesSupply = rawMarket.yes_token_supply_minted?.toString() || '0';
  const noSupply = rawMarket.no_token_supply_minted?.toString() || '0';

  // Use real prices from getMarketPriceV2 if provided, otherwise calculate from supplies
  const calculatedPrices = calculatePrices(yesSupply, noSupply);
  const yesPrice = rawMarket.realYesPrice ?? calculatedPrices.yesPrice;
  const noPrice = rawMarket.realNoPrice ?? calculatedPrices.noPrice;

  const bufferActive = isInBufferPeriod(creationTimeISO);

  // Determine winning token from winning_token_id
  let winningToken: 'yes' | 'no' | undefined;
  if (rawMarket.winning_token_id) {
    const winId = rawMarket.winning_token_id;
    if (winId === 'yes' || winId === 1) winningToken = 'yes';
    else if (winId === 'no' || winId === 0) winningToken = 'no';
  }

  // Use publicKey for both publicKey and id fields since we need the base58 string for routing
  const marketPublicKey = rawMarket.publicKey || rawMarket.address || '';

  return {
    publicKey: marketPublicKey,
    id: marketPublicKey, // Use publicKey string instead of numeric id for routing
    question: rawMarket.question || '',
    category: rawMarket.category || 'general',
    creator: (rawMarket.creator || '').toString(),
    yesTokenMint: (rawMarket.yes_token_mint || '').toString(),
    noTokenMint: (rawMarket.no_token_mint || '').toString(),
    baseMint: (rawMarket.collateral_token || '').toString(),
    yesTokenSupply: yesSupply,
    noTokenSupply: noSupply,
    marketReserves: (rawMarket.market_reserves || '0').toString(),
    initialLiquidity: (rawMarket.initial_liquidity || '0').toString(),
    volume: '0', // Volume not provided by SDK, would need to track trades
    currentYesPrice: yesPrice,
    currentNoPrice: noPrice,
    yesMultiplier: rawMarket.yesMultiplier,
    noMultiplier: rawMarket.noMultiplier,
    endTime: endTimeISO,
    creationTime: creationTimeISO,
    resolved: rawMarket.resolved || false,
    resolvable: rawMarket.resolvable || false,
    winningToken,
    bufferPeriodActive: bufferActive,
  };
}

/**
 * Filter markets by category
 */
export function filterMarketsByCategory(markets: Market[], category?: string): Market[] {
  if (!category || category === 'all') return markets;
  return markets.filter((m) => m.category === category);
}

/**
 * Filter markets by status
 */
export function filterMarketsByStatus(markets: Market[], status?: string): Market[] {
  if (!status || status === 'all') return markets;

  const now = Date.now();

  switch (status) {
    case 'active':
      return markets.filter((m) => !m.resolved && new Date(m.endTime).getTime() > now && !m.bufferPeriodActive);
    case 'ended':
      return markets.filter((m) => !m.resolved && new Date(m.endTime).getTime() <= now);
    case 'resolved':
      return markets.filter((m) => m.resolved);
    case 'upcoming':
      return markets.filter((m) => !m.resolved && m.bufferPeriodActive);
    default:
      return markets;
  }
}

/**
 * Search markets by question text
 */
export function searchMarkets(markets: Market[], searchTerm?: string): Market[] {
  if (!searchTerm || searchTerm.trim() === '') return markets;

  const term = searchTerm.toLowerCase().trim();
  return markets.filter((m) => m.question.toLowerCase().includes(term));
}
