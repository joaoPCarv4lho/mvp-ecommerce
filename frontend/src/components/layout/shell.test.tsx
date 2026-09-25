import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import { ProductCard } from '../product/ProductCard';
import { PriceBlock } from '../product/PriceBlock';
import { loadSeed } from '../../data/loadSeed';
import { formatPrice } from '../../domain/price';

const ps5 = loadSeed().products.find((p) => p.id === 'ps5-slim-1tb-usado')!;

it('shell renders skip link, cart count, footer and WhatsApp, with no primary button', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes><Route element={<Layout />}><Route index element={<h1>Página</h1>} /></Route></Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
  expect(screen.getByRole('link', { name: 'Carrinho, 0 itens' })).toBeInTheDocument();
  expect(screen.getByRole('search')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Falar no WhatsApp' }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
  expect(screen.getByText(/Desde 2012/)).toBeInTheDocument();
  expect(container.querySelector('.bg-action')).toBeNull();
});

it('product card is an article without the technical description', () => {
  const { container } = render(<MemoryRouter><ProductCard product={ps5} /></MemoryRouter>);
  expect(container.querySelector('article')).not.toBeNull();
  expect(container.textContent).not.toContain(ps5.descricaoTecnica);
  expect(screen.getByRole('link', { name: /Ver produto/ })).toHaveAttribute('href', `/produto/${ps5.slug}`);
});

it('price block labels each installment table', () => {
  render(<PriceBlock product={ps5} />);
  expect(screen.getByText(/no Pix ou dinheiro/)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Crediário da loja', hidden: true })).toBeInTheDocument();
  const captions = Array.from(document.querySelectorAll('caption')).map((c) => c.textContent);
  expect(captions).toEqual(['Cartão de crédito', 'Crediário da loja']);
});

it('price block: rounding footnote, and no "1x" line for single-installment items', () => {
  render(<PriceBlock product={ps5} />);
  expect(screen.getAllByText('Valores arredondados ao centavo.', { exact: true }).length).toBeGreaterThan(0);
  const gc = loadSeed().products.find((p) => p.tipo === 'gift-card')!;
  const { container } = render(<PriceBlock product={{ ...gc, preco: { precoAVista: 50, precoParcelado: 50, parcelasMax: 1 } }} compact />);
  expect(container.textContent).toContain(`ou ${formatPrice(50)} no cartão`);
  expect(container.textContent).not.toContain('1x de');
});
