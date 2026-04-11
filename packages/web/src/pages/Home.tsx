import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AgeRangeFilterBar, Button, Card, GameCard } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { FloatingElement, SuccessCelebration } from '@/components/motion';
import { DAILY_LEARNING_GOAL_MINUTES } from '@/constants/learningGoals';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useChildProgress } from '@/hooks/useChildProgress';
import { getPersistedAgeBandOverride, persistAgeBandOverride } from '@/lib/ageFilterPreferences';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { assetUrl } from '@/lib/assetUrl';
import { listCatalogForChild, type CatalogAgeBand, type CatalogItem } from '@/lib/catalogRepository';
import { resolveConcurrentChoiceLimit } from '@/lib/concurrentChoiceLimit';
import { isRtlDirection, rtlProgressGradient } from '@/lib/rtlChrome';
import { getActiveChildProfile } from '@/lib/session';

type TopicSlug = 'math' | 'letters' | 'reading';
type HomeSectionSlug = 'letters' | 'reading' | 'math' | 'books';
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
  | 'letterStorybook'
  | 'rootFamilyStickers'
  | 'confusableLetterContrast';

interface TopicGameOption {
  slug: HomeGameSlug;
  route: string;
  thumbnailUrl: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  primaryAgeBand: ProfileAgeBand;
  supportAgeBands: ProfileAgeBand[];
  topic: TopicSlug;
  section: HomeSectionSlug;
}

interface HomeGameCardItem {
  id: string;
  slug: HomeGameSlug;
  route: string;
  thumbnailUrl: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  primaryAgeBand: ProfileAgeBand;
  supportAgeBands: ProfileAgeBand[];
  topic: TopicSlug;
  section: HomeSectionSlug;
  ageMatchRank: 1 | 2 | 3;
  sortOrder: number;
}

const AGE_BANDS: ProfileAgeBand[] = ['3-4', '4-5', '5-6', '6-7'];
const NAVIGATION_AUDIO_LEAD_MS = 140;
const DEFAULT_GAME_THUMBNAIL = '/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp';
const HOME_BACKGROUND_IMAGE_PATH = '/images/backgrounds/home/home-storybook.webp';

const SECTION_ORDER: HomeSectionSlug[] = ['letters', 'reading', 'math', 'books'];

const SECTION_ICON_BY_SLUG: Record<HomeSectionSlug, string> = {
  letters: '🔤',
  reading: '🧠',
  math: '🔢',
  books: '📚',
};

const TOPIC_ICON_BY_SLUG: Record<TopicSlug, string> = {
  math: '🔢',
  letters: '🔤',
  reading: '📖',
};

