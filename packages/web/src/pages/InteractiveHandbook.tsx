import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel, Json } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import {
  InteractiveHandbookGame,
  type InteractiveHandbookPageProgress,
  type InteractiveHandbookProgressSnapshot,
} from '@/games/reading/InteractiveHandbookGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type SyncState = 'idle' | 'syncing' | 'synced';

interface HydratedProgressRow {
  furthest_page_number: number;
  completed: boolean;
  page_completion_json: unknown;
}

const HANDBOOK_SLUG = 'gardenOfSurprises';
const MAX_SYNC_BACKOFF_MS = 4000;

const INTERACTIVE_HANDBOOK_GAME: Game = {
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
  audioUrl: '/audio/he/games/interactive-handbook/handbooks/garden-of-surprises/pages/p01/narration.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const INTERACTIVE_HANDBOOK_LEVEL: GameLevel = {
  id: 'local-interactive-handbook-level-1',
  gameId: INTERACTIVE_HANDBOOK_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    pages: 12,
    defaultBand: '5-6',
    handbookSlug: HANDBOOK_SLUG,
  },
  sortOrder: 1,
};

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

export default function InteractiveHandbookPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
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

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [handbookId, setHandbookId] = useState<string | null>(null);
  const [isHydratingProgress, setIsHydratingProgress] = useState(false);
  const [initialProgress, setInitialProgress] = useState<InteractiveHandbookProgressSnapshot | null>(null);

  const pendingProgressRef = useRef<InteractiveHandbookProgressSnapshot | null>(null);
  const isSyncingRef = useRef(false);
  const retryAttemptRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

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

    if (!isSupabaseConfigured || !persistableChildId || !handbookId) {
      pendingProgressRef.current = null;
      setSyncState('idle');
      return;
    }

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
  }, [clearRetryTimeout, handbookId, persistableChildId]);

  useEffect(() => {
    return () => {
      clearRetryTimeout();
    };
  }, [clearRetryTimeout]);

  useEffect(() => {
    let cancelled = false;

    clearRetryTimeout();
    pendingProgressRef.current = null;
    isSyncingRef.current = false;
    retryAttemptRef.current = 0;
    setSyncState('idle');

    if (!isSupabaseConfigured || !persistableChildId) {
      setHandbookId(null);
      setInitialProgress(null);
      setIsHydratingProgress(false);
      return;
    }

    const childId = persistableChildId;
    setIsHydratingProgress(true);

    async function hydrate() {
      const { data: handbook, error: handbookError } = await supabase
        .from('handbooks')
        .select('id')
        .eq('slug', HANDBOOK_SLUG)
        .eq('is_published', true)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (handbookError || !handbook?.id) {
        setHandbookId(null);
        setInitialProgress(null);
        setIsHydratingProgress(false);
        return;
      }

      setHandbookId(handbook.id);

      const { data: progress } = await supabase
        .from('child_handbook_progress')
        .select('furthest_page_number, completed, page_completion_json')
        .eq('child_id', childId)
        .eq('handbook_id', handbook.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      setInitialProgress(normalizeHydratedProgress((progress as HydratedProgressRow | null) ?? null));
      setIsHydratingProgress(false);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [clearRetryTimeout, persistableChildId]);

  const handleProgressChange = useCallback(
    (snapshot: InteractiveHandbookProgressSnapshot) => {
      if (!isSupabaseConfigured || !persistableChildId || !handbookId) {
        return;
      }

      pendingProgressRef.current = snapshot;
      setSyncState('syncing');
      void flushProgress();
    },
    [flushProgress, handbookId, persistableChildId],
  );

  const handleComplete = useCallback(
    (result: GameCompletionResult) => {
      setCompletionResult(result);

      if (!isSupabaseConfigured || !persistableChildId || !handbookId) {
        setSyncState('synced');
      }
    },
    [handbookId, persistableChildId],
  );

  return (
    <main
      style={{
        flex: 1,
        background:
          'radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--color-theme-secondary) 24%, transparent), transparent 42%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 92%, white 8%) 100%)',
        padding: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1180px, 100%)', display: 'grid', gap: 'var(--space-md)' }}>
        <header
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.interactiveHandbook.handbooks.gardenOfSurprises.cover.title')}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('games.interactiveHandbook.handbooks.gardenOfSurprises.cover.estimatedDuration')}
            </p>
          </div>

          <Button variant="secondary" size="lg" onClick={() => navigate('/home')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        {isHydratingProgress ? (
          <Card padding="md" style={{ minHeight: '180px', display: 'grid', placeItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('games.interactiveHandbook.status.loading')}
            </p>
          </Card>
        ) : (
          <InteractiveHandbookGame
            game={INTERACTIVE_HANDBOOK_GAME}
            level={INTERACTIVE_HANDBOOK_LEVEL}
            child={child}
            onComplete={handleComplete}
            audio={audio}
            initialProgress={initialProgress}
            onProgressChange={handleProgressChange}
          />
        )}

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.interactiveHandbook.progressSummary', {
                successRate: completionResult.summaryMetrics.firstAttemptSuccessRate,
                pagesVisited: completionResult.roundsCompleted ?? 0,
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
