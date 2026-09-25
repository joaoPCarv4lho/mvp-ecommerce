# Mateus Games — MVP de e-commerce

Loja de videogames de Joinville/SC: venda de consoles, jogos e acessórios (novos e usados
revisados), gift cards, troca de games e assistência técnica. Mobile-first, em português do
Brasil, com pagamento e frete **simulados**.

O MVP responde aos 34 problemas levantados no relatório do site antigo
(`prompt-mvp-ecommerce.md` §12); a tabela de rastreabilidade com a evidência de cada um está
no fim deste arquivo.

```
seed/        dados de origem (JSON) — um único lugar para produtos, serviços, trocas, FAQ
frontend/    Vite + React 18 + TypeScript + Tailwind + React Router + Zustand
backend/     FastAPI + SQLAlchemy async + Postgres (mesma API que o mock)
deploy/      mapa de redirecionamentos 301 para o nginx
docs/        plano, especificação, relatórios do Lighthouse e capturas do E2E
```

## Como rodar

Pré-requisitos: Node 20+ e (para o modo API) Python 3.11+ e Docker.

### Modo mock (padrão, sem backend)

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Os dados vêm de `seed/*.json` através de `src/data/mockApi.ts`. É o modo usado nos testes, no
prerender e no Lighthouse.

### Modo API (FastAPI + Postgres)

```bash
docker compose up -d --wait db                      # Postgres 16 na porta 5432
docker compose up api                               # API em http://localhost:8000
# ou, sem Docker para a API:
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
DATABASE_URL="postgresql+asyncpg://mateus:mateus@localhost:5432/mateusgames" \
  .venv/bin/python -m uvicorn app.main:app --port 8000

cd frontend && VITE_DATA_SOURCE=api npm run dev     # o dev server faz proxy de /api
```

O banco é criado e populado a partir de `seed/` no primeiro start. Para conferir um pedido:

```bash
docker compose exec db psql -U mateus -d mateusgames -c "select numero, total from orders"
```

### Testes

```bash
cd frontend && npm test          # 182 testes (Vitest + Testing Library)
cd backend  && pytest -q         # 25 testes (pytest + httpx)
```

### Build completo (imagens, sitemap, build, prerender, critérios de aceite)

```bash
cd frontend && npm run build:full
```

A etapa de prerender abre cada rota do sitemap no Chromium e grava o HTML renderizado em
`dist/<rota>/index.html`; a etapa final roda `scripts/check-acceptance.mjs`, que falha se
qualquer critério de aceite regredir.

### E2E e Lighthouse

```bash
cd frontend
npm run e2e          # 21 verificações nas 8 jornadas, capturas em docs/e2e/
npm run lighthouse   # relatórios em docs/lighthouse/, falha se Performance < 90 ou A11y < 95
```

Em ambientes onde o Playwright não pode baixar o próprio navegador, aponte para um Chromium já
instalado: `CHROMIUM_PATH=/caminho/para/chromium npm run build:full`.

## Decisões de projeto

- **Uma fonte de dados.** `seed/*.json` alimenta o mock do frontend e o seed do backend, então a
  mesma vitrine aparece nos dois modos. Datas relativas (`+30d`, `-400d`) são resolvidas na
  carga, para que cenários como "garantia vencendo" continuem válidos com o tempo.
- **Regras de negócio como funções puras.** Preço, garantia, pré-venda, disponibilidade, busca,
  frete e slug vivem em `frontend/src/domain/` com testes unitários; o backend espelha validação
  e busca em Python. Nenhum componente decide regra de negócio.
- **Serviços trocáveis.** As páginas só falam com `src/services/*`, que escolhe entre a API real
  e o mock por `VITE_DATA_SOURCE`. O mock é carregado sob demanda, fora do bundle principal.
- **Preço sempre por `formatPrice`.** Nenhuma string de preço é concatenada à mão; o total do
  cartão é sempre `parcelas × valor da parcela` ao centavo, então as duas linhas nunca divergem.
- **Prerender em vez de SSR.** Cada rota indexável é renderizada no build e servida como HTML
  pronto, com `<title>`, description, canonical e JSON-LD próprios. O React só monta depois que
  o chunk da rota e a fonte de dados chegam, para não substituir o conteúdo por um esqueleto de
  carregamento (era a causa de um CLS de 0,7 na página de produto).
- **Mobile-first.** Grid de 2 colunas, drawer de filtros e de menu, barra fixa de compra que só
  aparece quando o botão "Comprar" sai da tela — garantindo um único botão primário visível.
