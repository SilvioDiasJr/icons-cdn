import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Icon } from '../Icon'
import { useIcon } from '@silviodiasjr/icons-core'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@silviodiasjr/icons-core', () => ({
  useIcon: vi.fn(),
}))

// Stub react-native with lightweight DOM equivalents so tests run in happy-dom.
// We omit `style` from the DOM props to avoid CSSStyleDeclaration issues when
// React Native array styles (from StyleSheet.create) are passed to a DOM element.
vi.mock('react-native', () => ({
  View: ({ children, accessibilityLabel }: {
    children?: React.ReactNode
    accessibilityLabel?: string
    style?: unknown
  }) =>
    React.createElement('div', { 'aria-label': accessibilityLabel }, children),

  ActivityIndicator: ({ color, size: indicatorSize }: {
    color?: string
    size?: string | number
    style?: unknown
  }) =>
    React.createElement('div', {
      'data-testid': 'activity-indicator',
      'data-color': color,
      'data-size': String(indicatorSize),
    }),

  StyleSheet: {
    create: <T extends object>(styles: T): T => styles,
  },
}))

// Stub react-native-svg's SvgXml as a div that exposes its props as data attrs.
vi.mock('react-native-svg', () => ({
  SvgXml: ({ xml, width, height, accessibilityLabel }: {
    xml: string
    width?: number
    height?: number
    accessibilityLabel?: string
    style?: unknown
  }) =>
    React.createElement('div', {
      'data-testid': 'svgxml',
      'aria-label': accessibilityLabel,
      'data-xml': xml,
      'data-width': String(width),
      'data-height': String(height),
    }),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

const mockedUseIcon = vi.mocked(useIcon)

describe('Icon (native)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  it('renders a loading placeholder with the correct accessibility label', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" />)

    expect(screen.getByLabelText('food/apple (loading)')).toBeInTheDocument()
  })

  it('renders an ActivityIndicator while loading', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" color="blue" />)

    const indicator = screen.getByTestId('activity-indicator')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveAttribute('data-color', 'blue')
  })

  it('uses "small" ActivityIndicator size when icon size <= 32', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" size={24} />)

    expect(screen.getByTestId('activity-indicator')).toHaveAttribute('data-size', 'small')
  })

  it('uses "large" ActivityIndicator size when icon size > 32', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" size={48} />)

    expect(screen.getByTestId('activity-indicator')).toHaveAttribute('data-size', 'large')
  })

  it('uses "small" at the exact boundary of size = 32', () => {
    mockedUseIcon.mockReturnValue({ status: 'loading' })

    render(<Icon pack="food" name="apple" size={32} />)

    expect(screen.getByTestId('activity-indicator')).toHaveAttribute('data-size', 'small')
  })

  // ── Error state ────────────────────────────────────────────────────────────

  it('renders an error placeholder with the correct accessibility label', () => {
    mockedUseIcon.mockReturnValue({ status: 'error' })

    render(<Icon pack="food" name="apple" />)

    expect(screen.getByLabelText('food/apple (failed to load)')).toBeInTheDocument()
  })

  // ── Ready state ────────────────────────────────────────────────────────────

  it('renders SvgXml with the xml from useIcon', () => {
    mockedUseIcon.mockReturnValue({ status: 'ready', xml: '<svg><path fill="red"/></svg>' })

    render(<Icon pack="food" name="apple" />)

    expect(screen.getByTestId('svgxml')).toHaveAttribute(
      'data-xml',
      '<svg><path fill="red"/></svg>'
    )
  })

  it('passes size to SvgXml as width and height', () => {
    mockedUseIcon.mockReturnValue({ status: 'ready', xml: '<svg/>' })

    render(<Icon pack="food" name="apple" size={48} />)

    const el = screen.getByTestId('svgxml')
    expect(el).toHaveAttribute('data-width', '48')
    expect(el).toHaveAttribute('data-height', '48')
  })

  it('sets the correct accessibility label in the ready state', () => {
    mockedUseIcon.mockReturnValue({ status: 'ready', xml: '<svg/>' })

    render(<Icon pack="food" name="banana" />)

    expect(screen.getByLabelText('food/banana')).toBeInTheDocument()
  })

  it('defaults to size=24 for SvgXml when no size prop is given', () => {
    mockedUseIcon.mockReturnValue({ status: 'ready', xml: '<svg/>' })

    render(<Icon pack="food" name="apple" />)

    const el = screen.getByTestId('svgxml')
    expect(el).toHaveAttribute('data-width', '24')
    expect(el).toHaveAttribute('data-height', '24')
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
})
