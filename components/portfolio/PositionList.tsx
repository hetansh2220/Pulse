'use client';

import { useState } from 'react';
import { usePositions } from '@/hooks/use-positions';
import PositionCard from './PositionCard';
import { toast } from 'sonner';
import { Layers, Activity, CheckCircle, Inbox } from 'lucide-react';

export default function PositionList() {
  const { data, isLoading, error } = usePositions();
  const [redeemingMarketId, setRedeemingMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'settled'>('all');

  const handleRedeem = async (marketId: string) => {
    setRedeemingMarketId(marketId);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Position redeemed successfully!');
      } else {
        toast.error(result.error || 'Failed to redeem position', {
          description: result.message,
        });
      }
    } catch {
      toast.error('Failed to redeem position');
    } finally {
      setRedeemingMarketId(null);
    }
  };

  if (error) {
    return (
      <div className="text-center py-16 bg-[#12121a] border border-[#ff4757]/20">
        <div className="size-12 bg-[#ff4757]/10 mx-auto mb-4 flex items-center justify-center">
          <Inbox className="size-6 text-[#ff4757]" />
        </div>
        <p className="text-[#ff4757] font-mono">Failed to load positions</p>
        <p className="text-[#6b6b7b] text-sm mt-2">Please try again later</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-[#12121a] border border-[#c8ff00]/10 p-6 animate-pulse"
          >
            <div className="h-5 w-3/4 bg-[#1a1a24] mb-4" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-12 bg-[#1a1a24]" />
              <div className="h-12 bg-[#1a1a24]" />
            </div>
            <div className="h-px bg-[#c8ff00]/10 my-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-[#1a1a24]" />
              <div className="h-4 w-2/3 bg-[#1a1a24]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activePositions = data?.positions.filter((p) => !p.marketResolved) || [];
  const settledPositions = data?.positions.filter((p) => p.marketResolved) || [];

  const tabs = [
    { id: 'all' as const, label: 'All', count: data?.positions.length || 0, icon: Layers },
    { id: 'active' as const, label: 'Active', count: activePositions.length, icon: Activity },
    { id: 'settled' as const, label: 'Settled', count: settledPositions.length, icon: CheckCircle },
  ];

  const getFilteredPositions = () => {
    switch (activeTab) {
      case 'active':
        return activePositions;
      case 'settled':
        return settledPositions;
      default:
        return data?.positions || [];
    }
  };

  const filteredPositions = getFilteredPositions();

  const EmptyState = () => (
    <div className="text-center py-16 bg-[#12121a] border border-[#c8ff00]/10">
      <div className="size-16 bg-[#1a1a24] mx-auto mb-4 flex items-center justify-center">
        <Inbox className="size-8 text-[#6b6b7b]" />
      </div>
      <p className="text-[#e8e8e8] font-medium">
        {activeTab === 'all' ? 'No positions yet' :
         activeTab === 'active' ? 'No active positions' :
         'No settled positions'}
      </p>
      {activeTab === 'all' && (
        <p className="text-[#6b6b7b] text-sm mt-2 font-mono">
          Start trading to see your positions here
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-[#12121a] border border-[#c8ff00]/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-mono text-sm transition-all ${
                isActive
                  ? 'bg-[#c8ff00] text-[#0a0a0f]'
                  : 'text-[#6b6b7b] hover:text-[#e8e8e8] hover:bg-[#1a1a24]'
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 ${
                isActive ? 'bg-[#0a0a0f]/20' : 'bg-[#1a1a24]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Position Cards */}
      <div className="space-y-4">
        {filteredPositions.length > 0 ? (
          filteredPositions.map((position) => (
            <PositionCard
              key={position.marketId}
              position={position}
              onRedeem={handleRedeem}
              isRedeeming={redeemingMarketId === position.marketId}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
