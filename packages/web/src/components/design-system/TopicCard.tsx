import type { HTMLAttributes } from 'react';

interface TopicCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  icon: string;
  title: string;
  subtitle?: string;
  progress?: number;
}

export function TopicCard({
  icon,
  title,
  subtitle,
  progress,
  style,
  ...props
}: TopicCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        minHeight: 'var(--touch-min)',
        minWidth: '140px',
        textAlign: 'center',
        ...style,
      }}
      {...props}
    >
      <span style={{ fontSize: 'var(--font-size-3xl)' }}>{icon}</span>
      <span
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-bold)' as unknown as number,
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {subtitle}
        </span>
      )}
      {progress != null && (
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-star-empty)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginTop: 'var(--space-xs)',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              background: 'var(--color-accent-success)',
              borderRadius: 'var(--radius-full)',
              transition: 'var(--transition-normal)',
            }}
          />
        </div>
      )}
    </div>
  );
}
