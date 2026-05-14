# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages (respects dependency order: core → web/native in parallel)
pnpm build

# Type-check all packages
pnpm typecheck

# Watch mode (rebuilds on save)
pnpm dev

# Remove all dist/ folders
pnpm clean

# Build a single package directly
cd packages/core && pnpm build

# Normalize a new icon pack (run from cdn/)
cd cdn
npx tsx scripts/normalize-pack.ts <pack> "#hex-color"   # explicit color
npx tsx scripts/normalize-pack.ts <pack>                 # auto-detect color
```

## Architecture

This is a **pnpm + Turborepo monorepo** with three workspace members: `packages/*` and `cdn`.

### Package dependency graph

```
@icons/web    ──┐
                ├──► @icons/core
@icons/native ──┘
```

`@icons/core` has zero platform dependencies — it is shared by both web and native adapters. All packages are built with **tsup** (CJS + ESM dual output, `.d.ts` declarations).

### packages/core

The platform-agnostic engine:

- `config.ts` — CDN base URL (`CDN_BASE_URL`) and defaults. **Update `CDN_BASE_URL` here** when the `icons-cdn` GitHub repo owner changes.
- `types.ts` — `PackIconMap` interface that maps pack names to their icon name unions. **Adding a new pack requires editing this file.**
- `cache.ts` — In-memory `Map` storing SVG XML with `currentColor` intact. A separate `pendingMap` deduplicates concurrent fetches for the same icon.
- `fetcher.ts` — `fetchIcon` (cache → dedup → HTTP) and `preloadIcons` (parallel batch fetch with `allSettled`).
- `colorize.ts` — `injectColor`: a single `replace(/currentColor/g, color)` applied at render time, keeping the cached SVG color-neutral.
- `useIcon.ts` — React hook managing fetch lifecycle. Initializes from cache synchronously (no loading flash). Re-fetches only on `pack`/`name` change; color changes are instant (no re-fetch). Uses `cancelledRef` to drop responses after unmount.

### packages/web

Thin React wrapper. `Icon.tsx` renders `dangerouslySetInnerHTML` for loading/error/ready states using inline CSS (no external deps). Injects a CSS `@keyframes` spinner once via `document.createElement('style')`.

### packages/native

Thin React Native wrapper. `Icon.tsx` uses `<SvgXml>` from `react-native-svg` for the ready state and `<ActivityIndicator>` for loading.

### cdn/

Holds normalized SVGs served via jsDelivr from the separate `icons-cdn` GitHub repo.

- `packs/<pack>/` — raw SVG source files (gitignored, not committed).
- `<pack>/` — normalized output written by the script.
- `index.json` — catalog of all packs and their icon slugs (updated automatically by the script).
- `scripts/normalize-pack.ts` — reads raw SVGs, strips fixed `width`/`height`, replaces the original fill/stroke color with `currentColor`, slugifies filenames, and updates `index.json`. Manual slug overrides live in `SLUG_MAP`.

### Adding a new icon pack

1. Add `<Pack>IconName` union type and register it in `PackIconMap` in `packages/core/src/types.ts`.
2. Add slug overrides (if needed) to `SLUG_MAP` in `cdn/scripts/normalize-pack.ts`.
3. Place raw SVGs in `cdn/packs/<pack>/` and run the normalize script.
4. Commit the output in `cdn/<pack>/` and push to the `icons-cdn` repo.

### TypeScript config

`tsconfig.base.json` at the root defines the shared compiler options (`strict`, `ESNext` modules, `bundler` resolution, `react-jsx`). Each package extends it. The `cdn` package overrides to `CommonJS`/`node` resolution for the Node.js script context.
