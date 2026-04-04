'use client';

import ErrorBanner from '@/components/ErrorBanner';
import { useMandiData, useMarketCommodities, useTrendingCommodities } from '@/hooks/useApi';

export default function MarketPage() {
  const commodities = useMarketCommodities();
  const trending = useTrendingCommodities();
  const mandi = useMandiData();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Market Intelligence</h1>
        <p className="text-foreground-muted">Commodity snapshots, trending movement, and mandi references.</p>
      </header>

      {commodities.error || trending.error || mandi.error ? (
        <ErrorBanner
          message={`${commodities.error ? `Commodities: ${commodities.error}` : ''}${commodities.error && (trending.error || mandi.error) ? ' | ' : ''}${trending.error ? `Trending: ${trending.error}` : ''}${trending.error && mandi.error ? ' | ' : ''}${mandi.error ? `Mandi: ${mandi.error}` : ''}`}
          onRetry={() => {
            commodities.refetch();
            trending.refetch();
            mandi.refetch();
          }}
        />
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Commodities</p>
          {commodities.loading ? <div className="h-28 animate-pulse rounded-lg bg-primary/10" /> : null}
          <div className="space-y-2">
            {commodities.data?.items.map((item, index) => (
              <div key={`${item.commodity}-${index}`} className="rounded-xl border border-primary/10 px-3 py-2">
                <p className="text-sm font-semibold text-foreground-main">{item.commodity}</p>
                <p className="text-xs text-foreground-muted mt-1">{item.market} - {item.currency} {item.price.toFixed(0)}/{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Trending</p>
          {trending.loading ? <div className="h-28 animate-pulse rounded-lg bg-primary/10" /> : null}
          <div className="space-y-2">
            {trending.data?.items.map((item, index) => (
              <div key={`${item.commodity}-${index}`} className="rounded-xl border border-primary/10 px-3 py-2">
                <p className="text-sm font-semibold text-foreground-main">{item.commodity}</p>
                <p className={`text-xs mt-1 ${item.change_percent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {item.change_percent >= 0 ? '+' : ''}{item.change_percent.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Mandi Data</p>
        {mandi.loading ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {mandi.data?.items.map((item, index) => (
            <div key={`${item.mandi}-${item.commodity}-${index}`} className="rounded-xl border border-primary/10 px-3 py-2">
              <p className="text-sm font-semibold text-foreground-main">{item.mandi}</p>
              <p className="text-xs text-foreground-muted mt-1">{item.commodity}</p>
              <p className="text-xs text-foreground-muted mt-1">Min {item.min_price.toFixed(0)} | Max {item.max_price.toFixed(0)} | Modal {item.modal_price.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
