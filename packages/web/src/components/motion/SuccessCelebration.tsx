import type { CSSProperties, HTMLAttributes } from 'react';

const SPARKS = [
  { inline: 8, top: 40, size: 8, delay: 0 },
  { inline: 20, top: 10, size: 12, delay: 90 },
  { inline: 36, top: 28, size: 10, delay: 170 },
  { inline: 52, top: 8, size: 14, delay: 260 },
  { inline: 68, top: 34, size: 9, delay: 320 },
  { inline: 82, top: 14, size: 11, delay: 420 },
] as const;

interface SuccessCelebrationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  dense?: boolean;
}

export function SuccessCelebration({ dense = false, className, style, ...props }: SuccessCelebrationProps) {
  return (
    <div
      className={['success-celebration', dense ? 'success-celebration--dense' : null, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden="true"
      {...props}
    >
      {SPARKS.map((spark, index) => {
        const sparkStyle: CSSProperties = {
          '--spark-inline': `${spark.inline}%`,
          '--spark-top': `${spark.top}%`,
          '--spark-size': `${spark.size}px`,
          '--spark-delay': `${spark.delay}ms`,
        } as CSSProperties;

        return <span key={index} className="success-celebration__spark" style={sparkStyle} />;
      })}
    </div>
  );
}
