import { MarketCategory } from '@/lib/constants';

export interface Market {
  // Core identifiers
  publicKey: string;
  id: string;

  // Market details
  question: string;
  category: MarketCategory;
  creator: string;

  // Token information
  yesTokenMint: string;
  noTokenMint: string;
  baseMint: string; // Usually USDC

  // Market state
  yesTokenSupply: string;
  noTokenSupply: string;
  marketReserves: string;
  initialLiquidity: string;
  volume: string;

  // Pricing (from SDK getMarketPriceV2)
  currentYesPrice: number;
  currentNoPrice: number;
  yesMultiplier?: number; // Payout multiplier for YES
  noMultiplier?: number;  // Payout multiplier for NO

  // Time
  endTime: string; // ISO timestamp
  creationTime: string; // ISO timestamp

  // Resolution
  resolved: boolean;
  resolvable: boolean;
  winningToken?: 'yes' | 'no' | 'none';

  // Trading restrictions
  bufferPeriodActive: boolean;

  // Market version (1, 2, or 3)
  version: 1 | 2 | 3;
}

export interface MarketFilters {
  category?: MarketCategory;
  status?: 'active' | 'ended' | 'resolved' | 'upcoming';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MarketListResponse {
  markets: Market[];
  total: number;
}

export interface CreateMarketParams {
  question: string;
  category: MarketCategory;
  marketType: 'v2' | 'p2p';
  endTime: string; // ISO timestamp
  initialLiquidity: string; // USDC amount in base units (6 decimals)
}

export interface CreateMarketResponse {
  success: boolean;
  signature: string;
  marketPublicKey: string;
  yesTokenMint: string;
  noTokenMint: string;
}
