import { formatPrice } from '../../domain/price';
import { maskCep, shippingQuote } from '../../domain/shipping';
import { storeConfig } from '../../config/storeConfig';
import { Input, RadioCard } from '../ui';
import type { EntregaForm, FieldErrors } from './types';

const { endereco: loja, horario } = storeConfig;
const pickupDescription = `${loja.rua}, ${loja.bairro} — ${loja.cidade}/${loja.uf}. ${horario
  .map((h) => `${h.dias}: ${h.horas}`)
  .join(' · ')}. Pronto para retirada em até 2 horas após o pagamento.`;

/** Free in-store pickup is preselected (§6.5); home delivery uses the mock quote from §7.6. */
export function DeliveryStep({
  entrega,
  errors,
  onChange,
}: {
  entrega: EntregaForm;
  errors: FieldErrors;
  onChange: (next: EntregaForm) => void;
}) {
  const quote = shippingQuote(entrega.cep);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Entrega</h2>
      <RadioCard
        name="entrega"
        value="retirada"
        checked={entrega.tipo === 'retirada'}
        onChange={() => onChange({ ...entrega, tipo: 'retirada' })}
        title="Retirar na loja — grátis"
        description={pickupDescription}
      />
      <RadioCard
        name="entrega"
        value="entrega"
        checked={entrega.tipo === 'entrega'}
        onChange={() => onChange({ ...entrega, tipo: 'entrega' })}
        title="Receber em casa"
        description="Frete calculado pelo CEP, com prazo estimado."
      />
      {entrega.tipo === 'entrega' ? (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <Input
            id="cep"
            label="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={entrega.cep}
            error={errors.cep}
            onChange={(e) => onChange({ ...entrega, cep: maskCep(e.target.value) })}
          />
          {quote ? (
            <p className="font-bold text-success">
              {formatPrice(quote.valor)} — {quote.prazo}
            </p>
          ) : null}
          <Input
            id="endereco"
            label="Endereço completo"
            autoComplete="street-address"
            placeholder="Rua, número, complemento e bairro"
            value={entrega.endereco}
            error={errors.endereco}
            onChange={(e) => onChange({ ...entrega, endereco: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
