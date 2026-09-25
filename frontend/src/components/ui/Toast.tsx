import { create } from 'zustand';

interface ToastMessage {
  id: number;
  text: string;
}

interface ToastState {
  messages: ToastMessage[];
  push: (text: string) => void;
  remove: (id: number) => void;
}

let seq = 0;

export const useToast = create<ToastState>((set) => ({
  messages: [],
  push: (text) => {
    const id = ++seq;
    set((s) => ({ messages: [...s.messages, { id, text }] }));
    setTimeout(() => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
}));

export const toast = (message: string) => useToast.getState().push(message);

export function ToastRegion() {
  const messages = useToast((s) => s.messages);
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {messages.map((m) => (
        <div key={m.id} className="rounded-card bg-brand px-4 py-2 text-white shadow-card">
          {m.text}
        </div>
      ))}
    </div>
  );
}
