import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchIcon, preloadIcons } from '../fetcher'
import { clearCache, getCached } from '../cache'
import { CDN_BASE_URL } from '../config'

function makeResponse(xml: string, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    text: () => Promise.resolve(xml),
  } as unknown as Response
}

describe('fetchIcon', () => {
  beforeEach(() => {
    clearCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the SVG from the CDN and returns the XML', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg>apple</svg>'))

    const xml = await fetchIcon('food', 'apple')

    expect(xml).toBe('<svg>apple</svg>')
    expect(fetch).toHaveBeenCalledWith(`${CDN_BASE_URL}/food/apple.svg`)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('constructs the correct URL for the given pack and name', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg/>'))

    await fetchIcon('food', 'burger')

    expect(fetch).toHaveBeenCalledWith(`${CDN_BASE_URL}/food/burger.svg`)
  })

  it('caches the result so subsequent calls skip the network', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg>apple</svg>'))

    const first = await fetchIcon('food', 'apple')
    const second = await fetchIcon('food', 'apple')

    expect(first).toBe('<svg>apple</svg>')
    expect(second).toBe('<svg>apple</svg>')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('stores the fetched SVG in the cache', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg>banana</svg>'))

    await fetchIcon('food', 'banana')

    expect(getCached('food', 'banana')).toBe('<svg>banana</svg>')
  })

  it('deduplicates concurrent requests for the same icon', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg>apple</svg>'))

    const [r1, r2] = await Promise.all([
      fetchIcon('food', 'apple'),
      fetchIcon('food', 'apple'),
    ])

    expect(r1).toBe('<svg>apple</svg>')
    expect(r2).toBe('<svg>apple</svg>')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('allows independent concurrent fetches for different icons', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg/>'))

    await Promise.all([fetchIcon('food', 'apple'), fetchIcon('food', 'banana')])

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws with the icon path on a 404 response', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('', false, 404))

    await expect(fetchIcon('food', 'missing')).rejects.toThrow(
      'Failed to fetch food/missing: 404'
    )
  })

  it('propagates a network-level error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network failure'))

    await expect(fetchIcon('food', 'apple')).rejects.toThrow('Network failure')
  })

  it('clears the pending entry after a failed fetch, allowing retry', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('first attempt failed'))
      .mockResolvedValue(makeResponse('<svg>retry</svg>'))

    await expect(fetchIcon('food', 'apple')).rejects.toThrow()

    const xml = await fetchIcon('food', 'apple')
    expect(xml).toBe('<svg>retry</svg>')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('preloadIcons', () => {
  beforeEach(() => {
    clearCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches every icon listed in the entries', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg/>'))

    await preloadIcons([{ pack: 'food', icons: ['apple', 'banana'] }])

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('fetches icons from multiple packs', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse('<svg/>'))

    await preloadIcons([
      { pack: 'food', icons: ['apple'] },
      { pack: 'icons', icons: ['star', 'heart'] },
    ])

    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('resolves without throwing even when some icons fail (allSettled)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse('<svg/>'))
      .mockResolvedValueOnce(makeResponse('', false, 404))

    await expect(
      preloadIcons([{ pack: 'food', icons: ['apple', 'missing'] }])
    ).resolves.toBeUndefined()
  })

  it('resolves immediately for an empty entries array', async () => {
    await expect(preloadIcons([])).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('resolves immediately when all icon lists are empty', async () => {
    await preloadIcons([{ pack: 'food', icons: [] }])
    expect(fetch).not.toHaveBeenCalled()
  })
})
