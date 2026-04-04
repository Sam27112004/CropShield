'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Activity, ExternalLink, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import { useClaims, useDashboardSummary } from '@/hooks/useApi';

function MetricCard(props: { title: string; value: string; subtitle: string; icon: React.ElementType; loading?: boolean }) {
  const Icon = props.icon;
  return (
    <div className="glass rounded-2xl p-5 md:p-6 border border-primary/10">
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
    </div>
  );
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AnalysisPage() {
  const summaryQuery = useDashboardSummary();
  const claimsQuery = useClaims({ limit: 100, offset: 0 });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const loading = summaryQuery.loading || claimsQuery.loading;
  const claims = claimsQuery.data?.items ?? [];
  const totalClaims = summaryQuery.data?.total_claims ?? claims.length;
  const approvedClaims = summaryQuery.data?.approved_claims ?? 0;
  const avgDamage = summaryQuery.data?.average_damage_percentage ?? 0;
  const avgConfidence = summaryQuery.data?.average_decision_confidence ?? 0;

  const analysisCompleted = claims.filter((item) => item.status === 'analysis_completed').length;
  const pendingReview = claims.filter((item) => item.admin_status === 'pending_review').length;
  const needsAttention = claims.filter(
    (item) => item.status === 'failed' || item.admin_status === 'needs_more_info',
  ).length;
  const completionRate = totalClaims > 0 ? (analysisCompleted / totalClaims) * 100 : 0;

  const allClaims = [...claims]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const refreshAll = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    summaryQuery.refetch();
    claimsQuery.refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Analysis Dashboard</h1>
          <p className="text-foreground-muted">
            Satellite-driven claim analysis progress, risk indicators, and quick access to individual claim results.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-foreground-main text-sm font-semibold hover:bg-primary/5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {lastRefreshedAt ? <p className="text-xs text-foreground-dim">Refreshed at {lastRefreshedAt}</p> : null}

      {summaryQuery.error || claimsQuery.error ? (
        <ErrorBanner
          message={`${summaryQuery.error ? `Summary error: ${summaryQuery.error}` : ''}${summaryQuery.error && claimsQuery.error ? ' | ' : ''}${claimsQuery.error ? `Claims error: ${claimsQuery.error}` : ''}`}
          onRetry={refreshAll}
        />
      ) : null}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Claims"
          value={String(totalClaims)}
          subtitle="Tracked claims in the system"
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          title="Avg Damage"
          value={`${avgDamage.toFixed(1)}%`}
          subtitle="Average model-estimated crop impact"
          icon={TriangleAlert}
          loading={loading}
        />
        <MetricCard
          title="Approved Claims"
          value={String(approvedClaims)}
          subtitle="Admin-approved outcomes"
          icon={ShieldCheck}
          loading={loading}
        />
        <MetricCard
          title="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          subtitle="AI + rules confidence trend"
          icon={ShieldCheck}
          loading={loading}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-1">Completed Analyses</p>
          <p className="text-2xl font-bold text-foreground-main">{analysisCompleted}</p>
          <p className="text-xs text-foreground-muted mt-1">{completionRate.toFixed(1)}% completion rate</p>
        </div>
        <div className="glass rounded-xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-1">Pending Admin Review</p>
          <p className="text-2xl font-bold text-foreground-main">{pendingReview}</p>
          <p className="text-xs text-foreground-muted mt-1">Claims awaiting final review decision</p>
        </div>
        <div className="glass rounded-xl p-5 border border-primary/10">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-1">Needs Attention</p>
          <p className="text-2xl font-bold text-foreground-main">{needsAttention}</p>
          <p className="text-xs text-foreground-muted mt-1">Failed analysis or additional info requested</p>
        </div>
      </section>

      <section className="glass rounded-2xl overflow-hidden border border-primary/10">
        <div className="px-5 py-4 border-b border-primary/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground-main">All Claims (Admin View)</h2>
          <Link href="/claims" className="text-sm font-semibold text-primary no-underline">View all claims</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-primary/10">
                {['Claim', 'Farmer', 'Crop', 'Status', 'Admin', 'Updated', ''].map((head) => (
                  <th key={head} className="px-5 py-4 text-[0.78rem] uppercase tracking-wider text-foreground-dim font-bold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-foreground-dim">
                    Loading claims...
                  </td>
                </tr>
              ) : null}
              {!loading && allClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-foreground-dim">
                    No claims found yet. Create a new claim to start analysis.
                  </td>
                </tr>
              ) : null}
              {allClaims.map((claim) => (
                <tr key={claim.id} className="border-b border-primary/5">
                  <td className="px-5 py-4 font-mono text-sm">#{claim.id}</td>
                  <td className="px-5 py-4 text-sm">{claim.farmer_name}</td>
                  <td className="px-5 py-4 text-sm">{claim.crop_type}</td>
                  <td className="px-5 py-4 text-sm">{claim.status}</td>
                  <td className="px-5 py-4 text-sm">{claim.admin_status}</td>
                  <td className="px-5 py-4 text-sm">{formatDateTime(claim.updated_at)}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/analysis/${claim.id}`}
                      className="inline-flex items-center gap-1 text-primary text-sm font-semibold no-underline"
                    >
                      Open
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
