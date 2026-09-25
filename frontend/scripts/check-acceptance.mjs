import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './routes.mjs';

const SRC = join(ROOT, 'frontend', 'src');
const SEED = join(ROOT, 'seed');
const DIST = join(ROOT, 'frontend', 'dist');

function walk(dir, test) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, test));
    else if (test(full)) out.push(full);
  }
  return out;
}

const isCode = (f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\.tsx?$/.test(f);
const srcFiles = walk(SRC, isCode);
const seedFiles = walk(SEED, (f) => f.endsWith('.json'));
const htmlFiles = walk(DIST, (f) => f.endsWith('.html'));

const read = (f) => readFileSync(f, 'utf8');
const rel = (f) => relative(ROOT, f);
const cache = new Map();
const text = (f) => {
  if (!cache.has(f)) cache.set(f, read(f));
  return cache.get(f);
};

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

/** Each visible text node of a prerendered page, kept separate so per-block checks stay meaningful. */
function textNodes(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .split(/<[^>]+>/)
    .map((node) => decode(node).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Whole visible text of a page: no tags, no JSON-LD. */
const visibleText = (html) => textNodes(html).join(' ');

const results = [];
const check = (id, title, fn) => {
  let problems;
  try {
    problems = fn() ?? [];
  } catch (e) {
    problems = [`check threw: ${e.message}`];
  }
  results.push({ id, title, problems });
};

const findIn = (files, re, label = (f) => rel(f)) =>
  files.filter((f) => re.test(text(f))).map((f) => `${label(f)} contains ${re}`);

// ---------------------------------------------------------------- §12 checks

check(1, 'Pré-venda passada vira produto normal; banner expirado não renderiza', () => {
  const problems = htmlFiles.filter((f) => visibleText(text(f)).includes('Black Friday 2023')).map((f) => `${rel(f)} still shows the expired campaign`);
  const lancado = htmlFiles.filter((f) => /\/produto\/[^/]*lancado/.test(rel(f)));
  for (const f of lancado) if (visibleText(text(f)).includes('Será lançado')) problems.push(`${rel(f)} shows a release date for a product already launched`);
  return problems;
});

check(2, 'Nenhum título de produto contém "garantia"', () =>
  htmlFiles
    .filter((f) => rel(f).includes('dist/produto/'))
    .filter((f) => /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(text(f))?.[1]?.match(/garantia/i))
    .map((f) => `${rel(f)} has "garantia" in its <h1>`),
);

check(3, 'Sem "anos de mercado" nem "há X anos" (usa "Desde 2012")', () => [
  ...findIn(srcFiles, /anos de mercado|h[áa] \d+ anos/i),
  ...htmlFiles.filter((f) => /anos de mercado|h[áa] \d+ anos/i.test(visibleText(text(f)))).map((f) => `${rel(f)} contains an age string`),
]);

check(4, 'Sem "R$R$" nas páginas geradas', () => htmlFiles.filter((f) => visibleText(text(f)).includes('R$R$')).map((f) => `${rel(f)} contains R$R$`));

check(6, 'Sem os rótulos antigos de pagamento', () => [
  ...findIn(srcFiles, /à vista em dinheiro|inicial parcelado/i),
  ...htmlFiles.filter((f) => /à vista em dinheiro|inicial parcelado/i.test(visibleText(text(f)))).map((f) => `${rel(f)} uses an old payment label`),
]);

check(10, 'Menu principal com no máximo 7 itens', () => {
  const menu = read(join(SRC, 'components/layout/menu.ts'));
  const block = /export const MAIN_MENU[\s\S]*?\n\];/.exec(menu)?.[0] ?? '';
  const top = (block.match(/^ {2}\{/gm) ?? []).length;
  return top > 7 ? [`MAIN_MENU has ${top} top-level entries`] : [];
});

check(11, 'PS3, Xbox 360, Wii U e 3DS só em Retrô & Clássicos', () => {
  const retro = ['ps3', 'xbox-360', 'wii-u', '3ds', '2ds'];
  return htmlFiles
    .filter((f) => rel(f).includes('dist/produto/') && retro.some((r) => rel(f).includes(r)))
    .filter((f) => !visibleText(text(f)).includes('Retrô'))
    .map((f) => `${rel(f)} has no "Retrô" breadcrumb`);
});

check(12, 'Grafia oficial: nenhuma ocorrência de "Playstation"', () => [
  ...findIn(srcFiles, /Playstation/),
  ...findIn(seedFiles, /Playstation/),
  ...htmlFiles.filter((f) => text(f).includes('Playstation')).map((f) => `${rel(f)} contains "Playstation"`),
]);

check(14, 'Nenhum iframe ou script de rede social', () =>
  htmlFiles
    .filter((f) => /<iframe|platform\.twitter\.com|connect\.facebook\.net|instagram\.com\/embed/i.test(text(f)))
    .map((f) => `${rel(f)} embeds third-party social content`),
);

check(21, 'Nenhuma string com "...."', () => [
  ...findIn(srcFiles, /\.{4}/),
  ...htmlFiles.filter((f) => /\.{4}/.test(visibleText(text(f)))).map((f) => `${rel(f)} contains "...."`),
]);

check(22, 'Card de listagem não exibe descrição', () =>
  read(join(SRC, 'components/product/ProductCard.tsx')).includes('descricaoTecnica') ? ['ProductCard.tsx references descricaoTecnica'] : [],
);

check(23, 'Nenhum bloco de texto em caixa alta', () => {
  const problems = walk(SRC, (f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .filter((f) => /\buppercase\b/.test(text(f)))
    .map((f) => `${rel(f)} uses the uppercase class`);
  // Tokens that are legitimately upper-case (brands, units, acronyms) never count as shouting.
  const ALLOW = /^(PS\d?|\d+(TB|GB|MB)|BRL|CEP|BR|SC|SP|OLED|HDMI|LGPD|FAQ|CTA|SEO|MVP|X\|S|3DS|2DS|SNES|NES|PIX|CPF|CNPJ|R\$)$/i;
  for (const f of htmlFiles) {
    for (const node of textNodes(text(f))) {
      for (const chunk of node.split(/(?<=[.!?:;])\s+|·|\|/)) {
        const words = chunk.trim().split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ]/.test(w));
        const letters = chunk.replace(/[^A-Za-zÀ-ÿ]/g, '');
        if (letters.length < 12 || !words.length) continue;
        if (words.every((w) => ALLOW.test(w.replace(/[^A-Za-zÀ-ÿ0-9|$]/g, '')))) continue;
        if (letters === letters.toUpperCase()) problems.push(`${rel(f)} has an all-caps text block: "${chunk.trim().slice(0, 60)}"`);
      }
    }
  }
  return problems;
});

check(27, 'Toda página tem exatamente um canonical, e todos são únicos', () => {
  const problems = [];
  const seen = new Map();
  for (const f of htmlFiles) {
    const all = text(f).match(/<link rel="canonical"/g) ?? [];
    if (all.length !== 1) problems.push(`${rel(f)} has ${all.length} canonical links`);
    const href = /<link rel="canonical" href="([^"]+)"/.exec(text(f))?.[1];
    if (!href) continue;
    if (seen.has(href)) problems.push(`${rel(f)} shares the canonical ${href} with ${seen.get(href)}`);
    else seen.set(href, rel(f));
  }
  return problems;
});

check(28, 'JSON-LD válido: Product, Store e FAQPage', () => {
  const problems = [];
  const jsonLd = (f) =>
    [...text(f).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch (e) {
        problems.push(`${rel(f)} has invalid JSON-LD: ${e.message}`);
        return null;
      }
    });
  const types = (f) => jsonLd(f).flat().filter(Boolean).map((o) => o['@type']);

  for (const f of htmlFiles.filter((x) => rel(x).includes('dist/produto/'))) {
    if (!types(f).includes('Product')) problems.push(`${rel(f)} has no Product JSON-LD`);
  }
  if (!types(join(DIST, 'index.html')).includes('Store')) problems.push('dist/index.html has no Store JSON-LD');
  if (!types(join(DIST, 'assistencia-tecnica', 'index.html')).includes('FAQPage')) problems.push('assistência has no FAQPage JSON-LD');
  return problems;
});

