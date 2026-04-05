'use client';

import { useEffect, useState } from 'react';
import { Bell, Languages, MapPin, RotateCcw, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';

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
      className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
        props.checked ? 'border-primary/30 bg-primary/5' : 'border-border-glass bg-white/80 hover:bg-white'
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-foreground-main">{props.label}</span>
        <span className="mt-1 block text-sm text-foreground-muted">{props.description}</span>
      </span>
      <span className={`mt-1 h-6 w-11 rounded-full p-1 transition-colors ${props.checked ? 'bg-primary' : 'bg-slate-300'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${props.checked ? 'translate-x-5' : 'translate-x-0'}`} />
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
    setSavedMessage('Preferences reset to defaults.');
  };

  const handleSave = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedMessage('Preferences saved locally.');
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="page-hero">
        <div>
          <p className="section-heading mb-2">Account Preferences</p>
          <h1 className="page-title gradient-text">Settings</h1>
          <p className="page-description mt-3">
            Configure how CropShield presents data, sends alerts, and formats advisory guidance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={resetSettings} className="rounded-2xl border border-border-glass bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground-main hover:bg-white">
            <RotateCcw size={14} className="mr-2 inline" />
            Reset
          </button>
          <button type="button" onClick={handleSave} className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            <ShieldCheck size={14} className="mr-2 inline" />
            Save Preferences
          </button>
        </div>
      </header>

      {savedMessage ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground-main">
          {savedMessage}
        </div>
      ) : null}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="feed-card xl:col-span-2">
          <div className="mb-4">
            <p className="section-heading mb-2">Display & Localization</p>
            <p className="section-note">Set the default location and language used across the app.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">Default Location</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim" size={16} />
                <input
                  value={settings.defaultLocation}
                  onChange={(event) => setSettings((prev) => ({ ...prev, defaultLocation: event.target.value }))}
                  className="control-input w-full rounded-2xl py-2.5 pl-10 pr-3 text-sm"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">Language</span>
              <div className="relative">
                <Languages className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim" size={16} />
                <select
                  value={settings.language}
                  onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
                  className="select-styled w-full pl-10"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="bn">Bengali</option>
                </select>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">Unit System</span>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim" size={16} />
                <select
                  value={settings.unitSystem}
                  onChange={(event) => setSettings((prev) => ({ ...prev, unitSystem: event.target.value as SettingsState['unitSystem'] }))}
                  className="select-styled w-full pl-10"
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">Advisory Tone</span>
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim" size={16} />
                <select
                  value={settings.advisoryTone}
                  onChange={(event) => setSettings((prev) => ({ ...prev, advisoryTone: event.target.value as SettingsState['advisoryTone'] }))}
                  className="select-styled w-full pl-10"
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </label>
          </div>
        </div>

        <div className="feed-card">
          <div className="mb-4">
            <p className="section-heading mb-2">Alert Preferences</p>
            <p className="section-note">Choose how CropShield notifies you about weather and activity changes.</p>
          </div>

          <div className="space-y-3">
            <ToggleRow
              label="Email Alerts"
              description="Receive important updates in your inbox."
              checked={settings.enableEmailAlerts}
              onChange={(value) => setSettings((prev) => ({ ...prev, enableEmailAlerts: value }))}
            />
            <ToggleRow
              label="SMS Alerts"
              description="Enable short message notifications for urgent updates."
              checked={settings.enableSmsAlerts}
              onChange={(value) => setSettings((prev) => ({ ...prev, enableSmsAlerts: value }))}
            />
            <ToggleRow
              label="Browser Alerts"
              description="Show in-browser alerts while CropShield is open."
              checked={settings.enableBrowserAlerts}
              onChange={(value) => setSettings((prev) => ({ ...prev, enableBrowserAlerts: value }))}
            />
          </div>
        </div>
      </section>

      <section className="feed-card">
        <div className="mb-4">
          <p className="section-heading mb-2">Interface Density</p>
          <p className="section-note">Compact view is useful when reviewing many cards or tables at once.</p>
        </div>
        <ToggleRow
          label="Use Compact Cards"
          description="Reduce spacing in cards and panels for data-dense workflows."
          checked={settings.useCompactCards}
          onChange={(value) => setSettings((prev) => ({ ...prev, useCompactCards: value }))}
        />
      </section>

      <section className="feed-card">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 text-primary" size={18} />
          <div>
            <p className="section-heading mb-2">Storage Note</p>
            <p className="section-note">
              These preferences are saved locally in your browser for now. If you want them synchronized across devices,
              I can wire this screen to the backend next.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
