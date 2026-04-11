export type BootstrapRouteFamily = 'public' | 'protected';

const PROTECTED_ROUTE_PREFIXES = ['/profiles', '/games', '/parent'] as const;

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveBootstrapRouteFamily(pathname: string): BootstrapRouteFamily {
  if (PROTECTED_ROUTE_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))) {
    return 'protected';
  }

  return 'public';
}
