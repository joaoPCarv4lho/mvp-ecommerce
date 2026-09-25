import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import type { PixelIconName } from './PixelIcon';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const TONE_CLASS: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
  neutral: 'bg-bg text-muted border border-border',
};

export function Badge({ tone, icon, children }: { tone: BadgeTone; icon?: PixelIconName; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-card px-2 py-1 text-xs font-bold ${TONE_CLASS[tone]}`}>
      {icon ? <PixelIcon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}
