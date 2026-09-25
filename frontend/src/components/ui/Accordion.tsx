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
        <details key={item.id} open={item.id === defaultOpen} className="py-4">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold">{item.title}</summary>
          <div className="pt-2 text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
