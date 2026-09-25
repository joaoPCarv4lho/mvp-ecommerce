import { describe, it, expect } from 'vitest';
import { normalizeSearch, matchesQuery, suggest } from './search';
import type { Product } from './types';

const ps5 = { familia: 'PlayStation 5', modelo: 'Slim', condicao: 'usado', tipo: 'console', atributos: ['1TB'], relevancia: 50 } as Product;
const sw = { familia: 'Nintendo Switch', modelo: 'OLED', condicao: 'novo', tipo: 'console', atributos: [] as string[], relevancia: 10 } as Product;

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
