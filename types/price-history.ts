export interface PriceHistoryEntry {
  price: string;
  timestamp: string;
  trade_type: 'BUY_YES' | 'SELL_YES' | 'BUY_NO' | 'SELL_NO';
}

export interface TokenPriceHistory {
  price_history: PriceHistoryEntry[];
}

export interface PriceHistoryResponse {
  yes_token: TokenPriceHistory;
  no_token: TokenPriceHistory;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  yesPrice: number;
  noPrice: number;
}

export interface TransformedPriceHistory {
  data: ChartDataPoint[];
  minPrice: number;
  maxPrice: number;
}
