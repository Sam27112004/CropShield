'use client';

import { FormEvent, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { ApiError, cropPredict } from '@/lib/api';
import type { CropPredictResponse } from '@/types/api';

export default function CropPredictorPage() {
  const [cropType, setCropType] = useState('rice');
  const [soilType, setSoilType] = useState('loam');
  const [rainfallMm, setRainfallMm] = useState('920');
  const [temperatureC, setTemperatureC] = useState('29');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropPredictResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rainfall = Number(rainfallMm);
    const temperature = Number(temperatureC);
    if (!cropType.trim() || !soilType.trim() || Number.isNaN(rainfall) || Number.isNaN(temperature)) {
      setError('Please provide valid crop, soil, rainfall, and temperature values.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cropPredict({
        crop_type: cropType.trim(),
        soil_type: soilType.trim(),
        rainfall_mm: rainfall,
        temperature_c: temperature,
      });
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
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Crop Predictor</h1>
        <p className="text-foreground-muted">Estimate expected yield and operational risk using simple field inputs.</p>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3" onSubmit={handleSubmit}>
          <input value={cropType} onChange={(e) => setCropType(e.target.value)} placeholder="Crop type" className="rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm" />
          <input value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="Soil type" className="rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm" />
          <input value={rainfallMm} onChange={(e) => setRainfallMm(e.target.value)} placeholder="Rainfall (mm)" className="rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm" />
          <input value={temperatureC} onChange={(e) => setTemperatureC(e.target.value)} placeholder="Temp (°C)" className="rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Predicting...' : 'Predict'}
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold mb-2">Prediction</p>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground-main">Expected Yield: <span className="font-semibold">{result.expected_yield_tph.toFixed(2)} t/ha</span></p>
            <p className="text-sm text-foreground-main">Risk Level: <span className="font-semibold">{result.risk_level}</span></p>
            <p className="text-sm text-foreground-muted">Recommendation: {result.recommendation}</p>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No prediction yet.</p>
        )}
      </section>
    </div>
  );
}
