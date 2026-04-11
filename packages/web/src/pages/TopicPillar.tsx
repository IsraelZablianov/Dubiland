import { useCallback, useEffect, useState } from 'react';
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
import { useAudioManager } from '@/hooks/useAudioManager';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import type { RouteTopicSlug } from '@/lib/topicSlugMap';
import type { PublishedTopicVideo } from '@/lib/videosRepository';

type TopicSlug = RouteTopicSlug;
type VideoLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TopicPillarProps {
  topic: TopicSlug;
}

interface AudioIconButtonProps {
  label: string;
  onClick: () => void;
}

function resolveNamespacedAudioPath(rawKey: string, namespace: 'common' | 'public'): string {
  return resolveAudioPathFromKey(rawKey, namespace);
}

function stripNamespace(rawKey: string, namespace: 'common' | 'public'): string {
  return rawKey.startsWith(`${namespace}.`) ? rawKey.slice(`${namespace}.`.length) : rawKey;
}

function AudioIconButton({ label, onClick }: AudioIconButtonProps) {
  return (
    <button type="button" className="topic-pillar__audio-button" onClick={onClick} aria-label={label}>
      <FeatureIllustration kind="listen" size={24} tone="accent" />
    </button>
  );
}

const TOPIC_CONFIG: Record<
  TopicSlug,
  {
    illustration: TopicIllustrationSlug;
    titleKey: 'landing.topicLettersTitle' | 'landing.topicMathTitle' | 'landing.topicReadingTitle';
    descriptionKey:
      | 'landing.topicLettersDesc'
      | 'landing.topicMathDesc'
      | 'landing.topicReadingDesc';
  }
> = {
  letters: {
    illustration: 'letters',
    titleKey: 'landing.topicLettersTitle',
    descriptionKey: 'landing.topicLettersDesc',
  },
  numbers: {
    illustration: 'numbers',
    titleKey: 'landing.topicMathTitle',
    descriptionKey: 'landing.topicMathDesc',
  },
  reading: {
    illustration: 'reading',
    titleKey: 'landing.topicReadingTitle',
    descriptionKey: 'landing.topicReadingDesc',
  },
};

const HOW_STEPS: Array<{
  icon: FeatureIllustrationKind;
  titleKey: 'landing.howStep1Title' | 'landing.howStep2Title' | 'landing.howStep3Title';
  descriptionKey: 'landing.howStep1Desc' | 'landing.howStep2Desc' | 'landing.howStep3Desc';
}> = [
  { icon: 'listen', titleKey: 'landing.howStep1Title', descriptionKey: 'landing.howStep1Desc' },
  { icon: 'target', titleKey: 'landing.howStep2Title', descriptionKey: 'landing.howStep2Desc' },
  { icon: 'play', titleKey: 'landing.howStep3Title', descriptionKey: 'landing.howStep3Desc' },
];

const TRUST_ITEMS: Array<{
  icon: FeatureIllustrationKind;
  titleKey: 'landing.trustItemSafe' | 'landing.trustItemHebrew' | 'landing.trustItemAdaptive';
  descriptionKey:
    | 'landing.trustItemSafeDesc'
    | 'landing.trustItemHebrewDesc'
    | 'landing.trustItemAdaptiveDesc';
}> = [
  { icon: 'safe', titleKey: 'landing.trustItemSafe', descriptionKey: 'landing.trustItemSafeDesc' },
  {
    icon: 'hebrew',
    titleKey: 'landing.trustItemHebrew',
    descriptionKey: 'landing.trustItemHebrewDesc',
  },
  {
    icon: 'adaptive',
    titleKey: 'landing.trustItemAdaptive',
    descriptionKey: 'landing.trustItemAdaptiveDesc',
  },
];

const TOPIC_MARKETING_CTA_STYLE = {
  minHeight: 'var(--touch-primary-action-prominent)',
  padding: 'var(--space-md) var(--space-xl)',
};

