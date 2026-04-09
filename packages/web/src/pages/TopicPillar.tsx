import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';

type TopicSlug = 'letters' | 'numbers' | 'reading';

interface TopicPillarProps {
  topic: TopicSlug;
}

const TOPIC_CONFIG: Record<
  TopicSlug,
  {
    icon: string;
    accentColor: string;
    labelKey: 'topics.letters' | 'topics.math' | 'topics.reading';
    descriptionKey:
      | 'topicDescriptions.letters'
      | 'topicDescriptions.math'
      | 'topicDescriptions.reading';
    landingDescriptionKey:
      | 'landing.topicLettersDesc'
      | 'landing.topicMathDesc'
      | 'landing.topicReadingDesc';
  }
> = {
  letters: {
    icon: '🔠',
    accentColor: '#7B2D8E',
    labelKey: 'topics.letters',
    descriptionKey: 'topicDescriptions.letters',
    landingDescriptionKey: 'landing.topicLettersDesc',
  },
  numbers: {
    icon: '🔢',
    accentColor: '#FF8C42',
    labelKey: 'topics.math',
    descriptionKey: 'topicDescriptions.math',
    landingDescriptionKey: 'landing.topicMathDesc',
  },
  reading: {
    icon: '📚',
    accentColor: '#4ECDC4',
    labelKey: 'topics.reading',
    descriptionKey: 'topicDescriptions.reading',
    landingDescriptionKey: 'landing.topicReadingDesc',
  },
};

const HOW_STEPS = [
  { icon: '✏️', titleKey: 'landing.howStep1Title', descriptionKey: 'landing.howStep1Desc' },
  { icon: '🎯', titleKey: 'landing.howStep2Title', descriptionKey: 'landing.howStep2Desc' },
  { icon: '🎮', titleKey: 'landing.howStep3Title', descriptionKey: 'landing.howStep3Desc' },
] as const;

const TRUST_ITEMS = [
  { icon: '🛡️', titleKey: 'landing.trustItemSafe', descriptionKey: 'landing.trustItemSafeDesc' },
  {
    icon: '🇮🇱',
    titleKey: 'landing.trustItemHebrew',
    descriptionKey: 'landing.trustItemHebrewDesc',
  },
  {
    icon: '📊',
    titleKey: 'landing.trustItemAdaptive',
    descriptionKey: 'landing.trustItemAdaptiveDesc',
  },
] as const;

export default function TopicPillar({ topic }: TopicPillarProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tPublic } = useTranslation('public');

  const config = TOPIC_CONFIG[topic];

  return (
    <div className="topic-pillar">
      <section className="topic-pillar__hero">
        <span
          className="topic-pillar__icon"
          style={{ backgroundColor: `${config.accentColor}22`, color: config.accentColor }}
        >
          {config.icon}
        </span>
        <h1 className="topic-pillar__title">{tCommon(config.labelKey)}</h1>
        <p className="topic-pillar__subtitle">{tCommon(config.descriptionKey)}</p>
        <p className="topic-pillar__description">{tPublic(config.landingDescriptionKey)}</p>
        <div className="topic-pillar__actions">
          <Link to="/login">
            <Button variant="primary" size="lg">
              {tPublic('landing.heroCta')}
            </Button>
          </Link>
          <Link to="/parents">
            <Button variant="secondary" size="lg">
              {tPublic('landing.heroSecondary')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="topic-pillar__section">
        <h2 className="topic-pillar__section-title">{tPublic('landing.howTitle')}</h2>
        <div className="topic-pillar__steps">
          {HOW_STEPS.map((step, index) => (
            <Card key={step.titleKey} padding="lg" className="topic-pillar__step-card">
              <div className="topic-pillar__step-heading">
                <span className="topic-pillar__step-number">{index + 1}</span>
                <span className="topic-pillar__step-icon">{step.icon}</span>
              </div>
              <h3 className="topic-pillar__card-title">{tPublic(step.titleKey)}</h3>
              <p className="topic-pillar__card-text">{tPublic(step.descriptionKey)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="topic-pillar__section topic-pillar__section--alt">
        <h2 className="topic-pillar__section-title">{tPublic('landing.trustTitle')}</h2>
        <div className="topic-pillar__trust-grid">
          {TRUST_ITEMS.map((item) => (
            <Card key={item.titleKey} padding="lg" className="topic-pillar__trust-card">
              <span className="topic-pillar__trust-icon">{item.icon}</span>
              <h3 className="topic-pillar__card-title">{tPublic(item.titleKey)}</h3>
              <p className="topic-pillar__card-text">{tPublic(item.descriptionKey)}</p>
            </Card>
          ))}
        </div>
      </section>

      <style>{`
        .topic-pillar {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--color-theme-bg) 0%, #fff 35%, #fff 100%);
        }

        .topic-pillar a {
          text-decoration: none;
        }

        .topic-pillar__hero,
        .topic-pillar__section {
          max-width: 1000px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-xl);
        }

        .topic-pillar__hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          text-align: center;
        }

        .topic-pillar__icon {
          width: 88px;
          height: 88px;
          border-radius: var(--radius-lg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        }

        .topic-pillar__title {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .topic-pillar__subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
        }

        .topic-pillar__description {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          max-width: 680px;
          line-height: var(--line-height-relaxed);
        }

        .topic-pillar__actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-md);
          margin-top: var(--space-sm);
        }

        .topic-pillar__section-title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          text-align: center;
          color: var(--color-text-primary);
          margin-bottom: var(--space-xl);
        }

        .topic-pillar__steps,
        .topic-pillar__trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: var(--space-lg);
        }

        .topic-pillar__step-card,
        .topic-pillar__trust-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }

        .topic-pillar__step-heading {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .topic-pillar__step-number {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--color-accent-primary);
          color: var(--color-text-inverse);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .topic-pillar__step-icon,
        .topic-pillar__trust-icon {
          font-size: 1.8rem;
        }

        .topic-pillar__card-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .topic-pillar__card-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .topic-pillar__section--alt {
          background: var(--color-bg-secondary);
          max-width: none;
        }

        .topic-pillar__section--alt > * {
          max-width: 1000px;
          margin-inline: auto;
        }
      `}</style>
    </div>
  );
}
