import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent-primary)',
    color: 'var(--color-text-inverse)',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    border: '2px solid var(--color-theme-secondary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '2px solid transparent',
  },
  danger: {
    background: 'var(--color-accent-danger)',
    color: 'var(--color-text-inverse)',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    minHeight: 'var(--touch-min)',
    padding: 'var(--space-sm) var(--space-md)',
    fontSize: 'var(--font-size-sm)',
    borderRadius: 'var(--radius-sm)',
  },
  md: {
    minHeight: 'var(--touch-min)',
    padding: 'var(--space-sm) var(--space-lg)',
    fontSize: 'var(--font-size-md)',
    borderRadius: 'var(--radius-md)',
  },
  lg: {
    minHeight: 'var(--touch-primary-action)',
    padding: 'var(--space-md) var(--space-xl)',
    fontSize: 'var(--font-size-lg)',
    borderRadius: 'var(--radius-lg)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        fontFamily: 'var(--font-family-primary)',
        fontWeight: 'var(--font-weight-bold)' as unknown as number,
        lineHeight: 'var(--line-height-tight)',
        transition: 'var(--transition-fast)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: 'var(--shadow-sm)',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
