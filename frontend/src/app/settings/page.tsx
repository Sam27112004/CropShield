'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApiError, getHealthStatus, getReadinessStatus, invalidateAdminCache } from '@/lib/api';

const PREF_EMAIL_KEY = 'cropshield_pref_email_on_review';
const PREF_BANNER_KEY = 'cropshield_pref_inapp_analysis_banner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailPref, setEmailPref] = useState(false);
  const [bannerPref, setBannerPref] = useState(true);

  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('unknown');
  const [readyStatus, setReadyStatus] = useState<string>('unknown');
  const [readyDatabase, setReadyDatabase] = useState<string>('unknown');
  const [readyRedis, setReadyRedis] = useState<string>('unknown');

  const [cacheBusy, setCacheBusy] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(PREF_EMAIL_KEY);
    const savedBanner = window.localStorage.getItem(PREF_BANNER_KEY);
    setEmailPref(savedEmail === 'true');
    setBannerPref(savedBanner !== 'false');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PREF_EMAIL_KEY, String(emailPref));
  }, [emailPref]);

  useEffect(() => {
    window.localStorage.setItem(PREF_BANNER_KEY, String(bannerPref));
  }, [bannerPref]);

  const loadApiStatus = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const [health, readiness] = await Promise.all([getHealthStatus(), getReadinessStatus()]);
      setHealthStatus(health.status);
      setReadyStatus(readiness.status);
      setReadyDatabase(readiness.database);
      setReadyRedis(readiness.redis);
    } catch (err) {
      if (err instanceof ApiError) {
        setHealthError(`Unable to fetch backend status (${err.status}).`);
      } else {
        setHealthError(`Unable to fetch backend status: ${String(err)}`);
      }
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadApiStatus();
  }, [isAdmin]);

  const clearDashboardCache = async () => {
    setCacheBusy(true);
    setCacheMessage(null);
    try {
      const response = await invalidateAdminCache();
      setCacheMessage(`Cache cleared successfully: ${response.cache_key}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setCacheMessage(`Failed to clear cache (${err.status}).`);
      } else {
        setCacheMessage(`Failed to clear cache: ${String(err)}`);
      }
    } finally {
      setCacheBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <header className="glass rounded-2xl p-6 border border-primary/10">
        <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
        <p className="text-sm text-foreground-muted">Manage profile visibility, notifications, and admin operational controls.</p>
      </header>

      <section className="glass rounded-2xl p-6 border border-primary/10">
        <h2 className="text-lg font-bold text-foreground-main mb-4">Profile</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
            <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">Name</p>
            <p className="font-semibold text-foreground-main">{user?.name ?? 'Unknown'}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
            <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">Email</p>
            <p className="font-semibold text-foreground-main">{user?.email ?? 'Not available'}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
            <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">Role</p>
            <p className="font-semibold text-foreground-main capitalize">{user?.role ?? 'Unknown'}</p>
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-6 border border-primary/10">
        <h2 className="text-lg font-bold text-foreground-main mb-4">Notification Preferences</h2>
        <div className="space-y-3 text-sm">
          <label className="inline-flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={emailPref}
              onChange={(event) => setEmailPref(event.target.checked)}
            />
            <span>Email me when admin reviews my claim</span>
          </label>
          <label className="inline-flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={bannerPref}
              onChange={(event) => setBannerPref(event.target.checked)}
            />
            <span>Show in-app banner when analysis completes</span>
          </label>
        </div>
      </section>

      {isAdmin ? (
        <>
          <section className="glass rounded-2xl p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground-main">API Status</h2>
              <button
                type="button"
                onClick={loadApiStatus}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 text-sm font-semibold"
                disabled={healthLoading}
              >
                <RefreshCw size={14} className={healthLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
              <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
                <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">Frontend API Base URL</p>
                <p className="font-semibold text-foreground-main break-all">{apiBaseUrl}</p>
              </div>
              <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
                <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">/health</p>
                <p className="font-semibold text-foreground-main capitalize">{healthStatus}</p>
              </div>
              <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
                <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">/ready</p>
                <p className="font-semibold text-foreground-main capitalize">{readyStatus}</p>
              </div>
              <div className="rounded-xl border border-primary/10 bg-white/70 p-3">
                <p className="text-foreground-dim text-xs uppercase tracking-wider mb-1">Dependencies</p>
                <p className="font-semibold text-foreground-main">DB: {readyDatabase} | Redis: {readyRedis}</p>
              </div>
            </div>

            {healthError ? <p className="text-sm text-red-700">{healthError}</p> : null}
          </section>

          <section className="glass rounded-2xl p-6 border border-red-300/40">
            <h2 className="text-lg font-bold text-red-700 mb-2 inline-flex items-center gap-2">
              <ShieldAlert size={18} />
              Danger Zone
            </h2>
            <p className="text-sm text-foreground-muted mb-4">
              Invalidate dashboard cache to force fresh summary computation on the next request.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800"
              onClick={clearDashboardCache}
              disabled={cacheBusy}
            >
              {cacheBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              Clear Dashboard Cache
            </button>
            {cacheMessage ? <p className="mt-3 text-sm text-foreground-main">{cacheMessage}</p> : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
