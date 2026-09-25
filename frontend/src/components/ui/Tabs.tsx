import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const activeIndex = tabs.findIndex((t) => t.id === active);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(activeIndex + dir + tabs.length) % tabs.length];
    setActive(next.id);
    buttonRefs.current[next.id]?.focus();
  };

  return (
    <div>
      <div role="tablist" className="flex gap-2 border-b border-border" onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => setActive(tab.id)}
            className={`min-h-11 px-4 font-bold ${tab.id === active ? 'border-b-2 border-brand text-brand' : 'text-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
