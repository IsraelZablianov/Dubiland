import type { HTMLAttributes } from 'react';

type StarSize = 'sm' | 'md' | 'lg';

interface StarRatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  size?: StarSize;
}

const starSizeMap: Record<StarSize, string> = {
  sm: 'var(--font-size-md)',
  md: 'var(--font-size-xl)',
  lg: 'var(--font-size-2xl)',
};

export function StarRating({
  value,
  max = 3,
  size = 'md',
  style,
  ...props
}: StarRatingProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 'var(--space-xs)',
        fontSize: starSizeMap[size],
        lineHeight: 1,
        ...style,
      }}
      role="img"
      aria-label={`${value} out of ${max} stars`}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < value ? 'var(--color-star-filled)' : 'var(--color-star-empty)',
            transition: 'var(--transition-fast)',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
