import React, { CSSProperties } from 'react'
import { useIcon } from '@silviodiasjr/icons-core'
import type { PackName, IconProps } from '@silviodiasjr/icons-core'

// ─── Styles ──────────────────────────────────────────────────────────────────

const spinnerKeyframes = `
@keyframes __icons_spin {
  to { transform: rotate(360deg); }
}
`

let stylesInjected = false

function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = spinnerKeyframes
  document.head.appendChild(style)
  stylesInjected = true
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Icon<P extends PackName>({
  pack,
  name,
  size = 24,
  color = '#000000',
  style,
  onError,
}: IconProps<P>) {
  ensureStyles()

  const result = useIcon(pack, name, color, onError)

  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...(style as CSSProperties),
  }

  // ── Error state: bordered placeholder ──
  if (result.status === 'error') {
    return (
      <div
        role='img'
        aria-label={`${pack}/${String(name)} (failed to load)`}
        style={{
          ...containerStyle,
          border: `1.5px solid ${color}`,
          borderRadius: 4,
          opacity: 0.25,
          boxSizing: 'border-box',
        }}
      />
    )
  }

  // ── Loading state: CSS spinner, no external deps ──
  if (result.status === 'loading') {
    return (
      <div
        role='img'
        aria-label={`${pack}/${String(name)} (loading)`}
        style={containerStyle}
      >
        <div
          style={{
            width: size * 0.5,
            height: size * 0.5,
            border: `${Math.max(1.5, size * 0.07)}px solid ${color}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            opacity: 0.35,
            animation: '__icons_spin 0.7s linear infinite',
          }}
        />
      </div>
    )
  }

  // ── Ready: inline SVG ──
  const svg = result.xml.replace(/<svg\b([^>]*)>/i, (_, attrs: string) =>
    `<svg${attrs} width="${size}" height="${size}">`)

  return (
    <div
      role='img'
      aria-label={`${pack}/${String(name)}`}
      style={containerStyle}
      // SVG content is our own fetched markup; no user-generated content risk.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
