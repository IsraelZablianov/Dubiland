import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import {
  FeatureIllustration,
  MascotIllustration,
  TopicIllustration,
  type FeatureIllustrationKind,
  type TopicIllustrationSlug,
} from '@/components/illustrations';
import { isParentFunnelConversionTuneupEnabled } from '@/lib/featureFlags';
import { trackParentFunnelEvent } from '@/lib/parentFunnelInstrumentation';

const TOPIC_CARDS: Array<{ key: 'Math' | 'Letters' | 'Reading'; topic: TopicIllustrationSlug }> = [
  { key: 'Math', topic: 'math' },
  { key: 'Letters', topic: 'letters' },
  { key: 'Reading', topic: 'reading' },
];

const HOW_STEPS: Array<{ key: '1' | '2' | '3'; icon: FeatureIllustrationKind }> = [
  { key: '1', icon: 'listen' },
  { key: '2', icon: 'target' },
  { key: '3', icon: 'play' },
];

const TRUST_ITEMS: Array<{ key: 'Safe' | 'Hebrew' | 'Adaptive' | 'Audio'; icon: FeatureIllustrationKind }> = [
  { key: 'Safe', icon: 'safe' },
  { key: 'Hebrew', icon: 'hebrew' },
  { key: 'Adaptive', icon: 'adaptive' },
  { key: 'Audio', icon: 'audio' },
];

const TRUST_RAIL_PROOFS: Array<
  { key: 'trustRailProofSafety' | 'trustRailProofMethod' | 'trustRailProofEase'; icon: FeatureIllustrationKind }
> = [
  { key: 'trustRailProofSafety', icon: 'safe' },
  { key: 'trustRailProofMethod', icon: 'hebrew' },
  { key: 'trustRailProofEase', icon: 'adaptive' },
];

const TRUST_RAIL_BADGES = ['trustRailBadgeNoAds', 'trustRailBadgeNoCard', 'trustRailBadgeAgeRange'] as const;

const PROMINENT_MARKETING_CTA_STYLE = {
  minHeight: 'var(--touch-primary-action-prominent)',
  padding: 'var(--space-md) var(--space-xl)',
};

