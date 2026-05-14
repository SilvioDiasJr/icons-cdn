#!/usr/bin/env node
/**
 * normalize-pack.ts
 *
 * Normalizes raw SVG files from cdn/packs/{pack}/ and writes them to cdn/{pack}/.
 *
 * Usage:
 *   npx tsx scripts/normalize-pack.ts <pack> [originalColor]
 *
 * Examples:
 *   npx tsx scripts/normalize-pack.ts food "#303538"
 *   npx tsx scripts/normalize-pack.ts food          # auto-detects color
 */

import fs from 'fs';
import path from 'path';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const [, , packArg, colorArg] = process.argv;

if (!packArg) {
  console.error('Usage: npx tsx scripts/normalize-pack.ts <pack> [originalColor]');
  process.exit(1);
}

const PACK = packArg.trim();

// ─── Paths ────────────────────────────────────────────────────────────────────

const CDN_ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(CDN_ROOT, 'packs', PACK);
const OUT_DIR = path.join(CDN_ROOT, PACK);
const INDEX_PATH = path.join(CDN_ROOT, 'index.json');

// ─── Slug maps ────────────────────────────────────────────────────────────────

/**
 * Manual slug overrides for files with special characters or ambiguous names.
 * Key: original filename (without .svg), Value: desired slug.
 */
const SLUG_MAP: Record<string, Record<string, string>> = {
  food: {
    "B-B-Q 2": "bbq-2",
    "B-B-Q": "bbq",
    "baby bottle 2": "baby-bottle-2",
    "baby pacifier": "baby-pacifier",
    "beer 1": "beer-1",
    "beer 2": "beer-2",
    "bottle 1": "bottle-1",
    "bottle 2": "bottle-2",
    "bowl-steam": "bowl-steam",
    "cake 1": "cake-1",
    "cake 2": "cake-2",
    "cake 3": "cake-3",
    "cake 4": "cake-4",
    "cheese 2": "cheese-2",
    "chef's hat": "chefs-hat",
    "Chupa Chups": "chupa-chups",
    "cookie 1": "cookie-1",
    "cup 1": "cup-1",
    "cup 2": "cup-2",
    "cup 3": "cup-3",
    "Cup of tea 1": "cup-of-tea-1",
    "Cup of tea 2": "cup-of-tea-2",
    "Cup of tea 3": "cup-of-tea-3",
    "cutlery 1": "cutlery-1",
    "cutlery 2": "cutlery-2",
    "cutlery 3": "cutlery-3",
    "cutlery 4": "cutlery-4",
    "cutlery 5": "cutlery-5",
    "dish 1": "dish-1",
    "dish 3": "dish-3",
    "fast food 1": "fast-food-1",
    "fast food": "fast-food",
    "fish 1": "fish-1",
    "fish 2": "fish-2",
    "french fries": "french-fries",
    "fried eggs": "fried-eggs",
    "hat robe": "hat-robe",
    "Hot Dog": "hot-dog",
    "ice cream 1": "ice-cream-1",
    "ice cream 2": "ice-cream-2",
    "ice cream 3": "ice-cream-3",
    "juice 1": "juice-1",
    "juice 2": "juice-2",
    "loaf of bread 3": "loaf-of-bread-3",
    "meat 1": "meat-1",
    "meat 2": "meat-2",
    "pizza 1": "pizza-1",
    "pizza 2": "pizza-2",
    "push-pin": "push-pin",
    "rolling pin": "rolling-pin",
    "shopping basket": "shopping-basket",
    "wineglass 1": "wineglass-1",
    "wineglass 2": "wineglass-2",
    "wineglass 3": "wineglass-3",
  },
};

// ─── Slug generator ───────────────────────────────────────────────────────────

function toSlug(filename: string, pack: string): string {
  const nameWithoutExt = filename.replace(/\.svg$/i, '');
  const manual = SLUG_MAP[pack]?.[nameWithoutExt];
  if (manual) return manual;

  // Auto-slug: lowercase, replace non-alphanumeric runs with hyphens, trim hyphens
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Color detection ─────────────────────────────────────────────────────────

/**
 * Tries to detect the dominant fill/stroke color from the SVG.
 * Returns the first hex color found that isn't "none" or "white".
 */
function detectColor(xml: string): string | null {
  // Match fill="#xxxxxx" or stroke="#xxxxxx" (3 or 6 char hex)
  const matches = xml.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g);
  for (const m of matches) {
    const c = m[1].toLowerCase();
    if (c !== '#fff' && c !== '#ffffff' && c !== '#none') {
      return c;
    }
  }
  return null;
}

// ─── SVG normalizer ───────────────────────────────────────────────────────────

