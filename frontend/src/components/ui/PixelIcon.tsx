export type PixelIconName =
  | 'controller'
  | 'heart'
  | 'coin'
  | 'wrench'
  | 'cartridge'
  | 'cart'
  | 'star'
  | 'shield'
  | 'truck'
  | 'store'
  | 'gift'
  | 'search'
  | 'whatsapp'
  | 'check'
  | 'warning'
  | 'clock'
  | 'menu'
  | 'user'
  | 'close'
  | 'swap';

type Grid = string[][];

const GRID_SIZE = 12;

const mk = (): Grid => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('.'));

const set = (g: Grid, x: number, y: number) => {
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) g[y][x] = '#';
};

const rect = (g: Grid, x: number, y: number, w: number, h: number) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(g, i, j);
};

// Only used for horizontal, vertical or 45° lines; bounded loop guards against any accidental mismatch.
const line = (g: Grid, x0: number, y0: number, x1: number, y1: number) => {
  const dx = Math.sign(x1 - x0);
  const dy = Math.sign(y1 - y0);
  let x = x0;
  let y = y0;
  for (let i = 0; i < GRID_SIZE * 2; i++) {
    set(g, x, y);
    if (x === x1 && y === y1) break;
    x += dx;
    y += dy;
  }
};

const circle = (g: Grid, cx: number, cy: number, r: number) => {
  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) if (Math.hypot(x - cx, y - cy) <= r) set(g, x, y);
};

const ring = (g: Grid, cx: number, cy: number, r: number, w = 1.2) => {
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r && d >= r - w) set(g, x, y);
    }
};

const toRows = (build: (g: Grid) => void): string[] => {
  const g = mk();
  build(g);
  return g.map((row) => row.join(''));
};

const ICONS: Record<PixelIconName, string[]> = {
  controller: toRows((g) => {
    rect(g, 3, 1, 6, 2);
    rect(g, 1, 3, 10, 5);
    rect(g, 0, 8, 3, 2);
    rect(g, 9, 8, 3, 2);
  }),
  heart: toRows((g) => {
    circle(g, 4, 4, 2.2);
    circle(g, 8, 4, 2.2);
    rect(g, 2, 5, 8, 1);
    rect(g, 3, 6, 6, 1);
    rect(g, 4, 7, 4, 1);
    rect(g, 5, 8, 2, 1);
  }),
  coin: toRows((g) => circle(g, 6, 6, 4.3)),
  wrench: toRows((g) => {
    line(g, 2, 9, 8, 3);
    line(g, 3, 9, 9, 3);
    rect(g, 8, 1, 3, 1);
    rect(g, 8, 1, 1, 3);
    rect(g, 10, 1, 1, 3);
  }),
  cartridge: toRows((g) => {
    rect(g, 4, 0, 4, 2);
    rect(g, 2, 2, 8, 9);
  }),
  cart: toRows((g) => {
    line(g, 1, 2, 9, 2);
    rect(g, 2, 3, 7, 4);
    rect(g, 2, 9, 2, 2);
    rect(g, 7, 9, 2, 2);
  }),
  star: toRows((g) => {
    for (let y = 0; y < GRID_SIZE; y++)
      for (let x = 0; x < GRID_SIZE; x++) if (Math.abs(x - 5.5) + Math.abs(y - 5.5) <= 5) set(g, x, y);
  }),
  shield: toRows((g) => {
    rect(g, 2, 0, 8, 1);
    rect(g, 1, 1, 10, 5);
    rect(g, 2, 6, 8, 2);
    rect(g, 3, 8, 6, 1);
    rect(g, 4, 9, 4, 1);
    rect(g, 5, 10, 2, 1);
  }),
  truck: toRows((g) => {
    rect(g, 1, 3, 6, 3);
    rect(g, 7, 4, 3, 2);
    rect(g, 2, 9, 2, 2);
    rect(g, 7, 9, 2, 2);
  }),
  store: toRows((g) => {
    rect(g, 1, 1, 10, 1);
    rect(g, 2, 3, 8, 6);
    rect(g, 5, 7, 2, 2);
  }),
  gift: toRows((g) => {
    rect(g, 2, 3, 8, 7);
    rect(g, 1, 2, 10, 1);
    rect(g, 5, 2, 2, 8);
    rect(g, 2, 5, 8, 1);
  }),
  search: toRows((g) => {
    ring(g, 5, 5, 3, 1.3);
    line(g, 7, 7, 10, 10);
    line(g, 8, 7, 11, 10);
  }),
  whatsapp: toRows((g) => {
    rect(g, 1, 1, 10, 7);
    rect(g, 3, 8, 2, 2);
  }),
  check: toRows((g) => {
    line(g, 1, 6, 4, 9);
    line(g, 4, 9, 11, 2);
    line(g, 1, 7, 4, 10);
    line(g, 4, 10, 11, 3);
  }),
  warning: toRows((g) => {
    for (let y = 1; y <= 6; y++) {
      const half = y - 1;
      set(g, 6 - half, y);
      set(g, 6 + half, y);
    }
    rect(g, 1, 6, 11, 1);
    rect(g, 5, 2, 2, 2);
    rect(g, 5, 5, 2, 1);
  }),
  clock: toRows((g) => {
    ring(g, 6, 6, 4, 1.2);
    line(g, 6, 6, 6, 3);
    line(g, 6, 6, 8, 6);
  }),
  menu: toRows((g) => {
    rect(g, 1, 2, 10, 1);
    rect(g, 1, 5, 10, 1);
    rect(g, 1, 8, 10, 1);
  }),
  user: toRows((g) => {
    circle(g, 6, 3, 2.2);
    rect(g, 3, 6, 6, 5);
  }),
  close: toRows((g) => {
    line(g, 2, 1, 11, 10);
    line(g, 11, 1, 2, 10);
  }),
  swap: toRows((g) => {
    line(g, 1, 4, 9, 4);
    line(g, 7, 2, 9, 4);
    line(g, 7, 6, 9, 4);
    line(g, 10, 8, 2, 8);
    line(g, 4, 6, 2, 8);
    line(g, 4, 10, 2, 8);
  }),
};

export function PixelIcon({ name, size = 24, title }: { name: PixelIconName; size?: number; title?: string }) {
  const rows = ICONS[name];
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {rects}
    </svg>
  );
}
