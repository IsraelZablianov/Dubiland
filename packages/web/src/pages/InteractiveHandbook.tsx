import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel, Json } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult } from '@/games/engine';
import {
  type HandbookPreloadManifest,
  type InteractiveHandbookPageProgress,
  type InteractiveHandbookProgressSnapshot,
} from '@/games/reading/InteractiveHandbookGame';
import {
  normalizeHandbookRuntimeContent,
  type HandbookRuntimeContent,
  type HandbookRuntimeMediaAssetRow,
  type HandbookRuntimePageRow,
} from '@/games/reading/handbookRuntimeAdapter';
import {
  READING_LADDER_BOOK_BY_AGE_BAND,
  toReadingAgeBand,
  type ReadingAgeBand,
} from '@/games/reading/readingRuntimeMatrix';
import { useAudioManager } from '@/hooks/useAudioManager';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { getActiveChildProfile } from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

type SyncState = 'idle' | 'syncing' | 'synced';
type LadderBookId = 'book1' | 'book4' | 'book5' | 'book6' | 'book7' | 'book8' | 'book9' | 'book10';
type LaunchSlotAlias =
  | 'bouncy-balloon'
  | 'magic-letter-map'
  | 'syllable-box'
  | 'star-message'
  | 'secret-clock'
  | 'class-newspaper'
  | 'root-family-lab';
type HandbookSlug =
  | 'mikaSoundGarden'
  | 'yoavLetterMap'
  | 'naamaSyllableBox'
  | 'oriBreadMarket'
  | 'tamarWordTower'
  | 'saharSecretClock'
  | 'guyClassNewspaper'
  | 'almaRootFamilies'
  | 'magicLetterMap';
type StoryDepthHandbookSlug = 'mikaSoundGarden' | 'yoavLetterMap' | 'tamarWordTower';
type ProfileAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
type LadderAgeBand = ReadingAgeBand;

interface HydratedProgressRow {
  furthest_page_number: number;
  completed: boolean;
  page_completion_json: unknown;
}

interface HydratedHandbookRow {
  id: string;
  preload_manifest_json: unknown;
}

const MAX_SYNC_BACKOFF_MS = 4000;
const DEFAULT_LADDER_BOOK_ID: LadderBookId = 'book4';
const AGE_BAND_TO_BOOK: Record<ProfileAgeBand, LadderBookId> = {
  '3-4': READING_LADDER_BOOK_BY_AGE_BAND['3-4'],
  '4-5': READING_LADDER_BOOK_BY_AGE_BAND['5-6'],
  '5-6': READING_LADDER_BOOK_BY_AGE_BAND['5-6'],
  '6-7': READING_LADDER_BOOK_BY_AGE_BAND['6-7'],
};
const LAUNCH_ALIAS_TO_HANDBOOK_SLUG: Record<LaunchSlotAlias, HandbookSlug> = {
  'bouncy-balloon': 'mikaSoundGarden',
  'magic-letter-map': 'magicLetterMap',
  'syllable-box': 'naamaSyllableBox',
  'star-message': 'tamarWordTower',
  'secret-clock': 'saharSecretClock',
  'class-newspaper': 'guyClassNewspaper',
  'root-family-lab': 'almaRootFamilies',
};
const BOOK_TO_LAUNCH_ALIAS: Record<LadderBookId, LaunchSlotAlias> = {
  book1: 'bouncy-balloon',
  book4: 'magic-letter-map',
  book5: 'syllable-box',
  book6: 'magic-letter-map',
  book7: 'star-message',
  book8: 'secret-clock',
  book9: 'class-newspaper',
  book10: 'root-family-lab',
};
const BOOK_TO_PAGE_COUNT: Record<LadderBookId, number> = {
  book1: 8,
  book4: 10,
  book5: 10,
  book6: 10,
  book7: 12,
  book8: 12,
  book9: 12,
  book10: 10,
};
const BOOK_TO_HANDBOOK_SLUG: Record<LadderBookId, HandbookSlug> = {
  book1: 'mikaSoundGarden',
  book4: 'magicLetterMap',
  book5: 'naamaSyllableBox',
  book6: 'oriBreadMarket',
  book7: 'tamarWordTower',
  book8: 'saharSecretClock',
  book9: 'guyClassNewspaper',
  book10: 'almaRootFamilies',
};
const STORY_DEPTH_SLUG_BY_BOOK: Partial<Record<LadderBookId, StoryDepthHandbookSlug>> = {
  book1: 'mikaSoundGarden',
  book7: 'tamarWordTower',
};
const HANDBOOK_SLUG_TO_BOOK: Record<HandbookSlug, LadderBookId> = {
  mikaSoundGarden: 'book1',
  yoavLetterMap: 'book4',
  naamaSyllableBox: 'book5',
  oriBreadMarket: 'book6',
  tamarWordTower: 'book7',
  saharSecretClock: 'book8',
  guyClassNewspaper: 'book9',
  almaRootFamilies: 'book10',
  magicLetterMap: 'book4',
};
const BOOK_SHELF_ORDER: LadderBookId[] = ['book1', 'book4', 'book5', 'book6', 'book7', 'book8', 'book9', 'book10'];
const BOOK_ICON_BY_ID: Record<LadderBookId, string> = {
  book1: '🌱',
  book4: '🗺️',
  book5: '🔤',
  book6: '🥖',
  book7: '🏰',
  book8: '⏰',
  book9: '📰',
  book10: '🧪',
};

