'use client';

import { FormEvent, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { ApiError, detectDisease } from '@/lib/api';
import type { DiseaseDetectResponse } from '@/types/api';

export default function DiseasePage() {
  const [imageName, setImageName] = useState('tomato_leaf_spot.jpg');
  const [cropType, setCropType] = useState('tomato');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseDetectResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageName.trim()) {
      setError('Image name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await detectDisease({ image_name: imageName.trim(), crop_type: cropType.trim() || undefined });
      setResult(response);
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Health Screening</p>
          <h1 className="page-title gradient-text">Disease Detection</h1>
          <p className="page-description mt-3">Submit an image label reference to simulate disease screening and recommendations.</p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="feed-card">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-foreground-dim font-semibold uppercase tracking-wider">Image Name</label>
            <input
              value={imageName}
              onChange={(event) => setImageName(event.target.value)}
              className="mt-1 w-full control-input rounded-2xl px-3 py-2 text-sm text-foreground-main focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-dim font-semibold uppercase tracking-wider">Crop Type</label>
            <input
              value={cropType}
              onChange={(event) => setCropType(event.target.value)}
              className="mt-1 w-full control-input rounded-2xl px-3 py-2 text-sm text-foreground-main focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Detect Disease'}
          </button>
        </form>
      </section>

      <section className="feed-card">
        <p className="section-heading mb-2">Result</p>
        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="stat-card__label">Predicted Disease</p>
                <p className="stat-card__value">{result.predicted_disease}</p>
              </div>
              <div className="stat-card">
                <p className="stat-card__label">Confidence</p>
                <p className="stat-card__value">{(result.confidence * 100).toFixed(1)}%</p>
                <div className="mt-2 h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, result.confidence * 100))}%` }} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border-glass bg-white/80 px-4 py-4">
              <p className="section-heading mb-2">Recommendation</p>
              <p className="section-note">{result.recommendation}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No disease result yet.</p>
        )}
      </section>
    </div>
  );
}
