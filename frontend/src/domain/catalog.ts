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
