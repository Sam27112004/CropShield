'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import { useWeatherAlerts, useWeatherCurrent, useWeatherForecast } from '@/hooks/useApi';

export default function WeatherPage() {
  const current = useWeatherCurrent('Pune');
  const forecast = useWeatherForecast('Pune', 5);
  const alerts = useWeatherAlerts('Pune');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const forecastChartData = useMemo(
    () => forecast.data?.days.map((day) => ({
      day: day.date.slice(5),
      min: day.min_temp_c,
      max: day.max_temp_c,
    })) ?? [],
    [forecast.data?.days],
  );

  const alertChartData = useMemo(() => {
    const counts = alerts.data?.alerts.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.severity || 'Unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}) ?? {};

    return Object.entries(counts).map(([severity, count]) => ({ severity, count }));
  }, [alerts.data?.alerts]);

  const refreshAll = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    current.refetch();
    forecast.refetch();
    alerts.refetch();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Weather Outlook</p>
          <h1 className="page-title gradient-text">Weather Intelligence</h1>
          <p className="page-description mt-3">Current conditions, short-range forecast, and active alerts.</p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main transition-colors hover:bg-white"
        >
          <RefreshCw size={14} className={current.loading || forecast.loading || alerts.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {lastRefreshedAt ? <p className="text-xs text-foreground-dim">Refreshed at {lastRefreshedAt}</p> : null}

      {current.error || forecast.error || alerts.error ? (
        <ErrorBanner
          message={`${current.error ? `Current: ${current.error}` : ''}${current.error && (forecast.error || alerts.error) ? ' | ' : ''}${forecast.error ? `Forecast: ${forecast.error}` : ''}${forecast.error && alerts.error ? ' | ' : ''}${alerts.error ? `Alerts: ${alerts.error}` : ''}`}
          onRetry={refreshAll}
        />
      ) : null}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="stat-card xl:col-span-1">
          <p className="stat-card__label">Current Temperature</p>
          {current.loading ? <div className="h-7 w-24 animate-pulse rounded bg-primary/10" /> : <p className="stat-card__value">{current.data ? `${current.data.temperature_c.toFixed(1)}°C` : '-'}</p>}
          <p className="section-note">{current.data?.condition ?? 'No current weather data available.'}</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-foreground-muted">
            <div className="rounded-2xl border border-border-glass bg-white/80 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-foreground-dim font-semibold">Humidity</p>
              <p className="mt-1 font-semibold text-foreground-main">{current.data ? `${current.data.humidity_percent}%` : '-'}</p>
            </div>
            <div className="rounded-2xl border border-border-glass bg-white/80 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-foreground-dim font-semibold">Wind</p>
              <p className="mt-1 font-semibold text-foreground-main">{current.data ? `${current.data.wind_kph.toFixed(1)} kph` : '-'}</p>
            </div>
          </div>
        </div>

        <div className="feed-card xl:col-span-2">
          <div className="mb-4">
            <p className="section-heading mb-2">Forecast Curve</p>
            <p className="section-note">Five-day min/max temperature outlook for the selected location.</p>
          </div>
          <div className="h-[300px]">
            {forecast.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!forecast.loading && forecastChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                  <XAxis dataKey="day" tick={{ fill: '#486151', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#486151', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                  <Line type="monotone" dataKey="min" stroke="#68c18a" strokeWidth={3} dot={false} name="Min Temp" />
                  <Line type="monotone" dataKey="max" stroke="#2f855a" strokeWidth={3} dot={false} name="Max Temp" />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
            {!forecast.loading && !forecastChartData.length ? (
              <div className="empty-state h-full flex items-center justify-center">Forecast data unavailable.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Alert Severity</p>
            <p className="section-note">Counts of active alerts by severity.</p>
          </div>
          <div className="h-[280px]">
            {alerts.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
            {!alerts.loading && alertChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                  <XAxis dataKey="severity" tick={{ fill: '#486151', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#486151', fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
            {!alerts.loading && !alertChartData.length ? <div className="empty-state h-full flex items-center justify-center">No active alerts.</div> : null}
          </div>
        </div>

        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Forecast Cards</p>
            <p className="section-note">Daily weather conditions in a compact summary view.</p>
          </div>
          {forecast.loading ? <div className="h-28 animate-pulse rounded-2xl bg-primary/10" /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {forecast.data?.days.map((day) => (
              <div key={day.date} className="rounded-2xl border border-border-glass bg-white/80 px-3 py-3 shadow-sm">
                <p className="text-xs text-foreground-dim font-semibold">{day.date}</p>
                <p className="text-sm font-semibold text-foreground-main mt-1">{day.min_temp_c.toFixed(1)}° - {day.max_temp_c.toFixed(1)}°</p>
                <p className="text-xs text-foreground-muted mt-1">{day.condition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="feed-card">
        <p className="section-heading mb-3">Alerts</p>
        {alerts.loading ? <div className="h-14 animate-pulse rounded-2xl bg-primary/10" /> : null}
        {alerts.data?.alerts.length ? (
          <div className="space-y-2">
            {alerts.data.alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="rounded-2xl border border-amber-300/30 bg-amber-50/70 px-3 py-3">
                <p className="text-sm font-semibold text-amber-800">{alert.title} ({alert.severity})</p>
                <p className="text-xs text-amber-700 mt-1">{alert.description}</p>
              </div>
            ))}
          </div>
        ) : (
          !alerts.loading && <p className="text-sm text-foreground-muted">No active alerts.</p>
        )}
      </section>
    </div>
  );
}
