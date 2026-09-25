import { useState } from 'react';
import type { Product } from '../../domain/types';
import type { InstallmentRow } from '../../domain/price';
import { buildCrediarioRows, buildInstallments, formatPrice, priceSummary } from '../../domain/price';
import { storeConfig } from '../../config/storeConfig';
import { Badge, Button, Modal, Tabs } from '../ui';

function InstallmentTable({ caption, rows }: { caption: string; rows: InstallmentRow[] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="pb-2 pt-4 text-left font-bold">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-muted">
          <th scope="col" className="py-2 pr-2 font-bold">Parcelas</th>
          <th scope="col" className="py-2 pr-2 font-bold">Valor da parcela</th>
          <th scope="col" className="py-2 font-bold">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.parcelas} className="border-b border-border last:border-0">
            <th scope="row" className="py-2 pr-2 font-normal">{r.parcelas}x</th>
            <td className="py-2 pr-2">
              {formatPrice(r.valor)} <span className="text-xs text-muted">{r.juros ? 'com juros' : 'sem juros'}</span>
            </td>
            <td className="py-2">{formatPrice(r.total)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="pt-2 text-xs text-muted">Valores arredondados ao centavo.</td>
        </tr>
      </tfoot>
    </table>
  );
}

export function PriceBlock({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const s = priceSummary(product.preco);
  const cartao = <InstallmentTable caption="Cartão de crédito" rows={buildInstallments(product.preco)} />;

  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-2">
        <span className={`font-bold text-text ${compact ? 'text-lg' : 'text-xl'}`}>
          {formatPrice(s.aVista)} <span className="text-base">{storeConfig.descontoPixLabel}</span>
        </span>
        {s.economia > 0 ? <Badge tone="success">economize {s.economia}%</Badge> : null}
      </p>
      <p className="text-sm text-muted">
        {s.parcelas > 1
          ? `ou ${formatPrice(s.totalCartao)} em até ${s.parcelas}x de ${formatPrice(s.valorParcela)} no cartão`
          : `ou ${formatPrice(s.totalCartao)} no cartão`}
      </p>
      {compact ? null : (
        <>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(true)}>
            Ver todas as parcelas
          </Button>
          <Modal open={open} onClose={() => setOpen(false)} title="Parcelamento">
            {product.crediario ? (
              <Tabs
                tabs={[
                  { id: 'cartao', label: 'Cartão de crédito', content: cartao },
                  { id: 'crediario', label: 'Crediário da loja', content: <InstallmentTable caption="Crediário da loja" rows={buildCrediarioRows(product.crediario)} /> },
                ]}
              />
            ) : (
              cartao
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
