/**
 * In-memory SVG cache.
 *
 * Stores the SVG XML with `currentColor` intact — the actual color is injected
 * at render time via `injectColor()`, so a single cached entry works for any color.
 */

type CacheKey = string; // "pack/name"

const svgCache = new Map<CacheKey, string>();
const pendingMap = new Map<CacheKey, Promise<string>>();

// ─── Key helper ──────────────────────────────────────────────────────────────

function makeKey(pack: string, name: string): CacheKey {
  return `${pack}/${name}`;
}

// ─── SVG cache ───────────────────────────────────────────────────────────────

export function getCached(pack: string, name: string): string | undefined {
  return svgCache.get(makeKey(pack, name));
}

export function setCached(pack: string, name: string, xml: string): void {
  svgCache.set(makeKey(pack, name), xml);
}

/**
 * Clears cache entries.
 * @param pack — when provided, removes only icons from that pack.
 *               when omitted, clears the entire cache.
 */
export function clearCache(pack?: string): void {
  if (pack === undefined) {
    svgCache.clear();
    return;
  }
  const prefix = `${pack}/`;
  for (const key of svgCache.keys()) {
    if (key.startsWith(prefix)) svgCache.delete(key);
  }
}

export function getCacheSize(): number {
  return svgCache.size;
}

// ─── Pending (dedup) map ─────────────────────────────────────────────────────

export function getPending(
  pack: string,
  name: string
): Promise<string> | undefined {
  return pendingMap.get(makeKey(pack, name));
}

export function setPending(
  pack: string,
  name: string,
  promise: Promise<string>
): void {
  pendingMap.set(makeKey(pack, name), promise);
}

export function clearPending(pack: string, name: string): void {
  pendingMap.delete(makeKey(pack, name));
}
