'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, IndianRupee, PieChart as PieChartIcon, TrendingUp, ShieldAlert, BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import { useFinancialSummary } from '@/hooks/useApi';

function formatInrCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function FinancialPage() {
  const summary = useFinancialSummary();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const financialChartData = useMemo(
    () => summary.data ? [
      { label: 'Revenue', value: summary.data.estimated_revenue_inr },
      { label: 'Payout', value: summary.data.estimated_cost_inr },
      { label: 'Reserve', value: summary.data.estimated_profit_inr },
    ] : [],
    [summary.data],
  );

  const marginBreakdown = useMemo(
    () => summary.data ? [
      { name: 'Margin', value: summary.data.margin_percent },
      { name: 'Utilization', value: Math.max(0, 100 - summary.data.margin_percent) },
    ] : [],
    [summary.data],
  );

  const refreshSummary = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    summary.refetch();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Financial Auditing</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Financial Insights</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Real-time analytics covering approved exposure, payout reserves, and margin health.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshSummary}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
        >
          <RefreshCw className={`w-4 h-4 ${summary.loading ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      {summary.error ? <ErrorBanner message={`Financial synchronization error: ${summary.error}`} onRetry={refreshSummary} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Exposure */}
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_24px_rgba(31,52,38,0.04)] hover:-translate-y-1 transition-transform">
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">Total Exposure</p>
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-5 h-5 text-gray-900 stroke-[3px]" />
            {summary.loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
            ) : (
              <span className="text-3xl font-extrabold text-gray-900">{summary.data ? formatInrCompact(summary.data.estimated_revenue_inr).replace('₹','') : '--'}</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2">Sum of covered assets</p>
        </div>

        {/* Expected Payout */}
        <div className="bg-white rounded-[24px] p-5 border border-amber-100/50 shadow-[0_4px_24px_rgba(245,158,11,0.04)] hover:-translate-y-1 transition-transform">
          <p className="text-[11px] font-bold tracking-widest text-amber-500/70 uppercase mb-2">Expected Payout</p>
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-5 h-5 text-amber-500 stroke-[3px]" />
            {summary.loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-amber-50" />
            ) : (
              <span className="text-3xl font-extrabold text-amber-500">{summary.data ? formatInrCompact(summary.data.estimated_cost_inr).replace('₹','') : '--'}</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2">Calculated obligation</p>
        </div>

        {/* Reserve */}
        <div className="bg-white rounded-[24px] p-5 border border-emerald-100/50 shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:-translate-y-1 transition-transform">
          <p className="text-[11px] font-bold tracking-widest text-emerald-500/70 uppercase mb-2">Safe Reserve</p>
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-5 h-5 text-emerald-500 stroke-[3px]" />
            {summary.loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-emerald-50" />
            ) : (
              <span className="text-3xl font-extrabold text-emerald-500">{summary.data ? formatInrCompact(summary.data.estimated_profit_inr).replace('₹','') : '--'}</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2">Post-payout buffer</p>
        </div>

        {/* Reserve Margin */}
        <div className="bg-gradient-to-br from-[#1b241d] to-gray-800 rounded-[24px] p-5 shadow-[0_12px_24px_rgba(27,36,29,0.15)] hover:-translate-y-1 transition-transform relative overflow-hidden">
          <BarChart3 className="absolute -right-4 -top-4 w-24 h-24 text-white/5 pointer-events-none" />
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2 relative z-10">Reserve Margin</p>
          <div className="flex items-center gap-1 mb-1 relative z-10">
            {summary.loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{summary.data ? summary.data.margin_percent.toFixed(1) : '--'}%</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2 relative z-10">System health index</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-2">
        {/* CLAIM COMPOSITION CHART */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Capital Allocation
          </h2>
          <p className="text-sm text-gray-500 mb-8">Aggregated fiscal flow representing total liability and retention.</p>
          
          <div className="h-[280px] w-full flex-1">
            {summary.loading ? (
              <div className="w-full h-full animate-pulse bg-gray-50 rounded-2xl" />
            ) : financialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis hide domain={[0, 'dataMax * 1.1']} />
                  <RechartsTooltip
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    cursor={{ fill: 'rgba(47, 133, 90, 0.05)' }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} maxBarSize={60}>
                    {financialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.label === 'Payout' ? '#f59e0b' : entry.label === 'Reserve' ? '#10b981' : '#1b241d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                <span className="text-sm font-bold text-gray-400">Data Unavailable</span>
              </div>
            )}
          </div>
        </div>

        {/* MARGIN PIE CHART */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col items-center">
          <div className="w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" /> Margin Capacity
            </h2>
            <p className="text-sm text-gray-500 mb-8">System's ability to cover expected payout obligations securely.</p>
          </div>
          
          <div className="h-[240px] w-full flex-1 relative flex items-center justify-center">
            {summary.loading ? (
              <div className="w-48 h-48 animate-pulse bg-gray-50 rounded-full" />
            ) : marginBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={marginBreakdown} dataKey="value" nameKey="name" innerRadius={80} outerRadius={110} paddingAngle={2} stroke="none">
                      {marginBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={index === 0 ? '#10b981' : '#f8fafc'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                      contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for the donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-emerald-500">
                    {summary.data?.margin_percent.toFixed(0)}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Margin</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                <span className="text-sm font-bold text-gray-400">Data Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[24px] border border-emerald-100 p-6 flex items-start gap-4 shadow-sm mt-2">
        <div className="bg-emerald-100/80 p-2.5 rounded-xl">
           <ShieldAlert className="w-6 h-6 text-emerald-700" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-900 mb-1">Fiscal Analysis Report</h3>
          {summary.loading ? (
            <div className="h-4 w-64 animate-pulse bg-emerald-200/50 rounded mt-2" />
          ) : (
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
              {summary.data?.recommendation ?? 'Awaiting detailed fiscal recommendation vectors.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
