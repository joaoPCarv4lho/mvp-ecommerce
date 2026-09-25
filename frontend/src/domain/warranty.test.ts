import { describe, it, expect } from 'vitest';
import { getWarrantyStatus } from './warranty';
import type { Product } from './types';

const hoje = new Date('2026-09-25T12:00:00Z');
const base = { condicao: 'novo', garantiaTipo: 'fabrica' } as Product;

describe('getWarrantyStatus', () => {
  it('future date → ativa with MM/AAAA label', () =>
    expect(getWarrantyStatus({ ...base, garantiaAte: '2027-03-10' }, hoje)).toEqual({ kind: 'ativa', label: 'Garantia até 03/2027', ate: '2027-03-10' }));
  it('exactly 30 days → vencendo', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-10-25' }, hoje).kind).toBe('vencendo'));
  it('31 days → ativa', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-10-26' }, hoje).kind).toBe('ativa'));
  it('today is last day → vencendo', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-09-25' }, hoje).kind).toBe('vencendo'));
  it('yesterday → nenhuma for new item', () => expect(getWarrantyStatus({ ...base, garantiaAte: '2026-09-24' }, hoje)).toEqual({ kind: 'nenhuma' }));
  it('expired used store item → store default 90 days from purchase', () =>
    expect(getWarrantyStatus({ ...base, condicao: 'usado', garantiaTipo: 'loja', garantiaAte: '2025-01-01' }, hoje))
      .toEqual({ kind: 'loja-padrao', label: 'Garantia da loja de 90 dias', ate: '2026-12-24' }));
  it('garantiaMeses without date → ativa label in months', () =>
    expect(getWarrantyStatus({ ...base, garantiaAte: undefined, garantiaMeses: 12 }, hoje)).toEqual({ kind: 'ativa', label: 'Garantia de 12 meses', ate: '2027-09-25' }));
  it('no warranty data → nenhuma', () => expect(getWarrantyStatus({ ...base, garantiaTipo: undefined }, hoje)).toEqual({ kind: 'nenhuma' }));
});
