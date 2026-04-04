'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { analyzeClaim, getAnalysis, getAnalysisArtifacts, getClaim, waitForJobCompletion } from '@/lib/api';
import type { AnalysisArtifacts, AnalysisResult, Claim, JobStatusResponse } from '@/types/api';

function ImagePanel({ title, src }: { title: string; src: string }) {
  return (
    <div className="glass rounded-xl overflow-hidden border border-primary/10">
      <p className="px-4 py-3 text-sm font-semibold text-foreground-main border-b border-primary/10">{title}</p>
      <div className="bg-black/20">
        <img src={src} alt={title} className="w-full h-auto object-contain" />
      </div>
    </div>
  );
}

function extractAttemptedWindows(reason: string): string[] {
  const windowsMatch = reason.match(/expanded attempts:\s*([^)]*)\)/i);
  if (!windowsMatch?.[1]) {
    return [];
  }
  return windowsMatch[1]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function AnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params.id;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [artifacts, setArtifacts] = useState<AnalysisArtifacts | null>(null);
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [claimData, analysisData] = await Promise.all([
        getClaim(claimId),
        getAnalysis(claimId),
      ]);
      setClaim(claimData);
      setAnalysis(analysisData);
      if (analysisData.analysis?.status === 'completed') {
        const art = await getAnalysisArtifacts(claimId);
        setArtifacts(art);
      } else {
        setArtifacts(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const runAnalysis = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await analyzeClaim(claimId);
      const latest = await waitForJobCompletion(response.job_id, {
        timeoutMs: 10 * 60_000,
        onUpdate: (update) => setJob(update),
      });
      if (latest.status === 'failed') {
        throw new Error(latest.error_message ?? 'Analysis failed');
      }
      if (latest.status === 'completed') {
        await load();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const metrics = analysis?.analysis?.metrics;
  const ai = analysis?.analysis?.ai_prediction;
  const farmerAssessment = analysis?.analysis?.farmer_assessment;
  const analysisStatus = analysis?.analysis?.status;
  const isApprovedByAdmin = claim?.admin_status === 'approved';
  const failureReason =
    (analysisStatus === 'failed' ? analysis?.analysis?.status_message : null) ||
    (job?.status === 'failed' ? job.error_message : null);
  const attemptedWindows = failureReason ? extractAttemptedWindows(failureReason) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/farmer/requests" className="inline-flex items-center gap-2 text-primary no-underline">
          <ArrowLeft size={16} />
          Back to Requests
        </Link>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-sm font-semibold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="glass rounded-xl p-4 border border-red-300/60 text-red-700 text-sm">{error}</div>
      ) : null}

      {loading ? (
        <div className="glass rounded-2xl p-8 border border-primary/10 text-center">
          <Loader2 size={24} className="animate-spin text-primary mx-auto mb-3" />
          Loading analysis...
        </div>
      ) : null}

      {!loading && claim ? (
        <section className="glass rounded-2xl p-6 border border-primary/10 grid md:grid-cols-4 gap-4 text-sm">
          <p><strong>Claim ID:</strong> #{claim.id}</p>
          <p><strong>Farmer:</strong> {claim.farmer_name}</p>
          <p><strong>Crop:</strong> {claim.crop_type}</p>
          <p><strong>Damage Date:</strong> {claim.damage_date}</p>
        </section>
      ) : null}

      {!loading && claim && !isApprovedByAdmin ? (
        <section className="glass rounded-2xl p-6 border border-amber-300/60">
          <h2 className="text-lg font-bold text-amber-700 mb-2">Detailed Report Locked</h2>
          <p className="text-sm text-amber-900 mb-2">
            This detailed report is only available after admin approval.
          </p>
          <p className="text-sm text-foreground-main">
            Current admin status: <strong>{claim.admin_status}</strong>
          </p>
        </section>
      ) : null}

      {!loading && isApprovedByAdmin && !analysis?.analysis ? (
        <section className="glass rounded-2xl p-6 border border-primary/10 text-center">
          <p className="text-foreground-muted mb-4">No analysis found for this claim yet.</p>
          <button type="button" className="btn-premium" onClick={runAnalysis} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Run Analysis
          </button>
        </section>
      ) : null}

      {isApprovedByAdmin && analysis?.analysis && analysis.analysis.status !== 'completed' ? (
        <section className="glass rounded-2xl p-6 border border-primary/10 text-center">
          <p className="text-foreground-main font-semibold mb-2">Analysis status: {analysis.analysis.status}</p>
          <p className="text-sm text-foreground-muted mb-4">{job ? `${job.status} (${job.progress}%)` : 'Processing...'}</p>
          <button type="button" className="btn-premium" onClick={runAnalysis} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Re-check Analysis
          </button>
        </section>
      ) : null}

      {isApprovedByAdmin && failureReason ? (
        <section className="glass rounded-2xl p-6 border border-red-300/60">
          <h2 className="text-lg font-bold text-red-700 mb-2">Imagery Lookup Failed</h2>
          <p className="text-sm text-red-800 mb-3">{failureReason}</p>
          {attemptedWindows.length > 0 ? (
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-2">Attempted date windows:</p>
              <ul className="list-disc pl-5 space-y-1">
                {attemptedWindows.map((windowText) => (
                  <li key={windowText}>{windowText}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-foreground-dim mt-3">
            Try changing analysis start/end dates to a wider or older period, then run analysis again.
          </p>
        </section>
      ) : null}

      {isApprovedByAdmin && analysis?.analysis?.status === 'completed' ? (
        <>
          {farmerAssessment ? (
            <section className="glass rounded-2xl p-6 border border-primary/10">
              <h2 className="text-xl font-bold text-foreground-main mb-2">Possible Crop Damage Assessment</h2>
              <p className="text-3xl font-bold text-primary mb-2">{farmerAssessment.possible_damage_percentage.toFixed(1)}%</p>
              <p className="text-sm font-semibold text-foreground-main mb-2">{farmerAssessment.risk_level}</p>
              <p className="text-sm text-foreground-muted">{farmerAssessment.summary}</p>
              <p className="text-xs text-foreground-dim mt-3">
                Final insurance amount is reviewed by admin and aligned with PMFBY workflow.
              </p>
            </section>
          ) : null}

          {metrics ? (
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4 border border-primary/10">
                <p className="text-xs text-foreground-dim uppercase mb-1">NDVI Delta</p>
                <p className="text-2xl font-bold">{(metrics.ndvi_after - metrics.ndvi_before).toFixed(3)}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-primary/10">
                <p className="text-xs text-foreground-dim uppercase mb-1">NDWI Delta</p>
                <p className="text-2xl font-bold">{(metrics.ndwi_after - metrics.ndwi_before).toFixed(3)}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-primary/10">
                <p className="text-xs text-foreground-dim uppercase mb-1">EVI Delta</p>
                <p className="text-2xl font-bold">{(metrics.evi_after - metrics.evi_before).toFixed(3)}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-primary/10">
                <p className="text-xs text-foreground-dim uppercase mb-1">Damage %</p>
                <p className="text-2xl font-bold">{metrics.damage_percentage.toFixed(1)}%</p>
              </div>
            </section>
          ) : null}

          {ai ? (
            <section className="glass rounded-2xl p-6 border border-primary/10">
              <h2 className="text-lg font-bold text-foreground-main mb-3">AI Vegetation Analysis</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <p><strong>Model:</strong> {ai.model_version}</p>
                <p><strong>Predicted:</strong> {ai.predicted_class}</p>
                <p><strong>Damage Probability:</strong> {(ai.damage_probability * 100).toFixed(1)}%</p>
              </div>
            </section>
          ) : null}

          {artifacts ? (
            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <ImagePanel title="RGB Before" src={artifacts.before_rgb_data_url} />
              <ImagePanel title="RGB After" src={artifacts.after_rgb_data_url} />
              <ImagePanel title="NDVI Before" src={artifacts.ndvi_before_data_url} />
              <ImagePanel title="NDVI After" src={artifacts.ndvi_after_data_url} />
              <ImagePanel title="NDWI Before" src={artifacts.ndwi_before_data_url} />
              <ImagePanel title="NDWI After" src={artifacts.ndwi_after_data_url} />
              <ImagePanel title="EVI Before" src={artifacts.evi_before_data_url} />
              <ImagePanel title="EVI After" src={artifacts.evi_after_data_url} />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
