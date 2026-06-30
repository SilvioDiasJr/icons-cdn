export let CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/SilvioDiasJr/icons-cdn@v1.0.0'

export const DEFAULT_SIZE = 24

export const DEFAULT_COLOR = '#000000'

export function configureCDN(baseUrl: string): void {
  CDN_BASE_URL = baseUrl.replace(/\/$/, '')
}
