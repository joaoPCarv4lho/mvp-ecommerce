import type { CartItem } from '../../store/cart';
import { cartTotals } from '../../store/cart';
import { formatPrice } from '../../domain/price';
import { installmentValue, lineLabel } from './format';

export interface OrderSummaryProps {
  items: CartItem[];
  metodo: 'pix' | 'cartao';
  parcelas: number;
  frete: number;
  entregaLabel?: string;
}

/** Always-visible order recap (§6.5). Mirrors the totals the backend recomputes on POST /orders. */
export function OrderSummary({ items, metodo, parcelas, frete, entregaLabel }: OrderSummaryProps) {
  const totals = cartTotals({ items });
  const total = (metodo === 'pix' ? totals.pix : totals.cartao) + frete;
  const unit = (i: CartItem) => i.valorGiftCard ?? (metodo === 'pix' ? i.precoAVista : i.precoParcelado);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.key} className="flex justify-between gap-2 text-sm">
            <span>
              {lineLabel(i)}
              {i.quantidade > 1 ? <span className="text-muted"> × {i.quantidade}</span> : null}
            </span>
            <span className="whitespace-nowrap">{formatPrice(unit(i) * i.quantidade)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-2 border-t border-border pt-2 text-sm">
        <span>{entregaLabel ?? (frete > 0 ? 'Entrega' : 'Retirada na loja')}</span>
        <span>{frete > 0 ? formatPrice(frete) : 'Grátis'}</span>
      </p>
      <p className="flex justify-between gap-2 border-t border-border pt-2 font-bold">
        <span>Total {metodo === 'pix' ? 'no Pix' : 'no cartão'}</span>
        <span>{formatPrice(total)}</span>
      </p>
      {metodo === 'cartao' && parcelas > 1 ? (
        <p className="text-sm text-muted">
          {parcelas}x de {formatPrice(installmentValue(total, parcelas))} sem juros
        </p>
      ) : null}
    </div>
  );
}
