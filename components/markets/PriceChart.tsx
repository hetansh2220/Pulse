'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { usePriceHistory } from '@/hooks/use-price-history';
import type { ChartDataPoint } from '@/types/price-history';
import { Loader2 } from 'lucide-react';

interface PriceChartProps {
  marketId: string;
  currentYesPrice: number;
  currentNoPrice: number;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'ALL' },
];

function filterByTimeRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
  if (range === 'all' || data.length === 0) return data;

  const now = Date.now();
  const msPerHour = 60 * 60 * 1000;
  const msPerDay = 24 * msPerHour;

  let cutoff: number;
  switch (range) {
    case '24h':
      cutoff = now - msPerDay;
      break;
    case '7d':
      cutoff = now - 7 * msPerDay;
      break;
    case '30d':
      cutoff = now - 30 * msPerDay;
      break;
    default:
      return data;
  }

  return data.filter((d) => d.timestamp >= cutoff);
}

function formatXAxisTick(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp);

  switch (range) {
    case '24h':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    case '7d':
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case '30d':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'all':
      return date.toLocaleDateString('en-US', { month: 'short' });
    default:
      return '';
  }
}

function formatTooltipTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !label) return null;

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-3 shadow-lg">
      <p className="text-[10px] font-mono text-[#6b6b7b] mb-2">{formatTooltipTime(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono text-[#6b6b7b]">
            {entry.dataKey === 'yesPrice' ? 'YES' : 'NO'}:
          </span>
          <span className="font-mono font-medium" style={{ color: entry.color }}>
            ${entry.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PriceChart({ marketId, currentYesPrice, currentNoPrice }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const { data: priceHistory, isLoading, error } = usePriceHistory(marketId);

  // Filter data by time range
  const filteredData = priceHistory?.data
    ? filterByTimeRange(priceHistory.data, timeRange)
    : [];

  // Add current price as last point if we have data
  const chartData = filteredData.length > 0
    ? [
        ...filteredData,
        {
          timestamp: Date.now(),
          date: new Date().toISOString(),
          yesPrice: currentYesPrice,
          noPrice: currentNoPrice,
        },
      ]
    : [
        // If no history, show just the current price
        {
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          yesPrice: currentYesPrice,
          noPrice: currentNoPrice,
        },
        {
          timestamp: Date.now(),
          date: new Date().toISOString(),
          yesPrice: currentYesPrice,
          noPrice: currentNoPrice,
        },
      ];

  return (
    <div className="w-full">
      {/* Time Range Selector */}
      <div className="flex items-center justify-end gap-1 mb-4">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${
              timeRange === range.value
                ? 'bg-[#c8ff00] text-[#0a0a0f]'
                : 'bg-[#1a1a24] text-[#6b6b7b] hover:text-white'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative h-64 bg-[#0a0a0f] rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/80 z-10">
            <Loader2 className="size-6 animate-spin text-[#c8ff00]" />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[#6b6b7b]">Unable to load price history</p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a2a3a"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              stroke="#6b6b7b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              tickFormatter={(value) => formatXAxisTick(value, timeRange)}
              minTickGap={50}
            />
            <YAxis
              stroke="#6b6b7b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 50% reference line */}
            <ReferenceLine
              y={0.5}
              stroke="#3a3a4a"
              strokeDasharray="3 3"
            />

            {/* YES Line */}
            <Line
              type="monotone"
              dataKey="yesPrice"
              stroke="#2ed573"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: '#2ed573',
                strokeWidth: 2,
                fill: '#0a0a0f',
              }}
            />

            {/* NO Line */}
            <Line
              type="monotone"
              dataKey="noPrice"
              stroke="#ff4757"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: '#ff4757',
                strokeWidth: 2,
                fill: '#0a0a0f',
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Current Price Labels */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium"
            style={{
              backgroundColor: 'rgba(46, 213, 115, 0.2)',
              color: '#2ed573',
              transform: `translateY(${(0.5 - currentYesPrice) * 200}px)`,
            }}
          >
            <span className="size-2 rounded-full bg-[#2ed573]" />
            ${currentYesPrice.toFixed(4)}
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium"
            style={{
              backgroundColor: 'rgba(255, 71, 87, 0.2)',
              color: '#ff4757',
              transform: `translateY(${(0.5 - currentNoPrice) * 200}px)`,
            }}
          >
            <span className="size-2 rounded-full bg-[#ff4757]" />
            ${currentNoPrice.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#2ed573]" />
          <span className="text-[#6b6b7b]">YES</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#ff4757]" />
          <span className="text-[#6b6b7b]">NO</span>
        </div>
      </div>
    </div>
  );
}
