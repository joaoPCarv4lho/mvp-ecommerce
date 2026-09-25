import { describe, it, expect } from 'vitest';
import { listProducts, getProduct, suggestProducts } from './products';
import { getActiveCampaigns } from './content';
import { createOrder } from './orders';
import type { OrderInput } from '../domain/types';

describe('mock services', () => {
  it('lists used products via condicao filter', async () => {
    const r = await listProducts({ condicao: 'usado' });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((p) => p.condicao === 'usado')).toBe(true);
  });
  it('"play 5" finds PS5', async () => {
    const r = await listProducts({ q: 'play 5' });
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((p) => p.familia === 'PlayStation 5')).toBe(true);
  });
  it('getProduct by slug / missing → null', async () => {
    const { items } = await listProducts({});
    expect((await getProduct(items[0].slug))?.id).toBe(items[0].id);
    expect(await getProduct('nao-existe')).toBeNull();
  });
  it('suggest needs 2 chars', async () => {
    expect(await suggestProducts('p')).toEqual([]);
    expect((await suggestProducts('ps')).length).toBeGreaterThan(0);
  });
  it('expired campaign not returned', async () => {
    expect((await getActiveCampaigns()).map((c) => c.id)).not.toContain('black-friday-2023');
  });
  it('mock createOrder validates like the backend', async () => {
    const ok: OrderInput = { itens: [{ productId: 'ps5-slim-1tb-usado', quantidade: 1 }], cliente: { nome: 'Ana', email: 'ana@x.com', telefone: '(47) 99999-0000' }, entrega: { tipo: 'retirada' }, pagamento: { metodo: 'pix' } };
    const o = await createOrder(ok);
    expect(o.numero).toMatch(/^MG-\d{8}-[0-9A-F]{4}$/);
    expect(o.total).toBe(2999);
    await expect(createOrder({ ...ok, itens: [] })).rejects.toThrow('vazio');
    await expect(createOrder({ ...ok, cliente: { ...ok.cliente, nome: 'A' } })).rejects.toThrow('nome');
    await expect(createOrder({ ...ok, cliente: { ...ok.cliente, email: 'ana' } })).rejects.toThrow('e-mail');
    await expect(createOrder({ ...ok, cliente: { ...ok.cliente, telefone: '9999' } })).rejects.toThrow('telefone');
    await expect(createOrder({ ...ok, itens: [{ productId: 'nope', quantidade: 1 }] })).rejects.toThrow('não existe');
  });
});
