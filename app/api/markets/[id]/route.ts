import { NextRequest } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { createReadClient, transformMarketData } from '@/lib/pnp-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketId } = await params;

    if (!marketId) {
      return Response.json({ error: 'Market ID is required' }, { status: 400 });
    }

    // Create read-only PNP client
    const client = createReadClient();

    // Fetch specific market from PNP SDK
    // Convert marketId string to PublicKey
    const marketPublicKey = new PublicKey(marketId);
    const rawMarket = await client.fetchMarket(marketPublicKey);

    if (!rawMarket) {
      return Response.json({ error: 'Market not found' }, { status: 404 });
    }

    // Transform raw market data
    const market = transformMarketData({
      ...rawMarket.account,
      publicKey: rawMarket.publicKey.toString(),
      address: rawMarket.publicKey.toString(),
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
