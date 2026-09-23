import { useEffect, useRef } from 'react';
import { apiUrl } from '../lib/api';

const UPDATE_CHECK_INTERVAL_MS = 30_000;

export function useAutoUpdate() {
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkForUpdate = async () => {
      if (document.visibilityState === 'hidden') return;

      try {
        const response = await fetch(apiUrl('/api/version'), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;

        const data = (await response.json()) as { version?: string };
        if (!isMounted || !data.version) return;

        if (versionRef.current && versionRef.current !== data.version) {
          window.location.reload();
          return;
        }
        versionRef.current = data.version;
      } catch {
        // The static APK and offline pages do not expose the version endpoint.
      }
    };

    void checkForUpdate();
    const timer = window.setInterval(() => {
      void checkForUpdate();
    }, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);
}