- **Acessibilidade como requisito.** Alvos de 44px, foco visível, erros ligados por
  `aria-describedby`, avisos em componente de alerta (nunca em caixa alta) e `aria-live` no
  carrinho. Lighthouse de acessibilidade em 100 nas duas páginas medidas.
- **Sem embeds sociais.** Nenhum iframe ou script de rede social: era a maior fonte de peso e de
  quebra no site antigo. O Instagram aparece como link.

## Lighthouse (mobile, throttling padrão)

| Página | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| `/` | 94 | 100 | 100 | 100 |
| `/produto/playstation-5-pro-2tb-lacrado` | 96 | 100 | 100 | 100 |

Relatórios completos em `docs/lighthouse/*.report.html`. Os números variam alguns pontos entre
execuções; o script falha abaixo de 90 (Performance) ou 95 (Acessibilidade).

## Redirecionamentos 301

O site antigo servia a mesma página em quatro endereços: `http://`, `https://`, com e sem `www`,
e ainda por `index.php?_route_=…`. O arquivo `deploy/nginx-redirects.conf` resolve os três casos:

1. **http → https** e **sem www → com www**: dois `server` blocks que devolvem 301 para
   `https://www.mateusgames.com.br$request_uri`.
2. **`index.php?_route_=X` → `/X`**: um `map` traduz a rota antiga para a URL amigável
   (`playstation` → `/playstation`, `usados` → `/produtos?condicao=usado`, slug longo →
   `/produto/<slug>`).
3. **`product/product&product_id=42`**: o id não é recuperável como slug, então cai em
   `/produtos`. Um 301 para o produto errado seria pior que um 301 para a listagem.

