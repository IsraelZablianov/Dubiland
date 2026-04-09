import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const paddingMap = {
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
};

export function Card({
  children,
  padding = 'md',
  interactive = false,
  style,
  ...props
}: CardProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: paddingMap[padding],
        boxShadow: 'var(--shadow-card)',
        transition: 'var(--transition-fast)',
        cursor: interactive ? 'pointer' : 'default',
        ...(interactive && {
          minHeight: 'var(--touch-min)',
        }),
        ...style,
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
