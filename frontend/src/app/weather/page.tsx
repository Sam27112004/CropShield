'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, CloudSun, Wind, Droplets, AlertTriangle, ThermometerSun, MapPin, CalendarDays } from 'lucide-react';
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <CloudSun className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Meteorological Nexus</span>
        </div>
        {current.data?.location && (
           <div className="flex items-center gap-2 text-sm text-primary font-medium">
             <MapPin className="w-4 h-4" /> {current.data.location}
           </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Weather Intelligence</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Live atmospheric mapping, anomaly detection, and short-range projections.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
        >
          <RefreshCw className={`w-4 h-4 ${current.loading || forecast.loading || alerts.loading ? 'animate-spin' : ''}`} />
          Sync Satellites
        </button>
      </div>

      {current.error || forecast.error || alerts.error ? (
        <ErrorBanner
          message={`${current.error ? `Current: ${current.error}` : ''}${current.error && (forecast.error || alerts.error) ? ' | ' : ''}${forecast.error ? `Forecast: ${forecast.error}` : ''}${forecast.error && alerts.error ? ' | ' : ''}${alerts.error ? `Alerts: ${alerts.error}` : ''}`}
          onRetry={refreshAll}
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* CURRENT WEATHER HIGHLIGHT */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-[#0284c7] rounded-[32px] p-8 text-white shadow-[0_12px_32px_rgba(2,132,199,0.2)] relative overflow-hidden flex-1">
            <CloudSun className="absolute -right-8 -bottom-8 w-48 h-48 text-white opacity-10 pointer-events-none" />
            
            <p className="text-blue-100 text-[11px] font-bold tracking-widest uppercase mb-4">Live Atmospheric Snapshot</p>
            
            {current.loading ? (
              <div className="h-16 w-32 animate-pulse rounded-2xl bg-white/20 mb-4" />
            ) : (
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-extrabold tracking-tighter">
                  {current.data ? `${current.data.temperature_c.toFixed(1)}` : '--'}
                </span>
                <span className="text-2xl font-bold text-blue-100">°C</span>
              </div>
            )}
            
            <p className="text-lg font-medium text-white mb-8 border-b border-blue-400/30 pb-6">
              {current.data?.condition ?? 'Awaiting telemetry...'}
            </p>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 text-blue-100 mb-1">
                    <Droplets className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Humidity</span>
                  </div>
                  <span className="text-xl font-bold">{current.data ? `${current.data.humidity_percent}%` : '--'}</span>
               </div>
               <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 text-blue-100 mb-1">
                    <Wind className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Wind</span>
                  </div>
                  <span className="text-xl font-bold">{current.data ? `${current.data.wind_kph.toFixed(0)} kph` : '--'}</span>
               </div>
            </div>
          </div>
        </div>

        {/* FORECAST CHART & DAILY */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-orange-500" /> Thermal Projection (5-Day)
              </h2>
            </div>
            
            <div className="h-[280px] w-full">
              {forecast.loading ? (
                <div className="w-full h-full animate-pulse bg-gray-50 rounded-2xl" />
              ) : forecastChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      itemStyle={{ fontWeight: 700 }}
                    />
                    <Line type="smooth" dataKey="max" stroke="#f97316" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Max Temp" />
                    <Line type="smooth" dataKey="min" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Min Temp" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <span className="text-sm font-bold text-gray-400">Projection Data Offline</span>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
               {forecast.data?.days.map((day) => (
                <div key={day.date} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-emerald-50 hover:border-emerald-100 transition-colors cursor-default">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{day.date.slice(5)}</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-900 mb-1">{day.min_temp_c.toFixed(0)}°<span className="text-gray-400 font-medium">/</span>{day.max_temp_c.toFixed(0)}°</p>
                  <p className="text-xs font-semibold text-primary truncate" title={day.condition}>{day.condition}</p>
                </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ALERTS MODULE */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Active Threat Advisories
          </h2>
          
          <div className="flex-1 flex flex-col">
            {alerts.loading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse bg-gray-50 rounded-2xl w-full" />
                <div className="h-16 animate-pulse bg-gray-50 rounded-2xl w-full" />
              </div>
            ) : alerts.data?.alerts.length ? (
              <div className="space-y-3">
                {alerts.data.alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mt-1">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        {alert.title} <span className="uppercase text-[10px] tracking-widest text-amber-600 ml-2 bg-amber-100/50 px-2 py-0.5 rounded-full">{alert.severity}</span>
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                <ShieldCheck className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-400">All Clear</p>
                <p className="text-xs text-gray-400">No active meteorological threats detected in your sector.</p>
              </div>
            )}
          </div>
        </div>

        {/* ALERTS CHART */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Wind className="w-5 h-5 text-gray-400" /> Threat Frequency
          </h2>
          
          <div className="h-[250px] w-full flex-1">
            {alerts.loading ? (
              <div className="w-full h-full animate-pulse bg-gray-50 rounded-2xl" />
            ) : alertChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                 <p className="text-sm font-bold text-gray-400">Insufficient Data for Visualization</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