const LazyInteractiveHandbookGame = lazy(async () => {
  const module = await import('@/games/reading/InteractiveHandbookGame');
  return { default: module.InteractiveHandbookGame };
});

const BASE_INTERACTIVE_HANDBOOK_GAME: Game = {
  id: 'local-interactive-handbook',
  topicId: 'reading',
  ageGroupId: '3-7',
  slug: 'interactiveHandbook',
  nameKey: 'games.interactiveHandbook.title',
  descriptionKey: 'games.interactiveHandbook.subtitle',
  gameType: 'handbook_story',
  componentKey: 'InteractiveHandbookGame',
  difficulty: 3,
  sortOrder: 4,
  thumbnailUrl: null,
  audioUrl: null,
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const BASE_INTERACTIVE_HANDBOOK_LEVEL: GameLevel = {
  id: 'local-interactive-handbook-level-1',
  gameId: BASE_INTERACTIVE_HANDBOOK_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    pages: 10,
    defaultBand: '5-6',
    handbookSlug: 'magicLetterMap',
    readingLadder: {
      activeBook: 'book4',
      orderedBookIds: ['book1', 'book4', 'book5', 'book6', 'book7', 'book8', 'book9', 'book10'],
      books: {
        book1: {
          ageBand: '3-4',
          handbookSlug: 'mikaSoundGarden',
          checkpointFocus: 'print_awareness',
        },
        book4: {
          ageBand: '5-6',
          handbookSlug: 'magicLetterMap',
          checkpointFocus: 'letter_nikud_cv_decoding',
        },
        book5: {
          ageBand: '5-6',
          handbookSlug: 'naamaSyllableBox',
          checkpointFocus: 'syllable_blend_text_fluency',
        },
        book6: {
          ageBand: '5-6',
          handbookSlug: 'oriBreadMarket',
          checkpointFocus: 'final_forms_word_automaticity',
        },
        book7: {
          ageBand: '6-7',
          handbookSlug: 'tamarWordTower',
          checkpointFocus: 'phrase_fluency_comprehension',
        },
        book8: {
          ageBand: '6-7',
          handbookSlug: 'saharSecretClock',
          checkpointFocus: 'mixed_pointing_time_marker_comprehension',
        },
        book9: {
          ageBand: '6-7',
          handbookSlug: 'guyClassNewspaper',
          checkpointFocus: 'paragraph_fact_inference',
        },
        book10: {
          ageBand: '6-7',
          handbookSlug: 'almaRootFamilies',
          checkpointFocus: 'root_family_transfer',
        },
      },
      qualityGate: {
        firstTryAccuracyMin: 70,
        hintRateMax: 35,
      },
    },
  },
  sortOrder: 1,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLadderBookId(value: unknown): value is LadderBookId {
  return (
    value === 'book1' ||
    value === 'book4' ||
    value === 'book5' ||
    value === 'book6' ||
    value === 'book7' ||
    value === 'book8' ||
    value === 'book9' ||
    value === 'book10'
  );
}

function isHandbookSlug(value: unknown): value is HandbookSlug {
  return (
    value === 'mikaSoundGarden' ||
    value === 'yoavLetterMap' ||
    value === 'naamaSyllableBox' ||
    value === 'oriBreadMarket' ||
    value === 'tamarWordTower' ||
    value === 'saharSecretClock' ||
    value === 'guyClassNewspaper' ||
    value === 'almaRootFamilies' ||
    value === 'magicLetterMap'
  );
}

function isProfileAgeBand(value: unknown): value is ProfileAgeBand {
  return value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7';
}

function toLadderAgeBand(value: unknown): LadderAgeBand | null {
  if (value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7') {
    return toReadingAgeBand(value);
  }
  return null;
}

function resolveActiveLadderBookId(levelConfig: Record<string, unknown>, profileAgeBand: unknown): LadderBookId {
  if (isProfileAgeBand(profileAgeBand)) {
    return AGE_BAND_TO_BOOK[profileAgeBand];
  }

  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  if (readingLadderConfig && isLadderBookId(readingLadderConfig.activeBook)) {
    return readingLadderConfig.activeBook;
  }

  if (isProfileAgeBand(levelConfig.defaultBand)) {
    return AGE_BAND_TO_BOOK[levelConfig.defaultBand];
  }

  if (isHandbookSlug(levelConfig.handbookSlug)) {
    return HANDBOOK_SLUG_TO_BOOK[levelConfig.handbookSlug];
  }

  return DEFAULT_LADDER_BOOK_ID;
}

function resolveHandbookSlug(levelConfig: Record<string, unknown>, activeBookId: LadderBookId): HandbookSlug {
  const storyDepthSlug = STORY_DEPTH_SLUG_BY_BOOK[activeBookId];
  if (storyDepthSlug) {
    return storyDepthSlug;
  }

  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const booksConfig = readingLadderConfig && isRecord(readingLadderConfig.books) ? readingLadderConfig.books : null;
  const activeBookConfig = booksConfig && isRecord(booksConfig[activeBookId]) ? booksConfig[activeBookId] : null;

  if (activeBookConfig && isHandbookSlug(activeBookConfig.handbookSlug)) {
    return activeBookConfig.handbookSlug;
  }

  if (isHandbookSlug(levelConfig.handbookSlug)) {
    return levelConfig.handbookSlug;
  }

  return BOOK_TO_HANDBOOK_SLUG[activeBookId];
}

function resolveStoryDepthSlug(activeBookId: LadderBookId, handbookSlug: HandbookSlug): StoryDepthHandbookSlug | null {
  const mappedSlug = STORY_DEPTH_SLUG_BY_BOOK[activeBookId];
  if (mappedSlug) {
    return mappedSlug;
  }

  if (handbookSlug === 'mikaSoundGarden' || handbookSlug === 'yoavLetterMap' || handbookSlug === 'tamarWordTower') {
    return handbookSlug;
  }

  return null;
}

function handbookMetaKey(slug: HandbookSlug, field: 'title' | 'estimatedDuration'): string {
  if (slug === 'magicLetterMap') {
    return `games.interactiveHandbook.handbooks.magicLetterMap.cover.${field}`;
  }
  return `handbooks.${slug}.meta.${field}`;
}

function parentHandbookKey(slug: HandbookSlug, field: 'progressSummary' | 'nextStep'): string {
  if (slug === 'magicLetterMap') {
    return `parentDashboard.games.interactiveHandbook.${field}`;
  }
  return `parentDashboard.handbooks.${slug}.${field}`;
}

function keyToAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function handbookIntroAudioKey(slug: HandbookSlug): string {
  if (slug === 'mikaSoundGarden' || slug === 'yoavLetterMap' || slug === 'tamarWordTower') {
    return `handbooks.${slug}.pages.page01.narration`;
  }

  if (slug === 'magicLetterMap') {
    return 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p01.narration';
  }
  return `handbooks.${slug}.scriptPackage.narration.intro`;
}

function handbookCompletionTitleKey(slug: HandbookSlug): string {
  if (slug === 'mikaSoundGarden' || slug === 'yoavLetterMap' || slug === 'tamarWordTower') {
    return `handbooks.${slug}.chapterRecap.title`;
  }

  if (slug === 'magicLetterMap') {
    return 'games.interactiveHandbook.handbooks.magicLetterMap.completion.title';
  }
  return `handbooks.${slug}.scriptPackage.narration.outro`;
}

function handbookCompletionNextStepKey(slug: HandbookSlug): string {
  if (slug === 'mikaSoundGarden' || slug === 'yoavLetterMap' || slug === 'tamarWordTower') {
    return `handbooks.${slug}.chapterRecap.nextStep`;
  }

  if (slug === 'magicLetterMap') {
    return 'games.interactiveHandbook.handbooks.magicLetterMap.completion.nextStep';
  }
  return parentHandbookKey(slug, 'nextStep');
}

function normalizePageCompletion(raw: unknown): Record<string, InteractiveHandbookPageProgress> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const normalized: Record<string, InteractiveHandbookPageProgress> = {};

  Object.entries(raw as Record<string, unknown>).forEach(([pageId, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    const status = value as Record<string, unknown>;
    normalized[pageId] = {
      visited: Boolean(status.visited),
      solved: Boolean(status.solved),
    };
  });

  return normalized;
}

function normalizeHydratedProgress(row: HydratedProgressRow | null): InteractiveHandbookProgressSnapshot | null {
  if (!row) {
    return null;
  }

  const furthestPageNumber = Number.isFinite(row.furthest_page_number)
    ? Math.max(1, Math.floor(row.furthest_page_number))
    : 1;

  return {
    furthestPageNumber,
    completed: Boolean(row.completed),
    pageCompletion: normalizePageCompletion(row.page_completion_json),
  };
}

function toPageCompletionJson(snapshot: InteractiveHandbookProgressSnapshot): Json {
  const json: { [key: string]: Json } = {};

  Object.entries(snapshot.pageCompletion).forEach(([pageId, status]) => {
    json[pageId] = {
      visited: Boolean(status?.visited),
      solved: Boolean(status?.solved),
    };
  });

  return json;
}

function normalizePreloadManifestPath(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizePreloadManifest(raw: unknown): HandbookPreloadManifest | null {
  if (!isRecord(raw)) {
    return null;
  }

  const critical = Array.isArray(raw.critical)
    ? raw.critical
        .map((path) => normalizePreloadManifestPath(path))
        .filter((path): path is string => Boolean(path))
    : [];

  const pageMap = isRecord(raw.pages) ? raw.pages : null;
  const pages: Record<string, string[]> = {};

  if (pageMap) {
    Object.entries(pageMap).forEach(([pageId, assets]) => {
      if (!Array.isArray(assets)) {
        return;
      }

      const normalizedAssets = assets
        .map((assetPath) => normalizePreloadManifestPath(assetPath))
        .filter((assetPath): assetPath is string => Boolean(assetPath));

      if (normalizedAssets.length > 0) {
        pages[pageId] = normalizedAssets;
      }
    });
  }

  const version = typeof raw.version === 'number' && Number.isFinite(raw.version) ? raw.version : undefined;
  if (critical.length === 0 && Object.keys(pages).length === 0) {
    return null;
  }

  return {
    version,
    critical,
    pages,
  };
}

export default function InteractiveHandbookPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = activeProfile?.ageBand;
  const persistableChildId = activeProfile?.id && activeProfile.id !== 'guest' ? activeProfile.id : null;

  const child = useMemo<Child>(
    () => ({
      id: activeProfile?.id ?? 'guest',
      familyId: activeProfile?.id ?? 'guest-family',
      name: activeProfile?.name ?? t('profile.guestName'),
      avatar: activeProfile?.emoji ?? '🧒',
      theme: 'bear',
      birthDate: null,
      createdAt: '2026-04-10T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const baseLevelConfig = BASE_INTERACTIVE_HANDBOOK_LEVEL.configJson as Record<string, unknown>;
  const recommendedLadderBookId = useMemo(
    () => resolveActiveLadderBookId(baseLevelConfig, profileAgeBand),
    [baseLevelConfig, profileAgeBand],
  );
  const [selectedLadderBookId, setSelectedLadderBookId] = useState<LadderBookId>(recommendedLadderBookId);
  const bookshelfBooks = useMemo(
    () =>
      BOOK_SHELF_ORDER.map((bookId) => ({
        bookId,
        handbookSlug: resolveHandbookSlug(baseLevelConfig, bookId),
      })),
    [baseLevelConfig],
  );

  useEffect(() => {
    setSelectedLadderBookId(recommendedLadderBookId);
  }, [recommendedLadderBookId]);

  const activeHandbookSlug = useMemo(
    () => resolveHandbookSlug(baseLevelConfig, selectedLadderBookId),
    [baseLevelConfig, selectedLadderBookId],
  );
  const activeDisplaySlug = useMemo<HandbookSlug>(
    () => resolveStoryDepthSlug(selectedLadderBookId, activeHandbookSlug) ?? activeHandbookSlug,
    [activeHandbookSlug, selectedLadderBookId],
  );

  const runtimeGame = useMemo<Game>(
    () => ({
      ...BASE_INTERACTIVE_HANDBOOK_GAME,
      audioUrl: keyToAudioPath(handbookIntroAudioKey(activeDisplaySlug)),
    }),
    [activeDisplaySlug],
  );

  const runtimeLevel = useMemo<GameLevel>(() => {
    const baseReadingLadder = isRecord(baseLevelConfig.readingLadder) ? baseLevelConfig.readingLadder : {};
    const defaultBand = toLadderAgeBand(profileAgeBand) ?? toLadderAgeBand(baseLevelConfig.defaultBand) ?? '5-6';

    return {
      ...BASE_INTERACTIVE_HANDBOOK_LEVEL,
      configJson: {
        ...baseLevelConfig,
        pages: BOOK_TO_PAGE_COUNT[selectedLadderBookId] ?? baseLevelConfig.pages,
        defaultBand,
        handbookSlug: activeHandbookSlug,
        readingLadder: {
          ...baseReadingLadder,
          activeBook: selectedLadderBookId,
        },
      } as Record<string, unknown>,
    };
  }, [activeHandbookSlug, baseLevelConfig, profileAgeBand, selectedLadderBookId]);

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [replayFromStart, setReplayFromStart] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [handbookId, setHandbookId] = useState<string | null>(null);
  const [preloadManifest, setPreloadManifest] = useState<HandbookPreloadManifest | null>(null);
  const [runtimeContent, setRuntimeContent] = useState<HandbookRuntimeContent | null>(null);
  const [isHydratingProgress, setIsHydratingProgress] = useState(false);
  const [initialProgress, setInitialProgress] = useState<InteractiveHandbookProgressSnapshot | null>(null);

  const pendingProgressRef = useRef<InteractiveHandbookProgressSnapshot | null>(null);
  const hasLocalProgressRef = useRef(false);
  const isSyncingRef = useRef(false);
  const retryAttemptRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  const loadSupabase = useCallback(async () => {
    const module = await import('@/lib/supabase');
    return module.supabase;
  }, []);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = null;
  }, []);

  const flushProgress = useCallback(async () => {
    if (isSyncingRef.current || !pendingProgressRef.current) {
      return;
    }

    if (!isSupabaseConfigured || !persistableChildId) {
      pendingProgressRef.current = null;
      setSyncState('idle');
      return;
    }

    if (!handbookId) {
      setSyncState('syncing');
      return;
    }

    const supabase = await loadSupabase();
    const snapshot = pendingProgressRef.current;
    if (!snapshot) {
      return;
    }

    pendingProgressRef.current = null;
    isSyncingRef.current = true;

    const furthestPageNumber = Math.max(1, Math.floor(snapshot.furthestPageNumber));

    const { error } = await supabase.from('child_handbook_progress').upsert(
      {
        child_id: persistableChildId,
        handbook_id: handbookId,
        furthest_page_number: furthestPageNumber,
        completed: snapshot.completed,
        page_completion_json: toPageCompletionJson(snapshot),
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,handbook_id' },
    );

    isSyncingRef.current = false;

    if (error) {
      pendingProgressRef.current = pendingProgressRef.current ?? snapshot;
      retryAttemptRef.current += 1;

      const retryDelayMs = Math.min(MAX_SYNC_BACKOFF_MS, 400 * 2 ** (retryAttemptRef.current - 1));
      clearRetryTimeout();
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        void flushProgress();
      }, retryDelayMs);

      setSyncState('syncing');
      return;
    }

    retryAttemptRef.current = 0;
    setSyncState('synced');

    if (pendingProgressRef.current) {
      void flushProgress();
    }
  }, [clearRetryTimeout, handbookId, loadSupabase, persistableChildId]);

  useEffect(() => {
    if (!handbookId || !pendingProgressRef.current) {
      return;
    }

    void flushProgress();
  }, [flushProgress, handbookId]);

  useEffect(() => {
    return () => {
      clearRetryTimeout();
    };
  }, [clearRetryTimeout]);

  useEffect(() => {
    setCompletionResult(null);
    setReplayFromStart(false);
    hasLocalProgressRef.current = false;
    setSessionVersion((current) => current + 1);
  }, [activeHandbookSlug, persistableChildId]);

  useEffect(() => {
    let cancelled = false;

    clearRetryTimeout();
    pendingProgressRef.current = null;
    isSyncingRef.current = false;
    retryAttemptRef.current = 0;
    setSyncState('idle');

    if (!isSupabaseConfigured) {
      setHandbookId(null);
      setPreloadManifest(null);
      setRuntimeContent(null);
      setInitialProgress(null);
      setIsHydratingProgress(false);
      return;
    }

    const childId = persistableChildId;
    setIsHydratingProgress(Boolean(childId));

    async function hydrate() {
      const supabase = await loadSupabase();
      if (cancelled) {
        return;
      }

      const { data: handbook, error: handbookError } = await supabase
        .from('handbooks')
        .select('id, preload_manifest_json')
        .eq('slug', activeHandbookSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (handbookError || !handbook?.id) {
        setHandbookId(null);
        setPreloadManifest(null);
        setRuntimeContent(null);
        setInitialProgress(null);
        setIsHydratingProgress(false);
        return;
      }

      const hydratedHandbook = handbook as HydratedHandbookRow;
      setHandbookId(hydratedHandbook.id);
      setPreloadManifest(normalizePreloadManifest(hydratedHandbook.preload_manifest_json));

      const [handbookPagesResponse, handbookMediaAssetsResponse] = await Promise.all([
        supabase
          .from('handbook_pages')
          .select('page_number, layout_kind, blocks_json, interactions_json, narration_key, estimated_read_sec')
          .eq('handbook_id', handbook.id)
          .order('page_number', { ascending: true }),
        supabase
          .from('handbook_media_assets')
          .select('id, storage_path, sort_order')
          .eq('handbook_id', handbook.id)
          .order('sort_order', { ascending: true })
          .order('storage_path', { ascending: true }),
      ]);

      if (cancelled) {
        return;
      }

      if (handbookPagesResponse.error) {
        setRuntimeContent(null);
      } else {
        setRuntimeContent(
          normalizeHandbookRuntimeContent({
            pages: (handbookPagesResponse.data as HandbookRuntimePageRow[] | null) ?? [],
            mediaAssets: handbookMediaAssetsResponse.error
              ? []
              : (handbookMediaAssetsResponse.data as HandbookRuntimeMediaAssetRow[] | null) ?? [],
          }),
        );
      }

      if (!childId) {
        setInitialProgress(null);
        setIsHydratingProgress(false);
        return;
      }

      const { data: progress } = await supabase
        .from('child_handbook_progress')
        .select('furthest_page_number, completed, page_completion_json')
        .eq('child_id', childId)
        .eq('handbook_id', handbook.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      const hydratedProgress = normalizeHydratedProgress((progress as HydratedProgressRow | null) ?? null);
      if (!hasLocalProgressRef.current) {
        setInitialProgress(hydratedProgress);
        setSessionVersion((current) => current + 1);
      }
      setIsHydratingProgress(false);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [activeHandbookSlug, clearRetryTimeout, loadSupabase, persistableChildId]);

  const effectiveInitialProgress = useMemo<InteractiveHandbookProgressSnapshot | null>(() => {
    if (!replayFromStart) {
      return initialProgress;
    }

    return {
      furthestPageNumber: 1,
      completed: false,
      pageCompletion: {},
    };
  }, [initialProgress, replayFromStart]);

  const handleSelectBook = useCallback(
    (bookId: LadderBookId) => {
      const selectedSlug = resolveHandbookSlug(baseLevelConfig, bookId);
      const selectedDisplaySlug = resolveStoryDepthSlug(bookId, selectedSlug) ?? selectedSlug;
      setSelectedLadderBookId(bookId);
      setReplayFromStart(false);
      void audio.playNow(keyToAudioPath(handbookMetaKey(selectedDisplaySlug, 'title')));
    },
    [audio, baseLevelConfig],
  );

  const handleProgressChange = useCallback(
    (snapshot: InteractiveHandbookProgressSnapshot) => {
      if (replayFromStart) {
        setReplayFromStart(false);
      }

      hasLocalProgressRef.current = true;

      if (!isSupabaseConfigured || !persistableChildId) {
        return;
      }

      pendingProgressRef.current = snapshot;
      setSyncState('syncing');
      if (handbookId) {
        void flushProgress();
      }
    },
    [flushProgress, handbookId, persistableChildId, replayFromStart],
  );

  const handleComplete = useCallback(
    (result: GameCompletionResult) => {
      setCompletionResult(result);
      void audio.playNow(keyToAudioPath(handbookCompletionTitleKey(activeDisplaySlug)));

      if (!isSupabaseConfigured || !persistableChildId || !handbookId) {
        setSyncState('synced');
      }
    },
    [activeDisplaySlug, audio, handbookId, persistableChildId],
  );

  const handleReplayBook = useCallback(() => {
    const resetSnapshot: InteractiveHandbookProgressSnapshot = {
      furthestPageNumber: 1,
      completed: false,
      pageCompletion: {},
    };

    setCompletionResult(null);
    setReplayFromStart(true);
    setSessionVersion((current) => current + 1);
    pendingProgressRef.current = resetSnapshot;

    if (isSupabaseConfigured && persistableChildId && handbookId) {
      setSyncState('syncing');
      void flushProgress();
    } else {
      setSyncState('idle');
    }

    void audio.playNow(keyToAudioPath('games.interactiveHandbook.controls.retry'));
  }, [audio, flushProgress, handbookId, persistableChildId]);

  const handleBackToGames = useCallback(() => {
    void audio.playNow(keyToAudioPath('nav.back'));
    navigate('/games');
  }, [audio, navigate]);

  const handleBackHome = useCallback(() => {
    void audio.playNow(keyToAudioPath('nav.home'));
    navigate('/games');
  }, [audio, navigate]);

  const hasBookshelf = bookshelfBooks.length > 1;
  const selectedBookshelfIndex = useMemo(
    () => bookshelfBooks.findIndex((book) => book.bookId === selectedLadderBookId),
    [bookshelfBooks, selectedLadderBookId],
  );
  const featuredBookshelfBook = useMemo(
    () => (selectedBookshelfIndex >= 0 ? bookshelfBooks[selectedBookshelfIndex] : (bookshelfBooks[0] ?? null)),
    [bookshelfBooks, selectedBookshelfIndex],
  );
  const adjacentBookshelfBooks = useMemo(() => {
    if (!featuredBookshelfBook) {
      return [];
    }

    const originIndex = selectedBookshelfIndex >= 0 ? selectedBookshelfIndex : 0;
    const neighborIndexes: number[] = [];
    let offset = 1;

    while (neighborIndexes.length < 2 && (originIndex - offset >= 0 || originIndex + offset < bookshelfBooks.length)) {
      if (originIndex - offset >= 0) {
        neighborIndexes.push(originIndex - offset);
      }
      if (neighborIndexes.length >= 2) {
        break;
      }
      if (originIndex + offset < bookshelfBooks.length) {
        neighborIndexes.push(originIndex + offset);
      }
      offset += 1;
    }

    return neighborIndexes
      .slice(0, 2)
      .map((index) => bookshelfBooks[index])
      .filter((book): book is (typeof bookshelfBooks)[number] => Boolean(book));
  }, [bookshelfBooks, featuredBookshelfBook, selectedBookshelfIndex]);

  const showCelebrationScreen = Boolean(completionResult);
  // Wait for `child_handbook_progress` hydration before mounting the reader for a real child profile.
  // Otherwise the game emits a default page-1 progress snapshot first, `hasLocalProgressRef` latches,
  // and the hydrated DB snapshot is skipped (reload appears to lose furthest page). See DUB-660.
  const shouldDeferHandbookGameForProgressHydration = Boolean(persistableChildId) && isHydratingProgress;
  const gameInstanceKey = `${activeHandbookSlug}-${sessionVersion}`;
  const completionTitle = t(handbookCompletionTitleKey(activeDisplaySlug) as any);
  const completionNextStep = t(handbookCompletionNextStepKey(activeDisplaySlug) as any);
  const gameLoadingFallback = (
    <Card
      padding="lg"
      style={{
        minHeight: '340px',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        {t('handbooks.reader.status.loading')}
      </p>
    </Card>
  );

  return (
    <ChildRouteScaffold
      width="wide"
      mainStyle={{
        background:
          'radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--color-theme-secondary) 24%, transparent), transparent 42%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 92%, white 8%) 100%)',
      }}
    >
      <ChildRouteHeader
        title={t(handbookMetaKey(activeDisplaySlug, 'title') as any)}
        subtitle={t(handbookMetaKey(activeDisplaySlug, 'estimatedDuration') as any)}
        headingStyle={{ gap: 'var(--space-2xs)' }}
      />

        {hasBookshelf && featuredBookshelfBook && (
          <Card
            padding="md"
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              border: '2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent)',
              background:
                'linear-gradient(155deg, color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%), var(--color-bg-card))',
            }}
          >
            <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
              <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
                {t('handbooks.library.title')}
              </h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('handbooks.library.subtitle')}</p>
            </div>

            <div className="interactive-handbook__bookshelf-stage">
              <button
                type="button"
                className={[
                  'interactive-handbook__bookshelf-choice',
                  'interactive-handbook__bookshelf-choice--featured',
                  `interactive-handbook__bookshelf-choice--${featuredBookshelfBook.bookId}`,
                  selectedLadderBookId === featuredBookshelfBook.bookId
                    ? 'interactive-handbook__bookshelf-choice--selected'
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectBook(featuredBookshelfBook.bookId)}
                aria-pressed={selectedLadderBookId === featuredBookshelfBook.bookId}
                aria-label={t(`games.interactiveHandbook.ladderBooks.${featuredBookshelfBook.bookId}` as any)}
              >
                <span className="interactive-handbook__bookshelf-cover" aria-hidden="true">
                  {BOOK_ICON_BY_ID[featuredBookshelfBook.bookId]}
                </span>
                <span className="interactive-handbook__bookshelf-title">
                  {t(`games.interactiveHandbook.ladderBooks.${featuredBookshelfBook.bookId}` as any)}
                </span>
                <span className="interactive-handbook__bookshelf-duration">
                  {t(
                    handbookMetaKey(
                      resolveStoryDepthSlug(featuredBookshelfBook.bookId, featuredBookshelfBook.handbookSlug) ??
                        featuredBookshelfBook.handbookSlug,
                      'estimatedDuration',
                    ) as any,
                  )}
                </span>
              </button>

              {adjacentBookshelfBooks.length > 0 && (
                <div className="interactive-handbook__bookshelf-neighbors">
                  {adjacentBookshelfBooks.map((book) => {
                    const isSelected = selectedLadderBookId === book.bookId;
                    return (
                      <button
                        key={book.bookId}
                        type="button"
                        className={[
                          'interactive-handbook__bookshelf-choice',
                          `interactive-handbook__bookshelf-choice--${book.bookId}`,
                          isSelected ? 'interactive-handbook__bookshelf-choice--selected' : null,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => handleSelectBook(book.bookId)}
                        aria-pressed={isSelected}
                        aria-label={t(`games.interactiveHandbook.ladderBooks.${book.bookId}` as any)}
                      >
                        <span className="interactive-handbook__bookshelf-icon" aria-hidden="true">
                          {BOOK_ICON_BY_ID[book.bookId]}
                        </span>
                        <span className="interactive-handbook__bookshelf-title">
                          {t(`games.interactiveHandbook.ladderBooks.${book.bookId}` as any)}
                        </span>
                        <span className="interactive-handbook__bookshelf-duration">
                          {t(handbookMetaKey(resolveStoryDepthSlug(book.bookId, book.handbookSlug) ?? book.handbookSlug, 'estimatedDuration') as any)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {showCelebrationScreen ? (
          <Card padding="lg" className="interactive-handbook__celebration-card">
            <div className="interactive-handbook__celebration-layer" aria-hidden="true">
              <SuccessCelebration />
            </div>

            <div className="interactive-handbook__celebration-content">
              <div className="interactive-handbook__celebration-stars" aria-hidden="true">
                <span>⭐</span>
                <span>⭐</span>
                <span>⭐</span>
              </div>

              <h2 className="interactive-handbook__celebration-title">
                {t('games.interactiveHandbook.instructions.completion')}
              </h2>
              <p className="interactive-handbook__celebration-line">{completionTitle}</p>

              {completionResult?.summaryMetrics && (
                <p className="interactive-handbook__celebration-line">
                  {t(parentHandbookKey(activeDisplaySlug, 'progressSummary') as any, {
                    successRate: completionResult.summaryMetrics.firstAttemptSuccessRate,
                    pagesVisited: completionResult.roundsCompleted ?? 0,
                  })}
                </p>
              )}

              {completionResult?.readingGate && (
                <p className="interactive-handbook__celebration-line">
                  {completionResult.readingGate.nextBookId
                    ? t('games.interactiveHandbook.gates.nextBookReady', {
                        nextBook: t(`games.interactiveHandbook.ladderBooks.${completionResult.readingGate.nextBookId}` as any),
                      })
                    : t('games.interactiveHandbook.gates.replayCurrentBook')}
                </p>
              )}

              <p className="interactive-handbook__celebration-line">
                {syncState === 'syncing' ? t('feedback.keepGoing') : completionNextStep}
              </p>

              <div className="interactive-handbook__celebration-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleReplayBook}
                  aria-label={t('games.interactiveHandbook.controls.retry')}
                >
                  {t('games.interactiveHandbook.controls.retry')}
                </Button>
                <Button variant="secondary" size="lg" onClick={handleBackHome} aria-label={t('nav.home')}>
                  {t('nav.home')}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {shouldDeferHandbookGameForProgressHydration ? (
              gameLoadingFallback
            ) : (
              <Suspense fallback={gameLoadingFallback}>
                <LazyInteractiveHandbookGame
                  key={gameInstanceKey}
                  game={runtimeGame}
                  level={runtimeLevel}
                  child={child}
                  onComplete={handleComplete}
                  audio={audio}
                  initialProgress={effectiveInitialProgress}
                  onProgressChange={handleProgressChange}
                  preloadManifest={preloadManifest}
                  runtimeContent={runtimeContent}
                  onRequestBack={handleBackToGames}
                />
              </Suspense>
            )}

            {isHydratingProgress ? (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {t('handbooks.reader.status.loading')}
              </p>
            ) : null}
          </>
        )}

      <style>{`
          .interactive-handbook__bookshelf-stage {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.85fr);
            align-items: stretch;
            gap: var(--space-sm);
          }

          .interactive-handbook__bookshelf-neighbors {
            display: grid;
            gap: var(--space-sm);
            align-content: stretch;
          }

          .interactive-handbook__bookshelf-choice {
            appearance: none;
            border: 2px solid transparent;
            border-radius: 16px 20px 20px 16px;
            min-block-size: 130px;
            padding-block: var(--space-sm);
            padding-inline: var(--space-sm);
            padding-inline-start: calc(var(--space-sm) + 12px);
            display: grid;
            gap: var(--space-xs);
            align-content: start;
            text-align: start;
            box-shadow: var(--shadow-sm);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            isolation: isolate;
            background: var(--color-surface);
            transition:
              transform var(--motion-duration-fast) var(--motion-ease-standard),
              box-shadow var(--motion-duration-fast) var(--motion-ease-standard),
              border-color var(--motion-duration-fast) var(--motion-ease-standard);
          }

          .interactive-handbook__bookshelf-choice--featured {
            min-block-size: 208px;
            gap: var(--space-sm);
          }

          .interactive-handbook__bookshelf-choice::before {
            content: '';
            position: absolute;
            inset-block: 0;
            inset-inline-start: 0;
            inline-size: 10px;
            background:
              linear-gradient(
                180deg,
                color-mix(in srgb, var(--color-text-primary) 28%, transparent),
                color-mix(in srgb, var(--color-text-primary) 10%, transparent)
              );
            border-inline-end: 1px solid color-mix(in srgb, var(--color-text-primary) 18%, transparent);
            opacity: 0.85;
            pointer-events: none;
          }

          .interactive-handbook__bookshelf-choice::after {
            content: '';
            position: absolute;
            inset-block: 0;
            inset-inline-end: 0;
            inline-size: 42%;
            background: linear-gradient(110deg, color-mix(in srgb, white 42%, transparent), transparent 62%);
            opacity: 0.4;
            pointer-events: none;
          }

          .interactive-handbook__bookshelf-choice > * {
            position: relative;
            z-index: 1;
          }

          .interactive-handbook__bookshelf-choice:focus-visible {
            outline: 3px solid color-mix(in srgb, var(--color-theme-primary) 45%, white 55%);
            outline-offset: 2px;
          }

          .interactive-handbook__bookshelf-choice:hover {
            transform: translateY(-2px) rotateZ(-0.35deg);
            box-shadow: var(--shadow-md);
          }

          .interactive-handbook__bookshelf-choice:active {
            transform: translateY(1px) scale(0.99);
          }

          .interactive-handbook__bookshelf-choice--selected {
            border-color: color-mix(in srgb, var(--color-theme-primary) 70%, white 30%);
            box-shadow: var(--shadow-md);
            transform: translateY(-2px) rotateZ(-0.2deg);
          }

          .interactive-handbook__bookshelf-choice--book1 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-accent-success) 24%, var(--color-bg-card) 76%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book4 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-theme-primary) 24%, var(--color-bg-card) 76%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book5 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-accent-warning) 18%, var(--color-theme-primary) 12%, var(--color-bg-card) 70%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book7 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-accent-info) 24%, var(--color-bg-card) 76%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book8 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-theme-primary) 18%, var(--color-accent-info) 14%, var(--color-bg-card) 68%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book10 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-accent-secondary) 24%, var(--color-bg-card) 76%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-choice--book9 {
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--color-accent-warning) 24%, var(--color-bg-card) 76%), color-mix(in srgb, var(--color-bg-card) 90%, white 10%));
          }

          .interactive-handbook__bookshelf-cover {
            inline-size: 100%;
            min-block-size: 112px;
            border-radius: var(--radius-lg);
            display: grid;
            place-items: center;
            font-size: clamp(2.2rem, 2rem + 1.2vw, 3rem);
            background:
              radial-gradient(circle at 24% 28%, color-mix(in srgb, white 55%, transparent), transparent 46%),
              color-mix(in srgb, var(--color-bg-card) 76%, white 24%);
          }

          .interactive-handbook__bookshelf-icon {
            inline-size: 48px;
            block-size: 48px;
            border-radius: var(--radius-full);
            display: grid;
            place-items: center;
            font-size: 1.45rem;
            background: color-mix(in srgb, white 70%, transparent);
          }

          .interactive-handbook__bookshelf-title {
            color: var(--color-text-primary);
            font-size: var(--font-size-md);
            font-weight: var(--font-weight-bold);
          }

          .interactive-handbook__bookshelf-choice--featured .interactive-handbook__bookshelf-title {
            font-size: var(--font-size-lg);
          }

          .interactive-handbook__bookshelf-duration {
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
          }

          .interactive-handbook__celebration-card {
            position: relative;
            overflow: hidden;
            border: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
            background:
              radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--color-theme-secondary) 28%, transparent), transparent 42%),
              linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%), var(--color-bg-card));
          }

          .interactive-handbook__celebration-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.9;
          }

          .interactive-handbook__celebration-content {
            position: relative;
            z-index: 1;
            display: grid;
            gap: var(--space-sm);
            justify-items: center;
            text-align: center;
          }

          .interactive-handbook__celebration-stars {
            display: inline-flex;
            gap: var(--space-xs);
            font-size: 1.35rem;
            animation: interactive-handbook-stars 680ms var(--motion-ease-bounce) both;
          }

          .interactive-handbook__celebration-title {
            margin: 0;
            color: var(--color-text-primary);
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-extrabold);
          }

          .interactive-handbook__celebration-line {
            margin: 0;
            color: var(--color-text-secondary);
            max-inline-size: 720px;
          }

          .interactive-handbook__celebration-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--space-sm);
            inline-size: 100%;
          }

          .interactive-handbook__celebration-actions > * {
            min-inline-size: 188px;
          }

          @keyframes interactive-handbook-stars {
            from {
              transform: translateY(8px) scale(0.9);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }

          @media (max-width: 900px) {
            .interactive-handbook__bookshelf-stage {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .interactive-handbook__bookshelf-neighbors {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .interactive-handbook__celebration-actions > * {
              min-inline-size: 100%;
            }
          }

          @media (max-width: 540px) {
            .interactive-handbook__bookshelf-neighbors {
              grid-template-columns: 1fr;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .interactive-handbook__bookshelf-choice,
            .interactive-handbook__celebration-stars {
              animation: none;
              transition: none;
            }
          }
      `}</style>
    </ChildRouteScaffold>
  );
}
