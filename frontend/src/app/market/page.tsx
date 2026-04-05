'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import { useMandiData, useMarketCommodities, useTrendingCommodities } from '@/hooks/useApi';

export default function MarketPage() {
  const commodities = useMarketCommodities();
  const trending = useTrendingCommodities();
  const mandi = useMandiData();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const commodityChartData = useMemo(
    () => commodities.data?.items.slice(0, 6).map((item) => ({
      label: item.commodity,
      price: item.price,
      market: item.market,
    })) ?? [],
    [commodities.data?.items],
  );

  const trendingChartData = useMemo(
    () => trending.data?.items.slice(0, 6).map((item) => ({
      label: item.commodity,
      change: item.change_percent,
    })) ?? [],
    [trending.data?.items],
  );

  const mandiChartData = useMemo(
    () => mandi.data?.items.slice(0, 6).map((item) => ({
      label: item.commodity,
      min: item.min_price,
      modal: item.modal_price,
      max: item.max_price,
    })) ?? [],
    [mandi.data?.items],
  );

  const refreshAll = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    commodities.refetch();
    trending.refetch();
    mandi.refetch();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Market Signals</p>
          <h1 className="page-title gradient-text">Market Intelligence</h1>
          <p className="page-description mt-3">Commodity snapshots, trending movement, and mandi references.</p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main transition-colors hover:bg-white"
        >
          <RefreshCw size={14} className={commodities.loading || trending.loading || mandi.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {lastRefreshedAt ? <p className="text-xs text-foreground-dim">Refreshed at {lastRefreshedAt}</p> : null}

      {commodities.error || trending.error || mandi.error ? (
        <ErrorBanner
          message={`${commodities.error ? `Commodities: ${commodities.error}` : ''}${commodities.error && (trending.error || mandi.error) ? ' | ' : ''}${trending.error ? `Trending: ${trending.error}` : ''}${trending.error && mandi.error ? ' | ' : ''}${mandi.error ? `Mandi: ${mandi.error}` : ''}`}
          onRetry={refreshAll}
        />
      ) : null}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="feed-card xl:col-span-2">
          <div className="mb-4">
            <p className="section-heading mb-2">Commodity Prices</p>
            <p className="section-note">Tracked commodity prices across the current market snapshot.</p>
          </div>
          <div className="h-[320px]">
            {commodities.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!commodities.loading && commodityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commodityChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                  <XAxis dataKey="label" tick={{ fill: '#486151', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#486151', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                  <Bar dataKey="price" fill="#2f855a" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
            {!commodities.loading && !commodityChartData.length ? (
              <div className="empty-state h-full flex items-center justify-center">Commodity data unavailable.</div>
            ) : null}
          </div>
        </div>

        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Trending Pulse</p>
            <p className="section-note">Percentage change for the most active commodities.</p>
          </div>
          <div className="h-[320px]">
            {trending.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!trending.loading && trendingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendingChartData} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                  <XAxis type="number" tick={{ fill: '#486151', fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#486151', fontSize: 12 }} width={90} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                  <Bar dataKey="change" fill="#68c18a" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
            {!trending.loading && !trendingChartData.length ? (
              <div className="empty-state h-full flex items-center justify-center">Trending data unavailable.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="feed-card">
        <div className="mb-4">
          <p className="section-heading mb-2">Mandi Range</p>
          <p className="section-note">Minimum, modal, and maximum price ranges for recent mandi records.</p>
        </div>
        <div className="h-[320px]">
          {mandi.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
          {!mandi.loading && mandiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mandiChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                <XAxis dataKey="label" tick={{ fill: '#486151', fontSize: 12 }} />
                <YAxis tick={{ fill: '#486151', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(47, 133, 90, 0.16)',
                    background: 'rgba(255,255,255,0.96)',
                    boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                  }}
                />
                <Bar dataKey="min" fill="#c7e9d1" radius={[10, 10, 0, 0]} />
                <Bar dataKey="modal" fill="#2f855a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="max" fill="#1b241d" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
          {!mandi.loading && !mandiChartData.length ? (
            <div className="empty-state h-full flex items-center justify-center">Mandi data unavailable.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
