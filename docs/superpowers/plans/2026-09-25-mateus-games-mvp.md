# Mateus Games MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first e-commerce MVP for Mateus Games (Joinville/SC) that satisfies all 34 acceptance criteria in `prompt-mvp-ecommerce.md` §12.

**Architecture:** Monorepo with `seed/` (single JSON data source), `frontend/` (Vite + React 18 + TS + Tailwind + React Router + Zustand; data only through `src/services/*`, which switch between API and mock), and `backend/` (FastAPI + SQLAlchemy async + Postgres in Docker). Business rules are pure functions in `frontend/src/domain/` with Vitest tests; the backend mirrors validation and search in Python with pytest. After `vite build`, a Playwright script prerenders every route to static HTML for SEO.

**Tech Stack:** Node 24, React 18.3, react-router-dom 6, Vite 5, TypeScript 5, Tailwind 3, Zustand 4, Vitest 2, @testing-library/react, @fontsource/space-grotesk, sharp, playwright, lighthouse; Python 3.14, FastAPI, Pydantic v2, SQLAlchemy 2 async, asyncpg, aiosqlite (tests), pytest, httpx; Postgres 16 (Docker).

**Spec:** `docs/superpowers/specs/2026-09-25-mateus-games-mvp-design.md` (design decisions) + `prompt-mvp-ecommerce.md` (full requirements — read the section named in each task).

## Global Constraints

- All UI copy in Brazilian Portuguese.
- Store name string is exactly `Mateus Games`. It comes only from `storeConfig.nome`.
- Official spellings only: `PlayStation`, `Xbox Series X|S`, `Nintendo Switch`. The string `Playstation` (lowercase s) must never appear in `src/` or `seed/`.
- Never write "clique aqui", "R$R$", "....", "anos de mercado", "há X anos". Use "Desde 2012" (from `storeConfig.anoFundacao`).
- Never concatenate "R$" manually. Every price goes through `formatPrice`.
- Never use `text-transform: uppercase` / Tailwind `uppercase` on text blocks. Never write copy in ALL CAPS.
- No `<iframe>`, no social embed scripts, no third-party runtime scripts. Social networks appear only as plain links.
- Menu principal has exactly 7 items: `PlayStation | Xbox | Nintendo | Retrô & Clássicos | Usados & Seminovos | Gift Cards | Serviços`.
- Warranty is never part of a product name. Product names come only from `buildProductName`.
- Old labels "à vista em dinheiro" and "inicial parcelado" must not exist. Use "no Pix ou dinheiro" and "no cartão".
- Touch targets ≥ 44×44px. Visible focus ring on every interactive element. Every image has width, height and descriptive alt.
- Exactly one `variant="primary"` Button rendered per screen (the action color is reserved for buy/main CTA).
- Type scale only 12/14/16/20/24/32px. Spacing only 4/8/16/24/32/48px.
- Commits: Conventional Commits, each ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Canonical origin: `https://www.mateusgames.com.br`.
- Windows host: use Git Bash paths (`/c/Users/joaod/mvp-ecommerce`). Python venv at `backend/.venv`, activate with `source backend/.venv/Scripts/activate`.

## Execution waves (for parallel dispatch)

- Wave 0 (sequential): Task 1, Task 2
- Wave 1 (parallel, disjoint files): Task 3, Task 5, Task 6; Task 4 starts as soon as Task 3 is committed (it imports Task 3 modules) and runs in parallel with Tasks 5–6
- Wave 2 (sequential): Task 7
- Wave 3 (parallel, disjoint page files): Task 8, Task 9, Task 10, Task 11
- Wave 4 (sequential): Task 12, then Task 13 (controller: E2E with agent-browser, Lighthouse, README)

---

### Task 1: Scaffold monorepo, tooling, types, storeConfig, tokens

**Files:**
- Create: `frontend/` (Vite react-ts template), `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/src/styles/tokens.css`, `frontend/src/index.css`, `frontend/src/domain/types.ts`, `frontend/src/config/storeConfig.ts`, `frontend/vite.config.ts`, `frontend/.env.example`
- Create: `backend/requirements.txt`, `backend/app/__init__.py`, `backend/pytest.ini`, `docker-compose.yml`
- Create: `package.json` (root, scripts only)

**Interfaces:**
- Produces: `frontend/src/domain/types.ts` (exact content below), `storeConfig` (exact content below), Tailwind theme keys used by every UI task: colors `brand`, `brand-strong`, `action`, `action-hover`, `success`, `warning`, `error`, `info` (+ `-bg` variants), `bg`, `surface`, `border`, `text`, `text-muted`; fontSize `xs(12) sm(14) base(16) lg(20) xl(24) 2xl(32)`; spacing `1(4) 2(8) 4(16) 6(24) 8(32) 12(48)`; `rounded-card`, `shadow-card`.

- [ ] **Step 1: Scaffold frontend and install every frontend dependency now (so later parallel tasks never edit package.json)**

```bash
cd /c/Users/joaod/mvp-ecommerce
npm create vite@5 frontend -- --template react-ts
cd frontend
npm install react@18.3.1 react-dom@18.3.1 react-router-dom@6 zustand@4 @fontsource/space-grotesk
npm install -D @types/react@18 @types/react-dom@18 tailwindcss@3 postcss autoprefixer vitest@2 jsdom @testing-library/react@16 @testing-library/jest-dom @testing-library/user-event sharp playwright lighthouse serve
npx playwright install chromium
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 2: Write config files**

`frontend/vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' }, fs: { allow: ['..'] } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
});
```

`frontend/src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`frontend/.env.example`:
```
# mock = seed JSON in the browser; api = FastAPI at /api
VITE_DATA_SOURCE=mock
```
Also copy it to `frontend/.env`.

`frontend/package.json` scripts (replace the scripts block):
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port 4173",
  "test": "vitest run",
  "images": "node scripts/gen-images.mjs",
  "sitemap": "node scripts/gen-sitemap.mjs",
  "prerender": "node scripts/prerender.mjs",
  "check": "node scripts/check-acceptance.mjs",
  "build:full": "npm run images && npm run sitemap && npm run build && npm run prerender && npm run check"
}
```
(Scripts referenced here are created in Tasks 6 and 12.)

`frontend/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 3: Write tokens and Tailwind theme**

`frontend/src/styles/tokens.css`:
```css
:root {
  --color-brand: #3b1f8e;
  --color-brand-strong: #2a1566;
  --color-brand-soft: #efeafd;
  --color-action: #c2410c;
  --color-action-hover: #9a3412;
  --color-success: #166534;  --color-success-bg: #dcfce7;
  --color-warning: #854d0e;  --color-warning-bg: #fef3c7;
  --color-error: #b91c1c;    --color-error-bg: #fee2e2;
  --color-info: #1e40af;     --color-info-bg: #dbeafe;
  --color-bg: #f7f6fb;
  --color-surface: #ffffff;
  --color-border: #d6d3e0;
  --color-text: #1c1830;
  --color-text-muted: #55506a;
  --radius-card: 12px;
  --shadow-card: 0 1px 2px rgb(28 24 48 / 0.08), 0 4px 12px rgb(28 24 48 / 0.06);
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
}
```

`frontend/src/index.css`:
```css
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/700.css';
@import './styles/tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: var(--font-sans); color: var(--color-text); background: var(--color-bg); }
  body { overflow-x: hidden; }
  :focus-visible { outline: 3px solid var(--color-brand); outline-offset: 2px; }
}
```

`frontend/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';
const v = (n: string) => `var(--color-${n})`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    fontSize: { xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'], lg: ['20px', '28px'], xl: ['24px', '32px'], '2xl': ['32px', '40px'] },
    fontWeight: { normal: '400', bold: '700' },
    spacing: { 0: '0', px: '1px', 1: '4px', 2: '8px', 4: '16px', 6: '24px', 8: '32px', 11: '44px', 12: '48px' },
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), strong: v('brand-strong'), soft: v('brand-soft') },
        action: { DEFAULT: v('action'), hover: v('action-hover') },
        success: { DEFAULT: v('success'), bg: v('success-bg') },
        warning: { DEFAULT: v('warning'), bg: v('warning-bg') },
        error: { DEFAULT: v('error'), bg: v('error-bg') },
        info: { DEFAULT: v('info'), bg: v('info-bg') },
        bg: v('bg'), surface: v('surface'), border: v('border'), text: v('text'), muted: v('text-muted'),
      },
      borderRadius: { card: 'var(--radius-card)' },
      boxShadow: { card: 'var(--shadow-card)' },
    },
  },
  plugins: [],
} satisfies Config;
```
Note: spacing key `11` (44px) exists only for touch-target sizing (`min-h-11 min-w-11`).

- [ ] **Step 4: Write shared types**

`frontend/src/domain/types.ts`:
```ts
export type Plataforma = 'playstation' | 'xbox' | 'nintendo' | 'retro' | 'multi';
export type Tipo = 'console' | 'jogo' | 'acessorio' | 'headset' | 'gift-card';
export type Condicao = 'novo' | 'usado' | 'lacrado';
export type EstadoConservacao = 'excelente' | 'muito-bom' | 'bom';

export interface PriceModel { precoAVista: number; precoParcelado: number; parcelasMax: number; jurosMensal?: number }
export interface Acompanha { console: boolean; controles: number; cabos: boolean; caixa: boolean; jogo: boolean }
export interface UsadoInfo { estado: EstadoConservacao; acompanha: Acompanha; revisadoEm: string; fotosReais: { src: string; alt: string }[] }
export interface ProductImage { src: string; alt: string }

export interface Product {
  id: string;
  slug: string;
  plataforma: Plataforma;
  familia: string;            // "PlayStation 5", "Xbox Series X|S", "Nintendo Switch", "PlayStation 3", "Steam"...
  tipo: Tipo;
  modelo: string;             // "Slim", "Controle DualSense", "EA Sports FC 25"
  capacidade?: string;        // "1TB"
  edicao?: string;            // "Edição Digital"
  condicao: Condicao;
  atributos: string[];        // ["1TB", "Com leitor"]
  preco: PriceModel;
  crediario?: { total: number; parcelasMax: number };
  estoque: number;
  emRevisao?: boolean;
  retiradaImediata: boolean;
  garantiaTipo?: 'loja' | 'fabrica';
  garantiaAte?: string;       // ISO date (already resolved)
  garantiaMeses?: number;
  dataLancamento?: string;    // ISO date (already resolved)
  usado?: UsadoInfo;
  avisos: string[];
  descricaoTecnica: string;
  imagens: ProductImage[];
  giftCard?: { valores: number[]; regiao: 'Brasil' };
  criadoEm: string;           // ISO datetime (already resolved)
  relevancia: number;
}

export interface Campaign { id: string; titulo: string; texto: string; href: string; inicio: string; fim: string }
export interface RepairService { id: string; nome: string; descricao: string; aPartirDe: number; prazoMedio: string; garantia: string }
export interface TradeInItem { plataforma: Plataforma; familia: string; tipo: 'console' | 'jogo'; modelo: string; aceito: boolean; motivo?: string }
export interface Review { id: string; autor: string; nota: number; texto: string; data: string }
export interface FaqItem { pergunta: string; resposta: string }

export type SortKey = 'relevancia' | 'menor-preco' | 'maior-preco' | 'recentes';
export interface ProductFilters {
  plataforma?: Plataforma;
  tipo?: Tipo;
  condicao?: Condicao;
  precoMin?: number;
  precoMax?: number;
  disponibilidade?: 'estoque' | 'retirada';
  q?: string;
  sort?: SortKey;
}
export interface ProductList { items: Product[]; total: number }
export interface Suggestion { slug: string; nome: string; preco: number; imagem: ProductImage }

export interface OrderInput {
  itens: { productId: string; quantidade: number; valorGiftCard?: number }[];
  cliente: { nome: string; email: string; telefone: string };
  entrega: { tipo: 'retirada' } | { tipo: 'entrega'; cep: string; endereco: string; frete: number };
  pagamento: { metodo: 'pix' } | { metodo: 'cartao'; parcelas: number };
}
export interface Order { numero: string; total: number; criadoEm: string; input: OrderInput }
```

- [ ] **Step 5: Write storeConfig**

`frontend/src/config/storeConfig.ts`:
```ts
export const storeConfig = {
  nome: 'Mateus Games',
  seoTitleHome: 'Mateus Games | Loja de Videogames em Joinville — Venda, Troca e Assistência',
  slogan: 'A diversão de hoje é a nostalgia de amanhã',
  anoFundacao: 2012,
  siteUrl: 'https://www.mateusgames.com.br',
  telefone: '+55 47 3422-0000',
  whatsapp: '5547999990000', // wa.me format, digits only
  email: 'contato@mateusgames.com.br',
  endereco: { rua: 'Rua do Príncipe, 500 — Sala 3', bairro: 'Centro', cidade: 'Joinville', uf: 'SC', cep: '89201-000' },
  geo: { lat: -26.3045, lng: -48.8487 },
  horario: [
    { dias: 'Segunda a sexta', horas: '9h às 19h', schema: 'Mo-Fr 09:00-19:00' },
    { dias: 'Sábado', horas: '9h às 14h', schema: 'Sa 09:00-14:00' },
  ],
  redes: { instagram: 'https://www.instagram.com/mateusgames', facebook: 'https://www.facebook.com/mateusgames' },
  garantiaPadraoLojaDias: 90,
  descontoPixLabel: 'no Pix ou dinheiro',
  avaliacaoGoogle: { nota: 4.9, total: 312 },
} as const;
```

- [ ] **Step 6: Backend skeleton + docker-compose**

`backend/requirements.txt`:
```
fastapi>=0.115
uvicorn[standard]>=0.30
pydantic>=2.8
sqlalchemy[asyncio]>=2.0.35
asyncpg>=0.31
aiosqlite>=0.20
pytest>=8
pytest-asyncio>=0.24
httpx>=0.27
```

`backend/pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
pythonpath = .
```

`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: mateus
      POSTGRES_PASSWORD: mateus
      POSTGRES_DB: mateusgames
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mateus"]
      interval: 2s
      retries: 15
```

```bash
cd /c/Users/joaod/mvp-ecommerce
python -m venv backend/.venv && source backend/.venv/Scripts/activate && pip install -r backend/requirements.txt
touch backend/app/__init__.py
```

Root `package.json`:
```json
{
  "name": "mateus-games-mvp",
  "private": true,
  "scripts": {
    "dev": "npm --prefix frontend run dev",
    "test": "npm --prefix frontend test",
    "db:up": "docker compose up -d --wait db"
  }
}
```

- [ ] **Step 7: Verify**

Run: `cd frontend && npx tsc -b && npx vitest run --passWithNoTests`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold frontend, backend and tokens"
```

---

### Task 2: Seed data (single source) + relative dates

**Files:**
- Create: `seed/products.json`, `seed/services.json`, `seed/trade-in.json`, `seed/reviews.json`, `seed/campaigns.json`, `seed/faq.json`
- Create: `frontend/src/domain/dates.ts`, `frontend/src/domain/dates.test.ts`

Read `prompt-mvp-ecommerce.md` §5.2, §7, §10 before writing seed.

**Interfaces:**
- Consumes: `Product` etc. from `frontend/src/domain/types.ts`.
- Produces: seed JSON files in the raw format below; `resolveDate(value: string, today: Date): string` and `resolveSeedDates<T>(obj: T, today: Date): T` in `frontend/src/domain/dates.ts`.

Raw seed format = `Product` shape, except: `slug` is omitted (generated later by `uniqueSlug(buildProductName(p))`), and date fields (`garantiaAte`, `dataLancamento`, `criadoEm`, `usado.revisadoEm`, `inicio`, `fim`, review `data`) may be ISO or relative `"+Nd"` / `"-Nd"` (N days from today). Images reference `/images/<imageKey>-400.webp` where imageKey is one of: `console-ps`, `console-xbox`, `console-switch`, `console-retro`, `handheld`, `controller`, `headset`, `game-disc`, `game-cart`, `giftcard-playstation`, `giftcard-xbox`, `giftcard-nintendo`, `giftcard-steam`, `giftcard-googleplay`, `giftcard-roblox`, `used-detail` (generated in Task 6).

- [ ] **Step 1: Write failing tests for dates**

`frontend/src/domain/dates.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveDate, resolveSeedDates, formatDateBR, formatMonthYear, addDays } from './dates';

const today = new Date('2026-09-25T12:00:00Z');

describe('resolveDate', () => {
  it('resolves positive offsets', () => expect(resolveDate('+20d', today)).toBe('2026-10-15'));
  it('resolves negative offsets', () => expect(resolveDate('-400d', today)).toBe('2025-08-21'));
  it('keeps ISO values', () => expect(resolveDate('2018-03-01', today)).toBe('2018-03-01'));
});

describe('resolveSeedDates', () => {
  it('resolves nested date fields only', () => {
    const out = resolveSeedDates({ garantiaAte: '+1d', modelo: '+1d', usado: { revisadoEm: '-2d' } }, today);
    expect(out).toEqual({ garantiaAte: '2026-09-26', modelo: '+1d', usado: { revisadoEm: '2026-09-23' } });
  });
});

