export function isRtlDirection(direction: string | undefined): boolean {
  return direction === 'rtl';
}

export function rtlReplayGlyph(_isRtl: boolean): string {
  return '▶';
}

export function rtlNextGlyph(isRtl: boolean): string {
  return isRtl ? '←' : '→';
}

export function rtlProgressGradient(isRtl: boolean, startColor: string, endColor: string): string {
  const angle = isRtl ? 270 : 90;
  return `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;
}
