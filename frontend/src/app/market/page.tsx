'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, TrendingUp, BarChart3, LineChart as LineChartIcon, Activity, IndianRupee } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Market Intelligence Network</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Market Signals</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Live commodity snapshots, trending movement vectors, and localized mandi reference points.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
        >
          <RefreshCw className={`w-4 h-4 ${commodities.loading || trending.loading || mandi.loading ? 'animate-spin' : ''}`} />
          Sync Market
        </button>
      </div>

      {commodities.error || trending.error || mandi.error ? (
        <ErrorBanner
          message={`${commodities.error ? `Commodities: ${commodities.error}` : ''}${commodities.error && (trending.error || mandi.error) ? ' | ' : ''}${trending.error ? `Trending: ${trending.error}` : ''}${trending.error && mandi.error ? ' | ' : ''}${mandi.error ? `Mandi: ${mandi.error}` : ''}`}
          onRetry={refreshAll}
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COMMODITY PRICES */}
        <div className="xl:col-span-2 bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" /> Commodity Benchmark
          </h2>
          <p className="text-sm text-gray-500 mb-6">Price index mapped across primary tracked assets.</p>
          
          <div className="h-[320px] w-full flex-1">
            {commodities.loading ? <div className="h-full animate-pulse rounded-2xl bg-gray-50 border dashed border-gray-200" /> : null}
            {!commodities.loading && commodityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commodityChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(47, 133, 90, 0.05)' }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    formatter={(val: any) => [`₹${val}`, 'Price']}
                  />
                  <Bar dataKey="price" radius={[12, 12, 0, 0]} maxBarSize={60}>
                    {commodityChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#10b981' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
            {!commodities.loading && !commodityChartData.length ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                <span className="text-sm font-bold text-gray-400">Benchmark Data Offline</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* TRENDING PULSE */}
        <div className="bg-gradient-to-br from-[#1b241d] to-gray-800 rounded-[32px] p-6 lg:p-8 text-white shadow-[0_12px_32px_rgba(27,36,29,0.15)] flex flex-col relative overflow-hidden">
          <Activity className="absolute -right-8 -top-8 w-48 h-48 text-white/5 pointer-events-none" />
          
          <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2 mb-2 relative z-10">
            <LineChartIcon className="w-5 h-5 text-emerald-400" /> Momentum
          </h2>
          <p className="text-sm text-gray-400 mb-6 relative z-10">Rate of change for highly active assets.</p>
          
          <div className="h-[320px] w-full flex-1 relative z-10">
            {trending.loading ? <div className="h-full animate-pulse rounded-2xl bg-white/10" /> : null}
            {!trending.loading && trendingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendingChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} width={90} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontWeight: 'bold', background: '#fff', color: '#000' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Change']}
                  />
                  <Bar dataKey="change" radius={[0, 8, 8, 0]} barSize={25}>
                    {trendingChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.change >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
            {!trending.loading && !trendingChartData.length ? (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/20 rounded-3xl">
                <span className="text-sm font-bold text-gray-400">Momentum Offline</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* MANDI SPREAD */}
      <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-blue-500" /> Regional Mandi Spread
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-8">Visualization of minimum, modal, and maximum market evaluations.</p>
        
        <div className="h-[320px] w-full">
          {mandi.loading ? <div className="h-full animate-pulse rounded-2xl bg-gray-50 border dashed border-gray-200" /> : null}
          {!mandi.loading && mandiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mandiChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="min" fill="#bfdbfe" radius={[8, 8, 0, 0]} maxBarSize={30} name="Min Price" />
                <Bar dataKey="modal" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={30} name="Modal Price" />
                <Bar dataKey="max" fill="#1e3a8a" radius={[8, 8, 0, 0]} maxBarSize={30} name="Max Price" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
          {!mandi.loading && !mandiChartData.length ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl">
              <span className="text-sm font-bold text-gray-400">Mandi Spread Unavailable</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
