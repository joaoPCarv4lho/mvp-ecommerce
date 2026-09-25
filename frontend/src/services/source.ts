import type { Campaign, FaqItem, Order, OrderInput, Product, ProductFilters, ProductList, RepairService, Review, Suggestion, TradeInItem } from '../domain/types';
import { filtersToParams } from '../domain/catalog';
import { mockSource } from '../data/mockApi';

export interface DataSource {
  listProducts(f: ProductFilters): Promise<ProductList>;
  getProduct(slug: string): Promise<Product | null>;
  suggestProducts(q: string): Promise<Suggestion[]>;
  getServices(): Promise<RepairService[]>;
  getTradeIn(): Promise<TradeInItem[]>;
  getReviews(): Promise<Review[]>;
  getFaq(): Promise<Record<'assistencia' | 'troca' | 'giftcards', FaqItem[]>>;
  getActiveCampaigns(): Promise<Campaign[]>;
  createOrder(input: OrderInput): Promise<Order>;
  createTradeInProtocol(resumo: string): Promise<{ protocolo: string }>;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) throw Object.assign(new Error('Falha ao carregar dados'), { status: r.status });
  return r.json() as Promise<T>;
}

const apiSource: DataSource = {
  listProducts: (f) => http(`/products?${filtersToParams(f)}`),
  getProduct: (slug) => http<Product>(`/products/${encodeURIComponent(slug)}`).catch((e) => { if (e.status === 404) return null; throw e; }),
  suggestProducts: (q) => http(`/search/suggest?q=${encodeURIComponent(q)}`),
  getServices: () => http('/services'),
  getTradeIn: () => http('/trade-in'),
  getReviews: () => http('/reviews'),
  getFaq: () => http('/faq'),
  getActiveCampaigns: () => http('/campaigns'),
  createOrder: (input) => http('/orders', { method: 'POST', body: JSON.stringify(input) }),
  createTradeInProtocol: (resumo) => http('/trade-in/protocol', { method: 'POST', body: JSON.stringify({ resumo }) }),
};

export const source: DataSource = import.meta.env.VITE_DATA_SOURCE === 'api' ? apiSource : mockSource;
