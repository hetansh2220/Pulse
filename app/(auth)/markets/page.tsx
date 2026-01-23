'use client';

import { useState } from 'react';
import { useMarkets } from '@/hooks/use-markets';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MARKET_CATEGORIES, MARKET_STATUS } from '@/lib/constants';
import type { MarketCategory } from '@/lib/constants';
import { Search, RefreshCw, LayoutGrid, Filter, CalendarIcon, X } from 'lucide-react';
import MarketCard from '@/components/markets/MarketCard';
import { format } from 'date-fns';

export default function MarketsPage() {
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const { data, isLoading, error, refetch } = useMarkets({
    category: category !== 'all' ? (category as MarketCategory) : undefined,
    status: status !== 'all' ? (status as 'active' | 'ended' | 'resolved' | 'upcoming') : undefined,
    search: debouncedSearch || undefined,
  });

  // Console log all market data
  if (data?.markets) {
    console.log('=== ALL MARKET DATA ===');
    console.log('Total markets:', data.total);
    data.markets.forEach((market, index) => {
      console.log(`\n--- Market ${index + 1} ---`);
      console.log(JSON.stringify(market, null, 2));
    });
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Filter markets by end date if date filter is set
  const filteredMarkets = data?.markets.filter((market) => {
    if (!dateFilter) return true;
    const marketEndDate = new Date(market.endTime);
    const filterDate = new Date(dateFilter);
    // Show markets ending on or before the selected date
    return marketEndDate.toDateString() === filterDate.toDateString() ||
           marketEndDate <= filterDate;
  }) || [];

  const clearFilters = () => {
    setCategory('all');
    setStatus('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setDateFilter(undefined);
  };

  const hasActiveFilters = category !== 'all' || status !== 'all' || debouncedSearch || dateFilter;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-[#ff4757] mb-4 font-mono">Failed to load markets</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#c8ff00]/20 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-colors rounded-lg"
        >
          <RefreshCw className="size-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 bg-[#c8ff00]/10 border border-[#c8ff00]/20 rounded-lg flex items-center justify-center">
            <LayoutGrid className="size-5 text-[#c8ff00]" />
          </div>
          <div>
            <p className="text-xs font-mono text-[#c8ff00] uppercase tracking-wider">// Explore</p>
            <h1 className="text-2xl font-bold">Prediction Markets</h1>
          </div>
        </div>
        <p className="text-[#6b6b7b] mt-2">
          Trade on real-world events. Buy YES or NO and profit from correct predictions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6b6b7b]" />
          <Input
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-11 h-11 bg-[#12121a] border-[#1e1e2e] focus:border-[#c8ff00]/30 text-[#e8e8e8] placeholder:text-[#6b6b7b] rounded-lg"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b6b7b] pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 pl-10 pr-4 bg-[#12121a] border border-[#1e1e2e] text-[#e8e8e8] rounded-lg appearance-none cursor-pointer focus:border-[#c8ff00]/30 focus:outline-none text-sm"
            >
              <option value="all">All Categories</option>
              {MARKET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 px-4 bg-[#12121a] border border-[#1e1e2e] text-[#e8e8e8] rounded-lg appearance-none cursor-pointer focus:border-[#c8ff00]/30 focus:outline-none text-sm"
          >
            <option value="all">All Status</option>
            {MARKET_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-11 px-4 bg-[#12121a] border-[#1e1e2e] hover:bg-[#1a1a24] hover:border-[#c8ff00]/30 text-sm rounded-lg ${
                  dateFilter ? 'text-[#c8ff00] border-[#c8ff00]/30' : 'text-[#6b6b7b]'
                }`}
              >
                <CalendarIcon className="size-4 mr-2" />
                {dateFilter ? format(dateFilter, 'MMM d, yyyy') : 'End Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#12121a] border-[#1e1e2e]" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                autoFocus
                className="bg-[#12121a]"
              />
              {dateFilter && (
                <div className="p-2 border-t border-[#1e1e2e]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter(undefined)}
                    className="w-full text-[#6b6b7b] hover:text-[#e8e8e8]"
                  >
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-11 w-11 bg-[#12121a] border border-[#1e1e2e] hover:bg-[#ff4757]/10 hover:border-[#ff4757]/30 rounded-lg"
            >
              <X className="size-4 text-[#ff4757]" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {data && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono text-[#6b6b7b]">
            {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'} found
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-[#6b6b7b] hover:text-[#c8ff00] transition-colors flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
      )}

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden animate-pulse">
              <div className="h-36 bg-[#1a1a24]" />
              <div className="p-4 space-y-4">
                <div className="h-4 bg-[#1a1a24] w-3/4 rounded" />
                <div className="h-4 bg-[#1a1a24] w-1/2 rounded" />
                <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-[#1a1a24] rounded-lg" />
                  <div className="flex-1 h-12 bg-[#1a1a24] rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMarkets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <LayoutGrid className="size-12 mx-auto mb-4 text-[#6b6b7b]/30" />
          <p className="text-[#6b6b7b] font-mono">No markets found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#c8ff00] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
