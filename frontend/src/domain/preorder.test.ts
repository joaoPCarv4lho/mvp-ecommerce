import { describe, it, expect } from 'vitest';
import { isPreOrderActive, isCampaignActive } from './preorder';
import type { Campaign, Product } from './types';

const hoje = new Date('2026-09-25T12:00:00Z');
const c = (inicio: string, fim: string) => ({ id: 'x', titulo: '', texto: '', href: '/', inicio, fim }) as Campaign;

describe('isPreOrderActive', () => {
  it('future release → active', () => expect(isPreOrderActive({ dataLancamento: '2026-11-01' } as Product, hoje)).toBe(true));
  it('release today → no longer pre-order', () => expect(isPreOrderActive({ dataLancamento: '2026-09-25' } as Product, hoje)).toBe(false));
  it('past release (2018) → normal product', () => expect(isPreOrderActive({ dataLancamento: '2018-03-01' } as Product, hoje)).toBe(false));
  it('no date → false', () => expect(isPreOrderActive({} as Product, hoje)).toBe(false));
});

describe('isCampaignActive', () => {
  it('inside period', () => expect(isCampaignActive(c('2026-09-20', '2026-10-01'), hoje)).toBe(true));
  it('first and last day inclusive', () => {
    expect(isCampaignActive(c('2026-09-25', '2026-09-30'), hoje)).toBe(true);
    expect(isCampaignActive(c('2026-09-01', '2026-09-25'), hoje)).toBe(true);
  });
  it('ended', () => expect(isCampaignActive(c('2023-11-20', '2023-11-30'), hoje)).toBe(false));
  it('not started', () => expect(isCampaignActive(c('2026-09-26', '2026-10-30'), hoje)).toBe(false));
});
