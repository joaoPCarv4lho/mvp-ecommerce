import { describe, it, expect } from 'vitest';
import { listProducts, getProduct, suggestProducts } from './products';
import { getActiveCampaigns } from './content';

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
});
