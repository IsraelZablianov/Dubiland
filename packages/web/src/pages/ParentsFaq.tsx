import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { trackParentFunnelEvent } from '@/lib/parentFunnelInstrumentation';

const FAQ_ITEMS = [
  { questionKey: 'parents.faq1Q', answerKey: 'parents.faq1A' },
  { questionKey: 'parents.faq2Q', answerKey: 'parents.faq2A' },
  { questionKey: 'parents.faq3Q', answerKey: 'parents.faq3A' },
  { questionKey: 'parents.faq4Q', answerKey: 'parents.faq4A' },
  { questionKey: 'parents.faq5Q', answerKey: 'parents.faq5A' },
] as const;

const PUBLIC_ENTRY_PRIMARY_CTA_STYLE = {
  minHeight: 'var(--touch-primary-action-prominent)',
  padding: 'var(--space-md) var(--space-xl)',
};

export default function ParentsFaq() {
  const { t } = useTranslation('public');

  useEffect(() => {
    trackParentFunnelEvent('parents_page_view', {
      sourcePath: '/parents/faq',
      targetPath: '/parents/faq',
      ctaId: 'faq_surface',
    });
  }, []);

  const handleParentsFaqLoginClick = () => {
    trackParentFunnelEvent('parents_to_login_cta_click', {
      sourcePath: '/parents/faq',
      targetPath: '/login',
      ctaId: 'parents_faq_primary',
    });
  };

  return (
    <div className="parents-faq">
      <section className="parents-faq__hero">
        <h1 className="parents-faq__title">{t('parents.faqTitle')}</h1>
        <p className="parents-faq__subtitle">{t('parents.heroText')}</p>
      </section>

      <section className="parents-faq__content parents-faq__section--deferred">
        <div className="parents-faq__list">
          {FAQ_ITEMS.map((item) => (
            <Card key={item.questionKey} padding="lg" className="parents-faq__item">
              <h2 className="parents-faq__question">{t(item.questionKey)}</h2>
              <p className="parents-faq__answer">{t(item.answerKey)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="parents-faq__actions">
        <Link to="/parents">
          <Button variant="secondary" size="lg">
            {t('footer.parentsLink')}
          </Button>
        </Link>
        <Link to="/login" onClick={handleParentsFaqLoginClick}>
          <Button variant="primary" size="lg" style={PUBLIC_ENTRY_PRIMARY_CTA_STYLE}>
            {t('header.tryFree')}
          </Button>
        </Link>
      </section>

      <style>{`
        .parents-faq {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--color-theme-bg) 0%, #fff 40%, #fff 100%);
          padding-bottom: var(--space-3xl);
        }

        .parents-faq a {
          text-decoration: none;
        }

        .parents-faq__hero,
        .parents-faq__content,
        .parents-faq__actions {
          max-width: 900px;
          margin: 0 auto;
          padding-inline: var(--space-xl);
        }

        .parents-faq__hero {
          padding-top: var(--space-3xl);
          padding-bottom: var(--space-xl);
          text-align: center;
        }

        .parents-faq__title {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-sm);
        }

        .parents-faq__subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .parents-faq__list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .parents-faq__section--deferred {
          content-visibility: auto;
          contain-intrinsic-size: 960px;
        }

        .parents-faq__item {
          text-align: start;
        }

        .parents-faq__question {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-sm);
        }

        .parents-faq__answer {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .parents-faq__actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: var(--space-md);
          padding-top: var(--space-2xl);
        }
      `}</style>
    </div>
  );
}
