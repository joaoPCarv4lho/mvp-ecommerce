import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import type { PixelIconName } from './PixelIcon';

export type AlertTone = 'warning' | 'info' | 'error' | 'success';

const TONE: Record<AlertTone, { cls: string; icon: PixelIconName; role: 'note' | 'alert' }> = {
  warning: { cls: 'bg-warning-bg text-warning', icon: 'warning', role: 'note' },
  info: { cls: 'bg-info-bg text-info', icon: 'shield', role: 'note' },
  success: { cls: 'bg-success-bg text-success', icon: 'check', role: 'note' },
  error: { cls: 'bg-error-bg text-error', icon: 'warning', role: 'alert' },
};

export function Alert({ tone, title, children }: { tone: AlertTone; title?: string; children: ReactNode }) {
  const { cls, icon, role } = TONE[tone];
  return (
    <div role={role} className={`flex items-start gap-2 rounded-card p-4 ${cls}`}>
      <PixelIcon name={icon} size={20} />
      <div>
        {title ? <p className="font-bold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
