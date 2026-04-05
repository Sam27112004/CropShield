'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bot, Send, Trash2, MessageSquare, BarChart2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import ErrorBanner from '@/components/ErrorBanner';
import StructuredAdvisoryText from '@/components/StructuredAdvisoryText';
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
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <Bot className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">Automated Agronomy Agent</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Crop Advisory</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Query the specialized LLM agent for instantaneous field protocol and biological management guidance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEntries([]);
            window.localStorage.removeItem(historyStorageKey);
          }}
          disabled={entries.length === 0}
          className="flex items-center gap-2 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Purge Buffer
        </button>
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* INTERFACE */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col flex-1 relative overflow-hidden">
            {/* Background embellishment */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] pointer-events-none" />

            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
              <MessageSquare className="w-5 h-5 text-emerald-500" /> Command Interface
            </h2>
            <p className="text-sm text-gray-500 mb-6 relative z-10">Submit queries on pest vectors, irrigation timings, or nutrition gaps.</p>

            <form className="flex flex-col gap-4 relative z-10" onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="e.g., How do I mitigate powdery mildew in warm climates?"
                  className="w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-[24px] p-5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="self-end flex items-center justify-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-2xl px-6 py-3.5 text-sm font-bold transition-all shadow-[0_8px_24px_rgba(27,36,29,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Bot className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Synthesizing...' : 'Transmit Query'}
              </button>
            </form>
          </div>

          {/* HISTORY */}
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-gray-400" /> History Log
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {entries.length} Packet{entries.length !== 1 ? 's' : ''}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-sm font-bold text-gray-400 mb-2">No Transmissions</h3>
                <p className="text-xs text-gray-400 max-w-[250px]">
                  Submit a query above to initiate a dialogue with the agronomy agent.
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {entries.map((entry, index) => (
                  <div key={`${entry.asked_at}-${index}`} className="flex gap-4">
                    <div className="flex-1 rounded-[24px] border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                         <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                           <MessageSquare className="w-4 h-4 text-emerald-500" /> Query
                         </div>
                         <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                           {new Date(entry.asked_at).toLocaleString()}
                         </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-5">{entry.message}</p>
                      
                      <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm relative">
                        <div className="absolute -left-3 top-6 w-3 h-3 bg-white border-b border-l border-gray-100 transform rotate-45" />
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                           <Bot className="w-4 h-4 text-indigo-500" /> Agent Response
                        </div>
                        <div className="prose prose-sm prose-emerald max-w-none text-gray-600">
                           <StructuredAdvisoryText text={entry.reply} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* METRICS SIDEBAR */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] flex flex-col">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" /> Token Depth
            </h2>
            <p className="text-sm text-gray-500 mb-6">Text payload size ratios (Question vs Response) across latest transmissions.</p>
            
            <div className="h-[250px] w-full">
              {conversationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="questionLength" name="Query Size" fill="#94a3b8" radius={[8, 8, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="replyLength" name="Response Size" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                  <span className="text-sm font-bold text-gray-400">Topology Unavailable</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
