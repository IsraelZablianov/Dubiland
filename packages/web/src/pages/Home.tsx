import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card, TopicCard, useTheme } from '@/components/design-system';
import { getActiveChildProfile } from '@/lib/session';

type TopicSlug = 'math' | 'letters' | 'reading';

interface TopicState {
  slug: TopicSlug;
  icon: string;
  progress: number;
}

export default function Home() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { themeConfig } = useTheme();

  const childProfile = getActiveChildProfile();
  const childName = childProfile?.name ?? t('profile.guestName');

  const topics = useMemo<TopicState[]>(
    () => [
      { slug: 'math', icon: '🔢', progress: 78 },
      { slug: 'letters', icon: '🔠', progress: 58 },
      { slug: 'reading', icon: '📚', progress: 43 },
    ],
    [],
  );

  const [selectedTopic, setSelectedTopic] = useState<TopicSlug>(topics[0]?.slug ?? 'math');

  const selectedTopicProgress = topics.find((topic) => topic.slug === selectedTopic)?.progress ?? 0;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1040px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ fontSize: 'var(--font-size-3xl)' }}>{themeConfig.mascotEmoji}</p>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('home.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
              {t('home.greeting', { name: childName })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="md" onClick={() => navigate('/profiles')}>
              {t('profile.title')}
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/parent')}>
              {t('nav.parentArea')}
            </Button>
          </div>
        </header>

        <Card
          padding="lg"
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            border: '2px solid var(--color-bg-secondary)',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {t('home.dailyGoal')}
          </p>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-primary)' }}>
            {t('home.minutes', { count: 20 })}
          </h2>
          <div
            aria-label={t('home.dailyGoal')}
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
                width: '72%',
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--color-accent-success), var(--color-accent-info))',
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
            {topics.map((topic) => (
              <TopicCard
                key={topic.slug}
                icon={topic.icon}
                title={t(`topics.${topic.slug}`)}
                subtitle={t(`topicDescriptions.${topic.slug}`)}
                progress={topic.progress}
                onClick={() => setSelectedTopic(topic.slug)}
                style={{
                  border:
                    selectedTopic === topic.slug
                      ? '3px solid var(--color-theme-primary)'
                      : '2px solid transparent',
                }}
              />
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          style={{ justifySelf: 'start' }}
          aria-label={t('home.startLearning')}
        >
          {t('home.startLearning')} · {selectedTopicProgress}%
        </Button>
      </section>
    </main>
  );
}
