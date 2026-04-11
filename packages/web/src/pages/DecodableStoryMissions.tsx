import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { DecodableStoryMissionsGame } from '@/games/reading/DecodableStoryMissionsGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { createGameAttemptId, createGameSessionId, persistGameAttempt } from '@/lib/gameAttemptPersistence';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

type DecodableStoryMissionCompletion = GameCompletionResult & {
  missionBreakdown?: {
    independentPass: number;
    supportedPass: number;
    stage3Hints: number;
  };
};

const DECODABLE_STORY_MISSIONS_GAME: Game = {
  id: 'local-decodable-story-missions',
  topicId: 'reading',
  ageGroupId: '6-7',
  slug: 'decodableStoryMissions',
  nameKey: 'games.decodableStoryMissions.title',
  descriptionKey: 'games.decodableStoryMissions.subtitle',
  gameType: 'story_mission_decode',
  componentKey: 'DecodableStoryMissionsGame',
  difficulty: 5,
  sortOrder: 9,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/decodable-story-missions/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const DECODABLE_STORY_MISSIONS_LEVEL: GameLevel = {
  id: 'local-decodable-story-missions-level-1',
  gameId: DECODABLE_STORY_MISSIONS_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    missionCount: 3,
    pagesPerMission: 3,
    decodeGate: {
      minDecodeFirstPct: 80,
      maxStage3Hints: 1,
    },
    antiRandomTapGate: {
      nonTargetTapCount: 4,
      rapidTapWindowMs: 2000,
      rapidResponseStreak: 3,
      rapidResponseWindowMs: 600,
      pauseMs: 900,
      reduceOptionsBy: 1,
    },
    progression: {
      recoveryTrigger: {
        stage3HintsPerMission: 2,
        firstTryDecodePctBelow: 70,
      },
      maxRecoveryPerMissionBlock: 1,
      clusterAPointingFadePct: 10,
    },
  },
  sortOrder: 1,
};

export default function DecodableStoryMissionsPage() {
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
      ...DECODABLE_STORY_MISSIONS_LEVEL,
      configJson: {
        ...(DECODABLE_STORY_MISSIONS_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<DecodableStoryMissionCompletion | null>(null);
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
        game: DECODABLE_STORY_MISSIONS_GAME,
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
      const completion = result as DecodableStoryMissionCompletion;
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

  const missionBreakdown = completionResult?.missionBreakdown;

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.decodableStoryMissions.title')}
        subtitle={t('games.decodableStoryMissions.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <DecodableStoryMissionsGame
        game={DECODABLE_STORY_MISSIONS_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.decodableStoryMissions.progressSummary', {
              decodeFirstAccuracy: `${completionResult.summaryMetrics.decodeAccuracy ?? completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
              literalComprehensionAccuracy: `${completionResult.summaryMetrics.sequenceEvidenceScore ?? 0}%`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.decodableStoryMissions.missionBreakdown', {
              independentPass: missionBreakdown?.independentPass ?? 0,
              supportedPass: missionBreakdown?.supportedPass ?? 0,
              stage3Hints: missionBreakdown?.stage3Hints ?? 0,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.decodableStoryMissions.nextStep')}
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
