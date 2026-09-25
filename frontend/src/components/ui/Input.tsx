import type { InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 rounded-card border px-3 text-base ${error ? 'border-error' : 'border-border'} ${className}`.trim()}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
