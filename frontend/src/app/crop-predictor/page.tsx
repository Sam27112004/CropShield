'use client';

import { FormEvent, useState } from 'react';
import { Leaf, Droplets, Thermometer, Sprout, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import { ApiError, cropPredict } from '@/lib/api';
import type { CropPredictResponse } from '@/types/api';

export default function CropPredictorPage() {
  const [cropType, setCropType] = useState('Rice');
  const [soilType, setSoilType] = useState('Loam');
  const [rainfallMm, setRainfallMm] = useState(920);
  const [temperatureC, setTemperatureC] = useState(29);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropPredictResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cropType.trim() || !soilType.trim()) {
      setError('Please provide valid crop and soil values.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cropPredict({
        crop_type: cropType.trim(),
        soil_type: soilType.trim(),
        rainfall_mm: rainfallMm,
        temperature_c: temperatureC,
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <Sprout className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Yield Planning Intelligence</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Crop Predictor</h1>
        <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
          Estimate expected field yield and assess operational risk based on soil, temperature, and rainfall signals.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* INPUT FORM SECTION */}
        <div className="xl:col-span-7 bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] relative overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Leaf className="w-5 h-5" /> Active Field Parameters
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
            
            {/* Top row: Dropdowns/Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Crop Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Sprout className="h-4 w-4 text-emerald-500" />
                  </div>
                  <input 
                    value={cropType} 
                    onChange={(e) => setCropType(e.target.value)} 
                    placeholder="e.g., Rice, Wheat" 
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Soil Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Leaf className="h-4 w-4 text-[#6D4C41]" />
                  </div>
                  <input 
                    value={soilType} 
                    onChange={(e) => setSoilType(e.target.value)} 
                    placeholder="e.g., Loam, Clay" 
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 my-2" />

            {/* Sliders */}
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" /> Seasonal Rainfall
                    </label>
                  </div>
                  <span className="text-lg font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl shadow-sm border border-blue-100">{rainfallMm} mm</span>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="2000" 
                  step="10"
                  value={rainfallMm} 
                  onChange={(e) => setRainfallMm(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Avg Temperature
                    </label>
                  </div>
                  <span className="text-lg font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-xl shadow-sm border border-orange-100">{temperatureC} °C</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="45" 
                  step="1"
                  value={temperatureC} 
                  onChange={(e) => setTemperatureC(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="mt-4 flex items-center justify-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-2xl py-4 text-sm font-bold transition-all shadow-[0_8px_24px_rgba(27,36,29,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              {loading ? 'Analyzing Signals...' : 'Generate Prediction'}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] h-full flex flex-col">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5" /> Prediction Output
            </h2>

            {result ? (
              <div className="flex flex-col gap-6 flex-1">
                
                {/* Expected Yield Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-[#2f855a] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex-shrink-0">
                  <Leaf className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10" />
                  <p className="text-emerald-100 text-[11px] font-bold tracking-widest uppercase mb-2">Expected Yield Output</p>
                  <p className="text-4xl md:text-5xl font-extrabold flex items-baseline gap-2 relative z-10">
                    {result.expected_yield_tph.toFixed(2)}
                    <span className="text-xl font-semibold text-emerald-100">t/ha</span>
                  </p>
                </div>

                {/* Risk Level Card */}
                <div className={`rounded-[24px] p-5 border ${result.risk_level.toLowerCase() === 'high' ? 'bg-red-50 border-red-100' : result.risk_level.toLowerCase() === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} flex items-center gap-4`}>
                    <div className={`p-3 rounded-2xl ${result.risk_level.toLowerCase() === 'high' ? 'bg-red-500' : result.risk_level.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Operational Risk</p>
                      <p className={`text-xl font-extrabold capitalize ${result.risk_level.toLowerCase() === 'high' ? 'text-red-700' : result.risk_level.toLowerCase() === 'medium' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {result.risk_level}
                      </p>
                    </div>
                </div>

                {/* Recommendation Box */}
                <div className="rounded-[24px] p-5 border border-gray-100 bg-gray-50 flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">AI Recommendation</p>
                  <p className="text-sm font-medium leading-relaxed text-gray-700">{result.recommendation}</p>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <Sprout className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-sm font-bold text-gray-400 mb-2">No Prediction Generated</h3>
                <p className="text-xs text-gray-400 max-w-[250px]">
                  Adjust the field parameters on the left and click 'Generate Prediction' to see yield estimates.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
