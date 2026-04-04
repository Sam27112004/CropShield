'use client';

import { useMemo } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { useWeatherCurrent, useTrendingCommodities } from '@/hooks/useApi';

export default function SmartAdvisorPage() {
  const weather = useWeatherCurrent('Pune');
  const trending = useTrendingCommodities();

  const recommendation = useMemo(() => {
    if (!weather.data || !trending.data?.items?.length) return 'Load weather and market signals to generate a smart advisory.';
    const heatRisk = weather.data.temperature_c >= 34;
    const top = trending.data.items[0];

    if (heatRisk) {
      return `Heat risk detected (${weather.data.temperature_c.toFixed(1)}°C). Prefer early irrigation windows and avoid mid-day spraying. Monitor ${top.commodity} price swings (${top.change_percent.toFixed(1)}%).`;
    }
    return `Conditions look moderate (${weather.data.temperature_c.toFixed(1)}°C, ${weather.data.condition}). Consider market timing for ${top.commodity} as trend is ${top.change_percent.toFixed(1)}%.`;
  }, [weather.data, trending.data]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Smart Advisor</h1>
          <p className="text-foreground-muted">Fused view of weather and market signals for action guidance.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            weather.refetch();
            trending.refetch();
          }}
          className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-foreground-main hover:bg-primary/5"
        >
          Refresh
        </button>
      </header>

      {weather.error || trending.error ? (
        <ErrorBanner
          message={`${weather.error ? `Weather: ${weather.error}` : ''}${weather.error && trending.error ? ' | ' : ''}${trending.error ? `Market: ${trending.error}` : ''}`}
          onRetry={() => {
            weather.refetch();
            trending.refetch();
          }}
        />
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Weather Signal</p>
          {weather.loading ? <div className="h-16 animate-pulse rounded bg-primary/10" /> : null}
          {weather.data ? (
            <div className="space-y-1 text-sm">
              <p className="text-foreground-main font-semibold">{weather.data.location}</p>
              <p className="text-foreground-muted">{weather.data.temperature_c.toFixed(1)}°C • {weather.data.condition}</p>
              <p className="text-foreground-muted">Humidity {weather.data.humidity_percent}%</p>
            </div>
          ) : null}
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Market Signal</p>
          {trending.loading ? <div className="h-16 animate-pulse rounded bg-primary/10" /> : null}
          {trending.data?.items?.[0] ? (
            <div className="space-y-1 text-sm">
              <p className="text-foreground-main font-semibold">{trending.data.items[0].commodity}</p>
              <p className="text-foreground-muted">Trend {trending.data.items[0].change_percent.toFixed(1)}%</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Smart Recommendation</p>
        <p className="text-sm text-foreground-main">{recommendation}</p>
      </section>
    </div>
  );
}
