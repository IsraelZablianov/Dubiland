/** Vite injects `import.meta.env.BASE_URL` at build time from `vite.config` `base` — avoid `typeof import.meta` guards (they minify badly and can pick the wrong branch). */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Resolve a public asset path respecting the Vite `base` config.
 * Turns `/images/foo.svg` into `/Dubiland/images/foo.svg` on GitHub Pages,
 * or leaves it as `/images/foo.svg` in local dev.
 */
export function assetUrl(path: string): string {
  if (!base || path.startsWith(base)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
