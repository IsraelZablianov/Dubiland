import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CANONICAL_SITE_URL = 'https://israelzablianov.github.io/Dubiland/';

const INDEXABLE_PUBLIC_ROUTES = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    llmsLabel: 'Home and product overview',
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: '0.7',
    llmsLabel: 'About Dubiland and learning approach',
  },
  {
    path: '/letters',
    changefreq: 'monthly',
    priority: '0.8',
    llmsLabel: 'Hebrew letters learning',
  },
  {
    path: '/numbers',
    changefreq: 'monthly',
    priority: '0.8',
    llmsLabel: 'Early math and numbers',
  },
  {
    path: '/reading',
    changefreq: 'monthly',
    priority: '0.8',
    llmsLabel: 'Early reading activities',
  },
  {
    path: '/parents',
    changefreq: 'monthly',
    priority: '0.8',
    llmsLabel: 'Parent information hub',
  },
  {
    path: '/parents/faq',
    changefreq: 'monthly',
    priority: '0.7',
    llmsLabel: 'Parent FAQ',
  },
  {
    path: '/terms',
    changefreq: 'monthly',
    priority: '0.5',
    llmsLabel: 'Terms of service',
  },
  {
    path: '/privacy',
    changefreq: 'monthly',
    priority: '0.5',
    llmsLabel: 'Privacy policy',
  },
];

const AUTH_PRIVATE_ROUTES = ['/profiles', '/parent', '/login', '/games'];

const EXPLICIT_ALLOWED_USER_AGENTS = [
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
];

function normalizeSiteUrl(rawSiteUrl) {
  const siteUrl = new URL(rawSiteUrl);
  const protocol = siteUrl.protocol.toLowerCase();

  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error(`Unsupported protocol for site URL: ${siteUrl.protocol}`);
  }

  siteUrl.search = '';
  siteUrl.hash = '';

  const trimmedPathname = siteUrl.pathname.replace(/\/+$/g, '');
  siteUrl.pathname = trimmedPathname ? `${trimmedPathname}/` : '/';

  return siteUrl;
}

function resolveCanonicalSiteUrl() {
  const configuredSiteUrl = process.env.VITE_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return normalizeSiteUrl(configuredSiteUrl);
  }

  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const repository = process.env.GITHUB_REPOSITORY?.trim();

  if (isGitHubActions && repository && repository.includes('/')) {
    const [owner, repo] = repository.split('/');
    return normalizeSiteUrl(`https://${owner}.github.io/${repo}/`);
  }

  return normalizeSiteUrl(DEFAULT_CANONICAL_SITE_URL);
}

function normalizeBasePath(pathname) {
  if (!pathname || pathname === '/') {
    return '';
  }

  return `/${pathname.replace(/^\/+|\/+$/g, '')}`;
}

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return `/${pathname.replace(/^\/+/, '')}`;
}

function joinBasePath(basePath, routePath) {
  if (!basePath) {
    return routePath;
  }

  if (routePath === '/') {
    return `${basePath}/`;
  }

  return `${basePath}${routePath}`;
}

function buildAbsoluteRouteUrl(canonicalSiteUrl, routePath) {
  const basePath = normalizeBasePath(canonicalSiteUrl.pathname);
  const normalizedRoutePath = normalizeRoutePath(routePath);
  const url = new URL(canonicalSiteUrl.origin);

  url.pathname = joinBasePath(basePath, normalizedRoutePath);
  return url.toString();
}

function buildRobotsPath(canonicalSiteUrl, routePath) {
  const basePath = normalizeBasePath(canonicalSiteUrl.pathname);
  const normalizedRoutePath = normalizeRoutePath(routePath);

  return joinBasePath(basePath, normalizedRoutePath);
}

