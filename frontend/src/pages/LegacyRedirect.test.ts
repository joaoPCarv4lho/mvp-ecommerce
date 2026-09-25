import { it, expect } from 'vitest';
import { legacyTarget } from './LegacyRedirect';

it('maps legacy product routes', () => {
  expect(legacyTarget('?_route_=playstation-5-slim-1tb-usado')).toBe('/produto/playstation-5-slim-1tb-usado');
  expect(legacyTarget('?_route_=consoles/Xbox Series S 512GB Usado')).toBe('/produto/xbox-series-s-512gb-usado');
  expect(legacyTarget('?_route_=product/product&product_id=42')).toBe('/produtos');
  expect(legacyTarget('?route=product/product&product_id=42')).toBe('/produtos');
});

it('maps category routes containing platform words to the platform', () => {
  expect(legacyTarget('?_route_=playstation-4')).toBe('/playstation');
  expect(legacyTarget('?_route_=nintendo')).toBe('/nintendo');
  expect(legacyTarget('?_route_=jogos-ps5')).toBe('/playstation');
  expect(legacyTarget('?_route_=consoles/xbox-series-x-s')).toBe('/xbox');
  expect(legacyTarget('?_route_=games/nintendo-switch/jogos-usados')).toBe('/nintendo');
  expect(legacyTarget('?_route_=consoles-retro')).toBe('/retro');
});

it('unmatched non-product routes go home', () => {
  expect(legacyTarget('')).toBe('/');
  expect(legacyTarget('?_route_=jogos')).toBe('/');
  expect(legacyTarget('?_route_=contato')).toBe('/');
  expect(legacyTarget('?_route_=acessorios/controles')).toBe('/');
});
