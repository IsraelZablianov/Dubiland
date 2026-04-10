import type { ButtonHTMLAttributes } from 'react';
import { MascotIllustration } from '@/components/illustrations';
import { assetUrl } from '@/lib/assetUrl';
import { StarRating } from './StarRating';

interface GameCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
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
  progressPercent?: number;
  progressAriaLabel?: string;
  progressValueLabel?: string;
  playLabel?: string;
}

interface TagChipProps {
  tone: 'topic' | 'support';
  label: string;
  icon?: string;
}

function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function meterDots(value: number): string {
  const level = clampDifficulty(value);
  return `${'●'.repeat(level)}${'○'.repeat(Math.max(0, 5 - level))}`;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tagChipBackground(tone: TagChipProps['tone']): string {
  if (tone === 'support') return 'var(--color-tag-age-primary-bg)';
  return 'var(--color-tag-topic-bg)';
}

function TagChip({ tone, label, icon }: TagChipProps) {
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
        fontSize: 'var(--font-size-sm)',
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
  progressPercent,
  progressAriaLabel,
  progressValueLabel,
  playLabel,
  style,
  ...props
}: GameCardProps) {
  const supportLabels = (ageSupportLabels ?? []).filter((label) => label.trim().length > 0);
  const supportBadgeLabel = agePrimaryLabel
    ? supportLabels.length > 0
      ? `${agePrimaryLabel} · +${supportLabels.length}`
      : agePrimaryLabel
    : difficulty != null && difficultyLabel
      ? `${difficultyLabel} ${meterDots(difficulty)}`
      : null;

  const hasTagRow = Boolean(topicLabel || supportBadgeLabel);
  const normalizedProgress = clampProgress(progressPercent ?? 0);
  const progressSegments = 5;
  const completedSegments = Math.round((normalizedProgress / 100) * progressSegments);
  const playCueLabel = playLabel?.trim() || '▶';

  return (
    <button
      type="button"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform var(--motion-duration-fast) var(--motion-ease-standard), box-shadow var(--motion-duration-fast) var(--motion-ease-standard), border-color var(--motion-duration-fast) var(--motion-ease-standard)',
        minHeight: '260px',
        inlineSize: '100%',
        textAlign: 'start',
        padding: 0,
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
          padding: 'var(--space-sm) var(--space-md) var(--space-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)' as unknown as number,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-normal)',
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
            {topicLabel && <TagChip tone="topic" icon={topicIcon} label={topicLabel} />}
            {supportBadgeLabel && <TagChip tone="support" icon="✨" label={supportBadgeLabel} />}
          </div>
        )}

        <div
          role="progressbar"
          aria-label={progressAriaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalizedProgress}
          aria-valuetext={progressValueLabel ?? `${normalizedProgress}%`}
          style={{
            display: 'grid',
            gap: 'var(--space-2xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {progressAriaLabel}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-semibold)' as unknown as number,
              }}
            >
              {progressValueLabel ?? `${normalizedProgress}%`}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${progressSegments}, minmax(0, 1fr))`,
              gap: 'var(--space-xs)',
              minBlockSize: '16px',
              alignItems: 'center',
            }}
          >
            {Array.from({ length: progressSegments }, (_, index) => (
              <span
                key={`progress-pill-${index}`}
                aria-hidden="true"
                style={{
                  display: 'block',
                  inlineSize: '100%',
                  blockSize: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border-subtle)',
                  background:
                    index < completedSegments
                      ? 'linear-gradient(90deg, var(--color-accent-success), color-mix(in srgb, var(--color-accent-info) 70%, var(--color-accent-success) 30%))'
                      : 'color-mix(in srgb, var(--color-surface-muted) 72%, white 28%)',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minBlockSize: 'var(--touch-primary-action)',
            borderTop: '1px solid var(--color-border-subtle)',
            paddingBlockStart: 'var(--space-2xs)',
            marginBlockStart: 'auto',
            gap: 'var(--space-sm)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              minBlockSize: 'var(--touch-primary-action)',
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-bold)' as unknown as number,
              color: 'var(--color-theme-primary)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                inlineSize: '1.75em',
                blockSize: '1.75em',
                borderRadius: 'var(--radius-full)',
                background: 'color-mix(in srgb, var(--color-accent-secondary) 78%, white 22%)',
                animation: 'var(--motion-gentle-float)',
              }}
            >
              ▶
            </span>
            {playCueLabel}
          </span>
          <StarRating value={stars} max={maxStars} size="md" />
          {!hasTagRow && difficulty != null && (
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-light)',
              }}
            >
              {meterDots(difficulty)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
