import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('matches the spec example', () =>
    expect(slugify('PlayStation 5 Slim 1TB com Leitor (Usado)')).toBe('playstation-5-slim-1tb-com-leitor-usado'));
  it('strips accents', () => expect(slugify('Até Retrô & Clássicos')).toBe('ate-retro-classicos'));
  it('keeps numbers, handles | and —', () => expect(slugify('Xbox Series X|S 512GB — Usado')).toBe('xbox-series-x-s-512gb-usado'));
  it('never has -- nor trailing/leading -', () => {
    for (const s of ['--a--b--', ' !!PS5!! ', 'Controle -> DualSense', 'a — — b', '(Usado)']) {
      const out = slugify(s);
      expect(out).not.toContain('--');
      expect(out).not.toMatch(/^-|-$/);
    }
  });
});

describe('uniqueSlug', () => {
  it('adds numeric suffix on collision', () => {
    const taken = new Set(['ps5', 'ps5-2']);
    expect(uniqueSlug('ps5', taken)).toBe('ps5-3');
    expect(taken.has('ps5-3')).toBe(true);
  });
});
