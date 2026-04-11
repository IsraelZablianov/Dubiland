import './types';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import onboarding from './locales/he/onboarding.json';
import publicNs from './locales/he/public.json';

const DEFAULT_LOCALE = 'he';
const COMMON_NAMESPACE = 'common';
const SEO_NAMESPACE = 'seo';
type DeferredNamespace = typeof COMMON_NAMESPACE | typeof SEO_NAMESPACE;
const deferredNamespacePromises = new Map<DeferredNamespace, Promise<void>>();

function hasNamespaceBundle(namespace: string): boolean {
  return i18n.hasResourceBundle(DEFAULT_LOCALE, namespace);
}

function resolveDeferredNamespaceLoader(namespace: DeferredNamespace): () => Promise<Record<string, unknown>> {
  if (namespace === COMMON_NAMESPACE) {
    return async () => (await import('./locales/he/common.json')).default as Record<string, unknown>;
  }

  return async () => (await import('./locales/he/seo.json')).default as Record<string, unknown>;
}

export function hasNamespaceLoaded(namespace: string): boolean {
  return hasNamespaceBundle(namespace);
}

export function hasCommonNamespaceLoaded(): boolean {
  return hasNamespaceLoaded(COMMON_NAMESPACE);
}

export async function ensureNamespaceLoaded(namespace: DeferredNamespace): Promise<void> {
  if (hasNamespaceLoaded(namespace)) {
    return;
  }

  const inFlightLoad = deferredNamespacePromises.get(namespace);
  if (inFlightLoad) {
    await inFlightLoad;
    return;
  }

  const loadPromise = resolveDeferredNamespaceLoader(namespace)()
    .then((namespaceResources) => {
      if (!hasNamespaceBundle(namespace)) {
        i18n.addResourceBundle(DEFAULT_LOCALE, namespace, namespaceResources, true, true);
      }
    })
    .finally(() => {
      deferredNamespacePromises.delete(namespace);
    });

  deferredNamespacePromises.set(namespace, loadPromise);
  await loadPromise;
}

export async function ensureCommonNamespaceLoaded(): Promise<void> {
  await ensureNamespaceLoaded(COMMON_NAMESPACE);
}

export async function ensureSeoNamespaceLoaded(): Promise<void> {
  await ensureNamespaceLoaded(SEO_NAMESPACE);
}

export function hasSeoNamespaceLoaded(): boolean {
  return hasNamespaceLoaded(SEO_NAMESPACE);
}

void i18n.use(initReactI18next).init({
  resources: {
    he: {
      onboarding,
      public: publicNs,
    },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'public',
  ns: ['public', 'onboarding'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
