import { Navigate, useLocation } from 'react-router-dom';
import { slugify } from '../domain/slug';

// Old OpenCart category words → new platform route.
const CATEGORY: [RegExp, string][] = [
  [/^(playstation|ps[1-5]?)$/, '/playstation'],
  [/^xbox$/, '/xbox'],
  [/^(nintendo|switch|wii|3ds)$/, '/nintendo'],
  [/^(retro|classicos?)$/, '/retro'],
];

/** Maps `index.php?_route_=…` (legacy OpenCart) to the friendly URL. The server does the real 301 (deploy/nginx). */
export function legacyTarget(search: string): string {
  const params = new URLSearchParams(search);
  const route = params.get('_route_') ?? params.get('route') ?? '';
  const [path, query = ''] = route.split('&');
  // product/product&product_id=42: there is no slug to map to, so fall back to the catalog.
  if (path === 'product/product') return new URLSearchParams(query).get('product_id') || params.get('product_id') ? '/produtos' : '/';
  const segments = path.split('/').map(slugify).filter(Boolean);
  if (!segments.length) return '/';
  const last = segments[segments.length - 1];
  // A single short segment ("playstation-4", "xbox") is a category; anything longer is a product slug.
  const tokens = last.split('-');
  if (segments.length === 1 && tokens.length <= 2) {
    const hit = CATEGORY.find(([re]) => re.test(tokens[0]));
    if (hit) return hit[1];
  }
  return `/produto/${last}`;
}

export default function LegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={legacyTarget(search)} replace />;
}
