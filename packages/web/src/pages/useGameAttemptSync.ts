import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game, GameLevel } from '@dubiland/shared';
import type { GameCompletionResult } from '@/games/engine';
import { createGameAttemptId, createGameSessionId, persistGameAttempt } from '@/lib/gameAttemptPersistence';

type PersistableAgeBand = '3-4' | '4-5' | '5-6' | '6-7';

export type GameAttemptSyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface UseGameAttemptSyncParams {
  childId: string;
  childAgeBand?: PersistableAgeBand;
  game: Pick<Game, 'id' | 'slug'> & Partial<Pick<Game, 'topicId'>>;
  level?: Pick<GameLevel, 'id' | 'levelNumber'> | null;
}

interface UseGameAttemptSyncResult {
  completionResult: GameCompletionResult | null;
  syncState: GameAttemptSyncState;
  handleComplete: (result: GameCompletionResult) => void;
  retryLastSync: () => void;
}

export function useGameAttemptSync({
  childId,
  childAgeBand,
  game,
  level = null,
}: UseGameAttemptSyncParams): UseGameAttemptSyncResult {
  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<GameAttemptSyncState>('idle');
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
  }, [childId]);

  const syncCompletion = useCallback(
    async (result: GameCompletionResult, attemptIndex: number, attemptId: string) => {
      const persistOutcome = await persistGameAttempt({
        childId,
        childAgeBand,
        game,
        level,
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
    [childAgeBand, childId, game, level],
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

  const retryLastSync = useCallback(() => {
    if (!completionResult) {
      return;
    }

    if (attemptIndexRef.current < 1) {
      attemptIndexRef.current = 1;
    }

    const attemptId = pendingAttemptIdRef.current ?? createGameAttemptId();
    pendingAttemptIdRef.current = attemptId;
    setSyncState('syncing');
    void syncCompletion(completionResult, attemptIndexRef.current, attemptId);
  }, [completionResult, syncCompletion]);

  return {
    completionResult,
    syncState,
    handleComplete,
    retryLastSync,
  };
}
