import { describe, it, expect, beforeEach } from 'vitest';
import { useCart, cartCount, cartTotals } from './cart';
import type { Product } from '../domain/types';

const p = { id: 'a', slug: 'a', familia: 'PlayStation 5', modelo: 'Slim', condicao: 'usado', tipo: 'console', imagens: [{ src: '/images/console-ps-400.webp', alt: 'x' }], preco: { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 } } as Product;
const gc = { id: 'g', slug: 'g', familia: 'Steam', modelo: 'Gift Card', condicao: 'novo', tipo: 'gift-card', imagens: [{ src: '/images/giftcard-steam-400.webp', alt: 'x' }], preco: { precoAVista: 50, precoParcelado: 50, parcelasMax: 1 } } as Product;

beforeEach(() => useCart.getState().clear());

describe('cart', () => {
  it('adds and increments', () => {
    useCart.getState().add(p); useCart.getState().add(p);
    expect(cartCount(useCart.getState())).toBe(2);
  });
  it('totals pix vs card', () => {
    useCart.getState().add(p);
    expect(cartTotals(useCart.getState())).toEqual({ pix: 2999, cartao: 3199.92, parcelas: 12, valorParcela: 266.66 });
  });
  it('gift card uses chosen value and limits installments', () => {
    useCart.getState().add(p); useCart.getState().add(gc, 200);
    const t = cartTotals(useCart.getState());
    expect(t.pix).toBe(3199); expect(t.cartao).toBe(3399.92); expect(t.parcelas).toBe(1);
  });
  it('setQty 0 removes', () => {
    useCart.getState().add(p); useCart.getState().setQty('a', 0);
    expect(useCart.getState().items).toEqual([]);
  });
  it('mixed cart: parcelas × valorParcela equals the card total', () => {
    const q = { ...p, id: 'b', slug: 'b', preco: { precoAVista: 449, precoParcelado: 480.5, parcelasMax: 10 } } as Product;
    useCart.getState().add(p); useCart.getState().add(q);
    const t = cartTotals(useCart.getState());
    expect(t.parcelas).toBe(10);
    expect(Math.round(t.valorParcela * 100) * t.parcelas).toBe(Math.round(t.cartao * 100));
  });
});
