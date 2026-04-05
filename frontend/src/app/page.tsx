'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, TriangleAlert, Wheat } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';
import {
  useDashboardHomeSignals,
} from '@/hooks/useApi';

function MetricCard(props: { title: string; value: string; subtitle: string; icon: React.ElementType; loading?: boolean }) {
  const Icon = props.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="feed-card"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground-dim font-semibold">{props.title}</p>
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={18} />
        </span>
      </div>
      {props.loading ? (
        <div className="mb-2 h-9 w-28 animate-pulse rounded-lg bg-primary/15" />
      ) : (
        <p className="text-3xl font-bold text-foreground-main mb-1">{props.value}</p>
      )}
      <p className="text-xs text-foreground-muted">{props.subtitle}</p>
    </motion.div>
  );
}

function SignalChartCard(props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="feed-card h-full">
      <div className="mb-4">
        <p className="section-heading mb-2">{props.title}</p>
        <p className="section-note">{props.description}</p>
      </div>
      <div className="h-[280px]">{props.children}</div>
    </div>
  );
}

export default function HomePage() {
  const advisoryHistoryStorageKey = 'cropshield.advisory.history.v1';
  const signalsQuery = useDashboardHomeSignals('Pune', 3);
  const [advisoryMessage, setAdvisoryMessage] = useState('What should I monitor for heat stress this week?');
  const [advisoryReply, setAdvisoryReply] = useState<string | null>(null);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryHistory, setAdvisoryHistory] = useState<
    Array<{ asked_at: string; question: string; reply: string }>
  >([]);

  const summary = signalsQuery.data?.summary;
  const weatherCurrent = signalsQuery.data?.weather_current;
  const weatherForecast = signalsQuery.data?.weather_forecast;
  const weatherAlerts = signalsQuery.data?.weather_alerts;
  const marketCommodities = signalsQuery.data?.market_commodities;
  const marketTrending = signalsQuery.data?.market_trending;
  const marketMandi = signalsQuery.data?.market_mandi_data;

  const totalClaims = summary?.total_claims ?? 0;
  const approved = summary?.approved_claims ?? 0;
  const avgDamage = summary?.average_damage_percentage ?? 0;
  const avgConfidence = summary?.average_decision_confidence ?? 0;

  const topCommodity = marketCommodities?.items?.[0];
  const topTrending = marketTrending?.items?.[0];
  const topMandi = marketMandi?.items?.[0];
  const weatherChartData = weatherForecast?.days.map((day) => ({
    date: day.date.slice(5),
    minTemp: day.min_temp_c,
    maxTemp: day.max_temp_c,
  })) ?? [];
  const marketChartData = marketCommodities?.items.slice(0, 4).map((item) => ({
    label: item.commodity,
    value: item.price,
  })) ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(advisoryHistoryStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ asked_at: string; question: string; reply: string }>;
      if (Array.isArray(parsed)) {
        setAdvisoryHistory(parsed.slice(0, 10));
      }
    } catch {
      // Ignore malformed history payload and continue with empty state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(advisoryHistoryStorageKey, JSON.stringify(advisoryHistory.slice(0, 10)));
  }, [advisoryHistory]);

  async function submitAdvisory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = advisoryMessage.trim();
    if (!trimmed) {
      setAdvisoryError('Please enter a question before asking for advice.');
      return;
    }

    setAdvisoryLoading(true);
    setAdvisoryError(null);
    try {
      const response = await advisoryChat({ message: trimmed, language: 'en' });
      setAdvisoryReply(response.reply);
      setAdvisoryHistory((prev) => [
        {
          asked_at: new Date().toISOString(),
          question: trimmed,
          reply: response.reply,
        },
        ...prev,
      ].slice(0, 10));
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setAdvisoryError(message);
      setAdvisoryReply(null);
    } finally {
      setAdvisoryLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">CropShield Overview</p>
          <h1 className="page-title gradient-text">CropShield Workflow Dashboard</h1>
          <p className="page-description mt-3">
            Farmer onboarding via land records, map verification, satellite-based damage assessment, and admin supervision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              signalsQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main transition-colors hover:bg-white"
          >
            <RefreshCw
              size={14}
              className={signalsQuery.loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
          <Link href="/farmer/requests" className="btn-premium">Start New Claim</Link>
        </div>
      </header>

      {signalsQuery.error ? <ErrorBanner message={`Dashboard signals are unavailable: ${signalsQuery.error}`} onRetry={signalsQuery.refetch} /> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Claims"
          value={String(totalClaims)}
          subtitle="All farmer submissions"
          icon={Wheat}
          loading={signalsQuery.loading}
        />
        <MetricCard
          title="Admin Approved"
          value={String(approved)}
          subtitle="Supervised and finalized claims"
          icon={ShieldCheck}
          loading={signalsQuery.loading}
        />
        <MetricCard
          title="Avg Possible Damage"
          value={`${avgDamage.toFixed(1)}%`}
          subtitle="Model-estimated crop impact"
          icon={TriangleAlert}
          loading={signalsQuery.loading}
        />
        <MetricCard
          title="Avg Decision Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          subtitle="Internal AI+rules confidence"
          icon={ShieldCheck}
          loading={signalsQuery.loading}
        />
      </section>

      <section className="feed-card">
        <h2 className="section-heading mb-3">What Farmers See</h2>
        <p className="section-note leading-relaxed">
          Farmers receive possible crop-damage assessment only. Final insurance amount is decided in admin review with PMFBY guidance.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="feed-card">
          <p className="section-heading mb-2">Weather Snapshot</p>
          {signalsQuery.loading ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
          {weatherCurrent ? (
            <div className="space-y-1 text-sm text-foreground-main">
              <p className="text-lg font-bold">{weatherCurrent.location}</p>
              <p>{weatherCurrent.temperature_c.toFixed(1)}°C • {weatherCurrent.condition}</p>
              <p className="text-foreground-muted">Humidity {weatherCurrent.humidity_percent}% • Wind {weatherCurrent.wind_kph.toFixed(1)} kph</p>
            </div>
          ) : null}
          {weatherForecast?.days?.length ? (
            <div className="mt-3 space-y-1 text-xs text-foreground-muted">
              {weatherForecast.days.map((day) => (
                <p key={day.date}>
                  {day.date}: {day.min_temp_c.toFixed(1)}°C - {day.max_temp_c.toFixed(1)}°C ({day.condition})
                </p>
              ))}
            </div>
          ) : null}
          {weatherAlerts?.alerts?.length ? (
            <p className="mt-3 text-xs text-amber-700">
              Alert: {weatherAlerts.alerts[0].title} ({weatherAlerts.alerts[0].severity})
            </p>
          ) : null}
        </div>

        <div className="feed-card">
          <p className="section-heading mb-2">Market Snapshot</p>
          {signalsQuery.loading ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
          {topCommodity ? (
            <p className="text-sm text-foreground-main">
              <span className="font-semibold">{topCommodity.commodity}</span> in {topCommodity.market}: {topCommodity.currency} {topCommodity.price.toFixed(0)}/{topCommodity.unit}
            </p>
          ) : null}
          {topTrending ? (
            <p className="mt-2 text-sm text-foreground-muted">
              Trending: <span className="font-semibold text-foreground-main">{topTrending.commodity}</span> ({topTrending.change_percent.toFixed(1)}%)
            </p>
          ) : null}
          {topMandi ? (
            <p className="mt-2 text-xs text-foreground-muted">
              Mandi: {topMandi.mandi} - {topMandi.commodity} modal {topMandi.modal_price.toFixed(0)}
            </p>
          ) : null}
        </div>

        <div className="feed-card">
          <p className="section-heading mb-2">Advisory Assistant</p>
          <form onSubmit={submitAdvisory} className="space-y-3">
            <textarea
              value={advisoryMessage}
              onChange={(event) => setAdvisoryMessage(event.target.value)}
              rows={3}
              className="control-textarea w-full rounded-2xl px-3 py-2 text-sm text-foreground-main focus:outline-none"
            />
            <button
              type="submit"
              disabled={advisoryLoading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {advisoryLoading ? 'Asking...' : 'Ask Advisory'}
            </button>
          </form>
          {advisoryError ? <p className="mt-2 text-sm text-rose-500">{advisoryError}</p> : null}
          {advisoryReply ? <p className="mt-3 text-sm text-foreground-main">{advisoryReply}</p> : null}
          {advisoryHistory.length > 0 ? (
            <div className="mt-4 border-t border-primary/10 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">Recent Advisory</p>
                <button
                  type="button"
                  onClick={() => setAdvisoryHistory([])}
                  className="text-xs font-semibold text-foreground-muted hover:text-foreground-main"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {advisoryHistory.map((entry, index) => (
                  <div key={`${entry.asked_at}-${index}`} className="rounded-lg border border-primary/10 px-2 py-2 text-xs">
                    <p className="font-semibold text-foreground-main">Q: {entry.question}</p>
                    <p className="mt-1 text-foreground-muted">A: {entry.reply}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SignalChartCard
          title="Weather Outlook"
          description="Forecast low and high temperatures for the next few days."
        >
          {signalsQuery.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
          {weatherChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                <XAxis dataKey="date" tick={{ fill: '#486151', fontSize: 12 }} />
                <YAxis tick={{ fill: '#486151', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(47, 133, 90, 0.16)',
                    background: 'rgba(255,255,255,0.96)',
                    boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="minTemp" name="Min Temp" stroke="#68c18a" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="maxTemp" name="Max Temp" stroke="#2f855a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </SignalChartCard>

        <SignalChartCard
          title="Market Pulse"
          description="Current prices for the top commodities being tracked."
        >
          {signalsQuery.loading ? <div className="h-full animate-pulse rounded-2xl bg-primary/10" /> : null}
          {marketChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
        </SignalChartCard>
      </section>
    </div>
  );
}
