'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function FinancialPage() {
  const summary = useFinancialSummary();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const financialChartData = useMemo(
    () => summary.data ? [
      { label: 'Revenue', value: summary.data.estimated_revenue_inr },
      { label: 'Cost', value: summary.data.estimated_cost_inr },
      { label: 'Profit', value: summary.data.estimated_profit_inr },
    ] : [],
    [summary.data],
  );

  const marginBreakdown = useMemo(
    () => summary.data ? [
      { name: 'Margin', value: summary.data.margin_percent },
      { name: 'Remaining', value: Math.max(0, 100 - summary.data.margin_percent) },
    ] : [],
    [summary.data],
  );

  const refreshSummary = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    summary.refetch();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Claim Finance</p>
          <h1 className="page-title gradient-text">Financial Insights</h1>
          <p className="page-description mt-3">Approved claim exposure, expected payout reserve, and margin outlook from real claims.</p>
        </div>
        <button
          type="button"
          onClick={refreshSummary}
          className="inline-flex items-center gap-2 rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main transition-colors hover:bg-white"
        >
          <RefreshCw size={14} className={summary.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {lastRefreshedAt ? <p className="text-xs text-foreground-dim">Refreshed at {lastRefreshedAt}</p> : null}

      {summary.error ? <ErrorBanner message={`Financial summary error: ${summary.error}`} onRetry={refreshSummary} /> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="stat-card__label">Approved Exposure</p>
          {summary.loading ? <div className="mt-1 h-7 w-28 animate-pulse rounded bg-primary/10" /> : <p className="stat-card__value">{summary.data ? formatInr(summary.data.estimated_revenue_inr) : '-'}</p>}
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Expected Payout</p>
          {summary.loading ? <div className="mt-1 h-7 w-28 animate-pulse rounded bg-primary/10" /> : <p className="stat-card__value">{summary.data ? formatInr(summary.data.estimated_cost_inr) : '-'}</p>}
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Reserve</p>
          {summary.loading ? <div className="mt-1 h-7 w-28 animate-pulse rounded bg-primary/10" /> : <p className="stat-card__value">{summary.data ? formatInr(summary.data.estimated_profit_inr) : '-'}</p>}
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Reserve Margin</p>
          {summary.loading ? <div className="mt-1 h-7 w-28 animate-pulse rounded bg-primary/10" /> : <p className="stat-card__value">{summary.data ? `${summary.data.margin_percent.toFixed(1)}%` : '-'}</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Claim Composition</p>
            <p className="section-note">Approved exposure, expected payout, and reserve derived from real claim reviews.</p>
          </div>
          <div className="h-[320px]">
            {summary.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!summary.loading && financialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="value" fill="#2f855a" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Reserve Split</p>
            <p className="section-note">Reserve strength versus payout obligation across reviewed claims.</p>
          </div>
          <div className="h-[320px]">
            {summary.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!summary.loading && marginBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={marginBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {marginBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? '#2f855a' : '#c7e9d1'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </section>

      <section className="feed-card">
        <p className="section-heading mb-2">Recommendation</p>
        {summary.loading ? <div className="h-8 animate-pulse rounded bg-primary/10" /> : <p className="text-sm text-foreground-main">{summary.data?.recommendation ?? 'No recommendation available.'}</p>}
      </section>
    </div>
  );
}
