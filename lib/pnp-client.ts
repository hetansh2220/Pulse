import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import {
  setNetwork,
  getMarketData,
  IDL,
  type MarketAccount,
} from 'pnp-adapter';
// @ts-ignore - getProgramId is exported at runtime but not in types
import { getProgramId } from 'pnp-adapter';
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

// Connection singleton
let connectionInstance: Connection | null = null;

function getConnection(): Connection {
  if (!connectionInstance) {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable is not set');
    }
    connectionInstance = new Connection(rpcUrl, 'confirmed');
  }
  return connectionInstance;
}

/**
 * Ensures network is set correctly before any pnp-adapter operations
 */
function ensureNetworkSet(): void {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  setNetwork(network as 'mainnet-beta' | 'devnet');
}

/**
 * Create an Anchor program with the correct program ID for the current network
 * This works around a bug in pnp-adapter's PnpProgram which has hardcoded mainnet ID
 */
function createNetworkAwareProgram(connection: Connection): Program {
  ensureNetworkSet();

  const programId = getProgramId();

  // Create a no-op wallet for read-only operations
  const noopWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
  };

  const provider = new AnchorProvider(connection, noopWallet as any, {
    commitment: 'confirmed',
  });

  // Create IDL with correct program ID
  const idlWithAddress = {
    ...IDL,
    address: programId.toString(),
  };

  return new Program(idlWithAddress as any, provider);
}

/**
 * Fetch all markets from the program
 * Uses custom program creation to ensure correct network program ID is used
 */
export async function fetchAllMarkets(): Promise<Array<{ publicKey: string; account: MarketAccount }>> {
  const connection = getConnection();
  const program = createNetworkAwareProgram(connection);

  // Fetch all market accounts using Anchor
  const markets = await (program.account as any).market.all();

  // Convert to the format expected by our app
  return markets.map((m: any) => ({
    publicKey: m.publicKey.toString(),
    account: m.account as MarketAccount,
  }));
}

/**
 * Fetch a single market by address using pnp-adapter's getMarketData
 */
export async function fetchMarket(marketAddress: string): Promise<{ publicKey: string; account: any } | null> {
  // Ensure network is set before fetching
  ensureNetworkSet();

  const connection = getConnection();

  try {
    const marketData = await getMarketData(connection, marketAddress);

    if (!marketData) {
      return null;
    }

    // getMarketData returns { marketReserves, yesTokenSupply, noTokenSupply, endTime, marketAccount }
    // We need to extract the marketAccount and merge with the other data
    return {
      publicKey: marketAddress,
      account: {
        ...marketData.marketAccount,
        // Add the computed values from marketData
        marketReserves: marketData.marketReserves,
        yesTokenSupply: marketData.yesTokenSupply,
        noTokenSupply: marketData.noTokenSupply,
      },
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
}

/**
 * Transform raw market data from pnp-adapter to our Market type
 * Handles both camelCase (pnp-adapter) and snake_case (pnp-sdk) field names
 * SERVER-ONLY: Uses PNP types
 */
export function transformMarketData(rawMarket: any): Market {
  // Handle both camelCase (pnp-adapter) and snake_case (pnp-sdk) field names
  const endTimeValue = rawMarket.endTime ?? rawMarket.end_time;
  const creationTimeValue = rawMarket.creationTime ?? rawMarket.creation_time;
  const yesSupplyValue = rawMarket.yesTokenSupplyMinted ?? rawMarket.yes_token_supply_minted;
  const noSupplyValue = rawMarket.noTokenSupplyMinted ?? rawMarket.no_token_supply_minted;
  const winningTokenValue = rawMarket.winningTokenId ?? rawMarket.winning_token_id;
  const yesTokenMintValue = rawMarket.yesTokenMint ?? rawMarket.yes_token_mint;
  const noTokenMintValue = rawMarket.noTokenMint ?? rawMarket.no_token_mint;
  const collateralTokenValue = rawMarket.collateralToken ?? rawMarket.collateral_token;
  const marketReservesValue = rawMarket.marketReserves ?? rawMarket.market_reserves;
  const initialLiquidityValue = rawMarket.initialLiquidity ?? rawMarket.initial_liquidity;

  // Convert timestamps to milliseconds
  // pnp-adapter returns BN objects, pnp-sdk might return numbers or bigints
  const endTimeNum = endTimeValue?.toNumber?.() ?? Number(endTimeValue) ?? 0;
  const creationTimeNum = creationTimeValue?.toNumber?.() ?? Number(creationTimeValue) ?? 0;

  const endTimeMs = endTimeNum ? endTimeNum * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000;
  const creationTimeMs = creationTimeNum ? creationTimeNum * 1000 : Date.now();

  const endTimeISO = new Date(endTimeMs).toISOString();
  const creationTimeISO = new Date(creationTimeMs).toISOString();

  // Convert supply values (they're in token base units)
  const yesSupply = yesSupplyValue?.toString?.() ?? String(yesSupplyValue ?? '0');
  const noSupply = noSupplyValue?.toString?.() ?? String(noSupplyValue ?? '0');

  // Use real prices from getMarketPriceV2 if provided, otherwise calculate from supplies
  const calculatedPrices = calculatePrices(yesSupply, noSupply);
  const yesPrice = rawMarket.realYesPrice ?? calculatedPrices.yesPrice;
  const noPrice = rawMarket.realNoPrice ?? calculatedPrices.noPrice;

  const bufferActive = isInBufferPeriod(creationTimeISO);

  // Determine winning token from winning_token_id
  let winningToken: 'yes' | 'no' | undefined;
  if (winningTokenValue) {
    const winId = winningTokenValue;
    // Handle pnp-adapter's WinningToken enum format
    if (winId === 'yes' || winId === 1 || winId?.yes !== undefined) winningToken = 'yes';
    else if (winId === 'no' || winId === 0 || winId?.no !== undefined) winningToken = 'no';
  }

  // Use publicKey for both publicKey and id fields since we need the base58 string for routing
  const marketPublicKey = rawMarket.publicKey?.toString?.() ?? rawMarket.publicKey ?? rawMarket.address ?? '';

  // Extract version from raw market data - default to 2 for V2 markets
  const version = (rawMarket.version ?? 2) as 1 | 2 | 3;

  return {
    publicKey: marketPublicKey,
    id: marketPublicKey, // Use publicKey string instead of numeric id for routing
    question: rawMarket.question || '',
    category: rawMarket.category || 'general',
    creator: rawMarket.creator?.toString?.() ?? String(rawMarket.creator ?? ''),
    yesTokenMint: yesTokenMintValue?.toString?.() ?? String(yesTokenMintValue ?? ''),
    noTokenMint: noTokenMintValue?.toString?.() ?? String(noTokenMintValue ?? ''),
    baseMint: collateralTokenValue?.toString?.() ?? String(collateralTokenValue ?? ''),
    yesTokenSupply: yesSupply,
    noTokenSupply: noSupply,
    marketReserves: marketReservesValue?.toString?.() ?? String(marketReservesValue ?? '0'),
    initialLiquidity: initialLiquidityValue?.toString?.() ?? String(initialLiquidityValue ?? '0'),
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
    version,
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
