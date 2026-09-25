import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, getRelated } from '../services/products';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { useCart } from '../store/cart';
import { buildProductName, conditionLabel } from '../domain/productName';
import { formatPrice } from '../domain/price';
import { formatDateBR } from '../domain/dates';
import { getWarrantyStatus } from '../domain/warranty';
import type { WarrantyStatus } from '../domain/warranty';
import { isPreOrderActive } from '../domain/preorder';
import { getAvailability } from '../domain/availability';
import { keyAttributes } from '../domain/catalog';
import { whatsappLink, productWhatsappText } from '../domain/whatsapp';
import { productJsonLd, breadcrumbJsonLd } from '../seo/jsonld';
import { storeConfig } from '../config/storeConfig';
import { MAIN_MENU, SUBCATEGORIES } from '../components/layout/menu';
import { Gallery } from '../components/product/Gallery';
import { UsedBlock } from '../components/product/UsedBlock';
import { ShippingCalculator } from '../components/product/ShippingCalculator';
import { StickyBuyBar } from '../components/product/StickyBuyBar';
import { PriceBlock } from '../components/product/PriceBlock';
import { ProductGrid } from '../components/product/ProductGrid';
import { Accordion, Alert, Badge, Breadcrumb, Button, PixelIcon, Skeleton, toast } from '../components/ui';
import type { BadgeTone } from '../components/ui';
import type { PixelIconName } from '../components/ui';
import NotFound from './NotFound';

const WARRANTY_TONE: Partial<Record<WarrantyStatus['kind'], BadgeTone>> = { ativa: 'success', vencendo: 'warning', 'loja-padrao': 'info' };
const WARRANTY_ICON: Partial<Record<WarrantyStatus['kind'], PixelIconName>> = { ativa: 'shield', vencendo: 'warning', 'loja-padrao': 'shield' };
const AVAILABILITY_ICON: Record<'estoque' | 'revisao' | 'esgotado', PixelIconName> = { estoque: 'check', revisao: 'clock', esgotado: 'warning' };
const CONDITION_TONE: Record<'novo' | 'usado' | 'lacrado', BadgeTone> = { novo: 'brand', lacrado: 'info', usado: 'neutral' };

