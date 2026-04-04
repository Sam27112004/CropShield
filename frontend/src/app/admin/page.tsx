'use client';

import { useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import FarmBoundaryMap from '@/components/FarmBoundaryMap';
import { reviewAdminClaim } from '@/lib/api';
import { useAdminClaims } from '@/hooks/useApi';

interface ReviewState {
  [claimId: number]: {
    admin_status: 'pending_review' | 'approved' | 'rejected' | 'needs_more_info';
    reviewed_by: string;
    admin_notes: string;
    recommended_insurance_amount: string;
  };
}

export default function AdminClaimsPage() {
  const { data, loading, error, refetch } = useAdminClaims({ limit: 50, offset: 0 });
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busyClaimId, setBusyClaimId] = useState<number | null>(null);
  const claims = data?.items ?? [];

  const getState = (claimId: number) =>
    reviewState[claimId] ?? {
      admin_status: 'pending_review',
      reviewed_by: 'Admin',
      admin_notes: '',
      recommended_insurance_amount: '',
    };

  const submitReview = async (claimId: number) => {
    const state = getState(claimId);
    setBusyClaimId(claimId);
    setMessage(null);
    try {
      await reviewAdminClaim(claimId, {
        admin_status: state.admin_status,
        reviewed_by: state.reviewed_by,
        admin_notes: state.admin_notes || undefined,
        recommended_insurance_amount: state.recommended_insurance_amount
          ? Number(state.recommended_insurance_amount)
          : undefined,
      });
      setMessage(`Review updated for claim #${claimId}`);
      refetch();
    } catch (err) {
      setMessage(`Failed review update for #${claimId}: ${String(err)}`);
    } finally {
      setBusyClaimId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Admin Supervision Panel</h1>
          <p className="text-foreground-muted text-sm">
            Verify farmer details, extent, satellite assessment, then publish insurance amount with PMFBY reference.
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

      {error ? <div className="glass rounded-xl p-4 border border-red-300/60 text-red-700 text-sm">{error}</div> : null}
      {message ? <div className="glass rounded-xl p-4 border border-primary/20 text-foreground-main text-sm">{message}</div> : null}

      {claims.map((claim) => {
        const state = getState(claim.claim_id);
        return (
          <section key={claim.claim_id} className="glass rounded-2xl p-5 border border-primary/10">
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="space-y-2 text-sm">
                <p><strong>Claim:</strong> #{claim.claim_id}</p>
                <p><strong>Farmer:</strong> {claim.farmer_name}</p>
                <p><strong>Crop:</strong> {claim.crop_type}</p>
                <p><strong>Damage Date:</strong> {claim.damage_date}</p>
                <p><strong>Latest Risk:</strong> {claim.latest_risk_label ?? 'Not evaluated yet'}</p>
                <p><strong>Estimated Damage:</strong> {claim.latest_damage_percentage?.toFixed(1) ?? 'N/A'}%</p>
                <p><strong>Owner(s):</strong> {claim.owner_names.join(', ') || 'N/A'}</p>
                <p><strong>Area Values:</strong> {claim.area_values.join(', ') || 'N/A'}</p>
                <p>
                  <strong>PMFBY:</strong>{' '}
                  <a
                    href={claim.pmfby_reference_url || 'https://pmfby.gov.in/'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold"
                  >
                    {claim.pmfby_reference_url || 'https://pmfby.gov.in/'}
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                {claim.polygon && claim.polygon.length >= 3 ? (
                  <FarmBoundaryMap polygon={claim.polygon} center={[claim.polygon[0][0], claim.polygon[0][1]]} height={220} />
                ) : (
                  <div className="h-[220px] rounded-xl border border-primary/10 bg-white/60 flex items-center justify-center text-sm text-foreground-dim">
                    Farm polygon unavailable
                  </div>
                )}
                {claim.screenshot_data_url ? (
                  <img src={claim.screenshot_data_url} alt={`Claim ${claim.claim_id} automation screenshot`} className="rounded-xl border border-primary/10" />
                ) : null}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3 mt-4">
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
                placeholder="Insurance Amount (INR)"
                value={state.recommended_insurance_amount}
                onChange={(e) =>
                  setReviewState((prev) => ({
                    ...prev,
                    [claim.claim_id]: { ...state, recommended_insurance_amount: e.target.value },
                  }))
                }
              />
              <button
                type="button"
                className="btn-premium inline-flex items-center justify-center gap-2"
                onClick={() => submitReview(claim.claim_id)}
                disabled={busyClaimId === claim.claim_id}
              >
                {busyClaimId === claim.claim_id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Save Review
              </button>
            </div>
            <textarea
              className="w-full mt-3 rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm"
              rows={3}
              placeholder="Admin notes and validation details"
              value={state.admin_notes}
              onChange={(e) =>
                setReviewState((prev) => ({
                  ...prev,
                  [claim.claim_id]: { ...state, admin_notes: e.target.value },
                }))
              }
            />
          </section>
        );
      })}
    </div>
  );
}
