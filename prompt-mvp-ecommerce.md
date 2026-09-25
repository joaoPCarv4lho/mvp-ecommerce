# PROMPT — Protótipo (MVP) de E-commerce

## 1. Papel

Você é um engenheiro de software full-stack sênior com especialização em UX/UI e e-commerce. Você vai construir um protótipo funcional (MVP) de uma loja virtual para a **Mateus Games**, loja física de videogames em Joinville/SC. A loja vende consoles, jogos e acessórios novos e usados, faz troca de games e oferece assistência técnica.

O protótipo deve resolver os problemas que uma auditoria de UX encontrou no site atual. A seção 12 traz a lista de rastreabilidade. Todo item dessa lista precisa ser atendido e verificável.

## 2. Objetivo do MVP

Entregar um e-commerce **mobile-first**, navegável de ponta a ponta, que:

1. Transmita **confiança**: nenhum conteúdo vencido, preços claros e corretos, e informação completa sobre produtos usados.
2. Atenda às **4 jornadas principais**:
   - comprar um produto;
   - trocar um game ou console;
   - pedir orçamento de assistência técnica;
   - comprar um gift card.
3. Tenha **navegação simples**, com um menu de no máximo 7 itens e filtros no lugar de árvores duplicadas.
4. Tenha uma **base técnica de SEO correta**: URLs limpas, canonical, dados estruturados e HTTPS.
5. Seja **rápido e acessível**, dentro das metas de Core Web Vitals e do WCAG 2.1 AA.

## 3. Stack e arquitetura

**Frontend**
- React 18, TypeScript, Vite e React Router.
- Tailwind CSS para estilo.
- Estado do carrinho em Zustand ou Context, persistido em memória durante a sessão.

**Backend**
- FastAPI com Pydantic v2 e SQLAlchemy 2.0 async.
- PostgreSQL como banco.
- Se o tempo for curto, a primeira versão pode usar uma camada de dados mockada em JSON/TS com a **mesma interface** da API. Nesse caso, todo acesso a dados passa por `src/services/*`, para a troca pela API real não exigir mudanças nos componentes.

**Estrutura de pastas sugerida (frontend)**
```
src/
  components/   (ui/, product/, layout/, forms/)
  pages/
  services/     (products.ts, categories.ts, orders.ts — interface única)
  domain/       (regras puras: preço, garantia, slug, disponibilidade)
  data/         (mocks)
  hooks/
  styles/
```

**Regra de ouro:** toda regra de negócio fica em `domain/` como função pura e com teste unitário (Vitest). É o caso de formatação de preço, validade de garantia, expiração de pré-venda e geração de slug.

## 4. Design system mínimo

Crie tokens em CSS (`:root`) e exponha-os no Tailwind.

**Cores**
- 1 cor primária da marca.
- 1 cor de ação, usada só em botões de compra e CTA principal.
- Cores de estado: sucesso, alerta, erro e info.
- Neutros para fundo, superfície, borda e texto.
- Todas precisam de contraste mínimo de 4.5:1 para texto.

**Tipografia**
- 1 família, com 2 pesos (regular e bold).
- Escala: 12, 14, 16, 20, 24 e 32px.
- **Proibido** usar caixa alta em blocos de texto.

**Espaçamento e forma**
- Espaçamento: 4, 8, 16, 24, 32 e 48px.
- Raio de borda e sombra padronizados.

**Identidade**
- Visual moderno com toques retrô: ícones ou selos em pixel art e estados vazios ilustrados.
- Usar o slogan "A diversão de hoje é a nostalgia de amanhã" no hero.

**Componentes base**
- Button (primary, secondary, ghost) e Badge/Selo.
- Card de produto e PriceBlock.
- Accordion, Modal, Drawer e Toast.
- Input, Select e RadioCard.
- Stepper, Breadcrumb, EmptyState e Skeleton.

**Regras**
- Um único botão primário por tela.
- Áreas de toque de no mínimo 44x44px.

## 5. Arquitetura de informação

