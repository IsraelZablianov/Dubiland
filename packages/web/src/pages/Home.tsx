import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AgeRangeFilterBar, Button, Card, GameCard, TopicCard } from '@/components/design-system';
import { MascotIllustration, TopicIllustration } from '@/components/illustrations';
import { FloatingElement, SuccessCelebration } from '@/components/motion';
import { DAILY_LEARNING_GOAL_MINUTES } from '@/constants/learningGoals';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useChildProgress } from '@/hooks/useChildProgress';
import { getPersistedAgeBandOverride, persistAgeBandOverride } from '@/lib/ageFilterPreferences';
import {
  listCatalogForChild,
  type CatalogAgeBand,
  type CatalogItem,
  type CatalogTopicSlug,
} from '@/lib/catalogRepository';
import { getActiveChildProfile } from '@/lib/session';

type TopicSlug = 'math' | 'letters' | 'reading';
type AgeBand = CatalogAgeBand;
type ProfileAgeBand = Exclude<AgeBand, 'all'>;
type HomeGameSlug =
  | 'countingPicnic'
  | 'moreOrLessMarket'
  | 'numberLineJumps'
  | 'colorGarden'
  | 'shapeSafari'
  | 'letterSoundMatch'
  | 'letterTracingTrail'
  | 'letterSkyCatcher'
  | 'pictureToWordBuilder'
  | 'sightWordSprint'
  | 'decodableMicroStories'
  | 'interactiveHandbook'
  | 'rootFamilyStickers';

interface TopicState {
  slug: TopicSlug;
  progress: number;
}

interface TopicGameOption {
  slug: HomeGameSlug;
  route: string;
  thumbnailUrl?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  primaryAgeBand: ProfileAgeBand;
  supportAgeBands: ProfileAgeBand[];
}

interface HomeGameCardItem {
  id: string;
  slug: HomeGameSlug;
  route: string;
  thumbnailUrl?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  primaryAgeBand: ProfileAgeBand;
  supportAgeBands: ProfileAgeBand[];
  topic: TopicSlug;
  ageMatchRank: 1 | 2 | 3;
  sortOrder: number;
}

const AGE_BANDS: ProfileAgeBand[] = ['3-4', '4-5', '5-6', '6-7'];
const NAVIGATION_AUDIO_LEAD_MS = 140;

const GAME_OPTIONS_BY_TOPIC: Record<TopicSlug, TopicGameOption[]> = {
  math: [
    {
      slug: 'countingPicnic',
      route: '/games/numbers/counting-picnic',
      thumbnailUrl: '/images/games/thumbnails/countingPicnic/thumb-16x10.webp',
      difficulty: 2,
      primaryAgeBand: '3-4',
      supportAgeBands: ['4-5'],
    },
    {
      slug: 'moreOrLessMarket',
      route: '/games/numbers/more-or-less-market',
      difficulty: 2,
      primaryAgeBand: '4-5',
      supportAgeBands: ['5-6'],
    },
    {
      slug: 'numberLineJumps',
      route: '/games/numbers/number-line-jumps',
      difficulty: 3,
      primaryAgeBand: '5-6',
      supportAgeBands: ['6-7'],
    },
    {
      slug: 'colorGarden',
      route: '/games/colors/color-garden',
      thumbnailUrl: '/images/games/thumbnails/colorGarden/thumb-16x10.webp',
      difficulty: 2,
      primaryAgeBand: '3-4',
      supportAgeBands: ['4-5'],
    },
    {
      slug: 'shapeSafari',
      route: '/games/numbers/shape-safari',
      difficulty: 2,
      primaryAgeBand: '3-4',
      supportAgeBands: ['4-5'],
    },
  ],
  letters: [
    {
      slug: 'letterSoundMatch',
      route: '/games/letters/letter-sound-match',
      thumbnailUrl: '/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp',
      difficulty: 3,
      primaryAgeBand: '4-5',
      supportAgeBands: ['5-6'],
    },
    {
      slug: 'letterTracingTrail',
      route: '/games/letters/letter-tracing-trail',
      thumbnailUrl: '/images/games/thumbnails/letterTracingTrail/thumb-16x10.webp',
      difficulty: 2,
      primaryAgeBand: '5-6',
      supportAgeBands: ['6-7'],
    },
    {
      slug: 'letterSkyCatcher',
      route: '/games/letters/letter-sky-catcher',
      difficulty: 3,
      primaryAgeBand: '4-5',
      supportAgeBands: ['5-6', '6-7'],
    },
  ],
  reading: [
    {
      slug: 'pictureToWordBuilder',
      route: '/games/reading/picture-to-word-builder',
      thumbnailUrl: '/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp',
      difficulty: 3,
      primaryAgeBand: '5-6',
      supportAgeBands: ['6-7'],
    },
    {
      slug: 'sightWordSprint',
      route: '/games/reading/sight-word-sprint',
      difficulty: 3,
      primaryAgeBand: '5-6',
      supportAgeBands: ['6-7'],
    },
    {
      slug: 'decodableMicroStories',
      route: '/games/reading/decodable-micro-stories',
      difficulty: 4,
      primaryAgeBand: '5-6',
      supportAgeBands: ['6-7'],
    },
    {
      slug: 'interactiveHandbook',
      route: '/games/reading/interactive-handbook',
      difficulty: 3,
      primaryAgeBand: '4-5',
      supportAgeBands: ['5-6', '6-7'],
    },
    {
      slug: 'rootFamilyStickers',
      route: '/games/reading/root-family-stickers',
      difficulty: 4,
      primaryAgeBand: '6-7',
      supportAgeBands: ['5-6'],
    },
  ],
};

