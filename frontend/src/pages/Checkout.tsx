import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { Order, OrderInput } from '../domain/types';
import type { CartItem } from '../store/cart';
import { cartTotals, useCart } from '../store/cart';
import { shippingQuote } from '../domain/shipping';
import { createOrder } from '../services/orders';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { IdentificationStep } from '../components/checkout/IdentificationStep';
import { DeliveryStep } from '../components/checkout/DeliveryStep';
import { PaymentStep } from '../components/checkout/PaymentStep';
import { ConfirmationStep } from '../components/checkout/ConfirmationStep';
import { OrderSummary } from '../components/checkout/OrderSummary';
import type { ClienteForm, EntregaForm, FieldErrors, PagamentoForm } from '../components/checkout/types';
import { Alert, Button, Stepper } from '../components/ui';

const STEPS = ['Carrinho', 'Identificação', 'Entrega', 'Pagamento', 'Confirmação'];
const STEP_IDENTIFICACAO = 1;
const STEP_ENTREGA = 2;
const STEP_PAGAMENTO = 3;
const STEP_CONFIRMACAO = 4;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ERROR_MESSAGE = 'Não foi possível concluir o pedido. Tente novamente.';

function validateCliente(c: ClienteForm): FieldErrors {
  const errors: FieldErrors = {};
  if (c.nome.trim().length < 2) errors.nome = 'Informe seu nome completo.';
  if (!EMAIL_RE.test(c.email.trim())) errors.email = 'Informe um e-mail válido, como nome@exemplo.com.';
  if (c.telefone.replace(/\D/g, '').length < 10) errors.telefone = 'Informe o celular com DDD, com 10 ou 11 números.';
  return errors;
}

function validateEntrega(e: EntregaForm): FieldErrors {
  if (e.tipo === 'retirada') return {};
  const errors: FieldErrors = {};
  if (!shippingQuote(e.cep)) errors.cep = 'Digite um CEP válido com 8 números.';
  if (e.endereco.trim().length < 5) errors.endereco = 'Informe rua, número e bairro.';
  return errors;
}

/** Field order decides which input gets focus when a step fails validation. */
const FIELD_ORDER: (keyof FieldErrors)[] = ['nome', 'email', 'telefone', 'cep', 'endereco'];

export default function Checkout() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const totals = cartTotals({ items });

  const [step, setStep] = useState(STEP_IDENTIFICACAO);
  const [cliente, setCliente] = useState<ClienteForm>({ nome: '', email: '', telefone: '' });
  const [entrega, setEntrega] = useState<EntregaForm>({ tipo: 'retirada', cep: '', endereco: '' });
  const [pagamento, setPagamento] = useState<PagamentoForm>({ metodo: 'pix', parcelas: totals.parcelas });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  // Snapshot taken before the cart is cleared, so the confirmation can still list what was bought.
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  useSeo({
    title: order ? 'Pedido confirmado | Mateus Games' : 'Checkout | Mateus Games',
    description: 'Finalize seu pedido na Mateus Games: retirada grátis em Joinville ou entrega, com Pix ou cartão.',
    path: '/checkout',
    noindex: true,
  });
  useWhatsAppMessage(pageWhatsappText('Checkout'));

  // Emptying the cart is an external-store update, which React flushes synchronously: doing it
  // inside submit() would re-render with the cart already empty but `order` not yet committed,
  // and the guard below would bounce the customer back to /carrinho instead of confirming.
  useEffect(() => {
    if (order) clear();
  }, [order, clear]);

  if (items.length === 0 && !order) return <Navigate to="/carrinho" replace />;

  const quote = entrega.tipo === 'entrega' ? shippingQuote(entrega.cep) : null;
  const frete = quote?.valor ?? 0;
  const totalPix = totals.pix + frete;
  const totalCartao = totals.cartao + frete;
  const parcelas = Math.min(pagamento.parcelas, totals.parcelas);

  const fail = (found: FieldErrors) => {
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    // Input is a plain function component (no ref forwarding), so focus the field by id.
    if (first) document.getElementById(first)?.focus();
  };

  async function submit() {
    const input: OrderInput = {
      itens: items.map((i) => ({ productId: i.productId, quantidade: i.quantidade, ...(i.valorGiftCard == null ? {} : { valorGiftCard: i.valorGiftCard }) })),
      cliente: { nome: cliente.nome.trim(), email: cliente.email.trim(), telefone: cliente.telefone.trim() },
      entrega: entrega.tipo === 'retirada' ? { tipo: 'retirada' } : { tipo: 'entrega', cep: entrega.cep, endereco: entrega.endereco.trim(), frete },
      pagamento: pagamento.metodo === 'pix' ? { metodo: 'pix' } : { metodo: 'cartao', parcelas },
    };
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      const created = await createOrder(input);
      setOrderItems(items);
      setOrder(created);
      setStep(STEP_CONFIRMACAO);
    } catch {
      // The form keeps every value so the customer only has to press the button again.
      setSubmitFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  function advance() {
    if (step === STEP_IDENTIFICACAO) {
      const found = validateCliente(cliente);
      if (Object.keys(found).length) return fail(found);
      setErrors({});
      return setStep(STEP_ENTREGA);
    }
    if (step === STEP_ENTREGA) {
      const found = validateEntrega(entrega);
      if (Object.keys(found).length) return fail(found);
      setErrors({});
      return setStep(STEP_PAGAMENTO);
    }
    return submit();
  }

  const summary = (
    <OrderSummary
      items={items}
      metodo={pagamento.metodo}
      parcelas={parcelas}
      frete={frete}
      entregaLabel={entrega.tipo === 'retirada' ? 'Retirada na loja' : 'Entrega'}
    />
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <Stepper steps={STEPS} current={step} hrefs={order ? undefined : ['/carrinho']} />

      {order ? (
        <div className="mt-6">
          <ConfirmationStep order={order} items={orderItems} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-6">
            <h1 className="text-2xl font-bold">Finalizar compra</h1>

            {step === STEP_IDENTIFICACAO ? <IdentificationStep cliente={cliente} errors={errors} onChange={setCliente} /> : null}
            {step === STEP_ENTREGA ? <DeliveryStep entrega={entrega} errors={errors} onChange={setEntrega} /> : null}
            {step === STEP_PAGAMENTO ? (
              <PaymentStep
                pagamento={{ ...pagamento, parcelas }}
                totalPix={totalPix}
                totalCartao={totalCartao}
                parcelasMax={totals.parcelas}
                onChange={setPagamento}
              />
            ) : null}

            {submitFailed ? <Alert tone="error">{ERROR_MESSAGE}</Alert> : null}

            <details className="rounded-card border border-border bg-surface p-4 lg:hidden">
              <summary className="cursor-pointer font-bold">Resumo do pedido</summary>
              <div className="mt-2">{summary}</div>
            </details>

            <div className="flex flex-wrap items-center gap-2">
              {step === STEP_IDENTIFICACAO ? (
                <Button as={Link} to="/carrinho" variant="ghost">
                  Voltar ao carrinho
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  Voltar
                </Button>
              )}
              <Button variant="primary" size="lg" disabled={submitting} onClick={advance}>
                {step === STEP_PAGAMENTO ? 'Confirmar pedido' : 'Continuar'}
              </Button>
            </div>
          </div>

          <aside className="hidden w-[320px] flex-shrink-0 rounded-card border border-border bg-surface p-4 shadow-card lg:block">
            <h2 className="text-lg font-bold">Resumo do pedido</h2>
            <div className="mt-2">{summary}</div>
          </aside>
        </div>
      )}
    </div>
  );
}
