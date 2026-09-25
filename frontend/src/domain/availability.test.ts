import { describe, it, expect } from 'vitest';
import { getAvailability } from './availability';
import type { Product } from './types';

describe('getAvailability', () => {
  it('in stock', () => expect(getAvailability({ estoque: 3 } as Product).label).toBe('Em estoque — retire hoje'));
  it('in review always explains why', () => {
    const a = getAvailability({ estoque: 1, emRevisao: true } as Product);
    expect(a.label).toBe('Disponível em 2 a 3 dias úteis (em revisão técnica)');
    expect(a.motivo).not.toBe('');
  });
  it('sold out', () => expect(getAvailability({ estoque: 0 } as Product).label).toBe('Esgotado — avise-me'));
  it('every label that mentions a deadline also has a reason in parentheses', () => {
    for (const p of [{ estoque: 1, emRevisao: true }, { estoque: 2 }, { estoque: 0 }] as Product[]) {
      const { label } = getAvailability(p);
      if (/dias/.test(label)) expect(label).toMatch(/\(.+\)/);
    }
  });
});
