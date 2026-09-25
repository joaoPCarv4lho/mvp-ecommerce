import { it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useSeo } from './useSeo';

function Page({ title }: { title: string }) { useSeo({ title, description: 'desc', path: '/xbox', jsonLd: { '@type': 'X' } }); return null; }

it('sets title, single canonical and jsonld', () => {
  const { rerender } = render(<Page title="A" />);
  rerender(<Page title="B" />);
  expect(document.title).toBe('B');
  expect(document.querySelectorAll('link[rel=canonical]')).toHaveLength(1);
  expect(document.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('https://www.mateusgames.com.br/xbox');
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  expect(document.querySelector('meta[property="og:image"]')).not.toBeNull();
});
