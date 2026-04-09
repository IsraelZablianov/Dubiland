import type { CSSProperties, HTMLAttributes } from 'react';

interface FloatingElementProps extends HTMLAttributes<HTMLDivElement> {
  durationMs?: number;
  delayMs?: number;
}

export function FloatingElement({
  durationMs,
  delayMs = 0,
  className,
  style,
  children,
  ...props
}: FloatingElementProps) {
  const mergedStyle: CSSProperties = {
    '--floating-duration': durationMs ? `${durationMs}ms` : undefined,
    '--floating-delay': `${delayMs}ms`,
    ...style,
  } as CSSProperties;

  return (
    <div className={['floating-element', className].filter(Boolean).join(' ')} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}
