'use client';

import { Connection, Transaction } from '@solana/web3.js';
import {
  createMarketV2,
  createMarketV3,
  mintYesTokenV2,
  mintNoTokenV2,
  burnYesTokenV2,
  burnNoTokenV2,
  buyYesTokenV3,
  buyNoTokenV3,
  redeemPositionV2,
  redeemPositionV3,
  getMarketData,
  getPrice,
  getSlippage,
  getBurnSlippage,
  getUSDCBalance,
  getMarketVersion,
  DEFAULT_MAX_POT_RATIO,
  setNetwork,
  type Side,
  type MarketVersion,
} from 'pnp-adapter';

// Get the network from environment (defaults to mainnet)
const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'devnet';

// Set network BEFORE any other operations
setNetwork(network);

// Collateral mint addresses per network
const COLLATERAL_MINTS = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'devnet': 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
};

// Get the correct collateral mint for current network
export const COLLATERAL_MINT = COLLATERAL_MINTS[network];

// Wallet interface compatible with Privy's useSolanaWallets
export interface PNPWallet {
  address: string;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

// Connection singleton
let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
    }
    connectionInstance = new Connection(rpcUrl, 'confirmed');
  }
  return connectionInstance;
}

// Re-export constants
export { DEFAULT_MAX_POT_RATIO };

// Market creation parameters
export interface CreateMarketV2Params {
  question: string;
  initialLiquidity: number; // In USDC (will be converted to base units)
  endTime: Date;
  yesOddsBps?: number; // Optional starting odds (100-9900, default 5000 = 50/50)
}

export interface CreateMarketV3Params {
  question: string;
  amount: number; // In USDC
  side: 'yes' | 'no';
  creatorSideCap?: number; // In USDC
  endTime: Date;
  yesOddsBps?: number;
}

// Trade parameters
export interface TradeParams {
  marketAddress: string;
  amount: number; // In USDC for buy, in tokens for sell
  creatorAddress: string;
}

// Slippage result
export interface SlippageResult {
  tokensOut: number;
  priceImpact: number;
}

// === MARKET CREATION ===

export interface CreateMarketResult {
  txSig: string;
  marketAddress: string;
}

export async function createV2Market(
  wallet: PNPWallet,
  params: CreateMarketV2Params
): Promise<CreateMarketResult> {
  const connection = getConnection();

  const result = await createMarketV2(connection, wallet, {
    question: params.question,
    initialLiquidity: Math.floor(params.initialLiquidity * 1_000_000), // Convert to 6 decimals
    endTime: Math.floor(params.endTime.getTime() / 1000), // Unix seconds
    collateralMint: COLLATERAL_MINT,
    yesOddsBps: params.yesOddsBps ?? 5000, // Default 50/50
  }) as unknown as CreateMarketResult;

  return result;
}

export async function createV3Market(
  wallet: PNPWallet,
  params: CreateMarketV3Params
): Promise<CreateMarketResult> {
  const connection = getConnection();

  const result = await createMarketV3(connection, wallet, {
    question: params.question,
    amount: Math.floor(params.amount * 1_000_000),
    side: params.side,
    creatorSideCap: params.creatorSideCap
      ? Math.floor(params.creatorSideCap * 1_000_000)
      : Math.floor(params.amount * 5 * 1_000_000), // Default 5x
    endTime: Math.floor(params.endTime.getTime() / 1000),
    maxPotRatio: DEFAULT_MAX_POT_RATIO,
    collateralMint: COLLATERAL_MINT,
    yesOddsBps: params.yesOddsBps ?? 5000,
  }) as unknown as CreateMarketResult;

  return result;
}

// === TRADING (V2) ===

export async function buyYesTokenV2(
  wallet: PNPWallet,
  marketAddress: string,
  usdcAmount: number,
  creatorAddress: string
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(usdcAmount * 1_000_000);

  const signature = await mintYesTokenV2(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits,
    creatorAddress
  );

  return signature;
}

