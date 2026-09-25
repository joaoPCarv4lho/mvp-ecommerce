// @vitest-environment node
import { it, expect } from 'vitest';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const tok = (n: string) => css.match(new RegExp(`--color-${n}:\\s*(#[0-9a-f]{6})`, 'i'))![1];
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const pairs: [string, string][] = [
  ['text', 'bg'], ['text', 'surface'], ['text-muted', 'surface'], ['text-muted', 'bg'],
  ['brand', 'surface'], ['brand', 'brand-soft'], ['success', 'success-bg'], ['warning', 'warning-bg'], ['error', 'error-bg'], ['info', 'info-bg'],
];
it.each(pairs)('%s on %s ≥ 4.5:1', (fg, bg) => expect(ratio(tok(fg), tok(bg))).toBeGreaterThanOrEqual(4.5));
it('white on action and brand ≥ 4.5:1', () => {
  expect(ratio('#ffffff', tok('action'))).toBeGreaterThanOrEqual(4.5);
  expect(ratio('#ffffff', tok('brand'))).toBeGreaterThanOrEqual(4.5);
});
