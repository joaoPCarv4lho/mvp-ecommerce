import { getProduct } from './products';
import { primeAsync } from '../hooks/useAsync';

export const productHandoffKey = (slug: string) => `product:${slug}`;

/**
 * Data the first paint of a prerendered route needs. Only the product page qualifies today: the
 * listings already render a grid of skeleton cards the same size as the real ones, so they swap
 * without moving anything.
 */
export async function prefetchRoute(pathname: string): Promise<void> {
  const match = /^\/produto\/([^/?#]+)/.exec(pathname);
  if (!match) return;
  const slug = decodeURIComponent(match[1]);
  primeAsync(productHandoffKey(slug), await getProduct(slug));
}
