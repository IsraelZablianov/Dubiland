import type { CSSProperties, ImgHTMLAttributes } from 'react';

export type MascotVariant = 'hero' | 'hint' | 'success' | 'loading';

const MASCOT_SRC_BY_VARIANT: Record<MascotVariant, string> = {
  hero: '/images/mascot/dubi-hero-wave-rtl.svg',
  hint: '/images/mascot/dubi-hint-point-rtl.svg',
  success: '/images/mascot/dubi-success-cheer.svg',
  loading: '/images/mascot/dubi-loading-breathe.svg',
};

interface MascotIllustrationProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  variant?: MascotVariant;
  size?: number | string;
  decorative?: boolean;
  mirrored?: boolean;
}

export function MascotIllustration({
  variant = 'hero',
  size = 96,
  decorative = true,
  mirrored = false,
  alt,
  style,
  ...props
}: MascotIllustrationProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const mergedStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    objectFit: 'contain',
    transform: mirrored ? 'scaleX(-1)' : undefined,
    ...style,
  };

  return (
    <img
      src={MASCOT_SRC_BY_VARIANT[variant]}
      alt={decorative ? '' : (alt ?? '')}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
      style={mergedStyle}
      {...props}
    />
  );
}