function normalizeSvg(xml: string, originalColor: string): string {
  let out = xml;

  // 1. Ensure xmlns is present on the root <svg> tag
  if (!out.includes('xmlns=')) {
    out = out.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 2. Remove fixed width/height from the root <svg> element only
  //    We target the opening <svg ...> tag and strip width/height from it.
  out = out.replace(/<svg([^>]*)>/i, (match, attrs: string) => {
    const cleaned = attrs
      .replace(/\s*width="[^"]*"/gi, '')
      .replace(/\s*height="[^"]*"/gi, '');
    return `<svg${cleaned}>`;
  });

  // 3. Replace original color with currentColor in fill and stroke attributes,
  //    but only when fill is NOT "none" (structural/transparent fills stay intact).
  const colorLower = originalColor.toLowerCase();
  const colorPattern = new RegExp(
    `(?<=(?:fill|stroke)=")${escapeRegExp(colorLower)}(?=")`,
    'gi'
  );

  // We need a more careful approach: parse attribute by attribute.
  // Replace fill="<color>" → fill="currentColor" (skip fill="none")
  // Replace stroke="<color>" → stroke="currentColor"
  out = out
    .replace(
      /fill="([^"]*)"/gi,
      (_, value: string) => {
        if (value.toLowerCase() === 'none') return `fill="none"`;         // preserve structural
        if (value.toLowerCase() === colorLower) return 'fill="currentColor"';
        // Handle 3-char vs 6-char hex equivalents
        if (expandHex(value.toLowerCase()) === expandHex(colorLower))
          return 'fill="currentColor"';
        return `fill="${value}"`;
      }
    )
    .replace(
      /stroke="([^"]*)"/gi,
      (_, value: string) => {
        if (value.toLowerCase() === 'none') return `stroke="none"`;
        if (value.toLowerCase() === colorLower) return 'stroke="currentColor"';
        if (expandHex(value.toLowerCase()) === expandHex(colorLower))
          return 'stroke="currentColor"';
        return `stroke="${value}"`;
      }
    );

  // 4. Also handle colors inside style="" attributes
  out = out.replace(
    /style="([^"]*)"/gi,
    (_, styleValue: string) => {
      const replaced = styleValue
        .replace(new RegExp(`\\bfill:\\s*${escapeRegExp(colorLower)}\\b`, 'gi'), 'fill:currentColor')
        .replace(new RegExp(`\\bstroke:\\s*${escapeRegExp(colorLower)}\\b`, 'gi'), 'stroke:currentColor');
      return `style="${replaced}"`;
    }
  );

  // Suppress unused variable warning (colorPattern used only for validation)
  void colorPattern;

  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expand 3-char hex (#abc) to 6-char (#aabbcc) for comparison */
function expandHex(hex: string): string {
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

// ─── Index management ─────────────────────────────────────────────────────────

interface PackEntry {
  count: number;
  icons: string[];
}

interface IndexFile {
  version: string;
  packs: Record<string, PackEntry>;
}

function loadIndex(): IndexFile {
  if (fs.existsSync(INDEX_PATH)) {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) as IndexFile;
  }
  return { version: '1.0.0', packs: {} };
}

function saveIndex(index: IndexFile): void {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Verify source directory
  if (!fs.existsSync(PACKS_DIR)) {
    console.error(`❌  Source directory not found: ${PACKS_DIR}`);
    console.error(`    Create it and place the raw SVG files there.`);
    process.exit(1);
  }

  // Read source SVG files
  const files = fs
    .readdirSync(PACKS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    console.error(`❌  No SVG files found in ${PACKS_DIR}`);
    process.exit(1);
  }

  console.log(`\n📦  Pack: ${PACK}  (${files.length} SVGs found)\n`);

  // Detect color if not provided
  let originalColor = colorArg?.trim() ?? '';
  if (!originalColor) {
    // Read first file to detect
    const sample = fs.readFileSync(path.join(PACKS_DIR, files[0]), 'utf-8');
    const detected = detectColor(sample);
    if (!detected) {
      console.error('❌  Could not auto-detect color. Pass it explicitly:');
      console.error(`    npx tsx scripts/normalize-pack.ts ${PACK} "#303538"`);
      process.exit(1);
    }
    originalColor = detected;
    console.log(`🎨  Auto-detected original color: ${originalColor}\n`);
  } else {
    console.log(`🎨  Using provided original color: ${originalColor}\n`);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const slug = toSlug(file, PACK);
    const srcPath = path.join(PACKS_DIR, file);
    const dstPath = path.join(OUT_DIR, `${slug}.svg`);

    try {
      const raw = fs.readFileSync(srcPath, 'utf-8');
      const normalized = normalizeSvg(raw, originalColor);
      fs.writeFileSync(dstPath, normalized, 'utf-8');
      slugs.push(slug);
      console.log(`  ✅  ${file.padEnd(35)} → ${slug}.svg`);
    } catch (err) {
      errors.push(file);
      console.error(`  ❌  ${file}: ${(err as Error).message}`);
    }
  }

  // Update index.json
  const index = loadIndex();
  const sorted = slugs.sort();
  index.packs[PACK] = { count: sorted.length, icons: sorted };
  saveIndex(index);

  // Summary
  console.log('\n─────────────────────────────────────────────');
  console.log(`✅  ${slugs.length} icons normalized → cdn/${PACK}/`);
  if (errors.length) {
    console.log(`⚠️   ${errors.length} errors: ${errors.join(', ')}`);
  }
  console.log(`📝  index.json updated`);
  console.log('─────────────────────────────────────────────\n');
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
