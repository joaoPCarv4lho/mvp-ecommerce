import { useEffect } from 'react';
import { create } from 'zustand';

/** Contextual WhatsApp message. `null` = use the page default (built from document.title). */
export const useWhatsAppStore = create<{ text: string | null; set: (text: string | null) => void }>((set) => ({
  text: null,
  set: (text) => set({ text }),
}));

/** Pages call this to override the floating WhatsApp button message while mounted. */
export function useWhatsAppMessage(text: string | null | undefined) {
  useEffect(() => {
    if (!text) return;
    useWhatsAppStore.getState().set(text);
    return () => useWhatsAppStore.getState().set(null);
  }, [text]);
}
