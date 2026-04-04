'use client';

import ErrorBanner from '@/components/ErrorBanner';
import { useFinancialSummary } from '@/hooks/useApi';

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function FinancialPage() {
  const summary = useFinancialSummary();
  const lastUpdated = new Date().toLocaleTimeString();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Financial Insights</h1>
          <p className="text-foreground-muted">Revenue, costs, margin outlook, and guidance for planning decisions.</p>
        </div>
        <button
          type="button"
          onClick={summary.refetch}
          className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-foreground-main hover:bg-primary/5"
        >
          Refresh
        </button>
      </header>

      {summary.error ? <ErrorBanner message={`Financial summary error: ${summary.error}`} onRetry={summary.refetch} /> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs text-foreground-dim font-bold uppercase tracking-wider">Revenue</p>
          {summary.loading ? <div className="mt-2 h-7 animate-pulse rounded bg-primary/10" /> : <p className="mt-2 text-2xl font-bold text-foreground-main">{summary.data ? formatInr(summary.data.estimated_revenue_inr) : '-'}</p>}
        </div>
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs text-foreground-dim font-bold uppercase tracking-wider">Cost</p>
          {summary.loading ? <div className="mt-2 h-7 animate-pulse rounded bg-primary/10" /> : <p className="mt-2 text-2xl font-bold text-foreground-main">{summary.data ? formatInr(summary.data.estimated_cost_inr) : '-'}</p>}
        </div>
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs text-foreground-dim font-bold uppercase tracking-wider">Profit</p>
          {summary.loading ? <div className="mt-2 h-7 animate-pulse rounded bg-primary/10" /> : <p className="mt-2 text-2xl font-bold text-foreground-main">{summary.data ? formatInr(summary.data.estimated_profit_inr) : '-'}</p>}
        </div>
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs text-foreground-dim font-bold uppercase tracking-wider">Margin</p>
          {summary.loading ? <div className="mt-2 h-7 animate-pulse rounded bg-primary/10" /> : <p className="mt-2 text-2xl font-bold text-foreground-main">{summary.data ? `${summary.data.margin_percent.toFixed(1)}%` : '-'}</p>}
        </div>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Recommendation</p>
        {summary.loading ? <div className="h-8 animate-pulse rounded bg-primary/10" /> : <p className="text-sm text-foreground-main">{summary.data?.recommendation ?? 'No recommendation available.'}</p>}
        {!summary.loading ? <p className="mt-2 text-xs text-foreground-dim">Refreshed at {lastUpdated}</p> : null}
      </section>
    </div>
  );
}
