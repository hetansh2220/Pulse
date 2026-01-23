import { useQuery } from '@tanstack/react-query';
import type { Market, MarketFilters, MarketListResponse } from '@/types/market';
import { STALE_TIME_MARKETS, REFETCH_INTERVAL_MARKETS } from '@/lib/constants';

async function fetchMarkets(filters?: MarketFilters): Promise<MarketListResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const url = `/api/markets?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch markets');
  }

  return response.json();
}

export function useMarkets(filters?: MarketFilters) {
  return useQuery<MarketListResponse, Error>({
    queryKey: ['markets', filters],
    queryFn: () => fetchMarkets(filters),
    staleTime: STALE_TIME_MARKETS,
    refetchInterval: REFETCH_INTERVAL_MARKETS,
  });
}
