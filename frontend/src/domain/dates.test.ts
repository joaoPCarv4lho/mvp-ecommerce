import { describe, it, expect } from 'vitest';
import { resolveDate, resolveSeedDates, formatDateBR, formatMonthYear, addDays } from './dates';

const today = new Date('2026-09-25T12:00:00Z');

describe('resolveDate', () => {
  it('resolves positive offsets', () => expect(resolveDate('+20d', today)).toBe('2026-10-15'));
  it('resolves negative offsets', () => expect(resolveDate('-400d', today)).toBe('2025-08-21'));
  it('keeps ISO values', () => expect(resolveDate('2018-03-01', today)).toBe('2018-03-01'));
});

describe('resolveSeedDates', () => {
  it('resolves nested date fields only', () => {
    const out = resolveSeedDates({ garantiaAte: '+1d', modelo: '+1d', usado: { revisadoEm: '-2d' } }, today);
    expect(out).toEqual({ garantiaAte: '2026-09-26', modelo: '+1d', usado: { revisadoEm: '2026-09-23' } });
  });
});

describe('formatters', () => {
  it('formats DD/MM/AAAA', () => expect(formatDateBR('2026-03-05')).toBe('05/03/2026'));
  it('formats MM/AAAA', () => expect(formatMonthYear('2026-03-05')).toBe('03/2026'));
  it('adds days', () => expect(addDays('2026-12-30', 3)).toBe('2027-01-02'));
});
