'use client';

import { useMemo } from 'react';
import { Cpu, RefreshCw, CloudSun, TrendingUp, Compass, CheckCircle2, AlertTriangle } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import { useWeatherCurrent, useTrendingCommodities } from '@/hooks/useApi';

export default function SmartAdvisorPage() {
  const weather = useWeatherCurrent('Pune');
  const trending = useTrendingCommodities();

  const { recommendation, isAlert } = useMemo(() => {
    if (!weather.data || !trending.data?.items?.length) return { recommendation: 'Load weather and market signals to generate a smart advisory.', isAlert: false };
    const heatRisk = weather.data.temperature_c >= 34;
    const top = trending.data.items[0];

    if (heatRisk) {
      return {
        recommendation: `Critical heat risk detected (${weather.data.temperature_c.toFixed(1)}°C). Immediate protocol: Shift to early morning/late evening irrigation windows. Suspend mid-day foliar operations. Concurrently, track ${top.commodity} asset movements (momentum at ${top.change_percent.toFixed(1)}%) for potential early liquidation.`,
        isAlert: true
      };
    }
    return {
      recommendation: `Atmospheric baseline is stable (${weather.data.temperature_c.toFixed(1)}°C, ${weather.data.condition}). Routine operations cleared. Recommended focus: Market optimization. Evaluate positions in ${top.commodity} as primary momentum indicates ${top.change_percent.toFixed(1)}% variance.`,
      isAlert: false
    };
  }, [weather.data, trending.data]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Autonomous Decision Support</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Smart Advisor</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Algorithmic fusion of environmental telemetrics and active market vectors for operational synthesis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            weather.refetch();
            trending.refetch();
          }}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
        >
          <RefreshCw className={`w-4 h-4 ${weather.loading || trending.loading ? 'animate-spin' : ''}`} />
          Force Recalculation
        </button>
      </div>

      {weather.error || trending.error ? (
        <ErrorBanner
          message={`${weather.error ? `Telemetry: ${weather.error}` : ''}${weather.error && trending.error ? ' | ' : ''}${trending.error ? `Markets: ${trending.error}` : ''}`}
          onRetry={() => {
            weather.refetch();
            trending.refetch();
          }}
        />
      ) : null}

      {/* CORE RECOMMENDATION (PULLED TO TOP AS MOST IMPORTANT) */}
      <div className="relative bg-white rounded-[32px] p-6 lg:p-10 border border-gray-100 shadow-[0_12px_40px_rgba(31,52,38,0.08)] overflow-hidden">
        <div className={`absolute top-0 left-0 w-2 h-full ${isAlert ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        
        <div className="flex items-start gap-5">
           <div className={`p-4 rounded-[20px] ${isAlert ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <Compass className={`w-8 h-8 ${isAlert ? 'text-amber-600' : 'text-emerald-600'}`} />
           </div>
           <div>
             <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-widest mb-1">Synthesized Directive</h2>
             <p className="text-xs font-bold text-gray-400 mb-4">Generated via combined atmospheric & market logic</p>
             
             {weather.loading || trending.loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2"></div>
                </div>
             ) : (
               <p className="text-lg lg:text-xl font-medium text-gray-800 leading-relaxed border-l-2 border-gray-100 pl-4 py-1">
                 {recommendation}
               </p>
             )}
           </div>
        </div>
      </div>

      {/* INPUT VECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* WEATHER PULL */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Input 01: Atmosphere</h3>
             <CloudSun className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="flex-1 bg-gray-50/50 rounded-[24px] border border-gray-100 p-6">
            {weather.loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 animate-pulse rounded w-16" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
              </div>
            ) : weather.data ? (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-100 self-start px-2 py-0.5 rounded-full mb-2">Location Locked: {weather.data.location}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-extrabold text-gray-900">{weather.data.temperature_c.toFixed(1)}</span>
                  <span className="text-2xl font-bold text-gray-400">°C</span>
                </div>
                <p className="text-base font-medium text-gray-700">{weather.data.condition}</p>
                <p className="text-xs font-bold text-gray-500 mt-2 border-t border-gray-200 pt-2">Local Humidity: <span className="text-gray-800">{weather.data.humidity_percent}%</span></p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-gray-400">
                 <p className="text-sm font-bold">Signal Lost</p>
              </div>
            )}
          </div>
        </div>

        {/* MARKET PULL */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Input 02: Market Flux</h3>
             <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="flex-1 bg-gray-50/50 rounded-[24px] border border-gray-100 p-6">
            {trending.loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 animate-pulse rounded w-32" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-24" />
              </div>
            ) : trending.data?.items?.[0] ? (
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 self-start px-2 py-0.5 rounded-full mb-2">Primary Asset</p>
                 <p className="text-4xl font-extrabold text-gray-900 mb-1">{trending.data.items[0].commodity}</p>
                 <div className="flex items-center gap-2 mt-2 border-t border-gray-200 pt-3">
                   <div className={`p-1 rounded-full ${trending.data.items[0].change_percent >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                     {trending.data.items[0].change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 transform rotate-180" />}
                   </div>
                   <p className="text-sm font-bold text-gray-700">
                     Momentum <span className={trending.data.items[0].change_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}>{trending.data.items[0].change_percent > 0 ? '+' : ''}{trending.data.items[0].change_percent.toFixed(1)}%</span>
                   </p>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-gray-400">
                 <p className="text-sm font-bold">Signal Lost</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
