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

      {/* Family — the stars */}
      <section className="about__section about__section--gallery">
        <div className="about__gallery-header">
          <h2 className="about__section-title about__gallery-title">{t('about.familyGalleryTitle')}</h2>
          <p className="about__section-text">{t('about.familyGallerySubtitle')}</p>
        </div>

        <div className="about__gallery-stage">
          <div className="about__gallery-frame">
            <img
              src="/images/about/boys-soccer.jpg"
              alt={t('about.sceneSoccer')}
              className="about__gallery-image"
              loading="eager"
              width={892}
              height={478}
            />
            <p className="about__gallery-caption">{t('about.sceneSoccer')}</p>
          </div>
        </div>
      </section>

      {/* Family note */}
      <section className="about__section about__section--family">
        <div className="about__family-grid">
          <Card padding="lg" className="about__family-card">
            <div className="about__family-card-icon">💝</div>
            <h2 className="about__family-card-title">{t('about.dedicationTitle')}</h2>
            <p className="about__family-card-text">{t('about.dedication')}</p>
          </Card>
          <Card padding="lg" className="about__family-card">
            <div className="about__family-card-icon">🎁</div>
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

        /* === Gallery Section === */
        .about__section--gallery {
          max-width: none;
          background:
            var(--texture-dots-soft),
            linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
          background-size: var(--texture-dots-size), 100% 100%;
          padding: var(--space-3xl) var(--space-xl) var(--space-2xl);
          overflow: hidden;
        }

        .about__gallery-header {
          max-width: 600px;
          margin: 0 auto var(--space-2xl);
          text-align: center;
        }

        .about__gallery-title {
          background: linear-gradient(135deg, var(--color-theme-primary), var(--color-accent-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: var(--font-size-3xl) !important;
          margin-bottom: var(--space-md) !important;
        }

        .about__gallery-stage {
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          align-items: center;
        }

        .about__gallery-frame {
          position: relative;
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow:
            0 8px 32px rgba(93, 58, 26, 0.12),
            0 2px 8px rgba(93, 58, 26, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 3px solid color-mix(in srgb, var(--color-theme-secondary) 40%, transparent);
          overflow: hidden;
          width: 100%;
          animation: gallery-frame-entrance 0.6s var(--motion-ease-entrance) both;
        }

        @keyframes gallery-frame-entrance {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .about__gallery-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          animation: scene-fade-in 0.6s var(--motion-ease-entrance) both;
        }

        @keyframes scene-fade-in {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .about__gallery-caption {
          text-align: center;
          font-family: var(--font-family-display);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          padding: var(--space-md) var(--space-lg) var(--space-lg);
          margin: 0;
        }

        /* === Family Cards === */
        .about__family-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--space-lg);
        }

        .about__family-card {
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--color-bg-card) 88%, var(--color-theme-secondary) 12%) 0%,
              color-mix(in srgb, var(--color-bg-card) 88%, var(--color-theme-primary) 12%) 100%
            );
          border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 22%, transparent);
          text-align: start;
          display: grid;
          gap: var(--space-sm);
          transition: var(--transition-normal);
        }

        .about__family-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }

        .about__family-card-icon {
          font-size: 2.2rem;
          line-height: 1;
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

          .about__gallery-stage {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
