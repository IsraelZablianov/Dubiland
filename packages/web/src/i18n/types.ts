import type common from './locales/he/common.json';
import type onboarding from './locales/he/onboarding.json';
import type publicNs from './locales/he/public.json';
import type seo from './locales/he/seo.json';

export interface I18nResources {
  common: typeof common;
  onboarding: typeof onboarding;
  public: typeof publicNs;
  seo: typeof seo;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: I18nResources;
  }
}