const GAME_OPTIONS_BY_SLUG: Record<HomeGameSlug, TopicGameOption & { topic: TopicSlug }> = {
  countingPicnic: { ...GAME_OPTIONS_BY_TOPIC.math[0], topic: 'math' },
  moreOrLessMarket: { ...GAME_OPTIONS_BY_TOPIC.math[1], topic: 'math' },
  numberLineJumps: { ...GAME_OPTIONS_BY_TOPIC.math[2], topic: 'math' },
  colorGarden: { ...GAME_OPTIONS_BY_TOPIC.math[3], topic: 'math' },
  shapeSafari: { ...GAME_OPTIONS_BY_TOPIC.math[4], topic: 'math' },
  letterSoundMatch: { ...GAME_OPTIONS_BY_TOPIC.letters[0], topic: 'letters' },
  letterTracingTrail: { ...GAME_OPTIONS_BY_TOPIC.letters[1], topic: 'letters' },
  letterSkyCatcher: { ...GAME_OPTIONS_BY_TOPIC.letters[2], topic: 'letters' },
  pictureToWordBuilder: { ...GAME_OPTIONS_BY_TOPIC.reading[0], topic: 'reading' },
  sightWordSprint: { ...GAME_OPTIONS_BY_TOPIC.reading[1], topic: 'reading' },
  decodableMicroStories: { ...GAME_OPTIONS_BY_TOPIC.reading[2], topic: 'reading' },
  interactiveHandbook: { ...GAME_OPTIONS_BY_TOPIC.reading[3], topic: 'reading' },
  rootFamilyStickers: { ...GAME_OPTIONS_BY_TOPIC.reading[4], topic: 'reading' },
};

const TOPIC_ICON_BY_SLUG: Record<TopicSlug, string> = {
  math: '🔢',
  letters: '🔤',
  reading: '📖',
};

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function resolveCommonAudioPath(rawKey: string): string {
  return `/audio/he/${rawKey.split('.').map(toKebabCase).join('/')}.mp3`;
}

function isProfileAgeBand(value: string | undefined): value is ProfileAgeBand {
  return value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7';
}

function toCatalogTopicSlug(topic: TopicSlug): CatalogTopicSlug {
  return topic;
}

function toBandKey(band: ProfileAgeBand): '3_4' | '4_5' | '5_6' | '6_7' {
  if (band === '3-4') return '3_4';
  if (band === '4-5') return '4_5';
  if (band === '5-6') return '5_6';
  return '6_7';
}

function toAgeMatchRank(
  option: Pick<TopicGameOption, 'primaryAgeBand' | 'supportAgeBands'>,
  selectedAgeBand: AgeBand,
  profileAgeBand?: ProfileAgeBand,
): 1 | 2 | 3 {
  const targetBand = selectedAgeBand === 'all' ? profileAgeBand : selectedAgeBand;

  if (!targetBand) {
    return 3;
  }

  if (option.primaryAgeBand === targetBand) {
    return 1;
  }

  if (option.supportAgeBands.includes(targetBand)) {
    return 2;
  }

  return 3;
}

