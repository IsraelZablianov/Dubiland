import type { HTMLAttributes } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  emoji?: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, string> = {
  sm: '36px',
  md: 'var(--touch-min)',
  lg: '64px',
  xl: '96px',
};

const fontSizeMap: Record<AvatarSize, string> = {
  sm: 'var(--font-size-md)',
  md: 'var(--font-size-xl)',
  lg: 'var(--font-size-2xl)',
  xl: 'var(--font-size-3xl)',
};

export function Avatar({
  name,
  src,
  emoji,
  size = 'md',
  style,
  ...props
}: AvatarProps) {
  const dimension = sizeMap[size];
  const initial = name ? name.charAt(0) : '';

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: 'var(--radius-full)',
        background: src ? 'transparent' : 'var(--color-theme-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontSize: fontSizeMap[size],
        fontWeight: 'var(--font-weight-bold)' as unknown as number,
        color: 'var(--color-text-inverse)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      aria-label={name}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : emoji ? (
        <span>{emoji}</span>
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
