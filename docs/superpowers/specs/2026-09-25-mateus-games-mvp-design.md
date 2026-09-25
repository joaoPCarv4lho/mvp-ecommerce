# Mateus Games MVP — Design

Source requirements: `prompt-mvp-ecommerce.md` (sections 1–14, traceability table in §12).
This document records the decisions that the prompt leaves open. The prompt remains the source of truth for everything it specifies.

## Decisions (confirmed with user 2026-09-25)

| Topic | Decision |
|---|---|
| Backend | FastAPI + Pydantic v2 + SQLAlchemy 2.0 async + PostgreSQL 16 (Docker Compose). Frontend also runs 100% on mock data (`VITE_DATA_SOURCE=mock`). |
| Store data | Plausible placeholders in one `storeConfig` file. |
| SEO rendering | Client head manager + post-build prerender (Playwright snapshots static HTML per route). |
| Delivery | Local git repo, commits per phase, no deploy. |
| Frontend E2E validation | `agent-browser` (vercel-labs) CLI, driven against `vite preview`. |

## Repository layout

```
mvp-ecommerce/
  seed/                     # single source of seed data (JSON), used by frontend mock AND backend seeder
    products.json  services.json  trade-in.json  reviews.json  campaigns.json
  frontend/                 # Vite + React 18 + TS + Tailwind + React Router + Zustand
    src/
      components/{ui,product,layout,forms}/
      pages/
      services/             # products.ts categories.ts orders.ts content.ts + source.ts (api|mock switch)
      domain/               # pure rules + *.test.ts (Vitest)
      data/                 # mock adapter that loads ../../seed/*.json and resolves relative dates
      hooks/                # useSeo, useWhatsAppContext, ...
      config/storeConfig.ts
      styles/tokens.css
    scripts/                # gen-images.mjs, gen-sitemap.mjs, prerender.mjs, check-acceptance.mjs, lighthouse.mjs
    public/                 # robots.txt, generated sitemap.xml, images/*.webp
  backend/
    app/{main.py, db.py, models.py, schemas.py, repository.py, search.py, validation.py, seed.py, routers/}
    tests/                  # pytest (runs on SQLite via aiosqlite for speed; Postgres used at runtime)
  docker-compose.yml        # postgres:16
  docs/lighthouse/          # home + product mobile reports (HTML + JSON)
  README.md
```

## Seed and relative dates

Seed JSON stores dates either as ISO strings or as relative offsets `"+20d"`, `"-400d"`. `resolveDate(value, today)` exists in both `frontend/src/domain/dates.ts` and `backend/app/seed.py`. This keeps the mandatory scenarios (warranty expiring in <30 days, expired warranty, past pre-order, future pre-order, expired banner) true on any run date.

Required scenarios in seed (§10): past pre-order (shows as normal), future pre-order, used with expired warranty (no badge), used with warranty expiring <30d (alert badge), expired banner (not rendered), product with "Não acompanha o jogo" notice, product "em revisão técnica". ~30 products across PlayStation, Xbox, Nintendo, retro (PS3, Xbox 360, Wii U, 3DS, PS2, SNES), new/used/sealed, gift cards (PlayStation, Xbox, Nintendo, Steam, Google Play, Roblox). 6 repair services, trade-in accepted/rejected table, 5 reviews.

## Data model (shared shape; TS types in `frontend/src/domain/types.ts`, Pydantic in `backend/app/schemas.py`)

```ts
type Plataforma = 'playstation' | 'xbox' | 'nintendo' | 'retro' | 'multi';
type Tipo = 'console' | 'jogo' | 'acessorio' | 'headset' | 'gift-card';
type Condicao = 'novo' | 'usado' | 'lacrado';
type Product = {
  id: string; slug: string;
  plataforma: Plataforma; familia: string;       // familia: "PlayStation 5", "Xbox Series X|S", "Nintendo Switch", "PlayStation 3"...
  tipo: Tipo; modelo: string; capacidade?: string; edicao?: string; condicao: Condicao;
  atributos: string[];                             // key attributes line: ["1TB","Com leitor"]
  preco: { precoAVista: number; precoParcelado: number; parcelasMax: number; jurosMensal?: number };
  crediario?: { total: number; parcelasMax: number };  // optional second payment method → separate labeled tab
  estoque: number; emRevisao?: boolean; retiradaImediata: boolean;
  garantiaTipo?: 'loja' | 'fabrica'; garantiaAte?: string; garantiaMeses?: number;
  dataLancamento?: string;                         // pre-order
  usado?: { estado: 'excelente'|'muito-bom'|'bom'; acompanha: {console:boolean;controles:number;cabos:boolean;caixa:boolean;jogo:boolean}; revisadoEm: string; fotosReais: string[] };
  avisos: string[];                                // "Não acompanha o jogo"
  descricaoTecnica: string;
  imagens: { src: string; alt: string }[];
  giftCard?: { valores: number[]; regiao: 'Brasil' };
  criadoEm: string; relevancia: number;
};
```

