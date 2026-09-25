import type { CartItem } from '../../store/cart';

export interface ClienteForm {
  nome: string;
  email: string;
  telefone: string;
}

export interface EntregaForm {
  tipo: 'retirada' | 'entrega';
  cep: string;
  endereco: string;
}

export interface PagamentoForm {
  metodo: 'pix' | 'cartao';
  parcelas: number;
}

/** Field id → message. The step components render these through `Input error`. */
export type FieldErrors = Partial<Record<'nome' | 'email' | 'telefone' | 'cep' | 'endereco', string>>;

export interface OrderTotals {
  items: CartItem[];
  frete: number;
  metodo: 'pix' | 'cartao';
  parcelas: number;
}
