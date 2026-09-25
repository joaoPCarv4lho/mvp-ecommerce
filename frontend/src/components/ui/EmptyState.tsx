import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import type { PixelIconName } from './PixelIcon';

export function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: PixelIconName;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-brand">
      <PixelIcon name={icon} size={64} />
      <p className="text-lg font-bold text-text">{title}</p>
      {text ? <p className="text-muted">{text}</p> : null}
      {children}
    </div>
  );
}