### 5.1 Menu principal (máximo 7 itens)
```
PlayStation | Xbox | Nintendo | Retrô & Clássicos | Usados & Seminovos | Gift Cards | Serviços ▾ (Assistência Técnica, Troque seu Game)
```

**Comportamento no mobile**
- Menu em drawer.
- Subcategorias em segundo nível: Consoles, Jogos, Controles e Acessórios, Headsets.

### 5.2 Regras de categorização
- **Novo ou usado é filtro, não categoria.** "Usados & Seminovos" é um atalho que abre a listagem geral com o filtro `condicao=usado` aplicado.
- **Gift cards** existem só como categoria própria, com filtro por plataforma. Não se repetem dentro de cada console.
- **Plataformas descontinuadas** (PS3, Xbox 360, Wii U, 3DS e anteriores) ficam em "Retrô & Clássicos".
- **Grafia oficial obrigatória:** "PlayStation", "Xbox Series X|S" e "Nintendo Switch".

### 5.3 Filtros da listagem
- Plataforma e condição (Novo, Usado, Lacrado).
- Faixa de preço.
- Disponibilidade: em estoque ou retirada imediata.
- Tipo: console, jogo, acessório ou gift card.
- Os filtros ficam refletidos na URL (query string), para permitir compartilhar.

### 5.4 Busca
- Sempre visível no header, inclusive no mobile.
- Autocompletar com miniatura, nome e preço, a partir de 2 caracteres.
- Normalização e sinônimos: "ps5", "play 5" e "playstation 5" retornam o mesmo resultado. Ignorar acentos e caixa.
- Página sem resultados com sugestões e o CTA "Não achou? A gente procura pra você", que abre o WhatsApp com o termo buscado.

## 6. Páginas e jornadas

### 6.1 Home, nesta ordem
1. **Hero** com o slogan e 3 cards de jornada: [Comprar games] [Trocar meu game] [Consertar meu console].
2. **Faixa de benefícios:** retirada grátis na loja em Joinville, usados revisados com garantia, parcelamento em até 12x e "Desde 2012" (usar o ano de fundação, nunca "há X anos").
3. **Vitrine "Chegou agora":** usados recém-cadastrados, ordenados por data de entrada.
4. **Destaques** por plataforma.
5. **Gift cards** com compra rápida.
6. **Avaliações de clientes** (mock no formato do Google).
7. **Loja física:** endereço, horário, mapa (placeholder) e link para o Instagram em destaque.

### 6.2 Listagem de categoria
- Grid com 2 colunas no mobile e 4 no desktop.
- Breadcrumb e contador de resultados.
- Ordenação: relevância, menor preço, maior preço e mais recentes.
- **Card de produto**
  - Foto 1:1 com fundo uniforme e nome padronizado.
  - Uma linha de atributos-chave (ex.: "1TB · Com leitor · Usado").
  - Selos, preço à vista em destaque, parcelado menor e botão visível.
  - **Nunca exibir descrição na listagem.**

### 6.3 Página de produto

**Acima da dobra**
- Galeria e nome padronizado.
- Selos: Novo, Usado — Revisado, Lacrado, Garantia e Últimas unidades.
- PriceBlock, botão "Comprar" e botão secundário "Tirar dúvida no WhatsApp".
- Calculadora de frete (mock) e opção "Retirar na loja — grátis".

**Bloco obrigatório para usados**
- Estado de conservação: Excelente, Muito bom ou Bom, com legenda explicando cada nível.
- O que acompanha: checklist de console, controles, cabos, caixa e jogo.
- "Revisado pela assistência Joinville Games em DD/MM/AAAA".
- Garantia da loja, calculada (ver regra 7.2).
- Fotos reais da unidade, com destaque para marcas de uso.

**Avisos críticos**
- Exemplos: "Não acompanha o jogo", "Somente mídia digital".
- Aparecem como componente de alerta (ícone e fundo de aviso), nunca como texto em caixa alta.

