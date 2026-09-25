import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getIndexableRoutes, ROOT, SITE_URL } from './routes.mjs';

const routes = getIndexableRoutes();
const lastmod = new Date().toISOString().slice(0, 10);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((r) => `  <url>\n    <loc>${SITE_URL}${r === '/' ? '/' : r}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`),
  '</urlset>',
  '',
].join('\n');

const out = join(ROOT, 'frontend', 'public', 'sitemap.xml');
writeFileSync(out, xml);
console.log(`sitemap: ${routes.length} routes → public/sitemap.xml`);
