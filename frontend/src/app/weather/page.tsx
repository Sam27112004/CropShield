'use client';

import ErrorBanner from '@/components/ErrorBanner';
import { useWeatherAlerts, useWeatherCurrent, useWeatherForecast } from '@/hooks/useApi';

export default function WeatherPage() {
  const current = useWeatherCurrent('Pune');
  const forecast = useWeatherForecast('Pune', 5);
  const alerts = useWeatherAlerts('Pune');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Weather Intelligence</h1>
          <p className="text-foreground-muted">Current conditions, short-range forecast, and active alerts.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            current.refetch();
            forecast.refetch();
            alerts.refetch();
          }}
          className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-foreground-main hover:bg-primary/5"
        >
          Refresh
        </button>
      </header>

      {current.error || forecast.error || alerts.error ? (
        <ErrorBanner
          message={`${current.error ? `Current: ${current.error}` : ''}${current.error && (forecast.error || alerts.error) ? ' | ' : ''}${forecast.error ? `Forecast: ${forecast.error}` : ''}${forecast.error && alerts.error ? ' | ' : ''}${alerts.error ? `Alerts: ${alerts.error}` : ''}`}
          onRetry={() => {
            current.refetch();
            forecast.refetch();
            alerts.refetch();
          }}
        />
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10 md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Current</p>
          {current.loading ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
          {current.data ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground-main">{current.data.temperature_c.toFixed(1)}°C</p>
              <p className="text-sm text-foreground-main">{current.data.condition}</p>
              <p className="text-xs text-foreground-muted">Humidity {current.data.humidity_percent}%</p>
              <p className="text-xs text-foreground-muted">Wind {current.data.wind_kph.toFixed(1)} kph</p>
            </div>
          ) : null}
          {!current.loading && !current.data ? <p className="text-sm text-foreground-muted">Current weather data unavailable.</p> : null}
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10 md:col-span-2">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">5-Day Forecast</p>
          {forecast.loading ? <div className="h-28 animate-pulse rounded-lg bg-primary/10" /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {forecast.data?.days.map((day) => (
              <div key={day.date} className="rounded-xl border border-primary/10 px-3 py-2">
                <p className="text-xs text-foreground-dim">{day.date}</p>
                <p className="text-sm font-semibold text-foreground-main mt-1">{day.min_temp_c.toFixed(1)}° - {day.max_temp_c.toFixed(1)}°</p>
                <p className="text-xs text-foreground-muted mt-1">{day.condition}</p>
              </div>
            ))}
          </div>
          {!forecast.loading && !forecast.data?.days?.length ? (
            <p className="text-sm text-foreground-muted mt-2">Forecast data unavailable.</p>
          ) : null}
        </div>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Alerts</p>
        {alerts.loading ? <div className="h-14 animate-pulse rounded-lg bg-primary/10" /> : null}
        {alerts.data?.alerts.length ? (
          <div className="space-y-2">
            {alerts.data.alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="rounded-xl border border-amber-300/30 bg-amber-50/50 px-3 py-2">
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
