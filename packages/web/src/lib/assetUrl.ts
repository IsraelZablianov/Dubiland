const runtimeBaseUrl =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as { env?: { BASE_URL?: unknown } }).env?.BASE_URL === 'string'
    ? ((import.meta as { env: { BASE_URL: string } }).env.BASE_URL as string)
    : '/';
const base = runtimeBaseUrl.replace(/\/$/, '');

/**
 * Resolve a public asset path respecting the Vite `base` config.
 * Turns `/images/foo.svg` into `/Dubiland/images/foo.svg` on GitHub Pages,
 * or leaves it as `/images/foo.svg` in local dev.
 */
export function assetUrl(path: string): string {
  if (!base || path.startsWith(base)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
