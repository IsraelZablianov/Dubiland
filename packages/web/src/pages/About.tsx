import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import {
  FeatureIllustration,
  MascotIllustration,
  type FeatureIllustrationKind,
} from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';

const APPROACH_ITEMS = [
  { key: '1', icon: 'play' },
  { key: '2', icon: 'hebrew' },
  { key: '3', icon: 'adaptive' },
  { key: '4', icon: 'safe' },
] as const satisfies ReadonlyArray<{ key: '1' | '2' | '3' | '4'; icon: FeatureIllustrationKind }>;

const APPROACH_TONE_BY_KEY: Record<
  (typeof APPROACH_ITEMS)[number]['key'],
  'accent' | 'success'
> = {
  '1': 'accent',
  '2': 'success',
  '3': 'accent',
  '4': 'success',
};

export default function About() {
  const { t } = useTranslation('public');

  return (
    <div className="about">
      {/* Hero */}
      <section className="about__hero">
        <div className="about__hero-inner">
          <h1 className="about__title">{t('about.title')}</h1>
          <p className="about__hero-text">{t('about.heroText')}</p>
        </div>
      </section>

      {/* Family note */}
      <section className="about__section about__section--family">
        <div className="about__family-grid">
          <Card padding="lg" className="about__family-card">
            <h2 className="about__family-card-title">{t('about.dedicationTitle')}</h2>
            <p className="about__family-card-text">{t('about.dedication')}</p>
          </Card>
          <Card padding="lg" className="about__family-card">
            <h2 className="about__family-card-title">{t('about.freeForEveryoneTitle')}</h2>
            <p className="about__family-card-text">{t('about.freeForEveryone')}</p>
          </Card>
        </div>
      </section>

      {/* Mission */}
      <section className="about__section">
        <h2 className="about__section-title">{t('about.missionTitle')}</h2>
        <p className="about__section-text">{t('about.missionText')}</p>
      </section>

      {/* Approach */}
      <section className="about__section about__section--alt">
        <h2 className="about__section-title">{t('about.approachTitle')}</h2>
        <div className="about__approach-grid">
          {APPROACH_ITEMS.map(({ key, icon }) => (
            <Card key={key} padding="lg" className="about__approach-card">
              <FeatureIllustration kind={icon} size={74} tone={APPROACH_TONE_BY_KEY[key]} />
              <h3 className="about__approach-card-title">{t(`about.approachItem${key}Title`)}</h3>
              <p className="about__approach-card-desc">{t(`about.approachItem${key}Desc`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Mascot */}
      <section className="about__section about__mascot-section">
        <div className="about__mascot-inner">
          <FloatingElement className="about__mascot-float">
            <MascotIllustration variant="hero" size={180} />
          </FloatingElement>
          <div>
            <h2 className="about__section-title" style={{ textAlign: 'start' }}>
              {t('about.mascotTitle')}
            </h2>
            <p className="about__section-text">{t('about.mascotText')}</p>
          </div>
        </div>
      </section>

      <style>{`
        .about__hero {
          background: var(--color-theme-bg);
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
        }

        .about__hero-inner {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .about__title {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .about__hero-text {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .about__section {
          max-width: 900px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-xl);
        }

        .about__section--alt {
          max-width: none;
          background: var(--color-bg-secondary);
        }

        .about__section--family {
          padding-top: var(--space-2xl);
          padding-bottom: var(--space-2xl);
        }

        .about__family-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--space-lg);
        }

        .about__family-card {
          background: linear-gradient(135deg, #fffaf3 0%, #f2f8ff 100%);
          border: 2px dashed rgba(164, 109, 38, 0.18);
          text-align: start;
          display: grid;
          gap: var(--space-sm);
        }

        .about__family-card-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .about__family-card-text {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .about__section--alt > * {
          max-width: 900px;
          margin-inline: auto;
        }

        .about__section-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: var(--space-lg);
        }

        .about__section-text {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          text-align: center;
        }

        .about__approach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-lg);
          margin-top: var(--space-lg);
        }

        .about__approach-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          transition: var(--transition-normal);
        }

        .about__approach-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .about__approach-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .about__approach-card-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .about__mascot-section {
          background: var(--color-theme-bg);
          max-width: none;
        }

        .about__mascot-inner {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-2xl);
          align-items: center;
        }

        .about__mascot-float {
          filter: drop-shadow(0 4px 16px rgba(93, 58, 26, 0.15));
        }

        .about__mascot-inner .about__section-text {
          text-align: start;
        }

        @media (max-width: 640px) {
          .about__mascot-inner {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .about__mascot-float { justify-self: center; }

          .about__mascot-inner .about__section-title,
          .about__mascot-inner .about__section-text {
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
