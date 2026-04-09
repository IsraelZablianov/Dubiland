import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { buildJsonLdScripts, isValidJsonLdPayload, runJsonLdSmokeChecks } from './jsonLd';
import { getRouteMetadata, type RouteMetadataKey } from './routeMetadata';

const MANAGED_JSON_LD_SELECTOR = 'script[type="application/ld+json"][data-dubiland-json-ld="true"]';
const PARENTS_FAQ_KEYS = [
  { questionKey: 'parents.faq1Q', answerKey: 'parents.faq1A' },
  { questionKey: 'parents.faq2Q', answerKey: 'parents.faq2A' },
  { questionKey: 'parents.faq3Q', answerKey: 'parents.faq3A' },
  { questionKey: 'parents.faq4Q', answerKey: 'parents.faq4A' },
  { questionKey: 'parents.faq5Q', answerKey: 'parents.faq5A' },
] as const;

function ensureNamedMetaTag(name: string): HTMLMetaElement {
  const existingTag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (existingTag) {
    return existingTag;
  }

  const tag = document.createElement('meta');
  tag.setAttribute('name', name);
  document.head.append(tag);
  return tag;
}

function ensureLinkTag(selector: string, attributes: Record<string, string>): HTMLLinkElement {
  const existingTag = document.head.querySelector<HTMLLinkElement>(selector);
  if (existingTag) {
    return existingTag;
  }

  const tag = document.createElement('link');
  Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
    tag.setAttribute(attributeName, attributeValue);
  });
  document.head.append(tag);
  return tag;
}

function ensureManagedJsonLdScript(schemaId: string): HTMLScriptElement {
  const existingTag = document.head.querySelector<HTMLScriptElement>(
    `${MANAGED_JSON_LD_SELECTOR}[data-schema-id="${schemaId}"]`,
  );
  if (existingTag) {
    return existingTag;
  }

  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.setAttribute('data-dubiland-json-ld', 'true');
  tag.setAttribute('data-schema-id', schemaId);
  document.head.append(tag);
  return tag;
}

function clearUnusedJsonLdScripts(activeSchemaIds: Set<string>): void {
  const allManagedScripts = document.head.querySelectorAll<HTMLScriptElement>(MANAGED_JSON_LD_SELECTOR);
  allManagedScripts.forEach((scriptTag) => {
    const schemaId = scriptTag.getAttribute('data-schema-id');
    if (!schemaId || !activeSchemaIds.has(schemaId)) {
      scriptTag.remove();
    }
  });
}

function resolveCanonicalOrigin(): string {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL;
  if (!configuredSiteUrl) {
    return window.location.origin;
  }

  try {
    return new URL(configuredSiteUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function buildBreadcrumbItems(
  routeKey: RouteMetadataKey,
  labels: {
    home: string;
    letters: string;
    numbers: string;
    reading: string;
    parents: string;
    parentsFaq: string;
    terms: string;
    privacy: string;
  },
): Array<{ name: string; path: string }> {
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

export function RouteMetadataManager() {
  const { t: tSeo } = useTranslation('seo');
  const { t: tPublic } = useTranslation('public');
  const { t: tCommon } = useTranslation('common');
  const location = useLocation();
  const canonicalOrigin = useMemo(() => resolveCanonicalOrigin(), []);

  const routeMetadata = useMemo(() => getRouteMetadata(location.pathname), [location.pathname]);
  const metadata = useMemo(() => {
    const canonicalUrl = routeMetadata.canonicalPath
      ? new URL(routeMetadata.canonicalPath, canonicalOrigin).toString()
      : null;

    return {
      title: tSeo(`routes.${routeMetadata.key}.title`),
      description: tSeo(`routes.${routeMetadata.key}.description`),
      canonicalUrl,
      indexable: routeMetadata.indexable,
    };
  }, [canonicalOrigin, routeMetadata, tSeo]);

  const jsonLdScripts = useMemo(() => {
    if (!routeMetadata.indexable || !routeMetadata.canonicalPath) {
      return [];
    }

    const breadcrumbItems = buildBreadcrumbItems(routeMetadata.key, {
      home: tCommon('branding.appName'),
      letters: tCommon('topics.letters'),
      numbers: tCommon('topics.math'),
      reading: tCommon('topics.reading'),
      parents: tPublic('header.parents'),
      parentsFaq: tPublic('parents.faqTitle'),
      terms: tPublic('footer.terms'),
      privacy: tPublic('footer.privacy'),
    });

    const faqItems =
      routeMetadata.key === 'parentsFaq'
        ? PARENTS_FAQ_KEYS.map((keys) => ({
            question: tPublic(keys.questionKey),
            answer: tPublic(keys.answerKey),
          }))
        : [];

    return buildJsonLdScripts({
      routeKey: routeMetadata.key,
      indexable: routeMetadata.indexable,
      canonicalOrigin,
      canonicalPath: routeMetadata.canonicalPath,
      title: metadata.title,
      description: metadata.description,
      appName: tCommon('branding.appName'),
      breadcrumbItems,
      faqItems,
    });
  }, [canonicalOrigin, metadata.description, metadata.title, routeMetadata, tCommon, tPublic]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      runJsonLdSmokeChecks();
    }
  }, []);

  useEffect(() => {
    document.title = metadata.title;

    const descriptionTag = ensureNamedMetaTag('description');
    descriptionTag.content = metadata.description;

    if (metadata.canonicalUrl) {
      const canonicalTag = ensureLinkTag('link[rel="canonical"]', { rel: 'canonical' });
      canonicalTag.href = metadata.canonicalUrl;

      const hreflangTag = ensureLinkTag('link[rel="alternate"][hreflang="he"]', {
        rel: 'alternate',
        hreflang: 'he',
      });
      hreflangTag.href = metadata.canonicalUrl;
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('link[rel="alternate"][hreflang="he"]')?.remove();
    }

    const robotsTag = ensureNamedMetaTag('robots');
    robotsTag.content = metadata.indexable ? 'index,follow' : 'noindex,nofollow';
  }, [metadata]);

  useEffect(() => {
    const activeSchemaIds = new Set<string>();

    jsonLdScripts.forEach((script) => {
      if (!isValidJsonLdPayload(script.payload)) {
        if (import.meta.env.DEV) {
          console.warn('Skipping invalid JSON-LD payload', script.id, script.payload);
        }
        return;
      }

      const serializedPayload = JSON.stringify(script.payload);
      try {
        JSON.parse(serializedPayload);
      } catch {
        if (import.meta.env.DEV) {
          console.warn('Skipping non-serializable JSON-LD payload', script.id, script.payload);
        }
        return;
      }

      const scriptTag = ensureManagedJsonLdScript(script.id);
      scriptTag.text = serializedPayload;
      activeSchemaIds.add(script.id);
    });

    clearUnusedJsonLdScripts(activeSchemaIds);
  }, [jsonLdScripts]);

  return null;
}
