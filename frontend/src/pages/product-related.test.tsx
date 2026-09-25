import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductPage from './ProductPage';
import { loadSeed } from '../data/loadSeed';
import { buildProductName } from '../domain/productName';

// jsdom has no IntersectionObserver at all (ProductPage relies on it to lazy-load related
// products). This stub fires "visible" synchronously so the section's fetch kicks off in tests.
beforeAll(() => {
  class ImmediateIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);
});

const seed = loadSeed();
const byId = (id: string) => seed.products.find((p) => p.id === id)!;

const open = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/produto/${byId(id).slug}`]}>
      <Routes>
        <Route path="/produto/:slug" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProductPage related products', () => {
  it('shows up to 4 same-platform related products, excluding the current one', async () => {
    const current = byId('ps5-slim-1tb-usado');
    open('ps5-slim-1tb-usado');

    const heading = await screen.findByRole('heading', { name: 'Produtos relacionados' });
    const section = heading.closest('section')!;
    const cards = await within(section).findAllByRole('article');

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(4);

    const currentName = buildProductName(current);
    const samePlatformNames = new Set(
      seed.products.filter((p) => p.plataforma === current.plataforma && p.id !== current.id).map((p) => buildProductName(p)),
    );

    cards.forEach((card) => {
      const cardName = within(card).getByRole('heading', { level: 3 }).textContent;
      expect(cardName).not.toBe(currentName);
      expect(samePlatformNames.has(cardName!)).toBe(true);
    });
  });
});
