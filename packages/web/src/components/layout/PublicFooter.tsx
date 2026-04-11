import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MascotIllustration } from '@/components/illustrations';

export function PublicFooter() {
  const { t } = useTranslation(['public', 'common']);
  const year = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <div className="public-footer__brand">
          <Link to="/" className="public-footer__logo">
            <MascotIllustration variant="hero" size={36} className="public-footer__logo-icon" />
            <span className="public-footer__logo-text">{t('common:branding.appName')}</span>
          </Link>
          <p className="public-footer__tagline">{t('footer.tagline')}</p>
        </div>

        <div className="public-footer__columns">
          <div className="public-footer__column">
            <h3 className="public-footer__column-title">{t('footer.learnTitle')}</h3>
            <nav className="public-footer__links">
              <Link to="/#topics">{t('footer.learnMath')}</Link>
              <Link to="/#topics">{t('footer.learnLetters')}</Link>
              <Link to="/#topics">{t('footer.learnReading')}</Link>
            </nav>
          </div>

          <div className="public-footer__column">
            <h3 className="public-footer__column-title">{t('footer.aboutTitle')}</h3>
            <nav className="public-footer__links">
              <Link to="/about">{t('footer.aboutLink')}</Link>
              <Link to="/parents">{t('footer.parentsLink')}</Link>
              <Link to="/parents#faq">{t('footer.faqLink')}</Link>
            </nav>
          </div>

          <div className="public-footer__column">
            <h3 className="public-footer__column-title">{t('footer.legalTitle')}</h3>
            <nav className="public-footer__links">
              <Link to="/terms">{t('footer.terms')}</Link>
              <Link to="/privacy">{t('footer.privacy')}</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="public-footer__bottom">
        <p>{t('footer.copyright', { year })}</p>
        <p className="public-footer__love">{t('footer.madeWithLove')}</p>
      </div>

      <style>{`
        .public-footer {
          background: var(--color-bg-secondary);
          border-top: 1px solid rgba(93, 58, 26, 0.1);
          margin-top: auto;
        }

        .public-footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-xl) var(--space-xl);
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-3xl);
        }

        .public-footer__brand {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .public-footer__logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          min-inline-size: var(--touch-min-secondary);
          min-block-size: var(--touch-min-secondary);
          padding-inline: var(--space-xs);
          border-radius: var(--radius-md);
        }

        .public-footer__logo-icon {
          flex-shrink: 0;
        }

        .public-footer__logo-text {
          font-family: var(--font-family-display);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .public-footer__tagline {
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
        }

        .public-footer__columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
        }

        .public-footer__column-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-md);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .public-footer__links {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .public-footer__links a {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
          min-block-size: var(--touch-min-secondary);
          padding-block: var(--space-xs);
          padding-inline: var(--space-xs);
          border-radius: var(--radius-sm);
        }

        .public-footer__links a:hover {
          color: var(--color-text-primary);
          background: color-mix(in srgb, var(--color-bg-card) 76%, var(--color-bg-secondary) 24%);
        }

        .public-footer__bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-lg) var(--space-xl);
          border-top: 1px solid rgba(93, 58, 26, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }

        .public-footer__bottom p {
          color: var(--color-text-primary);
          font-size: var(--font-size-xs);
        }

        .public-footer__love {
          font-style: italic;
        }

        @media (max-width: 768px) {
          .public-footer__inner {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }

          .public-footer__columns {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }

          .public-footer__bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
