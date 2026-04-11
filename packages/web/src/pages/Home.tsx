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
  | 'measureAndMatch'
  | 'numberLineJumps'
  | 'build10Workshop'
  | 'subtractionStreet'
  | 'timeAndRoutineBuilder'
  | 'colorGarden'
  | 'shapeSafari'
  | 'patternTrain'
  | 'letterSoundMatch'
  | 'letterTracingTrail'
  | 'letterSkyCatcher'
  | 'pictureToWordBuilder'
  | 'sightWordSprint'
  | 'decodableMicroStories'
  | 'decodableStoryMissions'
  | 'interactiveHandbook'
  | 'letterStorybook'
  | 'letterStorybookV2'
  | 'rootFamilyStickers'
  | 'confusableLetterContrast'
  | 'nikudSoundLadder'
  | 'syllableTrainBuilder'
  | 'soundSlideBlending'
  | 'shvaSoundSwitch'
  | 'spellAndSendPostOffice'
  | 'pointingFadeBridge'
  | 'blendToReadVideoShorts';

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
const HOME_MOBILE_MAX_WIDTH = 767;
const HOME_TABLET_MAX_WIDTH = 1199;

const SECTION_ORDER: HomeSectionSlug[] = ['letters', 'reading', 'math', 'books'];
const LETTER_STORYBOOK_TITLE_KEY = 'games.letterStorybook.title';
const LETTER_STORYBOOK_V2_TITLE_KEY = 'games.letterStorybookV2.title';

