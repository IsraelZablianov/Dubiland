import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import {
  PointingFadeBridgeGame,
  type PointingFadeBridgeCompletion,
} from '@/games/reading/PointingFadeBridgeGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import {
  createGameAttemptId,
  createGameSessionId,
  persistGameAttempt,
  persistOutcomeRequiresErrorUi,
} from '@/lib/gameAttemptPersistence';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

const POINTING_FADE_BRIDGE_GAME: Game = {
  id: 'local-pointing-fade-bridge',
  topicId: 'reading',
  ageGroupId: '6-7',
  slug: 'pointingFadeBridge',
  nameKey: 'games.pointingFadeBridge.title',
  descriptionKey: 'games.pointingFadeBridge.subtitle',
  gameType: 'mixed_pointing_sentence_bridge',
  componentKey: 'PointingFadeBridgeGame',
  difficulty: 4,
  sortOrder: 44,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/pointing-fade-bridge/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const POINTING_FADE_BRIDGE_LEVEL: GameLevel = {
  id: 'local-pointing-fade-bridge-level-1',
  gameId: POINTING_FADE_BRIDGE_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    progressionOrder: ['L1', 'L2A', 'L2B', 'L3A', 'L3B'],
    stageTargets: {
      l1Rounds: 10,
      l2aRounds: 10,
      l2bRounds: 20,
      l3aRounds: 5,
      l3bRounds: 15,
    },
    antiGuess: {
      tier1TapThreshold: 4,
      tier1WindowMs: 1500,
      tier1PauseMs: 900,
      tier2TapThreshold: 6,
      tier2WindowMs: 2500,
      tier2MissThreshold: 3,
      tier2MissWindowMs: 20000,
      tier2PauseMs: 1200,
      reducedOptionsRounds: 2,
      minimumOptionCount: 2,
    },
  },
  sortOrder: 1,
};

export default function PointingFadeBridgePage() {
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
      ...POINTING_FADE_BRIDGE_LEVEL,
      configJson: {
        ...(POINTING_FADE_BRIDGE_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<PointingFadeBridgeCompletion | null>(null);
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
        game: POINTING_FADE_BRIDGE_GAME,
        level: runtimeLevel,
        completion: result,
        clientSessionId: clientSessionIdRef.current,
        startedAt: new Date(sessionStartedAtMsRef.current).toISOString(),
        durationMs: Math.max(0, Date.now() - sessionStartedAtMsRef.current),
        attemptIndex,
        attemptId,
      });

      if (persistOutcomeRequiresErrorUi(persistOutcome)) {
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
      const completion = result as PointingFadeBridgeCompletion;
      setCompletionResult(completion);
      setSyncState('syncing');
      attemptIndexRef.current += 1;
      const attemptId = createGameAttemptId();
      pendingAttemptIdRef.current = attemptId;
      void syncCompletion(completion, attemptIndexRef.current, attemptId);
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

  const accuracy = completionResult?.summaryMetrics?.decodeAccuracy ?? completionResult?.score ?? 0;
  const independentRate = completionResult?.independentRate ?? completionResult?.summaryMetrics?.sequenceEvidenceScore ?? 0;
  const fullPointingAccuracy = completionResult?.pointingProfileBreakdown?.fullPointingAccuracy ?? 0;
  const partialPointingAccuracy = completionResult?.pointingProfileBreakdown?.partialPointingAccuracy ?? 0;
  const mostlyUnpointedAccuracy = completionResult?.pointingProfileBreakdown?.mostlyUnpointedAccuracy ?? 0;

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.pointingFadeBridge.title')}
        subtitle={t('games.pointingFadeBridge.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <PointingFadeBridgeGame
        game={POINTING_FADE_BRIDGE_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.pointingFadeBridge.progressSummary', {
              accuracy: `${accuracy}`,
              independentRate: `${independentRate}`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.pointingFadeBridge.pointingProfileBreakdown', {
              fullPointingAccuracy: `${fullPointingAccuracy}`,
              partialPointingAccuracy: `${partialPointingAccuracy}`,
              mostlyUnpointedAccuracy: `${mostlyUnpointedAccuracy}`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.pointingFadeBridge.nextStep')}
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
