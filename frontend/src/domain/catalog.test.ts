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
  it('does not repeat a condition already in atributos', () => expect(keyAttributes(mk({ atributos: ['2TB', 'lacrado'], condicao: 'lacrado' }))).toBe('2TB · lacrado'));
});
