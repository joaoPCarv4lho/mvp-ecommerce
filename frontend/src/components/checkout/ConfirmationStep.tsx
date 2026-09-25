import { Link } from 'react-router-dom';
import type { Order } from '../../domain/types';
import type { CartItem } from '../../store/cart';
import { formatPrice } from '../../domain/price';
import { storeConfig } from '../../config/storeConfig';
import { Alert, Button, Input, toast } from '../ui';
import { installmentValue, lineLabel } from './format';

// Simulated Pix payload: fixed shape, never a real payable code (the merchant fields come from storeConfig).
const PIX_CODE = [
  '00020126580014BR.GOV.BCB.PIX0136mateus-games-simulado-000152040000',
  '5303986540510.005802BR',
  `59${String(storeConfig.nome.length).padStart(2, '0')}${storeConfig.nome.toUpperCase()}`,
  `60${String(storeConfig.endereco.cidade.length).padStart(2, '0')}${storeConfig.endereco.cidade.toUpperCase()}`,
  '62070503***6304ABCD',
].join('');

async function copy(text: string) {
  try {
    await navigator.clipboard?.writeText(text);
    toast('Código Pix copiado');
  } catch {
    toast('Não foi possível copiar. Selecione o código e copie manualmente.');
  }
}

/** Order number, recap and next steps (§6.5). The account offer is optional and comes only here. */
export function ConfirmationStep({ order, items }: { order: Order; items: CartItem[] }) {
  const { entrega, pagamento } = order.input;
  const entregaLabel =
    entrega.tipo === 'retirada'
      ? `Retirada na loja — ${storeConfig.endereco.rua}, ${storeConfig.endereco.cidade}/${storeConfig.endereco.uf}`
      : `Entrega em ${entrega.endereco} (CEP ${entrega.cep})`;
  const pagamentoLabel =
    pagamento.metodo === 'pix'
      ? `Pix — ${formatPrice(order.total)}`
      : `Cartão de crédito — ${pagamento.parcelas}x de ${formatPrice(installmentValue(order.total, pagamento.parcelas))} sem juros`;

  const proximosPassos = [
    ...(pagamento.metodo === 'pix' ? ['Pague o Pix com o código abaixo.'] : ['Pagamento simulado: nada será cobrado no seu cartão.']),
    entrega.tipo === 'retirada'
      ? 'Traga um documento com foto na loja para retirar o pedido.'
      : 'Você recebe o código de rastreio pelo WhatsApp.',
    'Qualquer dúvida, fale com a gente no WhatsApp.',
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Pedido confirmado!</h1>
        <p className="text-lg">Número do pedido: {order.numero}</p>
        <p className="text-muted">Enviamos os detalhes para {order.input.cliente.email}.</p>
      </div>

      <section aria-labelledby="resumo-pedido" className="rounded-card border border-border bg-surface p-4">
        <h2 id="resumo-pedido" className="text-lg font-bold">
          Resumo do pedido
        </h2>
        <ul className="mt-2 flex flex-col gap-1">
          {items.map((i) => (
            <li key={i.key} className="text-sm">
              {lineLabel(i)} × {i.quantidade}
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap gap-1">
            <dt className="font-bold">Entrega:</dt>
            <dd>{entregaLabel}</dd>
          </div>
          <div className="flex flex-wrap gap-1">
            <dt className="font-bold">Pagamento:</dt>
            <dd>{pagamentoLabel}</dd>
          </div>
          <div className="flex flex-wrap gap-1">
            <dt className="font-bold">Total:</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="proximos-passos" className="flex flex-col gap-2">
        <h2 id="proximos-passos" className="text-lg font-bold">
          Próximos passos
        </h2>
        <ol className="list-inside list-decimal">
          {proximosPassos.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
        {pagamento.metodo === 'pix' ? (
          <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <Input id="pix-code" label="Código Pix copia e cola (simulado)" readOnly value={PIX_CODE} />
            <Button variant="secondary" className="self-start" onClick={() => copy(PIX_CODE)}>
              Copiar código
            </Button>
          </div>
        ) : null}
        <Alert tone="info">Este é um checkout simulado: nenhum pagamento real é processado.</Alert>
      </section>

      <section aria-labelledby="criar-conta" className="flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4">
        <h2 id="criar-conta" className="font-bold">
          Quer acompanhar seus pedidos? Crie uma conta com um clique
        </h2>
        <p className="text-sm text-muted">A conta é opcional: seu pedido já está confirmado.</p>
        <Button as={Link} to="/conta" variant="secondary">
          Criar conta
        </Button>
      </section>
    </div>
  );
}
