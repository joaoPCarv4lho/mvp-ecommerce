import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductPage from './ProductPage';
import { loadSeed } from '../data/loadSeed';
import { buildProductName } from '../domain/productName';

const seed = loadSeed();
const byId = (id: string) => seed.products.find((p) => p.id === id)!;
const open = (id: string) =>
  render(<MemoryRouter initialEntries={[`/produto/${byId(id).slug}`]}><Routes><Route path="/produto/:slug" element={<ProductPage />} /></Routes></MemoryRouter>);

describe('ProductPage', () => {
  it('used product shows mandatory used block, notice alert and expiring warranty', async () => {
    open('ps5-slim-1tb-usado');
    expect(await screen.findByRole('heading', { level: 1, name: buildProductName(byId('ps5-slim-1tb-usado')) })).toBeInTheDocument();
    expect(screen.getByText('Sobre esta unidade usada')).toBeInTheDocument();
    expect(screen.getByText(/Revisado pela assistência Joinville Games em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Não acompanha o jogo');
    expect(screen.getAllByText(/vence em \d+ dia/).length).toBeGreaterThan(0);
    expect(screen.getByText(/no Pix ou dinheiro/)).toBeInTheDocument();
  });
  it('installments modal has one labelled table per payment method', async () => {
    open('ps5-slim-1tb-usado');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver todas as parcelas' }));
    expect(screen.getByRole('tab', { name: 'Cartão de crédito' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Crediário da loja' })).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getByRole('table', { name: 'Cartão de crédito' })).toBeInTheDocument();
  });
  it('expired warranty shows no "Garantia até" badge', async () => {
    open('xbox-series-s-usado-vencida');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Garantia até/)).toBeNull();
  });
  it('past pre-order renders as normal product', async () => {
    open('preorder-lancado');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Será lançado em/)).toBeNull();
    expect(screen.queryByText('Pré-venda')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Comprar' }).length).toBeGreaterThan(0);
  });
  it('future pre-order shows release date', async () => {
    open('preorder-futuro');
    expect(await screen.findByText(/Será lançado em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });
  it('in-review product explains the deadline', async () => {
    open('switch-oled-revisao');
    expect(await screen.findByText('Disponível em 2 a 3 dias úteis (em revisão técnica)')).toBeInTheDocument();
  });
  it('WhatsApp link contains product name and URL', async () => {
    open('ps5-slim-1tb-usado');
    const link = await screen.findByRole('link', { name: 'Tirar dúvida no WhatsApp' });
    const text = decodeURIComponent(link.getAttribute('href')!.split('text=')[1]);
    expect(text).toContain(buildProductName(byId('ps5-slim-1tb-usado')));
    expect(text).toContain('https://www.mateusgames.com.br/produto/');
  });
  it('description accordion collapsed by default', async () => {
    open('ps5-pro-novo');
    expect((await screen.findByText('Descrição técnica')).closest('details')).not.toHaveAttribute('open');
  });
});
