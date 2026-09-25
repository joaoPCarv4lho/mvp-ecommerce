import type { ReactNode } from 'react';

export interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function RadioCard({ name, value, checked, onChange, title, description, children }: RadioCardProps) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-card border p-4 ${
        checked ? 'border-brand bg-brand-soft' : 'border-border'
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span
        aria-hidden="true"
        className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border ${checked ? 'border-brand bg-brand' : 'border-border'}`}
      />
      <span>
        <span className="block font-bold">{title}</span>
        {description ? <span className="block text-sm text-muted">{description}</span> : null}
        {children}
      </span>
    </label>
  );
}
