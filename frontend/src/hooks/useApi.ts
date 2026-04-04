'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  getAdminClaims,
  getAnalysis,
  getAnalysisArtifacts,
  getClaim,
  getClaims,
  getDashboardSummary,
  getFarmProfile,
  getFarms,
  getJob,
  getMarketCommodities,
  getMandiData,
  getTrendingCommodities,
  getWeatherAlerts,
  getWeatherCurrent,
  getWeatherForecast,
} from '@/lib/api';
import type {
  AdminClaimsResponse,
  AnalysisArtifacts,
  AnalysisResult,
  Claim,
  ClaimsListResponse,
  DashboardSummary,
  FarmProfile,
  FarmsListResponse,
  JobStatusResponse,
  CommoditiesResponse,
  MandiDataResponse,
  TrendingCommoditiesResponse,
  WeatherAlerts,
  WeatherCurrent,
  WeatherForecast,
} from '@/types/api';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseQueryOptions {
  enabled?: boolean;
}

function useQuery<T>(fetcher: () => Promise<T>, options?: UseQueryOptions): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const enabled = options?.enabled ?? true;

  const refetch = useCallback(() => setRev((item) => item + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
        setError(message);
        setData(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev, enabled]);

  return { data, loading, error, refetch };
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>(getDashboardSummary);
}

export function useWeatherCurrent(location = 'Unknown') {
  return useQuery<WeatherCurrent>(() => getWeatherCurrent(location));
}

export function useWeatherForecast(location = 'Unknown', days = 5) {
  return useQuery<WeatherForecast>(() => getWeatherForecast(location, days));
}

export function useWeatherAlerts(location = 'Unknown') {
  return useQuery<WeatherAlerts>(() => getWeatherAlerts(location));
}

export function useMarketCommodities() {
  return useQuery<CommoditiesResponse>(getMarketCommodities);
}

export function useTrendingCommodities() {
  return useQuery<TrendingCommoditiesResponse>(getTrendingCommodities);
}

export function useMandiData() {
  return useQuery<MandiDataResponse>(getMandiData);
}

export function useClaims(params?: { limit?: number; offset?: number }) {
  return useQuery<ClaimsListResponse>(() => getClaims(params));
}

export function useClaim(claimId: string | number, enabled = true) {
  return useQuery<Claim>(
    () => getClaim(claimId),
    { enabled: enabled && claimId !== undefined && claimId !== null && String(claimId).length > 0 },
  );
}

export function useAnalysis(claimId: string | number, enabled = true) {
  return useQuery<AnalysisResult>(
    () => getAnalysis(claimId),
    { enabled: enabled && claimId !== undefined && claimId !== null && String(claimId).length > 0 },
  );
}

export function useAnalysisArtifacts(claimId: string | number, enabled = true) {
  return useQuery<AnalysisArtifacts>(
    () => getAnalysisArtifacts(claimId),
    { enabled: enabled && claimId !== undefined && claimId !== null && String(claimId).length > 0 },
  );
}

export function useJob(jobId: string | null, enabled = true) {
  return useQuery<JobStatusResponse>(
    () => getJob(jobId || ''),
    { enabled: enabled && !!jobId },
  );
}

export function useFarms(params?: { limit?: number; offset?: number }) {
  return useQuery<FarmsListResponse>(() => getFarms(params));
}

export function useFarm(farmId: string | number, enabled = true) {
  return useQuery<FarmProfile>(
    () => getFarmProfile(farmId),
    { enabled: enabled && farmId !== undefined && farmId !== null && String(farmId).length > 0 },
  );
}

export function useAdminClaims(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  admin_status?: string;
  crop_type?: string;
  damage_date_from?: string;
  damage_date_to?: string;
  search?: string;
}) {
  return useQuery<AdminClaimsResponse>(() => getAdminClaims(params));
}
