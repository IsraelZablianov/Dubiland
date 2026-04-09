import './types';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/he/common.json';
import onboarding from './locales/he/onboarding.json';

i18n.use(initReactI18next).init({
  resources: {
    he: {
      common,
      onboarding,
    },
  },
  lng: 'he',
  fallbackLng: 'he',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
