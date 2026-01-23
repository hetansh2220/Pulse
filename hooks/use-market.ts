import { useQuery } from '@tanstack/react-query';
import type { Market } from '@/types/market';
import { STALE_TIME_MARKET, REFETCH_INTERVAL_MARKET } from '@/lib/constants';

async function fetchMarket(id: string): Promise<Market> {
  const response = await fetch(`/api/markets/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch market');
  }

  const data = await response.json();
  return data.market;
}

export function useMarket(id: string) {
  return useQuery<Market, Error>({
    queryKey: ['market', id],
    queryFn: () => fetchMarket(id),
    staleTime: STALE_TIME_MARKET,
    refetchInterval: REFETCH_INTERVAL_MARKET,
    enabled: !!id, // Only fetch if id is provided
  });
}
