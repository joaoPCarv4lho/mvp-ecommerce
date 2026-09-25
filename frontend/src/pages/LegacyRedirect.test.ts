import { it, expect } from 'vitest';
import { legacyTarget } from './LegacyRedirect';

it('maps legacy index.php routes', () => {
  expect(legacyTarget('?_route_=playstation-5-slim-1tb-usado')).toBe('/produto/playstation-5-slim-1tb-usado');
  expect(legacyTarget('?_route_=consoles/Xbox Series S Usado')).toBe('/produto/xbox-series-s-usado');
  expect(legacyTarget('?_route_=playstation-4')).toBe('/playstation');
  expect(legacyTarget('?_route_=nintendo')).toBe('/nintendo');
  expect(legacyTarget('?_route_=product/product&product_id=42')).toBe('/produtos');
  expect(legacyTarget('?route=product/product&product_id=42')).toBe('/produtos');
  expect(legacyTarget('')).toBe('/');
});
