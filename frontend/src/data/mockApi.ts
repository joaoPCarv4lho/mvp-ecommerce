import type { DataSource } from '../services/source';
import type { Product } from '../domain/types';
import { loadSeed } from './loadSeed';
import { filterProducts, sortProducts } from '../domain/catalog';
import { suggest } from '../domain/search';
import { buildProductName } from '../domain/productName';
import { isCampaignActive } from '../domain/preorder';

const seed = () => loadSeed(new Date());

/** Same format as the backend: PREFIX-YYYYMMDD-XXXX (4 uppercase hex chars). */
function code(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(2));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${hex}`;
}

const byId = (id: string): Product | undefined => seed().products.find((p) => p.id === id);

export const mockSource: DataSource = {
  async listProducts(f) {
    const items = sortProducts(filterProducts(seed().products, f), f.sort);
    return { items, total: items.length };
  },
  async getProduct(slug) {
    return seed().products.find((p) => p.slug === slug) ?? null;
  },
  async suggestProducts(q) {
    return suggest(seed().products, q).map((p) => ({ slug: p.slug, nome: buildProductName(p), preco: p.preco.precoAVista, imagem: p.imagens[0] }));
  },
  getServices: async () => seed().services,
  getTradeIn: async () => seed().tradeIn,
  getReviews: async () => seed().reviews,
  getFaq: async () => seed().faq,
  getActiveCampaigns: async () => seed().campaigns.filter((c) => isCampaignActive(c, new Date())),
  async createOrder(input) {
    // Same rules as backend/app/schemas.py (Cliente, OrderInput) and main.py (unknown product).
    const { nome, email, telefone } = input.cliente;
    if (!input.itens.length) throw new Error('O carrinho está vazio.');
    if (nome.trim().length < 2) throw new Error('Informe seu nome.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Informe um e-mail válido.');
    if (telefone.replace(/\D/g, '').length < 10) throw new Error('Informe um telefone com DDD.');
    const cartao = input.pagamento.metodo === 'cartao';
    let totalC = 0;
    for (const item of input.itens) {
      const p = byId(item.productId);
      if (!p) throw new Error(`Produto ${item.productId} não existe`);
      const unit = item.valorGiftCard ?? (cartao ? p.preco.precoParcelado : p.preco.precoAVista);
      totalC += Math.round(unit * 100) * item.quantidade;
    }
    if (input.entrega.tipo === 'entrega') totalC += Math.round(input.entrega.frete * 100);
    return { numero: code('MG'), total: totalC / 100, criadoEm: new Date().toISOString(), input };
  },
  createTradeInProtocol: async () => ({ protocolo: code('TR') }),
};
