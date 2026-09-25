import type { ReactNode } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen }: { items: AccordionItem[]; defaultOpen?: string }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <details key={item.id} open={item.id === defaultOpen} className="group py-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <span aria-hidden="true" className="inline-block transition-transform duration-150 group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="pt-2 text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
