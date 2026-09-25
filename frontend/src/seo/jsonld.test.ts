/* eslint-disable @typescript-eslint/no-explicit-any -- test body kept verbatim from the brief */
import { it, expect } from 'vitest';
import { productJsonLd, storeJsonLd, faqJsonLd, breadcrumbJsonLd, manufacturer } from './jsonld';
import { loadSeed } from '../data/loadSeed';

const hoje = new Date('2026-09-25');
const seed = loadSeed(hoje).products;
const p = seed.find((x) => x.id === 'ps5-slim-1tb-usado')!;
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
  expect(j.aggregateRating).toBeUndefined();
});
it('product has description, manufacturer brand and priceValidUntil', () => {
  const j = productJsonLd(p, 'u', hoje) as any;
  expect(j.description).toBe(p.descricaoTecnica);
  expect(j.brand).toEqual({ '@type': 'Brand', name: 'Sony' });
  expect(j.offers.priceValidUntil).toBe('2026-10-25');
  expect(j.offers.availabilityStarts).toBeUndefined();
  const steam = seed.find((x) => x.familia === 'Steam')!;
  expect((productJsonLd(steam, 'u', hoje) as any).brand).toBeUndefined();
});
it('pre-order offer starts at launch date', () => {
  const pre = seed.find((x) => x.id === 'preorder-futuro')!;
  const j = productJsonLd(pre, 'u', hoje) as any;
  expect(j.offers.availability).toBe('https://schema.org/PreOrder');
  expect(j.offers.availabilityStarts).toBe('2026-11-09');
});
it('maps families to manufacturers', () => {
  expect(['PlayStation 2', 'Xbox 360', 'Nintendo Switch', 'Wii U', 'Nintendo 3DS', 'Super Nintendo', 'Roblox'].map(manufacturer))
    .toEqual(['Sony', 'Microsoft', 'Nintendo', 'Nintendo', 'Nintendo', 'Nintendo', undefined]);
});
it('faq and breadcrumb shapes', () => {
  expect((faqJsonLd([{ pergunta: 'a', resposta: 'b' }]) as any).mainEntity[0]['@type']).toBe('Question');
  expect((breadcrumbJsonLd([{ label: 'Início', to: '/' }, { label: 'Xbox', to: '/xbox' }]) as any).itemListElement[1].position).toBe(2);
});
