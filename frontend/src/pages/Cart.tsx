import { Link } from 'react-router-dom';
import { cartCount, cartTotals, useCart } from '../store/cart';
import type { CartItem } from '../store/cart';
import { formatPrice } from '../domain/price';
import { listProducts } from '../services/products';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { productImgProps } from '../components/product/img';
import { ProductGrid } from '../components/product/ProductGrid';
import { Button, EmptyState } from '../components/ui';

const MIN_QTY = 1;
const MAX_QTY = 10;

function CartLine({ item, onQty, onRemove }: { item: CartItem; onQty: (qty: number) => void; onRemove: () => void }) {
  return (
    <li className="flex gap-4 border-b border-border py-4 last:border-0">
      <Link to={`/produto/${item.slug}`} tabIndex={-1} aria-hidden="true" className="flex-shrink-0">
        {item.imagem ? (
          <img {...productImgProps(item.imagem)} sizes="80px" alt="" className="h-20 w-20 rounded-card bg-bg object-cover" />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <Link to={`/produto/${item.slug}`} className="font-bold text-brand hover:underline">
          {item.nome}
        </Link>
        {item.valorGiftCard != null ? <p className="text-sm text-muted">Valor do gift card: {formatPrice(item.valorGiftCard)}</p> : null}
        <p>
          <span className="font-bold">{formatPrice((item.valorGiftCard ?? item.precoAVista) * item.quantidade)}</span>{' '}
          <span className="text-sm text-muted">no Pix</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Diminuir quantidade de ${item.nome}`}
              disabled={item.quantidade <= MIN_QTY}
              onClick={() => onQty(item.quantidade - 1)}
            >
              −
            </Button>
            <span className="min-w-8 text-center font-bold" aria-hidden="true">
              {item.quantidade}
            </span>
            <span className="sr-only">{`Quantidade de ${item.nome}: ${item.quantidade}`}</span>
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Aumentar quantidade de ${item.nome}`}
              disabled={item.quantidade >= MAX_QTY}
              onClick={() => onQty(item.quantidade + 1)}
            >
              +
            </Button>
          </div>
          <Button variant="ghost" size="sm" aria-label={`Remover ${item.nome} do carrinho`} onClick={onRemove}>
            Remover
          </Button>
        </div>
      </div>
    </li>
  );
}

function EmptyCart() {
  const { data: best, loading: bestLoading } = useAsync(() => listProducts({ sort: 'relevancia' }), []);
  const { data: gifts, loading: giftsLoading } = useAsync(() => listProducts({ tipo: 'gift-card', sort: 'relevancia' }), []);
  const maisVendidos = (best?.items ?? []).filter((p) => p.tipo !== 'gift-card').slice(0, 4);
  const giftCards = (gifts?.items ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <EmptyState icon="cart" title="Seu carrinho está vazio" text="Que tal dar uma olhada nestas ofertas?">
        <Button as={Link} to="/produtos" variant="primary" size="lg" className="mt-2">
          Voltar às compras
        </Button>
      </EmptyState>
      <section aria-labelledby="mais-vendidos">
        <h2 id="mais-vendidos" className="text-lg font-bold">
          Mais vendidos
        </h2>
        <div className="mt-4">
          <ProductGrid products={maisVendidos} loading={bestLoading} skeletons={4} />
        </div>
      </section>
      <section aria-labelledby="gift-cards">
        <h2 id="gift-cards" className="text-lg font-bold">
          Gift cards
        </h2>
        <div className="mt-4">
          <ProductGrid products={giftCards} loading={giftsLoading} skeletons={3} />
        </div>
      </section>
    </div>
  );
}

export default function Cart() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const count = useCart(cartCount);
  const totals = cartTotals({ items });
  const economia = totals.cartao > 0 ? Math.round((1 - totals.pix / totals.cartao) * 100) : 0;

  useSeo({
    title: 'Seu carrinho | Mateus Games',
    description: 'Revise os itens do seu carrinho e finalize a compra com retirada grátis em Joinville ou entrega.',
    path: '/carrinho',
    noindex: true,
  });
  useWhatsAppMessage(pageWhatsappText('Carrinho'));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="text-2xl font-bold">Seu carrinho</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyCart />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            <p role="status" className="sr-only">
              {`Carrinho atualizado: ${count} ${count === 1 ? 'item' : 'itens'}, total ${formatPrice(totals.pix)} no Pix`}
            </p>
            <ul>
              {items.map((item) => (
                <CartLine
                  key={item.key}
                  item={item}
                  onQty={(qty) => setQty(item.key, Math.min(MAX_QTY, Math.max(MIN_QTY, qty)))}
                  onRemove={() => remove(item.key)}
                />
              ))}
            </ul>
          </div>

          <aside className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card lg:w-[320px]">
            <h2 className="text-lg font-bold">Resumo</h2>
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold text-success">Subtotal no Pix {formatPrice(totals.pix)}</span>
              {economia > 0 ? <span className="text-sm font-bold text-success">economize {economia}%</span> : null}
            </p>
            <p className="text-sm text-muted">
              {totals.parcelas > 1
                ? `ou ${formatPrice(totals.cartao)} em até ${totals.parcelas}x de ${formatPrice(totals.valorParcela)} no cartão`
                : `ou ${formatPrice(totals.cartao)} no cartão`}
            </p>
            <p className="text-sm text-muted">Retirada grátis na loja em Joinville ou entrega calculada no próximo passo.</p>
            <Button as={Link} to="/checkout" variant="primary" size="lg" className="mt-2">
              Continuar para identificação
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