export default function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const buyRowRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);
  const [relatedVisible, setRelatedVisible] = useState(false);

  const { data: product, loading } = useAsync(() => getProduct(slug), [slug]);
  // Fetched only once the section scrolls into view: keeps it off the critical path and, as a side
  // effect, avoids any other product's badges ever entering this page before the user asks for them.
  const { data: related = [], loading: relatedLoading } = useAsync(
    () => (product && relatedVisible ? getRelated(product) : Promise.resolve([])),
    [product?.id, relatedVisible],
  );

  useEffect(() => {
    const el = relatedRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRelatedVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach once the section actually mounts (it doesn't exist yet during the loading/not-found states).
  }, [product?.id]);

  const hoje = new Date();
  const name = product ? buildProductName(product) : '';
  const canonicalUrl = product ? `${storeConfig.siteUrl}/produto/${product.slug}` : '';
  const warranty = product ? getWarrantyStatus(product, hoje) : undefined;
  const availability = product ? getAvailability(product) : undefined;
  const preorder = product ? isPreOrderActive(product, hoje) : false;
  const esgotado = availability?.kind === 'esgotado';
  const primaryLabel = preorder ? 'Reservar na pré-venda' : 'Comprar';

  useWhatsAppMessage(product ? productWhatsappText(name, canonicalUrl) : null);

  const breadcrumbItems = product
    ? [
        { label: 'Início', to: '/' },
        ...(MAIN_MENU.find((m) => m.plataforma === product.plataforma)
          ? [{ label: MAIN_MENU.find((m) => m.plataforma === product.plataforma)!.label, to: MAIN_MENU.find((m) => m.plataforma === product.plataforma)!.to }]
          : []),
        ...(SUBCATEGORIES.find((s) => s.tipo === product.tipo) ? [{ label: SUBCATEGORIES.find((s) => s.tipo === product.tipo)!.label }] : []),
        { label: name },
      ]
    : [];

  useSeo({
    title: product ? `${name} | ${storeConfig.nome}` : 'Produto | Mateus Games',
    description: product
      ? `${name}. ${keyAttributes(product)}. Por ${formatPrice(product.preco.precoAVista)} no Pix. Retire grátis em Joinville.`
      : 'Produto não encontrado.',
    path: `/produto/${slug}`,
    image: product?.imagens[0] ? product.imagens[0].src.replace('-400.webp', '-800.webp') : undefined,
    type: 'product',
    jsonLd: product ? [productJsonLd(product, canonicalUrl), breadcrumbJsonLd(breadcrumbItems.map((b) => ({ label: b.label, to: b.to ?? canonicalUrl })))] : undefined,
  });

  function handleBuy() {
    if (!product) return;
    add(product);
    toast('Produto adicionado ao carrinho');
    navigate('/carrinho');
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 lg:flex-row">
        <Skeleton className="aspect-square w-full lg:w-1/2" />
        <div className="flex w-full flex-col gap-2 lg:w-1/2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  if (!product) return <NotFound />;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 pb-[96px] lg:pb-8">
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Gallery images={product.imagens} name={name} />

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{name}</h1>

          <div className="flex flex-wrap gap-2">
            {product.tipo !== 'gift-card' ? (
              <Badge tone={CONDITION_TONE[product.condicao]}>{product.condicao === 'usado' ? 'Usado — Revisado' : conditionLabel(product.condicao)}</Badge>
            ) : null}
            {warranty && warranty.kind !== 'nenhuma' ? (
              <Badge tone={WARRANTY_TONE[warranty.kind]!} icon={WARRANTY_ICON[warranty.kind]}>
                {warranty.label}
              </Badge>
            ) : null}
            {product.tipo !== 'gift-card' && product.estoque >= 1 && product.estoque <= 2 ? <Badge tone="warning">Últimas unidades</Badge> : null}
            {preorder ? (
              <Badge tone="info" icon="clock">
                Pré-venda
              </Badge>
            ) : null}
          </div>

          {preorder && product.dataLancamento ? <p className="text-muted">Será lançado em {formatDateBR(product.dataLancamento)}</p> : null}

          {availability ? (
            <div>
              <p className="flex items-center gap-2 font-bold">
                <PixelIcon name={AVAILABILITY_ICON[availability.kind]} size={20} />
                {availability.label}
              </p>
              <p className="text-sm text-muted">{availability.motivo}</p>
            </div>
          ) : null}

          {product.avisos.map((aviso) => (
            <Alert key={aviso} tone="warning">
              {aviso}
            </Alert>
          ))}

          <PriceBlock product={product} />

          <div ref={buyRowRef} className="flex flex-wrap gap-2">
            <Button variant="primary" size="lg" disabled={esgotado} onClick={handleBuy}>
              {primaryLabel}
            </Button>
            {esgotado ? (
              <Button variant="secondary" size="lg" onClick={() => toast('Você será avisado quando chegar em estoque.')}>
                Avise-me
              </Button>
            ) : null}
          </div>

          <Button as="a" variant="secondary" href={whatsappLink(productWhatsappText(name, canonicalUrl))} target="_blank" rel="noopener noreferrer">
            Tirar dúvida no WhatsApp
          </Button>

          <ShippingCalculator />
        </div>
      </div>

      {product.usado && warranty ? <UsedBlock usado={product.usado} warranty={warranty} /> : null}

      <Accordion
        items={[
          { id: 'descricao', title: 'Descrição técnica', content: product.descricaoTecnica },
          {
            id: 'garantia',
            title: 'Garantia e trocas',
            content: (
              <Link to="/politicas/garantia" className="text-brand hover:underline">
                Ver política de garantia e trocas
              </Link>
            ),
          },
        ]}
      />

      <section ref={relatedRef} aria-labelledby="relacionados-heading">
        <h2 id="relacionados-heading" className="text-lg font-bold">
          Produtos relacionados
        </h2>
        <div className="mt-4">
          <ProductGrid products={related} loading={relatedVisible && relatedLoading} skeletons={4} />
        </div>
      </section>

      <StickyBuyBar targetRef={buyRowRef} price={product.preco.precoAVista} label={primaryLabel} onBuy={handleBuy} disabled={esgotado} />
    </div>
  );
}
