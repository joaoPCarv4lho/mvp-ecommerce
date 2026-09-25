import { it, expect } from 'vitest';
import { repairMessage, tradeInMessage } from './messages';

it('repair message includes form data and omits empty optional', () => {
  expect(repairMessage({ console: 'PlayStation 5', problema: 'Reparo de porta HDMI' }))
    .toBe('Olá! Gostaria de um orçamento de assistência técnica.\nConsole: PlayStation 5\nProblema: Reparo de porta HDMI');
  expect(repairMessage({ console: 'Xbox One', problema: 'Outro', comoAconteceu: 'Caiu da estante' })).toContain('Como aconteceu: Caiu da estante');
  expect(repairMessage({ console: 'Xbox One', problema: 'Outro', nome: 'Ana' })).toContain('Nome: Ana');
});

it('trade-in message summarises choices', () => {
  const m = tradeInMessage({ plataforma: 'PlayStation 4', tipo: 'Console', modelo: 'PS4 Slim', estado: 'Muito bom', acompanha: ['Caixa', 'Controles'], quer: 'Crédito na loja', protocolo: 'TR-20260925-AB12' });
  expect(m).toContain('Tenho: Console PS4 Slim (PlayStation 4)');
  expect(m).toContain('Acompanha: Caixa, Controles');
  expect(m).toContain('Protocolo: TR-20260925-AB12');
});

it('trade-in message states when nothing else comes with the item', () => {
  const m = tradeInMessage({ plataforma: 'Nintendo Switch', tipo: 'Jogo', modelo: 'Cartucho', estado: 'Bom', acompanha: [], quer: 'Um produto específico', produtoDesejado: 'PlayStation 5 Pro' });
  expect(m).toContain('Acompanha: nada além do item');
  expect(m).toContain('Quero: Um produto específico — PlayStation 5 Pro');
  expect(m).not.toContain('Protocolo');
});
