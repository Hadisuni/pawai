import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// matchMedia doesn't exist during SSR, so this can't be read at render time
// on the server — useSyncExternalStore is the hydration-safe way to read a
// browser-only media feature without an extra setState-in-effect render pass.
// `false` (motion allowed) is the server/SSR default.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