function buildFallbackGames(
  topic: TopicSlug,
  selectedAgeBand: AgeBand,
  profileAgeBand?: ProfileAgeBand,
): HomeGameCardItem[] {
  return GAME_OPTIONS_BY_TOPIC[topic]
    .map((option, index) => ({
      id: `local-${topic}-${option.slug}`,
      slug: option.slug,
      route: option.route,
      thumbnailUrl: option.thumbnailUrl,
      difficulty: option.difficulty,
      primaryAgeBand: option.primaryAgeBand,
      supportAgeBands: option.supportAgeBands,
      topic,
      ageMatchRank: toAgeMatchRank(option, selectedAgeBand, profileAgeBand),
      sortOrder: index,
    }))
    .filter((option) => selectedAgeBand === 'all' || option.ageMatchRank < 3)
    .sort((a, b) => a.ageMatchRank - b.ageMatchRank || a.sortOrder - b.sortOrder);
}

function toHomeGameCard(item: CatalogItem): HomeGameCardItem | null {
  if (item.contentType !== 'game' || !item.slug) {
    return null;
  }

  const fallback = GAME_OPTIONS_BY_SLUG[item.slug as HomeGameSlug];
  if (!fallback) {
    return null;
  }

  return {
    id: item.contentId,
    slug: fallback.slug,
    route: fallback.route,
    thumbnailUrl: item.thumbnailUrl ?? fallback.thumbnailUrl,
    difficulty: item.difficultyLevel,
    primaryAgeBand: item.primaryAgeBand,
    supportAgeBands: item.supportAgeBands,
    topic: fallback.topic,
    ageMatchRank: item.ageMatchRank,
    sortOrder: item.sortOrder,
  };
}

function initialSelectedAgeBand(profileAgeBand: ProfileAgeBand | undefined, persisted?: AgeBand | null): AgeBand {
  if (persisted) {
    return persisted;
  }

  if (profileAgeBand) {
    return profileAgeBand;
  }

  return 'all';
}

function shouldUseManualOverride(profileAgeBand: ProfileAgeBand | undefined, selectedAgeBand: AgeBand): boolean {
  if (!profileAgeBand) {
    return false;
  }

  return selectedAgeBand !== profileAgeBand;
}

