import type { Product, ProductFilters } from '../domain/types';
import { source } from './source';

export const listProducts = (f: ProductFilters) => source.listProducts(f);
export const getProduct = (slug: string) => source.getProduct(slug);
export const suggestProducts = (q: string) => source.suggestProducts(q);

/** Same platform, different product, by relevance. */
export async function getRelated(p: Product, n = 4): Promise<Product[]> {
  const { items } = await source.listProducts({ plataforma: p.plataforma, sort: 'relevancia' });
  return items.filter((x) => x.id !== p.id).slice(0, n);
}
