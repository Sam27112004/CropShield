'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, CheckCircle2, ChevronLeft, ExternalLink, Loader2, Lock, MapPinned, RefreshCw, Satellite, ShieldCheck, XCircle } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import FarmBoundaryMap from '@/components/FarmBoundaryMap';
import { useClaims } from '@/hooks/useApi';
import { ApiError, analyzeClaim, createClaim, createFarmProfile, getAnalysis, getFarmOptions, submitFarmerNotes, waitForJobCompletion } from '@/lib/api';
import type { Claim, FarmOptionsResponse, FarmProfile, JobStatusResponse } from '@/types/api';

type Step = 1 | 2 | 3 | 4;
type EntryMode = 'automation' | 'manual';
type ViewMode = 'new' | 'status';

function canViewDetailedReport(claim: Claim): boolean {
  return claim.admin_status === 'approved';
}

function getStatusDescriptor(claim: Claim): { label: string; tone: string; spinner?: boolean; retry?: boolean } {
  if (claim.admin_status === 'approved') {
    return { label: 'Approved - report available', tone: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (claim.admin_status === 'rejected') {
    return { label: 'Rejected', tone: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
  if (claim.admin_status === 'needs_more_info') {
    return { label: 'More information needed', tone: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  if (claim.status === 'analysis_running') {
    return { label: 'Analysis running...', tone: 'bg-blue-100 text-blue-800 border-blue-300', spinner: true };
  }
  if (claim.status === 'analysis_completed' || claim.status === 'pending_admin_review') {
    return { label: 'Under admin review', tone: 'bg-sky-100 text-sky-800 border-sky-300' };
  }
  if (claim.status === 'failed') {
    return { label: 'Analysis failed - retry available', tone: 'bg-orange-100 text-orange-900 border-orange-300', retry: true };
  }
  return { label: 'Submitted - waiting for review', tone: 'bg-slate-100 text-slate-700 border-slate-300' };
}

function ClaimStatusBadge({ claim }: { claim: Claim }) {
  const descriptor = getStatusDescriptor(claim);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${descriptor.tone}`}>
      {descriptor.spinner ? <Loader2 size={12} className="animate-spin" /> : null}
      {descriptor.label}
    </span>
  );
}

function normalizeFailureReason(message?: string | null): string {
  if (!message) {
    return 'Satellite imagery could not be processed for the selected period. Please retry with a wider date range.';
  }
  const withoutAttemptDetails = message.replace(/expanded attempts:\s*[^)]*\)/i, '').trim();
  return withoutAttemptDetails.replace(/\s+/g, ' ');
}

function calculateAnalysisParams(
  damageDate: string,
  startDate: string,
  endDate: string,
  maxCloudThreshold: number,
  upscaleFactor: number,
) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const damage = new Date(`${damageDate}T00:00:00`);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const gapBefore = Math.max(1, Math.ceil((damage.getTime() - start.getTime()) / MS_PER_DAY));
  const gapAfter = Math.max(1, Math.ceil((end.getTime() - damage.getTime()) / MS_PER_DAY));
  const windowDays = Math.max(7, Math.min(45, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1));

  return {
    gap_before: gapBefore,
    gap_after: gapAfter,
    window_days: windowDays,
    max_cloud_threshold: maxCloudThreshold,
    upscale_factor: upscaleFactor,
  };
}

export default function FarmerRequestsPage() {
  const [view, setView] = useState<ViewMode>('new');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    landFarmerName?: string;
    manualFarmerName?: string;
    manualArea?: string;
    manualLatitude?: string;
    manualLongitude?: string;
    analysisDateRange?: string;
  }>({});
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [farmConfirmed, setFarmConfirmed] = useState(false);
  const [jobInfo, setJobInfo] = useState<string>('Waiting...');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('automation');
  const [submittedClaimId, setSubmittedClaimId] = useState<number | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [retryClaimId, setRetryClaimId] = useState<number | null>(null);
  const [retryStartDate, setRetryStartDate] = useState(new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10));
  const [retryEndDate, setRetryEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [retryFailureReason, setRetryFailureReason] = useState('');
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryJob, setRetryJob] = useState<JobStatusResponse | null>(null);
  const [farmerNotesDraft, setFarmerNotesDraft] = useState<Record<number, string>>({});
  const [farmerNotesBusyId, setFarmerNotesBusyId] = useState<number | null>(null);
  const [farmerNotesErrorById, setFarmerNotesErrorById] = useState<Record<number, string>>({});
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const claimsQuery = useClaims({ limit: 100, offset: 0 });
  const claims = claimsQuery.data?.items ?? [];

  const refreshRequests = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    claimsQuery.refetch();
  };

  useEffect(() => {
    if (view !== 'status') return;
    const timer = window.setInterval(() => {
      claimsQuery.refetch();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [view, claimsQuery]);

  const [landOptions, setLandOptions] = useState<FarmOptionsResponse>({
    state: [],
    category: [],
    district: [],
    taluka: [],
    village: [],
    plot: [],
    selected: {
      state_index: 0,
      category_index: 0,
      district_index: 0,
      taluka_index: 0,
      village_index: 0,
      plot_index: 0,
    },
  });

  const [landForm, setLandForm] = useState({
    farmer_name: '',
    state_index: 0,
    category_index: 0,
    district_index: 0,
    taluka_index: 0,
    village_index: 0,
    plot_index: 0,
    headless: true,
  });

  const [manualForm, setManualForm] = useState({
    farmer_name: '',
    latitude: 18.5204,
    longitude: 73.8567,
    farm_area_hectares: 2.5,
  });

  const DEFAULT_STATE_INDEX = 0;

  const getReadableLabel = (label: string) => {
    return label.replace(/^\s*\d+\s*[-.)]?\s*/, '').trim() || label;
  };

  const loadLandOptions = async (next: {
    state_index?: number;
    category_index?: number;
    district_index?: number;
    taluka_index?: number;
    village_index?: number;
  }) => {
    setOptionsLoading(true);
    setError(null);
    try {
      const resolvedStateIndex = next.state_index ?? DEFAULT_STATE_INDEX;
      const options = await getFarmOptions({
        state_index: resolvedStateIndex,
        category_index: next.category_index,
        district_index: next.district_index,
        taluka_index: next.taluka_index,
        village_index: next.village_index,
        headless: true,
      });
      setLandOptions(options);
      setLandForm((prev) => ({
        ...prev,
        state_index: DEFAULT_STATE_INDEX,
        category_index: options.selected.category_index,
        district_index: options.selected.district_index,
        taluka_index: options.selected.taluka_index,
        village_index: options.selected.village_index,
        plot_index: options.selected.plot_index,
      }));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Unable to load land-record options (${err.status}).`);
      } else {
        setError(`Unable to load land-record options: ${String(err)}`);
      }
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadLandOptions({
      state_index: DEFAULT_STATE_INDEX,
      category_index: 0,
      district_index: 0,
      taluka_index: 0,
      village_index: 0,
    });
  }, []);

  const handleCategoryChange = async (categoryIndex: number) => {
    await loadLandOptions({
      state_index: DEFAULT_STATE_INDEX,
      category_index: categoryIndex,
      district_index: 0,
      taluka_index: 0,
      village_index: 0,
    });
  };

  const handleDistrictChange = async (districtIndex: number) => {
    await loadLandOptions({
      state_index: DEFAULT_STATE_INDEX,
      category_index: landForm.category_index,
      district_index: districtIndex,
      taluka_index: 0,
      village_index: 0,
    });
  };

  const handleTalukaChange = async (talukaIndex: number) => {
    await loadLandOptions({
      state_index: DEFAULT_STATE_INDEX,
      category_index: landForm.category_index,
      district_index: landForm.district_index,
      taluka_index: talukaIndex,
      village_index: 0,
    });
  };

  const handleVillageChange = async (villageIndex: number) => {
    await loadLandOptions({
      state_index: DEFAULT_STATE_INDEX,
      category_index: landForm.category_index,
      district_index: landForm.district_index,
      taluka_index: landForm.taluka_index,
      village_index: villageIndex,
    });
  };

  const [claimForm, setClaimForm] = useState({
    crop_type: 'Wheat',
    damage_date: new Date().toISOString().slice(0, 10),
    analysis_start_date: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10),
    analysis_end_date: new Date().toISOString().slice(0, 10),
    gap_before: 5,
    gap_after: 5,
    window_days: 10,
    max_cloud_threshold: 100,
    upscale_factor: 3,
  });

  const canStep3 = entryMode === 'manual' ? true : (!!farm && farmConfirmed);

  const ownerPreview = useMemo(() => {
    if (!farm) return 'No owner data';
    return farm.owner_names.length > 0 ? farm.owner_names.join(', ') : 'Owner data unavailable';
  }, [farm]);

  const submitLandLookup = async () => {
    setError(null);
    setFormErrors((prev) => ({ ...prev, landFarmerName: undefined }));
    if (!landForm.farmer_name.trim()) {
      setFormErrors((prev) => ({ ...prev, landFarmerName: 'Farmer name is required.' }));
      return;
    }
    setLoading(true);
    try {
      const profile = await createFarmProfile({
        farmer_name: landForm.farmer_name.trim(),
        state_index: landForm.state_index,
        category_index: landForm.category_index,
        district_index: landForm.district_index,
        taluka_index: landForm.taluka_index,
        village_index: landForm.village_index,
        plot_index: landForm.plot_index,
        headless: landForm.headless,
      });
      setFarm(profile);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Land lookup failed (${err.status}).`);
      } else {
        setError(`Land lookup failed: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const continueManualFlow = () => {
    setError(null);
    const nextErrors: typeof formErrors = {};
    if (!manualForm.farmer_name.trim()) {
      nextErrors.manualFarmerName = 'Farmer name is required.';
    }
    if (manualForm.farm_area_hectares <= 0) {
      nextErrors.manualArea = 'Land area must be greater than 0.';
    }
    if (manualForm.latitude < -90 || manualForm.latitude > 90) {
      nextErrors.manualLatitude = 'Latitude must be between -90 and 90.';
    }
    if (manualForm.longitude < -180 || manualForm.longitude > 180) {
      nextErrors.manualLongitude = 'Longitude must be between -180 and 180.';
    }
    if (claimForm.analysis_start_date > claimForm.analysis_end_date) {
      nextErrors.analysisDateRange = 'Analysis start date must be on or before analysis end date.';
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setStep(3);
  };

  const buildAnalysisParams = () =>
    calculateAnalysisParams(
      claimForm.damage_date,
      claimForm.analysis_start_date,
      claimForm.analysis_end_date,
      claimForm.max_cloud_threshold,
      claimForm.upscale_factor,
    );

  const trackAnalysisJob = async (jobId: string, claimId: number, onFailure?: (message: string) => void) => {
    try {
      const latest = await waitForJobCompletion(jobId, {
        timeoutMs: 10 * 60_000,
        onUpdate: (update) => {
          setJobProgress(update.progress ?? 0);
          setJobInfo(`Analysis status: ${update.status} (${update.progress ?? 0}%)`);
        },
      });

      if (latest.status === 'failed') {
        const message = latest.error_message ?? 'Analysis failed.';
        setJobInfo(`Analysis failed: ${message}`);
        onFailure?.(message);
        return;
      }

      setJobProgress(100);
      setJobInfo('Analysis completed. Refreshing requests...');
      await claimsQuery.refetch();
      setSubmittedClaimId(claimId);
      setView('status');
    } catch (err) {
      const message = String(err);
      setJobInfo(`Analysis tracking stopped: ${message}`);
      onFailure?.(message);
    }
  };

  const openRetryPanel = async (claim: Claim) => {
    const damageDate = new Date(`${claim.damage_date}T00:00:00`);
    const startDate = new Date(damageDate.getTime() - (10 * 24 * 60 * 60 * 1000));
    const endDate = new Date(damageDate.getTime() + (10 * 24 * 60 * 60 * 1000));
    setRetryStartDate(startDate.toISOString().slice(0, 10));
    setRetryEndDate(endDate.toISOString().slice(0, 10));
    setRetryClaimId(claim.id);
    setRetryError(null);
    setRetryJob(null);
    try {
      const latest = await getAnalysis(claim.id);
      setRetryFailureReason(normalizeFailureReason(latest.analysis?.status_message));
    } catch {
      setRetryFailureReason(normalizeFailureReason());
    }
  };

  const submitRetryAnalysis = async (claim: Claim) => {
    setRetryError(null);
    if (retryStartDate > retryEndDate) {
      setRetryError('Analysis start date must be on or before analysis end date.');
      return;
    }
    setRetryBusy(true);
    try {
      const params = calculateAnalysisParams(
        claim.damage_date,
        retryStartDate,
        retryEndDate,
        claimForm.max_cloud_threshold,
        claimForm.upscale_factor,
      );
      const job = await analyzeClaim(claim.id, params);
      void (async () => {
        try {
          const latest = await waitForJobCompletion(job.job_id, {
            timeoutMs: 10 * 60_000,
            onUpdate: (update) => setRetryJob(update),
          });
          if (latest.status === 'failed') {
            setRetryFailureReason(normalizeFailureReason(latest.error_message));
            setRetryError(normalizeFailureReason(latest.error_message));
            return;
          }
          await claimsQuery.refetch();
          setRetryClaimId(null);
          setSubmittedClaimId(claim.id);
        } catch (retryErr) {
          setRetryError(String(retryErr));
        }
      })();
    } catch (err) {
      setRetryError(String(err));
    } finally {
      setRetryBusy(false);
    }
  };

  const submitNeedsMoreInfoNotes = async (claimId: number) => {
    const notes = (farmerNotesDraft[claimId] ?? '').trim();
    if (!notes) {
      setFarmerNotesErrorById((prev) => ({ ...prev, [claimId]: 'Please enter additional details before submitting.' }));
      return;
    }
    setFarmerNotesBusyId(claimId);
    setFarmerNotesErrorById((prev) => ({ ...prev, [claimId]: '' }));
    try {
      await submitFarmerNotes(claimId, { notes });
      setFarmerNotesDraft((prev) => ({ ...prev, [claimId]: '' }));
      await claimsQuery.refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        setFarmerNotesErrorById((prev) => ({ ...prev, [claimId]: `Unable to submit notes (${err.status}).` }));
      } else {
        setFarmerNotesErrorById((prev) => ({ ...prev, [claimId]: `Unable to submit notes: ${String(err)}` }));
      }
    } finally {
      setFarmerNotesBusyId(null);
    }
  };

  const submitClaim = async () => {
    if (entryMode === 'automation' && !farm) return;
    setError(null);
    setLoading(true);
    setStep(4);
    setJobProgress(0);
    setJobInfo('Creating request...');

    try {
      const claim = await createClaim(
        entryMode === 'automation'
          ? {
              farm_profile_id: farm!.id,
              farmer_name: farm!.farmer_name,
              crop_type: claimForm.crop_type,
              damage_date: claimForm.damage_date,
            }
          : {
              farmer_name: manualForm.farmer_name.trim(),
              crop_type: claimForm.crop_type,
              farm_area_hectares: manualForm.farm_area_hectares,
              latitude: manualForm.latitude,
              longitude: manualForm.longitude,
              damage_date: claimForm.damage_date,
            }
      );

      setJobInfo('Request submitted. Running satellite analysis...');
      const job = await analyzeClaim(claim.id, buildAnalysisParams());

      setJobInfo('Analysis queued. Streaming progress...');
      setSubmittedClaimId(claim.id);
      setView('status');
      setStep(1);
      setLoading(false);
      void trackAnalysisJob(job.job_id, claim.id);
      void claimsQuery.refetch();
      return;
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  const numberInputClass =
    'w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm outline-none focus:border-primary';

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      <header className="page-hero">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="section-heading mb-2">Farmer Workflow</p>
            <h1 className="page-title gradient-text mb-2">Farmer Request Portal</h1>
            <p className="page-description text-sm">
              Raise crop-damage request, track status, and view detailed report only after admin approval.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                view === 'new' ? 'bg-primary text-white border-primary' : 'bg-white/80 text-foreground-main border-border-glass'
              }`}
              onClick={() => setView('new')}
            >
              Raise Request
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                view === 'status' ? 'bg-primary text-white border-primary' : 'bg-white/80 text-foreground-main border-border-glass'
              }`}
              onClick={() => setView('status')}
            >
              Request Status
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="glass rounded-xl p-4 border border-red-300/60 text-red-700 text-sm">{error}</div>
      ) : null}

      {claimsQuery.error ? (
        <ErrorBanner message={`Unable to load requests: ${claimsQuery.error}`} onRetry={claimsQuery.refetch} />
      ) : null}

      {view === 'status' ? (
        <section className="feed-card overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10">
            <h2 className="text-lg font-bold text-foreground-main">Submitted Requests</h2>
            <button
              type="button"
              onClick={refreshRequests}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-sm font-semibold"
            >
              <RefreshCw size={14} className={claimsQuery.loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          {lastRefreshedAt ? <p className="px-5 pt-3 text-xs text-foreground-dim">Refreshed at {lastRefreshedAt}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-primary/10">
                  {['Request', 'Farmer', 'Crop', 'Damage Date', 'Status', 'Admin Review', 'Report'].map((head) => (
                    <th key={head} className="px-5 py-4 text-[0.78rem] uppercase tracking-wider text-foreground-dim font-bold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claimsQuery.loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-foreground-dim">
                      Loading requests...
                    </td>
                  </tr>
                ) : null}
                {!claimsQuery.loading && claims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-foreground-dim">
                      No requests submitted yet.
                    </td>
                  </tr>
                ) : null}
                {claims.map((claim) => {
                  const approved = canViewDetailedReport(claim);
                  const highlight = submittedClaimId === claim.id;
                  return (
                    <Fragment key={claim.id}>
                    <tr className={`border-b border-primary/5 ${highlight ? 'bg-primary/5' : ''}`}>
                      <td className="px-5 py-4 font-mono text-sm">#{claim.id}</td>
                      <td className="px-5 py-4 text-sm">{claim.farmer_name}</td>
                      <td className="px-5 py-4 text-sm">{claim.crop_type}</td>
                      <td className="px-5 py-4 text-sm">{claim.damage_date}</td>
                      <td className="px-5 py-4 text-sm"><ClaimStatusBadge claim={claim} /></td>
                      <td className="px-5 py-4 text-sm">
                        <p className="font-semibold capitalize">{claim.admin_status.replaceAll('_', ' ')}</p>
                        {claim.admin_status === 'rejected' && claim.admin_notes ? (
                          <p className="text-xs text-red-700 mt-1">{claim.admin_notes}</p>
                        ) : null}
                        {claim.admin_status === 'needs_more_info' && claim.admin_notes ? (
                          <p className="text-xs text-amber-800 mt-1">{claim.admin_notes}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {approved ? (
                          <Link href={`/analysis/${claim.id}`} className="inline-flex items-center gap-1 text-primary font-semibold no-underline">
                            <CheckCircle2 size={14} />
                            View Detailed Report
                            <ExternalLink size={14} />
                          </Link>
                        ) : claim.status === 'failed' ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-orange-900 font-semibold"
                            onClick={() => openRetryPanel(claim)}
                          >
                            <AlertTriangle size={14} />
                            Retry Analysis
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-foreground-dim">
                            <Lock size={13} />
                            Locked until admin approval
                          </span>
                        )}
                      </td>
                    </tr>
                    {retryClaimId === claim.id ? (
                      <tr className="border-b border-primary/5 bg-orange-50/50">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="rounded-xl border border-orange-200 bg-white p-4">
                            <p className="text-sm font-semibold text-orange-900 mb-2">Analysis failed - retry available</p>
                            <p className="text-sm text-orange-800 mb-3">{retryFailureReason}</p>
                            <div className="grid md:grid-cols-2 gap-3 mb-3">
                              <label className="flex flex-col gap-1 text-sm">
                                Analysis Start
                                <input
                                  type="date"
                                  className={numberInputClass}
                                  value={retryStartDate}
                                  onChange={(e) => setRetryStartDate(e.target.value)}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm">
                                Analysis End
                                <input
                                  type="date"
                                  className={numberInputClass}
                                  value={retryEndDate}
                                  onChange={(e) => setRetryEndDate(e.target.value)}
                                />
                              </label>
                            </div>
                            {retryJob ? (
                              <p className="text-xs text-foreground-dim mb-2">
                                Retry status: {retryJob.status} ({retryJob.progress ?? 0}%)
                              </p>
                            ) : null}
                            {retryError ? <p className="text-xs text-red-700 mb-2">{retryError}</p> : null}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="btn-premium"
                                disabled={retryBusy}
                                onClick={() => submitRetryAnalysis(claim)}
                              >
                                {retryBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                                Retry Analysis
                              </button>
                              <button
                                type="button"
                                className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold"
                                disabled={retryBusy}
                                onClick={() => setRetryClaimId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {claim.admin_status === 'needs_more_info' ? (
                      <tr className="border-b border-primary/5 bg-amber-50/40">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="rounded-xl border border-amber-200 bg-white p-4">
                            <p className="text-sm font-semibold text-amber-900 mb-2 inline-flex items-center gap-2">
                              <XCircle size={14} />
                              More information requested by admin
                            </p>
                            <textarea
                              className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm outline-none focus:border-primary min-h-[96px]"
                              placeholder="Share additional notes or evidence requested by the admin..."
                              value={farmerNotesDraft[claim.id] ?? ''}
                              onChange={(e) =>
                                setFarmerNotesDraft((prev) => ({
                                  ...prev,
                                  [claim.id]: e.target.value,
                                }))
                              }
                            />
                            {farmerNotesErrorById[claim.id] ? (
                              <p className="text-xs text-red-700 mt-2">{farmerNotesErrorById[claim.id]}</p>
                            ) : null}
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                className="btn-premium"
                                onClick={() => submitNeedsMoreInfoNotes(claim.id)}
                                disabled={farmerNotesBusyId === claim.id}
                              >
                                {farmerNotesBusyId === claim.id ? <Loader2 size={14} className="animate-spin" /> : null}
                                Submit Notes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {view === 'new' ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`rounded-xl px-3 py-2 text-center text-xs font-semibold border ${
                  step >= index
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white/70 text-foreground-dim border-primary/15'
                }`}
              >
                Step {index}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <section className="feed-card">
              <div className="flex items-center gap-2 mb-4">
                <Satellite size={18} className="text-primary" />
                <h2 className="text-xl font-semibold">Claim Entry Mode</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    entryMode === 'automation'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white/80 text-foreground-main border-primary/20'
                  }`}
                  onClick={() => {
                    setEntryMode('automation');
                    setError(null);
                  }}
                >
                  Use Automation
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    entryMode === 'manual'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white/80 text-foreground-main border-primary/20'
                  }`}
                  onClick={() => {
                    setEntryMode('manual');
                    setError(null);
                  }}
                >
                  Fill Manually
                </button>
              </div>
              {entryMode === 'automation' ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Satellite size={18} className="text-primary" />
                    <h2 className="text-xl font-semibold">Land-Record Inputs (Mahabhunakasha Automation)</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm">
                      Farmer Name
                      <input
                        className={numberInputClass}
                        value={landForm.farmer_name}
                        onChange={(e) => {
                          setLandForm((prev) => ({ ...prev, farmer_name: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, landFarmerName: undefined }));
                        }}
                        placeholder="e.g. Ravi Patil"
                      />
                      {formErrors.landFarmerName ? <p className="text-xs text-red-700">{formErrors.landFarmerName}</p> : null}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      State
                      <select
                        className={numberInputClass}
                        value={landForm.state_index}
                        onChange={() => undefined}
                        disabled
                      >
                        {(landOptions.state.length > 0
                          ? landOptions.state.filter((option) => option.index === DEFAULT_STATE_INDEX)
                          : [{ index: DEFAULT_STATE_INDEX, label: 'State 0' }]
                        ).map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Category
                      <select
                        className={numberInputClass}
                        value={landForm.category_index}
                        onChange={(e) => handleCategoryChange(Number(e.target.value))}
                        disabled={optionsLoading || landOptions.category.length === 0}
                      >
                        {landOptions.category.map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      District
                      <select
                        className={numberInputClass}
                        value={landForm.district_index}
                        onChange={(e) => handleDistrictChange(Number(e.target.value))}
                        disabled={optionsLoading || landOptions.district.length === 0}
                      >
                        {landOptions.district.map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Taluka
                      <select
                        className={numberInputClass}
                        value={landForm.taluka_index}
                        onChange={(e) => handleTalukaChange(Number(e.target.value))}
                        disabled={optionsLoading || landOptions.taluka.length === 0}
                      >
                        {landOptions.taluka.map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Village
                      <select
                        className={numberInputClass}
                        value={landForm.village_index}
                        onChange={(e) => handleVillageChange(Number(e.target.value))}
                        disabled={optionsLoading || landOptions.village.length === 0}
                      >
                        {landOptions.village.map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Plot
                      <select
                        className={numberInputClass}
                        value={landForm.plot_index}
                        onChange={(e) => setLandForm((prev) => ({ ...prev, plot_index: Number(e.target.value) }))}
                        disabled={optionsLoading || landOptions.plot.length === 0}
                      >
                        {landOptions.plot.map((option) => (
                          <option key={option.index} value={option.index}>{getReadableLabel(option.label)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-foreground-dim mt-3">
                    {optionsLoading
                      ? 'Loading district/taluka/village options from Mahabhunakasha...'
                      : 'Selections are loaded live from Mahabhunakasha automation.'}
                  </p>
                  <div className="mt-5">
                    <button type="button" className="btn-premium" disabled={loading} onClick={submitLandLookup}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                      Run Land Automation
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm">
                      Farmer Name
                      <input
                        className={numberInputClass}
                        value={manualForm.farmer_name}
                        onChange={(e) => {
                          setManualForm((prev) => ({ ...prev, farmer_name: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, manualFarmerName: undefined }));
                        }}
                        placeholder="e.g. Ravi Patil"
                      />
                      {formErrors.manualFarmerName ? <p className="text-xs text-red-700">{formErrors.manualFarmerName}</p> : null}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Land Area (hectares)
                      <input
                        type="number"
                        step="0.001"
                        className={numberInputClass}
                        value={manualForm.farm_area_hectares}
                        onChange={(e) => {
                          setManualForm((prev) => ({ ...prev, farm_area_hectares: Number(e.target.value) }));
                          setFormErrors((prev) => ({ ...prev, manualArea: undefined }));
                        }}
                      />
                      {formErrors.manualArea ? <p className="text-xs text-red-700">{formErrors.manualArea}</p> : null}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Latitude
                      <input
                        type="number"
                        step="0.000001"
                        className={numberInputClass}
                        value={manualForm.latitude}
                        onChange={(e) => {
                          setManualForm((prev) => ({ ...prev, latitude: Number(e.target.value) }));
                          setFormErrors((prev) => ({ ...prev, manualLatitude: undefined }));
                        }}
                      />
                      {formErrors.manualLatitude ? <p className="text-xs text-red-700">{formErrors.manualLatitude}</p> : null}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Longitude
                      <input
                        type="number"
                        step="0.000001"
                        className={numberInputClass}
                        value={manualForm.longitude}
                        onChange={(e) => {
                          setManualForm((prev) => ({ ...prev, longitude: Number(e.target.value) }));
                          setFormErrors((prev) => ({ ...prev, manualLongitude: undefined }));
                        }}
                      />
                      {formErrors.manualLongitude ? <p className="text-xs text-red-700">{formErrors.manualLongitude}</p> : null}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Crop Type
                      <select
                        className={numberInputClass}
                        value={claimForm.crop_type}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, crop_type: e.target.value }))}
                      >
                        <option>Wheat</option>
                        <option>Rice</option>
                        <option>Cotton</option>
                        <option>Soybean</option>
                        <option>Sugarcane</option>
                        <option>Maize</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Damage Date
                      <input
                        type="date"
                        className={numberInputClass}
                        value={claimForm.damage_date}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, damage_date: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Analysis Start Date
                      <input
                        type="date"
                        className={numberInputClass}
                        value={claimForm.analysis_start_date}
                        onChange={(e) => {
                          setClaimForm((prev) => ({ ...prev, analysis_start_date: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, analysisDateRange: undefined }));
                        }}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Analysis End Date
                      <input
                        type="date"
                        className={numberInputClass}
                        value={claimForm.analysis_end_date}
                        onChange={(e) => {
                          setClaimForm((prev) => ({ ...prev, analysis_end_date: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, analysisDateRange: undefined }));
                        }}
                      />
                    </label>
                    {formErrors.analysisDateRange ? <p className="text-xs text-red-700 md:col-span-2">{formErrors.analysisDateRange}</p> : null}
                  </div>
                  <div className="mt-5">
                    <button type="button" className="btn-premium" disabled={loading} onClick={continueManualFlow}>
                      Continue to Analysis
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {step === 2 && entryMode === 'automation' && farm ? (
            <section className="feed-card">
              <div className="flex items-center gap-2 mb-4">
                <MapPinned size={18} className="text-primary" />
                <h2 className="text-xl font-semibold">Verify Highlighted Farm Area</h2>
              </div>
              <p className="text-sm text-foreground-muted mb-4">
                Confirm that highlighted polygon is your farm. No coordinate input is needed.
              </p>

              <FarmBoundaryMap
                polygon={farm.polygon}
                center={[farm.centroid_latitude, farm.centroid_longitude]}
                height={340}
              />

              <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                <p><strong>Owner(s):</strong> {ownerPreview}</p>
                <p><strong>Area:</strong> {farm.farm_area_hectares.toFixed(3)} ha</p>
                <p><strong>Survey:</strong> {farm.survey_numbers.join(', ') || 'N/A'}</p>
                <p><strong>Extent:</strong> {farm.extent.map((value) => value.toFixed(6)).join(', ')}</p>
              </div>

              {farm.screenshot_data_url ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground-main mb-2">Automation Screenshot</p>
                  <Image
                    src={farm.screenshot_data_url}
                    alt="Land record automation output"
                    width={1280}
                    height={720}
                    unoptimized
                    className="h-auto w-full rounded-xl border border-primary/10"
                  />
                </div>
              ) : null}

              <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={farmConfirmed}
                  onChange={(e) => setFarmConfirmed(e.target.checked)}
                />
                I confirm this highlighted area is my farm.
              </label>
            </section>
          ) : null}

          {step === 3 && (entryMode === 'manual' || farm) ? (
            <section className="feed-card">
              <h2 className="text-xl font-semibold mb-4">Claim Details & Satellite Settings</h2>
              {entryMode === 'manual' ? (
                <p className="text-sm text-foreground-muted mb-4">
                  Manual mode: claim uses provided farmer name, coordinates, and land area without automation.
                </p>
              ) : null}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  Crop Type
                  <select
                    className={numberInputClass}
                    value={claimForm.crop_type}
                    onChange={(e) => setClaimForm((prev) => ({ ...prev, crop_type: e.target.value }))}
                  >
                    <option>Wheat</option>
                    <option>Rice</option>
                    <option>Cotton</option>
                    <option>Soybean</option>
                    <option>Sugarcane</option>
                    <option>Maize</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Damage Date
                  <input
                    type="date"
                    className={numberInputClass}
                    value={claimForm.damage_date}
                    onChange={(e) => setClaimForm((prev) => ({ ...prev, damage_date: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Analysis Start Date
                  <input
                    type="date"
                    className={numberInputClass}
                    value={claimForm.analysis_start_date}
                    onChange={(e) => setClaimForm((prev) => ({ ...prev, analysis_start_date: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Analysis End Date
                  <input
                    type="date"
                    className={numberInputClass}
                    value={claimForm.analysis_end_date}
                    onChange={(e) => setClaimForm((prev) => ({ ...prev, analysis_end_date: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Before Gap (days)
                  <input
                    type="number"
                    className={numberInputClass}
                    value={claimForm.gap_before}
                    disabled
                    onChange={() => undefined}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  After Gap (days)
                  <input
                    type="number"
                    className={numberInputClass}
                    value={claimForm.gap_after}
                    disabled
                    onChange={() => undefined}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Window Days
                  <input
                    type="number"
                    className={numberInputClass}
                    value={claimForm.window_days}
                    disabled
                    onChange={() => undefined}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Max Cloud %
                  <input
                    type="number"
                    className={numberInputClass}
                    value={claimForm.max_cloud_threshold}
                    onChange={(e) => setClaimForm((prev) => ({ ...prev, max_cloud_threshold: Number(e.target.value) }))}
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="feed-card text-center">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground-main mb-2">Submitting your request...</p>
              <p className="text-sm text-foreground-muted">{jobInfo}</p>
              <div className="mt-4 max-w-md mx-auto">
                <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, jobProgress))}%` }}
                  />
                </div>
                <p className="text-xs text-foreground-dim mt-2">{Math.round(jobProgress)}% complete</p>
              </div>
            </section>
          ) : null}

          <footer className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 text-sm font-semibold disabled:opacity-50"
              onClick={() =>
                setStep((prev) => {
                  if (prev <= 1) return 1;
                  if (prev === 2) return 1;
                  if (prev === 3) return 2;
                  return 3;
                })
              }
              disabled={step === 1 || loading || step === 4}
            >
              <ChevronLeft size={14} />
              Back
            </button>

            {step === 2 ? (
              <button
                type="button"
                className="btn-premium disabled:opacity-50"
                disabled={!canStep3}
                onClick={() => setStep(3)}
              >
                <ShieldCheck size={14} />
                Continue to Request
              </button>
            ) : null}

            {step === 3 ? (
              <button
                type="button"
                className="btn-premium"
                onClick={submitClaim}
                disabled={loading || !canStep3}
              >
                Submit Request
              </button>
            ) : null}
          </footer>
        </>
      ) : null}
    </div>
  );
}
