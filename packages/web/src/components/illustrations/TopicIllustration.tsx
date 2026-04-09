import type { CSSProperties, ImgHTMLAttributes } from 'react';

export type TopicIllustrationSlug = 'math' | 'numbers' | 'letters' | 'reading';

const TOPIC_SRC_BY_SLUG: Record<TopicIllustrationSlug, string> = {
  math: '/images/topics/topic-numbers.svg',
  numbers: '/images/topics/topic-numbers.svg',
  letters: '/images/topics/topic-letters.svg',
  reading: '/images/topics/topic-reading.svg',
};

interface TopicIllustrationProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  topic: TopicIllustrationSlug;
  size?: number | string;
  decorative?: boolean;
}

export function TopicIllustration({
  topic,
  size = 96,
  decorative = true,
  alt,
  style,
  ...props
}: TopicIllustrationProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const mergedStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    objectFit: 'contain',
    ...style,
  };

  return (
    <img
      src={TOPIC_SRC_BY_SLUG[topic]}
      alt={decorative ? '' : (alt ?? '')}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
      loading="lazy"
      style={mergedStyle}
      {...props}
    />
  );
}
