import { describe, it, expect } from 'vitest';
import { loadSeed } from '../data/loadSeed';
import { validateProductInput, buildProductName } from './productName';
import { getWarrantyStatus } from './warranty';
import { isPreOrderActive, isCampaignActive } from './preorder';
import { getAvailability } from './availability';
import { filterProducts } from './catalog';

const today = new Date('2026-09-25T12:00:00Z');
const seed = loadSeed(today);
const byId = (id: string) => seed.products.find((p) => p.id === id)!;

describe('seed scenarios (§10)', () => {
  it('has ~30 products and all are valid', () => {
    expect(seed.products.length).toBeGreaterThanOrEqual(28);
    for (const p of seed.products) expect(validateProductInput(p), p.id).toEqual([]);
  });
  it('slugs unique, no --, no trailing -', () => {
    const slugs = seed.products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) { expect(s).not.toContain('--'); expect(s).not.toMatch(/-$/); }
  });
  it('no name contains "garantia" or "Playstation"', () => {
    for (const p of seed.products) { const n = buildProductName(p); expect(n).not.toMatch(/garantia/i); expect(n).not.toContain('Playstation'); }
  });
  it('past pre-order shows as normal, future is active', () => {
    expect(isPreOrderActive(byId('preorder-lancado'), today)).toBe(false);
    expect(isPreOrderActive(byId('preorder-futuro'), today)).toBe(true);
  });
  it('warranty scenarios', () => {
    expect(getWarrantyStatus(byId('ps5-slim-1tb-usado'), today).kind).toBe('vencendo');
    expect(['nenhuma', 'loja-padrao']).toContain(getWarrantyStatus(byId('xbox-series-s-usado-vencida'), today).kind);
  });
  it('expired campaign filtered out', () => {
    expect(seed.campaigns.filter((c) => isCampaignActive(c, today)).map((c) => c.id)).toEqual(['semana-retro']);
  });
  it('in-review product and notice product exist', () => {
    expect(getAvailability(byId('switch-oled-revisao')).kind).toBe('revisao');
    expect(byId('ps5-slim-1tb-usado').avisos).toContain('Não acompanha o jogo');
  });
  it('PS3/360/Wii U/3DS only in retro', () => {
    const old = seed.products.filter((p) => /PlayStation 3|Xbox 360|Wii U|3DS/.test(p.familia));
    expect(old.length).toBeGreaterThanOrEqual(4);
    for (const p of old) expect(p.plataforma).toBe('retro');
  });
  it('gift cards cover 6 platforms', () => {
    const gc = filterProducts(seed.products, { tipo: 'gift-card' }).map((p) => p.familia).sort();
    expect(gc).toEqual(['Google Play', 'Nintendo', 'PlayStation', 'Roblox', 'Steam', 'Xbox']);
  });
  it('content counts', () => {
    expect(seed.services).toHaveLength(6);
    expect(seed.reviews).toHaveLength(5);
    expect(seed.tradeIn.some((t) => !t.aceito)).toBe(true);
  });
});
