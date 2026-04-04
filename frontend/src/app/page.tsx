'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, TriangleAlert, Wheat } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';
import {
  useDashboardSummary,
  useMarketCommodities,
  useTrendingCommodities,
  useWeatherCurrent,
} from '@/hooks/useApi';

function MetricCard(props: { title: string; value: string; subtitle: string; icon: React.ElementType; loading?: boolean }) {
  const Icon = props.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 md:p-6 border border-primary/10"
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

export default function HomePage() {
  const { data, loading, error, refetch } = useDashboardSummary();
  const weatherQuery = useWeatherCurrent('Pune');
  const commoditiesQuery = useMarketCommodities();
  const trendingQuery = useTrendingCommodities();
  const [advisoryMessage, setAdvisoryMessage] = useState('What should I monitor for heat stress this week?');
  const [advisoryReply, setAdvisoryReply] = useState<string | null>(null);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  const totalClaims = data?.total_claims ?? 0;
  const approved = data?.approved_claims ?? 0;
  const avgDamage = data?.average_damage_percentage ?? 0;
  const avgConfidence = data?.average_decision_confidence ?? 0;

  const topCommodity = commoditiesQuery.data?.items?.[0];
  const topTrending = trendingQuery.data?.items?.[0];

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
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setAdvisoryError(message);
      setAdvisoryReply(null);
    } finally {
      setAdvisoryLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">CropShield Workflow Dashboard</h1>
          <p className="text-foreground-muted">
            Farmer onboarding via land records, map verification, satellite-based damage assessment, and admin supervision.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-foreground-main text-sm font-semibold hover:bg-primary/5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/farmer/requests" className="btn-premium">Start New Claim</Link>
        </div>
      </header>

      {error ? <ErrorBanner message={`Backend summary is unavailable: ${error}`} onRetry={refetch} /> : null}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Claims"
          value={String(totalClaims)}
          subtitle="All farmer submissions"
          icon={Wheat}
          loading={loading}
        />
        <MetricCard
          title="Admin Approved"
          value={String(approved)}
          subtitle="Supervised and finalized claims"
          icon={ShieldCheck}
          loading={loading}
        />
        <MetricCard
          title="Avg Possible Damage"
          value={`${avgDamage.toFixed(1)}%`}
          subtitle="Model-estimated crop impact"
          icon={TriangleAlert}
          loading={loading}
        />
        <MetricCard
          title="Avg Decision Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          subtitle="Internal AI+rules confidence"
          icon={ShieldCheck}
          loading={loading}
        />
      </section>

      <section className="glass rounded-2xl p-6 border border-primary/10">
        <h2 className="text-xl font-bold text-foreground-main mb-3">What Farmers See</h2>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Farmers receive possible crop-damage assessment only. Final insurance amount is decided in admin review with PMFBY guidance.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Weather Snapshot</p>
          {weatherQuery.loading ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
          {weatherQuery.error ? <p className="text-sm text-rose-500">{weatherQuery.error}</p> : null}
          {weatherQuery.data ? (
            <div className="space-y-1 text-sm text-foreground-main">
              <p className="text-lg font-bold">{weatherQuery.data.location}</p>
              <p>{weatherQuery.data.temperature_c.toFixed(1)}°C • {weatherQuery.data.condition}</p>
              <p className="text-foreground-muted">Humidity {weatherQuery.data.humidity_percent}% • Wind {weatherQuery.data.wind_kph.toFixed(1)} kph</p>
            </div>
          ) : null}
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Market Snapshot</p>
          {(commoditiesQuery.loading || trendingQuery.loading) ? <div className="h-20 animate-pulse rounded-lg bg-primary/10" /> : null}
          {commoditiesQuery.error || trendingQuery.error ? (
            <p className="text-sm text-rose-500">{commoditiesQuery.error ?? trendingQuery.error}</p>
          ) : null}
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
        </div>

        <div className="glass rounded-2xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Advisory Assistant</p>
          <form onSubmit={submitAdvisory} className="space-y-3">
            <textarea
              value={advisoryMessage}
              onChange={(event) => setAdvisoryMessage(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
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
        </div>
      </section>
    </div>
  );
}