export default function Home() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const childProfile = getActiveChildProfile();
  const childName = childProfile?.name ?? t('profile.guestName');
  const childId = childProfile?.id ?? null;
  const profileAgeBand = isProfileAgeBand(childProfile?.ageBand) ? childProfile.ageBand : undefined;

  const childProgress = useChildProgress(childId);

  const topics = useMemo<TopicState[]>(
    () =>
      childProgress.topics.map((tp) => ({
        slug: tp.slug,
        progress: tp.progress,
      })),
    [childProgress.topics],
  );

  const [selectedTopic, setSelectedTopic] = useState<TopicSlug>(topics[0]?.slug ?? 'math');

  const [selectedAgeBand, setSelectedAgeBand] = useState<AgeBand>(() => {
    const persisted = getPersistedAgeBandOverride(childId);
    return initialSelectedAgeBand(profileAgeBand, persisted);
  });

  const [isManualOverride, setIsManualOverride] = useState<boolean>(() =>
    shouldUseManualOverride(profileAgeBand, selectedAgeBand),
  );
  const [isPersistingOverride, setIsPersistingOverride] = useState(false);
  const [catalogGames, setCatalogGames] = useState<HomeGameCardItem[] | null>(null);
  const [catalogLoadStatus, setCatalogLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const pendingNavigationTimeoutRef = useRef<number | null>(null);

  const clearPendingNavigation = useCallback(() => {
    if (pendingNavigationTimeoutRef.current !== null) {
      window.clearTimeout(pendingNavigationTimeoutRef.current);
      pendingNavigationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingNavigation, [clearPendingNavigation]);

  useEffect(() => {
    const persisted = getPersistedAgeBandOverride(childId);
    const nextSelectedBand = initialSelectedAgeBand(profileAgeBand, persisted);
    setSelectedAgeBand(nextSelectedBand);
    setIsManualOverride(shouldUseManualOverride(profileAgeBand, nextSelectedBand));
  }, [childId, profileAgeBand]);

  useEffect(() => {
    let active = true;

    if (!childId) {
      setCatalogGames(null);
      setCatalogLoadStatus('idle');
      return () => {
        active = false;
      };
    }

    const requestedAgeBand: AgeBand | null = profileAgeBand
      ? (isManualOverride ? selectedAgeBand : null)
      : selectedAgeBand;

    setCatalogGames(null);
    setCatalogLoadStatus('loading');

    listCatalogForChild({
      childId,
      contentTypes: ['game'],
      topicSlug: toCatalogTopicSlug(selectedTopic),
      ageBand: requestedAgeBand,
      limit: 50,
      offset: 0,
    })
      .then((items) => {
        if (!active) return;

        if (items === null) {
          setCatalogGames(null);
          setCatalogLoadStatus('idle');
          return;
        }

        const mapped = items
          .map((item) => toHomeGameCard(item))
          .filter((item): item is HomeGameCardItem => item !== null)
          .sort((a, b) => a.ageMatchRank - b.ageMatchRank || a.sortOrder - b.sortOrder);

        setCatalogGames(mapped);
        setCatalogLoadStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setCatalogGames(null);
        setCatalogLoadStatus('error');
      });

    return () => {
      active = false;
    };
  }, [childId, isManualOverride, profileAgeBand, selectedAgeBand, selectedTopic]);

  const selectedTopicProgress = topics.find((topic) => topic.slug === selectedTopic)?.progress ?? 0;
  const dailyGoalMinutes = childProgress.dailyMinutes;
  const dailyGoalTarget = DAILY_LEARNING_GOAL_MINUTES;
  const dailyGoalProgress = Math.min(100, Math.round((dailyGoalMinutes / dailyGoalTarget) * 100));

  const fallbackGames = useMemo(
    () => buildFallbackGames(selectedTopic, selectedAgeBand, profileAgeBand),
    [profileAgeBand, selectedAgeBand, selectedTopic],
  );

  const selectedTopicGames = catalogGames ?? fallbackGames;

  const routeByTopic: Record<TopicSlug, string> = {
    math: GAME_OPTIONS_BY_TOPIC.math[0]?.route ?? '/games/colors/color-garden',
    letters: GAME_OPTIONS_BY_TOPIC.letters[0]?.route ?? '/letters',
    reading: GAME_OPTIONS_BY_TOPIC.reading[0]?.route ?? '/reading',
  };

  const startRoute = selectedTopicGames[0]?.route ?? routeByTopic[selectedTopic];

  const ageBandLabels: Record<AgeBand, string> = {
    '3-4': t('contentFilters.age.band.3_4'),
    '4-5': t('contentFilters.age.band.4_5'),
    '5-6': t('contentFilters.age.band.5_6'),
    '6-7': t('contentFilters.age.band.6_7'),
    all: t('contentFilters.age.all'),
  };

  const playCommonAudioNow = useCallback(
    (audioKey: string) => {
      void audio.playNow(resolveCommonAudioPath(audioKey));
    },
    [audio],
  );

  const navigateWithLeadAudio = useCallback(
    (route: string, audioKey: string) => {
      playCommonAudioNow(audioKey);
      clearPendingNavigation();
      pendingNavigationTimeoutRef.current = window.setTimeout(() => {
        pendingNavigationTimeoutRef.current = null;
        navigate(route);
      }, NAVIGATION_AUDIO_LEAD_MS);
    },
    [clearPendingNavigation, navigate, playCommonAudioNow],
  );

  const handleSelectAgeBand = useCallback(
    (band: AgeBand) => {
      const manualOverride = shouldUseManualOverride(profileAgeBand, band);

      setSelectedAgeBand(band);
      setIsManualOverride(manualOverride);
      setIsPersistingOverride(true);

      void persistAgeBandOverride(childId, manualOverride || !profileAgeBand ? band : null).finally(() => {
        setIsPersistingOverride(false);
      });

      const audioKey =
        band === 'all'
          ? 'contentFilters.age.all'
          : `contentFilters.age.band.${toBandKey(band)}`;
      void audio.play(resolveCommonAudioPath(audioKey));
    },
    [audio, childId, profileAgeBand],
  );

  const handleResetToProfileAge = useCallback(() => {
    if (!profileAgeBand) {
      return;
    }

    setSelectedAgeBand(profileAgeBand);
    setIsManualOverride(false);
    setIsPersistingOverride(true);

    void persistAgeBandOverride(childId, null).finally(() => {
      setIsPersistingOverride(false);
    });

    void audio.play(resolveCommonAudioPath('contentFilters.age.resetToProfile'));
  }, [audio, childId, profileAgeBand]);

  const handleSelectTopic = useCallback(
    (topic: TopicSlug) => {
      setSelectedTopic(topic);
      playCommonAudioNow(`topics.${topic}`);
    },
    [playCommonAudioNow],
  );

  const handleStartLearning = useCallback(() => {
    navigateWithLeadAudio(startRoute, 'home.startLearning');
  }, [navigateWithLeadAudio, startRoute]);

  const handleOpenGame = useCallback(
    (route: string, gameTitleAudioKey: string) => {
      navigateWithLeadAudio(route, gameTitleAudioKey);
    },
    [navigateWithLeadAudio],
  );

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
        <header className="home__header">
          <div className="home__header-copy">
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

          <FloatingElement className="home__header-mascot">
            <MascotIllustration variant="hint" size="clamp(96px, 18vw, 120px)" />
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
            {t('home.minutes', { count: dailyGoalMinutes })} / {t('home.minutes', { count: dailyGoalTarget })}
          </h2>
          <div
            className="home__daily-goal-track"
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
              display: 'flex',
            }}
          >
            <div
              className="home__daily-goal-fill"
              style={{
                width: `${dailyGoalProgress}%`,
                height: '100%',
                borderRadius: 'var(--radius-full)',
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
                  icon={<TopicIllustration topic={topic.slug} size={82} loading="eager" fetchPriority="high" />}
                  title={t(`topics.${topic.slug}`)}
                  subtitle={t(`topicDescriptions.${topic.slug}`)}
                  progress={topic.progress}
                  onClick={() => handleSelectTopic(topic.slug)}
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
            onClick={handleStartLearning}
          >
            {t('home.startLearning')} · {selectedTopicProgress}%
          </Button>

          <SuccessCelebration dense />
        </Card>

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

          <AgeRangeFilterBar
            title={t('contentFilters.age.title')}
            state={{
              profileAgeBand,
              selectedAgeBand,
              isManualOverride,
            }}
            ageBands={AGE_BANDS}
            labels={ageBandLabels}
            allowAllAges
            isPersistingOverride={isPersistingOverride}
            persistingLabel={t('contentFilters.age.syncing')}
            onSelectBand={handleSelectAgeBand}
            onResetToProfileAge={handleResetToProfileAge}
            resetLabel={t('contentFilters.age.resetToProfile')}
          />

          {selectedTopicGames.length > 0 ? (
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
                  <GameCard
                    key={game.id}
                    title={t(gameTitleKey as any)}
                    thumbnailUrl={game.thumbnailUrl}
                    difficulty={game.difficulty}
                    agePrimaryLabel={ageBandLabels[game.primaryAgeBand]}
                    ageSupportLabels={game.supportAgeBands.map((band) => ageBandLabels[band])}
                    topicLabel={t(`contentTags.topic.${game.topic}` as any)}
                    topicIcon={TOPIC_ICON_BY_SLUG[game.topic]}
                    difficultyLabel={t('contentTags.difficulty.label')}
                    stars={Math.max(1, Math.round(selectedTopicProgress / 34))}
                    onClick={() => handleOpenGame(game.route, gameTitleKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenGame(game.route, gameTitleKey);
                      }
                    }}
                    aria-label={t(gameTitleKey as any)}
                    style={{
                      minHeight: '220px',
                      animationDelay: `${index * 55}ms`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <Card padding="lg" style={{ display: 'grid', placeItems: 'center' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {catalogLoadStatus === 'loading' ? t('contentFilters.age.loading') : t('games.empty')}
              </p>
            </Card>
          )}

          {catalogLoadStatus === 'error' && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-danger)' }}>
              {t('contentFilters.age.fallbackNotice')}
            </p>
          )}
        </Card>
      </section>
      <style>{`
        .home__header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-md);
        }

        .home__header-copy {
          display: grid;
          gap: var(--space-xs);
        }

        .home__header-mascot {
          justify-self: end;
        }

        .home__daily-goal-track {
          justify-content: flex-start;
        }

        .home__daily-goal-fill {
          background: linear-gradient(90deg, var(--color-accent-success), var(--color-accent-info));
        }

        html[dir='rtl'] .home__daily-goal-track {
          justify-content: flex-end;
        }

        html[dir='rtl'] .home__daily-goal-fill {
          background: linear-gradient(270deg, var(--color-accent-success), var(--color-accent-info));
        }

        @media (max-width: 640px) {
          .home__header {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .home__header-mascot {
            justify-self: center;
          }
        }
      `}</style>
    </main>
  );
}