type HomeViewportMode = 'mobile' | 'tablet' | 'desktop';

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
    thumbnailUrl: '/images/games/thumbnails/moreOrLessMarket/thumb-16x10.webp',
    difficulty: 2,
    primaryAgeBand: '4-5',
    supportAgeBands: ['5-6'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'measureAndMatch',
    route: '/games/numbers/measure-and-match',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '6-7',
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
    slug: 'build10Workshop',
    route: '/games/numbers/build-10-workshop',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'subtractionStreet',
    route: '/games/numbers/subtraction-street',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'timeAndRoutineBuilder',
    route: '/games/numbers/time-and-routine-builder',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
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
    thumbnailUrl: '/images/games/thumbnails/shapeSafari/thumb-16x10.webp',
    difficulty: 2,
    primaryAgeBand: '3-4',
    supportAgeBands: ['4-5'],
    topic: 'math',
    section: 'math',
  },
  {
    slug: 'patternTrain',
    route: '/games/numbers/pattern-train',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 2,
    primaryAgeBand: '4-5',
    supportAgeBands: ['3-4', '5-6'],
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
    slug: 'decodableStoryMissions',
    route: '/games/reading/decodable-story-missions',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 5,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
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
    slug: 'letterStorybookV2',
    route: '/games/reading/letter-storybook-v2',
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
  {
    slug: 'nikudSoundLadder',
    route: '/games/reading/nikud-sound-ladder',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'syllableTrainBuilder',
    route: '/games/reading/syllable-train-builder',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'soundSlideBlending',
    route: '/games/reading/sound-slide-blending',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '5-6',
    supportAgeBands: ['6-7'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'shvaSoundSwitch',
    route: '/games/reading/shva-sound-switch',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 5,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'spellAndSendPostOffice',
    route: '/games/reading/spell-and-send-post-office',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 5,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'pointingFadeBridge',
    route: '/games/reading/pointing-fade-bridge',
    thumbnailUrl: DEFAULT_GAME_THUMBNAIL,
    difficulty: 4,
    primaryAgeBand: '6-7',
    supportAgeBands: ['5-6'],
    topic: 'reading',
    section: 'reading',
  },
  {
    slug: 'blendToReadVideoShorts',
    route: '/games/reading/blend-to-read-video-shorts',
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

function toHomeViewportMode(width: number): HomeViewportMode {
  if (width <= HOME_MOBILE_MAX_WIDTH) {
    return 'mobile';
  }

  if (width <= HOME_TABLET_MAX_WIDTH) {
    return 'tablet';
  }

  return 'desktop';
}

function toHomeGameTitleKey(slug: HomeGameSlug, hasLetterStorybookV2Title: boolean): string {
  if (slug === 'blendToReadVideoShorts') {
    return 'videos.blendToRead.title';
  }

  if (slug === 'letterStorybookV2') {
    return hasLetterStorybookV2Title ? LETTER_STORYBOOK_V2_TITLE_KEY : LETTER_STORYBOOK_TITLE_KEY;
  }

  return `games.${slug}.title`;
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
  const sectionRefs = useRef<Record<HomeSectionSlug, HTMLElement | null>>({
    letters: null,
    reading: null,
    math: null,
    books: null,
  });

  const [viewportMode, setViewportMode] = useState<HomeViewportMode>(() =>
    typeof window === 'undefined' ? 'desktop' : toHomeViewportMode(window.innerWidth),
  );
  const [isTabletRailExpanded, setIsTabletRailExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<HomeSectionSlug>('letters');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
    if (typeof window === 'undefined') {
      return;
    }

    const syncViewportMode = () => {
      setViewportMode(toHomeViewportMode(window.innerWidth));
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode, { passive: true });

    return () => {
      window.removeEventListener('resize', syncViewportMode);
    };
  }, []);

  useEffect(() => {
    if (viewportMode !== 'tablet') {
      setIsTabletRailExpanded(true);
    }
  }, [viewportMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();
    mediaQuery.addEventListener('change', syncReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', syncReducedMotion);
    };
  }, []);

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
  const hasLetterStorybookV2Title = i18n.exists(LETTER_STORYBOOK_V2_TITLE_KEY, { ns: 'common' });

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

  const handleToggleTabletRail = useCallback(() => {
    setIsTabletRailExpanded((previousState) => {
      const nextState = !previousState;
      playCommonAudioNow(nextState ? 'nav.chooseTopic' : 'nav.back');
      return nextState;
    });
  }, [playCommonAudioNow]);

  const startFeaturedRoute = featuredGames[0]?.route ?? allVisibleGames[0]?.route ?? '/games';
  const startFeaturedAudioKey = featuredGames[0]
    ? toHomeGameTitleKey(featuredGames[0].slug, hasLetterStorybookV2Title)
    : 'home.startLearning';

  const showEmptyState = allVisibleGames.length === 0;
  const showSectionChoices = !requiresProgressiveReveal || showExpandedChoices;
  const remainingChoiceCount = Math.max(0, allVisibleGames.length - featuredGames.length);
  const visibleSectionSlugs = useMemo(
    () => SECTION_ORDER.filter((sectionSlug) => sectionedGames[sectionSlug].length > 0),
    [sectionedGames],
  );

  useEffect(() => {
    if (visibleSectionSlugs.length === 0) {
      return;
    }

    setActiveSection((previousSection) =>
      visibleSectionSlugs.includes(previousSection) ? previousSection : visibleSectionSlugs[0],
    );
  }, [visibleSectionSlugs]);

  useEffect(() => {
    if (!showSectionChoices || visibleSectionSlugs.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const intersectionRatios = new Map<HomeSectionSlug, number>();
    visibleSectionSlugs.forEach((sectionSlug) => {
      intersectionRatios.set(sectionSlug, 0);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const slug = entry.target.getAttribute('data-home-section-slug') as HomeSectionSlug | null;
          if (!slug) {
            return;
          }

          intersectionRatios.set(slug, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let nextActiveSection = activeSection;
        let highestRatio = 0;

        visibleSectionSlugs.forEach((sectionSlug) => {
          const ratio = intersectionRatios.get(sectionSlug) ?? 0;
          if (ratio > highestRatio) {
            highestRatio = ratio;
            nextActiveSection = sectionSlug;
          }
        });

        if (highestRatio > 0 && nextActiveSection !== activeSection) {
          setActiveSection(nextActiveSection);
        }
      },
      {
        root: null,
        threshold: [0.1, 0.25, 0.5, 0.7],
        rootMargin: '-30% 0px -45% 0px',
      },
    );

    visibleSectionSlugs.forEach((sectionSlug) => {
      const sectionElement = sectionRefs.current[sectionSlug];
      if (sectionElement) {
        observer.observe(sectionElement);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activeSection, showSectionChoices, visibleSectionSlugs]);

  const handleJumpToSection = useCallback(
    (sectionSlug: HomeSectionSlug) => {
      const targetElement = sectionRefs.current[sectionSlug];
      if (!targetElement) {
        return;
      }

      setActiveSection(sectionSlug);
      playCommonAudioNow(`home.sections.${sectionSlug}.title`);

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    },
    [playCommonAudioNow, prefersReducedMotion],
  );

  const renderSectionJumpControls = (axis: 'inline' | 'block') => {
    if (visibleSectionSlugs.length === 0 || !showSectionChoices) {
      return null;
    }

    return (
      <div
        className={`home__section-jumps home__section-jumps--${axis}`}
        role="group"
        aria-label={t('home.chooseTopic')}
      >
        {visibleSectionSlugs.map((sectionSlug) => {
          const sectionTitleKey = `home.sections.${sectionSlug}.title` as const;
          const isActive = activeSection === sectionSlug;

          return (
            <button
              key={`home-jump-${sectionSlug}`}
              type="button"
              className={`home__section-jump${isActive ? ' is-active' : ''}`}
              aria-label={t(sectionTitleKey)}
              aria-controls={`home-section-${sectionSlug}`}
              aria-pressed={isActive}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => handleJumpToSection(sectionSlug)}
              onFocus={() => setActiveSection(sectionSlug)}
            >
              <span aria-hidden="true" className="home__section-jump-icon">
                {SECTION_ICON_BY_SLUG[sectionSlug]}
              </span>
              <span className="home__section-jump-label">{t(sectionTitleKey)}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const showMobileUtilityShelf = viewportMode === 'mobile';
  const showSideRail = viewportMode !== 'mobile';
  const showSideRailPanel = viewportMode === 'desktop' || isTabletRailExpanded;

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
      <div className="home__layout">
        <div className="home__content-column">
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

          {showMobileUtilityShelf && (
            <Card padding="sm" className="home__mobile-utility-shelf">
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
              {renderSectionJumpControls('inline')}
              {catalogLoadStatus === 'error' && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-danger)' }}>
                  {t('contentFilters.age.fallbackNotice')}
                </p>
              )}
            </Card>
          )}

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
                  const gameTitleKey = toHomeGameTitleKey(game.slug, hasLetterStorybookV2Title);

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
                  <section
                    key={sectionSlug}
                    id={`home-section-${sectionSlug}`}
                    data-home-section-slug={sectionSlug}
                    className="home__section-anchor"
                    ref={(element) => {
                      sectionRefs.current[sectionSlug] = element;
                    }}
                  >
                    <Card
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
                          const gameTitleKey = toHomeGameTitleKey(game.slug, hasLetterStorybookV2Title);

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
                  </section>
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
        </div>

        {showSideRail && (
          <aside
            className={`home__utility-rail ${viewportMode === 'tablet' ? 'home__utility-rail--tablet' : 'home__utility-rail--desktop'} ${showSideRailPanel ? 'is-open' : 'is-collapsed'}`}
            aria-label={t('contentFilters.age.title')}
          >
            {viewportMode === 'tablet' && (
              <Button
                variant="secondary"
                size="sm"
                className="home__utility-toggle"
                aria-expanded={showSideRailPanel}
                aria-controls="home-utility-panel"
                aria-label={showSideRailPanel ? t('nav.back') : t('nav.chooseTopic')}
                onClick={handleToggleTabletRail}
              >
                {showSideRailPanel ? '✕' : '☰'}
                <span>{showSideRailPanel ? t('nav.back') : t('nav.chooseTopic')}</span>
              </Button>
            )}

            {showSideRailPanel && (
              <div id="home-utility-panel" className="home__utility-panel">
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
                {renderSectionJumpControls('block')}
                {catalogLoadStatus === 'error' && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-danger)' }}>
                    {t('contentFilters.age.fallbackNotice')}
                  </p>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      <style>{`
        .home__layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--home-rail-gap);
          align-items: start;
        }

        .home__content-column {
          display: grid;
          gap: var(--space-md);
          min-inline-size: 0;
        }

        .home__hero-stats {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .home__mobile-utility-shelf {
          position: sticky;
          inset-block-start: var(--home-sticky-offset);
          z-index: var(--home-rail-z-index);
          display: grid;
          gap: var(--space-sm);
          background: color-mix(in srgb, var(--color-bg-card) 92%, white 8%);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 28%, transparent);
          backdrop-filter: saturate(1.1) blur(4px);
        }

        .home__utility-rail {
          position: sticky;
          inset-block-start: var(--home-sticky-offset);
          z-index: var(--home-rail-z-index);
          display: grid;
          gap: var(--space-sm);
          align-self: start;
          justify-items: end;
        }

        .home__utility-panel {
          inline-size: var(--home-rail-inline-size);
          display: grid;
          gap: var(--space-sm);
          border-radius: var(--radius-lg);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 28%, transparent);
          background:
            linear-gradient(
              170deg,
              color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%),
              var(--color-bg-card)
            );
          box-shadow: var(--shadow-card);
          padding: var(--space-sm);
        }

        .home__utility-toggle {
          min-block-size: var(--home-rail-toggle-size);
          min-inline-size: var(--home-rail-toggle-size);
          padding-inline: var(--space-sm);
          align-self: start;
        }

        .home__section-jumps {
          display: flex;
          gap: var(--space-xs);
        }

        .home__section-jumps--inline {
          overflow-x: auto;
          padding-block-end: var(--space-2xs);
          scrollbar-width: thin;
        }

        .home__section-jumps--block {
          flex-direction: column;
        }

        .home__section-jump {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--space-2xs);
          min-block-size: var(--home-section-jump-target-min);
          min-inline-size: var(--home-section-jump-target-min);
          border-radius: var(--radius-full);
          border: 1px solid var(--color-filter-chip-border);
          background: var(--color-filter-chip-bg);
          color: var(--color-text-primary);
          padding-inline: var(--space-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          touch-action: manipulation;
          text-align: start;
        }

        .home__section-jumps--inline .home__section-jump {
          flex: 0 0 auto;
        }

        .home__section-jumps--block .home__section-jump {
          inline-size: 100%;
        }

        .home__section-jump.is-active {
          border-color: var(--color-filter-chip-active-bg);
          background: color-mix(in srgb, var(--color-filter-chip-active-bg) 84%, white 16%);
          box-shadow: var(--shadow-filter-chip-active);
        }

        .home__section-jump:focus-visible {
          outline: 2px solid var(--color-theme-primary);
          outline-offset: 2px;
        }

        .home__section-jump-icon {
          inline-size: 1.1em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .home__section-jump-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .home__section-anchor {
          scroll-margin-block-start: calc(var(--home-sticky-offset) + var(--touch-filter-chip) + var(--space-xl));
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

        @media (min-width: 768px) {
          .home__layout {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .home__mobile-utility-shelf {
            display: none;
          }
        }

        @media (min-width: 1200px) {
          .home__layout {
            grid-template-columns: minmax(0, 1fr) var(--home-rail-inline-size);
          }

          .home__utility-toggle {
            display: none;
          }

          .home__utility-panel {
            inline-size: 100%;
          }
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

        @media (max-width: 767px) {
          .home__utility-rail {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home__section-jump {
            transition: none;
          }
        }
      `}</style>
    </ChildRouteScaffold>
  );
}
