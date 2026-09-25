import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const slugId = (prefix: string, title: string) => `${prefix}-${title.trim().toLowerCase().replace(/\s+/g, '-')}`;

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

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

  const titleId = slugId('modal-title', title);

  return (
    <dialog ref={ref} aria-labelledby={titleId} className="w-full max-w-lg rounded-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center"
        >
          <PixelIcon name="close" size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
