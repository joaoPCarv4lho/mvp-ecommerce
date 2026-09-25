import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
export const SITE_URL = 'https://www.mateusgames.com.br';

const readSeed = (name) => JSON.parse(readFileSync(join(ROOT, 'seed', `${name}.json`), 'utf8'));

// Ports of src/domain/slug.ts and src/domain/productName.ts. Kept in plain JS so the build
// scripts never need a TS toolchain; the assertion below guards them against drift.
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function uniqueSlug(base, taken) {
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

const CONDICAO = { novo: 'Novo', usado: 'Usado', lacrado: 'Lacrado' };
const BRAND_FIXES = [
  [/\bplaystation\b/gi, 'PlayStation'],
  [/\bxbox series x\s*\|?\s*s\b/gi, 'Xbox Series X|S'],
  [/\bnintendo switch\b/gi, 'Nintendo Switch'],
];

export function buildProductName(p) {
  const base = [p.familia, p.modelo, p.capacidade, p.edicao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  const name = BRAND_FIXES.reduce((acc, [re, v]) => acc.replace(re, v), base);
  return p.tipo === 'gift-card' ? name : `${name} — ${CONDICAO[p.condicao]}`;
}

const EXPECTED = 'playstation-5-slim-1tb-com-leitor-usado';
const actual = slugify('PlayStation 5 Slim 1TB com Leitor (Usado)');
if (actual !== EXPECTED) throw new Error(`slugify drifted from src/domain/slug.ts: got "${actual}", expected "${EXPECTED}"`);

export const PLATAFORMAS = ['playstation', 'xbox', 'nintendo', 'retro'];
export const SUBCATEGORIAS = ['consoles', 'jogos', 'controles-e-acessorios', 'headsets'];
export const STATIC_ROUTES = [
  '/',
  '/produtos',
  '/gift-cards',
  '/busca',
  '/assistencia-tecnica',
  '/troque-seu-game',
  '/sobre',
  '/contato',
  '/politicas/troca',
  '/politicas/garantia',
  '/politicas/privacidade',
];
/** Routes kept out of the sitemap and out of Google (robots.txt disallows the same paths). */
export const PRIVATE_ROUTES = ['/carrinho', '/checkout', '/conta'];

export function productSlugs() {
  const taken = new Set();
  return readSeed('products').map((p) => uniqueSlug(slugify(buildProductName(p)), taken));
}

/** Every route the SPA answers and that should be prerendered, in a stable order. */
export function getRoutes() {
  return [
    ...STATIC_ROUTES,
    ...PLATAFORMAS.flatMap((p) => [`/${p}`, ...SUBCATEGORIAS.map((s) => `/${p}/${s}`)]),
    ...productSlugs().map((slug) => `/produto/${slug}`),
    ...PRIVATE_ROUTES,
  ];
}

/** Sitemap routes: everything indexable (no cart, checkout or account). */
export const getIndexableRoutes = () => getRoutes().filter((r) => !PRIVATE_ROUTES.includes(r));
