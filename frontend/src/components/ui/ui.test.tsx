import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, Alert, Breadcrumb, Button, Input, Stepper, Tabs } from '.';
import { MemoryRouter } from 'react-router-dom';

describe('ui', () => {
  it('Button primary uses action color and 44px min height', () => {
    render(<Button variant="primary">Comprar</Button>);
    const b = screen.getByRole('button', { name: 'Comprar' });
    expect(b.className).toMatch(/bg-action/);
    expect(b.className).toMatch(/min-h-11/);
  });
  it('Input links error via aria-describedby', () => {
    render(<Input id="cep" label="CEP" error="CEP inválido" />);
    const input = screen.getByLabelText('CEP');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('cep-error');
    expect(screen.getByText('CEP inválido')).toHaveAttribute('id', 'cep-error');
  });
  it('Alert is sentence case with role note', () => {
    render(<Alert tone="warning">Não acompanha o jogo</Alert>);
    expect(screen.getByRole('note')).toHaveTextContent('Não acompanha o jogo');
  });
  it('Accordion collapsed by default', () => {
    render(<Accordion items={[{ id: 'd', title: 'Descrição técnica', content: 'x' }]} />);
    expect(screen.getByText('Descrição técnica').closest('details')).not.toHaveAttribute('open');
  });
  it('Stepper marks current step', () => {
    render(<Stepper steps={['Carrinho', 'Identificação']} current={1} />);
    expect(screen.getByText('Identificação').closest('li')).toHaveAttribute('aria-current', 'step');
  });
  it('Breadcrumb renders nav landmark', () => {
    render(<MemoryRouter><Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Xbox' }]} /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toBeInTheDocument();
  });
  it('Tabs switch with arrow keys', async () => {
    render(<Tabs tabs={[{ id: 'a', label: 'Cartão', content: 'A' }, { id: 'b', label: 'Crediário', content: 'B' }]} />);
    screen.getByRole('tab', { name: 'Cartão' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Crediário' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('B');
  });
});
