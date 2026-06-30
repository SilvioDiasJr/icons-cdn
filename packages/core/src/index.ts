// Types
export type { FoodIconName, PackIconMap, PackName, IconProps } from './types';

// Packs
export { PACK_ICONS } from './packs';

// Config
export { CDN_BASE_URL, DEFAULT_SIZE, DEFAULT_COLOR, configureCDN } from './config';

// Cache
export {
  getCached,
  setCached,
  clearCache,
  clearPending,
  getCacheSize,
} from './cache';

// Colorize
export { injectColor } from './colorize';

// Fetcher
export { fetchIcon, preloadIcons } from './fetcher';
export type { PreloadEntry } from './fetcher';

// Hook
export { useIcon } from './useIcon';
export type { UseIconResult } from './useIcon';
