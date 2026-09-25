import type { Config } from 'tailwindcss';
const v = (n: string) => `var(--color-${n})`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    fontSize: { xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'], lg: ['20px', '28px'], xl: ['24px', '32px'], '2xl': ['32px', '40px'] },
    fontWeight: { normal: '400', bold: '700' },
    spacing: { 0: '0', px: '1px', 1: '4px', 2: '8px', 4: '16px', 6: '24px', 8: '32px', 11: '44px', 12: '48px' },
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), strong: v('brand-strong'), soft: v('brand-soft') },
        action: { DEFAULT: v('action'), hover: v('action-hover') },
        success: { DEFAULT: v('success'), bg: v('success-bg') },
        warning: { DEFAULT: v('warning'), bg: v('warning-bg') },
        error: { DEFAULT: v('error'), bg: v('error-bg') },
        info: { DEFAULT: v('info'), bg: v('info-bg') },
        bg: v('bg'), surface: v('surface'), border: v('border'), text: v('text'), muted: v('text-muted'),
      },
      borderRadius: { card: 'var(--radius-card)' },
      boxShadow: { card: 'var(--shadow-card)' },
    },
  },
  plugins: [],
} satisfies Config;
