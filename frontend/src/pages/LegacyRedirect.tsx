import { Navigate, useLocation } from 'react-router-dom';
import { slugify } from '../domain/slug';

// Platform word in an old OpenCart route → new platform route (first match wins).
const PLATFORM: [RegExp, string][] = [
  [/^(playstation|ps[1-5]?)$/, '/playstation'],
  [/^xbox$/, '/xbox'],
  [/^(nintendo|switch|wii|3ds|snes)$/, '/nintendo'],
  [/^(retro|classicos?)$/, '/retro'],
];
// Words that appear in category routes. A route made only of these (plus platform words) is a category, not a product.
const CATEGORY_WORDS = /^(jogos?|games?|consoles?|acessorios|controles?|headsets?|usados?|seminovos?|novos?|lacrados?|categoria|series|one|360|super|x|s|u|e|de|[1-5])$/;

const platformOf = (t: string) => PLATFORM.find(([re]) => re.test(t))?.[1];

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
  const tokens = segments.flatMap((s) => s.split('-'));
  const isCategory = tokens.every((t) => platformOf(t) || CATEGORY_WORDS.test(t));
  // Product slugs are long and carry model words ("playstation-5-slim-1tb-usado").
  if (!isCategory && last.split('-').length >= 3) return `/produto/${last}`;
  for (const t of tokens) {
    const hit = platformOf(t);
    if (hit) return hit;
  }
  return '/';
}

export default function LegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={legacyTarget(search)} replace />;
}
