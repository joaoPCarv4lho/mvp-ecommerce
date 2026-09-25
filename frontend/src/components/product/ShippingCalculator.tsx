import { useId, useState } from 'react';
import type { FormEvent } from 'react';
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
  const inputId = `cep-${id}`;
  const [cep, setCep] = useState('');
  const [result, setResult] = useState<{ valor: number; prazo: string } | null | undefined>(undefined);

  const calcular = (e: FormEvent) => {
    e.preventDefault();
    const quote = shippingQuote(cep);
    setResult(quote);
    // Input is a plain function component (not ref-forwarding — a shared/do-not-edit file),
    // so focus the invalid field by id rather than via a React ref.
    if (quote === null) document.getElementById(inputId)?.focus();
  };

  return (
    <form className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4" onSubmit={calcular}>
      <p className="rounded-card bg-brand-soft p-2 font-bold text-brand">
        Retirar na loja — grátis · {storeConfig.endereco.rua}, {storeConfig.endereco.cidade}/{storeConfig.endereco.uf}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id={inputId}
          label="Calcular frete"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(maskCep(e.target.value))}
          error={result === null ? 'Digite um CEP válido com 8 números' : undefined}
        />
        <Button type="submit">Calcular</Button>
      </div>
      {result ? (
        <p>
          {formatPrice(result.valor)} — {result.prazo}
        </p>
      ) : null}
    </form>
  );
}
