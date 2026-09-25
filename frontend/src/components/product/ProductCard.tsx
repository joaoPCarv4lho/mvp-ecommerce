import { Link } from 'react-router-dom';
import type { Condicao, Product } from '../../domain/types';
import type { BadgeTone } from '../ui';
import { Badge, Button } from '../ui';
import { buildProductName, conditionLabel } from '../../domain/productName';
import { keyAttributes } from '../../domain/catalog';
import { formatPrice, priceSummary } from '../../domain/price';
import { isPreOrderActive } from '../../domain/preorder';
import { getWarrantyStatus } from '../../domain/warranty';
import { productImgProps } from './img';

const CONDITION_TONE: Record<Condicao, BadgeTone> = { novo: 'brand', lacrado: 'info', usado: 'neutral' };

// Listing card (§6.2). Deliberately never shows the technical description.
export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const hoje = new Date();
  const nome = buildProductName(p);
  const s = priceSummary(p.preco);
  const giftCard = p.tipo === 'gift-card';
  const warranty = getWarrantyStatus(p, hoje);
  const img = p.imagens[0];
  const href = `/produto/${p.slug}`;

  return (
    <article className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-2 shadow-card sm:p-4">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-card bg-bg">
        {img ? (
          <img
            {...productImgProps(img.src)}
            sizes="(min-width: 1024px) 25vw, 50vw"
            alt={img.alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="aspect-square h-auto w-full object-cover"
          />
        ) : null}
      </Link>
      <div className="flex flex-wrap gap-1">
        {giftCard ? null : <Badge tone={CONDITION_TONE[p.condicao]}>{conditionLabel(p.condicao)}</Badge>}
        {isPreOrderActive(p, hoje) ? <Badge tone="info" icon="clock">Pré-venda</Badge> : null}
        {warranty.kind === 'ativa' ? <Badge tone="success" icon="shield">{warranty.label}</Badge> : null}
        {warranty.kind === 'vencendo' ? <Badge tone="warning" icon="warning">{warranty.label}</Badge> : null}
        {!giftCard && p.estoque >= 1 && p.estoque <= 2 ? <Badge tone="warning">Últimas unidades</Badge> : null}
      </div>
      <h3 className="text-sm font-bold sm:text-base">{nome}</h3>
      <p className="text-xs text-muted">{keyAttributes(p)}</p>
      <div className="mt-auto flex flex-col gap-1 pt-2">
        <p>
          <span className="text-base font-bold sm:text-lg">{formatPrice(s.aVista)}</span> <span className="text-xs sm:text-sm">no Pix</span>
        </p>
        {s.parcelas > 1 ? (
          <p className="text-xs text-muted">
            ou {s.parcelas}x de {formatPrice(s.valorParcela)}
          </p>
        ) : null}
      </div>
      <Button as={Link} to={href} variant="secondary" size="sm" className="w-full" aria-label={`Ver produto ${nome}`}>
        Ver produto
      </Button>
    </article>
  );
}
