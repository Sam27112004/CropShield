'use client';

import { useEffect, useState } from 'react';
import { Bell, Languages, MapPin, RotateCcw, ShieldCheck, Smartphone, Sparkles, Settings as SettingsIcon } from 'lucide-react';

type SettingsState = {
  defaultLocation: string;
  language: string;
  unitSystem: 'metric' | 'imperial';
  advisoryTone: 'concise' | 'balanced' | 'detailed';
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  enableBrowserAlerts: boolean;
  useCompactCards: boolean;
};

const STORAGE_KEY = 'cropshield.settings.v1';

const DEFAULT_SETTINGS: SettingsState = {
  defaultLocation: 'Pune',
  language: 'en',
  unitSystem: 'metric',
  advisoryTone: 'balanced',
  enableEmailAlerts: true,
  enableSmsAlerts: false,
  enableBrowserAlerts: true,
  useCompactCards: false,
};

function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      className={`relative flex items-start justify-between gap-4 rounded-[20px] border px-5 py-5 text-left transition-all duration-300 ${
        props.checked 
          ? 'border-primary/20 bg-primary/[0.03] shadow-[0_4px_12px_rgba(47,133,90,0.05)]' 
          : 'border-gray-100 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
      }`}
    >
      <span className="flex-1">
        <span className="block text-sm font-extrabold text-gray-900">{props.label}</span>
        <span className="mt-1 block text-sm font-medium text-gray-500 leading-relaxed pr-6">{props.description}</span>
      </span>
      <span className={`relative mt-0.5 flex h-7 w-12 flex-shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${props.checked ? 'bg-primary' : 'bg-gray-200'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${props.checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setSavedMessage('Preferences reset to operational defaults.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSave = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedMessage('Operational vectors secured to local storage.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex items-center justify-between rounded-xl bg-[#eef8f1] px-4 py-3 border border-[#7ddf92]/20 shadow-sm mb-2">
        <div className="flex items-center gap-2">
          <SettingsIcon className="text-primary w-5 h-5" />
          <span className="text-primary font-bold text-sm">System Configuration</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Account Preferences</h1>
          <p className="text-sm text-gray-500 lg:text-base max-w-2xl">
            Configure how your UI terminal presents data, dispatches alerts, and formats biological guidance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={resetSettings} className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <RotateCcw size={16} /> Defaults
          </button>
          <button type="button" onClick={handleSave} className="flex items-center gap-2 bg-[#1b241d] hover:bg-gray-800 text-white rounded-[16px] px-5 py-2.5 text-sm font-bold transition-all shadow-[0_4px_12px_rgba(27,36,29,0.15)]">
            <ShieldCheck size={16} /> Securize Config
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 px-5 py-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800">{savedMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* DISPLAY AND LOCALIZATION */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[80px] pointer-events-none" />
            
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
              <Sparkles className="w-5 h-5 text-primary" /> Display & Localization
            </h2>
            <p className="text-sm font-medium text-gray-500 mb-8 relative z-10">Configure geographical binding and LLM text parameters.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">Primary Base Station</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    value={settings.defaultLocation}
                    onChange={(event) => setSettings((prev) => ({ ...prev, defaultLocation: event.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-[20px] py-4 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">Interface Language</span>
                <div className="relative">
                  <Languages className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <select
                    value={settings.language}
                    onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-[20px] py-4 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="bn">Bengali</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">Mathematical Base</span>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <select
                    value={settings.unitSystem}
                    onChange={(event) => setSettings((prev) => ({ ...prev, unitSystem: event.target.value as SettingsState['unitSystem'] }))}
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-[20px] py-4 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="metric">Metric (C°, mm)</option>
                    <option value="imperial">Imperial (F°, in)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">LLM Tone Tuning</span>
                <div className="relative">
                  <Sparkles className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <select
                    value={settings.advisoryTone}
                    onChange={(event) => setSettings((prev) => ({ ...prev, advisoryTone: event.target.value as SettingsState['advisoryTone'] }))}
                    className="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-[20px] py-4 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="concise">Concise (Immediate Directives)</option>
                    <option value="balanced">Balanced (Standard Operation)</option>
                    <option value="detailed">Detailed (Scientific Reasoning)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-[0_8px_32px_rgba(31,52,38,0.06)] relative overflow-hidden mt-2">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-gray-400" /> Density Profiling
            </h2>
            <p className="text-sm font-medium text-gray-500 mb-6">Modify terminal padding layout to display raw telemetry efficiently.</p>
            <ToggleRow
              label="Compact HUD"
              description="Reduce systemic padding spacing and enforce smaller typography rendering for dense data viewing."
              checked={settings.useCompactCards}
              onChange={(value) => setSettings((prev) => ({ ...prev, useCompactCards: value }))}
            />
          </div>
        </div>

        {/* ALERTS AND COMMUNICATIONS */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#1b241d] to-[#2a382d] rounded-[32px] p-6 lg:p-8 border border-gray-800 shadow-[0_16px_40px_rgba(27,36,29,0.2)] flex flex-col relative overflow-hidden">
             {/* Subdued design circle */}
             <div className="absolute -right-20 -bottom-20 w-64 h-64 border-[40px] border-white/5 rounded-full" />
             
             <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2 mb-2 relative z-10">
              <Bell className="w-5 h-5 text-emerald-400" /> Comms Relays
            </h2>
            <p className="text-sm font-medium text-gray-400 mb-8 relative z-10">Specify which delivery pipelines are authorized to receive push intel and crisis pings.</p>

            <div className="space-y-4 relative z-10">
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, enableEmailAlerts: !prev.enableEmailAlerts }))}
                className={`flex items-center justify-between p-4 rounded-[20px] transition-all border ${
                  settings.enableEmailAlerts ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white mb-1">Encrypted Email</p>
                  <p className="text-xs text-gray-400">Direct transmission to inbox.</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.enableEmailAlerts ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableEmailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, enableSmsAlerts: !prev.enableSmsAlerts }))}
                className={`flex items-center justify-between p-4 rounded-[20px] transition-all border ${
                  settings.enableSmsAlerts ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white mb-1">SMS Matrix</p>
                  <p className="text-xs text-gray-400">Instant cellular notification.</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.enableSmsAlerts ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableSmsAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, enableBrowserAlerts: !prev.enableBrowserAlerts }))}
                className={`flex items-center justify-between p-4 rounded-[20px] transition-all border ${
                  settings.enableBrowserAlerts ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white mb-1">Browser Intercepts</p>
                  <p className="text-xs text-gray-400">Terminal-level popups.</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.enableBrowserAlerts ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableBrowserAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50/50 rounded-[24px] border border-blue-100 p-6 flex flex-col gap-3 shadow-sm mt-2">
            <h3 className="text-[11px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> State Isolation Active
            </h3>
            <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
               Configurations represented here are siloed to the localized protocol space `window.localStorage`. Telemetry linking via central NextJS routing has been temporarily suppressed for strict immutable compliance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
