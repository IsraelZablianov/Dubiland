import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';

const SECTION_KEYS = [
  'overview',
  'whatWeCollect',
  'howWeUseData',
  'childPrivacy',
  'security',
  'contact',
] as const;

export default function Privacy() {
  const { t } = useTranslation('public');
  const titleId = 'privacy-page-title';

  return (
    <div className="legal-page">
      <header className="legal-page__hero">
        <div className="legal-page__hero-inner">
          <h1 id={titleId} className="legal-page__title">{t('privacy.title')}</h1>
          <p className="legal-page__subtitle">{t('privacy.subtitle')}</p>
          <p className="legal-page__updated">
            {t('privacy.lastUpdated', { date: t('privacy.lastUpdatedDate') })}
          </p>
        </div>
      </header>

      <section className="legal-page__content" aria-labelledby={titleId}>
        {SECTION_KEYS.map((sectionKey) => (
          <Card key={sectionKey} padding="lg" className="legal-page__card">
            <h2 className="legal-page__card-title">{t(`privacy.sections.${sectionKey}.title`)}</h2>
            <p className="legal-page__card-body">{t(`privacy.sections.${sectionKey}.body`)}</p>
          </Card>
        ))}
      </section>

      <style>{`
        .legal-page {
          min-height: 100%;
          padding-bottom: var(--space-2xl);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-theme-bg) 86%, transparent) 0%,
              color-mix(in srgb, var(--color-theme-bg) 94%, transparent) 100%
            ),
            radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--color-theme-secondary) 28%, transparent), transparent 42%),
            radial-gradient(circle at 10% 6%, color-mix(in srgb, var(--color-theme-primary) 16%, transparent), transparent 38%),
            url('/images/backgrounds/legal/legal-storybook.webp') center top / cover no-repeat,
            var(--color-theme-bg);
        }

        .legal-page__hero {
          padding: clamp(var(--space-xl), 5vw, var(--space-3xl)) var(--space-xl) var(--space-xl);
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
          color: var(--color-text-secondary);
        }

        .legal-page__content {
          max-width: 900px;
          margin-inline: auto;
          margin-top: calc(var(--space-lg) * -1);
          padding: 0 var(--space-xl);
          display: grid;
          gap: var(--space-md);
        }

        .legal-page__card {
          text-align: start;
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 14%, transparent);
          box-shadow: var(--shadow-card);
          background:
            linear-gradient(
              160deg,
              color-mix(in srgb, var(--color-bg-card) 92%, var(--color-theme-secondary) 8%),
              var(--color-bg-card)
            );
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

        @media (max-width: 700px) {
          .legal-page {
            padding-bottom: var(--space-xl);
          }

          .legal-page__hero,
          .legal-page__content {
            padding-inline: var(--space-md);
          }

          .legal-page__title {
            font-size: clamp(1.75rem, 8vw, 2.4rem);
          }
        }
      `}</style>
    </div>
  );
}
