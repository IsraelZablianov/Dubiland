import type common from './locales/he/common.json';
import type onboarding from './locales/he/onboarding.json';

export interface I18nResources {
  common: typeof common;
  onboarding: typeof onboarding;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: I18nResources;
  }
}
