export interface RepairRequest {
  console: string;
  problema: string;
  comoAconteceu?: string;
  nome?: string;
}

export interface TradeInRequest {
  plataforma: string;
  tipo: string;
  modelo: string;
  estado: string;
  acompanha: string[];
  quer: string;
  produtoDesejado?: string;
  protocolo?: string;
}

const lines = (rows: (string | false | undefined)[]) => rows.filter(Boolean).join('\n');

/** WhatsApp text for the repair quote form (§6.6). */
export const repairMessage = (d: RepairRequest): string =>
  lines([
    'Olá! Gostaria de um orçamento de assistência técnica.',
    `Console: ${d.console}`,
    `Problema: ${d.problema}`,
    d.comoAconteceu?.trim() && `Como aconteceu: ${d.comoAconteceu.trim()}`,
    d.nome?.trim() && `Nome: ${d.nome.trim()}`,
  ]);

/** WhatsApp text for the trade-in wizard summary (§6.7). */
export const tradeInMessage = (d: TradeInRequest): string =>
  lines([
    'Olá! Quero trocar meu game.',
    `Tenho: ${d.tipo} ${d.modelo} (${d.plataforma})`,
    `Estado: ${d.estado}`,
    `Acompanha: ${d.acompanha.length ? d.acompanha.join(', ') : 'nada além do item'}`,
    `Quero: ${d.quer}${d.produtoDesejado ? ` — ${d.produtoDesejado}` : ''}`,
    d.protocolo && `Protocolo: ${d.protocolo}`,
  ]);
