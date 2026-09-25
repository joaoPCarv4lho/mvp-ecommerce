import { describe, it, expect } from 'vitest';
import { buildProductName, validateProductInput } from './productName';

describe('buildProductName', () => {
  it('builds {Plataforma} {Modelo} {Capacidade} {Edição} — {Condição}', () =>
    expect(buildProductName({ familia: 'PlayStation 5', modelo: 'Slim', capacidade: '1TB', edicao: 'Edição Digital', condicao: 'usado', tipo: 'console' }))
      .toBe('PlayStation 5 Slim 1TB Edição Digital — Usado'));
  it('omits missing parts without double spaces', () =>
    expect(buildProductName({ familia: 'Nintendo Switch', modelo: 'OLED', condicao: 'novo', tipo: 'console' })).toBe('Nintendo Switch OLED — Novo'));
  it('gift cards: no condition suffix', () =>
    expect(buildProductName({ familia: 'Steam', modelo: 'Gift Card', condicao: 'novo', tipo: 'gift-card' })).toBe('Steam Gift Card'));
  it('normalizes brand spelling', () =>
    expect(buildProductName({ familia: 'Playstation 4', modelo: 'Pro', condicao: 'usado', tipo: 'console' })).toBe('PlayStation 4 Pro — Usado'));
});

const validUsed = {
  familia: 'PlayStation 5', modelo: 'Slim', capacidade: '1TB', condicao: 'usado' as const, tipo: 'console' as const,
  preco: { precoAVista: 2999, precoParcelado: 3199.92, parcelasMax: 12 },
  usado: { estado: 'excelente' as const, acompanha: { console: true, controles: 1, cabos: true, caixa: false, jogo: false }, revisadoEm: '2026-09-20', fotosReais: [] },
};

describe('validateProductInput', () => {
  it('accepts a valid used product', () => expect(validateProductInput(validUsed)).toEqual([]));
  it('rejects glued text like 1TBControle', () =>
    expect(validateProductInput({ ...validUsed, modelo: 'Slim 1TBControle' }).join()).toMatch(/sem espaço/));
  it('rejects arrows', () => expect(validateProductInput({ ...validUsed, modelo: 'Slim -> Leitor' }).join()).toMatch(/seta/));
  it('rejects warranty in the name', () => expect(validateProductInput({ ...validUsed, modelo: 'Slim Garantia 2025' }).join()).toMatch(/garantia/i));
  it('rejects used without estado/acompanha', () => {
    expect(validateProductInput({ ...validUsed, usado: undefined }).join()).toMatch(/estado/);
    expect(validateProductInput({ ...validUsed, usado: { ...validUsed.usado, acompanha: undefined as never } }).join()).toMatch(/acompanha/);
  });
  it('rejects installment total not divisible by parcelas', () =>
    expect(validateProductInput({ ...validUsed, preco: { precoAVista: 2999, precoParcelado: 3199.9, parcelasMax: 12 } }).join()).toMatch(/parcel/));
});
