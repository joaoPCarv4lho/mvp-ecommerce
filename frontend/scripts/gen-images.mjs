// Generates neutral pixel-touched illustrations (no logos, no game cover art) as SVG,
// writes them to scripts/illustrations/*.svg for inspection, then rasterizes each to
// public/images/*.webp via sharp at the required sizes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const illustrationsDir = path.join(__dirname, 'illustrations');
const outDir = path.join(root, 'public', 'images');
mkdirSync(illustrationsDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const BG = '#efeafd';
const BRAND = '#3b1f8e';
const BRAND_STRONG = '#2a1566';
const ACTION = '#c2410c';
const CARD_PALETTE = ['#3b1f8e', '#2a1566', '#c2410c', '#166534', '#1e40af', '#854d0e'];

const pixelGrid = (w, h, cell = 12, opacity = 0.05) => {
  let dots = '';
  for (let y = cell; y < h; y += cell * 2) {
    for (let x = cell; x < w; x += cell * 2) {
      dots += `<rect x="${x}" y="${y}" width="${cell / 3}" height="${cell / 3}" fill="${BRAND}" opacity="${opacity}"/>`;
    }
  }
  return dots;
};

const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${BG}"/>
${pixelGrid(w, h)}
${body}
</svg>`;

// --- 200x200 square illustration bodies (neutral shapes only) ---
const consoleShape = (boxy = false) => `
<rect x="40" y="72" width="120" height="56" rx="${boxy ? 4 : 14}" fill="${BRAND}"/>
<rect x="40" y="72" width="120" height="12" rx="${boxy ? 2 : 6}" fill="${ACTION}"/>
<circle cx="148" cy="100" r="5" fill="${BG}"/>
<circle cx="134" cy="100" r="5" fill="${BG}"/>`;

const handheldShape = () => `
<rect x="62" y="40" width="76" height="120" rx="16" fill="${BRAND}"/>
<rect x="74" y="56" width="52" height="66" rx="6" fill="${BG}"/>
<circle cx="100" cy="144" r="7" fill="${BG}"/>`;

const controllerShape = () => `
<ellipse cx="100" cy="102" rx="68" ry="32" fill="${BRAND}"/>
<circle cx="60" cy="118" r="13" fill="${BG}"/>
<circle cx="142" cy="98" r="7" fill="${BG}"/>
<circle cx="130" cy="112" r="7" fill="${BG}"/>`;

const headsetShape = () => `
<path d="M52 112 a48 48 0 0 1 96 0" stroke="${BRAND}" stroke-width="10" fill="none"/>
<rect x="42" y="104" width="20" height="34" rx="8" fill="${BRAND}"/>
<rect x="138" y="104" width="20" height="34" rx="8" fill="${BRAND}"/>`;

const discShape = () => `
<circle cx="100" cy="100" r="58" fill="${BRAND}"/>
<circle cx="100" cy="100" r="13" fill="${BG}"/>`;

const cartShape = () => `
<rect x="58" y="42" width="84" height="116" rx="8" fill="${BRAND}"/>
<rect x="72" y="26" width="56" height="24" rx="4" fill="${BRAND_STRONG}"/>`;

const usedDetailShape = () => `
<rect x="40" y="58" width="120" height="82" rx="10" fill="${BRAND}"/>
<circle cx="128" cy="118" r="24" fill="none" stroke="${ACTION}" stroke-width="6"/>
<line x1="145" y1="135" x2="164" y2="154" stroke="${ACTION}" stroke-width="6" stroke-linecap="round"/>`;

const giftcardShape = (name, accent) => `
<rect x="24" y="56" width="152" height="88" rx="12" fill="${accent}"/>
<rect x="24" y="56" width="152" height="20" rx="10" fill="#000000" opacity="0.15"/>
<text x="100" y="108" font-family="'Space Grotesk', system-ui, sans-serif" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle">${name}</text>`;

const SQUARE_ILLUSTRATIONS = {
  'console-ps': consoleShape(),
  'console-xbox': consoleShape(),
  'console-switch': consoleShape(),
  'console-retro': consoleShape(true),
  handheld: handheldShape(),
  controller: controllerShape(),
  headset: headsetShape(),
  'game-disc': discShape(),
  'game-cart': cartShape(),
  'giftcard-playstation': giftcardShape('PlayStation', CARD_PALETTE[0]),
  'giftcard-xbox': giftcardShape('Xbox', CARD_PALETTE[1]),
  'giftcard-nintendo': giftcardShape('Nintendo', CARD_PALETTE[2]),
  'giftcard-steam': giftcardShape('Steam', CARD_PALETTE[3]),
  'giftcard-googleplay': giftcardShape('Google Play', CARD_PALETTE[4]),
  'giftcard-roblox': giftcardShape('Roblox', CARD_PALETTE[5]),
  'used-detail': usedDetailShape(),
  bancada: `
<rect x="20" y="120" width="160" height="14" rx="4" fill="${BRAND_STRONG}"/>
<rect x="32" y="70" width="34" height="50" rx="4" fill="${BRAND}"/>
<rect x="86" y="60" width="10" height="60" rx="4" fill="${ACTION}"/>
<circle cx="91" cy="54" r="10" fill="none" stroke="${ACTION}" stroke-width="6"/>
<rect x="130" y="80" width="46" height="40" rx="4" fill="${BRAND}"/>`,
  loja: `
<rect x="34" y="70" width="132" height="70" rx="6" fill="${BRAND}"/>
<rect x="30" y="58" width="140" height="16" rx="6" fill="${ACTION}"/>
<rect x="90" y="98" width="20" height="42" rx="2" fill="${BG}"/>
<rect x="46" y="86" width="24" height="20" rx="2" fill="${BG}"/>
<rect x="130" y="86" width="24" height="20" rx="2" fill="${BG}"/>`,
};

async function writeSquare(key, body) {
  const svg = wrap(200, 200, body);
  writeFileSync(path.join(illustrationsDir, `${key}.svg`), svg, 'utf8');
  for (const size of [400, 800]) {
    await sharp(Buffer.from(svg)).resize(size, size).webp({ quality: 78 }).toFile(path.join(outDir, `${key}-${size}.webp`));
  }
}

async function writeHero() {
  const w = 900;
  const h = 600;
  const body = `
<rect x="150" y="180" width="600" height="320" rx="16" fill="${BRAND}"/>
<rect x="190" y="210" width="520" height="200" rx="8" fill="${BG}"/>
<rect x="190" y="210" width="520" height="200" rx="8" fill="${ACTION}" opacity="0.12"/>
<circle cx="300" cy="450" r="20" fill="${BRAND_STRONG}"/>
<circle cx="600" cy="450" r="20" fill="${BRAND_STRONG}"/>
<rect x="80" y="470" width="60" height="60" rx="10" fill="${ACTION}"/>
<rect x="760" y="470" width="60" height="60" rx="10" fill="${ACTION}"/>`;
  const svg = wrap(w, h, body);
  writeFileSync(path.join(illustrationsDir, 'hero.svg'), svg, 'utf8');
  await sharp(Buffer.from(svg)).resize(1200, 800).webp({ quality: 78 }).toFile(path.join(outDir, 'hero-1200.webp'));
  await sharp(Buffer.from(svg)).resize(800, 533).webp({ quality: 78 }).toFile(path.join(outDir, 'hero-800.webp'));
}

async function writeOgDefault() {
  const w = 1200;
  const h = 630;
  const body = `
<text x="${w / 2}" y="${h / 2 - 20}" font-family="'Space Grotesk', system-ui, sans-serif" font-size="64" font-weight="700" fill="${BRAND}" text-anchor="middle">Mateus Games</text>
<text x="${w / 2}" y="${h / 2 + 40}" font-family="'Space Grotesk', system-ui, sans-serif" font-size="28" font-weight="400" fill="${BRAND_STRONG}" text-anchor="middle">A diversão de hoje é a nostalgia de amanhã</text>`;
  const svg = wrap(w, h, body);
  writeFileSync(path.join(illustrationsDir, 'og-default.svg'), svg, 'utf8');
  await sharp(Buffer.from(svg)).resize(w, h).webp({ quality: 78 }).toFile(path.join(outDir, 'og-default-1200.webp'));
}

async function main() {
  for (const [key, body] of Object.entries(SQUARE_ILLUSTRATIONS)) {
    if (key === 'bancada' || key === 'loja') continue;
    await writeSquare(key, body);
  }
  // bancada/loja: only -800 is required, but we also emit -400 for consistency with other pages.
  await writeSquare('bancada', SQUARE_ILLUSTRATIONS.bancada);
  await writeSquare('loja', SQUARE_ILLUSTRATIONS.loja);
  await writeHero();
  await writeOgDefault();
  console.log('Generated images in', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
