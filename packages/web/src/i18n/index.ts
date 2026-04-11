import './types';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import onboarding from './locales/he/onboarding.json';
import publicNs from './locales/he/public.json';
import seo from './locales/he/seo.json';

const DEFAULT_LOCALE = 'he';
const COMMON_NAMESPACE = 'common';
let commonNamespacePromise: Promise<void> | null = null;

function hasNamespaceBundle(namespace: string): boolean {
  return i18n.hasResourceBundle(DEFAULT_LOCALE, namespace);
}

export function hasCommonNamespaceLoaded(): boolean {
  return hasNamespaceBundle(COMMON_NAMESPACE);
}

export async function ensureCommonNamespaceLoaded(): Promise<void> {
  if (hasCommonNamespaceLoaded()) {
    return;
  }

  if (!commonNamespacePromise) {
    commonNamespacePromise = import('./locales/he/common.json')
      .then(({ default: common }) => {
        if (!hasNamespaceBundle(COMMON_NAMESPACE)) {
          i18n.addResourceBundle(DEFAULT_LOCALE, COMMON_NAMESPACE, common, true, true);
        }
      })
      .finally(() => {
        commonNamespacePromise = null;
      });
  }

  await commonNamespacePromise;
}

void i18n.use(initReactI18next).init({
  resources: {
    he: {
      onboarding,
      public: publicNs,
      seo,
    },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'public',
  ns: ['public', 'onboarding', 'seo', COMMON_NAMESPACE],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
