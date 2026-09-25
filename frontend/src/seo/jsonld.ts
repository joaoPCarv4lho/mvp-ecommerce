import type { FaqItem, Product } from '../domain/types';
import { storeConfig } from '../config/storeConfig';
import { buildProductName } from '../domain/productName';
import { isPreOrderActive } from '../domain/preorder';
import { addDays, toISODate } from '../domain/dates';

const S = 'https://schema.org/';
const abs = (path: string) => (path.startsWith('http') ? path : storeConfig.siteUrl + path);

export function storeJsonLd(): object {
  const { endereco: e, geo } = storeConfig;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeConfig.nome,
    url: storeConfig.siteUrl,
    telephone: storeConfig.telefone,
    email: storeConfig.email,
    foundingDate: String(storeConfig.anoFundacao),
    image: abs('/images/loja-800.webp'),
    address: { '@type': 'PostalAddress', streetAddress: e.rua, addressLocality: e.cidade, addressRegion: e.uf, postalCode: e.cep, addressCountry: 'BR' },
    geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng },
    openingHours: storeConfig.horario.map((h) => h.schema),
    sameAs: Object.values(storeConfig.redes),
  };
}

const MANUFACTURERS: [RegExp, string][] = [
  [/^playstation/i, 'Sony'],
  [/^xbox/i, 'Microsoft'],
  [/^(super )?nintendo|^wii|3ds/i, 'Nintendo'],
];

/** Console maker for the product family; undefined for stores/others (Steam, Roblox...). */
export const manufacturer = (familia: string) => MANUFACTURERS.find(([re]) => re.test(familia))?.[1];

export function productJsonLd(p: Product, url: string, hoje = new Date()): object {
  const preOrder = isPreOrderActive(p, hoje);
  const availability = preOrder ? 'PreOrder' : p.estoque > 0 ? 'InStock' : 'OutOfStock';
  const brand = manufacturer(p.familia);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: buildProductName(p),
    sku: p.id,
    description: p.descricaoTecnica,
    image: p.imagens.map((i) => abs(i.src)),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: p.preco.precoAVista,
      priceValidUntil: addDays(toISODate(hoje), 30),
      ...(preOrder && p.dataLancamento ? { availabilityStarts: p.dataLancamento.slice(0, 10) } : {}),
      availability: S + availability,
      itemCondition: S + (p.condicao === 'usado' ? 'UsedCondition' : 'NewCondition'),
      seller: { '@type': 'Organization', name: storeConfig.nome },
    },
  };
}

export function breadcrumbJsonLd(items: { label: string; to: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: abs(it.to) })),
  };
}

export function faqJsonLd(items: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.pergunta, acceptedAnswer: { '@type': 'Answer', text: f.resposta } })),
  };
}
