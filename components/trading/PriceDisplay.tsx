import { Card } from '@/components/ui/card';
import type { Market } from '@/types/market';
import { formatPrice, formatPercent } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  market: Market;
}

export default function PriceDisplay({ market }: PriceDisplayProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Current Prices</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* YES Price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">YES</span>
            <TrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {formatPrice(market.currentYesPrice)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPercent(market.currentYesPrice * 100, { decimals: 1 })}
          </div>
        </div>

        {/* NO Price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">NO</span>
            <TrendingDown className="size-4 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {formatPrice(market.currentNoPrice)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPercent(market.currentNoPrice * 100, { decimals: 1 })}
          </div>
        </div>
      </div>
    </Card>
  );
}
