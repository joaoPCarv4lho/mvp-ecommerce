// Generates neutral pixel-touched illustrations (no logos, no game cover art) as SVG,
// writes them to scripts/illustrations/*.svg for inspection, then rasterizes each to
// public/images/*.webp via sharp at the required sizes.
//
// All shapes are built on a coarse boolean grid (retro/8-bit look) and all text is
// drawn as a hand-rolled 5x7 pixel bitmap font (not <text>, since the SVG rasterizer
// used here has no access to the Space Grotesk webfont and falls back to a serif font).
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

// --- 5x7 pixel bitmap font -------------------------------------------------
// Only the glyphs actually needed by the copy baked into these images: the store
// name, the slogan (with its accented characters) and the gift-card platform names.
// Case is preserved exactly (the global "no uppercase copy" rule forbids folding
// case), so upper- and lowercase letters are separate glyphs.
const FONT = {
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  G: ['.###.', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
  b: ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '####.'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####'],
  h: ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
  i: ['..#..', '.....', '..#..', '..#..', '..#..', '..#..', '..#..'],
  j: ['...#.', '.....', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  l: ['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..##.'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#...#', '#...#'],
  n: ['.....', '.....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
  s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  t: ['..#..', '..#..', '.###.', '..#..', '..#..', '..#..', '...##'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####'],
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  y: ['.....', '.....', '#...#', '#...#', '.####', '....#', '.###.'],
  // g gets a real descender (8th row) so "nostalgia"/"Google" don't read as "9".
  g: ['.....', '.....', '.###.', '#...#', '#...#', '.###.', '...#.', '.##..'],
  // A real tilde wave (2 rows, ≥4 cells wide) instead of two separate dots (which read as "ä").
  ã: ['.##.#', '#..#.', '.###.', '....#', '.####', '#...#', '.####'],
  // A short diagonal acute-accent tick instead of a plain square dot.
  é: ['...#.', '..#..', '.###.', '#...#', '#####', '#....', '.####'],
};

for (const [ch, rows] of Object.entries(FONT)) {
  if ((rows.length !== 7 && rows.length !== 8) || rows.some((r) => r.length !== 5)) {
    throw new Error(`gen-images: malformed glyph for "${ch}" (expected 7 or 8 rows of 5 chars)`);
  }
}

const GLYPH_W = 5;
const GLYPH_H = 7;
const LETTER_GAP = 1;

function measureText(text, cell) {
  return text.length * (GLYPH_W + LETTER_GAP) * cell - LETTER_GAP * cell;
}

function textRects(text, x0, y0, cell, color) {
  let out = '';
  let cx = x0;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[' '];
    glyph.forEach((row, ry) => {
      for (let rx = 0; rx < GLYPH_W; rx++) {
        if (row[rx] === '#') out += `<rect x="${cx + rx * cell}" y="${y0 + ry * cell}" width="${cell}" height="${cell}" fill="${color}"/>`;
      }
    });
    cx += (GLYPH_W + LETTER_GAP) * cell;
  }
  return out;
}

function centeredTextRects(text, centerX, y0, cell, color) {
  const w = measureText(text, cell);
  return textRects(text, centerX - w / 2, y0, cell, color);
}

// --- coarse pixel grid helpers (retro/8-bit silhouettes) -------------------
const grid = (cols, rows) => Array.from({ length: rows }, () => Array(cols).fill('.'));
const gset = (g, x, y) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = '#';
};
const grect = (g, x, y, w, h) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) gset(g, i, j);
};
const gcircle = (g, cx, cy, r) => {
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (Math.hypot(x - cx, y - cy) <= r) gset(g, x, y);
};
const gRows = (g) => g.map((r) => r.join(''));

/** layers: [{ build(g), color }] — later layers paint over earlier ones (cutout details). */
function renderLayers(cols, rows, cellPx, layers) {
  let out = '';
  for (const { build, color } of layers) {
    const g = grid(cols, rows);
    build(g);
    gRows(g).forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') out += `<rect x="${x * cellPx}" y="${y * cellPx}" width="${cellPx}" height="${cellPx}" fill="${color}"/>`;
      }
    });
  }
  return out;
}

const pixelDots = (w, h, cell = 12, opacity = 0.05) => {
  let dots = '';
  for (let y = cell; y < h; y += cell * 2) {
    for (let x = cell; x < w; x += cell * 2) {
      dots += `<rect x="${x}" y="${y}" width="${cell / 3}" height="${cell / 3}" fill="${BRAND}" opacity="${opacity}"/>`;
    }
  }
  return dots;
};

