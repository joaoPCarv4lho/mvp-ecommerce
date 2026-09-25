import { useEffect, useRef, useState } from 'react';

/**
 * One-shot values handed from a prefetch (see services/prefetch.ts) to the first render of the
 * component that needs them. Effects only run after paint, so without this the prerendered page
 * would paint its loading skeleton once before the data arrived — a visible flash and a large
 * layout shift on a slow connection. Each entry is consumed exactly once; everything after that
 * goes through the normal fetch path, so nothing here can serve stale data later.
 */
const HANDOFF = new Map<string, unknown>();

export const primeAsync = <T>(key: string, value: T): void => {
  HANDOFF.set(key, value);
};

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], handoffKey?: string): { data?: T; error?: Error; loading: boolean } {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>(() => {
    if (handoffKey !== undefined && HANDOFF.has(handoffKey)) {
      const data = HANDOFF.get(handoffKey) as T;
      HANDOFF.delete(handoffKey);
      return { data, loading: false };
    }
    return { loading: true };
  });
  const handedOff = useRef(!state.loading);

  useEffect(() => {
    if (handedOff.current) {
      handedOff.current = false;
      return;
    }
    let alive = true;
    setState((s) => ({ data: s.data, loading: true }));
    fn().then(
      (data) => alive && setState({ data, loading: false }),
      (e: unknown) => alive && setState({ error: e instanceof Error ? e : new Error(String(e)), loading: false }),
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