check(29, 'robots.txt seletivo e sitemap com produtos e serviços', () => {
  const problems = [];
  const robots = read(join(DIST, 'robots.txt'));
  const disallowed = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map((m) => m[1]);
  const expected = ['/carrinho', '/checkout', '/conta', '/admin'];
  if (disallowed.join(',') !== expected.join(',')) problems.push(`robots.txt disallows ${disallowed.join(', ') || '(nothing)'}`);
  if (!robots.includes('Sitemap: https://www.mateusgames.com.br/sitemap.xml')) problems.push('robots.txt has no sitemap line');
  const sitemap = read(join(DIST, 'sitemap.xml'));
  for (const needle of ['/produto/', '/assistencia-tecnica', '/gift-cards']) {
    if (!sitemap.includes(needle)) problems.push(`sitemap.xml has no ${needle} URL`);
  }
  return problems;
});

check(25, '<title> da home igual a storeConfig.seoTitleHome', () => {
  const expected = /seoTitleHome: '([^']+)'/.exec(read(join(SRC, 'config/storeConfig.ts')))?.[1];
  const actual = /<title>([^<]*)<\/title>/.exec(read(join(DIST, 'index.html')))?.[1];
  return actual === expected ? [] : [`home <title> is "${actual}", expected "${expected}"`];
});

check(34, 'Sem "clique aqui"', () => [
  ...findIn(srcFiles, /clique aqui/i),
  ...htmlFiles.filter((f) => /clique aqui/i.test(visibleText(text(f)))).map((f) => `${rel(f)} says "clique aqui"`),
]);

// ---------------------------------------------------------------- report

let failed = 0;
for (const { id, title, problems } of results.sort((a, b) => a.id - b.id)) {
  if (problems.length) {
    failed++;
    console.log(`❌ #${id} ${title}`);
    for (const p of problems.slice(0, 10)) console.log(`     ${p}`);
    if (problems.length > 10) console.log(`     …and ${problems.length - 10} more`);
  } else {
    console.log(`✅ #${id} ${title}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} acceptance checks passed`);
process.exit(failed ? 1 : 0);
