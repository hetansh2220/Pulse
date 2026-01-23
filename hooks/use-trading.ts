import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BuyTokensParams {
  marketId: string;
  tokenType: 'yes' | 'no';
  amount: number;
  slippage?: number;
}

interface BuyTokensResponse {
  success: boolean;
  signature?: string;
  tokensReceived?: string;
  effectivePrice?: number;
  error?: string;
  message?: string;
}

interface SellTokensParams {
  marketId: string;
  tokenType: 'yes' | 'no';
  amount: number;
  slippage?: number;
}

interface SellTokensResponse {
  success: boolean;
  signature?: string;
  usdcReceived?: string;
  effectivePrice?: number;
  error?: string;
  message?: string;
}

async function buyTokens(params: BuyTokensParams): Promise<BuyTokensResponse> {
  const response = await fetch('/api/trading/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to execute trade');
  }

  return data;
}

async function sellTokens(params: SellTokensParams): Promise<SellTokensResponse> {
  const response = await fetch('/api/trading/sell', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to execute sell');
  }

  return data;
}

export function useTradingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buyTokens,
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Trade executed successfully!', {
          description: `Bought ${variables.tokenType.toUpperCase()} tokens`,
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
        queryClient.invalidateQueries({ queryKey: ['markets'] });
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      } else {
        toast.error(data.error || 'Trade failed', {
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Trade failed', {
        description: error.message,
      });
    },
  });
}

export function useSellMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellTokens,
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Sell executed successfully!', {
          description: `Sold ${variables.tokenType.toUpperCase()} tokens`,
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
        queryClient.invalidateQueries({ queryKey: ['markets'] });
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      } else {
        toast.error(data.error || 'Sell failed', {
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Sell failed', {
        description: error.message,
      });
    },
  });
}