Display name is always `buildProductName(product)`; no stored `titulo` field, so warranty can never leak into a title (§12 #2).

## Domain rules (`frontend/src/domain/`, each with Vitest tests)

`formatPrice`, `priceSummary` (savings %, installment value, consistency `parcelas × valor == total` with cent rounding adjusted on the last installment), `getWarrantyStatus(product, today)` → `{kind:'ativa'|'vencendo'|'nenhuma', label, until}` with store fallback (90 days from purchase) for expired used items, `isPreOrderActive`, `isCampaignActive`, `slugify` + `uniqueSlug`, `buildProductName` + `validateProductInput` (rejects glued text like `1TBControle`, `->`, used without `estado`/`acompanha`), `getAvailability` (3 fixed messages, always with reason), `normalizeSearch` + synonyms (`ps5`, `play 5`, `playstation 5` → same token; accents/case ignored), `filterProducts` + `sortProducts`, `shippingQuote(cep)` mock by CEP range, `whatsappLink(text)`, `yearsSince(foundedYear, today)`.

Backend mirrors only what it enforces or queries: `validation.py` (7.5 + used-product rule, pytest), `search.py` (normalization + synonyms, pytest), filtering in `repository.py`.

## API (FastAPI, prefix `/api`)

- `GET /products?plataforma&tipo&condicao&precoMin&precoMax&disponibilidade&q&sort&limit` → `{items, total}`
- `GET /products/{slug}` → product (404 if missing)
- `GET /search/suggest?q=` (≥2 chars) → up to 6 `{slug, nome, preco, imagem}`
- `GET /services`, `GET /trade-in`, `GET /reviews`, `GET /campaigns` (active only, filtered by `inicio/fim`)
- `POST /orders` → `{numero, ...}`; `POST /trade-in/protocol` → `{protocolo}`
- `POST /products` (optional simple admin create) validated by `validation.py` → 422 on invalid input

Frontend `services/*` expose the same functions for both sources; components never import `data/` directly. Vite dev proxies `/api` to `localhost:8000`. If `VITE_DATA_SOURCE` is `api` and a request fails, services do not silently fall back (fail visibly in dev).

## Routes (React Router, lazy-loaded per route)

`/` · `/produtos` (general listing; query filters) · `/playstation` `/xbox` `/nintendo` `/retro` (platform listing; `/:plataforma/:tipo` for subcategory: `consoles`, `jogos`, `controles-e-acessorios`, `headsets`) · `/usados` → redirects to `/produtos?condicao=usado` · `/gift-cards` · `/produto/:slug` (canonical product URL) · `/busca?q=` · `/carrinho` · `/checkout` (steps in state) · `/assistencia-tecnica` · `/troque-seu-game` · `/sobre` · `/contato` · `/politicas/:tipo` (troca, garantia, privacidade) · `/index.php` → reads `_route_` and redirects client-side (301 documented for server) · `*` → 404 with suggestions.

## Design system

- Font: "Space Grotesk" self-hosted via `@fontsource` (400, 700). No third-party font request.
- Tokens in `src/styles/tokens.css` (`:root`), mapped in `tailwind.config`: brand `#3B1F8E` (deep purple), action `#E4572E`-class orange darkened to pass 4.5:1 with white text, states success/warning/error/info, neutrals. All text pairs checked ≥4.5:1 (a test computes contrast of the token pairs).
- Type scale 12/14/16/20/24/32; spacing 4/8/16/24/32/48; one radius + one shadow scale.
- Retro: inline SVG pixel-art icons (controller, heart, coin, wrench, cartridge) used in badges and empty states. Product images generated at build from neutral SVG illustrations to WebP (400/800 widths) with `srcset`, fixed width/height.
- Components: Button (primary/secondary/ghost), Badge, ProductCard, PriceBlock, Accordion (native `<details>`), Modal/Drawer (native `<dialog>`), Toast, Input, Select, RadioCard, Stepper, Breadcrumb, EmptyState, Skeleton, Alert.
- One primary button per screen; touch targets ≥44px.

## SEO

`useSeo({title, description, canonical, image, jsonLd})` writes head tags. Canonical origin `https://www.mateusgames.com.br`. JSON-LD: `Store` (home, contato, sobre), `Product`+`Offer` (product), `BreadcrumbList` (listings, product), `FAQPage` (assistência). `scripts/gen-sitemap.mjs` writes `public/sitemap.xml` from seed. `robots.txt` disallows `/carrinho`, `/checkout`, `/conta`, `/admin` only. `scripts/prerender.mjs` serves `dist/`, visits every sitemap route with Playwright Chromium, writes `dist/<route>/index.html` with the fully rendered head and body. 301 map documented in README and shipped as `deploy/nginx-redirects.conf`.

## Cart and checkout

Zustand store persisted to `sessionStorage`. Cart shows Pix vs card totals; `aria-live` announces changes. Checkout stepper Carrinho → Identificação → Entrega → Pagamento → Confirmação; guest only; "Retirar na loja — grátis" preselected; Pix preselected with discount; card with installments; confirmation shows order number, summary, next steps, and an optional "Criar conta" offer.

## Testing and verification

1. Vitest: every domain rule (dates past/future/boundary, `R$R$`, `--`, `1TBControle`, synonyms, installment sums) + token contrast.
2. pytest: API endpoints, filters, search synonyms, validation 422, campaigns filtering (SQLite).
3. `scripts/check-acceptance.mjs`: scans `dist/` HTML and `src/` for forbidden strings (`Playstation`, `clique aqui`, `R$R$`, `....`, `anos de mercado`, `iframe`, social embed scripts, all-caps text blocks, descriptions on listing).
4. agent-browser E2E against `vite preview` at 360px and desktop: 4 journeys (buy with Pix + pickup, trade-in wizard, repair quote → wa.me link, gift card), search "play 5", empty-result CTA, empty cart suggestions, menu ≤7 items, no horizontal scroll at 360px.
5. Lighthouse mobile for home and one product page saved in `docs/lighthouse/`. Targets: Performance ≥90, Accessibility ≥95.
6. Backend smoke against real Postgres in Docker, with frontend in `api` mode.

## Out of scope

Real payment gateway, real shipping, full admin, blog (README documents archive + redirect plan), real WhatsApp API.
