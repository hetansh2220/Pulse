import { NextRequest } from 'next/server';
import type { PriceHistoryResponse, ChartDataPoint, TransformedPriceHistory } from '@/types/price-history';

const INDEXER_BASE_URL = 'https://userdbindexer-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketId } = await params;

    if (!marketId) {
      return Response.json({ error: 'Market ID is required' }, { status: 400 });
    }

    // Fetch price history from the PNP indexer
    const response = await fetch(
      `${INDEXER_BASE_URL}/api/markets/${marketId}/price-history`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json({ error: 'Market not found' }, { status: 404 });
      }
      throw new Error(`Indexer returned ${response.status}`);
    }

    const rawData: PriceHistoryResponse = await response.json();

    // Transform the data for the chart
    const transformed = transformPriceHistory(rawData);

    return Response.json(transformed);
  } catch (error) {
    const { id: marketId } = await params;
    console.error(`Error fetching price history for ${marketId}:`, error);
    return Response.json(
      {
        error: 'Failed to fetch price history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function transformPriceHistory(raw: PriceHistoryResponse): TransformedPriceHistory {
  // Combine YES and NO price histories
  const yesHistory = raw.yes_token?.price_history || [];
  const noHistory = raw.no_token?.price_history || [];

  // Create a map of timestamps to prices
  const priceMap = new Map<number, { yesPrice?: number; noPrice?: number }>();

  // Process YES token history
  for (const entry of yesHistory) {
    const timestamp = new Date(entry.timestamp).getTime();
    const price = parseFloat(entry.price);
    // Price seems to be in percentage (0-100), convert to decimal (0-1)
    const normalizedPrice = price > 1 ? price / 100 : price;

    const existing = priceMap.get(timestamp) || {};
    priceMap.set(timestamp, { ...existing, yesPrice: normalizedPrice });
  }

  // Process NO token history
  for (const entry of noHistory) {
    const timestamp = new Date(entry.timestamp).getTime();
    const price = parseFloat(entry.price);
    const normalizedPrice = price > 1 ? price / 100 : price;

    const existing = priceMap.get(timestamp) || {};
    priceMap.set(timestamp, { ...existing, noPrice: normalizedPrice });
  }

  // Sort by timestamp and convert to array
  const sortedTimestamps = Array.from(priceMap.keys()).sort((a, b) => a - b);

  let lastYesPrice = 0.5;
  let lastNoPrice = 0.5;
  let minPrice = 1;
  let maxPrice = 0;

  const data: ChartDataPoint[] = sortedTimestamps.map((timestamp) => {
    const prices = priceMap.get(timestamp)!;

    // Use last known price if not available
    const yesPrice = prices.yesPrice ?? lastYesPrice;
    const noPrice = prices.noPrice ?? lastNoPrice;

    lastYesPrice = yesPrice;
    lastNoPrice = noPrice;

    // Track min/max
    minPrice = Math.min(minPrice, yesPrice, noPrice);
    maxPrice = Math.max(maxPrice, yesPrice, noPrice);

    return {
      timestamp,
      date: new Date(timestamp).toISOString(),
      yesPrice,
      noPrice,
    };
  });

  // If no data, return empty with defaults
  if (data.length === 0) {
    return {
      data: [],
      minPrice: 0,
      maxPrice: 1,
    };
  }

  return {
    data,
    minPrice: Math.max(0, minPrice - 0.05),
    maxPrice: Math.min(1, maxPrice + 0.05),
  };
}

export const dynamic = 'force-dynamic';
