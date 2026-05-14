import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Icon } from '../Icon'
import { useIcon } from '@silviodiasjr/icons-core'

vi.mock('@silviodiasjr/icons-core', () => ({
  useIcon: vi.fn(),
}))

const mockedUseIcon = vi.mocked(useIcon)

describe('Icon (web)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  it('renders a loading placeholder with the correct aria-label', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" />)

    expect(screen.getByRole('img', { name: 'food/apple (loading)' })).toBeInTheDocument()
  })

  it('renders a spinner element while loading', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    const { container } = render(<Icon pack="food" name="apple" size={24} />)

    // The spinner div has a circular border
    const spinner = container.querySelector('[style*="border-radius: 50%"]')
    expect(spinner).not.toBeNull()
  })

  // ── Error state ────────────────────────────────────────────────────────────

  it('renders an error placeholder with the correct aria-label', () => {
    mockedUseIcon.mockReturnValue({ status: 'error' })

    render(<Icon pack="food" name="apple" />)

    expect(
      screen.getByRole('img', { name: 'food/apple (failed to load)' })
    ).toBeInTheDocument()
  })

  it('renders the error placeholder at reduced opacity', () => {
    mockedUseIcon.mockReturnValue({ status: 'error' })

    render(<Icon pack="food" name="apple" />)

    const el = screen.getByRole('img', { name: /failed to load/ })
    expect(el).toHaveStyle({ opacity: '0.25' })
  })

  // ── Ready state ────────────────────────────────────────────────────────────

  it('renders the SVG markup inline when ready', () => {
    mockedUseIcon.mockReturnValue({
      status: 'ready',
      xml: '<svg viewBox="0 0 24 24"><path fill="red"/></svg>',
    })

    const { container } = render(<Icon pack="food" name="apple" />)

    expect(screen.getByRole('img', { name: 'food/apple' })).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('injects width and height matching the size prop', () => {
    mockedUseIcon.mockReturnValue({
      status: 'ready',
      xml: '<svg viewBox="0 0 24 24"><path/></svg>',
    })

    const { container } = render(<Icon pack="food" name="apple" size={48} />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
    expect(svg?.getAttribute('height')).toBe('48')
  })

  it('defaults to size=24 when no size prop is given', () => {
    mockedUseIcon.mockReturnValue({
      status: 'ready',
      xml: '<svg viewBox="0 0 24 24"><path/></svg>',
    })

    const { container } = render(<Icon pack="food" name="apple" />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  // ── Prop forwarding ────────────────────────────────────────────────────────

  it('passes color and onError to useIcon', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })
    const onError = vi.fn()

    render(<Icon pack="food" name="apple" color="#abc123" onError={onError} />)

    expect(mockedUseIcon).toHaveBeenCalledWith('food', 'apple', '#abc123', onError)
  })

  it('uses #000000 as the default color when none is provided', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" />)

    expect(mockedUseIcon).toHaveBeenCalledWith('food', 'apple', '#000000', undefined)
  })

  it('sets the container dimensions to match the size prop', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" size={32} />)

    const el = screen.getByRole('img', { name: /loading/ })
    expect(el).toHaveStyle({ width: '32px', height: '32px' })
  })
})
