'use client';

import { FormEvent, useState } from 'react';
import ErrorBanner from '@/components/ErrorBanner';
import { advisoryChat, ApiError } from '@/lib/api';

interface AdvisoryEntry {
  asked_at: string;
  message: string;
  reply: string;
}

export default function AdvisoryPage() {
  const [message, setMessage] = useState('How do I reduce heat stress in paddy this week?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AdvisoryEntry[]>([]);

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
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Advisory Assistant</h1>
          <p className="text-foreground-muted">Ask crop-care questions and get immediate guidance.</p>
        </div>
        <button
          type="button"
          onClick={() => setEntries([])}
          disabled={entries.length === 0}
          className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-foreground-main hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear Conversation
        </button>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Ask about irrigation, pests, nutrient stress, or weather response..."
            className="w-full rounded-xl border border-primary/20 bg-white/60 px-3 py-2 text-sm text-foreground-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Getting Advice...' : 'Ask Assistant'}
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-5 border border-primary/10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wider text-foreground-dim font-bold">Conversation</p>
          <p className="text-xs text-foreground-dim">{entries.length} message{entries.length === 1 ? '' : 's'}</p>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-foreground-muted">No advisory messages yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={`${entry.asked_at}-${index}`} className="rounded-xl border border-primary/10 px-3 py-3">
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
