import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

export type ChildRouteWidth = 'narrow' | 'standard' | 'wide';

const WIDTH_BY_SIZE: Record<ChildRouteWidth, string> = {
  narrow: 'var(--child-route-max-width-narrow)',
  standard: 'var(--child-route-max-width-standard)',
  wide: 'var(--child-route-max-width-wide)',
};

interface ChildRouteScaffoldProps {
  children: ReactNode;
  width?: ChildRouteWidth;
  gap?: CSSProperties['gap'];
  mainStyle?: CSSProperties;
  sectionStyle?: CSSProperties;
  sectionProps?: Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'style'>;
}

export function ChildRouteScaffold({
  children,
  width = 'wide',
  gap = 'var(--child-route-section-gap)',
  mainStyle,
  sectionStyle,
  sectionProps,
}: ChildRouteScaffoldProps) {
  const scaffoldStyle: CSSProperties = {
    flex: 1,
    background: 'var(--color-theme-bg)',
    padding: 'var(--child-route-inline-padding)',
    display: 'flex',
    justifyContent: 'center',
    ...mainStyle,
  };
  // Child route controls should keep the larger interaction floor.
  (scaffoldStyle as Record<string, string>)['--touch-min'] = 'var(--touch-min-primary)';

  return (
    <div className="child-route-scaffold" style={scaffoldStyle}>
      <section
        {...sectionProps}
        style={{
          width: `min(${WIDTH_BY_SIZE[width]}, 100%)`,
          display: 'grid',
          gap,
          ...sectionStyle,
        }}
      >
        {children}
      </section>
    </div>
  );
}

interface ChildRouteHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  details?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
  headingStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
  controlsStyle?: CSSProperties;
}

export function ChildRouteHeader({
  title,
  subtitle,
  details,
  leading,
  trailing,
  style,
  headingStyle,
  titleStyle,
  subtitleStyle,
  controlsStyle,
}: ChildRouteHeaderProps) {
  const hasHeading = title != null || subtitle != null || details != null;

  return (
    <header
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        justifyContent: hasHeading ? 'space-between' : 'flex-start',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {hasHeading ? (
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-xs)',
            ...headingStyle,
          }}
        >
          {title != null ? (
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                ...titleStyle,
              }}
            >
              {title}
            </h1>
          ) : null}
          {subtitle != null ? (
            <p
              style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-md)',
                ...subtitleStyle,
              }}
            >
              {subtitle}
            </p>
          ) : null}
          {details != null ? (
            <p
              style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {details}
            </p>
          ) : null}
        </div>
      ) : null}

      {(leading != null || trailing != null) ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
            ...controlsStyle,
          }}
        >
          {leading}
          {trailing}
        </div>
      ) : null}
    </header>
  );
}
