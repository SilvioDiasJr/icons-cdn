# icons

Monorepo de biblioteca de ícones SVG remotos servidos via CDN (jsDelivr), compatível com **React** (web) e **React Native / Expo** (mobile).

---

## Estrutura

```
icons/
├── packages/
│   ├── core/           ← lógica pura, zero deps de plataforma
│   ├── native/         ← adaptador React Native + Expo
│   └── web/            ← adaptador React web
├── cdn/                ← SVGs normalizados + script de normalização
│   ├── food/           ← pack food (94 ícones normalizados)
│   ├── packs/          ← SVGs originais — NÃO é versionado (.gitignore)
│   ├── scripts/
│   │   └── normalize-pack.ts
│   └── index.json      ← catálogo global de packs e ícones
├── tsconfig.base.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Setup inicial

```bash
# Instalar dependências
pnpm install

# Build de todos os packages (core → native/web em paralelo)
pnpm build

# Checar tipos em todos os packages
pnpm typecheck
```

---

## CDN (repositório separado)

Os SVGs normalizados devem ser publicados em um repositório GitHub **público** separado chamado `icons-cdn`, com a estrutura:

```
icons-cdn/
├── food/
│   ├── apple.svg
│   ├── burger.svg
│   └── ...
└── index.json
```

Servidos via jsDelivr:
```
https://cdn.jsdelivr.net/gh/SEU_USER/icons-cdn@main/{pack}/{name}.svg
```

> Substitua `SEU_USER` em `packages/core/src/config.ts`.

### Normalizar um pack

1. Coloque os SVGs originais em `cdn/packs/food/`
2. Execute o script:

```bash
cd cdn
npx tsx scripts/normalize-pack.ts food "#303538"
# ou (auto-detecta a cor)
npx tsx scripts/normalize-pack.ts food
```

3. Os SVGs normalizados ficam em `cdn/food/` e `cdn/index.json` é atualizado.
4. Faça commit e push para o repositório `icons-cdn`.

---

## Instalação nos projetos

Adicione um `.npmrc` na raiz do projeto consumidor:

```
//npm.pkg.github.com/:_authToken=SEU_TOKEN
@silviodiasjr:registry=https://npm.pkg.github.com
```

Instale o pacote correspondente à plataforma:

```bash
# React web
yarn add @silviodiasjr/icons-web

# React Native / Expo
yarn add @silviodiasjr/icons-native
npx expo install react-native-svg   # ou: yarn add react-native-svg
```

---

## Uso — React web

```tsx
import { Icon, preloadIcons } from '@silviodiasjr/icons-web'

// Preload opcional (ex: antes de mostrar a tela)
preloadIcons([{ pack: 'food', icons: ['burger', 'pizza-1'] }])

export default function App() {
  return (
    <Icon pack="food" name="burger" size={32} color="#FF6B35" />
  )
}
```

## Uso — React Native / Expo

```tsx
import * as SplashScreen from 'expo-splash-screen'
import { Icon, preloadIcons } from '@silviodiasjr/icons-native'

SplashScreen.preventAutoHideAsync()

preloadIcons([
  { pack: 'food', icons: ['burger', 'pizza-1', 'donut'] },
]).finally(() => SplashScreen.hideAsync())

export default function App() {
  return (
    <Icon pack="food" name="ice-cream-2" size={32} color="#FF6B35" />
  )
}
```

---

## Props do componente `<Icon>`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `pack` | `PackName` | — | Pack de ícones (`"food"`, etc.) |
| `name` | `PackIconMap[pack]` | — | Nome do ícone (tipado por pack) |
| `size` | `number` | `24` | Largura e altura em px |
| `color` | `string` | `'#000000'` | Cor CSS — qualquer valor válido |
| `style` | `object` | — | Estilo extra no container |
| `onError` | `(pack, name) => void` | — | Callback de erro (opcional) |

A tipagem de `name` é **estritamente inferida** a partir do `pack` informado. Se o pack for `"food"`, apenas os 94 slugs válidos são aceitos.

---

## Arquitetura de cache

- SVGs são armazenados em memória **com `currentColor`** intacto.
- A cor é injetada apenas no render via `injectColor()`, sem re-fetch.
- Dois componentes pedindo o mesmo ícone simultaneamente resultam em **um único fetch** (dedup via pending map).
- Cache sobrevive à remontagem do componente.

```ts
import { clearCache, getCacheSize } from '@silviodiasjr/icons-web' // ou @silviodiasjr/icons-native

getCacheSize();          // número de ícones em cache
clearCache();            // limpa tudo
clearCache('food');      // limpa apenas o pack food
```

---

## Adicionar um novo pack

1. Adicione o tipo em `packages/core/src/types.ts`:
   ```ts
   export type FinanceIconName = 'wallet' | 'chart' | '...';

   export interface PackIconMap {
     food: FoodIconName;
     finance: FinanceIconName; // ← aqui
   }
   ```

2. Adicione o mapeamento de slugs em `cdn/scripts/normalize-pack.ts` (seção `SLUG_MAP`).

3. Normalize o pack:
   ```bash
   npx tsx scripts/normalize-pack.ts finance "#1A1A2E"
   ```

4. Publique os SVGs no repositório `icons-cdn`.

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm build` | Build de todos os packages via Turborepo |
| `pnpm dev` | Watch mode (rebuilda ao salvar) |
| `pnpm typecheck` | Checa tipos em todos os packages |
| `pnpm clean` | Remove todos os `dist/` |
| `pnpm publish:core` | Publica `@silviodiasjr/icons-core` no GitHub Packages |
| `pnpm publish:web` | Publica `@silviodiasjr/icons-web` no GitHub Packages |
| `pnpm publish:native` | Publica `@silviodiasjr/icons-native` no GitHub Packages |
| `pnpm publish:all` | Build + publica os três pacotes em ordem |

> Antes de publicar, bumpe a versão nos `package.json` dos pacotes alterados:
> ```bash
> cd packages/web && npm version patch   # 0.2.0 → 0.2.1
> cd packages/core && npm version minor  # 0.1.0 → 0.2.0
> ```
