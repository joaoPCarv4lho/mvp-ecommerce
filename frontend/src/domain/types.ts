export type Plataforma = 'playstation' | 'xbox' | 'nintendo' | 'retro' | 'multi';
export type Tipo = 'console' | 'jogo' | 'acessorio' | 'headset' | 'gift-card';
export type Condicao = 'novo' | 'usado' | 'lacrado';
export type EstadoConservacao = 'excelente' | 'muito-bom' | 'bom';

export interface PriceModel { precoAVista: number; precoParcelado: number; parcelasMax: number; jurosMensal?: number }
export interface Acompanha { console: boolean; controles: number; cabos: boolean; caixa: boolean; jogo: boolean }
export interface UsadoInfo { estado: EstadoConservacao; acompanha: Acompanha; revisadoEm: string; fotosReais: { src: string; alt: string }[] }
export interface ProductImage { src: string; alt: string }

export interface Product {
  id: string;
  slug: string;
  plataforma: Plataforma;
  familia: string;            // "PlayStation 5", "Xbox Series X|S", "Nintendo Switch", "PlayStation 3", "Steam"...
  tipo: Tipo;
  modelo: string;             // "Slim", "Controle DualSense", "EA Sports FC 25"
  capacidade?: string;        // "1TB"
  edicao?: string;            // "Edição Digital"
  condicao: Condicao;
  atributos: string[];        // ["1TB", "Com leitor"]
  preco: PriceModel;
  crediario?: { total: number; parcelasMax: number };
  estoque: number;
  emRevisao?: boolean;
  retiradaImediata: boolean;
  garantiaTipo?: 'loja' | 'fabrica';
  garantiaAte?: string;       // ISO date (already resolved)
  garantiaMeses?: number;
  dataLancamento?: string;    // ISO date (already resolved)
  usado?: UsadoInfo;
  avisos: string[];
  descricaoTecnica: string;
  imagens: ProductImage[];
  giftCard?: { valores: number[]; regiao: 'Brasil' };
  criadoEm: string;           // ISO datetime (already resolved)
  relevancia: number;
}

export interface Campaign { id: string; titulo: string; texto: string; href: string; inicio: string; fim: string }
export interface RepairService { id: string; nome: string; descricao: string; aPartirDe: number; prazoMedio: string; garantia: string }
export interface TradeInItem { plataforma: Plataforma; familia: string; tipo: 'console' | 'jogo'; modelo: string; aceito: boolean; motivo?: string }
export interface Review { id: string; autor: string; nota: number; texto: string; data: string }
export interface FaqItem { pergunta: string; resposta: string }

export type SortKey = 'relevancia' | 'menor-preco' | 'maior-preco' | 'recentes';
export interface ProductFilters {
  plataforma?: Plataforma;
  tipo?: Tipo;
  condicao?: Condicao;
  precoMin?: number;
  precoMax?: number;
  disponibilidade?: 'estoque' | 'retirada';
  q?: string;
  sort?: SortKey;
}
export interface ProductList { items: Product[]; total: number }
export interface Suggestion { slug: string; nome: string; preco: number; imagem: ProductImage }

export interface OrderInput {
  itens: { productId: string; quantidade: number; valorGiftCard?: number }[];
  cliente: { nome: string; email: string; telefone: string };
  entrega: { tipo: 'retirada' } | { tipo: 'entrega'; cep: string; endereco: string; frete: number };
  pagamento: { metodo: 'pix' } | { metodo: 'cartao'; parcelas: number };
}
export interface Order { numero: string; total: number; criadoEm: string; input: OrderInput }
