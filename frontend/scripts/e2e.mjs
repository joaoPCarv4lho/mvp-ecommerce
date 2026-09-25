/**
 * End-to-end check of the prerendered mock build (§12 journeys).
 *
 * Serves dist/ on :4180, drives Chromium through the eight journeys the plan lists and
 * writes one screenshot per journey to docs/e2e/. Exits 1 on the first failed expectation.
 * CHROMIUM_PATH points at a preinstalled browser when Playwright's own download is unavailable.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from './routes.mjs';

const PORT = 4180;
const BASE = `http://localhost:${PORT}`;
const DIST = join(ROOT, 'frontend', 'dist');
const SHOTS = join(ROOT, 'docs', 'e2e');
const MOBILE = { width: 360, height: 740 };

const failures = [];
const steps = [];
const ok = (label, condition, detail = '') => {
  if (condition) steps.push(`✅ ${label}`);
  else {
    steps.push(`❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
};

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`static server did not answer on ${BASE}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

mkdirSync(SHOTS, { recursive: true });
const server = spawn('npx', ['serve', DIST, '-s', '-l', String(PORT)], { cwd: join(ROOT, 'frontend'), stdio: 'ignore' });

try {
  await waitForServer();
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const context = await browser.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true });
  // wa.me links must never be followed: record what the page tried to open instead.
  await context.addInitScript(() => {
    window.__opened = null;
    window.open = (url) => {
      window.__opened = String(url);
      return null;
    };
  });
  const page = await context.newPage();
  const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });

  // ---------------------------------------------------------------- 1. mobile layout
  for (const route of ['/', '/produtos', '/produto/playstation-5-pro-2tb-lacrado']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    ok(`360px sem scroll horizontal em ${route}`, await noHorizontalScroll(page));
  }
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  const menuEntries = await page.locator('dialog[open] nav[aria-label="Menu principal"] > ul > li').count();
  ok('drawer do menu abre com 7 itens principais', menuEntries === 7, `${menuEntries} entradas`);
  await shot('01-menu-mobile');
  await page.keyboard.press('Escape');

  await page.goto(BASE + '/produto/playstation-5-pro-2tb-lacrado', { waitUntil: 'networkidle' });
  // The bar only shows while the in-page "Comprar" button is off screen, so exactly one primary CTA is visible.
  const sticky = page.locator('div.fixed.inset-x-0.bottom-0');
  const comprar = page.getByRole('button', { name: 'Comprar' }).first();
  await comprar.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  ok('barra fixa some quando o botão Comprar está visível', !(await sticky.isVisible()));
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(500);
  ok('barra fixa de compra aparece ao rolar', await sticky.isVisible());
  await shot('02-sticky-buy-bar');

  // ---------------------------------------------------------------- 8. contextual WhatsApp
  const waHref = await page.getByRole('link', { name: /WhatsApp/ }).first().getAttribute('href');
  const waText = decodeURIComponent(waHref ?? '');
  ok('WhatsApp do produto leva nome e URL', waText.includes('PlayStation 5 Pro') && waText.includes('/produto/playstation-5-pro-2tb-lacrado'), waText);

  // ---------------------------------------------------------------- 2. journey Comprar
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /Comprar games/ }).click();
  await page.waitForURL('**/produtos**');
  await page.locator('article a[href^="/produto/"]').first().click();
  await page.waitForURL('**/produto/**');
  await page.getByRole('button', { name: 'Comprar' }).first().click();
  await page.waitForURL('**/carrinho');
  await page.getByRole('heading', { name: 'Seu carrinho' }).waitFor({ timeout: 10000 });
  ok('produto entra no carrinho', true);
  await shot('03-carrinho');
  await page.getByRole('link', { name: 'Continuar para identificação' }).click();
  await page.waitForURL('**/checkout');
  ok('360px sem scroll horizontal em /checkout', await noHorizontalScroll(page));
  await page.getByLabel('Nome completo').fill('Ana Souza');
  await page.getByLabel('E-mail').fill('ana@exemplo.com');
  await page.getByLabel('Celular (WhatsApp)').fill('47999990000');
  await page.getByRole('button', { name: 'Continuar' }).click();
  ok('retirada na loja pré-selecionada', await page.getByLabel(/Retirar na loja — grátis/).isChecked());
  await page.getByRole('button', { name: 'Continuar' }).click();
  ok('Pix pré-selecionado', await page.getByLabel(/^Pix/).isChecked());
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await page.getByRole('heading', { name: 'Pedido confirmado!' }).waitFor({ timeout: 10000 });
  const numero = await page.getByText(/Número do pedido: MG-/).textContent();
  ok('compra concluída sem criar conta', /MG-\d{8}-[0-9A-F]{4}/.test(numero ?? ''), numero ?? '');
  await shot('04-pedido-confirmado');

  // ---------------------------------------------------------------- 3. journey Troca
  await page.goto(BASE + '/troque-seu-game', { waitUntil: 'networkidle' });
  await page.getByLabel('Plataforma').selectOption('PlayStation 4');
  await page.getByLabel(/^Console/).check({ force: true });
  await page.getByLabel('Modelo ou título').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel(/Muito bom/).check({ force: true });
  await page.getByLabel('Caixa').check({ force: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel(/Crédito na loja/).check({ force: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  const trocaHref = decodeURIComponent((await page.getByRole('link', { name: 'Enviar para o WhatsApp' }).getAttribute('href')) ?? '');
  ok(
    'resumo da troca vai para o WhatsApp com as escolhas',
    trocaHref.includes('Estado: Muito bom') && trocaHref.includes('Quero: Crédito na loja') && trocaHref.includes('Acompanha: Caixa'),
    trocaHref,
  );
  await shot('05-troca-resumo');

  // ---------------------------------------------------------------- 4. journey Assistência
  await page.goto(BASE + '/assistencia-tecnica', { waitUntil: 'networkidle' });
  await page.getByLabel('Console').selectOption('PlayStation 5');
  await page.getByLabel('Problema').selectOption('Reparo de porta HDMI');
  await page.getByLabel(/Como aconteceu\?/).fill('Cabo puxado');
  await page.getByRole('button', { name: 'Pedir orçamento no WhatsApp' }).click();
  const opened = decodeURIComponent((await page.evaluate(() => window.__opened)) ?? '');
  ok(
    'orçamento abre WhatsApp com console e problema',
    opened.includes('wa.me') && opened.includes('Console: PlayStation 5') && opened.includes('Problema: Reparo de porta HDMI'),
    opened,
  );
  ok('confirmação do orçamento aparece na tela', await page.getByText(/Pedido de orçamento enviado/).isVisible());
  await shot('06-assistencia');

  // ---------------------------------------------------------------- 5. journey Gift card
  await page.goto(BASE + '/gift-cards', { waitUntil: 'networkidle' });
  await page.getByText('Steam', { exact: true }).click();
  await page.waitForTimeout(200);
  const giftCards = await page.getByRole('article').count();
  ok('filtro de gift card por plataforma', giftCards === 1, `${giftCards} cards`);
  await page.getByRole('button', { name: /^R\$\s?100,00$/ }).click();
  await page.getByRole('button', { name: /Adicionar ao carrinho/ }).click();
  await page.goto(BASE + '/carrinho', { waitUntil: 'networkidle' });
  ok('carrinho mostra o valor do gift card', await page.getByText(/Valor do gift card: R\$\s?100,00/).isVisible());
  await shot('07-giftcard-carrinho');

  // ---------------------------------------------------------------- 6. busca
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('combobox', { name: /Buscar/ }).fill('play 5');
  await page.waitForTimeout(400);
  const sugestoes = await page.getByRole('option').allTextContents();
  ok('autocomplete de "play 5" traz PS5', sugestoes.some((s) => s.includes('PlayStation 5')), sugestoes.join(' | '));
  await shot('08-busca-autocomplete');
  await page.goto(BASE + '/busca?q=zzz', { waitUntil: 'networkidle' });
  const semResultado = await page.getByRole('link', { name: /Não achou/ }).getAttribute('href');
  ok('busca sem resultado tem CTA com o termo', decodeURIComponent(semResultado ?? '').includes('zzz'), semResultado ?? '');

  // ---------------------------------------------------------------- 7. carrinho vazio
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(BASE + '/carrinho', { waitUntil: 'networkidle' });
  ok('carrinho vazio mostra EmptyState', await page.getByText('Seu carrinho está vazio').isVisible());
  const sugeridos = await page.getByRole('article').count();
  ok('carrinho vazio sugere produtos', sugeridos > 0, `${sugeridos} cards`);
  await shot('09-carrinho-vazio');

  await browser.close();
} finally {
  server.kill();
}

for (const s of steps) console.log(s);
console.log(`\n${steps.length - failures.length}/${steps.length} E2E checks passed — screenshots in docs/e2e/`);
process.exit(failures.length ? 1 : 0);
