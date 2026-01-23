import { Card } from '@/components/ui/card';
import type { Market } from '@/types/market';
import { formatUsdc, formatDateTime, formatAddress } from '@/lib/format';
import { TrendingUp, DollarSign, Clock, User } from 'lucide-react';

interface MarketStatsProps {
  market: Market;
}

export default function MarketStats({ market }: MarketStatsProps) {
  const stats = [
    {
      icon: TrendingUp,
      label: 'Volume',
      value: formatUsdc(market.volume),
    },
    {
      icon: DollarSign,
      label: 'Liquidity',
      value: formatUsdc(market.marketReserves),
    },
    {
      icon: Clock,
      label: 'Ends',
      value: formatDateTime(market.endTime),
    },
    {
      icon: User,
      label: 'Creator',
      value: formatAddress(market.creator),
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Market Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                <span>{stat.label}</span>
              </div>
              <div className="font-medium">{stat.value}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
