'use client';

import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-start gap-2">
          <WifiOff size={16} className="mt-0.5" />
          <p>You appear to be offline - data may be stale.</p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-amber-900/80 hover:bg-amber-100"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss offline banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
