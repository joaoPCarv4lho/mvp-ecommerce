/* eslint-disable @typescript-eslint/no-explicit-any -- test body kept verbatim from the brief */
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
