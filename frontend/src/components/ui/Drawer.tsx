import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';

export type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: DrawerSide;
  children: ReactNode;
}

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'left-0 top-0 h-full max-w-sm w-full',
  right: 'right-0 top-0 h-full max-w-sm w-full',
  bottom: 'bottom-0 left-0 w-full max-h-[80vh]',
};

export function Drawer({ open, onClose, title, side = 'left', children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal?.();
    else el.close?.();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog ref={ref} aria-labelledby={titleId} className={`fixed m-0 rounded-card p-6 shadow-card ${SIDE_CLASS[side]}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => ref.current?.close()}
          className="inline-flex min-h-11 min-w-11 items-center justify-center"
        >
          <PixelIcon name="close" size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
