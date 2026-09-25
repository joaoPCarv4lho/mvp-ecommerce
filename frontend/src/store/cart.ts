import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../domain/types';
import { buildProductName } from '../domain/productName';

export interface CartItem {
  key: string; // productId, or productId:valorGiftCard for gift cards (each value is its own line)
  productId: string;
  slug: string;
  nome: string;
  imagem: string;
  precoAVista: number;
  precoParcelado: number;
  parcelasMax: number;
  quantidade: number;
  valorGiftCard?: number;
}

interface CartState {
  items: CartItem[];
  add: (p: Product, valorGiftCard?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const lineKey = (productId: string, valorGiftCard?: number) => (valorGiftCard == null ? productId : `${productId}:${valorGiftCard}`);

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (p, valorGiftCard) =>
        set((s) => {
          const key = lineKey(p.id, valorGiftCard);
          if (s.items.some((i) => i.key === key)) return { items: s.items.map((i) => (i.key === key ? { ...i, quantidade: i.quantidade + 1 } : i)) };
          const item: CartItem = {
            key, productId: p.id, slug: p.slug, nome: buildProductName(p), imagem: p.imagens[0]?.src ?? '',
            precoAVista: p.preco.precoAVista, precoParcelado: p.preco.precoParcelado, parcelasMax: p.preco.parcelasMax,
            quantidade: 1, valorGiftCard,
          };
          return { items: [...s.items, item] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: qty <= 0 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, quantidade: qty } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'mg-cart', storage: createJSONStorage(() => sessionStorage), partialize: (s) => ({ items: s.items }) },
  ),
);

export const cartCount = (s: { items: CartItem[] }) => s.items.reduce((n, i) => n + i.quantidade, 0);

const cents = (v: number) => Math.round(v * 100);

/** Sums in cents. Gift cards count at their chosen value on both methods; installments are capped by the most restrictive item. */
export function cartTotals(s: { items: CartItem[] }) {
  let pix = 0;
  let cartao = 0;
  let parcelas = s.items.length ? Infinity : 1;
  for (const i of s.items) {
    pix += cents(i.valorGiftCard ?? i.precoAVista) * i.quantidade;
    cartao += cents(i.valorGiftCard ?? i.precoParcelado) * i.quantidade;
    parcelas = Math.min(parcelas, i.parcelasMax);
  }
  // Card total is parcelas × valorParcela exactly (rounded to the cent), so the displayed numbers always agree.
  const valorC = Math.round(cartao / parcelas);
  return { pix: pix / 100, cartao: (valorC * parcelas) / 100, parcelas, valorParcela: valorC / 100 };
}
