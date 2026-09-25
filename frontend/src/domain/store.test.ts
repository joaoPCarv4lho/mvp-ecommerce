import { it, expect } from 'vitest';
import { yearsSince } from './store';
it('computes years from founding year', () => {
  expect(yearsSince(2012, new Date('2026-09-25'))).toBe(14);
  expect(yearsSince(2012, new Date('2027-01-01'))).toBe(15);
});
