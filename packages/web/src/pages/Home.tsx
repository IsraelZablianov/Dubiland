import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card, TopicCard } from '@/components/design-system';
import { MascotIllustration, TopicIllustration } from '@/components/illustrations';
import { FloatingElement, SuccessCelebration } from '@/components/motion';
import { getActiveChildProfile } from '@/lib/session';

type TopicSlug = 'math' | 'letters' | 'reading';

interface TopicState {
  slug: TopicSlug;
  progress: number;
}

interface TopicGameOption {
  slug:
    | 'countingPicnic'
    | 'moreOrLessMarket'
    | 'colorGarden'
    | 'letterSoundMatch'
    | 'letterTracingTrail'
    | 'pictureToWordBuilder';
  route: string;
}

const GAME_OPTIONS_BY_TOPIC: Record<TopicSlug, TopicGameOption[]> = {
  math: [
    {
      slug: 'countingPicnic',
      route: '/games/numbers/counting-picnic',
    },
    {
      slug: 'moreOrLessMarket',
      route: '/games/numbers/more-or-less-market',
    },
    {
      slug: 'colorGarden',
      route: '/games/colors/color-garden',
    },
  ],
  letters: [
    {
      slug: 'letterSoundMatch',
      route: '/games/letters/letter-sound-match',
    },
    {
      slug: 'letterTracingTrail',
      route: '/games/letters/letter-tracing-trail',
    },
  ],
  reading: [
    {
      slug: 'pictureToWordBuilder',
      route: '/games/reading/picture-to-word-builder',
    },
  ],
};

export default function Home() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const childProfile = getActiveChildProfile();
  const childName = childProfile?.name ?? t('profile.guestName');

  const topics = useMemo<TopicState[]>(
    () => [
      { slug: 'math', progress: 78 },
      { slug: 'letters', progress: 58 },
      { slug: 'reading', progress: 43 },
    ],
    [],
  );

  const [selectedTopic, setSelectedTopic] = useState<TopicSlug>(topics[0]?.slug ?? 'math');

  const selectedTopicProgress = topics.find((topic) => topic.slug === selectedTopic)?.progress ?? 0;
  const dailyGoalProgress = 72;
  const selectedTopicGames = GAME_OPTIONS_BY_TOPIC[selectedTopic];
  const routeByTopic: Record<TopicSlug, string> = {
    math: GAME_OPTIONS_BY_TOPIC.math[0]?.route ?? '/games/colors/color-garden',
    letters: GAME_OPTIONS_BY_TOPIC.letters[0]?.route ?? '/letters',
    reading: GAME_OPTIONS_BY_TOPIC.reading[0]?.route ?? '/reading',
  };

  return (
    <main
      style={{
        flex: 1,
        backgroundImage:
          'linear-gradient(180deg, color-mix(in srgb, var(--color-bg-primary) 82%, white 18%) 0%, color-mix(in srgb, var(--color-bg-secondary) 78%, white 22%) 100%), url(/images/backgrounds/home/home-storybook.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'soft-light, normal',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1040px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('home.greeting', { name: childName })}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
              {t('home.dubiWelcome')}
            </p>
          </div>

          <FloatingElement style={{ justifySelf: 'end' }}>
            <MascotIllustration variant="hint" size={120} />
          </FloatingElement>
        </header>

        <Card
          padding="lg"
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            border: '2px solid var(--color-bg-secondary)',
            background:
              'linear-gradient(140deg, color-mix(in srgb, var(--color-bg-card) 84%, var(--color-accent-secondary) 16%), var(--color-bg-card))',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {t('home.dailyGoal')}
          </p>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-primary)' }}>
            {t('home.minutes', { count: 20 })}
          </h2>
          <div
            role="progressbar"
            aria-label={t('home.dailyGoal')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={dailyGoalProgress}
            aria-valuetext={`${dailyGoalProgress}%`}
            style={{
              width: '100%',
              height: '14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-star-empty)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${dailyGoalProgress}%`,
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--color-accent-success), var(--color-accent-info))',
                transition: 'width var(--motion-duration-normal) var(--motion-ease-standard)',
              }}
            />
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-primary)' }}>
            {t('home.chooseTopic')}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {topics.map((topic) => {
              const isSelected = selectedTopic === topic.slug;

              return (
                <TopicCard
                  key={topic.slug}
                  icon={<TopicIllustration topic={topic.slug} size={82} />}
                  title={t(`topics.${topic.slug}`)}
                  subtitle={t(`topicDescriptions.${topic.slug}`)}
                  progress={topic.progress}
                  onClick={() => setSelectedTopic(topic.slug)}
                  style={{
                    border: isSelected ? '3px solid var(--color-theme-primary)' : '2px solid transparent',
                    transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: isSelected ? 'var(--shadow-success-glow)' : 'var(--shadow-md)',
                    animation: isSelected ? 'var(--motion-success-burst)' : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        <Card
          padding="md"
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            border: '2px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent)',
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 78%, var(--color-theme-secondary) 22%), var(--color-bg-card))',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'center',
              gap: 'var(--space-md)',
            }}
          >
            <FloatingElement durationMs={3600}>
              <MascotIllustration variant="hint" size={84} />
            </FloatingElement>

            <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
              <h3 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
                {t(`topics.${selectedTopic}`)}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {t(`topicDescriptions.${selectedTopic}`)}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            style={{ justifySelf: 'start' }}
            aria-label={t('home.startLearning')}
            onClick={() => navigate(routeByTopic[selectedTopic])}
          >
            {t('home.startLearning')} · {selectedTopicProgress}%
          </Button>

          <SuccessCelebration dense />
        </Card>

        {selectedTopicGames.length > 0 && (
          <Card
            padding="md"
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              border: '2px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent)',
            }}
          >
            <h3
              style={{
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-lg)',
              }}
            >
              {t('nav.chooseGame')}
            </h3>

            <div
              style={{
                display: 'grid',
                gap: 'var(--space-sm)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {selectedTopicGames.map((game, index) => {
                const gameTitleKey = `games.${game.slug}.title`;
                return (
                  <Button
                    key={game.slug}
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate(game.route)}
                    aria-label={t(gameTitleKey as any)}
                    style={{
                      minHeight: 'var(--touch-min)',
                      justifyContent: 'center',
                      animationDelay: `${index * 55}ms`,
                    }}
                  >
                    {t(gameTitleKey as any)}
                  </Button>
                );
              })}
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}
