import type { CSSProperties } from 'react';
import { MascotIllustration } from '@/components/illustrations';
import type { CatalogAgeBand } from '@/lib/catalogRepository';

export type AgeRangeFilterBand = Exclude<CatalogAgeBand, 'all'>;

export interface AgeRangeFilterState {
  profileAgeBand?: AgeRangeFilterBand;
  selectedAgeBand: CatalogAgeBand;
  isManualOverride: boolean;
}

interface AgeRangeFilterBarProps {
  title: string;
  state: AgeRangeFilterState;
  ageBands: AgeRangeFilterBand[];
  labels: Record<CatalogAgeBand, string>;
  allowAllAges?: boolean;
  isPersistingOverride?: boolean;
  persistingLabel?: string;
  onSelectBand: (band: CatalogAgeBand) => void;
  onResetToProfileAge: () => void;
  resetLabel: string;
}

function chipButtonStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minHeight: 'var(--touch-filter-chip)',
    minWidth: 'var(--touch-filter-chip)',
    paddingInline: 'var(--space-md)',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${active ? 'var(--color-filter-chip-active-bg)' : 'var(--color-filter-chip-border)'}`,
    background: active ? 'var(--color-filter-chip-active-bg)' : 'var(--color-filter-chip-bg)',
    color: active ? 'var(--color-filter-chip-active-text)' : 'var(--color-text-primary)',
    boxShadow: active ? 'var(--shadow-filter-chip-active)' : 'none',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    lineHeight: 1,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'var(--transition-fast)',
    touchAction: 'manipulation',
  };
}

export function AgeRangeFilterBar({
  title,
  state,
  ageBands,
  labels,
  allowAllAges = true,
  isPersistingOverride = false,
  persistingLabel,
  onSelectBand,
  onResetToProfileAge,
  resetLabel,
}: AgeRangeFilterBarProps) {
  const showReset = Boolean(state.profileAgeBand && state.isManualOverride);

  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-filter-border)',
        background: 'var(--color-filter-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)',
          flexWrap: 'wrap',
        }}
      >
        <strong
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)' as unknown as number,
          }}
        >
          {title}
        </strong>

        {isPersistingOverride && persistingLabel && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {persistingLabel}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          alignContent: 'flex-start',
          gap: 'var(--space-sm)',
          direction: 'rtl',
          paddingBlock: 'var(--space-xs)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'var(--touch-filter-chip)',
            minWidth: 'var(--touch-filter-chip)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-filter-chip-border)',
            paddingInline: 'var(--space-xs)',
            flexShrink: 0,
          }}
        >
          <MascotIllustration variant="hint" size={28} />
        </span>

        {ageBands.map((band) => {
          const active = state.selectedAgeBand === band;
          return (
            <button
              key={band}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectBand(band)}
              style={chipButtonStyle(active)}
            >
              {labels[band]}
            </button>
          );
        })}

        {allowAllAges && (
          <button
            type="button"
            aria-pressed={state.selectedAgeBand === 'all'}
            onClick={() => onSelectBand('all')}
            style={chipButtonStyle(state.selectedAgeBand === 'all')}
          >
            {labels.all}
          </button>
        )}

        {showReset && (
          <button
            type="button"
            onClick={onResetToProfileAge}
            style={{
              ...chipButtonStyle(false),
              color: 'var(--color-theme-primary)',
              borderColor: 'var(--color-theme-primary)',
              background: 'var(--color-bg-card)',
            }}
          >
            {resetLabel}
          </button>
        )}
      </div>
    </div>
  );
}
