import type { HTMLAttributes } from 'react';
import { StarRating } from './StarRating';

interface GameCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  title: string;
  thumbnailUrl?: string;
  difficulty?: number;
  stars?: number;
  maxStars?: number;
}

export function GameCard({
  title,
  thumbnailUrl,
  difficulty,
  stars = 0,
  maxStars = 3,
  style,
  ...props
}: GameCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        minHeight: 'var(--touch-min)',
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 10',
          background: thumbnailUrl
            ? `url(${thumbnailUrl}) center / cover no-repeat`
            : 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!thumbnailUrl && (
          <span style={{ fontSize: 'var(--font-size-2xl)', opacity: 0.4 }}>🎮</span>
        )}
      </div>

      <div
        style={{
          padding: 'var(--space-sm) var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-xs)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)' as unknown as number,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <StarRating value={stars} max={maxStars} size="sm" />
          {difficulty != null && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-light)',
              }}
            >
              {'●'.repeat(difficulty)}
              {'○'.repeat(Math.max(0, 5 - difficulty))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
