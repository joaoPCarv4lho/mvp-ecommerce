import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Product } from '../domain/types';
import { getFaq } from '../services/content';
import { listProducts } from '../services/products';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { slugify } from '../domain/slug';
import { formatPrice } from '../domain/price';
import { buildProductName } from '../domain/productName';
import { faqJsonLd } from '../seo/jsonld';
import { useCart } from '../store/cart';
import { productImgProps } from '../components/product/img';
import { Accordion, Button, PixelIcon, Skeleton, toast } from '../components/ui';

const PLATAFORMAS = ['PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Google Play', 'Roblox'];

function GiftCardCard({ product }: { product: Product }) {
  const valores = product.giftCard?.valores ?? [];
  const [valor, setValor] = useState(valores[0]);
  const add = useCart((s) => s.add);
  const nome = buildProductName(product);
  const img = product.imagens[0];

  return (
    <article className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card">
      {img ? (
        <img
          {...productImgProps(img.src)}
          sizes="(min-width: 1024px) 25vw, 50vw"
          alt={img.alt}
          loading="lazy"
          decoding="async"
          className="aspect-square h-auto w-full rounded-card bg-bg object-cover"
        />
      ) : null}
      <h3 className="font-bold">
        <Link to={`/produto/${product.slug}`} className="text-brand hover:underline">
          {nome}
        </Link>
      </h3>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{`Valor do gift card ${product.familia}`}</legend>
        {valores.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === valor}
            onClick={() => setValor(v)}
            className={`min-h-11 rounded-card border px-4 font-bold ${v === valor ? 'border-brand bg-brand-soft text-brand' : 'border-border'}`}
          >
            {formatPrice(v)}
          </button>
        ))}
      </fieldset>
      <p className="text-sm text-muted">Válido para contas Brasil</p>
      <Button
        variant="secondary"
        className="mt-auto"
        aria-label={`Adicionar ao carrinho ${nome} de ${formatPrice(valor)}`}
        onClick={() => {
          add(product, valor);
          toast('Gift card adicionado ao carrinho');
        }}
      >
        Adicionar ao carrinho
      </Button>
    </article>
  );
}

export default function GiftCards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const plataforma = searchParams.get('plataforma') ?? '';
  const temGiftCardNoCarrinho = useCart((s) => s.items.some((i) => i.valorGiftCard != null));

  const { data, loading } = useAsync(() => listProducts({ tipo: 'gift-card', sort: 'relevancia' }), []);
  const { data: faq } = useAsync(() => getFaq(), []);
  const perguntas = faq?.giftcards ?? [];

  const all = data?.items ?? [];
  const products = plataforma ? all.filter((p) => slugify(p.familia) === plataforma) : all;

  useSeo({
    title: 'Gift Cards de PlayStation, Xbox, Nintendo, Steam e mais | Mateus Games',
    description: 'Gift cards válidos para contas Brasil: PlayStation, Xbox, Nintendo, Steam, Google Play e Roblox. Código por e-mail e WhatsApp.',
    path: '/gift-cards',
    jsonLd: perguntas.length ? faqJsonLd(perguntas) : undefined,
  });
  useWhatsAppMessage(pageWhatsappText('Gift Cards'));

  const select = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('plataforma', value);
    else next.delete('plataforma');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Gift Cards</h1>
        <p className="text-muted">Recarregue sua conta sem cartão internacional: você escolhe o valor e recebe o código.</p>
      </header>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="text-sm font-bold">Filtrar por plataforma</legend>
        {[{ label: 'Todos', slug: '' }, ...PLATAFORMAS.map((p) => ({ label: p, slug: slugify(p) }))].map((option) => (
          <label
            key={option.label}
            className={`flex min-h-11 cursor-pointer items-center rounded-card border px-4 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
              plataforma === option.slug ? 'border-brand bg-brand-soft text-brand' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="plataforma"
              value={option.slug}
              checked={plataforma === option.slug}
              onChange={() => select(option.slug)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {loading ? (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-64 w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <GiftCardCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {temGiftCardNoCarrinho ? (
        <Button as={Link} to="/carrinho" variant="primary" size="lg" className="self-start">
          Ir para o carrinho
        </Button>
      ) : null}

      <section aria-labelledby="como-funciona" className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
        <h2 id="como-funciona" className="text-lg font-bold">
          Como funciona
        </h2>
        <p className="flex items-start gap-2">
          <PixelIcon name="gift" size={20} />
          Pagou, recebeu: o código chega por e-mail e WhatsApp em até 1 hora após a confirmação do pagamento (Pix aprovado na hora).
        </p>
      </section>

      <section aria-labelledby="faq-giftcards">
        <h2 id="faq-giftcards" className="text-lg font-bold">
          Perguntas frequentes
        </h2>
        <div className="mt-2">
          <Accordion items={perguntas.map((f, i) => ({ id: `faq-gc-${i}`, title: f.pergunta, content: f.resposta }))} />
        </div>
      </section>
    </div>
  );
}
