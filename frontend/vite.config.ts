/// <reference types="vitest" />
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Fonts are only discovered after the stylesheet parses, which made Space Grotesk arrive
 * mid-paint and reflow the page (CLS 0.4 on the product page). Preloading the two latin
 * faces the UI actually uses lets them land before first paint.
 */
function preloadLatinFonts(): Plugin {
  return {
    name: 'preload-latin-fonts',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(_html, ctx) {
      const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => /-latin-(400|700)-normal-[^/]*\.woff2$/.test(f));
      return fonts.map((href) => ({
        tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${href}`, crossorigin: '' },
        injectTo: 'head-prepend' as const,
      }));
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadLatinFonts()],
  server: { proxy: { '/api': 'http://localhost:8000' }, fs: { allow: ['..'] } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
});
