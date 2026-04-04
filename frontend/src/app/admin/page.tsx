'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Download, RefreshCw, Send } from 'lucide-react';
import FarmBoundaryMap from '@/components/FarmBoundaryMap';
import {
  bulkReviewAdminClaims,
  getAdminClaimFull,
  getAdminReportDownloadUrl,
  getAnalysisArtifacts,
  reviewAdminClaim,
} from '@/lib/api';
import { useAdminClaims } from '@/hooks/useApi';
import type { AdminClaim, AdminClaimFullResponse, AnalysisArtifacts } from '@/types/api';

interface ReviewState {
  [claimId: number]: {
    admin_status: 'pending_review' | 'approved' | 'rejected' | 'needs_more_info';
    reviewed_by: string;
    admin_notes: string;
    recommended_insurance_amount: string;
  };
}

function useAdminQueryParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const adminStatus = searchParams.get('admin_status') ?? '';
  const cropType = searchParams.get('crop_type') ?? '';
  const status = searchParams.get('status') ?? '';
  const damageDateFrom = searchParams.get('damage_date_from') ?? '';
  const damageDateTo = searchParams.get('damage_date_to') ?? '';
  const search = searchParams.get('search') ?? '';

  const setParams = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${next.toString()}`);
  };

  return {
    page,
    adminStatus,
    cropType,
    status,
    damageDateFrom,
    damageDateTo,
    search,
    setParams,
  };
}

export default function AdminClaimsPage() {
  const pageSize = 20;
  const { page, adminStatus, cropType, status, damageDateFrom, damageDateTo, search, setParams } = useAdminQueryParams();
  const offset = (page - 1) * pageSize;

  const { data, loading, error, refetch } = useAdminClaims({
    limit: pageSize,
    offset,
    status: status || undefined,
    admin_status: adminStatus || undefined,
    crop_type: cropType || undefined,
    damage_date_from: damageDateFrom || undefined,
    damage_date_to: damageDateTo || undefined,
    search: search || undefined,
  });

  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busyClaimId, setBusyClaimId] = useState<number | null>(null);
  const [expandedClaimId, setExpandedClaimId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, AdminClaimFullResponse>>({});
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<number, AnalysisArtifacts>>({});
  const [expandedBusy, setExpandedBusy] = useState<number | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkReviewedBy, setBulkReviewedBy] = useState('Admin');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const claims = data?.items ?? [];
  const totalCount = data?.total_count ?? 0;
  const hasPrev = page > 1;
  const hasNext = offset + claims.length < totalCount;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => claims.some((item) => item.claim_id === id)));
  }, [claims]);

  const availableCropTypes = useMemo(() => {
    const set = new Set<string>();
    claims.forEach((item) => set.add(item.crop_type));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [claims]);

  const getState = (claim: AdminClaim) =>
    reviewState[claim.claim_id] ?? {
      admin_status: (claim.admin_status as 'pending_review' | 'approved' | 'rejected' | 'needs_more_info') || 'pending_review',
      reviewed_by: claim.reviewed_by || 'Admin',
      admin_notes: '',
      recommended_insurance_amount: claim.recommended_insurance_amount?.toString() ?? '',
    };

  const submitReview = async (claim: AdminClaim) => {
    const state = getState(claim);
    setBusyClaimId(claim.claim_id);
    setMessage(null);
    try {
      await reviewAdminClaim(claim.claim_id, {
        admin_status: state.admin_status,
        reviewed_by: state.reviewed_by,
        admin_notes: state.admin_notes || undefined,
        recommended_insurance_amount: state.recommended_insurance_amount
          ? Number(state.recommended_insurance_amount)
          : undefined,
      });
      setMessage(`Review updated for claim #${claim.claim_id}`);
      refetch();
    } catch (err) {
      setMessage(`Failed review update for #${claim.claim_id}: ${String(err)}`);
    } finally {
      setBusyClaimId(null);
    }
  };

  const toggleExpand = async (claimId: number) => {
    if (expandedClaimId === claimId) {
      setExpandedClaimId(null);
      return;
    }

    setExpandedClaimId(claimId);
    if (expandedData[claimId]) {
      return;
    }

    setExpandedBusy(claimId);
    try {
      const full = await getAdminClaimFull(claimId);
      setExpandedData((prev) => ({ ...prev, [claimId]: full }));
      if (full.latest_analysis?.status === 'completed') {
        const artifacts = await getAnalysisArtifacts(claimId);
        setExpandedArtifacts((prev) => ({ ...prev, [claimId]: artifacts }));
      }
    } catch (err) {
      setMessage(`Failed to load details for #${claimId}: ${String(err)}`);
    } finally {
      setExpandedBusy(null);
    }
  };

  const runBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedIds.length === 0) {
      setMessage('Select at least one claim for bulk action.');
      return;
    }
    if (!bulkReviewedBy.trim()) {
      setMessage('Reviewer name is required for bulk review.');
      return;
    }

    setBulkBusy(true);
    setMessage(null);
    try {
      const result = await bulkReviewAdminClaims({
        claim_ids: selectedIds,
        admin_status: action,
        reviewed_by: bulkReviewedBy.trim(),
        admin_notes: bulkNotes.trim() || undefined,
        recommended_insurance_amount: bulkAmount ? Number(bulkAmount) : undefined,
      });
      setMessage(`Bulk review updated ${result.updated_claim_ids.length} claim(s).`);
      setSelectedIds([]);
      refetch();
    } catch (err) {
      setMessage(`Bulk review failed: ${String(err)}`);
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Admin Supervision Panel</h1>
          <p className="text-foreground-muted text-sm">
            Filter, review, and audit claim decisions with inline analysis context.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-sm font-semibold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="glass rounded-2xl p-4 border border-primary/10 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        <select
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          value={adminStatus}
          onChange={(e) => setParams({ admin_status: e.target.value || null, page: 1 })}
        >
          <option value="">All Admin Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_more_info">Needs More Info</option>
        </select>

        <select
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          value={cropType}
          onChange={(e) => setParams({ crop_type: e.target.value || null, page: 1 })}
        >
          <option value="">All Crops</option>
          {availableCropTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setParams({ status: e.target.value || null, page: 1 })}
        >
          <option value="">All Claim Status</option>
          <option value="created">Created</option>
          <option value="analysis_running">Analysis Running</option>
          <option value="analysis_completed">Analysis Completed</option>
          <option value="failed">Failed</option>
          <option value="approved_by_admin">Approved by Admin</option>
          <option value="rejected_by_admin">Rejected by Admin</option>
          <option value="needs_more_info">Needs More Info</option>
          <option value="pending_admin_review">Pending Admin Review</option>
        </select>

        <input
          type="date"
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          value={damageDateFrom}
          onChange={(e) => setParams({ damage_date_from: e.target.value || null, page: 1 })}
        />

        <input
          type="date"
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          value={damageDateTo}
          onChange={(e) => setParams({ damage_date_to: e.target.value || null, page: 1 })}
        />

        <input
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          placeholder="Search farmer/crop"
          value={search}
          onChange={(e) => setParams({ search: e.target.value || null, page: 1 })}
        />
      </section>

      <section className="glass rounded-2xl p-4 border border-primary/10 grid md:grid-cols-4 gap-3">
        <input
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          placeholder="Reviewer name"
          value={bulkReviewedBy}
          onChange={(e) => setBulkReviewedBy(e.target.value)}
        />
        <input
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          placeholder="Amount (optional)"
          value={bulkAmount}
          onChange={(e) => setBulkAmount(e.target.value)}
        />
        <input
          className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
          placeholder="Bulk notes (optional)"
          value={bulkNotes}
          onChange={(e) => setBulkNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-premium flex-1"
            disabled={bulkBusy}
            onClick={() => runBulkAction('approved')}
          >
            Approve Selected
          </button>
          <button
            type="button"
            className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
            disabled={bulkBusy}
            onClick={() => runBulkAction('rejected')}
          >
            Reject Selected
          </button>
        </div>
      </section>

      {error ? <div className="glass rounded-xl p-4 border border-red-300/60 text-red-700 text-sm">{error}</div> : null}
      {message ? <div className="glass rounded-xl p-4 border border-primary/20 text-foreground-main text-sm">{message}</div> : null}

      <section className="glass rounded-2xl overflow-hidden border border-primary/10">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-4 py-3 text-xs font-bold uppercase">Sel</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Claim</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Farmer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Crop</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Admin Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => {
                const state = getState(claim);
                const expanded = expandedClaimId === claim.claim_id;
                const detail = expandedData[claim.claim_id];
                const artifacts = expandedArtifacts[claim.claim_id];
                return (
                  <Fragment key={claim.claim_id}>
                    <tr className="border-b border-primary/5">
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(claim.claim_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => Array.from(new Set([...prev, claim.claim_id])));
                            } else {
                              setSelectedIds((prev) => prev.filter((item) => item !== claim.claim_id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">#{claim.claim_id}</td>
                      <td className="px-4 py-3 text-sm">{claim.farmer_name}</td>
                      <td className="px-4 py-3 text-sm">{claim.crop_type}</td>
                      <td className="px-4 py-3 text-sm">{claim.admin_status}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1"
                          onClick={() => toggleExpand(claim.claim_id)}
                        >
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Details
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-primary/5 bg-primary/5">
                        <td colSpan={6} className="px-4 py-4">
                          {expandedBusy === claim.claim_id ? (
                            <p className="text-sm text-foreground-dim">Loading details...</p>
                          ) : (
                            <div className="grid lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <p><strong>Damage Date:</strong> {claim.damage_date}</p>
                                  <p><strong>Status:</strong> {claim.status}</p>
                                  <p><strong>Estimated Damage:</strong> {claim.latest_damage_percentage?.toFixed(1) ?? 'N/A'}%</p>
                                  <p><strong>AI Probability:</strong> {claim.latest_ai_damage_probability?.toFixed(2) ?? 'N/A'}</p>
                                </div>

                                {claim.polygon && claim.polygon.length >= 3 ? (
                                  <FarmBoundaryMap polygon={claim.polygon} center={[claim.polygon[0][0], claim.polygon[0][1]]} height={220} />
                                ) : null}

                                {detail?.farmer_notes ? (
                                  <div className="rounded-xl border border-primary/10 bg-white/70 p-3 text-sm">
                                    <p className="font-semibold mb-1">Farmer Notes</p>
                                    <p>{detail.farmer_notes}</p>
                                  </div>
                                ) : null}

                                <div className="rounded-xl border border-primary/10 bg-white/70 p-3 text-sm">
                                  <p className="font-semibold mb-2">Audit History</p>
                                  {detail?.audit_logs?.length ? (
                                    <ul className="space-y-1">
                                      {detail.audit_logs.slice(0, 6).map((log) => (
                                        <li key={log.id}>
                                          {new Date(log.created_at).toLocaleString()} - {log.actor} changed {log.old_status ?? '-'} to {log.new_status ?? '-'}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-foreground-dim">No audit entries yet.</p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {detail?.latest_analysis?.metrics ? (
                                  <div className="rounded-xl border border-primary/10 bg-white/70 p-3 text-sm">
                                    <p className="font-semibold mb-2">Latest Metrics</p>
                                    <table className="w-full text-xs">
                                      <tbody>
                                        <tr><td>NDVI Before</td><td>{detail.latest_analysis.metrics.ndvi_before.toFixed(3)}</td></tr>
                                        <tr><td>NDVI After</td><td>{detail.latest_analysis.metrics.ndvi_after.toFixed(3)}</td></tr>
                                        <tr><td>NDWI Before</td><td>{detail.latest_analysis.metrics.ndwi_before.toFixed(3)}</td></tr>
                                        <tr><td>NDWI After</td><td>{detail.latest_analysis.metrics.ndwi_after.toFixed(3)}</td></tr>
                                        <tr><td>EVI Before</td><td>{detail.latest_analysis.metrics.evi_before.toFixed(3)}</td></tr>
                                        <tr><td>EVI After</td><td>{detail.latest_analysis.metrics.evi_after.toFixed(3)}</td></tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}

                                {detail?.latest_analysis?.decision ? (
                                  <div className="rounded-xl border border-primary/10 bg-white/70 p-3 text-sm">
                                    <p className="font-semibold mb-2">Decision</p>
                                    <p className="mb-2">{detail.latest_analysis.decision.decision}</p>
                                    <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
                                      <div
                                        className="h-full bg-primary"
                                        style={{ width: `${Math.min(100, Math.max(0, detail.latest_analysis.decision.confidence * 100))}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-foreground-dim mt-1">
                                      Confidence {(detail.latest_analysis.decision.confidence * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                ) : null}

                                {artifacts ? (
                                  <div className="grid grid-cols-4 gap-2">
                                    {[
                                      artifacts.before_rgb_data_url,
                                      artifacts.after_rgb_data_url,
                                      artifacts.ndvi_before_data_url,
                                      artifacts.ndvi_after_data_url,
                                      artifacts.ndwi_before_data_url,
                                      artifacts.ndwi_after_data_url,
                                      artifacts.evi_before_data_url,
                                      artifacts.evi_after_data_url,
                                    ].map((src, index) => (
                                      <img key={`${claim.claim_id}-${index}`} src={src} alt={`Artifact ${index + 1}`} loading="lazy" className="rounded-lg border border-primary/10" />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-foreground-dim">Artifacts load when completed analysis is available.</p>
                                )}

                                <div className="grid md:grid-cols-5 gap-2">
                                  <select
                                    className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
                                    value={state.admin_status}
                                    onChange={(e) =>
                                      setReviewState((prev) => ({
                                        ...prev,
                                        [claim.claim_id]: { ...state, admin_status: e.target.value as typeof state.admin_status },
                                      }))
                                    }
                                  >
                                    <option value="pending_review">Pending Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="needs_more_info">Needs More Info</option>
                                  </select>
                                  <input
                                    className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
                                    placeholder="Reviewed by"
                                    value={state.reviewed_by}
                                    onChange={(e) =>
                                      setReviewState((prev) => ({
                                        ...prev,
                                        [claim.claim_id]: { ...state, reviewed_by: e.target.value },
                                      }))
                                    }
                                  />
                                  <input
                                    className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
                                    placeholder="Amount"
                                    value={state.recommended_insurance_amount}
                                    onChange={(e) =>
                                      setReviewState((prev) => ({
                                        ...prev,
                                        [claim.claim_id]: { ...state, recommended_insurance_amount: e.target.value },
                                      }))
                                    }
                                  />
                                  <a
                                    href={getAdminReportDownloadUrl(claim.claim_id)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm font-semibold text-foreground-main hover:bg-primary/5 no-underline"
                                  >
                                    <Download size={14} />
                                    Report
                                  </a>
                                  <button
                                    type="button"
                                    className="btn-premium inline-flex items-center justify-center gap-2"
                                    onClick={() => submitReview(claim)}
                                    disabled={busyClaimId === claim.claim_id}
                                  >
                                    {busyClaimId === claim.claim_id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                    Save
                                  </button>
                                </div>
                                <textarea
                                  className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
                                  rows={3}
                                  placeholder="Admin notes"
                                  value={state.admin_notes}
                                  onChange={(e) =>
                                    setReviewState((prev) => ({
                                      ...prev,
                                      [claim.claim_id]: { ...state, admin_notes: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-primary/10 text-sm">
          <p>Showing {claims.length} of {totalCount}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-primary/20 px-3 py-1.5 font-semibold disabled:opacity-50"
              disabled={!hasPrev}
              onClick={() => setParams({ page: page - 1 })}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              className="rounded-xl border border-primary/20 px-3 py-1.5 font-semibold disabled:opacity-50"
              disabled={!hasNext}
              onClick={() => setParams({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