**Abaixo da dobra**
- Descrição técnica em accordion (recolhido por padrão).
- Produtos relacionados.

**Mobile**
- Barra inferior fixa com o preço e o botão Comprar.

### 6.4 Carrinho
- Lista de itens, quantidade, subtotal e frete ou retirada.
- Resumo com os preços no Pix e no cartão.
- **Carrinho vazio:** EmptyState ilustrado, sugestões (mais vendidos e gift cards) e botão "Voltar às compras". Nada de texto institucional.

### 6.5 Checkout
- Stepper: Carrinho → Identificação → Entrega → Pagamento → Confirmação.
- Compra **sem cadastro obrigatório** (guest checkout). Oferecer a criação de conta só na confirmação.
- Entrega: "Retirar na loja — grátis" pré-selecionado, ou entrega com CEP.
- Pagamento: **Pix em destaque** (com o desconto à vista) e cartão com parcelamento. Tudo simulado.
- Confirmação com número do pedido, resumo e próximos passos.

### 6.6 Assistência Técnica
- Lista de serviços em cards, cada um com descrição, "a partir de R$", prazo médio e garantia do serviço. Exemplos: limpeza e troca de pasta térmica, reparo de porta HDMI, drift de analógico, troca de leitor e reparo de fonte.
- Fotos da bancada (placeholder).
- Formulário "Solicitar orçamento" com console, problema e o campo opcional "Como aconteceu?".
- Ao enviar, abre o WhatsApp com a mensagem pré-preenchida e mostra a confirmação na tela.
- FAQ em accordion.
- **Nenhum embed de rede social.**

### 6.7 Troque seu Game (fluxo guiado em 3 passos)
1. **O que você tem:** plataforma, tipo (console ou jogo) e modelo ou título. A lista vem da tabela de itens aceitos.
2. **Estado:** RadioCards com descrição de cada nível e o que acompanha.
3. **O que você quer:** crédito na loja, dinheiro ou um produto específico (busca).

**Resumo final**
- CTA que envia tudo ao WhatsApp e/ou gera um protocolo.
- Explicar: "traga na loja", "avaliação em até X minutos" e "o valor pode virar crédito ou dinheiro".
- Mostrar a lista de itens aceitos e não aceitos em tabela clara.

### 6.8 Gift Cards
- Filtro por plataforma: PlayStation, Xbox, Nintendo, Steam, Google Play e Roblox.
- Escolha de valor e compra rápida.
- Explicar como a entrega é feita (código por e-mail/WhatsApp).
- Indicar a região ("válido para contas Brasil").

### 6.9 Institucional e contato
- Sobre (com "desde 2012"), contato, endereço, horário e políticas: troca, garantia e privacidade.
- **Texto institucional em página própria, não repetido no rodapé de todas as páginas.**

### 6.10 Componentes globais
- **Header:** logo, busca, conta e carrinho com contador.
- **Botão flutuante de WhatsApp** com mensagem contextual:
  - em página de produto: "Olá! Tenho interesse em: {nome} — {url}";
  - em outras páginas: mensagem genérica com o nome da página.
- **Rodapé:** links úteis, redes sociais (só links, sem embeds), formas de pagamento, endereço e selo de avaliações.

## 7. Regras de negócio (implementar em `domain/` com testes)

### 7.1 Preço — `formatPrice(value: number): string`
- Usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Nunca** concatenar "R$" manualmente. Teste: nenhuma saída pode conter "R$R$".

**Modelo de preço do produto**
```ts
{ precoAVista: number; precoParcelado: number; parcelasMax: number; jurosMensal?: number }
```

**PriceBlock**
- Linha 1, em destaque: "R$ 2.999,00 no Pix ou dinheiro" com o selo "economize X%" (calculado).
- Linha 2: "ou R$ 3.199,90 em até 12x de R$ 266,66 no cartão".
- Link "Ver todas as parcelas", que abre um modal com **uma única tabela**, rotulada com o meio de pagamento.
- Se houver um segundo meio (ex.: crediário), usar uma aba separada e **rotulada**. Nunca duas tabelas sem rótulo.

