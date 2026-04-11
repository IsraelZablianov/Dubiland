import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { NikudSoundLadderGame } from '@/games/reading/NikudSoundLadderGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { createGameAttemptId, createGameSessionId, persistGameAttempt } from '@/lib/gameAttemptPersistence';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

const NIKUD_SOUND_LADDER_GAME: Game = {
  id: 'local-nikud-sound-ladder',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'nikudSoundLadder',
  nameKey: 'games.nikudSoundLadder.title',
  descriptionKey: 'games.nikudSoundLadder.subtitle',
  gameType: 'nikud_match_blend',
  componentKey: 'NikudSoundLadderGame',
  difficulty: 3,
  sortOrder: 6,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/nikud-sound-ladder/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const NIKUD_SOUND_LADDER_LEVEL: GameLevel = {
  id: 'local-nikud-sound-ladder-level-1',
  gameId: NIKUD_SOUND_LADDER_GAME.id,
  levelNumber: 3,
  configJson: {
    adaptive: true,
    rounds: 11,
  },
  sortOrder: 1,
};

export default function NikudSoundLadderPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = toChildAgeBand(activeProfile?.ageBand) ?? undefined;

  const child = useMemo<Child>(
    () => ({
      id: activeProfile?.id ?? 'guest',
      familyId: 'local-family',
      name: activeProfile?.name ?? t('profile.guestName'),
      avatar: activeProfile?.emoji ?? '🧒',
      theme: 'bear',
      birthDate: null,
      createdAt: '2026-04-11T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...NIKUD_SOUND_LADDER_LEVEL,
      configJson: {
        ...(NIKUD_SOUND_LADDER_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const sessionStartedAtMsRef = useRef<number>(Date.now());
  const clientSessionIdRef = useRef<string>(createGameSessionId());
  const attemptIndexRef = useRef(0);
  const pendingAttemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionStartedAtMsRef.current = Date.now();
    clientSessionIdRef.current = createGameSessionId();
    attemptIndexRef.current = 0;
    pendingAttemptIdRef.current = null;
    setCompletionResult(null);
    setSyncState('idle');
  }, [child.id]);

  const syncCompletion = useCallback(
    async (result: GameCompletionResult, attemptIndex: number, attemptId: string) => {
      const persistOutcome = await persistGameAttempt({
        childId: child.id,
        childAgeBand: activeProfile?.ageBand,
        game: NIKUD_SOUND_LADDER_GAME,
        level: runtimeLevel,
        completion: result,
        clientSessionId: clientSessionIdRef.current,
        startedAt: new Date(sessionStartedAtMsRef.current).toISOString(),
        durationMs: Math.max(0, Date.now() - sessionStartedAtMsRef.current),
        attemptIndex,
        attemptId,
      });

      if (persistOutcome.status === 'failed') {
        setSyncState('error');
        return;
      }

      pendingAttemptIdRef.current = null;
      setSyncState('synced');
    },
    [activeProfile?.ageBand, child.id, runtimeLevel],
  );

  const handleComplete = useCallback(
    (result: GameCompletionResult) => {
      setCompletionResult(result);
      setSyncState('syncing');
      attemptIndexRef.current += 1;
      const attemptId = createGameAttemptId();
      pendingAttemptIdRef.current = attemptId;
      void syncCompletion(result, attemptIndexRef.current, attemptId);
    },
    [syncCompletion],
  );

  const handleRetrySync = useCallback(() => {
    if (!completionResult) {
      return;
    }

    const attemptId = pendingAttemptIdRef.current ?? createGameAttemptId();
    pendingAttemptIdRef.current = attemptId;
    setSyncState('syncing');
    void syncCompletion(completionResult, attemptIndexRef.current, attemptId);
  }, [completionResult, syncCompletion]);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.nikudSoundLadder.title')}
        subtitle={t('games.nikudSoundLadder.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <NikudSoundLadderGame game={NIKUD_SOUND_LADDER_GAME} level={runtimeLevel} child={child} onComplete={handleComplete} audio={audio} />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.nikudSoundLadder.progressSummary', {
              successRate: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
              hintTrend: t(
                completionResult.summaryMetrics.hintTrend === 'improving'
                  ? 'feedback.excellent'
                  : completionResult.summaryMetrics.hintTrend === 'steady'
                    ? 'feedback.keepGoing'
                    : 'feedback.greatEffort',
              ),
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.nikudSoundLadder.nextStep')}
          </p>
          {syncState === 'error' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="secondary" size="md" onClick={handleRetrySync} aria-label={t('profile.retry')}>
                {t('profile.retry')}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </ChildRouteScaffold>
  );
}
