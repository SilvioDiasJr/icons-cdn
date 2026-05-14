import { CDN_BASE_URL } from './config';
import {
  getCached,
  setCached,
  getPending,
  setPending,
  clearPending,
} from './cache';

/**
 * Fetches an SVG icon from the CDN.
 *
 * - Returns from cache immediately if already loaded.
 * - Deduplicates concurrent requests for the same icon (only 1 HTTP call).
 * - Stores the raw SVG (with `currentColor`) in cache for reuse across colors.
 */
export async function fetchIcon(pack: string, name: string): Promise<string> {
  // 1. Serve from cache
  const cached = getCached(pack, name);
  if (cached !== undefined) return cached;

  // 2. Dedup: reuse in-flight promise
  const pending = getPending(pack, name);
  if (pending !== undefined) return pending;

  // 3. Start fetch
  const url = `${CDN_BASE_URL}/${pack}/${name}.svg`;

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          `[icons] Failed to fetch ${pack}/${name}: ${res.status} ${res.statusText}`
        );
      }
      return res.text();
    })
    .then((xml) => {
      setCached(pack, name, xml);
      clearPending(pack, name);
      return xml;
    })
    .catch((err: unknown) => {
      clearPending(pack, name);
      throw err;
    });

  setPending(pack, name, promise);
  return promise;
}

// ─── Preload ─────────────────────────────────────────────────────────────────

export interface PreloadEntry {
  pack: string;
  icons: string[];
}

/**
 * Preloads a batch of icons in parallel.
 * Safe to call before mounting — errors are swallowed per icon (allSettled).
 */
export async function preloadIcons(entries: PreloadEntry[]): Promise<void> {
  const tasks: Promise<string>[] = [];

  for (const { pack, icons } of entries) {
    for (const name of icons) {
      tasks.push(fetchIcon(pack, name));
    }
  }

  await Promise.allSettled(tasks);
}
