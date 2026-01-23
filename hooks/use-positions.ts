import { useQuery } from '@tanstack/react-query';
import type { PositionsResponse } from '@/types/position';
import { STALE_TIME_POSITIONS, REFETCH_INTERVAL_POSITIONS } from '@/lib/constants';

async function fetchPositions(): Promise<PositionsResponse> {
  const response = await fetch('/api/positions');

  if (!response.ok) {
    throw new Error('Failed to fetch positions');
  }

  return response.json();
}

export function usePositions() {
  return useQuery<PositionsResponse, Error>({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: STALE_TIME_POSITIONS,
    refetchInterval: REFETCH_INTERVAL_POSITIONS,
  });
}
