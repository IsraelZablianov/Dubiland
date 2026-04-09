import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getRouteMetadata } from './routeMetadata';

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

export function RouteMetadataManager() {
  const { t } = useTranslation('seo');
  const location = useLocation();

  const metadata = useMemo(() => {
    const routeMetadata = getRouteMetadata(location.pathname);
    const canonicalUrl = new URL(routeMetadata.canonicalPath, resolveCanonicalOrigin()).toString();

    return {
      title: t(`routes.${routeMetadata.key}.title`),
      description: t(`routes.${routeMetadata.key}.description`),
      canonicalUrl,
      indexable: routeMetadata.indexable,
    };
  }, [location.pathname, t]);

  useEffect(() => {
    document.title = metadata.title;

    const descriptionTag = ensureNamedMetaTag('description');
    descriptionTag.content = metadata.description;

    const canonicalTag = ensureLinkTag('link[rel="canonical"]', { rel: 'canonical' });
    canonicalTag.href = metadata.canonicalUrl;

    const hreflangTag = ensureLinkTag('link[rel="alternate"][hreflang="he"]', {
      rel: 'alternate',
      hreflang: 'he',
    });
    hreflangTag.href = metadata.canonicalUrl;

    const robotsTag = ensureNamedMetaTag('robots');
    robotsTag.content = metadata.indexable ? 'index,follow' : 'noindex,follow';
  }, [metadata]);

  return null;
}
