import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storeConfig } from '../../config/storeConfig';
import { pageWhatsappText, whatsappLink } from '../../domain/whatsapp';
import { useWhatsAppStore } from '../../hooks/useWhatsAppMessage';
import { PixelIcon } from '../ui';

/** "Xbox | Mateus Games" → "Xbox"; the home title starts with the store name → "Início". */
function pageName(title: string) {
  const first = title.split(' | ')[0].trim();
  return !first || first === storeConfig.nome ? 'Início' : first;
}

/** Tracks document.title, which pages set asynchronously (lazy routes + useSeo effects). */
function useDocumentTitle() {
  const [title, setTitle] = useState(() => document.title);
  useEffect(() => {
    const obs = new MutationObserver(() => setTitle(document.title));
    obs.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, []);
  return title;
}

export function WhatsAppButton() {
  const custom = useWhatsAppStore((s) => s.text);
  const title = useDocumentTitle();
  const { pathname } = useLocation();
  // Product pages have a sticky buy bar on mobile: lift the button above it.
  const bottom = pathname.startsWith('/produto/') ? 'bottom-[96px] lg:bottom-6' : 'bottom-4 lg:bottom-6';

  return (
    <a
      href={whatsappLink(custom ?? pageWhatsappText(pageName(title)))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={`fixed right-4 z-30 inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-success text-white shadow-card hover:bg-brand ${bottom}`}
    >
      <PixelIcon name="whatsapp" size={32} />
    </a>
  );
}