export default function Landing() {
  const { t } = useTranslation('public');

  useEffect(() => {
    trackParentFunnelEvent('landing_page_view', {
      sourcePath: '/',
      targetPath: '/',
    });
  }, []);

  const trackLandingPrimaryCtaClick = (ctaId: 'hero_primary' | 'trust_rail_primary' | 'footer_primary') => {
    trackParentFunnelEvent('landing_primary_cta_click', {
      sourcePath: '/',
      targetPath: '/login',
      ctaId,
    });
  };

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-inner">
          <div className="landing__hero-content">
            <h1 className="landing__hero-title">{t('landing.heroTitle')}</h1>
            <p className="landing__hero-subtitle">{t('landing.heroSubtitle')}</p>
            <div className="landing__hero-actions">
              <Link to="/login" onClick={() => trackLandingPrimaryCtaClick('hero_primary')}>
                <Button variant="primary" size="lg" style={PROMINENT_MARKETING_CTA_STYLE}>
                  {t('landing.heroCta')}
                </Button>
              </Link>
              <Link to="/parents">
                <Button variant="secondary" size="lg">{t('landing.heroSecondary')}</Button>
              </Link>
            </div>
          </div>

          <div className="landing__hero-visual" aria-hidden="true">
            <div className="landing__hero-mascot-shell">
              <MascotIllustration variant="hero" size={210} />
            </div>
          </div>
        </div>
      </section>

      {isParentFunnelConversionTuneupEnabled ? (
        <section className="landing__trust-rail" aria-labelledby="landing-trust-rail-title">
          <Card padding="lg" className="landing__trust-rail-card">
            <div className="landing__trust-rail-grid">
              <div className="landing__trust-rail-copy">
                <h2 id="landing-trust-rail-title" className="landing__trust-rail-title">
                  {t('landing.trustRailTitle')}
                </h2>
                <p className="landing__trust-rail-subtitle">{t('landing.trustRailSubtitle')}</p>

                <ul className="landing__trust-rail-proof-list">
                  {TRUST_RAIL_PROOFS.map(({ key, icon }) => (
                    <li key={key} className="landing__trust-rail-proof-item">
                      <FeatureIllustration kind={icon} size={56} tone="success" />
                      <span>{t(`landing.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="landing__trust-rail-cta-shell">
                <div className="landing__trust-rail-mascot" aria-hidden="true">
                  <MascotIllustration variant="hero" size={124} />
                </div>

                <ul className="landing__trust-rail-badges">
                  {TRUST_RAIL_BADGES.map((key) => (
                    <li key={key} className="landing__trust-rail-badge">
                      {t(`landing.${key}`)}
                    </li>
                  ))}
                </ul>

                <Link to="/login" onClick={() => trackLandingPrimaryCtaClick('trust_rail_primary')}>
                  <Button variant="primary" size="lg" style={PROMINENT_MARKETING_CTA_STYLE}>
                    {t('landing.trustRailCta')}
                  </Button>
                </Link>
              </aside>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="landing__section" id="topics">
        <h2 className="landing__section-title">{t('landing.topicsTitle')}</h2>
        <p className="landing__section-subtitle">{t('landing.topicsSubtitle')}</p>
        <div className="landing__topics-grid">
          {TOPIC_CARDS.map(({ key, topic }) => (
            <Card key={key} padding="lg" className="landing__topic-card">
              <span className="landing__topic-icon" aria-hidden="true">
                <TopicIllustration topic={topic} size={84} />
              </span>
              <h3 className="landing__topic-title">{t(`landing.topic${key}Title`)}</h3>
              <p className="landing__topic-desc">{t(`landing.topic${key}Desc`)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing__section landing__section--alt landing__section--deferred">
        <h2 className="landing__section-title">{t('landing.howTitle')}</h2>
        <p className="landing__section-subtitle">{t('landing.howSubtitle')}</p>
        <div className="landing__steps">
          {HOW_STEPS.map(({ key, icon }, index) => (
            <div key={key} className="landing__step">
              <div className="landing__step-number">{index + 1}</div>
              <FeatureIllustration kind={icon} size={84} tone="accent" />
              <h3 className="landing__step-title">{t(`landing.howStep${key}Title`)}</h3>
              <p className="landing__step-desc">{t(`landing.howStep${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section landing__section--deferred">
        <h2 className="landing__section-title">{t('landing.trustTitle')}</h2>
        <div className="landing__trust-grid">
          {TRUST_ITEMS.map(({ key, icon }) => (
            <div key={key} className="landing__trust-item">
              <FeatureIllustration kind={icon} size={78} tone="success" />
              <h3 className="landing__trust-item-title">{t(`landing.trustItem${key}`)}</h3>
              <p className="landing__trust-item-desc">{t(`landing.trustItem${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__cta landing__section--deferred">
        <h2 className="landing__cta-title">{t('landing.ctaTitle')}</h2>
        <p className="landing__cta-subtitle">{t('landing.ctaSubtitle')}</p>
        <Link to="/login" onClick={() => trackLandingPrimaryCtaClick('footer_primary')}>
          <Button variant="primary" size="lg" style={PROMINENT_MARKETING_CTA_STYLE}>
            {t('landing.ctaButton')}
          </Button>
        </Link>
      </section>

      <style>{`
        .landing a { text-decoration: none; }

        .landing__hero {
          background:
            radial-gradient(circle at 82% 16%, color-mix(in srgb, var(--color-accent-secondary) 42%, transparent) 0%, transparent 52%),
            var(--color-theme-bg);
          padding: var(--space-3xl) var(--space-xl);
        }

        .landing__hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-3xl);
        }

        .landing__hero-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          animation: var(--motion-page-transition-in);
        }

        .landing__hero-title {
          font-family: var(--font-family-display);
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }

        .landing__hero-subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          max-width: 540px;
        }

        .landing__hero-actions {
          display: flex;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .landing__hero-visual {
          position: relative;
          display: grid;
          justify-items: center;
          align-items: center;
        }

        .landing__hero-mascot-shell {
          display: grid;
          place-items: center;
          inline-size: 240px;
          block-size: 240px;
          border-radius: var(--radius-xl);
          background:
            radial-gradient(circle at 50% 36%, color-mix(in srgb, var(--color-bg-card) 72%, var(--color-accent-secondary) 28%) 0%, transparent 72%),
            var(--texture-stars-soft);
          box-shadow: var(--shadow-success-glow);
          animation: var(--motion-entrance-bounce);
        }

        .landing__section {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-xl);
        }

        .landing__trust-rail {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-lg) var(--space-xl) var(--space-2xl);
        }

        .landing__trust-rail-card {
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 22%, transparent);
          background:
            linear-gradient(
              140deg,
              color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%) 0%,
              var(--color-bg-card) 100%
            );
          box-shadow: var(--shadow-card);
        }

        .landing__trust-rail-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          align-items: start;
          gap: var(--space-xl);
        }

        .landing__trust-rail-copy {
          display: grid;
          gap: var(--space-md);
        }

        .landing__trust-rail-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .landing__trust-rail-subtitle {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .landing__trust-rail-proof-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: var(--space-sm);
        }

        .landing__trust-rail-proof-item {
          min-height: 56px;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--color-bg-secondary) 78%, var(--color-bg-card) 22%);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }

        .landing__trust-rail-cta-shell {
          display: grid;
          align-content: start;
          gap: var(--space-md);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-secondary) 88%, var(--color-bg-card) 12%);
        }

        .landing__trust-rail-mascot {
          justify-self: center;
          display: grid;
          place-items: center;
          inline-size: 140px;
          block-size: 140px;
          border-radius: var(--radius-full);
          background:
            radial-gradient(
              circle at 50% 35%,
              color-mix(in srgb, var(--color-bg-card) 62%, var(--color-theme-secondary) 38%) 0%,
              transparent 74%
            ),
            var(--texture-stars-soft);
        }

        .landing__trust-rail-badges {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .landing__trust-rail-badge {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          border-radius: var(--radius-pill);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 22%, transparent);
          padding-inline: var(--space-sm);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          transition: var(--transition-fast);
        }

        .landing__trust-rail-badge:active {
          transform: scale(0.98);
          border-color: var(--color-accent-primary);
          box-shadow: var(--shadow-sm);
        }

        .landing__trust-rail-cta-shell a {
          text-decoration: none;
          inline-size: 100%;
        }

        .landing__trust-rail-cta-shell button {
          inline-size: 100%;
          color: var(--color-text-primary);
        }

        .landing__section--deferred {
          content-visibility: auto;
          contain-intrinsic-size: 900px;
        }

        .landing__section--alt {
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-secondary) 88%, var(--color-bg-card) 12%), var(--color-bg-secondary));
          max-width: none;
        }

        .landing__section--alt > * {
          max-width: 1200px;
          margin-inline: auto;
        }

        .landing__section-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: var(--space-sm);
        }

        .landing__section-subtitle {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          text-align: center;
          margin-bottom: var(--space-2xl);
          max-width: 600px;
          margin-inline: auto;
        }

        .landing__topics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .landing__topic-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-md);
          transition: var(--transition-normal);
          background:
            linear-gradient(150deg, color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%), var(--color-bg-card));
        }

        .landing__topic-card:hover {
          animation: var(--motion-card-hover);
        }

        .landing__topic-icon {
          width: 96px;
          height: 96px;
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-card) 64%, var(--color-theme-secondary) 36%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing__topic-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .landing__topic-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .landing__steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-xl);
        }

        .landing__step {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }

        .landing__step-number {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--color-accent-primary);
          color: var(--color-text-inverse);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing__step-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .landing__step-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .landing__trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-lg);
        }

        .landing__trust-item {
          text-align: center;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          background: var(--color-bg-card);
          box-shadow: var(--shadow-card);
          transition: var(--transition-normal);
          display: grid;
          justify-items: center;
          gap: var(--space-sm);
        }

        .landing__trust-item:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .landing__trust-item-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .landing__trust-item-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .landing__cta {
          background: var(--color-theme-bg);
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }

        .landing__cta-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .landing__cta-subtitle {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          max-width: 480px;
          margin-bottom: var(--space-sm);
        }

        @media (max-width: 768px) {
          .landing__hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .landing__hero-content {
            align-items: center;
          }

          .landing__hero-actions {
            justify-content: center;
          }

          .landing__hero-visual {
            display: none;
          }

          .landing__hero-mascot-shell {
            inline-size: 188px;
            block-size: 188px;
          }

          .landing__trust-rail {
            padding-block-start: 0;
          }
        }

        @media (max-width: 1024px) {
          .landing__trust-rail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing__trust-rail-badge {
            transition: none;
          }

          .landing__trust-rail-badge:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
