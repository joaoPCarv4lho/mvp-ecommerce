import type { ComponentPropsWithoutRef, ElementType } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-action text-white hover:bg-action-hover',
  secondary: 'bg-surface text-brand border border-brand hover:bg-brand-soft',
  ghost: 'text-brand hover:bg-brand-soft',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-2 text-sm',
  md: 'px-4 text-base',
  lg: 'px-6 text-lg',
};

type ButtonOwnProps<E extends ElementType> = {
  as?: E;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export type ButtonProps<E extends ElementType> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

export function Button<E extends ElementType = 'button'>({
  as,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps<E>) {
  const Component = (as ?? 'button') as ElementType;
  const cls = [
    'inline-flex items-center justify-center gap-2 min-h-11 rounded-card font-bold transition-colors focus-visible:outline',
    SIZE_CLASS[size],
    VARIANT_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const extraProps = Component === 'button' ? { type: (props as { type?: string }).type ?? 'button' } : {};
  return <Component className={cls} {...extraProps} {...props} />;
}
