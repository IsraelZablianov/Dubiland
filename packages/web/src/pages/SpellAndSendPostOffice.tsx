import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { SpellAndSendPostOfficeGame } from '@/games/reading/SpellAndSendPostOfficeGame';
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

type SpellAndSendCompletion = GameCompletionResult & {
  independentPassCount?: number;
  supportedPassCount?: number;
  firstTrySlotAccuracy?: number;
  finalFormAccuracy?: number;
  focusFamily?: string;
};

const SPELL_AND_SEND_POST_OFFICE_GAME: Game = {
  id: 'local-spell-and-send-post-office',
  topicId: 'reading',
  ageGroupId: '6-7',
  slug: 'spellAndSendPostOffice',
  nameKey: 'games.spellAndSendPostOffice.title',
  descriptionKey: 'games.spellAndSendPostOffice.subtitle',
  gameType: 'rtl_word_encoding',
  componentKey: 'SpellAndSendPostOfficeGame',
  difficulty: 5,
  sortOrder: 10,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/spell-and-send-post-office/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const SPELL_AND_SEND_POST_OFFICE_LEVEL: GameLevel = {
  id: 'local-spell-and-send-post-office-level-1',
  gameId: SPELL_AND_SEND_POST_OFFICE_GAME.id,
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
      tier1WrongPlacements: 4,
      tier1WindowMs: 2000,
      tier1PauseMs: 900,
      tier2WrongPlacements: 6,
      tier2WindowMs: 3000,
      tier2Misses: 3,
      tier2MissWindowMs: 20000,
      tier2PauseMs: 1200,
      reducedDecoysRounds: 2,
      minDecoys: 1,
    },
    inactivityReplayMs: 6000,
  },
  sortOrder: 1,
};

export default function SpellAndSendPostOfficePage() {
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
      ...SPELL_AND_SEND_POST_OFFICE_LEVEL,
      configJson: {
        ...(SPELL_AND_SEND_POST_OFFICE_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<SpellAndSendCompletion | null>(null);
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
        game: SPELL_AND_SEND_POST_OFFICE_GAME,
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
      const completion = result as SpellAndSendCompletion;
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

  const passTotal = (completionResult?.independentPassCount ?? 0) + (completionResult?.supportedPassCount ?? 0);
  const independentPassRate = passTotal > 0
    ? Math.round(((completionResult?.independentPassCount ?? 0) / passTotal) * 100)
    : 0;

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.spellAndSendPostOffice.title')}
        subtitle={t('games.spellAndSendPostOffice.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <SpellAndSendPostOfficeGame
        game={SPELL_AND_SEND_POST_OFFICE_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.spellAndSendPostOffice.progressSummary', {
              firstTrySlotAccuracy: `${completionResult.firstTrySlotAccuracy ?? completionResult.summaryMetrics.decodeAccuracy ?? 0}`,
              independentPassRate: `${independentPassRate}`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.spellAndSendPostOffice.finalFormAccuracy', {
              finalFormAccuracy: `${completionResult.finalFormAccuracy ?? completionResult.summaryMetrics.sequenceEvidenceScore ?? 0}`,
              focusFamily: completionResult.focusFamily ?? t('letters.pronunciation.nun'),
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.spellAndSendPostOffice.nextStep')}
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
