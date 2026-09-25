import type { Campaign, FaqItem, Order, OrderInput, Product, ProductFilters, ProductList, RepairService, Review, Suggestion, TradeInItem } from '../domain/types';
import { filtersToParams } from '../domain/catalog';

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

export const MSG_OFFLINE = 'Não foi possível conectar. Verifique sua internet.';
export const MSG_LOAD = 'Falha ao carregar dados';
export const MSG_SUBMIT = 'Não foi possível concluir. Tente novamente.';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  } catch {
    throw new Error(MSG_OFFLINE);
  }
  if (!r.ok) {
    let message = MSG_LOAD;
    if (init?.method === 'POST') {
      const body = await r.json().catch(() => null);
      message = typeof body?.detail === 'string' ? body.detail : MSG_SUBMIT;
    }
    throw Object.assign(new Error(message), { status: r.status });
  }
  return r.json() as Promise<T>;
}

export const apiSource: DataSource = {
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

// The mock (and the seed JSON it bundles) is loaded on first use, so it stays out of the main chunk.
const loadMock = () => import('../data/mockApi').then((m) => m.mockSource);
const KEYS = Object.keys(apiSource) as (keyof DataSource)[];
const lazyMockSource = Object.fromEntries(
  KEYS.map((k) => [k, async (...args: unknown[]) => ((await loadMock())[k] as (...a: unknown[]) => unknown)(...args)]),
) as unknown as DataSource;

export const source: DataSource = import.meta.env.VITE_DATA_SOURCE === 'api' ? apiSource : lazyMockSource;

/** Resolves once the source can answer without another round trip (mock mode: its chunk is in). */
export const warmSource = (): Promise<unknown> => (source === apiSource ? Promise.resolve() : loadMock());
