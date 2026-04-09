import type { CSSProperties, HTMLAttributes } from 'react';

interface AnimatedPageProps extends HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
}

export function AnimatedPage({
  delayMs = 0,
  className,
  style,
  children,
  ...props
}: AnimatedPageProps) {
  const mergedStyle: CSSProperties = {
    '--animated-page-delay': `${delayMs}ms`,
    ...style,
  } as CSSProperties;

  return (
    <div className={['animated-page', className].filter(Boolean).join(' ')} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}
