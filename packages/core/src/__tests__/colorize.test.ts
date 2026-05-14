import { describe, it, expect } from 'vitest'
import { injectColor } from '../colorize'

describe('injectColor', () => {
  it('replaces currentColor in a fill attribute', () => {
    expect(injectColor('<svg><path fill="currentColor"/></svg>', '#ff0000')).toBe(
      '<svg><path fill="#ff0000"/></svg>'
    )
  })

  it('replaces currentColor in a stroke attribute', () => {
    expect(injectColor('<svg><path stroke="currentColor"/></svg>', 'blue')).toBe(
      '<svg><path stroke="blue"/></svg>'
    )
  })

  it('replaces all occurrences across fill and stroke', () => {
    const svg = '<svg><path fill="currentColor" stroke="currentColor"/></svg>'
    expect(injectColor(svg, 'green')).toBe(
      '<svg><path fill="green" stroke="green"/></svg>'
    )
  })

  it('replaces currentColor inside an inline style attribute', () => {
    const svg = '<path style="fill:currentColor;stroke:currentColor"/>'
    expect(injectColor(svg, '#333')).toBe(
      '<path style="fill:#333;stroke:#333"/>'
    )
  })

  it('returns the string unchanged when currentColor is absent', () => {
    const svg = '<svg><path fill="blue"/></svg>'
    expect(injectColor(svg, 'red')).toBe('<svg><path fill="blue"/></svg>')
  })

  it('handles an empty string without throwing', () => {
    expect(injectColor('', 'red')).toBe('')
  })

  it('works with rgb() color values', () => {
    expect(
      injectColor('<path fill="currentColor"/>', 'rgb(0,128,255)')
    ).toBe('<path fill="rgb(0,128,255)"/>')
  })

  it('works with named CSS colors', () => {
    expect(injectColor('<path fill="currentColor"/>', 'tomato')).toBe(
      '<path fill="tomato"/>'
    )
  })

  it('replaces currentColor across multiple elements', () => {
    const svg =
      '<svg><circle fill="currentColor"/><rect stroke="currentColor"/><path fill="currentColor"/></svg>'
    expect(injectColor(svg, '#abc')).toBe(
      '<svg><circle fill="#abc"/><rect stroke="#abc"/><path fill="#abc"/></svg>'
    )
  })

  it('does not alter non-currentColor color values', () => {
    const svg = '<svg><path fill="red" stroke="currentColor"/></svg>'
    expect(injectColor(svg, 'navy')).toBe(
      '<svg><path fill="red" stroke="navy"/></svg>'
    )
  })
})
