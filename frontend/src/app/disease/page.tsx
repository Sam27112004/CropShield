'use client';

import { FormEvent, useState } from 'react';
import { Upload, ScanSearch, CheckCircle2, AlertTriangle, Bug, Image as ImageIcon, Leaf, ChevronRight, Activity } from 'lucide-react';
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <Bug className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Health Screening Engine</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Disease Detector</h1>
        <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
          Identify crop diseases instantly by submitting field imagery. Our AI will analyze symptoms and recommend treatment.
        </p>
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* INPUT FORM SECTION */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] relative overflow-hidden flex flex-col">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6 relative z-10">
            <Upload className="w-5 h-5" /> Submit Image Target
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10 flex-1">
            <div className="p-8 border-2 border-dashed border-emerald-100 rounded-[24px] bg-emerald-50/30 flex flex-col items-center justify-center text-center gap-3">
              <div className="bg-emerald-100/50 p-4 rounded-full">
                <ImageIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-800">Simulation Target</p>
              <p className="text-xs text-emerald-600/70 max-w-[200px]">Input the reference image name below to run the detection model.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Simulation Image Name</label>
                <input
                  value={imageName}
                  onChange={(event) => setImageName(event.target.value)}
                  placeholder="e.g., tomato_blight_01.jpg"
                  className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Crop Type (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                  </div>
                  <input
                    value={cropType}
                    onChange={(event) => setCropType(event.target.value)}
                    placeholder="e.g., Tomato, Wheat"
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-semibold rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-auto flex items-center justify-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-2xl py-4 text-sm font-bold transition-all shadow-[0_8px_24px_rgba(27,36,29,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Activity className="w-5 h-5 animate-spin" /> : <ScanSearch className="w-5 h-5" />}
              {loading ? 'Analyzing Pathology...' : 'Detect Disease'}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] relative overflow-hidden flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <ScanSearch className="w-5 h-5" /> Analysis Report
          </h2>

          {result ? (
            <div className="flex flex-col gap-5 flex-1">
              
              {/* Detection Block */}
              <div className="bg-gradient-to-br from-gray-900 to-[#1b241d] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <Bug className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                  <div>
                    <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-1">Pathology Result</p>
                    <p className="text-2xl lg:text-3xl font-extrabold text-white capitalize break-words">
                      {result.predicted_disease.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm self-start md:self-auto">
                    {result.confidence > 0.8 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    <span className="text-sm font-bold text-white">{(result.confidence * 100).toFixed(1)}% Confidence</span>
                  </div>
                </div>
                
                {/* Confidence Bar */}
                <div className="mt-6">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${result.confidence > 0.8 ? 'bg-emerald-400' : result.confidence > 0.5 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      style={{ width: `${Math.min(100, Math.max(0, result.confidence * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="rounded-[24px] p-6 border border-emerald-100 bg-emerald-50/50 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Treatment Protocol</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-700">
                  {result.recommendation}
                </p>
              </div>

            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <ScanSearch className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="text-sm font-bold text-gray-400 mb-2">Awaiting Image Target</h3>
              <p className="text-xs text-gray-400 max-w-[250px]">
                Submit an image reference on the left to activate the disease detection model.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
