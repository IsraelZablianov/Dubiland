import type { HTMLAttributes } from 'react';
import { MascotIllustration } from '@/components/illustrations';
import { assetUrl } from '@/lib/assetUrl';
import { StarRating } from './StarRating';

interface GameCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  title: string;
  thumbnailUrl?: string;
  difficulty?: number;
  agePrimaryLabel?: string;
  ageSupportLabels?: string[];
  topicLabel?: string;
  topicIcon?: string;
  difficultyLabel?: string;
  stars?: number;
  maxStars?: number;
}

interface TagChipProps {
  tone: 'agePrimary' | 'ageSupport' | 'topic' | 'difficulty';
  label: string;
  icon?: string;
  trailingVisual?: string;
}

function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function meterDots(value: number): string {
  const level = clampDifficulty(value);
  return `${'●'.repeat(level)}${'○'.repeat(Math.max(0, 5 - level))}`;
}

function tagChipBackground(tone: TagChipProps['tone']): string {
  if (tone === 'agePrimary') return 'var(--color-tag-age-primary-bg)';
  if (tone === 'ageSupport') return 'var(--color-tag-age-support-bg)';
  if (tone === 'topic') return 'var(--color-tag-topic-bg)';
  return 'var(--color-tag-difficulty-bg)';
}

function TagChip({ tone, label, icon, trailingVisual }: TagChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        maxInlineSize: '100%',
        height: 'var(--tag-chip-height)',
        paddingInline: 'var(--space-sm)',
        borderRadius: 'var(--radius-tag-pill)',
        border: '1px solid var(--color-tag-border)',
        background: tagChipBackground(tone),
        color: 'var(--color-tag-text)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)' as unknown as number,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && (
        <span aria-hidden="true" style={{ lineHeight: 1 }}>
          {icon}
        </span>
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          direction: 'rtl',
        }}
      >
        {label}
      </span>
      {trailingVisual && (
        <span aria-hidden="true" style={{ letterSpacing: '0.08em' }}>
          {trailingVisual}
        </span>
      )}
    </span>
  );
}

export function GameCard({
  title,
  thumbnailUrl,
  difficulty,
  agePrimaryLabel,
  ageSupportLabels,
  topicLabel,
  topicIcon,
  difficultyLabel,
  stars = 0,
  maxStars = 3,
  style,
  ...props
}: GameCardProps) {
  const hasTagRow = Boolean(agePrimaryLabel && topicLabel && difficulty != null && difficultyLabel);
  const supportLabels = (ageSupportLabels ?? []).filter((label) => label.trim().length > 0);
  const supportBadgeLabel =
    supportLabels.length === 0 ? null : supportLabels.length === 1 ? `+${supportLabels[0]}` : `+${supportLabels.length}`;

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
            ? `url(${assetUrl(thumbnailUrl)}) center / cover no-repeat`
            : 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!thumbnailUrl && (
          <MascotIllustration
            variant="loading"
            size={72}
            style={{ opacity: 0.72 }}
          />
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

        {hasTagRow && (
          <div
            aria-label={difficultyLabel}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-xs)',
              maxBlockSize: 'calc(var(--tag-chip-height) * 2 + var(--space-xs))',
              overflow: 'hidden',
              direction: 'rtl',
            }}
          >
            <TagChip tone="agePrimary" label={agePrimaryLabel!} />
            {supportBadgeLabel && <TagChip tone="ageSupport" label={supportBadgeLabel} />}
            <TagChip tone="topic" icon={topicIcon} label={topicLabel!} />
            <TagChip
              tone="difficulty"
              icon="⭐"
              label={difficultyLabel!}
              trailingVisual={difficulty != null ? meterDots(difficulty) : undefined}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <StarRating value={stars} max={maxStars} size="sm" />
          {!hasTagRow && difficulty != null && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-light)',
              }}
            >
              {meterDots(difficulty)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
