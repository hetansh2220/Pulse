import { NextRequest } from 'next/server';
import { createReadClient, transformMarketData, filterMarketsByCategory, filterMarketsByStatus, searchMarkets } from '@/lib/pnp-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create read-only PNP client
    const client = createReadClient();

    // Fetch all markets from PNP SDK
    const response = await client.fetchMarkets();

    // Transform raw market data to our Market type
    const allMarkets = response.data.map((item) =>
      transformMarketData({
        ...item.account,
        publicKey: item.publicKey,
        address: item.publicKey,
      })
    );

    // Apply filters
    let filteredMarkets = allMarkets;

    if (category && category !== 'all') {
      filteredMarkets = filterMarketsByCategory(filteredMarkets, category);
    }

    if (status && status !== 'all') {
      filteredMarkets = filterMarketsByStatus(filteredMarkets, status);
    }

    if (search) {
      filteredMarkets = searchMarkets(filteredMarkets, search);
    }

    // Apply pagination
    const total = filteredMarkets.length;
    const paginatedMarkets = filteredMarkets.slice(offset, offset + limit);

    return Response.json({
      markets: paginatedMarkets,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return Response.json(
      {
        error: 'Failed to fetch markets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Force dynamic rendering (don't execute at build time)
export const dynamic = 'force-dynamic';