describe('formatters', () => {
  it('formats DD/MM/AAAA', () => expect(formatDateBR('2026-03-05')).toBe('05/03/2026'));
  it('formats MM/AAAA', () => expect(formatMonthYear('2026-03-05')).toBe('03/2026'));
  it('adds days', () => expect(addDays('2026-12-30', 3)).toBe('2027-01-02'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/domain/dates.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`frontend/src/domain/dates.ts`:
```ts
const DATE_FIELDS = new Set(['garantiaAte', 'dataLancamento', 'criadoEm', 'revisadoEm', 'inicio', 'fim', 'data']);
const REL = /^([+-])(\d+)d$/;

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function resolveDate(value: string, today: Date): string {
  const m = REL.exec(value);
  if (!m) return value;
  return addDays(toISODate(today), (m[1] === '-' ? -1 : 1) * Number(m[2]));
}

export function resolveSeedDates<T>(obj: T, today: Date): T {
  if (Array.isArray(obj)) return obj.map((x) => resolveSeedDates(x, today)) as T;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, DATE_FIELDS.has(k) && typeof v === 'string' ? resolveDate(v, today) : resolveSeedDates(v, today)]),
    ) as T;
  }
  return obj;
}

export const formatDateBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
export const formatMonthYear = (iso: string) => { const [y, m] = iso.slice(0, 10).split('-'); return `${m}/${y}`; };
```

- [ ] **Step 4: Run tests**

Run: `cd frontend && npx vitest run src/domain/dates.test.ts`
Expected: PASS.

- [ ] **Step 5: Write seed files**

Write 30 products in `seed/products.json` (JSON array). Hard requirements (a test in Task 4 checks each by `id`):

| id | Scenario |
|---|---|
| `ps5-slim-1tb-usado` | PlayStation 5 Slim 1TB com leitor, usado, estado `excelente`, `garantiaTipo:'loja'`, `garantiaAte:'+20d'` (expiring ≤30d → alert badge), `avisos:["Não acompanha o jogo"]`, `precoAVista:2999`, `precoParcelado:3199.92`, `parcelasMax:12`, `crediario:{total:3399.6,parcelasMax:10}` |
| `ps5-pro-novo` | PlayStation 5 Pro 2TB novo lacrado, `garantiaTipo:'fabrica'`, `garantiaAte:'+365d'` |
| `xbox-series-s-usado-vencida` | Xbox Series S 512GB usado, `garantiaTipo:'loja'`, `garantiaAte:'-10d'` (expired → no badge), `criadoEm:'-40d'` |
| `switch-oled-revisao` | Nintendo Switch OLED usado, `emRevisao:true`, `estoque:1`, `retiradaImediata:false` |
| `preorder-lancado` | jogo PS5 with `dataLancamento:'-500d'` (past pre-order → normal) |
| `preorder-futuro` | jogo Nintendo Switch with `dataLancamento:'+45d'` |
| `ps4-slim-digital` | PS4 usado with `avisos:["Somente mídia digital"]` |

Coverage rules for the remaining products:
- At least 3 each for `playstation`, `xbox`, `nintendo` covering tipos `console`, `jogo`, `acessorio` (controles), `headset`.
- 6 `retro` products: families `PlayStation 3`, `Xbox 360`, `Wii U`, `Nintendo 3DS`, `PlayStation 2`, `Super Nintendo`. PS3/360/Wii U/3DS must have `plataforma:'retro'` (never `playstation`/`xbox`/`nintendo`).
- 6 gift cards (`plataforma:'multi'`, `tipo:'gift-card'`, `condicao:'novo'`), families `PlayStation`, `Xbox`, `Nintendo`, `Steam`, `Google Play`, `Roblox`, each `giftCard:{valores:[50,100,200,300],regiao:'Brasil'}`, price = smallest value, `precoParcelado` = same value, `parcelasMax:1`.
- ≥8 used items with `usado` block complete (`estado`, `acompanha`, `revisadoEm` relative like `'-3d'`, 2 `fotosReais` using `used-detail` image with alt such as "Detalhe de marca de uso na lateral do PlayStation 5 Slim").
- `criadoEm` of used items spread between `'-1d'` and `'-60d'`.
- Price rule: `precoParcelado` in cents must be divisible by `parcelasMax` (e.g. 3199.92/12 = 266.66). `precoAVista < precoParcelado` except gift cards.
- `familia` spelled officially: "PlayStation 5", "PlayStation 4", "Xbox Series X", "Xbox Series S" (consoles), "Xbox Series X|S" (games/accessories), "Xbox One", "Nintendo Switch", "Nintendo Switch 2". Never "Playstation". The Xbox scenario product uses `familia:"Xbox Series S"`, `modelo:"Console"`, `capacidade:"512GB"`.
- `modelo` never contains "garantia", "->", or glued tokens like "1TBControle".
- `descricaoTecnica`: 2–4 sentences, sentence case.
- `imagens`: 1–3 items, alt descriptive: "{familia} {modelo} {condição}, vista frontal".
- `atributos`: 1–3 short tokens.
- `relevancia`: integer 1–100.

`seed/campaigns.json`:
```json
[
  { "id": "semana-retro", "titulo": "Semana Retrô", "texto": "Clássicos revisados com garantia da loja.", "href": "/retro", "inicio": "-3d", "fim": "+10d" },
  { "id": "black-friday-2023", "titulo": "Black Friday 2023", "texto": "Ofertas encerradas.", "href": "/produtos", "inicio": "2023-11-20", "fim": "2023-11-30" }
]
```

`seed/services.json`: 6 items with fields of `RepairService`: limpeza e troca de pasta térmica (a partir de 150, "1 dia útil", "90 dias"), reparo de porta HDMI (280, "3 dias úteis", "90 dias"), drift de analógico (120, "1 dia útil", "90 dias"), troca de leitor (350, "3 a 5 dias úteis", "90 dias"), reparo de fonte (300, "3 dias úteis", "90 dias"), desbloqueio de travamento/atualização de sistema (100, "1 dia útil", "30 dias"). Descriptions 1–2 sentences.

`seed/trade-in.json`: ≥14 `TradeInItem` rows: accepted consoles (PS5, PS4, Xbox Series X|S, Xbox One, Nintendo Switch, Switch OLED, PS3, Xbox 360, Wii U, 3DS) and games (PS5/PS4/Switch/Xbox physical games), and not accepted rows with `motivo` (e.g. "Jogos digitais — não há mídia física", "Consoles com placa oxidada", "Consoles desbloqueados/modificados", "Acessórios paralelos").

`seed/reviews.json`: 5 reviews, `nota` 4–5, `data` relative (`'-5d'`…`'-90d'`), Google-style short texts mentioning troca, assistência, usados revisados, retirada.

`seed/faq.json`: `{"assistencia": FaqItem[5], "troca": FaqItem[4], "giftcards": FaqItem[3]}`. Assistência FAQ must mention "conserto de videogame em Joinville" once.

- [ ] **Step 6: Validate JSON parses**

Run: `cd /c/Users/joaod/mvp-ecommerce && node -e "for (const f of ['products','services','trade-in','reviews','campaigns','faq']) { const d=require('./seed/'+f+'.json'); console.log(f, Array.isArray(d)?d.length:Object.keys(d)); }"`
Expected: products 30, services 6, trade-in ≥14, reviews 5, campaigns 2, faq keys.
Run: `grep -rn "Playstation" seed/ ; echo "exit=$?"` → Expected `exit=1` (no matches).

- [ ] **Step 7: Commit**

```bash
git add seed frontend/src/domain/dates.ts frontend/src/domain/dates.test.ts
git commit -m "feat: add seed data and relative date resolution"
```

---

### Task 3: Domain — price, slug, product name, validation

**Files:**
- Create: `frontend/src/domain/price.ts`, `price.test.ts`, `slug.ts`, `slug.test.ts`, `productName.ts`, `productName.test.ts`

Read `prompt-mvp-ecommerce.md` §7.1, §7.4, §7.5.

**Interfaces:**
- Consumes: `types.ts`.
- Produces:
  - `formatPrice(value: number): string`
  - `savingsPercent(p: PriceModel): number` (integer, rounded)
  - `buildInstallments(p: PriceModel): InstallmentRow[]` where `InstallmentRow = { parcelas: number; valor: number; total: number; juros: boolean }`
  - `priceSummary(p: PriceModel): { aVista: number; parcelas: number; valorParcela: number; totalCartao: number; economia: number }`
  - `buildCrediarioRows(c: { total: number; parcelasMax: number }): InstallmentRow[]`
  - `slugify(text: string): string`, `uniqueSlug(base: string, taken: Set<string>): string`
  - `buildProductName(p: Pick<Product,'familia'|'modelo'|'capacidade'|'edicao'|'condicao'|'tipo'>): string`
  - `conditionLabel(c: Condicao): string` → `Novo` | `Usado` | `Lacrado`
  - `validateProductInput(p: Partial<Product>): string[]` (empty array = valid)

- [ ] **Step 1: Write failing tests**

`frontend/src/domain/price.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatPrice, savingsPercent, buildInstallments, priceSummary, buildCrediarioRows } from './price';

const nbsp = (s: string) => s.replace(/ /g, ' ');
const p = { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 };

describe('formatPrice', () => {
  it('formats BRL', () => expect(nbsp(formatPrice(2999))).toBe('R$ 2.999,00'));
  it('formats cents', () => expect(nbsp(formatPrice(266.66))).toBe('R$ 266,66'));
  it('never doubles the currency symbol', () => {
    for (const v of [0, 0.5, 1, 99.9, 1234.56, 1e6]) expect(formatPrice(v)).not.toContain('R$R$');
  });
});

describe('installments', () => {
  it('computes savings percent', () => expect(savingsPercent(p)).toBe(6));
  it('max row matches product price exactly', () => {
    const rows = buildInstallments(p);
    const last = rows[rows.length - 1];
    expect(last).toEqual({ parcelas: 12, valor: 266.66, total: 3199.92, juros: false });
  });
  it('every row: parcelas × valor === total (to the cent)', () => {
    for (const r of buildInstallments(p)) expect(Math.round(r.parcelas * r.valor * 100)).toBe(Math.round(r.total * 100));
  });
  it('adds interest rows only when jurosMensal is set', () => {
    expect(buildInstallments(p).some((r) => r.juros)).toBe(false);
    const rows = buildInstallments({ ...p, jurosMensal: 0.0199 });
    expect(rows.length).toBe(18);
    expect(rows[12].juros).toBe(true);
    expect(rows[12].total).toBeGreaterThan(p.precoParcelado);
  });
  it('summary uses the max row', () => {
    expect(priceSummary(p)).toEqual({ aVista: 2999, parcelas: 12, valorParcela: 266.66, totalCartao: 3199.92, economia: 6 });
  });
  it('crediario rows are consistent', () => {
    for (const r of buildCrediarioRows({ total: 3399.6, parcelasMax: 10 })) expect(Math.round(r.parcelas * r.valor * 100)).toBe(Math.round(r.total * 100));
  });
});
```

`frontend/src/domain/slug.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('matches the spec example', () =>
    expect(slugify('PlayStation 5 Slim 1TB com Leitor (Usado)')).toBe('playstation-5-slim-1tb-com-leitor-usado'));
  it('strips accents', () => expect(slugify('Até Retrô & Clássicos')).toBe('ate-retro-classicos'));
  it('keeps numbers, handles | and —', () => expect(slugify('Xbox Series X|S 512GB — Usado')).toBe('xbox-series-x-s-512gb-usado'));
  it('never has -- nor trailing/leading -', () => {
    for (const s of ['--a--b--', ' !!PS5!! ', 'Controle -> DualSense', 'a — — b', '(Usado)']) {
      const out = slugify(s);
      expect(out).not.toContain('--');
      expect(out).not.toMatch(/^-|-$/);
    }
  });
});

describe('uniqueSlug', () => {
  it('adds numeric suffix on collision', () => {
    const taken = new Set(['ps5', 'ps5-2']);
    expect(uniqueSlug('ps5', taken)).toBe('ps5-3');
    expect(taken.has('ps5-3')).toBe(true);
  });
});
```

`frontend/src/domain/productName.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildProductName, validateProductInput } from './productName';

describe('buildProductName', () => {
  it('builds {Plataforma} {Modelo} {Capacidade} {Edição} — {Condição}', () =>
    expect(buildProductName({ familia: 'PlayStation 5', modelo: 'Slim', capacidade: '1TB', edicao: 'Edição Digital', condicao: 'usado', tipo: 'console' }))
      .toBe('PlayStation 5 Slim 1TB Edição Digital — Usado'));
  it('omits missing parts without double spaces', () =>
    expect(buildProductName({ familia: 'Nintendo Switch', modelo: 'OLED', condicao: 'novo', tipo: 'console' })).toBe('Nintendo Switch OLED — Novo'));
  it('gift cards: no condition suffix', () =>
    expect(buildProductName({ familia: 'Steam', modelo: 'Gift Card', condicao: 'novo', tipo: 'gift-card' })).toBe('Steam Gift Card'));
  it('normalizes brand spelling', () =>
    expect(buildProductName({ familia: 'Playstation 4', modelo: 'Pro', condicao: 'usado', tipo: 'console' })).toBe('PlayStation 4 Pro — Usado'));
});

const validUsed = {
  familia: 'PlayStation 5', modelo: 'Slim', capacidade: '1TB', condicao: 'usado' as const, tipo: 'console' as const,
  preco: { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 },
  usado: { estado: 'excelente' as const, acompanha: { console: true, controles: 1, cabos: true, caixa: false, jogo: false }, revisadoEm: '2026-09-20', fotosReais: [] },
};

describe('validateProductInput', () => {
  it('accepts a valid used product', () => expect(validateProductInput(validUsed)).toEqual([]));
  it('rejects glued text like 1TBControle', () =>
    expect(validateProductInput({ ...validUsed, modelo: 'Slim 1TBControle' }).join()).toMatch(/sem espaço/));
  it('rejects arrows', () => expect(validateProductInput({ ...validUsed, modelo: 'Slim -> Leitor' }).join()).toMatch(/seta/));
  it('rejects warranty in the name', () => expect(validateProductInput({ ...validUsed, modelo: 'Slim Garantia 2025' }).join()).toMatch(/garantia/i));
  it('rejects used without estado/acompanha', () => {
    expect(validateProductInput({ ...validUsed, usado: undefined }).join()).toMatch(/estado/);
    expect(validateProductInput({ ...validUsed, usado: { ...validUsed.usado, acompanha: undefined as never } }).join()).toMatch(/acompanha/);
  });
  it('rejects installment total not divisible by parcelas', () =>
    expect(validateProductInput({ ...validUsed, preco: { precoAVista: 2999, precoParcelado: 3199.9, parcelasMax: 12 } }).join()).toMatch(/parcel/));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/domain/price.test.ts src/domain/slug.test.ts src/domain/productName.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`frontend/src/domain/price.ts`:
```ts
import type { PriceModel } from './types';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = (value: number): string => brl.format(value);

const cents = (v: number) => Math.round(v * 100);
const fromCents = (c: number) => c / 100;

export interface InstallmentRow { parcelas: number; valor: number; total: number; juros: boolean }

function evenRow(total: number, n: number, juros = false): InstallmentRow {
  const valorC = Math.round(cents(total) / n);
  return { parcelas: n, valor: fromCents(valorC), total: fromCents(valorC * n), juros };
}

export const savingsPercent = (p: PriceModel) => Math.round((1 - p.precoAVista / p.precoParcelado) * 100);

export function buildInstallments(p: PriceModel): InstallmentRow[] {
  const rows = Array.from({ length: p.parcelasMax }, (_, i) => evenRow(p.precoParcelado, i + 1));
  if (p.jurosMensal) {
    const i = p.jurosMensal;
    for (let n = p.parcelasMax + 1; n <= 18; n++) {
      const pmt = (p.precoParcelado * i) / (1 - (1 + i) ** -n);
      const valorC = Math.round(pmt * 100);
      rows.push({ parcelas: n, valor: fromCents(valorC), total: fromCents(valorC * n), juros: true });
    }
  }
  return rows;
}

export const buildCrediarioRows = (c: { total: number; parcelasMax: number }) =>
  Array.from({ length: c.parcelasMax }, (_, i) => evenRow(c.total, i + 1));

export function priceSummary(p: PriceModel) {
  const max = evenRow(p.precoParcelado, p.parcelasMax);
  return { aVista: p.precoAVista, parcelas: max.parcelas, valorParcela: max.valor, totalCartao: max.total, economia: savingsPercent(p) };
}
```

`frontend/src/domain/slug.ts`:
```ts
export function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}
```

`frontend/src/domain/productName.ts`:
```ts
import type { Condicao, Product } from './types';

const CONDICAO: Record<Condicao, string> = { novo: 'Novo', usado: 'Usado', lacrado: 'Lacrado' };
export const conditionLabel = (c: Condicao) => CONDICAO[c];

const BRAND_FIXES: [RegExp, string][] = [
  [/\bplaystation\b/gi, 'PlayStation'],
  [/\bxbox series x\s*\|?\s*s\b/gi, 'Xbox Series X|S'],
  [/\bnintendo switch\b/gi, 'Nintendo Switch'],
];
export const fixBrands = (s: string) => BRAND_FIXES.reduce((acc, [re, v]) => acc.replace(re, v), s);

type NameInput = Pick<Product, 'familia' | 'modelo' | 'condicao' | 'tipo'> & Partial<Pick<Product, 'capacidade' | 'edicao'>>;

export function buildProductName(p: NameInput): string {
  const base = [p.familia, p.modelo, p.capacidade, p.edicao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  const name = fixBrands(base);
  return p.tipo === 'gift-card' ? name : `${name} — ${conditionLabel(p.condicao)}`;
}

// Catches capacity glued to the next word ("1TBControle"). CamelCase is NOT rejected: brands like PlayStation/DualSense use it.
const GLUED = /\d+(TB|GB|MB)(?=[A-Za-zÀ-ú])/;

export function validateProductInput(p: Partial<Product>): string[] {
  const errors: string[] = [];
  const text = [p.familia, p.modelo, p.capacidade, p.edicao].filter(Boolean).join(' ');
  if (!p.familia || !p.modelo) errors.push('Plataforma e modelo são obrigatórios.');
  if (GLUED.test(text)) errors.push('Texto colado sem espaço (ex.: "1TBControle").');
  if (/->|→/.test(text)) errors.push('Não use setas no nome.');
  if (/garantia/i.test(text)) errors.push('Garantia é um campo próprio, não parte do nome.');
  if (p.condicao === 'usado') {
    if (!p.usado?.estado) errors.push('Usado precisa do estado de conservação.');
    if (!p.usado?.acompanha) errors.push('Usado precisa informar o que acompanha.');
  }
  if (p.preco && Math.round(p.preco.precoParcelado * 100) % p.preco.parcelasMax !== 0)
    errors.push('Preço parcelado precisa dividir exatamente pelo número de parcelas.');
  return errors;
}
```

- [ ] **Step 4: Run tests**

Run: `cd frontend && npx vitest run src/domain`
Expected: PASS for all three files (and dates).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domain && git commit -m "feat(domain): price, slug, product name and validation rules"
```

---

### Task 4: Domain — warranty, pre-order, campaigns, availability, search, filters, shipping, whatsapp, seed checks

**Files:**
- Create in `frontend/src/domain/`: `warranty.ts`, `warranty.test.ts`, `preorder.ts`, `preorder.test.ts`, `availability.ts`, `availability.test.ts`, `search.ts`, `search.test.ts`, `catalog.ts`, `catalog.test.ts`, `shipping.ts`, `shipping.test.ts`, `whatsapp.ts`, `whatsapp.test.ts`, `store.ts`, `store.test.ts`, `seed.test.ts`
- Create: `frontend/src/data/loadSeed.ts`

Read `prompt-mvp-ecommerce.md` §5.3, §5.4, §7.2, §7.3, §7.6, §7.7.

**Interfaces:**
- Consumes: `types.ts`, `dates.ts` (`addDays`, `formatMonthYear`, `resolveSeedDates`, `toISODate`), `slug.ts` (`slugify`, `uniqueSlug`), `productName.ts` (`buildProductName`, `validateProductInput`). Task 3 is already committed when this task starts.
- Produces:
  - `WarrantyStatus = { kind: 'ativa' | 'vencendo' | 'loja-padrao' | 'nenhuma'; label?: string; ate?: string }`; `getWarrantyStatus(p: Product, hoje: Date, compraEm?: Date): WarrantyStatus`
  - `isPreOrderActive(p: Product, hoje: Date): boolean`; `isCampaignActive(c: Campaign, hoje: Date): boolean`
  - `Availability = { kind: 'estoque' | 'revisao' | 'esgotado'; label: string; motivo: string }`; `getAvailability(p: Product): Availability`
  - `normalizeSearch(q: string): string`; `matchesQuery(p: Product, q: string): boolean`; `suggest(products: Product[], q: string, limit?: number): Product[]`
  - `filterProducts(products: Product[], f: ProductFilters): Product[]`; `sortProducts(products: Product[], sort?: SortKey): Product[]`; `parseFilters(params: URLSearchParams): ProductFilters`; `filtersToParams(f: ProductFilters): URLSearchParams`; `keyAttributes(p: Product): string` (e.g. "1TB · Com leitor · Usado")
  - `shippingQuote(cep: string): { valor: number; prazo: string } | null`
  - `whatsappLink(text: string): string`; `productWhatsappText(name: string, url: string): string`; `pageWhatsappText(pageName: string): string`
  - `yearsSince(anoFundacao: number, hoje: Date): number`
  - `loadSeed(today?: Date): { products: Product[]; campaigns: Campaign[]; services: RepairService[]; tradeIn: TradeInItem[]; reviews: Review[]; faq: Record<'assistencia'|'troca'|'giftcards', FaqItem[]> }` in `frontend/src/data/loadSeed.ts` (resolves dates, generates slugs via `uniqueSlug(slugify(buildProductName(p)))`, memoized per day).

- [ ] **Step 1: Write failing tests**

`frontend/src/domain/warranty.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getWarrantyStatus } from './warranty';
import type { Product } from './types';

const hoje = new Date('2026-09-25T12:00:00Z');
const base = { condicao: 'novo', garantiaTipo: 'fabrica' } as Product;

describe('getWarrantyStatus', () => {
  it('future date → ativa with MM/AAAA label', () =>
    expect(getWarrantyStatus({ ...base, garantiaAte: '2027-03-10' }, hoje)).toEqual({ kind: 'ativa', label: 'Garantia até 03/2027', ate: '2027-03-10' }));
  it('exactly 30 days → vencendo', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-10-25' }, hoje).kind).toBe('vencendo'));
  it('31 days → ativa', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-10-26' }, hoje).kind).toBe('ativa'));
  it('today is last day → vencendo', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-09-25' }, hoje).kind).toBe('vencendo'));
  it('yesterday → nenhuma for new item', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-09-24' }, hoje)).toEqual({ kind: 'nenhuma' }));
  it('expired used store item → store default 90 days from purchase', () =>
    expect(getWarrantyStatus({ ...base, condicao: 'usado', garantiaTipo: 'loja', garantiaAte: '2025-01-01' }, hoje))
      .toEqual({ kind: 'loja-padrao', label: 'Garantia da loja de 90 dias', ate: '2026-12-24' }));
  it('garantiaMeses without date → ativa label in months', () =>
    expect(getWarrantyStatus({ ...base, garantiaAte: undefined, garantiaMeses: 12 }, hoje)).toEqual({ kind: 'ativa', label: 'Garantia de 12 meses', ate: '2027-09-25' }));
  it('no warranty data → nenhuma', () => expect(getWarrantyStatus({ ...base, garantiaTipo: undefined }, hoje)).toEqual({ kind: 'nenhuma' }));
});
```

`frontend/src/domain/preorder.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isPreOrderActive, isCampaignActive } from './preorder';
import type { Campaign, Product } from './types';

const hoje = new Date('2026-09-25T12:00:00Z');
const c = (inicio: string, fim: string) => ({ id: 'x', titulo: '', texto: '', href: '/', inicio, fim }) as Campaign;

describe('isPreOrderActive', () => {
  it('future release → active', () => expect(isPreOrderActive({ dataLancamento: '2026-11-01' } as Product, hoje)).toBe(true));
  it('release today → no longer pre-order', () => expect(isPreOrderActive({ dataLancamento: '2026-09-25' } as Product, hoje)).toBe(false));
  it('past release (2018) → normal product', () => expect(isPreOrderActive({ dataLancamento: '2018-03-01' } as Product, hoje)).toBe(false));
  it('no date → false', () => expect(isPreOrderActive({} as Product, hoje)).toBe(false));
});

describe('isCampaignActive', () => {
  it('inside period', () => expect(isCampaignActive(c('2026-09-20', '2026-10-01'), hoje)).toBe(true));
  it('first and last day inclusive', () => {
    expect(isCampaignActive(c('2026-09-25', '2026-09-30'), hoje)).toBe(true);
    expect(isCampaignActive(c('2026-09-01', '2026-09-25'), hoje)).toBe(true);
  });
  it('ended', () => expect(isCampaignActive(c('2023-11-20', '2023-11-30'), hoje)).toBe(false));
  it('not started', () => expect(isCampaignActive(c('2026-09-26', '2026-10-30'), hoje)).toBe(false));
});
```

`frontend/src/domain/availability.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getAvailability } from './availability';
import type { Product } from './types';

describe('getAvailability', () => {
  it('in stock', () => expect(getAvailability({ estoque: 3 } as Product).label).toBe('Em estoque — retire hoje'));
  it('in review always explains why', () => {
    const a = getAvailability({ estoque: 1, emRevisao: true } as Product);
    expect(a.label).toBe('Disponível em 2 a 3 dias úteis (em revisão técnica)');
    expect(a.motivo).not.toBe('');
  });
  it('sold out', () => expect(getAvailability({ estoque: 0 } as Product).label).toBe('Esgotado — avise-me'));
  it('every label that mentions a deadline also has a reason in parentheses', () => {
    for (const p of [{ estoque: 1, emRevisao: true }, { estoque: 2 }, { estoque: 0 }] as Product[]) {
      const { label } = getAvailability(p);
      if (/dias/.test(label)) expect(label).toMatch(/\(.+\)/);
    }
  });
});
```

`frontend/src/domain/search.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizeSearch, matchesQuery, suggest } from './search';
import type { Product } from './types';

const ps5 = { familia: 'PlayStation 5', modelo: 'Slim', condicao: 'usado', tipo: 'console', atributos: ['1TB'], relevancia: 50 } as Product;
const sw = { familia: 'Nintendo Switch', modelo: 'OLED', condicao: 'novo', tipo: 'console', atributos: [], relevancia: 10 } as Product;

describe('normalizeSearch', () => {
  it('ps5, play 5, playstation 5 are equivalent', () => {
    const a = normalizeSearch('ps5');
    expect(normalizeSearch('play 5')).toBe(a);
    expect(normalizeSearch('PlayStation 5')).toBe(a);
    expect(normalizeSearch('PLAY5')).toBe(a);
  });
  it('ignores accents and case', () => expect(normalizeSearch('Retrô CLÁSSICO')).toBe('retro classico'));
});

describe('matchesQuery', () => {
  it('"play 5" matches PS5 products', () => expect(matchesQuery(ps5, 'play 5')).toBe(true));
  it('"play 5" does not match Switch', () => expect(matchesQuery(sw, 'play 5')).toBe(false));
  it('"swich" style partial words still match by prefix', () => expect(matchesQuery(sw, 'switc')).toBe(true));
});

describe('suggest', () => {
  it('requires 2+ chars', () => expect(suggest([ps5, sw], 'p')).toEqual([]));
  it('returns nothing when no product matches', () => expect(suggest([sw, ps5], 'zz')).toEqual([]));
  it('orders by relevance', () => expect(suggest([sw, { ...ps5, relevancia: 99, familia: 'Nintendo Switch', modelo: 'Lite' } as Product], 'switch')[0].modelo).toBe('Lite'));
  it('limits results', () => expect(suggest([ps5, sw, ps5], 'ps5', 2).length).toBe(2));
});
```
(Search index = `buildProductName(p)` + `familia` + `atributos`, normalized.)

`frontend/src/domain/catalog.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { filterProducts, sortProducts, parseFilters, filtersToParams, keyAttributes } from './catalog';
import type { Product } from './types';

const mk = (o: Partial<Product>) => ({ id: o.id ?? 'x', plataforma: 'playstation', tipo: 'console', condicao: 'novo', familia: 'PlayStation 5', modelo: 'Slim', atributos: [], preco: { precoAVista: 100, precoParcelado: 120, parcelasMax: 12 }, estoque: 1, retiradaImediata: true, relevancia: 1, criadoEm: '2026-01-01', ...o }) as Product;
const items = [
  mk({ id: 'a', preco: { precoAVista: 3000, precoParcelado: 3240, parcelasMax: 12 }, relevancia: 5, criadoEm: '2026-09-01' }),
  mk({ id: 'b', condicao: 'usado', plataforma: 'xbox', preco: { precoAVista: 1500, precoParcelado: 1620, parcelasMax: 12 }, relevancia: 9, criadoEm: '2026-09-20', retiradaImediata: false }),
  mk({ id: 'c', tipo: 'gift-card', plataforma: 'multi', preco: { precoAVista: 50, precoParcelado: 50, parcelasMax: 1 }, estoque: 0, relevancia: 1, criadoEm: '2026-08-01' }),
];

describe('filterProducts', () => {
  it('filters by condicao', () => expect(filterProducts(items, { condicao: 'usado' }).map((p) => p.id)).toEqual(['b']));
  it('filters by price range on precoAVista', () => expect(filterProducts(items, { precoMin: 100, precoMax: 2000 }).map((p) => p.id)).toEqual(['b']));
  it('disponibilidade=estoque excludes estoque 0', () => expect(filterProducts(items, { disponibilidade: 'estoque' }).map((p) => p.id)).toEqual(['a', 'b']));
  it('disponibilidade=retirada requires retiradaImediata and stock', () => expect(filterProducts(items, { disponibilidade: 'retirada' }).map((p) => p.id)).toEqual(['a']));
  it('filters by plataforma and tipo', () => expect(filterProducts(items, { plataforma: 'multi', tipo: 'gift-card' }).map((p) => p.id)).toEqual(['c']));
});

describe('sortProducts', () => {
  it('menor-preco', () => expect(sortProducts(items, 'menor-preco').map((p) => p.id)).toEqual(['c', 'b', 'a']));
  it('maior-preco', () => expect(sortProducts(items, 'maior-preco').map((p) => p.id)).toEqual(['a', 'b', 'c']));
  it('recentes', () => expect(sortProducts(items, 'recentes').map((p) => p.id)).toEqual(['b', 'a', 'c']));
  it('relevancia default', () => expect(sortProducts(items).map((p) => p.id)).toEqual(['b', 'a', 'c']));
});

describe('URL round-trip', () => {
  it('parses and serializes', () => {
    const f = parseFilters(new URLSearchParams('condicao=usado&precoMin=100&sort=recentes&foo=1'));
    expect(f).toEqual({ condicao: 'usado', precoMin: 100, sort: 'recentes' });
    expect(filtersToParams(f).toString()).toBe('condicao=usado&precoMin=100&sort=recentes');
  });
});

describe('keyAttributes', () => {
  it('joins attributes with condition', () => expect(keyAttributes(mk({ atributos: ['1TB', 'Com leitor'], condicao: 'usado' }))).toBe('1TB · Com leitor · Usado'));
});
```

`frontend/src/domain/shipping.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { shippingQuote } from './shipping';

describe('shippingQuote', () => {
  it('Joinville region (89200-000..89239-999)', () => expect(shippingQuote('89201-000')).toEqual({ valor: 15, prazo: '1 dia útil' }));
  it('rest of SC (88000-000..89999-999)', () => expect(shippingQuote('88010000')).toEqual({ valor: 25, prazo: '2 a 3 dias úteis' }));
  it('rest of Brazil', () => expect(shippingQuote('01310-100')).toEqual({ valor: 45, prazo: '5 a 8 dias úteis' }));
  it('invalid CEP', () => expect(shippingQuote('123')).toBeNull());
});
```

`frontend/src/domain/whatsapp.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { whatsappLink, productWhatsappText, pageWhatsappText } from './whatsapp';

describe('whatsapp', () => {
  it('builds wa.me link with encoded text', () =>
    expect(whatsappLink('Olá! PS5 & cia')).toBe('https://wa.me/5547999990000?text=Ol%C3%A1!%20PS5%20%26%20cia'));
  it('product message contains name and url', () =>
    expect(productWhatsappText('PlayStation 5 Slim — Usado', 'https://www.mateusgames.com.br/produto/x')).toBe('Olá! Tenho interesse em: PlayStation 5 Slim — Usado — https://www.mateusgames.com.br/produto/x'));
  it('page message mentions the page', () => expect(pageWhatsappText('Assistência Técnica')).toBe('Olá! Estou na página Assistência Técnica da Mateus Games e gostaria de ajuda.'));
});
```

`frontend/src/domain/store.test.ts`:
```ts
import { it, expect } from 'vitest';
import { yearsSince } from './store';
it('computes years from founding year', () => {
  expect(yearsSince(2012, new Date('2026-09-25'))).toBe(14);
  expect(yearsSince(2012, new Date('2027-01-01'))).toBe(15);
});
```

`frontend/src/domain/seed.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadSeed } from '../data/loadSeed';
import { validateProductInput, buildProductName } from './productName';
import { getWarrantyStatus } from './warranty';
import { isPreOrderActive, isCampaignActive } from './preorder';
import { getAvailability } from './availability';
import { filterProducts } from './catalog';

const today = new Date('2026-09-25T12:00:00Z');
const seed = loadSeed(today);
const byId = (id: string) => seed.products.find((p) => p.id === id)!;

describe('seed scenarios (§10)', () => {
  it('has ~30 products and all are valid', () => {
    expect(seed.products.length).toBeGreaterThanOrEqual(28);
    for (const p of seed.products) expect(validateProductInput(p), p.id).toEqual([]);
  });
  it('slugs unique, no --, no trailing -', () => {
    const slugs = seed.products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) { expect(s).not.toContain('--'); expect(s).not.toMatch(/-$/); }
  });
  it('no name contains "garantia" or "Playstation"', () => {
    for (const p of seed.products) { const n = buildProductName(p); expect(n).not.toMatch(/garantia/i); expect(n).not.toContain('Playstation'); }
  });
  it('past pre-order shows as normal, future is active', () => {
    expect(isPreOrderActive(byId('preorder-lancado'), today)).toBe(false);
    expect(isPreOrderActive(byId('preorder-futuro'), today)).toBe(true);
  });
  it('warranty scenarios', () => {
    expect(getWarrantyStatus(byId('ps5-slim-1tb-usado'), today).kind).toBe('vencendo');
    expect(['nenhuma', 'loja-padrao']).toContain(getWarrantyStatus(byId('xbox-series-s-usado-vencida'), today).kind);
  });
  it('expired campaign filtered out', () => {
    expect(seed.campaigns.filter((c) => isCampaignActive(c, today)).map((c) => c.id)).toEqual(['semana-retro']);
  });
  it('in-review product and notice product exist', () => {
    expect(getAvailability(byId('switch-oled-revisao')).kind).toBe('revisao');
    expect(byId('ps5-slim-1tb-usado').avisos).toContain('Não acompanha o jogo');
  });
  it('PS3/360/Wii U/3DS only in retro', () => {
    const old = seed.products.filter((p) => /PlayStation 3|Xbox 360|Wii U|3DS/.test(p.familia));
    expect(old.length).toBeGreaterThanOrEqual(4);
    for (const p of old) expect(p.plataforma).toBe('retro');
  });
  it('gift cards cover 6 platforms', () => {
    const gc = filterProducts(seed.products, { tipo: 'gift-card' }).map((p) => p.familia).sort();
    expect(gc).toEqual(['Google Play', 'Nintendo', 'PlayStation', 'Roblox', 'Steam', 'Xbox']);
  });
  it('content counts', () => {
    expect(seed.services).toHaveLength(6);
    expect(seed.reviews).toHaveLength(5);
    expect(seed.tradeIn.some((t) => !t.aceito)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/domain`
Expected: FAIL (new modules missing).

- [ ] **Step 3: Implement**

`frontend/src/domain/warranty.ts`:
```ts
import type { Product } from './types';
import { addDays, formatMonthYear, toISODate } from './dates';
import { storeConfig } from '../config/storeConfig';

export type WarrantyStatus = { kind: 'ativa' | 'vencendo' | 'loja-padrao' | 'nenhuma'; label?: string; ate?: string };

const daysBetween = (fromISO: string, toISO: string) =>
  Math.round((Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000);

export function getWarrantyStatus(p: Product, hoje: Date, compraEm: Date = hoje): WarrantyStatus {
  if (!p.garantiaTipo) return { kind: 'nenhuma' };
  const today = toISODate(hoje);
  const ate = p.garantiaAte ?? (p.garantiaMeses ? addMonths(today, p.garantiaMeses) : undefined);
  if (!ate) return { kind: 'nenhuma' };
  const left = daysBetween(today, ate);
  if (left >= 0) {
    const label = p.garantiaAte ? `Garantia até ${formatMonthYear(ate)}` : `Garantia de ${p.garantiaMeses} meses`;
    return left <= 30 ? { kind: 'vencendo', label: `Garantia até ${formatMonthYear(ate)} — vence em ${left} dia${left === 1 ? '' : 's'}`, ate } : { kind: 'ativa', label, ate };
  }
  if (p.condicao === 'usado' && p.garantiaTipo === 'loja') {
    const dias = storeConfig.garantiaPadraoLojaDias;
    return { kind: 'loja-padrao', label: `Garantia da loja de ${dias} dias`, ate: addDays(toISODate(compraEm), dias) };
  }
  return { kind: 'nenhuma' };
}

function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISODate(d);
}
```

`frontend/src/domain/preorder.ts`:
```ts
import type { Campaign, Product } from './types';
import { toISODate } from './dates';

export const isPreOrderActive = (p: Product, hoje: Date) => !!p.dataLancamento && p.dataLancamento.slice(0, 10) > toISODate(hoje);

export function isCampaignActive(c: Campaign, hoje: Date) {
  const t = toISODate(hoje);
  return c.inicio.slice(0, 10) <= t && t <= c.fim.slice(0, 10);
}
```

`frontend/src/domain/availability.ts`:
```ts
import type { Product } from './types';

export type Availability = { kind: 'estoque' | 'revisao' | 'esgotado'; label: string; motivo: string };

export function getAvailability(p: Pick<Product, 'estoque' | 'emRevisao'>): Availability {
  if (p.estoque <= 0) return { kind: 'esgotado', label: 'Esgotado — avise-me', motivo: 'Sem unidades no momento.' };
  if (p.emRevisao) return { kind: 'revisao', label: 'Disponível em 2 a 3 dias úteis (em revisão técnica)', motivo: 'A unidade está passando pela revisão da nossa assistência antes da venda.' };
  return { kind: 'estoque', label: 'Em estoque — retire hoje', motivo: 'Unidade disponível na loja em Joinville.' };
}
```

`frontend/src/domain/search.ts`:
```ts
import type { Product } from './types';
import { buildProductName } from './productName';

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Canonical token ← synonyms. Order matters: longer phrases first.
const SYNONYMS: [RegExp, string][] = [
  [/\bplay\s*station\s*5\b|\bplay\s*5\b|\bps\s*5\b/g, 'ps5'],
  [/\bplay\s*station\s*4\b|\bplay\s*4\b|\bps\s*4\b/g, 'ps4'],
  [/\bplay\s*station\s*3\b|\bplay\s*3\b|\bps\s*3\b/g, 'ps3'],
  [/\bplay\s*station\s*2\b|\bplay\s*2\b|\bps\s*2\b/g, 'ps2'],
  [/\bxbox\s*series\s*x\s*\|?\s*s\b|\bseries\s*[xs]\b/g, 'xbox series'],
  [/\bnintendo\s*switch\b|\bswitch\b/g, 'switch'],
  [/\bcontrole\b|\bjoystick\b|\bmanete\b/g, 'controle'],
];

export function normalizeSearch(q: string): string {
  let s = strip(q).replace(/[^a-z0-9|\s]/g, ' ');
  for (const [re, v] of SYNONYMS) s = s.replace(re, v);
  return s.replace(/\s+/g, ' ').trim();
}

const indexOf = (p: Product) => normalizeSearch([buildProductName(p), p.familia, ...p.atributos].join(' '));

export function matchesQuery(p: Product, q: string): boolean {
  const idx = indexOf(p).split(' ');
  return normalizeSearch(q).split(' ').filter(Boolean).every((t) => idx.some((w) => w.startsWith(t)));
}

export function suggest(products: Product[], q: string, limit = 6): Product[] {
  if (normalizeSearch(q).length < 2) return [];
  return products.filter((p) => matchesQuery(p, q)).sort((a, b) => b.relevancia - a.relevancia).slice(0, limit);
}
```

`frontend/src/domain/catalog.ts`:
```ts
import type { Product, ProductFilters, SortKey } from './types';
import { matchesQuery } from './search';
import { conditionLabel } from './productName';

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  return products.filter((p) =>
    (!f.plataforma || p.plataforma === f.plataforma) &&
    (!f.tipo || p.tipo === f.tipo) &&
    (!f.condicao || p.condicao === f.condicao) &&
    (f.precoMin == null || p.preco.precoAVista >= f.precoMin) &&
    (f.precoMax == null || p.preco.precoAVista <= f.precoMax) &&
    (f.disponibilidade !== 'estoque' || p.estoque > 0) &&
    (f.disponibilidade !== 'retirada' || (p.estoque > 0 && p.retiradaImediata && !p.emRevisao)) &&
    (!f.q || matchesQuery(p, f.q)));
}

export function sortProducts(products: Product[], sort: SortKey = 'relevancia'): Product[] {
  const cmp: Record<SortKey, (a: Product, b: Product) => number> = {
    relevancia: (a, b) => b.relevancia - a.relevancia,
    'menor-preco': (a, b) => a.preco.precoAVista - b.preco.precoAVista,
    'maior-preco': (a, b) => b.preco.precoAVista - a.preco.precoAVista,
    recentes: (a, b) => b.criadoEm.localeCompare(a.criadoEm),
  };
  return [...products].sort(cmp[sort]);
}

const KEYS = ['plataforma', 'tipo', 'condicao', 'precoMin', 'precoMax', 'disponibilidade', 'q', 'sort'] as const;
const NUMERIC = new Set(['precoMin', 'precoMax']);

export function parseFilters(params: URLSearchParams): ProductFilters {
  const f: Record<string, string | number> = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) f[k] = NUMERIC.has(k) ? Number(v) : v;
  }
  return f as ProductFilters;
}

export function filtersToParams(f: ProductFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const k of KEYS) if (f[k] != null && f[k] !== '') p.set(k, String(f[k]));
  return p;
}

export const keyAttributes = (p: Product) => [...p.atributos, p.tipo === 'gift-card' ? null : conditionLabel(p.condicao)].filter(Boolean).join(' · ');
```

`frontend/src/domain/shipping.ts`:
```ts
export function shippingQuote(cep: string): { valor: number; prazo: string } | null {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const n = Number(digits);
  if (n >= 89200000 && n <= 89239999) return { valor: 15, prazo: '1 dia útil' };
  if (n >= 88000000 && n <= 89999999) return { valor: 25, prazo: '2 a 3 dias úteis' };
  return { valor: 45, prazo: '5 a 8 dias úteis' };
}
```

`frontend/src/domain/whatsapp.ts`:
```ts
import { storeConfig } from '../config/storeConfig';

export const whatsappLink = (text: string) => `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(text)}`;
export const productWhatsappText = (name: string, url: string) => `Olá! Tenho interesse em: ${name} — ${url}`;
export const pageWhatsappText = (pageName: string) => `Olá! Estou na página ${pageName} da ${storeConfig.nome} e gostaria de ajuda.`;
```

`frontend/src/domain/store.ts`:
```ts
export const yearsSince = (anoFundacao: number, hoje: Date) => hoje.getUTCFullYear() - anoFundacao;
```

`frontend/src/data/loadSeed.ts`:
```ts
import productsRaw from '../../../seed/products.json';
import campaignsRaw from '../../../seed/campaigns.json';
import servicesRaw from '../../../seed/services.json';
import tradeInRaw from '../../../seed/trade-in.json';
import reviewsRaw from '../../../seed/reviews.json';
import faqRaw from '../../../seed/faq.json';
import type { Campaign, FaqItem, Product, RepairService, Review, TradeInItem } from '../domain/types';
import { resolveSeedDates, toISODate } from '../domain/dates';
import { slugify, uniqueSlug } from '../domain/slug';
import { buildProductName } from '../domain/productName';

export interface Seed {
  products: Product[]; campaigns: Campaign[]; services: RepairService[]; tradeIn: TradeInItem[]; reviews: Review[];
  faq: Record<'assistencia' | 'troca' | 'giftcards', FaqItem[]>;
}

let cache: { day: string; seed: Seed } | undefined;

export function loadSeed(today = new Date()): Seed {
  const day = toISODate(today);
  if (cache?.day === day) return cache.seed;
  const taken = new Set<string>();
  const products = resolveSeedDates(productsRaw as unknown as Product[], today).map((p) => ({ ...p, slug: uniqueSlug(slugify(buildProductName(p)), taken) }));
  const seed: Seed = {
    products,
    campaigns: resolveSeedDates(campaignsRaw as Campaign[], today),
    services: servicesRaw as RepairService[],
    tradeIn: tradeInRaw as TradeInItem[],
    reviews: resolveSeedDates(reviewsRaw as Review[], today),
    faq: faqRaw as Seed['faq'],
  };
  cache = { day, seed };
  return seed;
}
```
Add `"resolveJsonModule": true` to `frontend/tsconfig.app.json` compilerOptions if missing, and include `"../seed/*.json"` in its `include` array.

- [ ] **Step 4: Run tests**

Run: `cd frontend && npx vitest run src/domain`
Expected: PASS. If `seed.test.ts` fails on a seed value, fix `seed/products.json` (not the test).

- [ ] **Step 5: Commit**

```bash
git add frontend/src seed && git commit -m "feat(domain): warranty, pre-order, availability, search, catalog rules"
```

---

### Task 5: Backend — FastAPI + SQLAlchemy async + seed + validation + search

**Files:**
- Create: `backend/app/db.py`, `models.py`, `schemas.py`, `seed.py`, `search.py`, `validation.py`, `repository.py`, `main.py`
- Create: `backend/tests/conftest.py`, `test_api.py`, `test_search.py`, `test_validation.py`, `test_seed.py`

Read `prompt-mvp-ecommerce.md` §3, §7.3–7.5 and the spec "API" section. Mirror the TypeScript rules from Task 3/4 plan text exactly (same synonyms, same messages, same slug algorithm).

**Interfaces:**
- Consumes: `seed/*.json` (raw format from Task 2).
- Produces (JSON uses camelCase field names identical to `types.ts`):
  - `GET /api/health` → `{"ok": true}`
  - `GET /api/products` query `plataforma,tipo,condicao,precoMin,precoMax,disponibilidade,q,sort,limit` → `{"items": Product[], "total": int}`
  - `GET /api/products/{slug}` → `Product` | 404 `{"detail":"Produto não encontrado"}`
  - `GET /api/search/suggest?q=` → `Suggestion[]` (≤6; `[]` when normalized q < 2 chars)
  - `GET /api/services` → `RepairService[]`; `GET /api/trade-in` → `TradeInItem[]`; `GET /api/reviews` → `Review[]`; `GET /api/faq` → `{assistencia,troca,giftcards}`; `GET /api/campaigns` → active `Campaign[]`
  - `POST /api/orders` body `OrderInput` → 201 `Order` (`numero` format `MG-YYYYMMDD-XXXX`)
  - `POST /api/trade-in/protocol` body `{resumo: str}` → 201 `{"protocolo": "TR-YYYYMMDD-XXXX"}`
  - `POST /api/products` body raw product → 201 `Product` | 422 `{"detail": [messages]}` from `validate_product_input`
  - Env: `DATABASE_URL` (default `postgresql+asyncpg://mateus:mateus@localhost:5432/mateusgames`). App startup creates tables and seeds if empty.

- [ ] **Step 1: Write failing tests**

`backend/tests/conftest.py`:
```python
import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app, lifespan


@pytest.fixture
async def client():
    async with lifespan(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c
```

`backend/tests/test_search.py`:
```python
from app.search import normalize_search


def test_ps5_synonyms_equivalent():
    a = normalize_search("ps5")
    assert normalize_search("play 5") == a
    assert normalize_search("PlayStation 5") == a
    assert normalize_search("PLAY5") == a


def test_accents_and_case():
    assert normalize_search("Retrô CLÁSSICO") == "retro classico"
```

`backend/tests/test_validation.py`:
```python
from app.validation import validate_product_input, slugify

VALID = {
    "familia": "PlayStation 5", "modelo": "Slim", "capacidade": "1TB", "condicao": "usado", "tipo": "console",
    "preco": {"precoAVista": 2999, "precoParcelado": 3199.92, "parcelasMax": 12},
    "usado": {"estado": "excelente", "acompanha": {"console": True, "controles": 1, "cabos": True, "caixa": False, "jogo": False}, "revisadoEm": "2026-09-20", "fotosReais": []},
}


def test_valid():
    assert validate_product_input(VALID) == []


def test_glued_text():
    assert any("sem espaço" in e for e in validate_product_input({**VALID, "modelo": "Slim 1TBControle"}))


def test_used_requires_estado_and_acompanha():
    errs = validate_product_input({**VALID, "usado": None})
    assert any("estado" in e for e in errs) and any("acompanha" in e for e in errs)


def test_slugify_spec_example():
    assert slugify("PlayStation 5 Slim 1TB com Leitor (Usado)") == "playstation-5-slim-1tb-com-leitor-usado"
    assert "--" not in slugify("a -- b") and not slugify("x!").endswith("-")
```

`backend/tests/test_seed.py`:
```python
from datetime import date
from app.seed import resolve_date


def test_resolve_relative_dates():
    today = date(2026, 9, 25)
    assert resolve_date("+20d", today) == "2026-10-15"
    assert resolve_date("-400d", today) == "2025-08-21"
    assert resolve_date("2018-03-01", today) == "2018-03-01"
```

`backend/tests/test_api.py`:
```python
async def test_health(client):
    r = await client.get("/api/health")
    assert r.json() == {"ok": True}


async def test_list_and_filter(client):
    r = await client.get("/api/products")
    body = r.json()
    assert body["total"] >= 28 and len(body["items"]) == body["total"]
    used = (await client.get("/api/products", params={"condicao": "usado"})).json()
    assert used["total"] > 0 and all(p["condicao"] == "usado" for p in used["items"])


async def test_search_play5_returns_ps5(client):
    items = (await client.get("/api/products", params={"q": "play 5"})).json()["items"]
    assert items and all(p["familia"] == "PlayStation 5" for p in items)


async def test_sort_menor_preco(client):
    items = (await client.get("/api/products", params={"sort": "menor-preco"})).json()["items"]
    prices = [p["preco"]["precoAVista"] for p in items]
    assert prices == sorted(prices)


async def test_product_by_slug_and_404(client):
    first = (await client.get("/api/products")).json()["items"][0]
    r = await client.get(f"/api/products/{first['slug']}")
    assert r.status_code == 200 and r.json()["id"] == first["id"]
    assert (await client.get("/api/products/nao-existe")).status_code == 404


async def test_suggest(client):
    assert (await client.get("/api/search/suggest", params={"q": "p"})).json() == []
    s = (await client.get("/api/search/suggest", params={"q": "ps5"})).json()
    assert 0 < len(s) <= 6 and {"slug", "nome", "preco", "imagem"} <= set(s[0])


async def test_campaigns_only_active(client):
    ids = [c["id"] for c in (await client.get("/api/campaigns")).json()]
    assert ids == ["semana-retro"]


async def test_content_endpoints(client):
    assert len((await client.get("/api/services")).json()) == 6
    assert len((await client.get("/api/reviews")).json()) == 5
    assert any(not t["aceito"] for t in (await client.get("/api/trade-in")).json())
    assert "assistencia" in (await client.get("/api/faq")).json()


async def test_create_order(client):
    p = (await client.get("/api/products")).json()["items"][0]
    body = {"itens": [{"productId": p["id"], "quantidade": 1}], "cliente": {"nome": "Ana", "email": "ana@x.com", "telefone": "47999990000"},
            "entrega": {"tipo": "retirada"}, "pagamento": {"metodo": "pix"}}
    r = await client.post("/api/orders", json=body)
    assert r.status_code == 201
    assert r.json()["numero"].startswith("MG-") and r.json()["total"] == p["preco"]["precoAVista"]


async def test_trade_in_protocol(client):
    r = await client.post("/api/trade-in/protocol", json={"resumo": "PS4 usado"})
    assert r.status_code == 201 and r.json()["protocolo"].startswith("TR-")


async def test_create_product_validation(client):
    bad = {"familia": "PlayStation 5", "modelo": "Slim1TBControle", "condicao": "usado", "tipo": "console",
           "preco": {"precoAVista": 1, "precoParcelado": 1.2, "parcelasMax": 12}, "plataforma": "playstation"}
    r = await client.post("/api/products", json=bad)
    assert r.status_code == 422
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && source .venv/Scripts/activate && pytest -q`
Expected: FAIL (ImportError).

- [ ] **Step 3: Implement**

`backend/app/db.py`:
```python
import os
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mateus:mateus@localhost:5432/mateusgames")
# SQLite in-memory (tests) must share one connection, otherwise each connection sees an empty DB.
engine = (create_async_engine(DATABASE_URL, poolclass=StaticPool, connect_args={"check_same_thread": False})
          if DATABASE_URL.startswith("sqlite") else create_async_engine(DATABASE_URL))
Session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
```

`backend/app/models.py` — tables store the full camelCase document in a JSON column plus indexed columns used for filtering:
```python
from sqlalchemy import JSON, Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


class ProductRow(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    plataforma: Mapped[str] = mapped_column(String, index=True)
    tipo: Mapped[str] = mapped_column(String, index=True)
    condicao: Mapped[str] = mapped_column(String, index=True)
    preco_a_vista: Mapped[float] = mapped_column(Float, index=True)
    estoque: Mapped[int] = mapped_column(Integer)
    retirada_imediata: Mapped[bool] = mapped_column(Boolean)
    em_revisao: Mapped[bool] = mapped_column(Boolean, default=False)
    relevancia: Mapped[int] = mapped_column(Integer)
    criado_em: Mapped[str] = mapped_column(String)
    search_index: Mapped[str] = mapped_column(String)
    doc: Mapped[dict] = mapped_column(JSON)


class ContentRow(Base):
    """Key/value store for small content lists: services, trade-in, reviews, faq, campaigns."""
    __tablename__ = "content"
    key: Mapped[str] = mapped_column(String, primary_key=True)
    doc: Mapped[list | dict] = mapped_column(JSON)


class OrderRow(Base):
    __tablename__ = "orders"
    numero: Mapped[str] = mapped_column(String, primary_key=True)
    total: Mapped[float] = mapped_column(Float)
    criado_em: Mapped[str] = mapped_column(String)
    doc: Mapped[dict] = mapped_column(JSON)
```

`backend/app/validation.py`:
```python
import re
import unicodedata

_GLUED = re.compile(r"\d+(TB|GB|MB)(?=[A-Za-zÀ-ú])")
_CONDICAO = {"novo": "Novo", "usado": "Usado", "lacrado": "Lacrado"}
_BRANDS = [(re.compile(r"\bplaystation\b", re.I), "PlayStation"),
           (re.compile(r"\bxbox series x\s*\|?\s*s\b", re.I), "Xbox Series X|S"),
           (re.compile(r"\bnintendo switch\b", re.I), "Nintendo Switch")]


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", strip_accents(text).lower())
    return re.sub(r"-+", "-", s).strip("-")


def unique_slug(base: str, taken: set[str]) -> str:
    slug, i = base, 2
    while slug in taken:
        slug, i = f"{base}-{i}", i + 1
    taken.add(slug)
    return slug


def build_product_name(p: dict) -> str:
    name = " ".join(x for x in [p.get("familia"), p.get("modelo"), p.get("capacidade"), p.get("edicao")] if x)
    name = re.sub(r"\s+", " ", name).strip()
    for rx, v in _BRANDS:
        name = rx.sub(v, name)
    return name if p.get("tipo") == "gift-card" else f"{name} — {_CONDICAO[p['condicao']]}"


def validate_product_input(p: dict) -> list[str]:
    errors: list[str] = []
    text = " ".join(x for x in [p.get("familia"), p.get("modelo"), p.get("capacidade"), p.get("edicao")] if x)
    if not p.get("familia") or not p.get("modelo"):
        errors.append("Plataforma e modelo são obrigatórios.")
    if _GLUED.search(text):
        errors.append('Texto colado sem espaço (ex.: "1TBControle").')
    if "->" in text or "→" in text:
        errors.append("Não use setas no nome.")
    if re.search("garantia", text, re.I):
        errors.append("Garantia é um campo próprio, não parte do nome.")
    if p.get("condicao") == "usado":
        usado = p.get("usado") or {}
        if not usado.get("estado"):
            errors.append("Usado precisa do estado de conservação.")
        if not usado.get("acompanha"):
            errors.append("Usado precisa informar o que acompanha.")
    preco = p.get("preco")
    if preco and round(preco["precoParcelado"] * 100) % preco["parcelasMax"] != 0:
        errors.append("Preço parcelado precisa dividir exatamente pelo número de parcelas.")
    return errors
```

`backend/app/search.py` (same synonyms as `frontend/src/domain/search.ts`):
```python
import re
from .validation import strip_accents

_SYNONYMS = [
    (r"\bplay\s*station\s*5\b|\bplay\s*5\b|\bps\s*5\b", "ps5"),
    (r"\bplay\s*station\s*4\b|\bplay\s*4\b|\bps\s*4\b", "ps4"),
    (r"\bplay\s*station\s*3\b|\bplay\s*3\b|\bps\s*3\b", "ps3"),
    (r"\bplay\s*station\s*2\b|\bplay\s*2\b|\bps\s*2\b", "ps2"),
    (r"\bxbox\s*series\s*x\s*\|?\s*s\b|\bseries\s*[xs]\b", "xbox series"),
    (r"\bnintendo\s*switch\b|\bswitch\b", "switch"),
    (r"\bcontrole\b|\bjoystick\b|\bmanete\b", "controle"),
]


def normalize_search(q: str) -> str:
    s = re.sub(r"[^a-z0-9|\s]", " ", strip_accents(q).lower())
    for rx, v in _SYNONYMS:
        s = re.sub(rx, v, s)
    return re.sub(r"\s+", " ", s).strip()


def matches(index: str, q: str) -> bool:
    words = index.split(" ")
    return all(any(w.startswith(t) for w in words) for t in normalize_search(q).split(" ") if t)
```

`backend/app/seed.py`:
```python
import json
import re
from datetime import date, timedelta
from pathlib import Path
from sqlalchemy import select
from .models import ContentRow, ProductRow
from .search import normalize_search
from .validation import build_product_name, slugify, unique_slug

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"
DATE_FIELDS = {"garantiaAte", "dataLancamento", "criadoEm", "revisadoEm", "inicio", "fim", "data"}
_REL = re.compile(r"^([+-])(\d+)d$")


def resolve_date(value: str, today: date) -> str:
    m = _REL.match(value)
    if not m:
        return value
    n = int(m.group(2)) * (-1 if m.group(1) == "-" else 1)
    return (today + timedelta(days=n)).isoformat()


def resolve_dates(obj, today: date):
    if isinstance(obj, list):
        return [resolve_dates(x, today) for x in obj]
    if isinstance(obj, dict):
        return {k: resolve_date(v, today) if k in DATE_FIELDS and isinstance(v, str) else resolve_dates(v, today) for k, v in obj.items()}
    return obj


def load(name: str):
    return json.loads((SEED_DIR / f"{name}.json").read_text(encoding="utf-8"))


def product_row(p: dict) -> ProductRow:
    return ProductRow(
        id=p["id"], slug=p["slug"], plataforma=p["plataforma"], tipo=p["tipo"], condicao=p["condicao"],
        preco_a_vista=p["preco"]["precoAVista"], estoque=p["estoque"], retirada_imediata=p["retiradaImediata"],
        em_revisao=bool(p.get("emRevisao")), relevancia=p["relevancia"], criado_em=p["criadoEm"],
        search_index=normalize_search(" ".join([build_product_name(p), p["familia"], *p.get("atributos", [])])), doc=p,
    )


async def seed_if_empty(session, today: date | None = None) -> None:
    if (await session.execute(select(ProductRow.id).limit(1))).first():
        return
    today = today or date.today()
    taken: set[str] = set()
    for p in resolve_dates(load("products"), today):
        p["slug"] = unique_slug(slugify(build_product_name(p)), taken)
        session.add(product_row(p))
    for key in ["services", "trade-in", "reviews", "faq", "campaigns"]:
        session.add(ContentRow(key=key, doc=resolve_dates(load(key), today)))
    await session.commit()
```
Note: relative dates are resolved at seed time. Re-seed daily in dev (`docker compose down -v`) if exact "vence em N dias" matters; documented in README.

`backend/app/repository.py`:
```python
from sqlalchemy import select
from .models import ProductRow
from .search import matches

SORTS = {
    "relevancia": ProductRow.relevancia.desc(),
    "menor-preco": ProductRow.preco_a_vista.asc(),
    "maior-preco": ProductRow.preco_a_vista.desc(),
    "recentes": ProductRow.criado_em.desc(),
}


async def list_products(session, *, plataforma=None, tipo=None, condicao=None, precoMin=None, precoMax=None,
                        disponibilidade=None, q=None, sort="relevancia", limit=None) -> list[dict]:
    stmt = select(ProductRow)
    for col, val in [(ProductRow.plataforma, plataforma), (ProductRow.tipo, tipo), (ProductRow.condicao, condicao)]:
        if val:
            stmt = stmt.where(col == val)
    if precoMin is not None:
        stmt = stmt.where(ProductRow.preco_a_vista >= precoMin)
    if precoMax is not None:
        stmt = stmt.where(ProductRow.preco_a_vista <= precoMax)
    if disponibilidade in ("estoque", "retirada"):
        stmt = stmt.where(ProductRow.estoque > 0)
    if disponibilidade == "retirada":
        stmt = stmt.where(ProductRow.retirada_imediata.is_(True), ProductRow.em_revisao.is_(False))
    stmt = stmt.order_by(SORTS.get(sort or "relevancia", SORTS["relevancia"]))
    rows = (await session.execute(stmt)).scalars().all()
    # ponytail: search filtered in Python over ~30 rows; move to Postgres full-text/trigram when catalog grows.
    if q:
        rows = [r for r in rows if matches(r.search_index, q)]
    return [r.doc for r in (rows[:limit] if limit else rows)]


async def get_by_slug(session, slug: str) -> dict | None:
    row = (await session.execute(select(ProductRow).where(ProductRow.slug == slug))).scalar_one_or_none()
    return row.doc if row else None
```

`backend/app/schemas.py`:
```python
from typing import Literal
from pydantic import BaseModel, Field


class Cliente(BaseModel):
    nome: str = Field(min_length=2)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    telefone: str = Field(min_length=10)


class Item(BaseModel):
    productId: str
    quantidade: int = Field(ge=1, le=10)
    valorGiftCard: float | None = None


class Retirada(BaseModel):
    tipo: Literal["retirada"]


class Entrega(BaseModel):
    tipo: Literal["entrega"]
    cep: str
    endereco: str
    frete: float = Field(ge=0)


class Pix(BaseModel):
    metodo: Literal["pix"]


class Cartao(BaseModel):
    metodo: Literal["cartao"]
    parcelas: int = Field(ge=1, le=18)


class OrderInput(BaseModel):
    itens: list[Item] = Field(min_length=1)
    cliente: Cliente
    entrega: Retirada | Entrega = Field(discriminator="tipo")
    pagamento: Pix | Cartao = Field(discriminator="metodo")


class ProtocolInput(BaseModel):
    resumo: str = Field(min_length=3, max_length=2000)
```

`backend/app/main.py`:
```python
import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .db import Base, Session, engine
from .models import ContentRow, OrderRow, ProductRow
from .repository import get_by_slug, list_products
from .schemas import OrderInput, ProtocolInput
from .search import normalize_search
from .seed import product_row, seed_if_empty
from .validation import build_product_name, slugify, unique_slug, validate_product_input


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with Session() as s:
        await seed_if_empty(s)
    yield


app = FastAPI(title="Mateus Games API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:4173"], allow_methods=["*"], allow_headers=["*"])


async def session():
    async with Session() as s:
        yield s


def _code(prefix: str) -> str:
    return f"{prefix}-{date.today():%Y%m%d}-{secrets.token_hex(2).upper()}"


async def _content(s, key: str):
    row = await s.get(ContentRow, key)
    return row.doc if row else []


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/products")
async def products(plataforma: str | None = None, tipo: str | None = None, condicao: str | None = None,
                   precoMin: float | None = None, precoMax: float | None = None, disponibilidade: str | None = None,
                   q: str | None = None, sort: str = "relevancia", limit: int | None = Query(None, ge=1, le=100), s=Depends(session)):
    items = await list_products(s, plataforma=plataforma, tipo=tipo, condicao=condicao, precoMin=precoMin, precoMax=precoMax,
                                disponibilidade=disponibilidade, q=q, sort=sort)
    return {"items": items[:limit] if limit else items, "total": len(items)}


@app.get("/api/products/{slug}")
async def product(slug: str, s=Depends(session)):
    doc = await get_by_slug(s, slug)
    if not doc:
        raise HTTPException(404, "Produto não encontrado")
    return doc


@app.get("/api/search/suggest")
async def suggest(q: str = "", s=Depends(session)):
    if len(normalize_search(q)) < 2:
        return []
    items = await list_products(s, q=q, sort="relevancia", limit=6)
    return [{"slug": p["slug"], "nome": build_product_name(p), "preco": p["preco"]["precoAVista"], "imagem": p["imagens"][0]} for p in items]


@app.get("/api/services")
async def services(s=Depends(session)):
    return await _content(s, "services")


@app.get("/api/trade-in")
async def trade_in(s=Depends(session)):
    return await _content(s, "trade-in")


@app.get("/api/reviews")
async def reviews(s=Depends(session)):
    return await _content(s, "reviews")


@app.get("/api/faq")
async def faq(s=Depends(session)):
    return await _content(s, "faq")


@app.get("/api/campaigns")
async def campaigns(s=Depends(session)):
    today = date.today().isoformat()
    return [c for c in await _content(s, "campaigns") if c["inicio"][:10] <= today <= c["fim"][:10]]


@app.post("/api/orders", status_code=201)
async def create_order(body: OrderInput, s=Depends(session)):
    total = 0.0
    for item in body.itens:
        row = await s.get(ProductRow, item.productId)
        if not row:
            raise HTTPException(422, f"Produto {item.productId} não existe")
        preco = row.doc["preco"]
        unit = item.valorGiftCard or (preco["precoAVista"] if body.pagamento.metodo == "pix" else preco["precoParcelado"])
        total += unit * item.quantidade
    if body.entrega.tipo == "entrega":
        total += body.entrega.frete
    order = OrderRow(numero=_code("MG"), total=round(total, 2), criado_em=datetime.now(timezone.utc).isoformat(), doc=body.model_dump())
    s.add(order)
    await s.commit()
    return {"numero": order.numero, "total": order.total, "criadoEm": order.criado_em, "input": order.doc}


@app.post("/api/trade-in/protocol", status_code=201)
async def protocol(body: ProtocolInput):
    return {"protocolo": _code("TR")}


@app.post("/api/products", status_code=201)
async def create_product(body: dict, s=Depends(session)):
    errors = validate_product_input(body)
    if errors:
        raise HTTPException(422, errors)
    taken = set((await s.execute(select(ProductRow.slug))).scalars())
    doc = {"atributos": [], "avisos": [], "imagens": [], "estoque": 0, "retiradaImediata": False, "relevancia": 1,
           "descricaoTecnica": "", "criadoEm": datetime.now(timezone.utc).isoformat(), **body}
    doc.setdefault("id", slugify(build_product_name(doc)))
    doc["slug"] = unique_slug(slugify(build_product_name(doc)), taken)
    s.add(product_row(doc))
    await s.commit()
    return doc
```

- [ ] **Step 4: Run tests**

Run: `cd backend && source .venv/Scripts/activate && pytest -q`
Expected: all PASS. (If `seed/` is not finished yet, this task runs after Task 2 — it does.)

- [ ] **Step 5: Smoke against Postgres**

```bash
cd /c/Users/joaod/mvp-ecommerce && docker compose up -d --wait db
cd backend && source .venv/Scripts/activate && (uvicorn app.main:app --port 8000 &) && sleep 4
curl -s localhost:8000/api/products?q=play%205 | python -c "import sys,json; d=json.load(sys.stdin); print(d['total'], [p['familia'] for p in d['items']])"
```
Expected: count > 0 and only "PlayStation 5". Stop uvicorn afterwards (`taskkill //F //IM uvicorn.exe` or kill the PID).

- [ ] **Step 6: Commit**

```bash
git add backend docker-compose.yml && git commit -m "feat(backend): FastAPI catalog, orders, content API with seed"
```

---

### Task 6: Design system components, pixel icons, product images

**Files:**
- Create in `frontend/src/components/ui/`: `Button.tsx`, `Badge.tsx`, `Alert.tsx`, `Accordion.tsx`, `Modal.tsx`, `Drawer.tsx`, `Toast.tsx` (+ `useToast` store), `Input.tsx`, `Select.tsx`, `RadioCard.tsx`, `Stepper.tsx`, `Breadcrumb.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Tabs.tsx`, `PixelIcon.tsx`, `index.ts`
- Create: `frontend/src/components/ui/ui.test.tsx`, `frontend/src/styles/contrast.test.ts`
- Create: `frontend/scripts/gen-images.mjs`, `frontend/scripts/illustrations/*.svg` (generated by the script), output `frontend/public/images/*.webp`

Read `prompt-mvp-ecommerce.md` §4 and §9 (a11y).

**Interfaces:**
- Consumes: Tailwind tokens (Task 1).
- Produces (all exported from `components/ui/index.ts`):
  - `Button({variant='secondary', size='md', as?: 'button'|'a'|typeof Link, ...props})` variants `'primary'|'secondary'|'ghost'`. Primary = `bg-action text-white`. All sizes `min-h-11`. Accepts `to` when `as={Link}`.
  - `Badge({tone:'brand'|'success'|'warning'|'error'|'info'|'neutral', icon?: PixelIconName, children})`
  - `Alert({tone:'warning'|'info'|'error'|'success', title?: string, children})` → `role="note"` for warning/info, `role="alert"` for error; icon + tinted background; sentence case.
  - `Accordion({items: {id:string; title:string; content:ReactNode}[], defaultOpen?: string})` using native `<details>/<summary>`.
  - `Modal({open, onClose, title, children})` and `Drawer({open, onClose, title, side='left'|'right'|'bottom', children})` both on native `<dialog>` with `showModal()`, `aria-labelledby`, close button labelled "Fechar", Esc closes.
  - `Toast` region: `<ToastRegion/>` renders `aria-live="polite"`; `toast(message: string)` function from `useToast` Zustand store.
  - `Input({label, error?, hint?, id, ...})`, `Select({label, error?, id, options:{value,label}[]})` — label always visible, `aria-invalid`, `aria-describedby` → error id.
  - `RadioCard({name, value, checked, onChange, title, description?, children?})` — native radio visually hidden inside a label card.
  - `Stepper({steps: string[], current: number})` → `<ol>` with `aria-current="step"`.
  - `Breadcrumb({items: {label:string; to?: string}[]})` → `<nav aria-label="Trilha de navegação">`.
  - `EmptyState({icon: PixelIconName, title, text?, children})` with large pixel illustration.
  - `Skeleton({className})` animated neutral block; `ProductCardSkeleton` export too.
  - `Tabs({tabs: {id, label, content}[]})` WAI-ARIA tabs with arrow-key support.
  - `PixelIcon({name, size=24, title?})` names: `'controller'|'heart'|'coin'|'wrench'|'cartridge'|'cart'|'star'|'shield'|'truck'|'store'|'gift'|'search'|'whatsapp'|'check'|'warning'|'clock'|'menu'|'user'|'close'|'swap'`. Pixel-art on a 12×12 grid as `<rect>`s (`shape-rendering="crispEdges"`), `aria-hidden` unless `title` given.
  - Images: `/images/{key}-400.webp` and `/images/{key}-800.webp` (square), keys listed in Task 2. Helper `productImgProps(src: string): {src, srcSet, width: 400, height: 400}` exported from `frontend/src/components/product/img.ts` (derive `-800` from `-400`).

- [ ] **Step 1: Write failing tests**

`frontend/src/styles/contrast.test.ts`:
```ts
import { it, expect } from 'vitest';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const tok = (n: string) => css.match(new RegExp(`--color-${n}:\\s*(#[0-9a-f]{6})`, 'i'))![1];
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const pairs: [string, string][] = [
  ['text', 'bg'], ['text', 'surface'], ['text-muted', 'surface'], ['text-muted', 'bg'],
  ['brand', 'surface'], ['brand', 'brand-soft'], ['success', 'success-bg'], ['warning', 'warning-bg'], ['error', 'error-bg'], ['info', 'info-bg'],
];
it.each(pairs)('%s on %s ≥ 4.5:1', (fg, bg) => expect(ratio(tok(fg), tok(bg))).toBeGreaterThanOrEqual(4.5));
it('white on action and brand ≥ 4.5:1', () => {
  expect(ratio('#ffffff', tok('action'))).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#ffffff', tok('brand'))).toBeGreaterThanOrEqual(4.5);
});
```

`frontend/src/components/ui/ui.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, Alert, Breadcrumb, Button, Input, Stepper, Tabs } from '.';
import { MemoryRouter } from 'react-router-dom';

describe('ui', () => {
  it('Button primary uses action color and 44px min height', () => {
    render(<Button variant="primary">Comprar</Button>);
    const b = screen.getByRole('button', { name: 'Comprar' });
    expect(b.className).toMatch(/bg-action/);
    expect(b.className).toMatch(/min-h-11/);
  });
  it('Input links error via aria-describedby', () => {
    render(<Input id="cep" label="CEP" error="CEP inválido" />);
    const input = screen.getByLabelText('CEP');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('cep-error');
    expect(screen.getByText('CEP inválido')).toHaveAttribute('id', 'cep-error');
  });
  it('Alert is sentence case with role note', () => {
    render(<Alert tone="warning">Não acompanha o jogo</Alert>);
    expect(screen.getByRole('note')).toHaveTextContent('Não acompanha o jogo');
  });
  it('Accordion collapsed by default', () => {
    render(<Accordion items={[{ id: 'd', title: 'Descrição técnica', content: 'x' }]} />);
    expect(screen.getByText('Descrição técnica').closest('details')).not.toHaveAttribute('open');
  });
  it('Stepper marks current step', () => {
    render(<Stepper steps={['Carrinho', 'Identificação']} current={1} />);
    expect(screen.getByText('Identificação').closest('li')).toHaveAttribute('aria-current', 'step');
  });
  it('Breadcrumb renders nav landmark', () => {
    render(<MemoryRouter><Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Xbox' }]} /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toBeInTheDocument();
  });
  it('Tabs switch with arrow keys', async () => {
    render(<Tabs tabs={[{ id: 'a', label: 'Cartão', content: 'A' }, { id: 'b', label: 'Crediário', content: 'B' }]} />);
    screen.getByRole('tab', { name: 'Cartão' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Crediário' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('B');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/components/ui src/styles`
Expected: ui tests FAIL (missing modules); contrast test PASS or FAIL — if any token pair fails, darken that token in `tokens.css` until it passes (do not weaken the test).

- [ ] **Step 3: Implement components**

Implement each component per the Interfaces block. Rules:
- Use only Tailwind theme keys from Task 1. No `uppercase` class anywhere.
- `Button` base: `inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-card font-bold text-base transition-colors focus-visible:outline`; primary `bg-action text-white hover:bg-action-hover`; secondary `bg-surface text-brand border border-brand hover:bg-brand-soft`; ghost `text-brand hover:bg-brand-soft`. `size='sm'` still keeps `min-h-11`.
- `Modal`/`Drawer`: `useEffect` calls `ref.current.showModal()` / `close()` on `open` change; listen to `close` event → `onClose()`. jsdom lacks `showModal`: guard with `ref.current?.showModal?.()`.
- `Toast` store: `create<{messages:{id:number;text:string}[]; push:(t:string)=>void}>` auto-removes after 4 s.
- `PixelIcon`: define each icon as an array of 12 strings of 12 chars (`'#'` filled, `'.'` empty) and render `<rect x y width=1 height=1>` for `#`, `viewBox="0 0 12 12"`, `fill="currentColor"`.

- [ ] **Step 4: Image generator**

`frontend/scripts/gen-images.mjs`: builds 16 neutral illustrations (no game cover art, no logos) as SVG strings in code — simple geometric console/controller/handheld/headset/disc/cartridge/giftcard shapes on a uniform `#efeafd` background with brand-colored shapes and a subtle pixel-grid accent; gift cards show the platform *name as plain text* (e.g. "Steam", "Google Play") on a colored card, no logos. For each key write `public/images/{key}-400.webp` and `-800.webp` via `sharp(Buffer.from(svg)).resize(size,size).webp({quality:78})`. Also write `public/images/hero-800.webp`/`-1200.webp` (wide 3:2 retro arcade composition) and `public/images/og-default-1200.webp` (1200×630 with store name and slogan text) and `public/images/bancada-800.webp` (workbench illustration for repair page) and `public/images/loja-800.webp` (storefront illustration used as map placeholder).

Run: `cd frontend && node scripts/gen-images.mjs && ls public/images | wc -l`
Expected: ≥ 38 files.

- [ ] **Step 5: Run tests**

Run: `cd frontend && npx vitest run src/components/ui src/styles`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend && git commit -m "feat(ui): design system components, pixel icons and generated images"
```

---

### Task 7: Services layer, cart store, SEO hook, app shell (router, header, search, menu, footer, WhatsApp)

**Files:**
- Create: `frontend/src/services/source.ts`, `products.ts`, `content.ts`, `orders.ts`, `services.test.ts`
- Create: `frontend/src/data/mockApi.ts`
- Create: `frontend/src/hooks/useSeo.ts`, `useAsync.ts`, `useSeo.test.tsx`
- Create: `frontend/src/store/cart.ts`, `cart.test.ts`
- Create: `frontend/src/components/layout/Header.tsx`, `MainMenu.tsx`, `SearchBox.tsx`, `Footer.tsx`, `WhatsAppButton.tsx`, `Layout.tsx`, `menu.ts`, `layout.test.tsx`
- Create: `frontend/src/components/product/ProductCard.tsx`, `PriceBlock.tsx`, `img.ts` (if not created by Task 6), `ProductGrid.tsx`
- Create: `frontend/src/seo/jsonld.ts`, `jsonld.test.ts`
- Create: `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/pages/*.tsx` stubs (one per route, each default-exporting a component that renders `<h1>` with the page name) — Tasks 8–11 replace the stubs.
- Modify: `frontend/index.html` (lang="pt-BR", default title = `storeConfig.seoTitleHome`, meta description, theme-color, preload of 700 font woff2 is optional)

Read `prompt-mvp-ecommerce.md` §3, §5, §6.10, §7.1 (PriceBlock), §8, §9.

**Interfaces:**
- Consumes: domain modules (Tasks 3–4), UI (Task 6), `loadSeed` (Task 4), types.
- Produces:
  - `services/products.ts`: `listProducts(f: ProductFilters): Promise<ProductList>`, `getProduct(slug: string): Promise<Product | null>`, `suggestProducts(q: string): Promise<Suggestion[]>`, `getRelated(p: Product, n=4): Promise<Product[]>` (same plataforma, different id, by relevance)
  - `services/content.ts`: `getServices()`, `getTradeIn()`, `getReviews()`, `getFaq()`, `getActiveCampaigns()`
  - `services/orders.ts`: `createOrder(input: OrderInput): Promise<Order>`, `createTradeInProtocol(resumo: string): Promise<{protocolo: string}>`
  - `source.ts`: `const source = import.meta.env.VITE_DATA_SOURCE === 'api' ? apiSource : mockSource` — both implement `DataSource` interface with the functions above. `apiSource` uses `fetch('/api/...')`, throws `Error('Falha ao carregar dados')` on non-2xx except 404 → `null` for getProduct. `mockSource` in `data/mockApi.ts` uses `loadSeed()` + domain `filterProducts/sortProducts/suggest`, and filters campaigns with `isCampaignActive`.
  - `useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; error?: Error; loading: boolean }`
  - `useSeo({ title, description, path, image?, jsonLd?: object | object[], noindex?: boolean })` — sets `document.title`, `meta[name=description]`, `link[rel=canonical]` = `storeConfig.siteUrl + path` (path without query string, except none), `og:title/description/url/image/type`, `twitter:card`, `meta[name=robots]` when noindex, and replaces a single `<script type="application/ld+json" id="jsonld">` with the array of objects. Creates tags if missing, updates if present (never duplicates).
  - `seo/jsonld.ts`: `storeJsonLd()`, `productJsonLd(p: Product, url: string)` (Product + Offer with `priceCurrency:'BRL'`, `price: precoAVista`, `availability` InStock/OutOfStock/PreOrder, `itemCondition` NewCondition/UsedCondition, `seller`), `breadcrumbJsonLd(items: {label, to}[])`, `faqJsonLd(items: FaqItem[])`.
  - `store/cart.ts` Zustand with `persist` → `sessionStorage` key `mg-cart`: state `{ items: CartItem[] }`, `CartItem = { productId, slug, nome, imagem, precoAVista, precoParcelado, parcelasMax, quantidade, valorGiftCard? }`; actions `add(p: Product, valorGiftCard?: number)`, `setQty(productId, qty)`, `remove(productId)`, `clear()`; selectors `cartCount(state)`, `cartTotals(state) → { pix: number; cartao: number; parcelas: number; valorParcela: number }` (gift cards: both = valorGiftCard; parcelas = min parcelasMax across items).
  - `menu.ts`: `MAIN_MENU` exactly 7 entries `{label, to?, children?}`: PlayStation `/playstation`, Xbox `/xbox`, Nintendo `/nintendo`, Retrô & Clássicos `/retro`, Usados & Seminovos `/produtos?condicao=usado`, Gift Cards `/gift-cards`, Serviços (children: Assistência Técnica `/assistencia-tecnica`, Troque seu Game `/troque-seu-game`). `SUBCATEGORIES` = Consoles `consoles`, Jogos `jogos`, Controles e Acessórios `controles-e-acessorios`, Headsets `headsets` mapping to tipos `console`, `jogo`, `acessorio`, `headset`.
  - `ProductCard({product})` — per §6.2: 1:1 image (`productImgProps`, `loading="lazy"` unless `priority`), name from `buildProductName`, one line `keyAttributes`, badges (condition; `Pré-venda` if active; warranty badge from `getWarrantyStatus` (`ativa` → success, `vencendo` → warning, others none); `Últimas unidades` when `estoque` 1–2 and not gift card), price `formatPrice(precoAVista)` + "no Pix", smaller "ou {parcelas}x de {valor}", and a visible `Button variant="secondary"` "Ver produto" linking to `/produto/{slug}` (card itself is not a second primary button). **Never render `descricaoTecnica`.**
  - `PriceBlock({product, compact?})` — line 1 bold `formatPrice(aVista) no Pix ou dinheiro` + `Badge` "economize {economia}%" (hidden when economia ≤ 0); line 2 `ou {formatPrice(totalCartao)} em até {parcelas}x de {formatPrice(valorParcela)} no cartão`; Button ghost "Ver todas as parcelas" opens `Modal` titled "Parcelamento" with `Tabs` — tab "Cartão de crédito" containing one `<table>` with `<caption>` "Cartão de crédito", rows from `buildInstallments` (columns Parcelas, Valor da parcela, Total; "sem juros"/"com juros" note); if `product.crediario` exists, second tab "Crediário da loja" with its own captioned table from `buildCrediarioRows`. If no crediário, render the single table without tabs.
  - `Layout` renders skip link "Pular para o conteúdo", `Header`, `<main id="conteudo">` with `<Suspense fallback={<PageSkeleton/>}>` + `<Outlet/>`, `Footer`, `WhatsAppButton`, `ToastRegion`.
  - `Header`: logo link (text "Mateus Games" + PixelIcon controller) to `/`, `SearchBox` always visible (full width row on mobile), account link `/conta` ("Minha conta", placeholder page), cart link with count badge (`aria-label="Carrinho, N itens"`), menu button (mobile) opening `Drawer` with `MainMenu` (platform items expandable to SUBCATEGORIES links `/{plataforma}/{sub}`), desktop inline nav with Serviços as disclosure button (`aria-expanded`).
  - `SearchBox`: `<form role="search" action="/busca">` with labelled input "Buscar produtos"; from 2 chars, debounced 150 ms `suggestProducts`, listbox of up to 6 options (thumbnail 48px, name, price); keyboard ArrowUp/Down/Enter/Escape; `aria-expanded`, `aria-controls`, `aria-activedescendant`; submit navigates to `/busca?q=`.
  - `Footer`: sections Links úteis (Sobre, Contato, Trocas e devoluções, Garantia, Privacidade, Assistência, Troque seu Game), Redes (Instagram, Facebook as plain `<a>` with `rel="noopener"`), Formas de pagamento (Pix, cartão até 12x, dinheiro — text badges), Endereço + horário from storeConfig, review seal "Nota {4,9} no Google · {312} avaliações" with star pixel icon, copyright "© {year} Mateus Games · Desde 2012". **No institutional paragraph.**
  - `WhatsAppButton`: fixed bottom-right `<a>` (56px) with `aria-label="Falar no WhatsApp"`; message from a context: `useWhatsAppMessage(text)` hook setting a Zustand value; pages call it. Default message `pageWhatsappText(document.title page name)`. On product page (bottom sticky bar present), raise it above the bar (`bottom-24` on mobile).
  - Routes in `App.tsx` exactly as spec "Routes" (lazy `import()` per page). `/usados` → `<Navigate to="/produtos?condicao=usado" replace/>`. `/index.php` → `LegacyRedirect` reads `_route_` param: `product/product&product_id=…` or any slug → `/produto/{slugify(last segment)}`, category words → matching platform route, else `/`. `/:plataforma` and `/:plataforma/:sub` only accept known platforms (`playstation|xbox|nintendo|retro`) else NotFound.
  - Page stubs (filenames Tasks 8–11 own): `Home.tsx`, `Listing.tsx`, `Search.tsx`, `ProductPage.tsx`, `Cart.tsx`, `Checkout.tsx`, `Repair.tsx`, `TradeIn.tsx`, `GiftCards.tsx`, `About.tsx`, `Contact.tsx`, `Policy.tsx`, `Account.tsx`, `NotFound.tsx`.

- [ ] **Step 1: Write failing tests**

`frontend/src/store/cart.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCart, cartCount, cartTotals } from './cart';
import type { Product } from '../domain/types';

const p = { id: 'a', slug: 'a', familia: 'PlayStation 5', modelo: 'Slim', condicao: 'usado', tipo: 'console', imagens: [{ src: '/images/console-ps-400.webp', alt: 'x' }], preco: { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 } } as Product;
const gc = { id: 'g', slug: 'g', familia: 'Steam', modelo: 'Gift Card', condicao: 'novo', tipo: 'gift-card', imagens: [{ src: '/images/giftcard-steam-400.webp', alt: 'x' }], preco: { precoAVista: 50, precoParcelado: 50, parcelasMax: 1 } } as Product;

beforeEach(() => useCart.getState().clear());

describe('cart', () => {
  it('adds and increments', () => {
    useCart.getState().add(p); useCart.getState().add(p);
    expect(cartCount(useCart.getState())).toBe(2);
  });
  it('totals pix vs card', () => {
    useCart.getState().add(p);
    expect(cartTotals(useCart.getState())).toEqual({ pix: 2999, cartao: 3199.92, parcelas: 12, valorParcela: 266.66 });
  });
  it('gift card uses chosen value and limits installments', () => {
    useCart.getState().add(p); useCart.getState().add(gc, 200);
    const t = cartTotals(useCart.getState());
    expect(t.pix).toBe(3199); expect(t.cartao).toBe(3399.92); expect(t.parcelas).toBe(1);
  });
  it('setQty 0 removes', () => {
    useCart.getState().add(p); useCart.getState().setQty('a', 0);
    expect(useCart.getState().items).toEqual([]);
  });
});
```
(Gift cards with different values are separate lines: key = `productId + ':' + valorGiftCard`. `setQty`/`remove` take that line key; `CartItem` has `key: string`.)

`frontend/src/services/services.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { listProducts, getProduct, suggestProducts } from './products';
import { getActiveCampaigns } from './content';

describe('mock services', () => {
  it('lists used products via condicao filter', async () => {
    const r = await listProducts({ condicao: 'usado' });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((p) => p.condicao === 'usado')).toBe(true);
  });
  it('"play 5" finds PS5', async () => {
    const r = await listProducts({ q: 'play 5' });
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((p) => p.familia === 'PlayStation 5')).toBe(true);
  });
  it('getProduct by slug / missing → null', async () => {
    const { items } = await listProducts({});
    expect((await getProduct(items[0].slug))?.id).toBe(items[0].id);
    expect(await getProduct('nao-existe')).toBeNull();
  });
  it('suggest needs 2 chars', async () => {
    expect(await suggestProducts('p')).toEqual([]);
    expect((await suggestProducts('ps')).length).toBeGreaterThan(0);
  });
  it('expired campaign not returned', async () => {
    expect((await getActiveCampaigns()).map((c) => c.id)).not.toContain('black-friday-2023');
  });
});
```

`frontend/src/seo/jsonld.test.ts`:
```ts
import { it, expect } from 'vitest';
import { productJsonLd, storeJsonLd, faqJsonLd, breadcrumbJsonLd } from './jsonld';
import { loadSeed } from '../data/loadSeed';

const p = loadSeed(new Date('2026-09-25')).products.find((x) => x.id === 'ps5-slim-1tb-usado')!;
it('product offer has price, availability and used condition', () => {
  const j = productJsonLd(p, 'https://www.mateusgames.com.br/produto/' + p.slug) as any;
  expect(j['@type']).toBe('Product');
  expect(j.offers).toMatchObject({ '@type': 'Offer', priceCurrency: 'BRL', price: 2999, itemCondition: 'https://schema.org/UsedCondition', availability: 'https://schema.org/InStock' });
});
it('store has address, geo, hours, phone', () => {
  const j = storeJsonLd() as any;
  expect(j['@type']).toBe('Store');
  expect(j.address.addressLocality).toBe('Joinville');
  expect(j.geo['@type']).toBe('GeoCoordinates');
  expect(j.openingHours.length).toBe(2);
  expect(j.telephone).toBeTruthy();
});
it('faq and breadcrumb shapes', () => {
  expect((faqJsonLd([{ pergunta: 'a', resposta: 'b' }]) as any).mainEntity[0]['@type']).toBe('Question');
  expect((breadcrumbJsonLd([{ label: 'Início', to: '/' }, { label: 'Xbox', to: '/xbox' }]) as any).itemListElement[1].position).toBe(2);
});
```

`frontend/src/hooks/useSeo.test.tsx`:
```tsx
import { it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useSeo } from './useSeo';

function Page({ title }: { title: string }) { useSeo({ title, description: 'desc', path: '/xbox', jsonLd: { '@type': 'X' } }); return null; }

it('sets title, single canonical and jsonld', () => {
  const { rerender } = render(<Page title="A" />);
  rerender(<Page title="B" />);
  expect(document.title).toBe('B');
  expect(document.querySelectorAll('link[rel=canonical]')).toHaveLength(1);
  expect(document.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('https://www.mateusgames.com.br/xbox');
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  expect(document.querySelector('meta[property="og:image"]')).not.toBeNull();
});
```

`frontend/src/components/layout/layout.test.tsx`:
```tsx
import { it, expect } from 'vitest';
import { MAIN_MENU } from './menu';

it('main menu has at most 7 items and official spelling', () => {
  expect(MAIN_MENU.length).toBeLessThanOrEqual(7);
  expect(MAIN_MENU.map((m) => m.label)).toEqual(['PlayStation', 'Xbox', 'Nintendo', 'Retrô & Clássicos', 'Usados & Seminovos', 'Gift Cards', 'Serviços']);
  expect(MAIN_MENU.find((m) => m.label === 'Usados & Seminovos')!.to).toBe('/produtos?condicao=usado');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/store src/services src/seo src/hooks src/components/layout`
Expected: FAIL.

- [ ] **Step 3: Implement** everything in the Interfaces block. Key code:

`frontend/src/services/source.ts`:
```ts
import type { Campaign, FaqItem, Order, OrderInput, Product, ProductFilters, ProductList, RepairService, Review, Suggestion, TradeInItem } from '../domain/types';
import { filtersToParams } from '../domain/catalog';
import { mockSource } from '../data/mockApi';

export interface DataSource {
  listProducts(f: ProductFilters): Promise<ProductList>;
  getProduct(slug: string): Promise<Product | null>;
  suggestProducts(q: string): Promise<Suggestion[]>;
  getServices(): Promise<RepairService[]>;
  getTradeIn(): Promise<TradeInItem[]>;
  getReviews(): Promise<Review[]>;
  getFaq(): Promise<Record<'assistencia' | 'troca' | 'giftcards', FaqItem[]>>;
  getActiveCampaigns(): Promise<Campaign[]>;
  createOrder(input: OrderInput): Promise<Order>;
  createTradeInProtocol(resumo: string): Promise<{ protocolo: string }>;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) throw Object.assign(new Error('Falha ao carregar dados'), { status: r.status });
  return r.json() as Promise<T>;
}

const apiSource: DataSource = {
  listProducts: (f) => http(`/products?${filtersToParams(f)}`),
  getProduct: (slug) => http<Product>(`/products/${encodeURIComponent(slug)}`).catch((e) => { if (e.status === 404) return null; throw e; }),
  suggestProducts: (q) => http(`/search/suggest?q=${encodeURIComponent(q)}`),
  getServices: () => http('/services'),
  getTradeIn: () => http('/trade-in'),
  getReviews: () => http('/reviews'),
  getFaq: () => http('/faq'),
  getActiveCampaigns: () => http('/campaigns'),
  createOrder: (input) => http('/orders', { method: 'POST', body: JSON.stringify(input) }),
  createTradeInProtocol: (resumo) => http('/trade-in/protocol', { method: 'POST', body: JSON.stringify({ resumo }) }),
};

export const source: DataSource = import.meta.env.VITE_DATA_SOURCE === 'api' ? apiSource : mockSource;
```
`products.ts`, `content.ts`, `orders.ts` re-export thin wrappers (`export const listProducts = (f: ProductFilters) => source.listProducts(f);` etc.) plus `getRelated`. Mock `createOrder` computes total like the backend (pix → precoAVista, cartão → precoParcelado, gift card → valorGiftCard, + frete) and numero `MG-YYYYMMDD-XXXX` using `crypto.getRandomValues`.

`frontend/src/hooks/useSeo.ts`:
```ts
import { useEffect } from 'react';
import { storeConfig } from '../config/storeConfig';

type Seo = { title: string; description: string; path: string; image?: string; jsonLd?: object | object[]; noindex?: boolean; type?: 'website' | 'product' };

export function useSeo({ title, description, path, image = '/images/og-default-1200.webp', jsonLd, noindex, type = 'website' }: Seo) {
  useEffect(() => {
    const url = storeConfig.siteUrl + path;
    document.title = title;
    const set = (key: 'name' | 'property', k: string, v: string) => {
      let el = document.head.querySelector(`meta[${key}="${k}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(key, k); document.head.appendChild(el); }
      el.setAttribute('content', v);
    };
    set('name', 'description', description);
    set('property', 'og:title', title);
    set('property', 'og:description', description);
    set('property', 'og:url', url);
    set('property', 'og:type', type);
    set('property', 'og:image', storeConfig.siteUrl + image);
    set('property', 'og:locale', 'pt_BR');
    set('name', 'twitter:card', 'summary_large_image');
    set('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', url);
    document.getElementById('jsonld')?.remove();
    if (jsonLd) {
      const s = document.createElement('script');
      s.type = 'application/ld+json'; s.id = 'jsonld';
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, path, image, JSON.stringify(jsonLd), noindex, type]);
}
```

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;
// Prerendered HTML is replaced by the client render (content is identical, so no layout shift).
createRoot(root).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
```

`frontend/src/App.tsx` routes (lazy):
```tsx
import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LegacyRedirect from './pages/LegacyRedirect';

const Home = lazy(() => import('./pages/Home'));
const Listing = lazy(() => import('./pages/Listing'));
const Search = lazy(() => import('./pages/Search'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Repair = lazy(() => import('./pages/Repair'));
const TradeIn = lazy(() => import('./pages/TradeIn'));
const GiftCards = lazy(() => import('./pages/GiftCards'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Policy = lazy(() => import('./pages/Policy'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Listing />} />
        <Route path="usados" element={<Navigate to="/produtos?condicao=usado" replace />} />
        <Route path="gift-cards" element={<GiftCards />} />
        <Route path="produto/:slug" element={<ProductPage />} />
        <Route path="busca" element={<Search />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="assistencia-tecnica" element={<Repair />} />
        <Route path="troque-seu-game" element={<TradeIn />} />
        <Route path="sobre" element={<About />} />
        <Route path="contato" element={<Contact />} />
        <Route path="politicas/:tipo" element={<Policy />} />
        <Route path="conta" element={<Account />} />
        <Route path="index.php" element={<LegacyRedirect />} />
        <Route path=":plataforma" element={<Listing />} />
        <Route path=":plataforma/:sub" element={<Listing />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```
`Listing` renders `<NotFound/>` itself when `:plataforma` is not one of the 4 known values or `:sub` is not one of the 4 subcategories.

- [ ] **Step 4: Run tests and typecheck**

Run: `cd frontend && npx vitest run && npx tsc -b`
Expected: PASS, no type errors.

- [ ] **Step 5: Smoke run**

Run: `cd frontend && npx vite build && (npx vite preview --port 4173 &) && sleep 3 && curl -s localhost:4173/ | grep -c 'id="root"'`
Expected: `1`. Stop preview.

- [ ] **Step 6: Commit**

```bash
git add frontend && git commit -m "feat: services layer, cart store, SEO hook and app shell"
```

---

### Task 8: Home, listing, search pages

**Files:**
- Modify (replace stubs): `frontend/src/pages/Home.tsx`, `Listing.tsx`, `Search.tsx`, `NotFound.tsx`
- Create: `frontend/src/components/product/Filters.tsx`, `frontend/src/components/home/*.tsx` (Hero, Benefits, NewArrivals, PlatformHighlights, GiftCardStrip, Reviews, StoreInfo, CampaignBanner), `frontend/src/pages/pages-catalog.test.tsx`

Read `prompt-mvp-ecommerce.md` §5.3, §5.4, §6.1, §6.2.

**Interfaces:**
- Consumes: `listProducts`, `suggestProducts`, `getReviews`, `getActiveCampaigns` (services); `ProductCard`, `ProductGrid`, UI; `useSeo`, `storeJsonLd`, `breadcrumbJsonLd`; `parseFilters/filtersToParams`; `MAIN_MENU/SUBCATEGORIES`; `whatsappLink`; `storeConfig`; `useWhatsAppMessage`.
- Produces: pages only.

Requirements:
- **Home** (in this order): `CampaignBanner` (only active campaigns from `getActiveCampaigns`; renders nothing otherwise) — then Hero: `<h1>` = `storeConfig.slogan`, subtitle "Loja de videogames em Joinville desde {anoFundacao}: venda, troca e assistência técnica.", hero image `hero-800/1200.webp` with `fetchpriority="high"` and explicit width/height, and 3 journey cards linking to `/produtos` ("Comprar games"), `/troque-seu-game` ("Trocar meu game"), `/assistencia-tecnica` ("Consertar meu console"), each with a pixel icon. The **only** primary Button on Home is "Comprar games". Then Benefits strip (4 items: "Retirada grátis na loja em Joinville", "Usados revisados com garantia", "Parcele em até 12x", "Desde 2012" — built from `storeConfig.anoFundacao`). Then "Chegou agora" (used products sorted `recentes`, 8 items, horizontal scroll on mobile with `tabindex=0` region + `aria-label`). Then Destaques por plataforma (PlayStation, Xbox, Nintendo, Retrô: 4 products each by relevance, each with a "Ver tudo de {plataforma}" link). Then Gift cards strip (6 gift cards, each card links to `/gift-cards?plataforma={familia slug}`). Then Reviews (5 Google-style cards: author initial avatar, 5 pixel stars with `aria-label="Nota 5 de 5"`, text, date "há N dias" is **not allowed** — use `formatDateBR`) plus header "Nota 4,9 no Google · 312 avaliações". Then StoreInfo: address, hours, `loja-800.webp` as map placeholder with alt "Ilustração da fachada da loja Mateus Games em Joinville", links "Como chegar no Google Maps" (`https://www.google.com/maps/search/?api=1&query=` + encoded address) and "Siga a Mateus Games no Instagram" (prominent). SEO: title `storeConfig.seoTitleHome`, description ≤160 chars mentioning Joinville, path `/`, jsonLd `storeJsonLd()`.
- **Listing**: modes: `/produtos` (all; `?condicao=usado` for Usados), `/:plataforma` (plataforma filter), `/:plataforma/:sub` (plataforma + tipo). Title h1: platform label or "Usados & Seminovos" when only condicao=usado, else "Todos os produtos"; with sub: "{Sub} de {Plataforma}". Breadcrumb Início › Plataforma › Sub. Result counter "{n} produtos" (`aria-live="polite"`). Sort `Select` (Relevância, Menor preço, Maior preço, Mais recentes). Filters (`Filters.tsx`): plataforma (only on `/produtos`), condição (Novo, Usado, Lacrado), faixa de preço (two number inputs Mín/Máx, applied on blur/submit), disponibilidade (Em estoque / Retirada imediata radios + "Qualquer"), tipo (Console, Jogo, Acessório, Headset, Gift card). All filter state lives in the URL via `useSearchParams` (`parseFilters`/`filtersToParams`). Mobile: filters in a `Drawer` opened by "Filtrar" button showing active count; desktop: sidebar. Grid `grid-cols-2 lg:grid-cols-4 gap-4`. Loading: 8 `ProductCardSkeleton`. Empty: `EmptyState` with "Limpar filtros". Platform pages exclude gift cards (gift cards live only in `/gift-cards`). SEO: canonical path without query string, `breadcrumbJsonLd`, unique description per platform.
- **Search** `/busca?q=`: h1 `Resultados para "{q}"`; uses `listProducts({q})`; results grid; zero results: EmptyState "Não encontramos resultados para "{q}"", suggestion links (PlayStation 5, Nintendo Switch, Gift Cards, Usados & Seminovos), and CTA link "Não achou? A gente procura pra você" → `whatsappLink('Olá! Procurei por "' + q + '" no site e não encontrei. Vocês conseguem para mim?')` (target `_blank`, `rel="noopener"`). SEO noindex.
- **NotFound**: EmptyState + links to home and search; `noindex`.

- [ ] **Step 1: Write failing tests** (`frontend/src/pages/pages-catalog.test.tsx`):
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Listing from './Listing';
import Search from './Search';

const at = (path: string, el: JSX.Element, pattern = '*') =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={el} /></Routes></MemoryRouter>);

describe('Home', () => {
  it('shows slogan, 3 journeys, reviews and no expired banner', async () => {
    at('/', <Home />);
    expect(await screen.findByRole('heading', { level: 1, name: 'A diversão de hoje é a nostalgia de amanhã' })).toBeInTheDocument();
    for (const n of ['Comprar games', 'Trocar meu game', 'Consertar meu console']) expect(screen.getByRole('link', { name: new RegExp(n) })).toBeInTheDocument();
    expect(await screen.findByText(/Nota 4,9 no Google/)).toBeInTheDocument();
    expect(screen.queryByText(/Black Friday 2023/)).toBeNull();
    expect(screen.getByText('Desde 2012')).toBeInTheDocument();
  });
});

describe('Listing', () => {
  it('used filter from URL, no descriptions', async () => {
    at('/produtos?condicao=usado', <Listing />, '/produtos');
    expect(await screen.findByRole('heading', { level: 1, name: 'Usados & Seminovos' })).toBeInTheDocument();
    const cards = await screen.findAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(within(c).getByText(/Usado/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Console revisado|descrição técnica/i);
  });
  it('platform page excludes gift cards', async () => {
    at('/playstation', <Listing />, '/:plataforma');
    await screen.findAllByRole('article');
    expect(screen.queryByText(/Gift Card/)).toBeNull();
  });
});

describe('Search', () => {
  it('"play 5" returns PS5 products', async () => {
    at('/busca?q=play%205', <Search />, '/busca');
    const cards = await screen.findAllByRole('article');
    for (const c of cards) expect(c.textContent).toMatch(/PlayStation 5/);
  });
  it('no results shows WhatsApp CTA with the term', async () => {
    at('/busca?q=zzzqqq', <Search />, '/busca');
    const cta = await screen.findByRole('link', { name: /Não achou\? A gente procura pra você/ });
    expect(cta.getAttribute('href')).toContain(encodeURIComponent('zzzqqq'));
  });
});
```
Note the "no descriptions" check assumes `descricaoTecnica` of used seed products starts differently from card text; the stronger guarantee is that `ProductCard` never references `descricaoTecnica` (Task 12 check script greps for it).

- [ ] **Step 2: Run to verify failure** — `cd frontend && npx vitest run src/pages/pages-catalog.test.tsx` → FAIL.
- [ ] **Step 3: Implement** per requirements above.
- [ ] **Step 4: Run** — `npx vitest run && npx tsc -b` → PASS.
- [ ] **Step 5: Commit** — `git add frontend/src && git commit -m "feat(pages): home, listing with URL filters, search"`

---

### Task 9: Product page

**Files:**
- Modify: `frontend/src/pages/ProductPage.tsx`
- Create: `frontend/src/components/product/Gallery.tsx`, `UsedBlock.tsx`, `ShippingCalculator.tsx`, `StickyBuyBar.tsx`, `frontend/src/pages/product-page.test.tsx`

Read `prompt-mvp-ecommerce.md` §6.3, §7.1–7.3, §7.6.

**Interfaces:**
- Consumes: `getProduct`, `getRelated`; `PriceBlock`, `ProductCard`; `getWarrantyStatus`, `isPreOrderActive`, `getAvailability`, `buildProductName`, `shippingQuote`, `formatDateBR`, `formatPrice`; `useCart().add`; `toast`; `useSeo`, `productJsonLd`, `breadcrumbJsonLd`; `whatsappLink`, `productWhatsappText`, `useWhatsAppMessage`; UI.
- Produces: page only.

Requirements:
- Loading skeleton; not found → `NotFound` content.
- Above the fold: Breadcrumb (Início › Plataforma › Tipo › name); `Gallery` (main 1:1 image with `fetchpriority="high"`, not lazy; thumbnails as buttons with `aria-label="Ver foto N"`); `<h1>` `buildProductName`; badges: condition (`Novo` / `Usado — Revisado` / `Lacrado`), warranty (`ativa` success "Garantia até MM/AAAA"; `vencendo` warning with same text + "vence em N dias"; `loja-padrao` info "Garantia da loja de 90 dias"; `nenhuma` → no badge), `Últimas unidades` if estoque 1–2, `Pré-venda` if `isPreOrderActive` plus text "Será lançado em DD/MM/AAAA" (only then). Availability line with icon: `getAvailability(p).label` (and `motivo` as smaller text). Avisos → one `Alert tone="warning"` per aviso (these are the only `role="note"` elements on the page). `PriceBlock`. Primary Button "Comprar" (or "Reservar na pré-venda" if pre-order; disabled + "Avise-me" secondary if esgotado) → `add(p)`, `toast('Produto adicionado ao carrinho')`, navigate to `/carrinho`. Secondary Button link "Tirar dúvida no WhatsApp" → `whatsappLink(productWhatsappText(name, canonicalUrl))`. `ShippingCalculator`: CEP `Input` (mask 00000-000, `inputMode="numeric"`), button "Calcular", result `formatPrice(valor)` + prazo, or error "Digite um CEP válido com 8 números" associated via aria-describedby; above it a highlighted line "Retirar na loja — grátis" with store address.
- Used block (`condicao === 'usado'`, required): heading "Sobre esta unidade usada"; Estado de conservação with the level highlighted among three and legend: Excelente "Sem marcas visíveis, funcionamento perfeito."; Muito bom "Marcas leves de uso, funcionamento perfeito."; Bom "Marcas de uso visíveis, funcionamento perfeito."; O que acompanha: checklist (Console, Controles (N), Cabos, Caixa, Jogo) with check/close pixel icons and screen-reader text "incluído"/"não incluído"; "Revisado pela assistência Joinville Games em DD/MM/AAAA"; Garantia da loja line from warranty status; "Fotos reais desta unidade" gallery of `usado.fotosReais` (lazy) with caption "Repare nas marcas de uso destacadas".
- Below the fold: `Accordion` with "Descrição técnica" (collapsed) and "Garantia e trocas" (link to `/politicas/garantia`); "Produtos relacionados" (4 `ProductCard`).
- Mobile: `StickyBuyBar` fixed bottom (`lg:hidden`) with price in Pix and a Button "Comprar" — the in-page button uses primary; the sticky bar button is also the same action, so to keep "one primary per screen", the sticky bar appears only when the main Comprar button is scrolled out of view (IntersectionObserver), and the page adds `pb-24` on mobile.
- `useWhatsAppMessage(productWhatsappText(name, url))`.
- SEO: title `{name} | Mateus Games`, description from name + key attributes + price ("…por R$ X no Pix. Retire grátis em Joinville."), path `/produto/{slug}`, image = first product image 800, type `product`, jsonLd `[productJsonLd(p, url), breadcrumbJsonLd(...)]`.

- [ ] **Step 1: Write failing tests** (`frontend/src/pages/product-page.test.tsx`):
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductPage from './ProductPage';
import { loadSeed } from '../data/loadSeed';
import { buildProductName } from '../domain/productName';

const seed = loadSeed();
const byId = (id: string) => seed.products.find((p) => p.id === id)!;
const open = (id: string) =>
  render(<MemoryRouter initialEntries={[`/produto/${byId(id).slug}`]}><Routes><Route path="/produto/:slug" element={<ProductPage />} /></Routes></MemoryRouter>);

describe('ProductPage', () => {
  it('used product shows mandatory used block, notice alert and expiring warranty', async () => {
    open('ps5-slim-1tb-usado');
    expect(await screen.findByRole('heading', { level: 1, name: buildProductName(byId('ps5-slim-1tb-usado')) })).toBeInTheDocument();
    expect(screen.getByText('Sobre esta unidade usada')).toBeInTheDocument();
    expect(screen.getByText(/Revisado pela assistência Joinville Games em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Não acompanha o jogo');
    expect(screen.getAllByText(/vence em \d+ dia/).length).toBeGreaterThan(0);
    expect(screen.getByText(/no Pix ou dinheiro/)).toBeInTheDocument();
  });
  it('installments modal has one labelled table per payment method', async () => {
    open('ps5-slim-1tb-usado');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver todas as parcelas' }));
    expect(screen.getByRole('tab', { name: 'Cartão de crédito' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Crediário da loja' })).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getByRole('table', { name: 'Cartão de crédito' })).toBeInTheDocument();
  });
  it('expired warranty shows no "Garantia até" badge', async () => {
    open('xbox-series-s-usado-vencida');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Garantia até/)).toBeNull();
  });
  it('past pre-order renders as normal product', async () => {
    open('preorder-lancado');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Será lançado em/)).toBeNull();
    expect(screen.queryByText('Pré-venda')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Comprar' }).length).toBeGreaterThan(0);
  });
  it('future pre-order shows release date', async () => {
    open('preorder-futuro');
    expect(await screen.findByText(/Será lançado em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });
  it('in-review product explains the deadline', async () => {
    open('switch-oled-revisao');
    expect(await screen.findByText('Disponível em 2 a 3 dias úteis (em revisão técnica)')).toBeInTheDocument();
  });
  it('WhatsApp link contains product name and URL', async () => {
    open('ps5-slim-1tb-usado');
    const link = await screen.findByRole('link', { name: 'Tirar dúvida no WhatsApp' });
    const text = decodeURIComponent(link.getAttribute('href')!.split('text=')[1]);
    expect(text).toContain(buildProductName(byId('ps5-slim-1tb-usado')));
    expect(text).toContain('https://www.mateusgames.com.br/produto/');
  });
  it('description accordion collapsed by default', async () => {
    open('ps5-pro-novo');
    expect((await screen.findByText('Descrição técnica')).closest('details')).not.toHaveAttribute('open');
  });
});
```
- [ ] **Step 2: Run to verify failure** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b` → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(pages): product page with used block, price modal and shipping"`

---

### Task 10: Cart and checkout

**Files:**
- Modify: `frontend/src/pages/Cart.tsx`, `Checkout.tsx`, `Account.tsx`
- Create: `frontend/src/components/checkout/*.tsx` (IdentificationStep, DeliveryStep, PaymentStep, ConfirmationStep, OrderSummary), `frontend/src/pages/checkout.test.tsx`

Read `prompt-mvp-ecommerce.md` §6.4, §6.5.

**Interfaces:**
- Consumes: `useCart`, `cartTotals`, `cartCount`; `createOrder`; `listProducts` (suggestions); `shippingQuote`; `formatPrice`; UI (`Stepper`, `RadioCard`, `Input`, `EmptyState`); `useSeo` (noindex).
- Produces: pages only.

Requirements:
- **Cart**: h1 "Seu carrinho"; each line: thumb, name link, gift card value if any, quantity stepper buttons (−/+ with `aria-label="Diminuir quantidade de {nome}"` etc., min 1, max 10) and "Remover" ghost button; a visually hidden `aria-live="polite"` region announcing "Carrinho atualizado: N itens, total R$ X no Pix"; summary card: "Subtotal no Pix {pix}" (bold, success tone, "economize X%"), "ou {cartao} em até {parcelas}x de {valorParcela} no cartão", delivery note "Retirada grátis na loja em Joinville ou entrega calculada no próximo passo"; primary Button "Continuar para identificação" → `/checkout`. **Empty**: `EmptyState` icon `cart`, title "Seu carrinho está vazio", text "Que tal dar uma olhada nestas ofertas?", sections "Mais vendidos" (4 products by relevance, non gift card) and "Gift cards" (3), and Button link "Voltar às compras" → `/produtos`. No institutional text.
- **Checkout**: if cart empty and no confirmed order → redirect to `/carrinho`. `Stepper` steps `['Carrinho','Identificação','Entrega','Pagamento','Confirmação']` (Carrinho is step 0 and is a link back). Steps held in component state; each step validates on "Continuar" and focuses the first invalid field; errors via `Input error`.
  - Identificação: inputs labelled exactly "Nome completo", "E-mail", "Celular (WhatsApp)"; step button labelled "Continuar" (last step: "Confirmar pedido"). Text: "Compra sem cadastro. Você pode criar uma conta depois, se quiser."
  - Entrega: `RadioCard`s — "Retirar na loja — grátis" (preselected; description address + hours + "Pronto para retirada em até 2 horas após o pagamento") and "Receber em casa" (reveals CEP + endereço inputs; CEP calculates via `shippingQuote`, shows price and prazo; invalid → error).
  - Pagamento: RadioCards — "Pix" preselected with badge "economize X%" and total in Pix, text "O código Pix aparece na confirmação (simulado)"; "Cartão de crédito" with `Select` Parcelas (1..parcelas from `cartTotals`, labels "12x de R$ 266,66 sem juros"). Summary sidebar (`OrderSummary`) always visible on desktop, collapsible `<details>` on mobile.
  - Confirmar pedido (primary) → `createOrder` → Confirmação: `<h1>` "Pedido confirmado!", "Número do pedido: {numero}", summary (items, entrega, pagamento, total), next steps list (Pix: "Pague o Pix com o código abaixo" + fake copy-paste code `00020126...` in a readonly input with "Copiar código" button; retirada: "Traga um documento com foto na loja …"; entrega: "Você recebe o código de rastreio pelo WhatsApp"), and an optional card "Quer acompanhar seus pedidos? Crie uma conta com um clique" with secondary Button "Criar conta" → `/conta`. Cart is cleared after success. Errors from `createOrder` show `Alert tone="error"` "Não foi possível concluir o pedido. Tente novamente." and keep the data.
  - Only one primary button visible per step.
- **Account** `/conta`: simple placeholder page "Minha conta" with explanation that accounts are optional and a form stub (e-mail + senha) that shows toast "Conta criada (simulação)"; noindex.

- [ ] **Step 1: Write failing tests** (`frontend/src/pages/checkout.test.tsx`):
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Cart from './Cart';
import Checkout from './Checkout';
import { useCart } from '../store/cart';
import { loadSeed } from '../data/loadSeed';

const app = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/carrinho" element={<Cart />} /><Route path="/checkout" element={<Checkout />} /></Routes></MemoryRouter>);

beforeEach(() => useCart.getState().clear());

describe('Cart', () => {
  it('empty cart shows suggestions and back button', async () => {
    app('/carrinho');
    expect(screen.getByText('Seu carrinho está vazio')).toBeInTheDocument();
    expect(await screen.findAllByRole('article')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Voltar às compras' })).toHaveAttribute('href', '/produtos');
  });
});

describe('Checkout (guest, Pix, pickup)', () => {
  it('completes an order without creating an account', async () => {
    const p = loadSeed().products.find((x) => x.id === 'ps5-pro-novo')!;
    useCart.getState().add(p);
    app('/checkout');
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
    await u.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await u.type(screen.getByLabelText('Celular (WhatsApp)'), '47999990000');
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(/Retirar na loja — grátis/)).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(/Pix/)).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    expect(await screen.findByRole('heading', { name: 'Pedido confirmado!' })).toBeInTheDocument();
    expect(screen.getByText(/Número do pedido: MG-\d{8}-[0-9A-F]{4}/)).toBeInTheDocument();
    expect(useCart.getState().items).toHaveLength(0);
  });
  it('shows validation errors linked to fields', async () => {
    useCart.getState().add(loadSeed().products[0]);
    app('/checkout');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });
});
```
- [ ] **Step 2: Run to verify failure** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b` → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(pages): cart with empty state and guest checkout"`

---

### Task 11: Repair, trade-in, gift cards, institutional pages

**Files:**
- Modify: `frontend/src/pages/Repair.tsx`, `TradeIn.tsx`, `GiftCards.tsx`, `About.tsx`, `Contact.tsx`, `Policy.tsx`
- Create: `frontend/src/domain/messages.ts`, `messages.test.ts` (WhatsApp message builders for repair and trade-in), `frontend/src/pages/services-pages.test.tsx`

Read `prompt-mvp-ecommerce.md` §6.6–§6.9, §8 (SEO local, FAQPage).

**Interfaces:**
- Consumes: `getServices`, `getTradeIn`, `getFaq`, `listProducts`, `createTradeInProtocol`; `useCart().add`; UI; `whatsappLink`; `useSeo`, `faqJsonLd`, `storeJsonLd`; `storeConfig`; `yearsSince` is **not** used for copy (use "Desde 2012").
- Produces:
  - `repairMessage(d: { console: string; problema: string; comoAconteceu?: string; nome?: string }): string` → lines: `Olá! Gostaria de um orçamento de assistência técnica.` / `Console: {console}` / `Problema: {problema}` / (`Como aconteceu: {comoAconteceu}` only if given)
  - `tradeInMessage(d: { plataforma: string; tipo: string; modelo: string; estado: string; acompanha: string[]; quer: string; produtoDesejado?: string; protocolo?: string }): string` → `Olá! Quero trocar meu game.` / `Tenho: {tipo} {modelo} ({plataforma})` / `Estado: {estado}` / `Acompanha: {acompanha.join(', ') || 'nada além do item'}` / `Quero: {quer}{produtoDesejado ? ' — ' + produtoDesejado : ''}` / (`Protocolo: {protocolo}`)

Requirements:
- **Repair** `/assistencia-tecnica`: h1 "Conserto de videogame em Joinville"; intro paragraph with local SEO text (mentions "conserto de videogame em Joinville", PlayStation, Xbox, Nintendo Switch, "orçamento sem compromisso", "Desde 2012"); service cards (grid 1/2/3 cols) with nome, descrição, "A partir de {formatPrice}", "Prazo médio: …", "Garantia do serviço: …"; workbench image `bancada-800.webp` (lazy, alt "Bancada da assistência técnica com console aberto em reparo"); form "Solicitar orçamento": Console (`Select` from PlayStation 5, PlayStation 4, Xbox Series X|S, Xbox One, Nintendo Switch, Retrô/outro), Problema (`Select` from service names + "Outro"), "Como aconteceu? (opcional)" textarea, Nome (optional). Submit (primary "Pedir orçamento no WhatsApp") validates console+problema, opens `window.open(whatsappLink(repairMessage(d)), '_blank', 'noopener')` and shows on-page confirmation `Alert tone="success"` "Pedido de orçamento enviado! Se o WhatsApp não abriu, use este link: …" with the same link (so the message is verifiable). FAQ `Accordion` from `faq.assistencia`. SEO: title "Conserto de videogame em Joinville | Mateus Games", jsonLd `[storeJsonLd(), faqJsonLd(faq.assistencia)]`. No embeds.
- **TradeIn** `/troque-seu-game`: h1 "Troque seu game"; explanation list: "Traga seu item na loja", "Avaliação em até 30 minutos", "O valor pode virar crédito na loja ou dinheiro". Wizard with `Stepper` (`['O que você tem','Estado','O que você quer','Resumo']`):
  1. Plataforma `Select` (from distinct accepted `familia` values), Tipo RadioCards (Console / Jogo), Modelo ou título `Select` filtered by plataforma+tipo from accepted `tradeIn` rows.
  2. Estado RadioCards with descriptions (same three levels + legends as product page) and "O que acompanha" checkboxes (Caixa, Controles, Cabos, Manual).
  3. O que você quer RadioCards: "Crédito na loja", "Dinheiro", "Um produto específico" (reveals a search input using `listProducts({q})` showing up to 5 results as radio options).
  4. Resumo: definition list of all choices; buttons: primary "Enviar para o WhatsApp" (link built with `tradeInMessage` incl. protocol) and secondary "Gerar protocolo" (calls `createTradeInProtocol`, shows "Protocolo {TR-…}" and includes it in the WhatsApp message). Each step validates before "Continuar"; "Voltar" ghost.
  Below the wizard: table "Itens aceitos e não aceitos" with `<caption>`, columns Item, Plataforma, Aceito? ("Sim"/"Não" text + icon), Observação (motivo). FAQ `faq.troca`.
- **GiftCards** `/gift-cards`: h1 "Gift Cards"; platform filter as a radio-button group (Todos, PlayStation, Xbox, Nintendo, Steam, Google Play, Roblox) synced to `?plataforma=` (slugified familia); each card: image, name, value chips (RadioCard-like buttons R$ 50/100/200/300, `aria-pressed`), "Válido para contas Brasil", Button secondary "Adicionar ao carrinho" (adds with chosen value; toast). How-it-works section: "Pagou, recebeu: o código chega por e-mail e WhatsApp em até 1 hora após a confirmação do pagamento (Pix aprovado na hora)." FAQ `faq.giftcards`. Only one primary on the page: none required — the page's main CTA is a secondary per card; add a primary "Ir para o carrinho" only when the cart has gift cards.
- **About** `/sobre`: h1 "Sobre a Mateus Games"; text built with "Desde 2012" and `storeConfig`; what we do (venda, troca, assistência); store info; jsonLd `storeJsonLd()`.
- **Contact** `/contato`: address, hours, telefone (`tel:` link), WhatsApp link "Conversar no WhatsApp", e-mail link, Instagram link, map placeholder image; jsonLd `storeJsonLd()`.
- **Policy** `/politicas/:tipo` for `troca`, `garantia`, `privacidade` (unknown → NotFound): h1 "Política de trocas" / "Política de garantia" (explains store warranty of 90 days for used items and manufacturer warranty for new) / "Política de privacidade"; 3–6 short paragraphs each.
- All pages call `useWhatsAppMessage(pageWhatsappText('<page name>'))`.

- [ ] **Step 1: Write failing tests**

`frontend/src/domain/messages.test.ts`:
```ts
import { it, expect } from 'vitest';
import { repairMessage, tradeInMessage } from './messages';

it('repair message includes form data and omits empty optional', () => {
  expect(repairMessage({ console: 'PlayStation 5', problema: 'Reparo de porta HDMI' }))
    .toBe('Olá! Gostaria de um orçamento de assistência técnica.\nConsole: PlayStation 5\nProblema: Reparo de porta HDMI');
  expect(repairMessage({ console: 'Xbox One', problema: 'Outro', comoAconteceu: 'Caiu da estante' })).toContain('Como aconteceu: Caiu da estante');
});

it('trade-in message summarises choices', () => {
  const m = tradeInMessage({ plataforma: 'PlayStation 4', tipo: 'Console', modelo: 'PS4 Slim', estado: 'Muito bom', acompanha: ['Caixa', 'Controles'], quer: 'Crédito na loja', protocolo: 'TR-20260925-AB12' });
  expect(m).toContain('Tenho: Console PS4 Slim (PlayStation 4)');
  expect(m).toContain('Acompanha: Caixa, Controles');
  expect(m).toContain('Protocolo: TR-20260925-AB12');
});
```

`frontend/src/pages/services-pages.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Repair from './Repair';
import TradeIn from './TradeIn';
import GiftCards from './GiftCards';

const at = (path: string, el: JSX.Element) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path={path.split('?')[0]} element={el} /></Routes></MemoryRouter>);

describe('Repair', () => {
  it('lists 6 services and builds WhatsApp quote with form data', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    at('/assistencia-tecnica', <Repair />);
    expect(await screen.findAllByText(/A partir de/)).toHaveLength(6);
    await userEvent.selectOptions(screen.getByLabelText('Console'), 'PlayStation 5');
    await userEvent.selectOptions(screen.getByLabelText('Problema'), screen.getAllByRole('option', { name: /HDMI/ })[0]);
    await userEvent.type(screen.getByLabelText(/Como aconteceu\?/), 'Cabo puxado');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir orçamento no WhatsApp' }));
    const url = decodeURIComponent(open.mock.calls[0][0] as string);
    expect(url).toContain('Console: PlayStation 5');
    expect(url).toContain('Como aconteceu: Cabo puxado');
    expect(screen.getByText(/Pedido de orçamento enviado/)).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });
});

describe('TradeIn', () => {
  it('completes 3 steps and shows summary with WhatsApp CTA', async () => {
    at('/troque-seu-game', <TradeIn />);
    const u = userEvent.setup();
    const plat = await screen.findByLabelText('Plataforma');
    await u.selectOptions(plat, 'PlayStation 4');
    await u.click(screen.getByLabelText(/Console/));
    const modelo = screen.getByLabelText('Modelo ou título');
    await u.selectOptions(modelo, within(modelo).getAllByRole('option')[1]); // option 0 is the "Selecione" placeholder
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Muito bom/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    await u.click(screen.getByLabelText(/Crédito na loja/));
    await u.click(screen.getByRole('button', { name: 'Continuar' }));
    const cta = screen.getByRole('link', { name: 'Enviar para o WhatsApp' });
    expect(decodeURIComponent(cta.getAttribute('href')!)).toContain('Quero: Crédito na loja');
    expect(screen.getByRole('table', { name: /Itens aceitos e não aceitos/ })).toBeInTheDocument();
  });
});

describe('GiftCards', () => {
  it('filters by platform and states Brazil region', async () => {
    at('/gift-cards?plataforma=steam', <GiftCards />);
    expect(await screen.findAllByRole('article')).toHaveLength(1);
    expect(screen.getAllByText('Válido para contas Brasil').length).toBeGreaterThan(0);
  });
});
```
(The text "A partir de" appears only on the 6 service cards. Every `Select` starts with an empty "Selecione" option.)

- [ ] **Step 2: Run to verify failure** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc -b` → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(pages): repair, trade-in wizard, gift cards and institutional pages"`

---

### Task 12: SEO build pipeline — sitemap, robots, prerender, redirects, acceptance checks

**Files:**
- Create: `frontend/public/robots.txt`, `frontend/scripts/gen-sitemap.mjs`, `frontend/scripts/prerender.mjs`, `frontend/scripts/check-acceptance.mjs`, `frontend/scripts/routes.mjs`, `deploy/nginx-redirects.conf`

Read `prompt-mvp-ecommerce.md` §8, §12 (#3, #12, #14, #21–#29, #34).

**Interfaces:**
- Consumes: `seed/*.json`; built `dist/`.
- Produces: `npm run build:full` pipeline; `routes.mjs` exporting `getRoutes(): string[]` (static pages + 4 platforms × (root + 4 subs) + `/produtos` + `/gift-cards` + one `/produto/{slug}` per product; slugs computed with the same algorithm as `slug.ts`/`productName.ts` — port the two functions to plain JS in `routes.mjs` and add an assertion at script start that `slugify('PlayStation 5 Slim 1TB com Leitor (Usado)') === 'playstation-5-slim-1tb-com-leitor-usado'`).

Requirements:
- `robots.txt`:
```
User-agent: *
Disallow: /carrinho
Disallow: /checkout
Disallow: /conta
Disallow: /admin
Allow: /

Sitemap: https://www.mateusgames.com.br/sitemap.xml
```
- `gen-sitemap.mjs` writes `public/sitemap.xml` with every route from `getRoutes()` except cart/checkout/conta, `<lastmod>` today, absolute URLs on `https://www.mateusgames.com.br`.
- `prerender.mjs`: start `npx serve dist -s -l 4180` (SPA fallback) as child process; launch Playwright Chromium; for each route: `goto`, wait for `networkidle` and for `document.querySelector('main h1')`, then write `page.content()` to `dist/<route>/index.html` (`/` → `dist/index.html`). Prerender with `VITE_DATA_SOURCE=mock` build. Fail (exit 1) if any route lacks `<link rel="canonical">`, `<title>`, or `meta[name=description]`, or if two routes share the same canonical or description. Print a summary line `prerendered N routes`.
- `deploy/nginx-redirects.conf`: 301 rules — http→https, non-www→www, `index.php?_route_=X` → `/X` mapping (`product/product&product_id=` → search fallback), and documented examples in comments.
- `check-acceptance.mjs` (exit 1 on any failure, prints a ✅/❌ line per check number from §12):
  - #12 no `Playstation` in `src/**`, `seed/**`, `dist/**/*.html`.
  - #34 no `clique aqui` (case-insensitive) in `src/**` and `dist`.
  - #4 no `R$R$` in `dist`.
  - #21/#25 no `....` in `src/**`, `dist` text, and `<title>` of `dist/index.html` equals `storeConfig.seoTitleHome` exactly.
  - #3 no `anos de mercado` and no `/há \d+ anos/` in `src`, `dist`.
  - #14 no `<iframe` and no `platform.twitter.com|connect.facebook.net|instagram.com/embed` in `dist`.
  - #23 no `uppercase` class in `src/**/*.tsx`; no text node ≥ 12 letters that is entirely uppercase in `dist` HTML (strip tags; ignore tokens like `PS5`, `1TB`, `BRL`, `CEP`, `WhatsApp`).
  - #22 `ProductCard.tsx` does not reference `descricaoTecnica`.
  - #2 no product `<h1>` in `dist/produto/**` contains "garantia" (case-insensitive).
  - #6 no `à vista em dinheiro` / `inicial parcelado` in `src`, `dist`.
  - #10 `MAIN_MENU` in `menu.ts` has ≤ 7 top-level entries (regex count of `label:` at top level, or import via a tiny TS→JS read).
  - #27 each `dist/**/index.html` has exactly one `<link rel="canonical"` and canonicals are unique.
  - #28 each product page has a `"@type":"Product"` JSON-LD that `JSON.parse`s; home has `"@type":"Store"`; repair page has `"@type":"FAQPage"`.
  - #29 robots disallows only the 4 paths; sitemap contains `/produto/`, `/assistencia-tecnica`.
  - #1 no `dist` HTML contains "Black Friday 2023"; the past pre-order product page does not contain "Será lançado".
  - #11 PS3/Xbox 360/Wii U/3DS product pages have breadcrumb "Retrô".

- [ ] **Step 1:** Write the files.
- [ ] **Step 2: Run the full pipeline**

Run: `cd frontend && npm run build:full`
Expected: `prerendered N routes` (N ≥ 50) and every acceptance line ✅, exit 0. Fix app code (not the checks) on any ❌.

- [ ] **Step 3: Commit** `git commit -m "feat(seo): sitemap, robots, prerender, redirects and acceptance checks"`

---

### Task 13: Verification, E2E with agent-browser, Lighthouse, README (controller-run)

**Files:**
- Create: `README.md`, `docs/lighthouse/home.report.html`, `docs/lighthouse/produto.report.html` (+ `.json`), `frontend/scripts/lighthouse.mjs`, `docs/e2e/*.png` (screenshots)

Read `prompt-mvp-ecommerce.md` §9, §12, §13.

- [ ] **Step 1: Full test suites**

Run: `cd frontend && npx vitest run` and `cd backend && pytest -q` → all PASS.

- [ ] **Step 2: E2E with agent-browser** against `npx serve dist -s -l 4180` (prerendered mock build). Use `npx -y agent-browser` commands (`open`, `snapshot -i`, `click @ref`, `fill @ref`, `set viewport 360 740`, `eval`, `screenshot`, `get url`). Verify and record:
  1. At 360px: `eval "document.documentElement.scrollWidth <= innerWidth"` true on `/`, `/produtos`, product page, `/checkout`; menu drawer opens and shows 7 items; sticky buy bar appears on product page after scrolling.
  2. Journey Comprar: home → "Comprar games" → product → Comprar → carrinho → checkout guest → Pix + retirada → "Pedido confirmado!".
  3. Journey Troca: 3 steps → summary → WhatsApp href contains choices.
  4. Journey Assistência: form → confirmation alert with wa.me link containing console and problem.
  5. Journey Gift card: filter Steam → pick R$ 100 → add → cart shows value.
  6. Search "play 5" autocomplete shows PS5 suggestions; `/busca?q=zzz` shows CTA with term.
  7. Empty cart shows suggestions.
  8. Floating WhatsApp on product page: href contains product name and URL.
  Save screenshots to `docs/e2e/`.
- [ ] **Step 3: API mode smoke** — `docker compose up -d --wait db`, `uvicorn app.main:app`, `VITE_DATA_SOURCE=api npm run dev`, agent-browser: listing loads, product opens, order completes (order row exists: `docker compose exec db psql -U mateus -d mateusgames -c "select numero,total from orders"`).
- [ ] **Step 4: Lighthouse** — `frontend/scripts/lighthouse.mjs` runs `lighthouse` (mobile form factor, default throttling) on `http://localhost:4180/` and one product URL, writes HTML+JSON to `docs/lighthouse/`, prints category scores, exits 1 if Performance < 90 or Accessibility < 95. Fix causes and re-run until green.
- [ ] **Step 5: README.md** — how to run (mock mode, API mode with Docker, tests, build:full, Lighthouse), design decisions, §12 table with ✅/⚠️ per row and the evidence (test name / check script line / E2E step), 301 map (copy of nginx rules + explanation), blog recommendation (archive posts, 301 the relevant ones to category/service pages, 410 for dead goo.gl-linked posts, revisit after MVP), next steps (real gateway, real shipping, admin panel, auth, image CDN, Postgres full-text search), Lighthouse scores table.
- [ ] **Step 6: Commit** `git commit -m "docs: README, Lighthouse reports and E2E evidence"`
