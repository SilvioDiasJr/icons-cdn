/**
 * Replaces every `currentColor` occurrence in an SVG string with the given color.
 * This is intentionally a simple string replace — it's fast and covers all
 * `fill`, `stroke`, and inline `style` attributes that use `currentColor`.
 */
export const injectColor = (xml: string, color: string): string =>
  xml.replace(/currentColor/g, color);