**Consistência**
- `parcelas × valorParcela` deve bater com o total exibido.
- Proibido mostrar valores diferentes para o mesmo meio de pagamento.

### 7.2 Garantia — `getWarrantyStatus(produto, hoje)`
- A garantia é um **campo de dados** (`garantiaTipo: 'loja' | 'fabrica'`, `garantiaAte: Date` ou `garantiaMeses`), **nunca parte do título**.
- **Status**
  - Ativa: selo "Garantia até MM/AAAA".
  - Vence em 30 dias ou menos: selo de alerta.
  - Vencida: o selo desaparece. Se for usado da loja, aplica-se a garantia padrão da loja (ex.: 90 dias a partir da compra).
- Teste com datas passadas, futuras e limítrofes.

### 7.3 Pré-venda — `isPreOrderActive(produto, hoje)`
- O produto de pré-venda tem `dataLancamento`.
- Após o lançamento, ele vira produto normal automaticamente e o texto "será lançado em" some.
- Campanhas e banners têm `inicio` e `fim` e **não são renderizados fora do período**.

### 7.4 Slug — `slugify(texto)`
- Converter acentos (até → ate) e caixa baixa.
- **Manter números.** Ex.: "PlayStation 5 Slim 1TB com Leitor (Usado)" → `playstation-5-slim-1tb-com-leitor-usado`.
- Remover caracteres especiais, colapsar hífens e remover hífen nas pontas.
- Garantir unicidade com sufixo, se necessário.
- Teste: nenhum slug pode conter `--` nem terminar com `-`.

### 7.5 Nome padronizado — `buildProductName(produto)`
- Formato: `{Plataforma} {Modelo} {Capacidade} {Edição} — {Condição}`, com a grafia oficial das marcas.
- Validação de cadastro: impedir texto colado sem espaço (ex.: "1TBControle") e setas "->".

### 7.6 Disponibilidade
- Mensagens explícitas:
  - "Em estoque — retire hoje";
  - "Disponível em 2 a 3 dias úteis (em revisão técnica)";
  - "Esgotado — avise-me".
- Nunca exibir um prazo sem o motivo.

### 7.7 Dados institucionais
- Arquivo único de configuração (`storeConfig`): nome da loja, ano de fundação, endereço, horário, WhatsApp e redes.
- O **nome da loja é "Mateus Games"**. O título de SEO fica em um campo separado.
- Qualquer "anos de mercado" é calculado a partir do ano de fundação.

## 8. SEO técnico

**URLs**
- Formato: `/{plataforma}/{categoria}/{slug}` e `/produto/{slug}`. Escolha **um** padrão canônico por produto.
- Toda página de produto e de categoria tem `<link rel="canonical">`.
- Simular (ou documentar) redirecionamentos 301:
  - de `index.php?_route_=` para URL amigável;
  - de sem-www para www;
  - de http para https.

**Títulos**
- Home: "Mateus Games | Loja de Videogames em Joinville — Venda, Troca e Assistência" (sem reticências).
- Produto: "{Nome do produto} | Mateus Games".

**Meta tags**
- Meta description única por página.
- Open Graph com imagem, para compartilhar bem no WhatsApp e Instagram.

**Dados estruturados (JSON-LD)**
- `LocalBusiness` / `Store`: endereço, horário, telefone e geo.
- `Product` + `Offer`: preço, disponibilidade e `itemCondition` (`NewCondition` / `UsedCondition`).
- `BreadcrumbList` e `FAQPage` (na assistência).

**Rastreamento**
- `robots.txt` bloqueia só carrinho, checkout, conta e admin. Produtos, categorias e serviços ficam rastreáveis.
- `sitemap.xml` gerado a partir dos produtos e categorias.

**SEO local**
- A página de assistência deve ter texto focado em "conserto de videogame em Joinville".

**Blog:** fora do escopo do MVP. Documentar a recomendação de arquivar e redirecionar.

