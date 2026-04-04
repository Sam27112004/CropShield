'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPinned, ShieldCheck, Satellite, ChevronLeft, ExternalLink, RefreshCw, Lock } from 'lucide-react';
import FarmBoundaryMap from '@/components/FarmBoundaryMap';
import { useClaims } from '@/hooks/useApi';
import { ApiError, analyzeClaim, createClaim, createFarmProfile, getFarmOptions, waitForJobCompletion } from '@/lib/api';
import type { Claim, FarmOptionsResponse, FarmProfile } from '@/types/api';

type Step = 1 | 2 | 3 | 4;
type EntryMode = 'automation' | 'manual';
type ViewMode = 'new' | 'status';

function canViewDetailedReport(claim: Claim): boolean {
  return claim.admin_status === 'approved';
}

function getFarmerStatusLabel(claim: Claim): string {
  if (claim.admin_status === 'approved') return 'Approved by Admin';
  if (claim.admin_status === 'rejected') return 'Rejected by Admin';
  if (claim.admin_status === 'needs_more_info') return 'Needs More Information';
  if (claim.status === 'failed') return 'Analysis Failed';
  if (claim.status === 'analysis_running') return 'Analysis In Progress';
  if (claim.status === 'analysis_completed') return 'Pending Admin Review';
  return 'Submitted';
}

export default function FarmerRequestsPage() {
  const [view, setView] = useState<ViewMode>('new');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [farmConfirmed, setFarmConfirmed] = useState(false);
  const [jobInfo, setJobInfo] = useState<string>('Waiting...');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('automation');
  const [submittedClaimId, setSubmittedClaimId] = useState<number | null>(null);

  const claimsQuery = useClaims({ limit: 100, offset: 0 });
  const claims = claimsQuery.data?.items ?? [];

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
    if (!landForm.farmer_name.trim()) {
      setError('Farmer name is required.');
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
    if (!manualForm.farmer_name.trim()) {
      setError('Farmer name is required.');
      return;
    }
    if (manualForm.farm_area_hectares <= 0) {
      setError('Land area must be greater than 0.');
      return;
    }
    if (manualForm.latitude < -90 || manualForm.latitude > 90) {
      setError('Latitude must be between -90 and 90.');
      return;
    }
    if (manualForm.longitude < -180 || manualForm.longitude > 180) {
      setError('Longitude must be between -180 and 180.');
      return;
    }
    if (claimForm.analysis_start_date > claimForm.analysis_end_date) {
      setError('Analysis start date must be on or before analysis end date.');
      return;
    }
    setStep(3);
  };

  const buildAnalysisParams = () => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const damageDate = new Date(`${claimForm.damage_date}T00:00:00`);
    const startDate = new Date(`${claimForm.analysis_start_date}T00:00:00`);
    const endDate = new Date(`${claimForm.analysis_end_date}T00:00:00`);

    const gapBefore = Math.max(1, Math.ceil((damageDate.getTime() - startDate.getTime()) / MS_PER_DAY));
    const gapAfter = Math.max(1, Math.ceil((endDate.getTime() - damageDate.getTime()) / MS_PER_DAY));
    const windowDays = Math.max(7, Math.min(45, Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1));

    return {
      gap_before: gapBefore,
      gap_after: gapAfter,
      window_days: windowDays,
      max_cloud_threshold: claimForm.max_cloud_threshold,
      upscale_factor: claimForm.upscale_factor,
    };
  };

  const submitClaim = async () => {
    if (entryMode === 'automation' && !farm) return;
    setError(null);
    setLoading(true);
    setStep(4);
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
      const latest = await waitForJobCompletion(job.job_id, {
        timeoutMs: 10 * 60_000,
        onUpdate: (update) => setJobInfo(`Analysis status: ${update.status} (${update.progress ?? 0}%)`),
      });

      if (latest.status === 'failed') {
        throw new Error(latest.error_message ?? 'Analysis failed.');
      }
      if (latest.status === 'completed') {
        setSubmittedClaimId(claim.id);
        claimsQuery.refetch();
        setView('status');
        setStep(1);
        setLoading(false);
        return;
      }
      throw new Error('Analysis ended in an unexpected state. Please retry.');
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  const numberInputClass =
    'w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-sm outline-none focus:border-primary';

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      <header className="glass rounded-2xl p-6 border border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Farmer Request Portal</h1>
            <p className="text-foreground-muted text-sm">
              Raise crop-damage request, track status, and view detailed report only after admin approval.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                view === 'new' ? 'bg-primary text-white border-primary' : 'bg-white/80 text-foreground-main border-primary/20'
              }`}
              onClick={() => setView('new')}
            >
              Raise Request
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                view === 'status' ? 'bg-primary text-white border-primary' : 'bg-white/80 text-foreground-main border-primary/20'
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

      {view === 'status' ? (
        <section className="glass rounded-2xl overflow-hidden border border-primary/10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10">
            <h2 className="text-lg font-bold text-foreground-main">Submitted Requests</h2>
            <button
              type="button"
              onClick={claimsQuery.refetch}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-sm font-semibold"
            >
              <RefreshCw size={14} className={claimsQuery.loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
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
                    <tr key={claim.id} className={`border-b border-primary/5 ${highlight ? 'bg-primary/5' : ''}`}>
                      <td className="px-5 py-4 font-mono text-sm">#{claim.id}</td>
                      <td className="px-5 py-4 text-sm">{claim.farmer_name}</td>
                      <td className="px-5 py-4 text-sm">{claim.crop_type}</td>
                      <td className="px-5 py-4 text-sm">{claim.damage_date}</td>
                      <td className="px-5 py-4 text-sm">{getFarmerStatusLabel(claim)}</td>
                      <td className="px-5 py-4 text-sm">{claim.admin_status}</td>
                      <td className="px-5 py-4 text-sm">
                        {approved ? (
                          <Link href={`/analysis/${claim.id}`} className="inline-flex items-center gap-1 text-primary font-semibold no-underline">
                            View Detailed Report
                            <ExternalLink size={14} />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-foreground-dim">
                            <Lock size={13} />
                            Locked until admin approval
                          </span>
                        )}
                      </td>
                    </tr>
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
            <section className="glass rounded-2xl p-6 border border-primary/10">
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
                        onChange={(e) => setLandForm((prev) => ({ ...prev, farmer_name: e.target.value }))}
                        placeholder="e.g. Ravi Patil"
                      />
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
                        onChange={(e) => setManualForm((prev) => ({ ...prev, farmer_name: e.target.value }))}
                        placeholder="e.g. Ravi Patil"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Land Area (hectares)
                      <input
                        type="number"
                        step="0.001"
                        className={numberInputClass}
                        value={manualForm.farm_area_hectares}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, farm_area_hectares: Number(e.target.value) }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Latitude
                      <input
                        type="number"
                        step="0.000001"
                        className={numberInputClass}
                        value={manualForm.latitude}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Longitude
                      <input
                        type="number"
                        step="0.000001"
                        className={numberInputClass}
                        value={manualForm.longitude}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
                      />
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
            <section className="glass rounded-2xl p-6 border border-primary/10">
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
                  <img src={farm.screenshot_data_url} alt="Land record automation output" className="rounded-xl border border-primary/10" />
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
            <section className="glass rounded-2xl p-6 border border-primary/10">
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
            <section className="glass rounded-2xl p-6 border border-primary/10 text-center">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground-main mb-2">Submitting your request...</p>
              <p className="text-sm text-foreground-muted">{jobInfo}</p>
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