function buildSitemapXml(canonicalSiteUrl) {
  const urlEntries = INDEXABLE_PUBLIC_ROUTES.map((routeConfig) => {
    const loc = buildAbsoluteRouteUrl(canonicalSiteUrl, routeConfig.path);

    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <changefreq>${routeConfig.changefreq}</changefreq>`,
      `    <priority>${routeConfig.priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n');
}

function buildRobotsTxt(canonicalSiteUrl) {
  const sitemapUrl = buildAbsoluteRouteUrl(canonicalSiteUrl, '/sitemap.xml');
  const allowRoutes = INDEXABLE_PUBLIC_ROUTES.map((routeConfig) =>
    buildRobotsPath(canonicalSiteUrl, routeConfig.path),
  );
  const disallowRoutes = AUTH_PRIVATE_ROUTES.map((routePath) => buildRobotsPath(canonicalSiteUrl, routePath));

  const lines = [
    '# Dubiland crawl policy',
    '',
    'User-agent: *',
    ...allowRoutes.map((allowRoute) => `Allow: ${allowRoute}`),
    ...disallowRoutes.map((disallowRoute) => `Disallow: ${disallowRoute}`),
    '',
  ];

  EXPLICIT_ALLOWED_USER_AGENTS.forEach((userAgent) => {
    lines.push(`User-agent: ${userAgent}`);
    lines.push(`Allow: ${buildRobotsPath(canonicalSiteUrl, '/')}`);
    lines.push('');
  });

  lines.push(`Sitemap: ${sitemapUrl}`);
  lines.push('');

  return lines.join('\n');
}

function buildLlmsTxt(canonicalSiteUrl) {
  const routeLines = INDEXABLE_PUBLIC_ROUTES.map((routeConfig) => {
    const url = buildAbsoluteRouteUrl(canonicalSiteUrl, routeConfig.path);
    return `- ${routeConfig.llmsLabel}: ${url}`;
  });

  return [
    '# Dubiland (דובילנד)',
    '',
    'Dubiland is a Hebrew learning web platform for children ages 3-7.',
    'The mascot is a teddy bear named Dubi (דובי).',
    '',
    '## Product summary',
    '- Parent-guided learning experiences in Hebrew (RTL).',
    '- Content types: games, songs, and videos.',
    '- Topics: letters, reading, and early math.',
    '',
    '## Audience',
    '- Parents and caregivers of children ages 3-7.',
    '- Hebrew-speaking households and early childhood educators.',
    '',
    '## Public discovery routes (Q2 2026)',
    ...routeLines,
    '',
    '## Crawl and trust notes',
    '- Public routes above are intended for search indexing and AI assistants.',
    '- Auth and child-data routes are private: /login, /profiles, /parent, /games/*.',
    '- No public user-generated content.',
    '',
    '## Preferred citation',
    '- Name: Dubiland (דובילנד)',
    '- Description: Hebrew learning platform for children ages 3-7.',
    '',
  ].join('\n');
}

function resolveOutputDirectory() {
  if (process.argv.includes('--dist')) {
    return path.resolve(process.cwd(), 'dist');
  }

  return path.resolve(process.cwd(), 'public');
}

async function writeCrawlAssets() {
  const outputDirectory = resolveOutputDirectory();
  const canonicalSiteUrl = resolveCanonicalSiteUrl();

  await mkdir(outputDirectory, { recursive: true });

  const robotsPath = path.join(outputDirectory, 'robots.txt');
  const sitemapPath = path.join(outputDirectory, 'sitemap.xml');
  const llmsPath = path.join(outputDirectory, 'llms.txt');

  await Promise.all([
    writeFile(robotsPath, buildRobotsTxt(canonicalSiteUrl), 'utf8'),
    writeFile(sitemapPath, buildSitemapXml(canonicalSiteUrl), 'utf8'),
    writeFile(llmsPath, buildLlmsTxt(canonicalSiteUrl), 'utf8'),
  ]);

  process.stdout.write(`Generated crawl assets in ${outputDirectory}\n`);
  process.stdout.write(`Canonical site URL: ${canonicalSiteUrl.toString()}\n`);
}

writeCrawlAssets().catch((error) => {
  process.stderr.write(`Failed to generate crawl assets: ${error.message}\n`);
  process.exitCode = 1;
});