## 9. Performance e acessibilidade

**Metas de performance (mobile, Lighthouse)**
- Performance ≥ 90.
- LCP < 2,5s, CLS < 0,1 e INP < 200ms.

**Performance**
- Imagens em WebP/AVIF com `width`/`height` definidos, lazy loading abaixo da dobra e `srcset`.
- Code splitting por rota.
- Skeletons durante o carregamento.
- Nenhum script de terceiros bloqueante e nenhum embed de rede social.

**Acessibilidade (WCAG 2.1 AA)**
- Contraste de 4.5:1 e foco visível.
- Navegação completa por teclado.
- `alt` descritivo em toda imagem de produto (ex.: "PlayStation 5 Slim usado, vista frontal").
- Links com texto significativo: **proibido "clique aqui"**.
- Formulários com `label`, mensagens de erro associadas e `aria-live` no carrinho.
- Lighthouse Accessibility ≥ 95.

## 10. Dados mockados (seed)

**Mínimo de conteúdo**
- ~30 produtos cobrindo todas as plataformas (incluindo retrô), novos e usados, e gift cards.
- Cenários de teste obrigatórios:
  - produto com pré-venda **já lançada**, que deve aparecer como normal;
  - produto com pré-venda futura;
  - usado com garantia **vencida**, sem selo de garantia vencida;
  - usado com garantia vencendo em menos de 30 dias;
  - banner com período **encerrado**, que não deve aparecer;
  - produto com aviso "Não acompanha o jogo";
  - produto "em revisão técnica" (2 a 3 dias úteis).
- 6 serviços de assistência, a tabela de itens aceitos na troca e 5 avaliações de clientes.

**Imagens:** placeholders genéricos. Não usar arte de capa de jogos nem imagens protegidas; usar ilustrações neutras de console/controle.

## 11. Fora do escopo do MVP
- Gateway de pagamento real (simular Pix e cartão).
- Cálculo real de frete (mock por faixa de CEP).
- Painel administrativo completo. Um CRUD simples de produtos é opcional.
- Blog.
- Integração real com a API do WhatsApp (usar links `wa.me` com texto codificado).

## 12. Rastreabilidade: problema do relatório → solução → critério de aceite

