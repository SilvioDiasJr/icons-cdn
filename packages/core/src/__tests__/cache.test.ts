import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCached,
  setCached,
  clearCache,
  getCacheSize,
  getPending,
  setPending,
  clearPending,
} from '../cache'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
  })

  // ── SVG cache ──────────────────────────────────────────────────────────────

  describe('getCached / setCached', () => {
    it('returns undefined for an unknown icon', () => {
      expect(getCached('food', 'apple')).toBeUndefined()
    })

    it('returns the stored SVG', () => {
      setCached('food', 'apple', '<svg>apple</svg>')
      expect(getCached('food', 'apple')).toBe('<svg>apple</svg>')
    })

    it('stores entries per pack+name key', () => {
      setCached('food', 'apple', '<svg>A</svg>')
      setCached('food', 'banana', '<svg>B</svg>')
      expect(getCached('food', 'apple')).toBe('<svg>A</svg>')
      expect(getCached('food', 'banana')).toBe('<svg>B</svg>')
    })

    it('isolates same icon name across different packs', () => {
      setCached('food', 'star', '<svg>food</svg>')
      setCached('icons', 'star', '<svg>icons</svg>')
      expect(getCached('food', 'star')).toBe('<svg>food</svg>')
      expect(getCached('icons', 'star')).toBe('<svg>icons</svg>')
    })

    it('overwrites an existing entry with new content', () => {
      setCached('food', 'apple', '<svg>v1</svg>')
      setCached('food', 'apple', '<svg>v2</svg>')
      expect(getCached('food', 'apple')).toBe('<svg>v2</svg>')
    })
  })

  // ── clearCache ─────────────────────────────────────────────────────────────

  describe('clearCache', () => {
    it('clears all entries when called without argument', () => {
      setCached('food', 'apple', '<svg/>')
      setCached('food', 'banana', '<svg/>')
      clearCache()
      expect(getCacheSize()).toBe(0)
    })

    it('clears only entries from the given pack', () => {
      setCached('food', 'apple', '<svg/>')
      setCached('other', 'icon', '<svg/>')
      clearCache('food')
      expect(getCached('food', 'apple')).toBeUndefined()
      expect(getCached('other', 'icon')).toBe('<svg/>')
    })

    it('does nothing when the given pack has no cached entries', () => {
      setCached('food', 'apple', '<svg/>')
      clearCache('finance')
      expect(getCacheSize()).toBe(1)
    })

    it('is idempotent when called on an already-empty cache', () => {
      expect(() => clearCache()).not.toThrow()
      expect(getCacheSize()).toBe(0)
    })
  })

  // ── getCacheSize ───────────────────────────────────────────────────────────

  describe('getCacheSize', () => {
    it('returns 0 after clear', () => {
      expect(getCacheSize()).toBe(0)
    })

    it('increments with each unique entry', () => {
      setCached('food', 'apple', '<svg/>')
      expect(getCacheSize()).toBe(1)
      setCached('food', 'banana', '<svg/>')
      expect(getCacheSize()).toBe(2)
    })

    it('does not increment when overwriting an existing key', () => {
      setCached('food', 'apple', '<svg>v1</svg>')
      setCached('food', 'apple', '<svg>v2</svg>')
      expect(getCacheSize()).toBe(1)
    })
  })

  // ── pending map ────────────────────────────────────────────────────────────

  describe('pending map', () => {
    it('returns undefined for an unknown pending entry', () => {
      expect(getPending('food', 'apple')).toBeUndefined()
    })

    it('stores and retrieves a promise by pack+name', () => {
      const p = Promise.resolve('<svg/>')
      setPending('food', 'apple', p)
      expect(getPending('food', 'apple')).toBe(p)
      clearPending('food', 'apple')
    })

    it('clearPending removes the entry', () => {
      const p = Promise.resolve('<svg/>')
      setPending('food', 'apple', p)
      clearPending('food', 'apple')
      expect(getPending('food', 'apple')).toBeUndefined()
    })

    it('clearing one pending entry does not affect others', () => {
      const p1 = Promise.resolve('<svg/>')
      const p2 = Promise.resolve('<svg/>')
      setPending('food', 'apple', p1)
      setPending('food', 'banana', p2)
      clearPending('food', 'apple')
      expect(getPending('food', 'banana')).toBe(p2)
      clearPending('food', 'banana')
    })

    it('pending map and SVG cache share no state', () => {
      const p = Promise.resolve('<svg/>')
      setPending('food', 'apple', p)
      setCached('food', 'apple', '<svg/>')
      expect(getPending('food', 'apple')).toBe(p)
      clearPending('food', 'apple')
    })
  })
})