export async function buyNoTokenV2(
  wallet: PNPWallet,
  marketAddress: string,
  usdcAmount: number,
  creatorAddress: string
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(usdcAmount * 1_000_000);

  const signature = await mintNoTokenV2(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits,
    creatorAddress
  );

  return signature;
}

export async function sellYesTokenV2(
  wallet: PNPWallet,
  marketAddress: string,
  tokenAmount: number,
  creatorAddress: string
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(tokenAmount * 1_000_000);

  const signature = await burnYesTokenV2(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits,
    creatorAddress
  );

  return signature;
}

export async function sellNoTokenV2(
  wallet: PNPWallet,
  marketAddress: string,
  tokenAmount: number,
  creatorAddress: string
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(tokenAmount * 1_000_000);

  const signature = await burnNoTokenV2(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits,
    creatorAddress
  );

  return signature;
}

// === TRADING (V3) ===

export async function buyYesV3(
  wallet: PNPWallet,
  marketAddress: string,
  usdcAmount: number
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(usdcAmount * 1_000_000);

  const result = await buyYesTokenV3(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits
  );

  return result.txSig;
}

export async function buyNoV3(
  wallet: PNPWallet,
  marketAddress: string,
  usdcAmount: number
): Promise<string> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(usdcAmount * 1_000_000);

  const result = await buyNoTokenV3(
    connection,
    wallet,
    marketAddress,
    amountBaseUnits
  );

  return result.txSig;
}

// === REDEMPTION ===

export async function redeemV2Position(
  wallet: PNPWallet,
  marketAddress: string,
  marketCreatorAddress: string,
  yesTokenAddress: string,
  noTokenAddress: string
): Promise<string> {
  const connection = getConnection();

  const signature = await redeemPositionV2(connection, wallet, {
    marketAddress,
    marketCreatorAddress,
    yesTokenAddress,
    noTokenAddress,
  });

  return signature;
}

export async function redeemV3Position(
  wallet: PNPWallet,
  marketAddress: string
): Promise<string> {
  const connection = getConnection();

  const signature = await redeemPositionV3(connection, wallet, {
    marketAddress,
  });

  return signature;
}

// === QUERY FUNCTIONS ===

export async function fetchMarketData(marketAddress: string) {
  const connection = getConnection();
  return getMarketData(connection, marketAddress);
}

export async function fetchTokenPrice(
  marketAddress: string,
  tokenType: 'yes' | 'no'
): Promise<number> {
  const connection = getConnection();
  return getPrice(connection, marketAddress, tokenType);
}

export async function fetchMarketVersion(
  marketAddress: string
): Promise<MarketVersion> {
  const connection = getConnection();
  return getMarketVersion(connection, marketAddress);
}

export async function calculateMintSlippage(
  marketAddress: string,
  usdcAmount: number,
  tokenType: 'yes' | 'no'
): Promise<SlippageResult> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(usdcAmount * 1_000_000);

  const result = await getSlippage(
    connection,
    marketAddress,
    amountBaseUnits,
    tokenType
  );

  return {
    tokensOut: result.tokensToMint / 1_000_000, // Convert from base units
    priceImpact: result.priceImpact,
  };
}

export async function calculateBurnSlippage(
  marketAddress: string,
  tokenAmount: number,
  tokenType: 'yes' | 'no'
): Promise<{ collateralOut: number; priceImpact: number }> {
  const connection = getConnection();
  const amountBaseUnits = Math.floor(tokenAmount * 1_000_000);

  const result = await getBurnSlippage(
    connection,
    marketAddress,
    amountBaseUnits,
    tokenType
  );

  return {
    collateralOut: result.collateralOut / 1_000_000,
    priceImpact: result.priceImpact,
  };
}

export async function fetchUSDCBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();
  const balance = await getUSDCBalance(connection, walletAddress);
  return balance / 1_000_000; // Convert from base units to USDC
}
