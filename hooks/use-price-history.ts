import { useQuery } from '@tanstack/react-query';
import type { TransformedPriceHistory } from '@/types/price-history';

const STALE_TIME_PRICE_HISTORY = 60_000; // 1 minute
const REFETCH_INTERVAL_PRICE_HISTORY = 120_000; // 2 minutes

async function fetchPriceHistory(marketId: string): Promise<TransformedPriceHistory> {
  const response = await fetch(`/api/markets/${marketId}/price-history`);

  if (!response.ok) {
    throw new Error('Failed to fetch price history');
  }

  return response.json();
}

export function usePriceHistory(marketId: string) {
  return useQuery<TransformedPriceHistory, Error>({
    queryKey: ['price-history', marketId],
    queryFn: () => fetchPriceHistory(marketId),
    staleTime: STALE_TIME_PRICE_HISTORY,
    refetchInterval: REFETCH_INTERVAL_PRICE_HISTORY,
    enabled: !!marketId,
  });
}
