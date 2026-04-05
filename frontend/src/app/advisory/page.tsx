'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';

interface AdvisoryEntry {
  asked_at: string;
  message: string;
  reply: string;
}

export default function AdvisoryPage() {
  const historyStorageKey = 'cropshield.advisory.history.v1';
  const [message, setMessage] = useState('How do I reduce heat stress in paddy this week?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AdvisoryEntry[]>([]);

  const conversationChartData = useMemo(
    () => entries.slice(0, 6).map((entry, index) => ({
      label: `#${index + 1}`,
      questionLength: entry.message.length,
      replyLength: entry.reply.length,
    })),
    [entries],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AdvisoryEntry[];
      if (Array.isArray(parsed)) {
        setEntries(parsed.slice(0, 20));
      }
    } catch {
      // Ignore malformed local history payload.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(entries.slice(0, 20)));
  }, [entries]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Enter a question before submitting.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await advisoryChat({ message: trimmed, language: 'en' });
      setEntries((prev) => [
        {
          asked_at: new Date().toISOString(),
          message: trimmed,
          reply: response.reply,
        },
        ...prev,
      ].slice(0, 20));
      setMessage('');
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.status}: ${err.message}` : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Advisory Assistant</p>
          <h1 className="page-title gradient-text">Crop Advisory</h1>
          <p className="page-description mt-3">Ask crop-care questions and get immediate guidance.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEntries([]);
            window.localStorage.removeItem(historyStorageKey);
          }}
          disabled={entries.length === 0}
          className="rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear Conversation
        </button>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="feed-card xl:col-span-2">
          <div className="mb-4">
            <p className="section-heading mb-2">Ask the Assistant</p>
            <p className="section-note">Request advice on irrigation, pests, nutrition, weather response, and crop care.</p>
          </div>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Ask about irrigation, pests, nutrient stress, or weather response..."
            className="control-textarea w-full rounded-2xl px-3 py-2 text-sm text-foreground-main focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="self-start rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Getting Advice...' : 'Ask Assistant'}
          </button>
        </form>
        </div>

        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Conversation Size</p>
            <p className="section-note">Question and reply length across the latest advisory exchanges.</p>
          </div>
          <div className="h-[300px]">
            {conversationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,133,90,0.10)" />
                  <XAxis dataKey="label" tick={{ fill: '#486151', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#486151', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(47, 133, 90, 0.16)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 30px rgba(31, 52, 38, 0.12)',
                    }}
                  />
                  <Bar dataKey="questionLength" fill="#68c18a" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="replyLength" fill="#2f855a" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full flex items-center justify-center">No advisory messages yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="feed-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="section-heading">Conversation</p>
          <p className="text-xs text-foreground-dim">{entries.length} message{entries.length === 1 ? '' : 's'}</p>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-foreground-muted">No advisory messages yet.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto space-y-3 pr-1">
            {entries.map((entry, index) => (
              <div key={`${entry.asked_at}-${index}`} className="rounded-2xl border border-border-glass bg-white/80 px-3 py-3 shadow-sm">
                <p className="text-xs text-foreground-dim">{new Date(entry.asked_at).toLocaleString()}</p>
                <p className="mt-1 text-sm font-semibold text-foreground-main">Q: {entry.message}</p>
                <p className="mt-2 text-sm text-foreground-muted">A: {entry.reply}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
