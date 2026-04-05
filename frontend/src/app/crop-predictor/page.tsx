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
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Yield Planning</p>
          <h1 className="page-title gradient-text">Crop Predictor</h1>
          <p className="page-description mt-3">Estimate expected yield and operational risk using simple field inputs.</p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="feed-card">
        <div className="mb-4">
          <p className="section-heading mb-2">Input Signals</p>
          <p className="section-note">Enter the core field signals to estimate yield and operational risk.</p>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3" onSubmit={handleSubmit}>
          <input value={cropType} onChange={(e) => setCropType(e.target.value)} placeholder="Crop type" className="control-input rounded-2xl px-3 py-2 text-sm" />
          <input value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="Soil type" className="control-input rounded-2xl px-3 py-2 text-sm" />
          <input value={rainfallMm} onChange={(e) => setRainfallMm(e.target.value)} placeholder="Rainfall (mm)" className="control-input rounded-2xl px-3 py-2 text-sm" />
          <input value={temperatureC} onChange={(e) => setTemperatureC(e.target.value)} placeholder="Temp (°C)" className="control-input rounded-2xl px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Predicting...' : 'Predict'}
          </button>
        </form>
      </section>

      <section className="feed-card">
        <p className="section-heading mb-2">Prediction</p>
        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="stat-card__label">Expected Yield</p>
                <p className="stat-card__value">{result.expected_yield_tph.toFixed(2)} <span className="text-sm font-semibold text-foreground-dim">t/ha</span></p>
              </div>
              <div className="stat-card">
                <p className="stat-card__label">Risk Level</p>
                <p className="stat-card__value capitalize">{result.risk_level}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border-glass bg-white/80 px-4 py-4">
              <p className="section-heading mb-2">Recommendation</p>
              <p className="section-note">{result.recommendation}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No prediction yet.</p>
        )}
      </section>
    </div>
  );
}
