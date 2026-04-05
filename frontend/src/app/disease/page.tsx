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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Disease Detection</h1>
        <p className="text-foreground-muted">Submit an image label reference to simulate disease screening and recommendations.</p>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-foreground-dim font-semibold uppercase tracking-wider">Image Name</label>
            <input
              value={imageName}
              onChange={(event) => setImageName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-dim font-semibold uppercase tracking-wider">Crop Type</label>
            <input
              value={cropType}
              onChange={(event) => setCropType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Detect Disease'}
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Result</p>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground-main">Predicted: <span className="font-semibold">{result.predicted_disease}</span></p>
            <p className="text-sm text-foreground-main">Confidence: <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span></p>
            <p className="text-sm text-foreground-muted">Recommendation: {result.recommendation}</p>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No disease result yet.</p>
        )}
      </section>
    </div>
  );
}
