import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CANONICAL_SITE_URL = 'https://israelzablianov.github.io/Dubiland/';
const DEFAULT_OPEN_GRAPH_IMAGE_PATH = '/images/games/thumbnails/contact-sheet-16x10.webp';
const SEO_JSON_PATH = path.resolve(process.cwd(), 'src/i18n/locales/he/seo.json');
const PUBLIC_JSON_PATH = path.resolve(process.cwd(), 'src/i18n/locales/he/public.json');

const INDEXABLE_PUBLIC_ROUTES = [
  { path: '/', routeKey: 'landing' },
  { path: '/about', routeKey: 'about' },
  { path: '/letters', routeKey: 'letters' },
  { path: '/numbers', routeKey: 'numbers' },
  { path: '/reading', routeKey: 'reading' },
  { path: '/parents', routeKey: 'parents' },
  { path: '/parents/faq', routeKey: 'parentsFaq' },
  { path: '/terms', routeKey: 'terms' },
  { path: '/privacy', routeKey: 'privacy' },
];

const WEB_APPLICATION_ROUTE_KEYS = new Set(['landing', 'letters', 'numbers', 'reading']);
const PARENTS_FAQ_KEYS = [
  { questionKey: 'parents.faq1Q', answerKey: 'parents.faq1A' },
  { questionKey: 'parents.faq2Q', answerKey: 'parents.faq2A' },
  { questionKey: 'parents.faq3Q', answerKey: 'parents.faq3A' },
  { questionKey: 'parents.faq4Q', answerKey: 'parents.faq4A' },
  { questionKey: 'parents.faq5Q', answerKey: 'parents.faq5A' },
];

