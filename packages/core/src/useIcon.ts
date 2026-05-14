import { useState, useEffect, useRef } from 'react';
import { fetchIcon } from './fetcher';
import { injectColor } from './colorize';
import { getCached } from './cache';
import type { PackName, PackIconMap } from './types';

declare const __DEV__: boolean | undefined;

// ─── Result type ─────────────────────────────────────────────────────────────

export type UseIconResult =
  | { status: 'loading' }
  | { status: 'ready'; xml: string }
  | { status: 'error' };

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared hook that manages the full fetch lifecycle for an SVG icon.
 *
 * Design notes:
 * - Initializes from cache with no loading flash when the icon is already fetched.
 * - Re-fetches only when `pack` or `name` change — color changes are free (no re-fetch).
 * - Cancels the in-flight fetch response if the component unmounts.
 * - `color` is applied via `injectColor` at render, outside the effect,
 *   so color transitions are synchronous and instant.
 */
export function useIcon<P extends PackName>(
  pack: P,
  name: PackIconMap[P],
  color: string,
  onError?: (pack: string, name: string) => void
): UseIconResult {
  const nameStr = name as string;

  // Initialise state from cache to avoid an unnecessary loading flash
  const [rawXml, setRawXml] = useState<string | null>(
    () => getCached(pack, nameStr) ?? null
  );
  const [error, setError] = useState(false);

  // Track whether the effect is still active
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setError(false);

    const alreadyCached = getCached(pack, nameStr);
    if (alreadyCached !== undefined) {
      setRawXml(alreadyCached);
      return;
    }

    // Not cached — start loading
    setRawXml(null);

    fetchIcon(pack, nameStr)
      .then((xml) => {
        if (cancelledRef.current) return;
        setRawXml(xml);
      })
      .catch(() => {
        if (cancelledRef.current) return;
        setError(true);

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(`[icons] Failed to load icon: ${pack}/${nameStr}`);
        }

        onError?.(pack, nameStr);
      });

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack, nameStr]);

  // ── Derive result ──
  // color is intentionally outside the effect: changes are instant, no re-fetch.

  if (error) return { status: 'error' };
  if (rawXml === null) return { status: 'loading' };

  return { status: 'ready', xml: injectColor(rawXml, color) };
}
