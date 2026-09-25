import type { OrderInput } from '../domain/types';
import { source } from './source';

export const createOrder = (input: OrderInput) => source.createOrder(input);
export const createTradeInProtocol = (resumo: string) => source.createTradeInProtocol(resumo);
