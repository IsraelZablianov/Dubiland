import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type FeatureIllustrationKind =
  | 'listen'
  | 'target'
  | 'play'
  | 'safe'
  | 'hebrew'
  | 'adaptive'
  | 'audio'
  | 'games'
  | 'minutes'
  | 'streak'
  | 'activity';

interface FeatureIllustrationProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  kind: FeatureIllustrationKind;
  size?: number | string;
  decorative?: boolean;
  tone?: 'default' | 'accent' | 'success';
}

const COLOR_BY_KIND: Record<FeatureIllustrationKind, string> = {
  listen: 'var(--color-accent-info)',
  target: 'var(--color-accent-primary)',
  play: 'var(--color-theme-primary)',
  safe: 'var(--color-accent-success)',
  hebrew: 'var(--color-theme-primary)',
  adaptive: 'var(--color-accent-info)',
  audio: 'var(--color-accent-primary)',
  games: 'var(--color-accent-primary)',
  minutes: 'var(--color-theme-primary)',
  streak: 'var(--color-accent-secondary)',
  activity: 'var(--color-accent-success)',
};

const BACKGROUND_BY_TONE = {
  default: 'color-mix(in srgb, var(--color-bg-card) 78%, var(--color-theme-secondary) 22%)',
  accent: 'color-mix(in srgb, var(--color-accent-secondary) 30%, var(--color-bg-card) 70%)',
  success: 'color-mix(in srgb, var(--color-accent-success) 28%, var(--color-bg-card) 72%)',
} as const;

function renderGlyph(kind: FeatureIllustrationKind): ReactNode {
  switch (kind) {
    case 'listen':
      return (
        <>
          <path
            d="M38 23c-10 0-18 8-18 18v15c0 9 7 16 16 16 7 0 12-5 12-12V44c0-5-4-10-10-10s-10 4-10 10v10c0 4 3 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M58 38c7 6 7 16 0 22" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M66 30c11 10 11 30 0 40" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case 'target':
      return (
        <>
          <circle cx="44" cy="50" r="24" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="44" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="44" cy="50" r="6" fill="currentColor" />
          <path d="M58 32L76 20l-11 18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'play':
    case 'games':
      return (
        <>
          <rect x="16" y="32" width="64" height="34" rx="14" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M32 50h14" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M39 43v14" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="46" r="4" fill="currentColor" />
          <circle cx="69" cy="53" r="4" fill="currentColor" />
        </>
      );
    case 'safe':
      return (
        <>
          <path
            d="M48 16 22 26v20c0 18 12 30 26 36 14-6 26-18 26-36V26L48 16z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M34 49l9 9 19-19" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'hebrew':
      return (
        <>
          <path
            d="M18 24h24c7 0 12 5 12 12v38H30c-6 0-12 4-12 10V24z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M78 24H54c-7 0-12 5-12 12v38h24c6 0 12 4 12 10V24z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M48 34v24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M40 50h16" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case 'adaptive':
      return (
        <>
          <rect x="20" y="52" width="10" height="18" rx="3" fill="currentColor" />
          <rect x="36" y="44" width="10" height="26" rx="3" fill="currentColor" opacity="0.8" />
          <rect x="52" y="34" width="10" height="36" rx="3" fill="currentColor" opacity="0.65" />
          <path d="M20 38c9 1 16-2 23-8 6-5 12-7 22-7" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M68 19l9 4-7 7" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'audio':
      return (
        <>
          <path d="M22 52h14l20 16V28L36 44H22z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
          <path d="M62 40c6 4 6 12 0 16" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M70 32c11 9 11 23 0 32" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case 'minutes':
      return (
        <>
          <circle cx="48" cy="48" r="28" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M48 32v17l12 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'streak':
      return (
        <>
          <path
            d="M50 16c2 10-5 14-5 24 0 6 4 11 10 11 8 0 14-7 14-16 0-10-7-18-19-19z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M42 35c-9 7-13 14-13 23 0 12 9 20 19 20 11 0 20-9 20-21 0-6-3-13-10-18-1 7-5 12-11 14-6 2-8-3-5-18z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </>
      );
    case 'activity':
      return (
        <>
          <rect x="18" y="22" width="60" height="52" rx="12" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M28 56l11-12 10 8 16-18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="39" cy="44" r="3" fill="currentColor" />
          <circle cx="49" cy="52" r="3" fill="currentColor" />
          <circle cx="65" cy="34" r="3" fill="currentColor" />
        </>
      );
    default:
      return null;
  }
}

export function FeatureIllustration({
  kind,
  size = 64,
  decorative = true,
  tone = 'default',
  style,
  ...props
}: FeatureIllustrationProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const mergedStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    minWidth: dimension,
    minHeight: dimension,
    borderRadius: 'var(--radius-md)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLOR_BY_KIND[kind],
    background: BACKGROUND_BY_TONE[tone],
    ...style,
  };

  return (
    <span aria-hidden={decorative ? true : undefined} style={mergedStyle} {...props}>
      <svg
        viewBox="0 0 96 96"
        width="70%"
        height="70%"
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? true : undefined}
      >
        {renderGlyph(kind)}
      </svg>
    </span>
  );
}