const HOME_GAME_OPTIONS: TopicGameOption[] = [
  {
    slug: 'countingPicnic',
    route: '/games/numbers/counting-picnic',
    thumbnailUrl: '/images/games/thumbnails/countingPicnic/thumb-16x10.webp',
    difficulty: 2,
    primaryAgeBand: '3-4',
    supportAgeBands: ['4-5'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'moreOrLessMarket',
    route: '/games/numbers/more-or-less-market',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 2,
    primaryAgeBand: '4-5',
    supportAgeBands: ['5-6'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'numberLineJumps',
    route: '/games/numbers/number-line-jumps',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 3,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'colorGarden',
    route: '/games/colors/color-garden',
    thumbnailUrl: '/images/games/thumbnails/colorGarden/thumb-16x10.webp',
    difficulty: 2,
    primaryAgeBand: '3-4',
    supportAgeBands: ['4-5'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'shapeSafari',
    route: '/games/numbers/shape-safari',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 2,
    primaryAgeBand: '3-4',
    supportAgeBands: ['4-5'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'letterSoundMatch',
    route: '/games/letters/letter-sound-match',
    thumbnailUrl: '/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp',
    difficulty: 3,
    primaryAgeBand: '4-5',
    supportAgeBands: ['5-6'],
    topic: 'letters',
    section: 'letters',
  },
  {
    slug: 'letterTracingTrail',
    route: '/games/letters/letter-tracing-trail',
    thumbnailUrl: '/images/games/thumbnails/letterTracingTrail/thumb-16x10.webp',
    difficulty: 2,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'letters',
    section: 'letters',
  },
  {
    slug: 'letterSkyCatcher',
    route: '/games/letters/letter-sky-catcher',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 3,
    primaryAgeBand: '4-5',
    supportAgeBands: ['5-6', '6-7'],
    topic: 'letters',
    section: 'letters',
  },
  {
    slug: 'pictureToWordBuilder',
    route: '/games/reading/picture-to-word-builder',
    thumbnailUrl: '/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp',
    difficulty: 3,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'sightWordSprint',
    route: '/games/reading/sight-word-sprint',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 3,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'decodableMicroStories',
    route: '/games/reading/decodable-micro-stories',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'interactiveHandbook',
    route: '/games/reading/interactive-handbook',
    thumbnailUrl: '/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp',
    difficulty: 3,
    primaryAgeBand: '3-4',
    supportAgeBands: ['4-5', '5-6', '6-7'],
    topic: 'reading',
    section: 'books',
  },
  {
    slug: 'letterStorybook',
    route: '/games/reading/letter-storybook',
    thumbnailUrl: '/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp',
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['3-4', '6-7'],
    topic: 'reading',
    section: 'books',
  },
  {
    slug: 'rootFamilyStickers',
    route: '/games/reading/root-family-stickers',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'confusableLetterContrast',
    route: '/games/reading/confusable-letter-contrast',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
];

const GAME_OPTIONS_BY_SLUG: Record<HomeGameSlug, TopicGameOption> = HOME_GAME_OPTIONS.reduce(
  (acc, option) => {
    acc[option.slug] = option;
    return acc;
  },
  {} as Record<HomeGameSlug, TopicGameOption>,
);

function resolveCommonAudioPath(rawKey: string): string {
  return resolveAudioPathFromKey(rawKey, 'common');
}

function isProfileAgeBand(value: string | undefined): value is ProfileAgeBand {
  return value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7';
}

function toBandKey(band: ProfileAgeBand): '3_4' | '4_5' | '5_6' | '6_7' {
  if (band === '3-4') return '3_4';
  if (band === '4-5') return '4_5';
  if (band === '5-6') return '5_6';
  return '6_7';
}

function toSectionOrderIndex(section: HomeSectionSlug): number {
  return SECTION_ORDER.indexOf(section);
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

function buildFallbackGames(selectedAgeBand: AgeBand, profileAgeBand?: ProfileAgeBand): HomeGameCardItem[] {
  return HOME_GAME_OPTIONS
    .map((option, index) => ({
      id: `local-${option.slug}`,
      slug: option.slug,
      route: option.route,
      thumbnailUrl: option.thumbnailUrl,
      difficulty: option.difficulty,
      primaryAgeBand: option.primaryAgeBand,
      supportAgeBands: option.supportAgeBands,
      topic: option.topic,
      section: option.section,
      ageMatchRank: toAgeMatchRank(option, selectedAgeBand, profileAgeBand),
      sortOrder: index,
    }))
    .filter((option) => selectedAgeBand === 'all' || option.ageMatchRank < 3)
    .sort(
      (a, b) =>
        a.ageMatchRank - b.ageMatchRank ||
        toSectionOrderIndex(a.section) - toSectionOrderIndex(b.section) ||
        a.sortOrder - b.sortOrder,
    );
}

function mergeCatalogWithFallbackGames(
  catalogGames: HomeGameCardItem[] | null,
  fallbackGames: HomeGameCardItem[],
): HomeGameCardItem[] {
  if (!catalogGames || catalogGames.length === 0) {
    return fallbackGames;
  }

  const mergedGames = [...catalogGames];
  const includedSlugs = new Set(catalogGames.map((game) => game.slug));

  fallbackGames.forEach((game) => {
    if (!includedSlugs.has(game.slug)) {
      mergedGames.push(game);
    }
  });

  return mergedGames.sort(
    (a, b) =>
      a.ageMatchRank - b.ageMatchRank ||
      toSectionOrderIndex(a.section) - toSectionOrderIndex(b.section) ||
      a.sortOrder - b.sortOrder,
  );
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
    section: fallback.section,
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

function toStars(progressPercent: number): number {
  if (progressPercent >= 100) return 3;
  if (progressPercent >= 67) return 2;
  if (progressPercent >= 25) return 1;
  return 0;
}

interface ProgressPillsProps {
  percent: number;
  segments?: number;
  ariaLabel: string;
  ariaValueText: string;
  isRtl: boolean;
}

function ProgressPills({ percent, segments = 6, ariaLabel, ariaValueText, isRtl }: ProgressPillsProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(percent)));
  const completed = Math.round((normalized / 100) * segments);

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      aria-valuetext={ariaValueText}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))`,
        gap: 'var(--space-xs)',
        minBlockSize: '14px',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={`progress-pill-${index}`}
          aria-hidden="true"
          style={{
            display: 'block',
            inlineSize: '100%',
            blockSize: '12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border-subtle)',
            background:
              index < completed
                ? rtlProgressGradient(isRtl, 'var(--color-accent-success)', 'var(--color-accent-info)')
                : 'color-mix(in srgb, var(--color-surface-muted) 72%, white 28%)',
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();
  const isRtl = isRtlDirection(i18n.dir(i18n.language));

  const childProfile = getActiveChildProfile();
  const childName = childProfile?.name ?? t('profile.guestName');
  const childId = childProfile?.id ?? null;
  const profileAgeBand = isProfileAgeBand(childProfile?.ageBand) ? childProfile.ageBand : undefined;

  const childProgress = useChildProgress(childId);

  const topicProgressBySlug = useMemo(
    () =>
      childProgress.topics.reduce(
        (acc, topic) => {
          acc[topic.slug] = topic.progress;
          return acc;
        },
        { math: 0, letters: 0, reading: 0 } as Record<TopicSlug, number>,
      ),
    [childProgress.topics],
  );

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
  const lastDailyGoalProgressRef = useRef<number | null>(null);

  const maxConcurrentChoices = useMemo(
    () => resolveConcurrentChoiceLimit(selectedAgeBand, profileAgeBand),
    [profileAgeBand, selectedAgeBand],
  );
  const requiresProgressiveReveal = maxConcurrentChoices <= 3;
  const [showExpandedChoices, setShowExpandedChoices] = useState<boolean>(() => !requiresProgressiveReveal);

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
    if (requiresProgressiveReveal) {
      setShowExpandedChoices(false);
      return;
    }

    setShowExpandedChoices(true);
  }, [requiresProgressiveReveal, selectedAgeBand]);

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
      ? isManualOverride
        ? selectedAgeBand
        : null
      : selectedAgeBand;

    setCatalogGames(null);
    setCatalogLoadStatus('loading');

    listCatalogForChild({
      childId,
      contentTypes: ['game'],
      topicSlug: null,
      ageBand: requestedAgeBand,
      limit: 80,
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
          .sort(
            (a, b) =>
              a.ageMatchRank - b.ageMatchRank ||
              toSectionOrderIndex(a.section) - toSectionOrderIndex(b.section) ||
              a.sortOrder - b.sortOrder,
          );

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
  }, [childId, isManualOverride, profileAgeBand, selectedAgeBand]);

  const dailyGoalMinutes = childProgress.dailyMinutes;
  const dailyGoalTarget = DAILY_LEARNING_GOAL_MINUTES;
  const dailyGoalProgress = Math.min(100, Math.round((dailyGoalMinutes / dailyGoalTarget) * 100));

  useEffect(() => {
    if (lastDailyGoalProgressRef.current == null) {
      lastDailyGoalProgressRef.current = dailyGoalProgress;
      return;
    }

    if (lastDailyGoalProgressRef.current !== dailyGoalProgress) {
      lastDailyGoalProgressRef.current = dailyGoalProgress;
      void audio.play(resolveCommonAudioPath('home.progressValue'));
    }
  }, [audio, dailyGoalProgress]);

  const fallbackGames = useMemo(
    () => buildFallbackGames(selectedAgeBand, profileAgeBand),
    [profileAgeBand, selectedAgeBand],
  );

  const allVisibleGames = useMemo(
    () => mergeCatalogWithFallbackGames(catalogGames, fallbackGames),
    [catalogGames, fallbackGames],
  );

  const sectionedGames = useMemo(() => {
    const result: Record<HomeSectionSlug, HomeGameCardItem[]> = {
      letters: [],
      reading: [],
      math: [],
      books: [],
    };

    allVisibleGames.forEach((game) => {
      result[game.section].push(game);
    });

    return result;
  }, [allVisibleGames]);

  const featuredGames = useMemo(() => {
    return [...allVisibleGames]
      .sort((a, b) => {
        const progressA = childProgress.gameProgressBySlug[a.slug] ?? 0;
        const progressB = childProgress.gameProgressBySlug[b.slug] ?? 0;

        const inProgressRankA = progressA > 0 && progressA < 100 ? 0 : progressA === 0 ? 1 : 2;
        const inProgressRankB = progressB > 0 && progressB < 100 ? 0 : progressB === 0 ? 1 : 2;

        return (
          a.ageMatchRank - b.ageMatchRank ||
          inProgressRankA - inProgressRankB ||
          progressB - progressA ||
          toSectionOrderIndex(a.section) - toSectionOrderIndex(b.section) ||
          a.sortOrder - b.sortOrder
        );
      })
      .slice(0, maxConcurrentChoices);
  }, [allVisibleGames, childProgress.gameProgressBySlug, maxConcurrentChoices]);

  const sectionProgressBySlug = useMemo(() => {
    const result: Record<HomeSectionSlug, number> = {
      letters: topicProgressBySlug.letters,
      reading: topicProgressBySlug.reading,
      math: topicProgressBySlug.math,
      books: 0,
    };

    const books = sectionedGames.books;
    if (books.length > 0) {
      const total = books.reduce((sum, game) => sum + (childProgress.gameProgressBySlug[game.slug] ?? 0), 0);
      result.books = Math.round(total / books.length);
    }

    return result;
  }, [childProgress.gameProgressBySlug, sectionedGames.books, topicProgressBySlug]);

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

      const audioKey = band === 'all' ? 'contentFilters.age.all' : `contentFilters.age.band.${toBandKey(band)}`;
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

  const handleOpenGame = useCallback(
    (route: string, gameTitleAudioKey: string) => {
      navigateWithLeadAudio(route, gameTitleAudioKey);
    },
    [navigateWithLeadAudio],
  );

  const handleRevealChoices = useCallback(() => {
    setShowExpandedChoices(true);
    playCommonAudioNow('home.chooseTopic');
  }, [playCommonAudioNow]);

  const startFeaturedRoute = featuredGames[0]?.route ?? allVisibleGames[0]?.route ?? '/games';
  const startFeaturedAudioKey = featuredGames[0] ? `games.${featuredGames[0].slug}.title` : 'home.startLearning';

  const showEmptyState = allVisibleGames.length === 0;
  const showSectionChoices = !requiresProgressiveReveal || showExpandedChoices;
  const remainingChoiceCount = Math.max(0, allVisibleGames.length - featuredGames.length);

  return (
    <ChildRouteScaffold
      width="standard"
      gap="var(--space-lg)"
      mainStyle={{
        backgroundImage:
          `radial-gradient(120% 120% at 10% 0%, color-mix(in srgb, var(--color-theme-secondary) 18%, transparent) 0%, transparent 55%), radial-gradient(120% 120% at 90% 100%, color-mix(in srgb, var(--color-accent-warning) 16%, transparent) 0%, transparent 58%), linear-gradient(180deg, color-mix(in srgb, var(--color-bg-primary) 78%, white 22%) 0%, color-mix(in srgb, var(--color-bg-secondary) 80%, white 20%) 100%), url(${assetUrl(HOME_BACKGROUND_IMAGE_PATH)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'screen, screen, soft-light, normal',
        padding: 'var(--space-xl)',
      }}
    >
        <Card
          padding="lg"
          style={{
            display: 'grid',
            gap: 'var(--space-md)',
            border: '2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent)',
            background:
              'linear-gradient(138deg, color-mix(in srgb, var(--color-bg-card) 76%, var(--color-theme-secondary) 24%), color-mix(in srgb, var(--color-bg-card) 86%, white 14%))',
          }}
        >
          <ChildRouteHeader
            title={t('home.greeting', { name: childName })}
            subtitle={t('home.dubiWelcome')}
            trailing={
              <FloatingElement durationMs={3200}>
                <MascotIllustration variant="hint" size="clamp(108px, 18vw, 132px)" />
              </FloatingElement>
            }
            headingStyle={{ gap: 'var(--space-xs)' }}
            titleStyle={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              color: 'var(--color-text-primary)',
            }}
            subtitleStyle={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-md)',
            }}
          />

          <div className="home__hero-stats">
            <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{t('home.dailyGoal')}</p>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
                {t('home.minutes', { count: dailyGoalMinutes })} / {t('home.minutes', { count: dailyGoalTarget })}
              </strong>
            </div>

            <Button
              variant="primary"
              size="lg"
              aria-label={t('home.startLearning')}
              onClick={() => navigateWithLeadAudio(startFeaturedRoute, startFeaturedAudioKey)}
            >
              {t('home.startLearning')}
            </Button>
          </div>

          <ProgressPills
            percent={dailyGoalProgress}
            segments={8}
            isRtl={isRtl}
            ariaLabel={t('home.dailyGoal')}
            ariaValueText={t('home.progressValue', { count: dailyGoalProgress })}
          />
        </Card>

        <Card
          padding="md"
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            border: '2px solid color-mix(in srgb, var(--color-accent-info) 28%, transparent)',
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 80%, var(--color-accent-info) 20%), var(--color-bg-card))',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)' }}>{t('home.featured.title')}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{t('home.featured.subtitle')}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{t('home.featured.badge')}</p>
          </div>

          {featuredGames.length > 0 ? (
            <div className="home__featured-grid">
              {featuredGames.map((game, index) => {
                const progressPercent = childProgress.gameProgressBySlug[game.slug] ?? 0;
                const gameTitleKey = `games.${game.slug}.title`;

                return (
                  <GameCard
                    key={`featured-${game.id}`}
                    title={t(gameTitleKey as any)}
                    thumbnailUrl={game.thumbnailUrl}
                    difficulty={game.difficulty}
                    agePrimaryLabel={ageBandLabels[game.primaryAgeBand]}
                    ageSupportLabels={game.supportAgeBands.map((band) => ageBandLabels[band])}
                    topicLabel={t(`contentTags.topic.${game.topic}` as any)}
                    topicIcon={TOPIC_ICON_BY_SLUG[game.topic]}
                    difficultyLabel={t('contentTags.difficulty.label')}
                    stars={toStars(progressPercent)}
                    progressPercent={progressPercent}
                    progressAriaLabel={t('home.progressLabel')}
                    progressValueLabel={t('home.progressValue', { count: progressPercent })}
                    playLabel={t('games.play')}
                    isRtl={isRtl}
                    onClick={() => handleOpenGame(game.route, gameTitleKey)}
                    aria-label={t(gameTitleKey as any)}
                    style={{
                      minHeight: '280px',
                      animationDelay: `${index * 70}ms`,
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

          <SuccessCelebration dense />
        </Card>

        <Card
          padding="md"
          style={{
            display: 'grid',
            gap: 'var(--space-sm)',
            border: '2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent)',
          }}
        >
          <h3 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>{t('contentFilters.age.title')}</h3>

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

          {catalogLoadStatus === 'error' && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-danger)' }}>
              {t('contentFilters.age.fallbackNotice')}
            </p>
          )}
        </Card>

        {showEmptyState ? (
          <Card padding="lg" style={{ display: 'grid', placeItems: 'center' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{t('home.emptyByAge')}</p>
          </Card>
        ) : showSectionChoices ? (
          <div className="home__sections-grid">
            {SECTION_ORDER.map((sectionSlug) => {
              const sectionGames = sectionedGames[sectionSlug];
              if (sectionGames.length === 0) {
                return null;
              }

              const sectionProgress = sectionProgressBySlug[sectionSlug] ?? 0;

              return (
                <Card
                  key={sectionSlug}
                  padding="md"
                  style={{
                    display: 'grid',
                    gap: 'var(--space-sm)',
                    border: '2px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent)',
                    background:
                      sectionSlug === 'books'
                        ? 'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 78%, var(--color-accent-warning) 22%), var(--color-bg-card))'
                        : 'var(--color-bg-card)',
                  }}
                >
                  <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
                      {SECTION_ICON_BY_SLUG[sectionSlug]} {t(`home.sections.${sectionSlug}.title` as any)}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {t(`home.sections.${sectionSlug}.subtitle` as any)}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                      {t('home.sectionProgressValue', { count: sectionProgress })}
                    </p>
                    <ProgressPills
                      percent={sectionProgress}
                      segments={5}
                      isRtl={isRtl}
                      ariaLabel={t(`home.sections.${sectionSlug}.title` as any)}
                      ariaValueText={t('home.sectionProgressValue', { count: sectionProgress })}
                    />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                      {t('home.sectionGameCount', { count: sectionGames.length })}
                    </p>
                  </div>

                  <div className="home__section-games-grid">
                    {sectionGames.map((game, index) => {
                      const progressPercent = childProgress.gameProgressBySlug[game.slug] ?? 0;
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
                          stars={toStars(progressPercent)}
                          progressPercent={progressPercent}
                          progressAriaLabel={t('home.progressLabel')}
                          progressValueLabel={t('home.progressValue', { count: progressPercent })}
                          playLabel={t('games.play')}
                          isRtl={isRtl}
                          onClick={() => handleOpenGame(game.route, gameTitleKey)}
                          aria-label={t(gameTitleKey as any)}
                          style={{
                            minHeight: '270px',
                            animationDelay: `${index * 55}ms`,
                          }}
                        />
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card
            padding="md"
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              border: '2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent)',
              background:
                'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 82%, var(--color-theme-secondary) 18%), var(--color-bg-card))',
            }}
          >
            <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
              <h3 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>{t('home.chooseTopic')}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {t('home.sectionGameCount', { count: remainingChoiceCount })}
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              aria-label={t('home.chooseTopic')}
              onClick={handleRevealChoices}
            >
              {t('home.chooseTopic')}
            </Button>
          </Card>
        )}
      

      <style>{`
        .home__hero-stats {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .home__featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-md);
        }

        .home__sections-grid {
          display: grid;
          gap: var(--space-md);
        }

        .home__section-games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-sm);
        }

        @media (max-width: 900px) {
          .home__featured-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .home__section-games-grid {
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .home__hero-stats {
            align-items: stretch;
          }

          .home__hero-stats button {
            inline-size: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </ChildRouteScaffold>
  );
}
