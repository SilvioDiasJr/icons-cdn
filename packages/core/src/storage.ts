/**
 * Persistência opcional dos SVGs (ex.: AsyncStorage no React Native).
 *
 * Compatível com a API do AsyncStorage / MMKV adapters. Quando configurado,
 * os ícones baixados ficam em disco e funcionam sem internet, inclusive após
 * reiniciar o app.
 */
export interface IconStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

export const STORAGE_PREFIX = '@icons/'

let storage: IconStorage | null = null

export function configureStorage(adapter: IconStorage | null): void {
  storage = adapter
}

function makeStorageKey(pack: string, name: string): string {
  return `${STORAGE_PREFIX}${pack}/${name}`
}

/** Lê o SVG do disco. Qualquer falha de storage é tratada como cache miss. */
export async function readPersisted(
  pack: string,
  name: string
): Promise<string | undefined> {
  if (storage === null) return undefined
  try {
    const xml = await storage.getItem(makeStorageKey(pack, name))
    return xml ?? undefined
  } catch {
    return undefined
  }
}

/** Grava o SVG em disco. Falhas não impedem o ícone de ser exibido. */
export async function writePersisted(
  pack: string,
  name: string,
  xml: string
): Promise<void> {
  if (storage === null) return
  try {
    await storage.setItem(makeStorageKey(pack, name), xml)
  } catch {
    // ignora: o ícone continua disponível no cache em memória
  }
}
