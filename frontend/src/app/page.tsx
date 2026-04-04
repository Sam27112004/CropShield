'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, TriangleAlert, Wheat } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import { useDashboardSummary } from '@/hooks/useApi';

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
  const totalClaims = data?.total_claims ?? 0;
  const approved = data?.approved_claims ?? 0;
  const avgDamage = data?.average_damage_percentage ?? 0;
  const avgConfidence = data?.average_decision_confidence ?? 0;

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
    </div>
  );
}
