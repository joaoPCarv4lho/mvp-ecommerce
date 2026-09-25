export const storeConfig = {
  nome: 'Mateus Games',
  seoTitleHome: 'Mateus Games | Loja de Videogames em Joinville — Venda, Troca e Assistência',
  slogan: 'A diversão de hoje é a nostalgia de amanhã',
  anoFundacao: 2012,
  siteUrl: 'https://www.mateusgames.com.br',
  telefone: '+55 47 3422-0000',
  whatsapp: '5547999990000', // wa.me format, digits only
  email: 'contato@mateusgames.com.br',
  endereco: { rua: 'Rua do Príncipe, 500 — Sala 3', bairro: 'Centro', cidade: 'Joinville', uf: 'SC', cep: '89201-000' },
  geo: { lat: -26.3045, lng: -48.8487 },
  horario: [
    { dias: 'Segunda a sexta', horas: '9h às 19h', schema: 'Mo-Fr 09:00-19:00' },
    { dias: 'Sábado', horas: '9h às 14h', schema: 'Sa 09:00-14:00' },
  ],
  redes: { instagram: 'https://www.instagram.com/mateusgames', facebook: 'https://www.facebook.com/mateusgames' },
  garantiaPadraoLojaDias: 90,
  descontoPixLabel: 'no Pix ou dinheiro',
  avaliacaoGoogle: { nota: 4.9, total: 312 },
} as const;
