import { formatPrice } from '../../domain/price';
import { Badge, RadioCard, Select } from '../ui';
import { installmentValue } from './format';
import type { PagamentoForm } from './types';

/** Pix in the spotlight with its discount, card with installments — all simulated (§6.5). */
export function PaymentStep({
  pagamento,
  totalPix,
  totalCartao,
  parcelasMax,
  onChange,
}: {
  pagamento: PagamentoForm;
  totalPix: number;
  totalCartao: number;
  parcelasMax: number;
  onChange: (next: PagamentoForm) => void;
}) {
  const economia = totalCartao > 0 ? Math.round((1 - totalPix / totalCartao) * 100) : 0;
  const options = Array.from({ length: parcelasMax }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: `${n}x de ${formatPrice(installmentValue(totalCartao, n))} sem juros` };
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Pagamento</h2>
      <RadioCard
        name="pagamento"
        value="pix"
        checked={pagamento.metodo === 'pix'}
        onChange={() => onChange({ ...pagamento, metodo: 'pix' })}
        title="Pix"
        description="O código Pix aparece na confirmação (simulado)."
      >
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-bold text-success">{formatPrice(totalPix)}</span>
          {economia > 0 ? <Badge tone="success">economize {economia}%</Badge> : null}
        </span>
      </RadioCard>
      <RadioCard
        name="pagamento"
        value="cartao"
        checked={pagamento.metodo === 'cartao'}
        onChange={() => onChange({ ...pagamento, metodo: 'cartao' })}
        title="Cartão de crédito"
        description={`${formatPrice(totalCartao)} em até ${parcelasMax}x sem juros (simulado).`}
      />
      {pagamento.metodo === 'cartao' ? (
        <div className="rounded-card border border-border bg-surface p-4">
          <Select
            id="parcelas"
            label="Parcelas"
            value={String(pagamento.parcelas)}
            options={options}
            onChange={(e) => onChange({ ...pagamento, parcelas: Number(e.target.value) })}
          />
        </div>
      ) : null}
    </div>
  );
}
