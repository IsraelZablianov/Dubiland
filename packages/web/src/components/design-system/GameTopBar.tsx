import type { ReactNode } from 'react';

export interface GameTopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  progressLabel: ReactNode;
  progressAriaLabel?: string;
  currentStep: number;
  totalSteps: number;
  onReplayInstruction: () => void;
  replayAriaLabel: string;
  onBack?: () => void;
  backAriaLabel?: string;
  rightSlot?: ReactNode;
  isRtl?: boolean;
}

function clampToProgressStep(value: number, total: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(total, Math.round(value)));
}

export function GameTopBar({
  title,
  subtitle,
  progressLabel,
  progressAriaLabel,
  currentStep,
  totalSteps,
  onReplayInstruction,
  replayAriaLabel,
  onBack,
  backAriaLabel,
  rightSlot,
  isRtl = true,
}: GameTopBarProps) {
  const safeTotalSteps = Math.max(1, Number.isFinite(totalSteps) ? Math.round(totalSteps) : 1);
  const safeCurrentStep = clampToProgressStep(currentStep, safeTotalSteps);
  const computedProgressAriaLabel =
    progressAriaLabel ??
    (typeof progressLabel === 'string' ? progressLabel : `${safeCurrentStep}/${safeTotalSteps}`);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        display: 'grid',
        gap: 'var(--space-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backAriaLabel}
            style={{
              minInlineSize: '60px',
              minBlockSize: '60px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid color-mix(in srgb, var(--color-border) 72%, transparent)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '1.25rem',
              fontWeight: 'var(--font-weight-semibold)' as unknown as number,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            <span aria-hidden="true">{isRtl ? '→' : '←'}</span>
          </button>
        ) : (
          <span
            aria-hidden="true"
            style={{
              minInlineSize: '60px',
              minBlockSize: '60px',
              display: 'inline-block',
            }}
          />
        )}

        {(title || subtitle) && (
          <div
            style={{
              flex: 1,
              minInlineSize: '220px',
              display: 'grid',
              gap: 'var(--space-2xs)',
            }}
          >
            {title && (
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                }}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div
          style={{
            marginInlineStart: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            flexWrap: 'wrap',
          }}
        >
          {rightSlot}
          <button
            type="button"
            onClick={onReplayInstruction}
            aria-label={replayAriaLabel}
            style={{
              minInlineSize: '52px',
              minBlockSize: '52px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid color-mix(in srgb, var(--color-border) 72%, transparent)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '1.18rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={computedProgressAriaLabel}
        aria-valuemin={1}
        aria-valuemax={safeTotalSteps}
        aria-valuenow={safeCurrentStep}
        aria-valuetext={`${safeCurrentStep}/${safeTotalSteps}`}
        style={{
          display: 'grid',
          gap: 'var(--space-2xs)',
        }}
      >
        <p
          aria-live="polite"
          style={{
            margin: 0,
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)' as unknown as number,
          }}
        >
          {progressLabel}
        </p>

        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${safeTotalSteps}, minmax(16px, 1fr))`,
            gap: '6px',
          }}
        >
          {Array.from({ length: safeTotalSteps }, (_, index) => {
            const state = index + 1 < safeCurrentStep ? 'done' : index + 1 === safeCurrentStep ? 'active' : 'pending';

            return (
              <span
                key={`game-top-progress-${index + 1}`}
                style={{
                  minBlockSize: '16px',
                  borderRadius: 'var(--radius-full)',
                  border:
                    state === 'active'
                      ? '2px solid color-mix(in srgb, var(--color-theme-primary) 80%, white 20%)'
                      : '1px solid color-mix(in srgb, var(--color-border) 68%, transparent)',
                  background:
                    state === 'done'
                      ? 'color-mix(in srgb, var(--color-accent-success) 84%, white 16%)'
                      : state === 'active'
                        ? 'color-mix(in srgb, var(--color-theme-primary) 72%, white 28%)'
                        : 'color-mix(in srgb, var(--color-surface-muted) 78%, white 22%)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