export default function TopicPillar({ topic }: TopicPillarProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tPublic } = useTranslation('public');
  const audio = useAudioManager();
  const [videos, setVideos] = useState<PublishedTopicVideo[]>([]);
  const [videoLoadStatus, setVideoLoadStatus] = useState<VideoLoadStatus>('idle');
  const [shouldLoadVideos, setShouldLoadVideos] = useState(false);
  const [commonNamespaceReady, setCommonNamespaceReady] = useState(() => hasCommonNamespaceLoaded());

  const config = TOPIC_CONFIG[topic];
  const getCommonText = useCallback((rawKey: string) => tCommon(stripNamespace(rawKey, 'common') as any), [tCommon]);

  const playKeyAudio = useCallback(
    (rawKey: string, namespace: 'common' | 'public') => {
      void audio.play(resolveNamespacedAudioPath(rawKey, namespace));
    },
    [audio],
  );

  useEffect(() => {
    if (topic !== 'letters') {
      setShouldLoadVideos(false);
      return;
    }

    if (shouldLoadVideos) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const maybeEnableVideoLoading = () => {
      if (window.scrollY > 64) {
        setShouldLoadVideos(true);
      }
    };

    maybeEnableVideoLoading();

    if (window.scrollY > 64) {
      return;
    }

    const onScroll = () => {
      maybeEnableVideoLoading();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [shouldLoadVideos, topic]);

  useEffect(() => {
    let active = true;

    if (topic !== 'letters' || !shouldLoadVideos || commonNamespaceReady) {
      return () => {
        active = false;
      };
    }

    void ensureCommonNamespaceLoaded().then(() => {
      if (!active) return;
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [commonNamespaceReady, shouldLoadVideos, topic]);

  useEffect(() => {
    let active = true;

    if (topic !== 'letters' || !shouldLoadVideos) {
      setVideos([]);
      setVideoLoadStatus('idle');
      return () => {
        active = false;
      };
    }

    if (!commonNamespaceReady) {
      setVideoLoadStatus('loading');
      return () => {
        active = false;
      };
    }

    setVideoLoadStatus('loading');

    void import('@/lib/videosRepository')
      .then(({ listPublishedVideosByRouteTopic }) => listPublishedVideosByRouteTopic({ routeTopicSlug: topic }))
      .then((nextVideos) => {
        if (!active) return;
        setVideos(nextVideos);
        setVideoLoadStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setVideos([]);
        setVideoLoadStatus('error');
      });

    return () => {
      active = false;
    };
  }, [commonNamespaceReady, shouldLoadVideos, topic]);

  const lettersSeriesTitle = tPublic('landing.topicLettersTitle');
  const lettersSeriesSubtitle = tPublic('landing.topicLettersDesc');
  const genericError = getCommonText('common.errors.generic');
  const genericEmpty = getCommonText('common.games.empty');

  return (
    <div className="topic-pillar">
      <section className="topic-pillar__hero">
        <div className="topic-pillar__hero-grid">
          <div className="topic-pillar__hero-copy">
            <span className="topic-pillar__icon" aria-hidden="true">
              <TopicIllustration topic={config.illustration} size={90} />
            </span>
            <h1 className="topic-pillar__title">{tPublic(config.titleKey)}</h1>
            <p className="topic-pillar__subtitle">{tPublic('landing.topicsSubtitle')}</p>
            <p className="topic-pillar__description">{tPublic(config.descriptionKey)}</p>
            <div className="topic-pillar__actions">
              <Link to="/login">
                <Button variant="primary" size="lg" style={TOPIC_MARKETING_CTA_STYLE}>
                  {tPublic('landing.heroCta')}
                </Button>
              </Link>
              <Link to="/parents">
                <Button variant="secondary" size="lg">
                  {tPublic('landing.heroSecondary')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="topic-pillar__hero-mascot" aria-hidden="true">
            <MascotIllustration variant="hero" size={190} />
          </div>
        </div>
      </section>

      {topic === 'letters' && (
        <section className="topic-pillar__section topic-pillar__section--letters-videos topic-pillar__section--deferred">
          <div className="topic-pillar__letters-series-header">
            <div className="topic-pillar__letters-series-row">
              <h2 className="topic-pillar__section-title">{lettersSeriesTitle}</h2>
              <AudioIconButton
                label={lettersSeriesTitle}
                onClick={() => playKeyAudio('landing.topicLettersTitle', 'public')}
              />
            </div>

            <div className="topic-pillar__letters-series-row topic-pillar__letters-series-row--subtitle">
              <p className="topic-pillar__card-text">{lettersSeriesSubtitle}</p>
              <AudioIconButton
                label={lettersSeriesSubtitle}
                onClick={() => playKeyAudio('landing.topicLettersDesc', 'public')}
              />
            </div>
          </div>

          {videoLoadStatus === 'loading' && (
            <div className="topic-pillar__videos-grid" aria-live="polite" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Card
                  key={`letters-video-skeleton-${index}`}
                  padding="lg"
                  className="topic-pillar__video-card topic-pillar__video-card--loading"
                >
                  <div className="topic-pillar__video-thumbnail topic-pillar__video-thumbnail--loading" aria-hidden="true" />
                  <div className="topic-pillar__video-line topic-pillar__video-line--title" aria-hidden="true" />
                  <div className="topic-pillar__video-line" aria-hidden="true" />
                </Card>
              ))}
            </div>
          )}

          {videoLoadStatus === 'error' && (
            <Card padding="lg" className="topic-pillar__video-state-card">
              <p className="topic-pillar__card-text">{genericError}</p>
              <AudioIconButton label={genericError} onClick={() => playKeyAudio('common.errors.generic', 'common')} />
            </Card>
          )}

          {videoLoadStatus === 'ready' && videos.length === 0 && (
            <Card padding="lg" className="topic-pillar__video-state-card">
              <p className="topic-pillar__card-text">{genericEmpty}</p>
              <AudioIconButton label={genericEmpty} onClick={() => playKeyAudio('common.games.empty', 'common')} />
            </Card>
          )}

          {videoLoadStatus === 'ready' && videos.length > 0 && (
            <div className="topic-pillar__videos-grid">
              {videos.map((video) => {
                const videoTitle = getCommonText(video.nameKey);
                const videoDescriptionKey = video.descriptionKey;
                const videoDescription = videoDescriptionKey ? getCommonText(videoDescriptionKey) : null;
                const videoPlayLabel = tCommon('games.play');

                return (
                  <Card key={video.id} padding="lg" className="topic-pillar__video-card">
                    <div className="topic-pillar__video-thumbnail" aria-hidden="true">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" loading="lazy" />
                      ) : (
                        <FeatureIllustration kind="play" size={62} tone="accent" />
                      )}
                    </div>

                    <div className="topic-pillar__video-copy">
                      <div className="topic-pillar__video-row">
                        <h3 className="topic-pillar__card-title">{videoTitle}</h3>
                        <AudioIconButton label={videoTitle} onClick={() => playKeyAudio(video.nameKey, 'common')} />
                      </div>

                      {videoDescription && videoDescriptionKey && (
                        <div className="topic-pillar__video-row topic-pillar__video-row--description">
                          <p className="topic-pillar__card-text">{videoDescription}</p>
                          <AudioIconButton
                            label={videoDescription}
                            onClick={() => playKeyAudio(videoDescriptionKey, 'common')}
                          />
                        </div>
                      )}
                    </div>

                    <a
                      className="topic-pillar__video-action"
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={videoPlayLabel}
                    >
                      <FeatureIllustration kind="play" size={28} tone="success" />
                    </a>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="topic-pillar__section topic-pillar__section--deferred">
        <h2 className="topic-pillar__section-title">{tPublic('landing.howTitle')}</h2>
        <div className="topic-pillar__steps">
          {HOW_STEPS.map((step, index) => (
            <Card key={step.titleKey} padding="lg" className="topic-pillar__step-card">
              <div className="topic-pillar__step-heading">
                <span className="topic-pillar__step-number">{index + 1}</span>
                <FeatureIllustration kind={step.icon} size={68} tone="accent" />
              </div>
              <h3 className="topic-pillar__card-title">{tPublic(step.titleKey)}</h3>
              <p className="topic-pillar__card-text">{tPublic(step.descriptionKey)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="topic-pillar__section topic-pillar__section--alt topic-pillar__section--deferred">
        <h2 className="topic-pillar__section-title">{tPublic('landing.trustTitle')}</h2>
        <div className="topic-pillar__trust-grid">
          {TRUST_ITEMS.map((item) => (
            <Card key={item.titleKey} padding="lg" className="topic-pillar__trust-card">
              <FeatureIllustration kind={item.icon} size={64} tone="success" />
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

        .topic-pillar__section--deferred {
          content-visibility: auto;
          contain-intrinsic-size: 960px;
        }

        .topic-pillar__hero-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-xl);
        }

        .topic-pillar__hero-copy {
          display: flex;
          flex-direction: column;
          align-items: start;
          gap: var(--space-md);
        }

        .topic-pillar__hero-mascot {
          justify-self: end;
        }

        .topic-pillar__icon {
          width: 96px;
          height: 96px;
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-card) 62%, var(--color-theme-secondary) 38%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
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

        .topic-pillar__section--letters-videos {
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--color-theme-bg) 86%, var(--color-bg-card) 14%) 0%,
            color-mix(in srgb, var(--color-bg-card) 94%, var(--color-theme-secondary) 6%) 100%
          );
        }

        .topic-pillar__letters-series-header {
          display: grid;
          gap: var(--space-sm);
          margin-block-end: var(--space-lg);
        }

        .topic-pillar__letters-series-row {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .topic-pillar__letters-series-row--subtitle {
          align-items: start;
        }

        [dir='rtl'] .topic-pillar__letters-series-row .topic-pillar__audio-button,
        [dir='rtl'] .topic-pillar__video-row .topic-pillar__audio-button {
          order: -1;
        }

        .topic-pillar__videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
        }

        .topic-pillar__video-card {
          display: grid;
          gap: var(--space-md);
          min-block-size: 240px;
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
          background:
            linear-gradient(
              150deg,
              color-mix(in srgb, var(--color-bg-card) 88%, var(--color-theme-secondary) 12%),
              var(--color-bg-card)
            );
        }

        .topic-pillar__video-card--loading {
          animation: topic-pillar-loading-pulse 1.35s ease-in-out infinite;
        }

        .topic-pillar__video-state-card {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          margin-inline: auto;
          max-inline-size: 520px;
        }

        .topic-pillar__video-thumbnail {
          min-block-size: 120px;
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-card) 72%, var(--color-theme-bg) 28%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .topic-pillar__video-thumbnail img {
          display: block;
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        .topic-pillar__video-thumbnail--loading {
          background: linear-gradient(
            100deg,
            color-mix(in srgb, var(--color-bg-secondary) 70%, transparent) 0%,
            color-mix(in srgb, var(--color-bg-card) 85%, white 15%) 50%,
            color-mix(in srgb, var(--color-bg-secondary) 70%, transparent) 100%
          );
          background-size: 220% 100%;
          animation: topic-pillar-loading-shimmer 1.4s linear infinite;
        }

        .topic-pillar__video-copy {
          display: grid;
          gap: var(--space-sm);
        }

        .topic-pillar__video-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-sm);
        }

        .topic-pillar__video-row--description {
          align-items: start;
        }

        .topic-pillar__video-row .topic-pillar__card-title,
        .topic-pillar__video-row .topic-pillar__card-text {
          margin: 0;
          text-align: start;
        }

        .topic-pillar__video-action {
          inline-size: 48px;
          block-size: 48px;
          min-inline-size: 48px;
          min-block-size: 48px;
          border-radius: var(--radius-full);
          border: 2px solid color-mix(in srgb, var(--color-accent-success) 55%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 88%, var(--color-accent-success) 12%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition:
            transform var(--motion-duration-normal) var(--motion-ease-standard),
            box-shadow var(--motion-duration-normal) var(--motion-ease-standard);
        }

        .topic-pillar__video-action:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-success-glow);
        }

        .topic-pillar__audio-button {
          inline-size: 48px;
          block-size: 48px;
          min-inline-size: 48px;
          min-block-size: 48px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--color-theme-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
          touch-action: manipulation;
          transition:
            transform var(--motion-duration-normal) var(--motion-ease-standard),
            color var(--motion-duration-normal) var(--motion-ease-standard);
        }

        .topic-pillar__audio-button:hover {
          transform: translateY(-2px);
          color: color-mix(in srgb, var(--color-theme-primary) 70%, var(--color-text-primary));
        }

        .topic-pillar__audio-button:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--color-accent-primary) 60%, transparent);
          outline-offset: 2px;
        }

        .topic-pillar__video-line {
          block-size: 12px;
          inline-size: 100%;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-bg-secondary) 78%, transparent);
        }

        .topic-pillar__video-line--title {
          inline-size: 72%;
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

        @keyframes topic-pillar-loading-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes topic-pillar-loading-shimmer {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -40% 0;
          }
        }

        @media (max-width: 768px) {
          .topic-pillar__hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .topic-pillar__hero-copy {
            align-items: center;
          }

          .topic-pillar__hero-mascot {
            justify-self: center;
            display: none;
          }

          .topic-pillar__letters-series-row {
            inline-size: 100%;
            justify-content: space-between;
          }

          .topic-pillar__video-state-card {
            inline-size: 100%;
          }

          .topic-pillar__video-row {
            grid-template-columns: 1fr;
          }

          [dir='rtl'] .topic-pillar__video-row .topic-pillar__audio-button {
            order: 0;
          }

          .topic-pillar__video-row .topic-pillar__audio-button,
          .topic-pillar__video-action {
            justify-self: start;
          }
        }
      `}</style>
    </div>
  );
}
