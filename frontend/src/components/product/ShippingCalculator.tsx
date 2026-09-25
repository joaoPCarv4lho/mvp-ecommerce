import { useId, useState } from 'react';
import { shippingQuote } from '../../domain/shipping';
import { formatPrice } from '../../domain/price';
import { storeConfig } from '../../config/storeConfig';
import { Button, Input } from '../ui';

const maskCep = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

/** Mock shipping quote (§7.6) plus the always-available free pickup option. */
export function ShippingCalculator() {
  const id = useId();
  const [cep, setCep] = useState('');
  const [result, setResult] = useState<{ valor: number; prazo: string } | null | undefined>(undefined);

  const calcular = () => setResult(shippingQuote(cep));

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <p className="rounded-card bg-brand-soft p-2 font-bold text-brand">
        Retirar na loja — grátis · {storeConfig.endereco.rua}, {storeConfig.endereco.cidade}/{storeConfig.endereco.uf}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id={`cep-${id}`}
          label="Calcular frete"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(maskCep(e.target.value))}
          error={result === null ? 'Digite um CEP válido com 8 números' : undefined}
        />
        <Button type="button" onClick={calcular}>
          Calcular
        </Button>
      </div>
      {result ? (
        <p>
          {formatPrice(result.valor)} — {result.prazo}
        </p>
      ) : null}
    </div>
  );
}
