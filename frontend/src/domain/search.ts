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
