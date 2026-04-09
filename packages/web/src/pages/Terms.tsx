import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';

const SECTION_KEYS = [
  'acceptance',
  'serviceDescription',
  'childUse',
  'parentResponsibility',
  'availability',
  'contact',
] as const;

export default function Terms() {
  const { t } = useTranslation('public');

  return (
    <div className="legal-page">
      <header className="legal-page__hero">
        <div className="legal-page__hero-inner">
          <h1 className="legal-page__title">{t('terms.title')}</h1>
          <p className="legal-page__subtitle">{t('terms.subtitle')}</p>
          <p className="legal-page__updated">
            {t('terms.lastUpdated', { date: t('terms.lastUpdatedDate') })}
          </p>
        </div>
      </header>

      <main className="legal-page__content">
        {SECTION_KEYS.map((sectionKey) => (
          <Card key={sectionKey} padding="lg" className="legal-page__card">
            <h2 className="legal-page__card-title">{t(`terms.sections.${sectionKey}.title`)}</h2>
            <p className="legal-page__card-body">{t(`terms.sections.${sectionKey}.body`)}</p>
          </Card>
        ))}
      </main>

      <style>{`
        .legal-page__hero {
          background: linear-gradient(180deg, var(--color-theme-bg) 0%, rgba(255, 255, 255, 0) 100%);
          padding: var(--space-3xl) var(--space-xl) var(--space-2xl);
        }

        .legal-page__hero-inner {
          max-width: 900px;
          margin-inline: auto;
          display: grid;
          gap: var(--space-md);
          text-align: center;
        }

        .legal-page__title {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .legal-page__subtitle {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .legal-page__updated {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }

        .legal-page__content {
          max-width: 900px;
          margin-inline: auto;
          padding: 0 var(--space-xl) var(--space-3xl);
          display: grid;
          gap: var(--space-md);
        }

        .legal-page__card {
          text-align: start;
        }

        .legal-page__card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-sm);
        }

        .legal-page__card-body {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }
      `}</style>
    </div>
  );
}