const HEAD_TAG_PATTERNS = [
  /\s*<title>[\s\S]*?<\/title>\s*/gi,
  /\s*<meta(?=[^>]*\bname=["']description["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bproperty=["']og:title["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bproperty=["']og:description["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bproperty=["']og:image["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bname=["']twitter:title["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bname=["']twitter:description["'])[^>]*>\s*/gi,
  /\s*<meta(?=[^>]*\bname=["']robots["'])[^>]*>\s*/gi,
  /\s*<link(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi,
  /\s*<link(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']he["'])[^>]*>\s*/gi,
  /\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
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

function buildAbsoluteAssetUrl(canonicalSiteUrl, assetPath) {
  const basePath = normalizeBasePath(canonicalSiteUrl.pathname);
  const normalizedAssetPath = normalizeRoutePath(assetPath);
  const url = new URL(canonicalSiteUrl.origin);

  if (!basePath) {
    url.pathname = normalizedAssetPath;
    return url.toString();
  }

  if (normalizedAssetPath === basePath || normalizedAssetPath.startsWith(`${basePath}/`)) {
    url.pathname = normalizedAssetPath;
    return url.toString();
  }

  url.pathname = `${basePath}${normalizedAssetPath}`;
  return url.toString();
}

function toHtmlFilePath(distDir, routePath) {
  if (routePath === '/') {
    return path.join(distDir, 'index.html');
  }

  const normalizedRoutePath = routePath.replace(/^\/+/, '');
  if (!normalizedRoutePath) {
    throw new Error(`Cannot generate file path for route "${routePath}"`);
  }

  return path.join(distDir, `${normalizedRoutePath}.html`);
}

function getNestedValue(object, dottedPath) {
  return dottedPath.split('.').reduce((current, key) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return current[key];
  }, object);
}

function getRequiredText(resource, keyPath) {
  const value = getNestedValue(resource, keyPath);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required translation key: ${keyPath}`);
  }

  return value;
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripManagedHeadTags(html) {
  let nextHtml = html;

  HEAD_TAG_PATTERNS.forEach((pattern) => {
    nextHtml = nextHtml.replace(pattern, '\n');
  });

  nextHtml = nextHtml.replace(/\s*<!--\s*JSON-LD Structured Data\s*-->\s*/gi, '\n');
  nextHtml = nextHtml.replace(/\n{3,}/g, '\n\n');

  return nextHtml;
}

function buildBreadcrumbItems(routeKey, labels) {
  const home = [{ name: labels.home, path: '/' }];

  if (routeKey === 'letters') {
    return [...home, { name: labels.letters, path: '/letters' }];
  }

  if (routeKey === 'numbers') {
    return [...home, { name: labels.numbers, path: '/numbers' }];
  }

  if (routeKey === 'reading') {
    return [...home, { name: labels.reading, path: '/reading' }];
  }

  if (routeKey === 'parents') {
    return [...home, { name: labels.parents, path: '/parents' }];
  }

  if (routeKey === 'parentsFaq') {
    return [
      ...home,
      { name: labels.parents, path: '/parents' },
      { name: labels.parentsFaq, path: '/parents/faq' },
    ];
  }

  if (routeKey === 'terms') {
    return [...home, { name: labels.terms, path: '/terms' }];
  }

  if (routeKey === 'privacy') {
    return [...home, { name: labels.privacy, path: '/privacy' }];
  }

  return home;
}

function buildJsonLdScripts({
  routeKey,
  canonicalSiteUrl,
  canonicalPath,
  title,
  description,
  appName,
  breadcrumbItems,
  faqItems,
}) {
  const scripts = [
    {
      id: 'organization',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: appName,
        alternateName: 'Dubiland',
        url: buildAbsoluteRouteUrl(canonicalSiteUrl, '/'),
        logo: buildAbsoluteRouteUrl(canonicalSiteUrl, '/favicon.svg'),
        description,
        inLanguage: 'he-IL',
      },
    },
  ];

  if (WEB_APPLICATION_ROUTE_KEYS.has(routeKey)) {
    scripts.push({
      id: 'web-application',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: title,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description,
        url: buildAbsoluteRouteUrl(canonicalSiteUrl, canonicalPath),
        inLanguage: 'he-IL',
      },
    });
  }

  if (breadcrumbItems.length > 1) {
    scripts.push({
      id: 'breadcrumb-list',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: buildAbsoluteRouteUrl(canonicalSiteUrl, item.path),
        })),
      },
    });
  }

  if (routeKey === 'parentsFaq' && faqItems.length > 0) {
    scripts.push({
      id: 'faq-page',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    });
  }

  return scripts;
}

function renderJsonLdScript({ id, payload }) {
  const serializedPayload = JSON.stringify(payload, null, 2)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');

  return [
    `    <script type="application/ld+json" data-dubiland-json-ld="true" data-schema-id="${id}">`,
    serializedPayload,
    '    </script>',
  ].join('\n');
}

function renderManagedHeadBlock({ title, description, canonicalUrl, openGraphImageUrl, jsonLdScripts }) {
  const escapedTitle = escapeHtmlAttribute(title);
  const escapedDescription = escapeHtmlAttribute(description);
  const escapedCanonicalUrl = escapeHtmlAttribute(canonicalUrl);
  const escapedOpenGraphImageUrl = escapeHtmlAttribute(openGraphImageUrl);

  const headLines = [
    `    <title>${escapedTitle}</title>`,
    `    <meta name="description" content="${escapedDescription}" />`,
    `    <meta property="og:title" content="${escapedTitle}" />`,
    `    <meta property="og:description" content="${escapedDescription}" />`,
    `    <meta property="og:url" content="${escapedCanonicalUrl}" />`,
    `    <meta property="og:image" content="${escapedOpenGraphImageUrl}" />`,
    `    <meta name="twitter:title" content="${escapedTitle}" />`,
    `    <meta name="twitter:description" content="${escapedDescription}" />`,
    `    <link rel="canonical" href="${escapedCanonicalUrl}" />`,
    `    <link rel="alternate" hreflang="he" href="${escapedCanonicalUrl}" />`,
    '    <meta name="robots" content="index,follow" />',
    ...jsonLdScripts.map((script) => renderJsonLdScript(script)),
  ];

  return headLines.join('\n');
}

function applyRouteHead(sourceIndexHtml, routeHeadHtml) {
  const strippedHeadHtml = stripManagedHeadTags(sourceIndexHtml);

  if (!strippedHeadHtml.includes('</head>')) {
    throw new Error('Expected </head> closing tag in dist/index.html');
  }

  return strippedHeadHtml.replace('</head>', `${routeHeadHtml}\n  </head>`);
}

async function loadI18nResources() {
  const [seoResourceRaw, publicResourceRaw] = await Promise.all([
    readFile(SEO_JSON_PATH, 'utf8'),
    readFile(PUBLIC_JSON_PATH, 'utf8'),
  ]);

  return {
    seo: JSON.parse(seoResourceRaw),
    publicNs: JSON.parse(publicResourceRaw),
  };
}

function buildRouteHeadData(routeConfig, resources, canonicalSiteUrl) {
  const title = getRequiredText(resources.seo, `routes.${routeConfig.routeKey}.title`);
  const description = getRequiredText(resources.seo, `routes.${routeConfig.routeKey}.description`);
  const canonicalUrl = buildAbsoluteRouteUrl(canonicalSiteUrl, routeConfig.path);
  const openGraphImageUrl = buildAbsoluteAssetUrl(canonicalSiteUrl, DEFAULT_OPEN_GRAPH_IMAGE_PATH);

  const appName = getRequiredText(resources.publicNs, 'footer.aboutTitle');
  const breadcrumbItems = buildBreadcrumbItems(routeConfig.routeKey, {
    home: appName,
    letters: getRequiredText(resources.publicNs, 'landing.topicLettersTitle'),
    numbers: getRequiredText(resources.publicNs, 'landing.topicMathTitle'),
    reading: getRequiredText(resources.publicNs, 'landing.topicReadingTitle'),
    parents: getRequiredText(resources.publicNs, 'header.parents'),
    parentsFaq: getRequiredText(resources.publicNs, 'parents.faqTitle'),
    terms: getRequiredText(resources.publicNs, 'footer.terms'),
    privacy: getRequiredText(resources.publicNs, 'footer.privacy'),
  });

  const faqItems =
    routeConfig.routeKey === 'parentsFaq'
      ? PARENTS_FAQ_KEYS.map((keyPair) => ({
          question: getRequiredText(resources.publicNs, keyPair.questionKey),
          answer: getRequiredText(resources.publicNs, keyPair.answerKey),
        }))
      : [];

  const jsonLdScripts = buildJsonLdScripts({
    routeKey: routeConfig.routeKey,
    canonicalSiteUrl,
    canonicalPath: routeConfig.path,
    title,
    description,
    appName,
    breadcrumbItems,
    faqItems,
  });

  return {
    title,
    description,
    canonicalUrl,
    openGraphImageUrl,
    jsonLdScripts,
  };
}

async function generateSeoRouteHtml() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const sourceIndexPath = path.join(distDir, 'index.html');
  const sourceIndexHtml = await readFile(sourceIndexPath, 'utf8');
  const resources = await loadI18nResources();
  const canonicalSiteUrl = resolveCanonicalSiteUrl();

  await Promise.all(
    INDEXABLE_PUBLIC_ROUTES.map(async (routeConfig) => {
      const routeHeadData = buildRouteHeadData(routeConfig, resources, canonicalSiteUrl);
      const routeHeadHtml = renderManagedHeadBlock(routeHeadData);
      const routeHtml = applyRouteHead(sourceIndexHtml, routeHeadHtml);
      const routeHtmlPath = toHtmlFilePath(distDir, routeConfig.path);

      await mkdir(path.dirname(routeHtmlPath), { recursive: true });
      await writeFile(routeHtmlPath, routeHtml, 'utf8');
      process.stdout.write(
        `Generated ${path.relative(distDir, routeHtmlPath)} for route ${routeConfig.path}\n`,
      );
    }),
  );

  process.stdout.write(`Canonical site URL: ${canonicalSiteUrl.toString()}\n`);
}

generateSeoRouteHtml().catch((error) => {
  process.stderr.write(`Failed to generate SEO route HTML files: ${error.message}\n`);
  process.exitCode = 1;
});
