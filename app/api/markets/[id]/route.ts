import { NextRequest } from 'next/server';
import { fetchMarket, transformMarketData } from '@/lib/pnp-client';
import { getPrice } from 'pnp-adapter';
import { Connection } from '@solana/web3.js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketId } = await params;

    if (!marketId) {
      return Response.json({ error: 'Market ID is required' }, { status: 400 });
    }

    // Fetch market using pnp-adapter (respects network configuration)
    const rawMarket = await fetchMarket(marketId);

    if (!rawMarket) {
      return Response.json({ error: 'Market not found' }, { status: 404 });
    }

    // Fetch real prices from pnp-adapter
    let realPrices: { yesPrice?: number; noPrice?: number } = {};
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
      if (rpcUrl) {
        const connection = new Connection(rpcUrl, 'confirmed');
        const yesPrice = await getPrice(connection, marketId, 'yes');
        const noPrice = await getPrice(connection, marketId, 'no');
        realPrices = { yesPrice, noPrice };
      }
    } catch (priceError) {
      console.warn('Could not fetch real prices, using calculated prices:', priceError);
    }

    // Transform raw market data with real prices
    const market = transformMarketData({
      ...rawMarket.account,
      publicKey: rawMarket.publicKey,
      address: rawMarket.publicKey,
      realYesPrice: realPrices.yesPrice,
      realNoPrice: realPrices.noPrice,
    });

    return Response.json({ market });
  } catch (error) {
    const { id: marketId } = await params;
    console.error(`Error fetching market ${marketId}:`, error);
    return Response.json(
      {
        error: 'Failed to fetch market',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Force dynamic rendering (don't execute at build time)
export const dynamic = 'force-dynamic';