const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">
<rect width="${w}" height="${h}" fill="${BG}"/>
${pixelDots(w, h)}
${body}
</svg>`;

// --- 200x200 square illustrations, built on a 20x20 grid (10px cells) -----
const SQ = 20;
const SQ_CELL = 200 / SQ;

const squareBody = (layers) => renderLayers(SQ, SQ, SQ_CELL, layers);

const SQUARE_ILLUSTRATIONS = {
  // Tall slim tower, stepped/narrowing top — distinct from the other consoles.
  'console-ps': squareBody([
    { color: BRAND, build: (g) => { grect(g, 9, 2, 2, 2); grect(g, 8, 4, 4, 3); grect(g, 7, 7, 6, 10); grect(g, 6, 16, 8, 2); } },
    { color: ACTION, build: (g) => { grect(g, 7, 7, 1, 10); grect(g, 10, 9, 1, 1); grect(g, 10, 11, 1, 1); grect(g, 10, 13, 1, 1); } },
  ]),
  // Boxy cube with a chamfered (stepped) silhouette and a round front vent.
  'console-xbox': squareBody([
    { color: BRAND, build: (g) => grect(g, 4, 6, 12, 11) },
    { color: BG, build: (g) => { grect(g, 4, 6, 1, 1); grect(g, 15, 6, 1, 1); grect(g, 4, 16, 1, 1); grect(g, 15, 16, 1, 1); } },
    { color: ACTION, build: (g) => gcircle(g, 10, 11, 3) },
    { color: BG, build: (g) => gcircle(g, 10, 11, 1) },
  ]),
  // Flat tablet with two side joy-con blocks, touching the tablet body (one connected device).
  'console-switch': squareBody([
    { color: BRAND, build: (g) => { grect(g, 6, 7, 8, 7); grect(g, 2, 6, 4, 9); grect(g, 14, 6, 3, 9); } },
    { color: BG, build: (g) => grect(g, 7, 8, 6, 5) },
    { color: ACTION, build: (g) => { grect(g, 3, 8, 1, 1); grect(g, 15, 8, 1, 1); } },
  ]),
  // Squat box with a top cartridge slot.
  'console-retro': squareBody([
    { color: BRAND, build: (g) => { grect(g, 4, 9, 12, 7); grect(g, 3, 15, 14, 2); } },
    { color: BG, build: (g) => grect(g, 7, 9, 6, 1) },
    { color: ACTION, build: (g) => grect(g, 4, 15, 12, 1) },
  ]),
  handheld: squareBody([
    { color: BRAND, build: (g) => grect(g, 6, 3, 8, 14) },
    { color: BG, build: (g) => grect(g, 7, 5, 6, 7) },
    { color: ACTION, build: (g) => grect(g, 9, 15, 2, 1) },
  ]),
  controller: squareBody([
    { color: BRAND, build: (g) => grect(g, 2, 8, 16, 6) },
    { color: BG, build: (g) => { grect(g, 2, 8, 1, 1); grect(g, 17, 8, 1, 1); grect(g, 2, 13, 1, 1); grect(g, 17, 13, 1, 1); grect(g, 5, 10, 1, 1); } },
    { color: ACTION, build: (g) => { grect(g, 13, 9, 1, 1); grect(g, 15, 10, 1, 1); } },
  ]),
  headset: squareBody([
    { color: BRAND, build: (g) => { grect(g, 7, 3, 6, 1); grect(g, 6, 4, 1, 1); grect(g, 13, 4, 1, 1); grect(g, 5, 5, 1, 3); grect(g, 14, 5, 1, 3); grect(g, 3, 8, 3, 4); grect(g, 14, 8, 3, 4); } },
  ]),
  'game-disc': squareBody([
    { color: BRAND, build: (g) => gcircle(g, 10, 10, 7) },
    { color: BG, build: (g) => gcircle(g, 10, 10, 2) },
  ]),
  'game-cart': squareBody([
    { color: BRAND, build: (g) => grect(g, 6, 3, 8, 14) },
    { color: BRAND_STRONG, build: (g) => grect(g, 8, 1, 4, 2) },
  ]),
  'used-detail': squareBody([
    { color: BRAND, build: (g) => grect(g, 4, 6, 12, 8) },
    { color: ACTION, build: (g) => { gcircle(g, 13, 12, 3); grect(g, 15, 14, 1, 1); grect(g, 16, 15, 1, 1); grect(g, 17, 16, 1, 1); } },
    { color: BG, build: (g) => gcircle(g, 13, 12, 1.6) },
  ]),
  bancada: squareBody([
    { color: BRAND_STRONG, build: (g) => grect(g, 2, 12, 16, 2) },
    { color: BRAND, build: (g) => { grect(g, 3, 14, 2, 4); grect(g, 15, 14, 2, 4); grect(g, 12, 8, 2, 4); } },
    { color: ACTION, build: (g) => { grect(g, 6, 7, 1, 5); grect(g, 5, 6, 3, 1); } },
  ]),
  loja: squareBody([
    { color: BRAND, build: (g) => grect(g, 3, 7, 14, 8) },
    { color: ACTION, build: (g) => { grect(g, 2, 5, 16, 2); gcircle(g, 10, 3, 2); grect(g, 9, 5, 2, 2); } },
    { color: BG, build: (g) => { grect(g, 9, 10, 2, 5); grect(g, 5, 9, 2, 2); grect(g, 13, 9, 2, 2); } },
  ]),
};

// Gift cards: a plain colored card + the platform name as plain pixel-font text (no logos).
const GIFTCARD_TEXT_CELL = 2;
const giftcard = (name, color) => {
  const card = squareBody([
    { color, build: (g) => grect(g, 2, 6, 16, 8) },
    { color: BRAND_STRONG, build: (g) => grect(g, 2, 6, 16, 2) },
  ]);
  const textY = 60 + (80 - GLYPH_H * GIFTCARD_TEXT_CELL) / 2;
  return card + centeredTextRects(name, 100, textY, GIFTCARD_TEXT_CELL, '#ffffff');
};

SQUARE_ILLUSTRATIONS['giftcard-playstation'] = giftcard('PlayStation', CARD_PALETTE[0]);
SQUARE_ILLUSTRATIONS['giftcard-xbox'] = giftcard('Xbox', CARD_PALETTE[1]);
SQUARE_ILLUSTRATIONS['giftcard-nintendo'] = giftcard('Nintendo', CARD_PALETTE[2]);
SQUARE_ILLUSTRATIONS['giftcard-steam'] = giftcard('Steam', CARD_PALETTE[3]);
SQUARE_ILLUSTRATIONS['giftcard-googleplay'] = giftcard('Google Play', CARD_PALETTE[4]);
SQUARE_ILLUSTRATIONS['giftcard-roblox'] = giftcard('Roblox', CARD_PALETTE[5]);

async function writeSquare(key, body) {
  const svg = wrap(200, 200, body);
  writeFileSync(path.join(illustrationsDir, `${key}.svg`), svg, 'utf8');
  for (const size of [400, 800]) {
    await sharp(Buffer.from(svg)).resize(size, size).webp({ quality: 78 }).toFile(path.join(outDir, `${key}-${size}.webp`));
  }
}

// --- hero: a real 3:2 retro arcade scene -----------------------------------
async function writeHero() {
  const cols = 45;
  const rows = 30;
  const cellPx = 20;
  const w = cols * cellPx;
  const h = rows * cellPx;

  const body = renderLayers(cols, rows, cellPx, [
    // starry sky: one row only, well clear (≥1 empty row) of the marquee below and
    // ≥3 cells clear of every image edge — never touching a shape or the frame.
    {
      color: BRAND_STRONG,
      build: (g) => {
        for (const x of [3, 8, 13, 18, 23, 28, 33, 38, 42]) gset(g, x, 1);
      },
    },
    // gamepad: one connected shape (body + top notch), sitting on the ground next to the cabinet.
    { color: BRAND, build: (g) => { grect(g, 5, 23, 8, 4); grect(g, 7, 22, 4, 1); } },
    { color: BG, build: (g) => { grect(g, 7, 24, 1, 1); grect(g, 10, 24, 1, 1); grect(g, 11, 25, 1, 1); } },
    // arcade cabinet: marquee, body, base flush against the body (no gap).
    { color: ACTION, build: (g) => grect(g, 16, 3, 13, 2) },
    { color: BRAND, build: (g) => grect(g, 17, 5, 11, 20) },
    { color: BRAND_STRONG, build: (g) => grect(g, 16, 25, 13, 2) },
    // screen, inset in the body, well above the control panel (no overlap with the joystick).
    { color: BG, build: (g) => grect(g, 19, 7, 7, 7) },
    // control panel BELOW the screen, with the joystick + 3 buttons drawn on top of it.
    { color: BRAND_STRONG, build: (g) => grect(g, 17, 15, 11, 3) },
    { color: ACTION, build: (g) => grect(g, 19, 16, 1, 1) },
    { color: BG, build: (g) => { grect(g, 22, 16, 1, 1); grect(g, 24, 16, 1, 1); grect(g, 26, 16, 1, 1); } },
    // ground line spanning the full width — grounds both shapes, flush under the cabinet base.
    { color: BRAND_STRONG, build: (g) => grect(g, 0, 27, cols, 1) },
  ]);

  const svg = wrap(w, h, body);
  writeFileSync(path.join(illustrationsDir, 'hero.svg'), svg, 'utf8');
  await sharp(Buffer.from(svg)).resize(1200, 800).webp({ quality: 78 }).toFile(path.join(outDir, 'hero-1200.webp'));
  await sharp(Buffer.from(svg)).resize(800, 533).webp({ quality: 78 }).toFile(path.join(outDir, 'hero-800.webp'));
}

// --- og-default: store name + slogan drawn with the pixel bitmap font -----
async function writeOgDefault() {
  const w = 1200;
  const h = 630;
  const body =
    centeredTextRects('Mateus Games', w / 2, 210, 12, BRAND) +
    centeredTextRects('A diversão de hoje é a', w / 2, 380, 7, BRAND_STRONG) +
    centeredTextRects('nostalgia de amanhã', w / 2, 440, 7, BRAND_STRONG);
  const svg = wrap(w, h, body);
  writeFileSync(path.join(illustrationsDir, 'og-default.svg'), svg, 'utf8');
  await sharp(Buffer.from(svg)).resize(w, h).webp({ quality: 78 }).toFile(path.join(outDir, 'og-default-1200.webp'));
}

async function main() {
  for (const [key, body] of Object.entries(SQUARE_ILLUSTRATIONS)) {
    await writeSquare(key, body);
  }
  await writeHero();
  await writeOgDefault();
  console.log('Generated images in', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
