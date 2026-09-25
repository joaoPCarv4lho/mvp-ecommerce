import { describe, it, expect } from 'vitest';
import { shippingQuote } from './shipping';

describe('shippingQuote', () => {
  it('Joinville region (89200-000..89239-999)', () => expect(shippingQuote('89201-000')).toEqual({ valor: 15, prazo: '1 dia útil' }));
  it('rest of SC (88000-000..89999-999)', () => expect(shippingQuote('88010000')).toEqual({ valor: 25, prazo: '2 a 3 dias úteis' }));
  it('rest of Brazil', () => expect(shippingQuote('01310-100')).toEqual({ valor: 45, prazo: '5 a 8 dias úteis' }));
  it('invalid CEP', () => expect(shippingQuote('123')).toBeNull());
});
