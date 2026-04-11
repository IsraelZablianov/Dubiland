import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/design-system';
import { FeatureIllustration } from '@/components/illustrations';
import { isParentFunnelConversionTuneupEnabled } from '@/lib/featureFlags';
import { trackParentFunnelEvent } from '@/lib/parentFunnelInstrumentation';

const HOW_IT_WORKS_STEPS = ['1', '2', '3', '4'] as const;

const FAQ_ITEMS = ['1', '2', '3', '4', '5'] as const;
const PARENTS_PAGE_VIEW_IDLE_TIMEOUT_MS = 3200;

export default function Parents() {
  const { t } = useTranslation('public');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const trackParentsView = () => {
      trackParentFunnelEvent('parents_page_view', {
        sourcePath: '/parents',
        targetPath: '/parents',
      });
    };

    const idleCapableWindow = window as Window & {
      requestIdleCallback?: (
        callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleCapableWindow.requestIdleCallback === 'function') {
      idleId = idleCapableWindow.requestIdleCallback(
        () => {
          trackParentsView();
        },
        { timeout: PARENTS_PAGE_VIEW_IDLE_TIMEOUT_MS },
      );
    } else {
      timeoutId = window.setTimeout(trackParentsView, PARENTS_PAGE_VIEW_IDLE_TIMEOUT_MS);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (idleId !== null && typeof idleCapableWindow.cancelIdleCallback === 'function') {
        idleCapableWindow.cancelIdleCallback(idleId);
      }
    };
  }, []);

  const handleParentsLoginClick = () => {
    trackParentFunnelEvent('parents_to_login_cta_click', {
      sourcePath: '/parents',
      targetPath: '/login',
      ctaId: 'parents_conversion_primary',
    });
  };

  return (
    <div className="parents">
      {/* Hero */}
      <section className="parents__hero">
        <h1 className="parents__title">{t('parents.title')}</h1>
        <p className="parents__hero-text">{t('parents.heroText')}</p>
      </section>

      {isParentFunnelConversionTuneupEnabled ? (
        <>
          <section className="parents__conversion-shell" aria-label={t('parents.conversionCtaTitle')}>
            <div className="parents__conversion-card">
              <p className="parents__conversion-title">{t('parents.conversionCtaTitle')}</p>
              <p className="parents__conversion-text">{t('parents.conversionCtaText')}</p>
              <Link
                to="/login"
                onClick={handleParentsLoginClick}
                className="parents__conversion-link"
                aria-label={t('parents.conversionCtaButton')}
              >
                {t('parents.conversionCtaButton')}
              </Link>
            </div>
          </section>
          <div className="parents__conversion-spacer" aria-hidden="true" />
        </>
      ) : null}

      {/* How It Works */}
      <section className="parents__section">
        <h2 className="parents__section-title">{t('parents.howItWorksTitle')}</h2>
        <ol className="parents__steps">
          {HOW_IT_WORKS_STEPS.map((key, index) => (
            <li key={key} className="parents__step">
              <span className="parents__step-num">{index + 1}</span>
              <p>{t(`parents.howItWorks${key}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Safety */}
      <section className="parents__section parents__section--alt">
        <div className="parents__content-block">
          <FeatureIllustration kind="safe" size={88} tone="success" className="parents__block-icon" />
          <div>
            <h2 className="parents__section-title" style={{ textAlign: 'start' }}>
              {t('parents.safetyTitle')}
            </h2>
            <p className="parents__text">{t('parents.safetyText')}</p>
          </div>
        </div>
      </section>

      {/* Educational Approach */}
      <section className="parents__section">
        <div className="parents__content-block">
          <FeatureIllustration kind="hebrew" size={88} tone="accent" className="parents__block-icon" />
          <div>
            <h2 className="parents__section-title" style={{ textAlign: 'start' }}>
              {t('parents.educationalTitle')}
            </h2>
            <p className="parents__text">{t('parents.educationalText')}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="parents__section parents__section--alt" id="faq">
        <h2 className="parents__section-title">{t('parents.faqTitle')}</h2>
        <div className="parents__faq-list">
          {FAQ_ITEMS.map((key) => (
            <Card key={key} padding="lg" className="parents__faq-item">
              <h3 className="parents__faq-question">{t(`parents.faq${key}Q`)}</h3>
              <p className="parents__faq-answer">{t(`parents.faq${key}A`)}</p>
            </Card>
          ))}
        </div>
      </section>

      <style>{`
        .parents__hero {
          background:
            linear-gradient(
              160deg,
              color-mix(in srgb, var(--color-bg-primary) 86%, transparent) 0%,
              color-mix(in srgb, var(--color-bg-primary) 94%, transparent) 100%
            ),
            url('/images/backgrounds/parents/parents-hero-storybook.webp') center / cover no-repeat,
            var(--color-bg-primary);
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
        }

        .parents__title {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .parents__hero-text {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          max-width: 600px;
        }

        .parents__section {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--space-2xl) var(--space-xl);
        }

        .parents__conversion-shell {
          max-width: 800px;
          margin: 0 auto;
          padding-inline: var(--space-xl);
          padding-block-end: var(--space-lg);
          z-index: 20;
        }

        .parents__conversion-card {
          display: grid;
          gap: var(--space-xs);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 22%, transparent);
          background:
            linear-gradient(
              145deg,
              color-mix(in srgb, var(--color-bg-card) 80%, var(--color-theme-secondary) 20%),
              var(--color-bg-card)
            );
          box-shadow: var(--shadow-card);
        }

        .parents__conversion-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          text-align: start;
        }

        .parents__conversion-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-xs);
          text-align: start;
        }

        .parents__conversion-link {
          min-height: var(--touch-primary-action-prominent);
          padding: var(--space-md) var(--space-xl);
          border-radius: var(--radius-lg);
          background: var(--color-accent-primary);
          color: var(--color-text-inverse);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          line-height: var(--line-height-tight);
          text-decoration: none;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: 100%;
          text-align: center;
        }

        .parents__conversion-link:hover {
          filter: brightness(1.03);
        }

        .parents__conversion-link:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--color-accent-primary) 45%, white);
          outline-offset: 2px;
        }

        .parents__conversion-spacer {
          display: none;
        }

        .parents__section--alt {
          max-width: none;
          background: var(--color-bg-secondary);
        }

        .parents__section--alt > *:not(.parents__faq-list) {
          max-width: 800px;
          margin-inline: auto;
        }

        .parents__section-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: var(--space-lg);
        }

        .parents__steps {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .parents__step {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .parents__step-num {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--color-accent-primary);
          color: var(--color-text-inverse);
          font-weight: var(--font-weight-bold);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
        }

        .parents__content-block {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-xl);
          align-items: start;
        }

        .parents__block-icon {
          flex-shrink: 0;
        }

        .parents__text {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .parents__faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .parents__faq-item {
          text-align: start;
        }

        .parents__faq-question {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-sm);
        }

        .parents__faq-answer {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        @media (max-width: 640px) {
          .parents__conversion-shell {
            padding-inline: var(--space-md);
          }

          .parents__content-block {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .parents__block-icon { justify-self: center; }

          .parents__content-block .parents__section-title {
            text-align: center !important;
          }
        }

        @media (min-width: 769px) {
          .parents__conversion-shell {
            position: static;
            padding-block-end: 0;
          }
        }

        @media (max-width: 768px) {
          .parents__conversion-shell {
            position: fixed;
            inset-inline: 0;
            inset-block-end: 0;
            max-width: none;
            padding-inline: var(--space-md);
            padding-block-start: var(--space-xs);
            padding-block-end: calc(var(--space-sm) + env(safe-area-inset-bottom));
            z-index: 60;
            background: linear-gradient(
              to top,
              color-mix(in srgb, var(--color-bg-primary) 92%, transparent) 0%,
              color-mix(in srgb, var(--color-bg-primary) 68%, transparent) 64%,
              transparent 100%
            );
          }

          .parents__conversion-card {
            max-width: 800px;
            margin-inline: auto;
            gap: var(--space-sm);
          }

          .parents__conversion-spacer {
            display: block;
            block-size: calc(var(--touch-primary-action-prominent) + var(--space-3xl));
          }
        }
      `}</style>
    </div>
  );
}
