import type { CartItem } from '../../store/cart';
import { formatPrice } from '../../domain/price';

/** Cents-safe split of a card total into `n` equal installments (same rule as `cartTotals`). */
export const installmentValue = (total: number, n: number) => Math.round(Math.round(total * 100) / n) / 100;

/** Cart line name; gift cards carry the chosen value, since each value is its own line. */
export const lineLabel = (item: CartItem) =>
  item.valorGiftCard == null ? item.nome : `${item.nome} — ${formatPrice(item.valorGiftCard)}`;
