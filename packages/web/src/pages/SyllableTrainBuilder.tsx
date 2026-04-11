import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { SyllableTrainBuilderGame } from '@/games/reading/SyllableTrainBuilderGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { createGameAttemptId, createGameSessionId, persistGameAttempt } from '@/lib/gameAttemptPersistence';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

type SyllableCompletionResult = GameCompletionResult & {
  cvCoverage?: number;
  cvcCoverage?: number;
  distractorAccuracy?: number;
};

const SYLLABLE_TRAIN_BUILDER_GAME: Game = {
  id: 'local-syllable-train-builder',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'syllableTrainBuilder',
  nameKey: 'games.syllableTrainBuilder.title',
  descriptionKey: 'games.syllableTrainBuilder.subtitle',
  gameType: 'blend_rail_builder',
  componentKey: 'SyllableTrainBuilderGame',
  difficulty: 4,
  sortOrder: 7,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/syllable-train-builder/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const SYLLABLE_TRAIN_BUILDER_LEVEL: GameLevel = {
  id: 'local-syllable-train-builder-level-1',
  gameId: SYLLABLE_TRAIN_BUILDER_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    transferRoundsTarget: 5,
    cvGate: {
      minItems: 10,
      firstTryAccuracyPct: 85,
      minNikudPatterns: 4,
      maxHintsInLastWindow: 2,
      hintWindow: 6,
    },
    cvcGate: {
      minItems: 12,
      firstTryAccuracyPct: 80,
      nearMissAccuracyPct: 75,
      minClosingConsonants: 3,
    },
    regression: {
      windowSize: 6,
      firstTryFloorPct: 60,
      scaffoldRounds: 3,
    },
    calmAssist: {
      wrongActions: 3,
      windowMs: 4000,
      pauseMs: 800,
    },
  },
  sortOrder: 1,
};

export default function SyllableTrainBuilderPage() {
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
      ...SYLLABLE_TRAIN_BUILDER_LEVEL,
      configJson: {
        ...(SYLLABLE_TRAIN_BUILDER_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<SyllableCompletionResult | null>(null);
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
        game: SYLLABLE_TRAIN_BUILDER_GAME,
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
      const nextResult = result as SyllableCompletionResult;
      setCompletionResult(nextResult);
      setSyncState('syncing');
      attemptIndexRef.current += 1;
      const attemptId = createGameAttemptId();
      pendingAttemptIdRef.current = attemptId;
      void syncCompletion(nextResult, attemptIndexRef.current, attemptId);
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
        title={t('games.syllableTrainBuilder.title')}
        subtitle={t('games.syllableTrainBuilder.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <SyllableTrainBuilderGame
        game={SYLLABLE_TRAIN_BUILDER_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.syllableTrainBuilder.progressSummary', {
              accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
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
            {t('parentDashboard.games.syllableTrainBuilder.patternBreakdown', {
              cvCoverage: `${completionResult.cvCoverage ?? 0}%`,
              cvcCoverage: `${completionResult.cvcCoverage ?? 0}%`,
              distractorAccuracy: `${completionResult.distractorAccuracy ?? 0}%`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.syllableTrainBuilder.nextStep')}
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