O mesmo mapa existe no cliente (`src/pages/LegacyRedirect.tsx`) para quem chegar a
`/index.php?...` sem passar pelo nginx. Toda página tem um `<link rel="canonical">` único,
verificado no build (critério #27).

## Recomendação para o blog

O blog antigo está parado desde 2019 e a maior parte dos posts aponta para links `goo.gl`
desligados. Para o MVP ele ficou fora do ar. A recomendação:

1. **Arquivar** todos os posts (exportar o conteúdo em Markdown) antes de qualquer mudança.
2. **301** dos poucos posts que ainda têm busca ativa para a página de serviço ou categoria
   correspondente (por exemplo, "como limpar o PS4" → `/assistencia-tecnica`).
3. **410 Gone** para os posts cujo único valor era o link encurtado morto: dizer ao Google que
   sumiram de propósito é melhor que manter 404 ou redirecionar tudo para a home.
4. **Revisitar depois do MVP**, com pauta ligada às jornadas (guias de troca, comparativos de
   console, diagnóstico de defeitos) e um responsável por publicar — blog sem cadência volta a
   ser passivo de SEO.

## Próximos passos

- Gateway de pagamento real (Pix dinâmico e cartão), hoje simulado no checkout.
- Frete real por CEP (correios/transportadora) no lugar da tabela mock de `domain/shipping.ts`.
- Painel administrativo para cadastro de produtos, com a validação de `validateProductInput`.
- Autenticação e histórico de pedidos (a conta é opcional e hoje é um stub).
- CDN de imagens com transformação sob demanda, no lugar dos WebP gerados no build.
- Busca full-text no Postgres (hoje a busca do backend normaliza e casa sinônimos em Python).
- Integração real com o WhatsApp Business API para os formulários de orçamento e troca.

## Rastreabilidade (§12)

Evidência: `vitest` = nome do teste em `frontend/src`, `pytest` = teste do backend,
`check #N` = linha do `scripts/check-acceptance.mjs`, `E2E` = passo do `scripts/e2e.mjs`.

| # | Problema | Situação | Evidência |
|---|---|---|---|
| 1 | Pré-vendas de 2018/2023 visíveis | ✅ | vitest `past release (2018) → normal product`, `expired campaign filtered out`; check #1 |
| 2 | Garantia vencida no título | ✅ | vitest `no name contains "garantia" or "Playstation"`, `expired warranty shows no "Garantia até" badge`; check #2 |
| 3 | "13 anos" vs "14 anos" | ✅ | vitest `About uses "Desde 2012" and never "há X anos"`; check #3 |
| 4 | Preço "R$R$" | ✅ | `formatPrice` (Intl) em todo preço; check #4 |
| 5 | Duas tabelas de parcelamento | ✅ | vitest `price block labels each installment table`, `mixed cart: parcelas × valorParcela equals the card total` |
| 6 | "À vista em dinheiro" / "inicial parcelado" | ✅ | check #6 |
| 7 | Usados sem estado da unidade | ✅ | vitest `used product shows mandatory used block…`, `rejects…`; pytest `test_used_requires_estado_and_acompanha` |
| 8 | Prazo sem motivo | ✅ | vitest `every label that mentions a deadline also has a reason in parentheses` |
| 9 | Ausência de prova social | ✅ | vitest `shows slogan, 3 journeys, reviews and no expired banner` |
| 10 | Menu com 60+ links | ✅ | vitest `main menu has at most 7 items and official spelling`; check #10; E2E 1 |
| 11 | Plataformas antigas misturadas | ✅ | vitest `PS3/360/Wii U/3DS only in retro`; check #11 |
| 12 | Grafia "Playstation" | ✅ | check #12 (src, seed e HTML gerado) |
| 13 | Assistência técnica vazia | ✅ | vitest `lists 6 services and builds WhatsApp quote with form data`; E2E 4 |
| 14 | Widget social quebrado | ✅ | check #14 (nenhum iframe/script social) |
| 15 | Troca sem fluxo | ✅ | vitest `completes 3 steps and shows summary with WhatsApp CTA`; E2E 3 |
| 16 | Busca limitada | ✅ | vitest `"play 5" finds PS5`, `no results shows WhatsApp CTA with the term`; pytest `test_ps5_synonyms_equivalent`; E2E 6 |
| 17 | Home sem as 3 jornadas | ✅ | vitest `shows slogan, 3 journeys…`; E2E 2 |
| 18 | WhatsApp perdido no texto | ✅ | vitest `product message contains name and url`; E2E 8 |
| 19 | Carrinho vazio pobre | ✅ | vitest `empty cart shows suggestions and back button`; E2E 7 |
| 20 | Checkout sem Pix/retirada em destaque | ✅ | vitest `completes an order without creating an account`; E2E 2 |
| 21 | Nome da loja com "…." | ✅ | check #21 |
| 22 | Descrição colada na listagem | ✅ | vitest `product card is an article without the technical description`, `rejects glued text like 1TBControle`; check #22 |
| 23 | Avisos em CAIXA ALTA | ✅ | check #23 (classe `uppercase` e blocos de texto maiúsculos no HTML) |
| 24 | Texto institucional em todo rodapé | ✅ | vitest `shell renders skip link, cart count, footer and WhatsApp, with no primary button`; o texto institucional vive só em `/sobre` |
| 25 | Título da home com "…." | ✅ | check #25 (`<title>` igual a `storeConfig.seoTitleHome`) |
| 26 | URLs sem números (`playstation--…`) | ✅ | vitest `matches the spec example`, `never has -- nor trailing/leading -`; pytest `test_slugify_spec_example` |
| 27 | Conteúdo duplicado (www, index.php, http) | ✅ | check #27; `deploy/nginx-redirects.conf`; vitest `maps category routes containing platform words to the platform` |
| 28 | Sem dados estruturados | ✅ | vitest `product offer has price, availability and used condition`, `store has address, geo, hours, phone`; check #28 |
| 29 | robots.txt bloqueando tudo | ✅ | check #29 (só `/carrinho`, `/checkout`, `/conta`, `/admin`) |
| 30 | Blog parado com links goo.gl | ✅ | recomendação documentada acima (fora do escopo do MVP, por decisão) |
| 31 | Identidade visual sem o slogan | ✅ | tokens em `src/styles/tokens.css`; vitest `white on action and brand ≥ 4.5:1`; hero com o slogan |
| 32 | Experiência mobile fraca | ✅ | E2E 1 (360px sem scroll horizontal em `/`, `/produtos`, produto e `/checkout`; drawer; barra fixa) |
| 33 | Performance/embeds pesados | ✅ | Lighthouse Performance 94 (home) e 96 (produto) |
| 34 | Acessibilidade e "clique aqui" | ✅ | Lighthouse Acessibilidade 100/100; check #34 |

### Observações de ambiente

- O smoke do **modo API** desta entrega rodou com a mesma aplicação FastAPI sobre SQLite
  (`DATABASE_URL=sqlite+aiosqlite:///./smoke.db`), porque o container de desenvolvimento não tem
  Docker; a jornada de compra completou e o pedido foi gravado (`MG-20260925-9C53`, R$ 2.999,00).
  Com Docker disponível, o mesmo caminho roda contra o Postgres pelo `docker compose` acima.
- Pagamento, frete, protocolo de troca e envio de gift card são simulados, como pede o escopo.