| # | Problema encontrado | Solução no MVP | Critério de aceite |
|---|---|---|---|
| 1 | Pré-vendas de 2018/2023 ainda visíveis | Regra 7.3 + período em campanhas | Seed com pré-venda passada aparece como produto normal; banner expirado não renderiza |
| 2 | Garantia vencida no título do produto | Garantia como campo + regra 7.2 | Nenhum título contém "garantia"; produto vencido não exibe selo |
| 3 | "13 anos" vs "14 anos" | `storeConfig` + "desde 2012" | Busca no código por "anos de mercado" fixo retorna vazio |
| 4 | Preço "R$R$" | `formatPrice` com Intl | Teste unitário garante ausência de "R$R$" |
| 5 | Duas tabelas de parcelamento conflitantes | PriceBlock + modal com tabela única rotulada | Um meio de pagamento = uma tabela; soma das parcelas confere |
| 6 | "À vista em dinheiro" / "inicial parcelado" | Novos rótulos Pix/cartão + % de economia | Termos antigos não existem na UI |
| 7 | Usados sem estado da unidade | Bloco obrigatório de usados | Cadastro de usado sem estado/acompanha é inválido |
| 8 | Prazo "2 a 3 dias" sem motivo | Regra 7.6 | Todo prazo exibe o motivo |
| 9 | Ausência de prova social | Avaliações na home e selo no rodapé | Seção visível na home |
| 10 | Menu com 60+ links duplicados | Menu com 7 itens + filtros | Menu principal ≤ 7 itens; sem árvore paralela de usados |
| 11 | Plataformas antigas misturadas | Categoria "Retrô & Clássicos" | PS3/360/Wii U/3DS só nessa categoria |
| 12 | Grafia "Playstation" e rótulos ambíguos | Grafia oficial + rótulos claros | Nenhuma ocorrência de "Playstation" na UI |
| 13 | Assistência técnica vazia | Página completa + orçamento | Formulário gera mensagem de WhatsApp com os dados |
| 14 | Widget do Twitter/X quebrado | Proibido embed social | Nenhum iframe/script de rede social |
| 15 | Troca sem fluxo | Wizard em 3 passos | Fluxo completo gera resumo e CTA |
| 16 | Busca limitada | Busca com sinônimos e autocompletar | "play 5" retorna produtos de PS5; página sem resultado tem CTA |
| 17 | Home sem as 3 jornadas | Hero com 3 caminhos | Cada card leva à jornada correta |
| 18 | WhatsApp perdido no texto | Botão flutuante contextual | Em produto, a mensagem contém nome e URL |
| 19 | Carrinho vazio pobre | EmptyState com sugestões | Carrinho vazio mostra produtos sugeridos |
| 20 | Checkout sem destaque para Pix/retirada | Guest checkout, Pix e retirada em destaque | Compra concluída sem criar conta |
| 21 | Nome da loja com "\| Venda, troca...." | `storeConfig.nome` separado do título SEO | Nenhuma string com "...." na UI |
| 22 | Descrições cortadas/coladas na listagem | Card sem descrição + validação 7.5 | Listagem não exibe descrição; validação barra "1TBControle" |
| 23 | Avisos em CAIXA ALTA | Componente de alerta | Nenhum bloco de texto todo em caixa alta |
| 24 | Texto institucional repetido em todas as páginas | Página "Sobre" própria | Rodapé sem parágrafo institucional |
| 25 | Título da home com "...." | Título SEO definido na seção 8 | Validado no `<title>` |
| 26 | URLs sem números (`playstation--...`) | `slugify` 7.4 | Teste: sem `--`, números preservados |
| 27 | Conteúdo duplicado (www, index.php, http) | Canonical + mapa de 301 | Toda página tem canonical único |
| 28 | Sem dados estruturados/SEO local | JSON-LD + textos locais | Valida no Rich Results Test (JSON-LD sem erros) |
| 29 | robots.txt bloqueando tudo | robots seletivo + sitemap | Produtos e serviços permitidos |
| 30 | Blog parado com links goo.gl | Fora do MVP; recomendação documentada | README traz o plano do blog |
| 31 | Identidade visual não explora o slogan | Design system + hero com slogan | Tokens definidos e aplicados |
| 32 | Experiência mobile fraca | Mobile-first, drawer, barra fixa de compra | Testado em 360px sem scroll horizontal |
| 33 | Performance/embeds pesados | Seção 9 | Lighthouse mobile ≥ 90 |
| 34 | Acessibilidade ("clique aqui", alt) | Seção 9 | Lighthouse a11y ≥ 95; sem "clique aqui" |

## 13. Entregáveis
1. Código-fonte organizado conforme a seção 3, rodando com `npm install && npm run dev`, e o backend com `uvicorn`, se implementado.
2. Testes unitários das regras da seção 7, todos passando.
3. `README.md` com:
   - como rodar o projeto;
   - decisões de design;
   - a tabela da seção 12 com status (✅/⚠️);
   - mapa de redirecionamentos 301;
   - recomendação para o blog;
   - próximos passos (gateway real, frete real, painel admin).
4. Relatório Lighthouse (mobile) da home e de uma página de produto.

## 14. Forma de trabalho
- Comece mostrando o plano: estrutura de pastas, modelo de dados e lista de rotas. Depois implemente por fases:
  1. design system e layout;
  2. catálogo e produto;
  3. carrinho e checkout;
  4. serviços (assistência, troca, gift cards);
  5. SEO, performance e acessibilidade.
- Ao final de cada fase, marque quais itens da tabela da seção 12 foram atendidos.
- Na dúvida entre duas soluções, escolha a que **aumenta a confiança do cliente** e reduz o atendimento manual no WhatsApp.
