import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchIcon } from '../fetcher'
import { clearCache } from '../cache'
import { configureStorage, type IconStorage } from '../storage'

function makeStorage(initial: Record<string, string> = {}): IconStorage & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: vi.fn((key: string) => Promise.resolve(data[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      data[key] = value
      return Promise.resolve()
    }),
  }
}

describe('persistent storage', () => {
  beforeEach(() => {
    clearCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    configureStorage(null)
    vi.unstubAllGlobals()
  })

  it('persists the SVG after a successful download', async () => {
    const storage = makeStorage()
    configureStorage(storage)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg>apple</svg>'),
    } as unknown as Response)

    await fetchIcon('food', 'apple')

    expect(storage.data['@icons/food/apple']).toBe('<svg>apple</svg>')
  })

  it('serves from storage without hitting the network (offline)', async () => {
    configureStorage(makeStorage({ '@icons/food/apple': '<svg>disk</svg>' }))
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))

    const xml = await fetchIcon('food', 'apple')

    expect(xml).toBe('<svg>disk</svg>')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('still works when storage reads and writes fail', async () => {
    configureStorage({
      getItem: () => Promise.reject(new Error('disk')),
      setItem: () => Promise.reject(new Error('disk')),
    })
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg>net</svg>'),
    } as unknown as Response)

    await expect(fetchIcon('food', 'apple')).resolves.toBe('<svg>net</svg>')
  })

  it('rejects when offline and nothing is persisted', async () => {
    configureStorage(makeStorage())
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))

    await expect(fetchIcon('food', 'apple')).rejects.toThrow('offline')
  })
})
