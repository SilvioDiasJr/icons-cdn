import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useIcon } from '../useIcon'
import { fetchIcon } from '../fetcher'
import { getCached } from '../cache'

vi.mock('../fetcher')
vi.mock('../cache')

const mockedFetchIcon = vi.mocked(fetchIcon)
const mockedGetCached = vi.mocked(getCached)

describe('useIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading when the icon is not in cache', () => {
    mockedGetCached.mockReturnValue(undefined)
    mockedFetchIcon.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useIcon('food', 'apple', '#000'))

    expect(result.current.status).toBe('loading')
  })

  it('returns ready immediately from cache without calling fetch', () => {
    mockedGetCached.mockReturnValue('<svg><path fill="currentColor"/></svg>')

    const { result } = renderHook(() => useIcon('food', 'apple', '#ff0000'))

    expect(result.current.status).toBe('ready')
    expect(mockedFetchIcon).not.toHaveBeenCalled()
  })

  it('injects the requested color into the cached SVG', () => {
    mockedGetCached.mockReturnValue('<svg><path fill="currentColor"/></svg>')

    const { result } = renderHook(() => useIcon('food', 'apple', '#ff0000'))

    expect(result.current.status).toBe('ready')
    if (result.current.status === 'ready') {
      expect(result.current.xml).toBe('<svg><path fill="#ff0000"/></svg>')
    }
  })

  it('transitions from loading to ready after a successful fetch', async () => {
    mockedGetCached.mockReturnValue(undefined)
    mockedFetchIcon.mockResolvedValue('<svg><path fill="currentColor"/></svg>')

    const { result } = renderHook(() => useIcon('food', 'apple', 'blue'))

    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    if (result.current.status === 'ready') {
      expect(result.current.xml).toContain('blue')
      expect(result.current.xml).not.toContain('currentColor')
    }
  })

  it('transitions to error state when the fetch fails', async () => {
    mockedGetCached.mockReturnValue(undefined)
    mockedFetchIcon.mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => useIcon('food', 'apple', '#000'))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
  })

  it('calls the onError callback with pack and name when fetch fails', async () => {
    mockedGetCached.mockReturnValue(undefined)
    mockedFetchIcon.mockRejectedValue(new Error('fail'))

    const onError = vi.fn()
    const { result } = renderHook(() => useIcon('food', 'apple', '#000', onError))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(onError).toHaveBeenCalledWith('food', 'apple')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('updates the injected XML instantly when color changes (no re-fetch)', () => {
    mockedGetCached.mockReturnValue('<svg><circle fill="currentColor"/></svg>')

    const { result, rerender } = renderHook(
      ({ color }) => useIcon('food', 'apple', color),
      { initialProps: { color: 'red' } }
    )

    expect(result.current.status).toBe('ready')
    if (result.current.status === 'ready') {
      expect(result.current.xml).toContain('red')
    }

    rerender({ color: 'blue' })

    expect(result.current.status).toBe('ready')
    if (result.current.status === 'ready') {
      expect(result.current.xml).toContain('blue')
      expect(result.current.xml).not.toContain('red')
    }

    expect(mockedFetchIcon).not.toHaveBeenCalled()
  })

  it('re-fetches when the icon name changes', async () => {
    mockedGetCached.mockReturnValue(undefined)
    mockedFetchIcon.mockResolvedValue('<svg/>')

    const { rerender } = renderHook(
      ({ name }: { name: string }) => useIcon('food', name as 'apple', '#000'),
      { initialProps: { name: 'apple' } }
    )

    await waitFor(() => {
      expect(mockedFetchIcon).toHaveBeenCalledWith('food', 'apple')
    })

    rerender({ name: 'banana' })

    await waitFor(() => {
      expect(mockedFetchIcon).toHaveBeenCalledWith('food', 'banana')
    })

    expect(mockedFetchIcon).toHaveBeenCalledTimes(2)
  })
})
