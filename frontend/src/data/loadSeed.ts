import productsRaw from '../../../seed/products.json';
import campaignsRaw from '../../../seed/campaigns.json';
import servicesRaw from '../../../seed/services.json';
import tradeInRaw from '../../../seed/trade-in.json';
import reviewsRaw from '../../../seed/reviews.json';
import faqRaw from '../../../seed/faq.json';
import type { Campaign, FaqItem, Product, RepairService, Review, TradeInItem } from '../domain/types';
import { resolveSeedDates, toISODate } from '../domain/dates';
import { slugify, uniqueSlug } from '../domain/slug';
import { buildProductName } from '../domain/productName';

export interface Seed {
  products: Product[]; campaigns: Campaign[]; services: RepairService[]; tradeIn: TradeInItem[]; reviews: Review[];
  faq: Record<'assistencia' | 'troca' | 'giftcards', FaqItem[]>;
}

let cache: { day: string; seed: Seed } | undefined;

export function loadSeed(today = new Date()): Seed {
  const day = toISODate(today);
  if (cache?.day === day) return cache.seed;
  const taken = new Set<string>();
  const products = resolveSeedDates(productsRaw as unknown as Product[], today).map((p) => ({ ...p, slug: uniqueSlug(slugify(buildProductName(p)), taken) }));
  const seed: Seed = {
    products,
    campaigns: resolveSeedDates(campaignsRaw as Campaign[], today),
    services: servicesRaw as RepairService[],
    tradeIn: tradeInRaw as TradeInItem[],
    reviews: resolveSeedDates(reviewsRaw as Review[], today),
    faq: faqRaw as Seed['faq'],
  };
  cache = { day, seed };
  return seed;
}
