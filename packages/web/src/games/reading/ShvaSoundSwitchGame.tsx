import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph, rtlProgressGradient } from '@/lib/rtlChrome';
import {
  L1_ROUNDS,
  RECOVERY_ROUND,
  SCANNED_WORD_KEYS,
  STAGE_TARGET_ROUNDS,
  buildChoiceSet,
  buildRoundPool,
  evaluateStageGate,
  previousStage,
  shuffle,
  takeLast,
  toHintTrend,
  toLetterTilesFromWord,
  toPercent,
  toStableRange,
  type ShvaRoundTemplate,
  type ShvaRoundTelemetry,
  type ShvaStage,
} from './shvaSoundSwitchRuntime';

type Tone = 'neutral' | 'success' | 'hint' | 'error';
type AudioMode = 'queue' | 'interrupt';

type RoundStartReason = 'initial' | 'next' | 'retry';

interface ActiveRound {
  stage: ShvaStage;
  template: ShvaRoundTemplate;
  choices: string[];
  targetTiles: string[];
  bankTiles: string[];
  requiresBlend: boolean;
  startedAtMs: number;
  forcedModelReplay: boolean;
}

interface ShvaCompletionResult extends GameCompletionResult {
  independentRate: number;
  assistedRate: number;
  confusionPair: string;
}

const SUCCESS_ROTATION = [
  'games.shvaSoundSwitch.feedback.success.listenedAndDecoded',
  'games.shvaSoundSwitch.feedback.success.exactChoice',
  'games.shvaSoundSwitch.feedback.success.smoothBlend',
] as const;

const STAGE_INSTRUCTION_KEY: Record<ShvaStage, string> = {
  L1: 'games.shvaSoundSwitch.instructions.listenChoose',
  L2: 'games.shvaSoundSwitch.instructions.blendRail',
  L3: 'games.shvaSoundSwitch.instructions.transferRead',
};

const TONE_ICON: Record<Tone, string> = {
  neutral: '🔊',
  success: '✅',
  hint: '💡',
  error: '↻',
};

const EMPTY_CLUSTER_STREAK = {
  audiblePrefix: 0,
  silentContrast: 0,
  mixedTransfer: 0,
};

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  inlineSize: '1px',
  blockSize: '1px',
  margin: '-1px',
  border: 0,
  padding: 0,
  clip: 'rect(0 0 0 0)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

function toStars(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  return 1;
}

function buildTileBank(targetTiles: readonly string[], letterPool: readonly string[], stage: ShvaStage, reduced: boolean): string[] {
  const bank = [...targetTiles];
  const decoyCandidates = letterPool.filter((letter) => !targetTiles.includes(letter));
  const baseDecoys = stage === 'L1' ? 1 : 2;
  const decoyCount = reduced ? Math.max(1, baseDecoys - 1) : baseDecoys;

  if (decoyCandidates.length > 0) {
    bank.push(...shuffle(decoyCandidates).slice(0, decoyCount));
  }

  return shuffle(bank);
}

function toPromptLeadKey(round: ActiveRound): string {
  if (round.template.promptMode !== 'transferRead') {
    return 'games.shvaSoundSwitch.prompts.listenChoose.hearTarget';
  }

  if (round.template.targetAudioKey.startsWith('phrases.')) {
    return 'games.shvaSoundSwitch.prompts.transferRead.readPhrase';
  }

  return 'games.shvaSoundSwitch.prompts.transferRead.readWord';
}

function buildContrastKey(left: string, right: string): string {
  return [left, right].sort().join('|');
}

export function ShvaSoundSwitchGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir());

  const replayGlyph = rtlReplayGlyph(isRtl);
  const nextGlyph = rtlNextGlyph(isRtl);

  const letterPool = useMemo(() => {
    const letters = new Set<string>();

    for (const wordKey of SCANNED_WORD_KEYS) {
      const resolved = t(wordKey as never);
      for (const tile of toLetterTilesFromWord(resolved)) {
        letters.add(tile);
      }
    }

    return Array.from(letters);
  }, [t]);

  const stagePointersRef = useRef<Record<ShvaStage, number>>({ L1: 0, L2: 0, L3: 0 });
  const stageRoundsRef = useRef<ShvaRoundTelemetry[]>([]);
  const sessionRoundsRef = useRef<ShvaRoundTelemetry[]>([]);
  const completionSentRef = useRef(false);
  const quickTransferStreakRef = useRef(0);
  const clusterErrorStreakRef = useRef({ ...EMPTY_CLUSTER_STREAK });
  const confusionPairCountsRef = useRef(new Map<string, number>());
  const wrongInteractionTimesRef = useRef<number[]>([]);
  const lastWrongChoiceKeyRef = useRef<string | null>(null);

  const chooseFirstTryCorrectRef = useRef(true);
  const blendFirstTryCorrectRef = useRef(true);
  const hintsUsedInRoundRef = useRef(0);
  const randomInterventionInRoundRef = useRef(false);
  const consecutiveErrorsInRoundRef = useRef(0);

  const slowModeRoundsRemainingRef = useRef(0);
  const reducedOptionRoundsRemainingRef = useRef(0);
  const regressionRoundsRemainingRef = useRef(0);
  const recoveryRoundPendingRef = useRef(false);
  const scaffoldRoundPendingRef = useRef(false);
  const successRotationRef = useRef(0);

  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inputPaused, setInputPaused] = useState(false);

  const [currentStage, setCurrentStage] = useState<ShvaStage>('L1');
  const [stageRoundCount, setStageRoundCount] = useState(0);

  const [statusKey, setStatusKey] = useState('games.shvaSoundSwitch.instructions.intro');
  const [statusTone, setStatusTone] = useState<Tone>('neutral');

  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [roundSolved, setRoundSolved] = useState(false);

  const [choiceSelectedKey, setChoiceSelectedKey] = useState<string | null>(null);
  const [choiceResolved, setChoiceResolved] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsedInRound, setHintsUsedInRound] = useState(0);

  const [availableTiles, setAvailableTiles] = useState<string[]>([]);
  const [slotValues, setSlotValues] = useState<Array<string | null>>([]);
  const [boundaryHighlight, setBoundaryHighlight] = useState(false);

  const [round, setRound] = useState<ActiveRound>(() => {
    const template = L1_ROUNDS[0];
    const targetTiles = toLetterTilesFromWord(t(template.blendWordKey as never));
    const bankTiles = buildTileBank(targetTiles, targetTiles, 'L1', false);

    return {
      stage: 'L1',
      template,
      choices: buildChoiceSet(template, 2, false),
      targetTiles,
      bankTiles,
      requiresBlend: false,
      startedAtMs: Date.now(),
      forcedModelReplay: false,
    };
  });

  const activeSlotIndex = useMemo(() => slotValues.findIndex((value) => value === null), [slotValues]);

  const stageProgress = useMemo(() => {
    const target = STAGE_TARGET_ROUNDS[currentStage];
    return toPercent(stageRoundCount, target);
  }, [currentStage, stageRoundCount]);

  const playAudioKey = useCallback(
    async (audioKey: string, mode: AudioMode = 'queue') => {
      const path = resolveAudioPathFromKey(audioKey, 'common');
      if (mode === 'interrupt') {
        await audio.playNow(path);
        return;
      }
      await audio.play(path);
    },
    [audio],
  );

  const playAudioKeys = useCallback(
    async (audioKeys: readonly string[], mode: AudioMode = 'queue') => {
      const paths = audioKeys.map((key) => resolveAudioPathFromKey(key, 'common'));
      if (paths.length === 0) {
        return;
      }

      if (mode === 'interrupt') {
        const [firstPath, ...restPaths] = paths;
        await audio.playNow(firstPath);
        for (const path of restPaths) {
          await audio.play(path);
        }
        return;
      }

      await audio.playSequence(paths);
    },
    [audio],
  );

  const setStatusWithAudio = useCallback(
    (nextStatusKey: string, tone: Tone, mode: AudioMode = 'queue') => {
      setStatusKey(nextStatusKey);
      setStatusTone(tone);
      void playAudioKey(nextStatusKey, mode).catch(() => {
        // Audio is best-effort and should never block gameplay.
      });
    },
    [playAudioKey],
  );

  const pauseInput = useCallback((durationMs: number) => {
    setInputPaused(true);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = setTimeout(() => {
      setInputPaused(false);
      pauseTimerRef.current = null;
    }, durationMs);
  }, []);

  const playRoundModel = useCallback(
    async (nextRound: ActiveRound, mode: AudioMode = 'queue') => {
      const leadPromptKey = toPromptLeadKey(nextRound);
      const followupKey =
        nextRound.template.promptMode === 'transferRead'
          ? 'games.shvaSoundSwitch.prompts.transferRead.noGuessing'
          : 'games.shvaSoundSwitch.prompts.listenChoose.chooseMatch';

      await playAudioKeys([leadPromptKey, nextRound.template.targetAudioKey, followupKey], mode);
    },
    [playAudioKeys],
  );

  const createRound = useCallback(
    (stage: ShvaStage): ActiveRound => {
      let template: ShvaRoundTemplate;

      if (recoveryRoundPendingRef.current) {
        template = {
          ...RECOVERY_ROUND,
          id: `${RECOVERY_ROUND.id}-${Date.now()}`,
          stage,
          promptMode: stage === 'L3' ? 'transferRead' : 'listenChoose',
        };
        recoveryRoundPendingRef.current = false;
      } else if (scaffoldRoundPendingRef.current) {
        template = {
          ...RECOVERY_ROUND,
          id: `scaffold-${Date.now()}`,
          stage,
          promptMode: stage === 'L3' ? 'transferRead' : 'listenChoose',
          scaffold: true,
        };
        scaffoldRoundPendingRef.current = false;
      } else {
        const pool = buildRoundPool(stage);
        const pointer = stagePointersRef.current[stage];
        template = pool[pointer % pool.length];
        stagePointersRef.current[stage] += 1;
      }

      const baseOptionCount = stage === 'L1' ? 2 : 3;
      const reducedChoices = slowModeRoundsRemainingRef.current > 0 || reducedOptionRoundsRemainingRef.current > 0;
      const maxOptions = Math.max(2, reducedChoices ? baseOptionCount - 1 : baseOptionCount);
      const forceTwoChoice = Boolean(template.scaffold);

      const targetTiles = toLetterTilesFromWord(t(template.blendWordKey as never));
      const bankTiles = buildTileBank(targetTiles, letterPool, stage, reducedChoices || forceTwoChoice);

      return {
        stage,
        template,
        choices: buildChoiceSet(template, maxOptions, forceTwoChoice),
        targetTiles,
        bankTiles,
        requiresBlend: stage !== 'L1',
        startedAtMs: Date.now(),
        forcedModelReplay: forceTwoChoice,
      };
    },
    [letterPool, t],
  );

  const resetRoundRuntime = useCallback((nextRound: ActiveRound) => {
    setRound(nextRound);
    setRoundSolved(false);
    setChoiceResolved(false);
    setChoiceSelectedKey(null);
    setHintStep(0);
    setHintsUsedInRound(0);
    setBoundaryHighlight(false);
    setSlotValues(Array(nextRound.targetTiles.length).fill(null));
    setAvailableTiles(nextRound.bankTiles);

    chooseFirstTryCorrectRef.current = true;
    blendFirstTryCorrectRef.current = true;
    hintsUsedInRoundRef.current = 0;
    randomInterventionInRoundRef.current = false;
    consecutiveErrorsInRoundRef.current = 0;
    wrongInteractionTimesRef.current = [];
    lastWrongChoiceKeyRef.current = null;
  }, []);

  const startRound = useCallback(
    (nextRound: ActiveRound, reason: RoundStartReason) => {
      resetRoundRuntime(nextRound);

      if (reason === 'retry') {
        setStatusWithAudio('games.shvaSoundSwitch.feedback.retry.gentle', 'hint', 'interrupt');
      } else {
        setStatusWithAudio(STAGE_INSTRUCTION_KEY[nextRound.stage], 'neutral', 'interrupt');
      }

      if (nextRound.forcedModelReplay) {
        pauseInput(1100);
      }

      void playRoundModel(nextRound, nextRound.forcedModelReplay ? 'interrupt' : 'queue').catch(() => {
        // Gameplay remains available without audio.
      });
    },
    [pauseInput, playRoundModel, resetRoundRuntime, setStatusWithAudio],
  );

  const completeSession = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    setSessionCompleted(true);
    setRoundSolved(true);

    const rounds = sessionRoundsRef.current;
    const firstTryCorrect = rounds.filter((entry) => entry.firstTryCorrect).length;
    const chooseFirstTryCorrect = rounds.filter((entry) => entry.chooseFirstTryCorrect).length;
    const independentCount = rounds.filter((entry) => entry.independent).length;

    const score = toPercent(firstTryCorrect, rounds.length);
    const chooseAccuracy = toPercent(chooseFirstTryCorrect, rounds.length);
    const independentRate = toPercent(independentCount, rounds.length);

    let confusionPair = `${t('words.pronunciation.dvar')} / ${t('words.pronunciation.davar')}`;
    let topCount = -1;
    for (const [pairKey, count] of confusionPairCountsRef.current.entries()) {
      if (count <= topCount) {
        continue;
      }

      const [left, right] = pairKey.split('|');
      if (!left || !right) {
        continue;
      }

      topCount = count;
      confusionPair = `${t(left as never)} / ${t(right as never)}`;
    }

    const result: ShvaCompletionResult = {
      completed: true,
      score,
      stars: toStars(score),
      roundsCompleted: rounds.length,
      independentRate,
      assistedRate: Math.max(0, 100 - independentRate),
      confusionPair,
      summaryMetrics: {
        highestStableRange: toStableRange(score),
        firstAttemptSuccessRate: score,
        hintTrend: toHintTrend(rounds),
        listenParticipation: chooseAccuracy,
        decodeAccuracy: score,
        sequenceEvidenceScore: independentRate,
        gatePassed: true,
      },
    };

    setStatusWithAudio('games.shvaSoundSwitch.feedback.success.transferReadGreat', 'success', 'interrupt');
    onComplete(result);
  }, [onComplete, setStatusWithAudio, t]);

  const promoteStageIfReady = useCallback(
    (stage: ShvaStage): ShvaStage | null => {
      if (regressionRoundsRemainingRef.current > 0) {
        return null;
      }

      if (stage === 'L1') {
        const gateWindow = takeLast(stageRoundsRef.current, 10);
        if (gateWindow.length < 10) {
          return null;
        }

        const gate = evaluateStageGate(gateWindow);
        if (gate.firstTryAccuracy >= 80 && gate.hintUsage <= 2) {
          return 'L2';
        }
        return null;
      }

      if (stage === 'L2') {
        const gateWindow = takeLast(stageRoundsRef.current, 12);
        if (gateWindow.length < 12) {
          return null;
        }

        const gate = evaluateStageGate(gateWindow);
        if (gate.firstTryAccuracy >= 85 && gate.blendAccuracy >= 80 && gate.randomInterventions <= 1) {
          return 'L3';
        }
      }

      return null;
    },
    [],
  );

  const shouldRegress = useCallback(
    (stage: ShvaStage) => {
      if (stage === 'L1') {
        return false;
      }

      const lastEight = takeLast(sessionRoundsRef.current, 8);
      const lowAccuracy = lastEight.length >= 8 && toPercent(
        lastEight.filter((entry) => entry.firstTryCorrect).length,
        lastEight.length,
      ) < 60;

      const clusterStreak = clusterErrorStreakRef.current[round.template.cluster] >= 3;
      const l3HintStack = stage === 'L3' && hintsUsedInRoundRef.current >= 3;

      return lowAccuracy || clusterStreak || l3HintStack;
    },
    [round.template.cluster],
  );

  const handleContinue = useCallback(() => {
    if (!roundSolved || sessionCompleted) {
      return;
    }

    const latencyMs = Math.max(0, Date.now() - round.startedAtMs);
    const firstTryCorrect = chooseFirstTryCorrectRef.current && (!round.requiresBlend || blendFirstTryCorrectRef.current);
    const telemetry: ShvaRoundTelemetry = {
      stage: round.stage,
      cluster: round.template.cluster,
      firstTryCorrect,
      chooseFirstTryCorrect: chooseFirstTryCorrectRef.current,
      blendFirstTryCorrect: round.requiresBlend ? blendFirstTryCorrectRef.current : true,
      hintsUsed: hintsUsedInRoundRef.current,
      independent: firstTryCorrect && hintsUsedInRoundRef.current === 0 && !randomInterventionInRoundRef.current,
      randomIntervention: randomInterventionInRoundRef.current,
      fullWordDecode: round.template.fullWordDecode,
      minimalContrast: round.template.minimalContrast,
      latencyMs,
    };

    sessionRoundsRef.current.push(telemetry);
    stageRoundsRef.current.push(telemetry);
    setStageRoundCount(stageRoundsRef.current.length);

    if (telemetry.firstTryCorrect) {
      clusterErrorStreakRef.current[round.template.cluster] = 0;
    }

    if (round.stage === 'L3' && telemetry.firstTryCorrect && latencyMs < 600) {
      quickTransferStreakRef.current += 1;
      if (quickTransferStreakRef.current >= 3) {
        scaffoldRoundPendingRef.current = true;
        quickTransferStreakRef.current = 0;
      }
    } else {
      quickTransferStreakRef.current = 0;
    }

    if (slowModeRoundsRemainingRef.current > 0) {
      slowModeRoundsRemainingRef.current -= 1;
    }

    if (reducedOptionRoundsRemainingRef.current > 0) {
      reducedOptionRoundsRemainingRef.current -= 1;
    }

    if (regressionRoundsRemainingRef.current > 0) {
      regressionRoundsRemainingRef.current -= 1;
    }

    if (shouldRegress(round.stage)) {
      const fallbackStage = previousStage(round.stage);
      setCurrentStage(fallbackStage);
      stageRoundsRef.current = [];
      setStageRoundCount(0);
      regressionRoundsRemainingRef.current = 4;

      const fallbackRound = createRound(fallbackStage);
      startRound(fallbackRound, 'next');
      return;
    }

    const promotedStage = promoteStageIfReady(round.stage);
    if (promotedStage) {
      setCurrentStage(promotedStage);
      stageRoundsRef.current = [];
      setStageRoundCount(0);

      const promotedRound = createRound(promotedStage);
      startRound(promotedRound, 'next');
      return;
    }

    if (round.stage === 'L3' && stageRoundsRef.current.length >= STAGE_TARGET_ROUNDS.L3) {
      const l3Rounds = stageRoundsRef.current.filter((entry) => entry.stage === 'L3');
      const fullWordRatio = toPercent(l3Rounds.filter((entry) => entry.fullWordDecode).length, l3Rounds.length);
      if (fullWordRatio >= 50) {
        completeSession();
        return;
      }
    }

    const nextRound = createRound(round.stage);
    startRound(nextRound, 'next');
  }, [
    completeSession,
    createRound,
    promoteStageIfReady,
    round,
    roundSolved,
    sessionCompleted,
    shouldRegress,
    startRound,
  ]);

  const registerWrongInteraction = useCallback(() => {
    const now = Date.now();
    wrongInteractionTimesRef.current = wrongInteractionTimesRef.current.filter((timestamp) => now - timestamp <= 2000);
    wrongInteractionTimesRef.current.push(now);
    consecutiveErrorsInRoundRef.current += 1;

    if (consecutiveErrorsInRoundRef.current >= 2) {
      slowModeRoundsRemainingRef.current = Math.max(slowModeRoundsRemainingRef.current, 2);
      reducedOptionRoundsRemainingRef.current = Math.max(reducedOptionRoundsRemainingRef.current, 2);
    }

    if (wrongInteractionTimesRef.current.length >= 3) {
      randomInterventionInRoundRef.current = true;
      recoveryRoundPendingRef.current = true;
      reducedOptionRoundsRemainingRef.current = Math.max(reducedOptionRoundsRemainingRef.current, 1);
      pauseInput(1200);
      setStatusWithAudio('games.shvaSoundSwitch.hints.replayContrast', 'hint', 'interrupt');
      void playRoundModel(round, 'queue').catch(() => {
        // Audio fallback should not block interaction.
      });
      return;
    }

    setStatusWithAudio('games.shvaSoundSwitch.feedback.retry.replayModel', 'error', 'interrupt');
  }, [pauseInput, playRoundModel, round, setStatusWithAudio]);

  const handleChoiceTap = useCallback(
    (choiceKey: string) => {
      if (sessionCompleted || inputPaused || roundSolved) {
        return;
      }

      setChoiceSelectedKey(choiceKey);

      if (choiceKey === round.template.correctChoiceKey) {
        setChoiceResolved(true);
        consecutiveErrorsInRoundRef.current = 0;

        if (round.requiresBlend) {
          setStatusWithAudio('games.shvaSoundSwitch.prompts.blendRail.dragTiles', 'neutral', 'interrupt');
          return;
        }

        const successKey = SUCCESS_ROTATION[successRotationRef.current % SUCCESS_ROTATION.length];
        successRotationRef.current += 1;
        setRoundSolved(true);
        setStatusWithAudio(successKey, 'success', 'interrupt');
        return;
      }

      if (chooseFirstTryCorrectRef.current) {
        chooseFirstTryCorrectRef.current = false;
      }

      clusterErrorStreakRef.current[round.template.cluster] += 1;
      lastWrongChoiceKeyRef.current = choiceKey;

      const contrastKey = buildContrastKey(round.template.correctChoiceKey, choiceKey);
      confusionPairCountsRef.current.set(contrastKey, (confusionPairCountsRef.current.get(contrastKey) ?? 0) + 1);

      registerWrongInteraction();
    },
    [inputPaused, registerWrongInteraction, round, roundSolved, sessionCompleted, setStatusWithAudio],
  );

  const attemptPlaceTile = useCallback(
    (tile: string, requestedSlotIndex?: number) => {
      if (sessionCompleted || inputPaused || roundSolved || !choiceResolved || !round.requiresBlend) {
        return;
      }

      const expectedSlotIndex = activeSlotIndex;
      if (expectedSlotIndex < 0) {
        return;
      }

      if (typeof requestedSlotIndex === 'number' && requestedSlotIndex !== expectedSlotIndex) {
        return;
      }

      const expectedTile = round.targetTiles[expectedSlotIndex];
      if (tile !== expectedTile) {
        if (blendFirstTryCorrectRef.current) {
          blendFirstTryCorrectRef.current = false;
        }

        clusterErrorStreakRef.current[round.template.cluster] += 1;
        registerWrongInteraction();
        setStatusWithAudio('games.shvaSoundSwitch.feedback.retry.focusBoundary', 'error', 'interrupt');
        return;
      }

      consecutiveErrorsInRoundRef.current = 0;

      setSlotValues((prev) => {
        const next = [...prev];
        next[expectedSlotIndex] = tile;
        return next;
      });

      setAvailableTiles((prev) => {
        const index = prev.indexOf(tile);
        if (index < 0) {
          return prev;
        }
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });

      const solved = expectedSlotIndex === round.targetTiles.length - 1;
      if (!solved) {
        if (slowModeRoundsRemainingRef.current > 0) {
          setBoundaryHighlight(true);
          window.setTimeout(() => setBoundaryHighlight(false), 400);
        }
        setStatusWithAudio('games.shvaSoundSwitch.prompts.blendRail.afterBlendRead', 'neutral', 'queue');
        return;
      }

      const successKey = SUCCESS_ROTATION[successRotationRef.current % SUCCESS_ROTATION.length];
      successRotationRef.current += 1;
      setRoundSolved(true);
      setStatusWithAudio(successKey, 'success', 'interrupt');
    },
    [
      activeSlotIndex,
      choiceResolved,
      inputPaused,
      registerWrongInteraction,
      round,
      roundSolved,
      sessionCompleted,
      setStatusWithAudio,
    ],
  );

  const handleHint = useCallback(() => {
    if (sessionCompleted || inputPaused || roundSolved) {
      return;
    }

    const nextHintStep = Math.min(3, hintStep + 1);
    setHintStep(nextHintStep);

    hintsUsedInRoundRef.current += 1;
    setHintsUsedInRound(hintsUsedInRoundRef.current);

    if (hintsUsedInRoundRef.current >= 2) {
      slowModeRoundsRemainingRef.current = Math.max(slowModeRoundsRemainingRef.current, 2);
      reducedOptionRoundsRemainingRef.current = Math.max(reducedOptionRoundsRemainingRef.current, 2);
    }

    if (nextHintStep === 1) {
      setStatusWithAudio('games.shvaSoundSwitch.hints.segmentedReplay', 'hint', 'interrupt');
      void playAudioKeys([round.template.segmentedHintKey, round.template.targetAudioKey], 'queue').catch(() => {
        // Audio fallback is best-effort.
      });
      return;
    }

    if (nextHintStep === 2) {
      setBoundaryHighlight(true);
      setStatusWithAudio('games.shvaSoundSwitch.hints.highlightBoundary', 'hint', 'interrupt');
      window.setTimeout(() => setBoundaryHighlight(false), 900);
      return;
    }

    if (!choiceResolved) {
      setChoiceSelectedKey(round.template.correctChoiceKey);
      setChoiceResolved(true);
      chooseFirstTryCorrectRef.current = false;
    }

    if (round.requiresBlend) {
      const slotIndex = slotValues.findIndex((value) => value === null);
      if (slotIndex >= 0) {
        const tile = round.targetTiles[slotIndex];
        blendFirstTryCorrectRef.current = false;
        setSlotValues((prev) => {
          const next = [...prev];
          next[slotIndex] = tile;
          return next;
        });
        setAvailableTiles((prev) => {
          const index = prev.indexOf(tile);
          if (index < 0) {
            return prev;
          }
          const next = [...prev];
          next.splice(index, 1);
          return next;
        });
      }
    }

    setStatusWithAudio('games.shvaSoundSwitch.hints.solvedExample', 'hint', 'interrupt');
  }, [
    choiceResolved,
    hintStep,
    inputPaused,
    playAudioKeys,
    round,
    roundSolved,
    sessionCompleted,
    setStatusWithAudio,
    slotValues,
  ]);

  const handleRetry = useCallback(() => {
    if (sessionCompleted || inputPaused) {
      return;
    }

    const refreshedRound = {
      ...round,
      choices: buildChoiceSet(round.template, round.stage === 'L1' ? 2 : 3, round.forcedModelReplay),
      bankTiles: buildTileBank(round.targetTiles, letterPool, round.stage, false),
      startedAtMs: Date.now(),
    };
    startRound(refreshedRound, 'retry');
  }, [inputPaused, letterPool, round, sessionCompleted, startRound]);

  const handleReplay = useCallback(() => {
    if (sessionCompleted || inputPaused) {
      return;
    }

    setStatusWithAudio('games.shvaSoundSwitch.instructions.tapReplay', 'neutral', 'interrupt');
    void playRoundModel(round, 'queue').catch(() => {
      // Audio fallback is best-effort.
    });
  }, [inputPaused, playRoundModel, round, sessionCompleted, setStatusWithAudio]);

  const handleDropOnSlot = useCallback(
    (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
      event.preventDefault();
      const tile = event.dataTransfer.getData('text/plain');
      if (!tile) {
        return;
      }
      attemptPlaceTile(tile, slotIndex);
    },
    [attemptPlaceTile],
  );

  useEffect(() => {
    setSlotValues(Array(round.targetTiles.length).fill(null));
    setAvailableTiles(round.bankTiles);
  }, [round.bankTiles, round.targetTiles.length]);

  useEffect(() => {
    if (completionSentRef.current) {
      return;
    }

    const bootstrapRound = createRound('L1');
    setCurrentStage('L1');
    stageRoundsRef.current = [];
    sessionRoundsRef.current = [];
    setStageRoundCount(0);
    startRound(bootstrapRound, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRound]);

  useEffect(
    () => () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    },
    [],
  );

  const currentPromptLabel =
    round.template.promptMode === 'transferRead'
      ? t('games.shvaSoundSwitch.prompts.transferRead.chooseFromText')
      : t('games.shvaSoundSwitch.prompts.listenChoose.chooseMatch');

  return (
    <Card padding="md" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      {sessionCompleted ? <SuccessCelebration /> : null}

      <div
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {t('games.shvaSoundSwitch.title')}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {currentStage} · {stageRoundCount}/{STAGE_TARGET_ROUNDS[currentStage]}
          </span>
        </div>

        <div
          aria-label={t('games.shvaSoundSwitch.instructions.tapNext')}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stageProgress}
          style={{
            blockSize: '10px',
            borderRadius: '999px',
            background: 'var(--color-surface-muted)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              blockSize: '100%',
              inlineSize: `${stageProgress}%`,
              background: rtlProgressGradient(isRtl, 'var(--color-accent-success)', 'var(--color-accent-info)'),
              transition: 'inline-size 240ms ease',
            }}
          />
        </div>
      </div>

      <Card
        padding="md"
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          background: 'color-mix(in srgb, var(--color-accent-primary) 12%, var(--color-bg-card) 88%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <MascotIllustration variant={statusTone === 'error' ? 'hint' : 'success'} size={56} />
          <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 700 }}>
            <span aria-hidden="true" style={{ marginInlineEnd: 'var(--space-xs)' }}>
              {TONE_ICON[statusTone]}
            </span>
            {t(statusKey as never)}
          </p>
        </div>

        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{currentPromptLabel}</p>

        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md)',
            textAlign: 'center',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            minBlockSize: '72px',
            display: 'grid',
            placeItems: 'center',
          }}
          aria-live="polite"
        >
          {t(round.template.targetDisplayKey as never)}
        </div>
      </Card>

      <Card padding="md" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('games.shvaSoundSwitch.prompts.listenChoose.ready')}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('games.shvaSoundSwitch.instructions.decodeBeforeGuess')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(2, round.choices.length)}, minmax(0, 1fr))`,
            gap: 'var(--space-sm)',
          }}
        >
          {round.choices.map((choiceKey) => {
            const isSelected = choiceSelectedKey === choiceKey;
            const isCorrect = choiceKey === round.template.correctChoiceKey;
            const showSuccess = choiceResolved && isSelected && isCorrect;
            const showError = isSelected && !isCorrect;

            return (
              <Button
                key={choiceKey}
                variant={showSuccess ? 'primary' : showError ? 'danger' : 'secondary'}
                size="lg"
                onClick={() => handleChoiceTap(choiceKey)}
                aria-label={t(choiceKey as never)}
                disabled={sessionCompleted || inputPaused || roundSolved}
                style={{
                  minBlockSize: '56px',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 700,
                }}
              >
                {t(choiceKey as never)}
              </Button>
            );
          })}
        </div>
      </Card>

      {round.requiresBlend ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('games.shvaSoundSwitch.prompts.blendRail.rtlReminder')}</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(1, round.targetTiles.length)}, minmax(0, 1fr))`,
              gap: 'var(--space-sm)',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            {round.targetTiles.map((_, slotIndex) => {
              const filled = slotValues[slotIndex] !== null;
              const isActive = slotIndex === activeSlotIndex;
              return (
                <div
                  key={`slot-${slotIndex}`}
                  role="button"
                  tabIndex={0}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnSlot(event, slotIndex)}
                  onClick={() => {
                    if (!choiceResolved || activeSlotIndex < 0 || slotIndex !== activeSlotIndex) {
                      return;
                    }
                    const fallbackTile = availableTiles[0];
                    if (!fallbackTile) {
                      return;
                    }
                    attemptPlaceTile(fallbackTile, slotIndex);
                  }}
                  style={{
                    minBlockSize: '56px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${filled ? 'var(--color-accent-success)' : isActive || boundaryHighlight ? 'var(--color-accent-info)' : 'var(--color-border-subtle)'}`,
                    background: filled
                      ? 'color-mix(in srgb, var(--color-accent-success) 18%, var(--color-bg-card) 82%)'
                      : 'var(--color-bg-card)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    transition: 'border-color 160ms ease',
                    cursor: 'pointer',
                  }}
                >
                  {slotValues[slotIndex] ?? '·'}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(6, Math.max(2, availableTiles.length))}, minmax(0, 1fr))`,
              gap: 'var(--space-sm)',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            {availableTiles.map((tile, index) => (
              <Button
                key={`${tile}-${index}`}
                variant="secondary"
                size="md"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', tile);
                }}
                onClick={() => attemptPlaceTile(tile)}
                aria-label={tile}
                disabled={!choiceResolved || sessionCompleted || inputPaused || roundSolved}
                style={{ minBlockSize: '52px', fontSize: '1.2rem', fontWeight: 700 }}
              >
                {tile}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      <div style={{ display: 'grid', gap: 'var(--space-sm)', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <Button
          variant="secondary"
          size="lg"
          aria-label={t('games.shvaSoundSwitch.instructions.tapReplay')}
          onClick={handleReplay}
          disabled={sessionCompleted || inputPaused}
        >
          <span aria-hidden="true">{replayGlyph}</span>
          <span style={visuallyHiddenStyle}>{t('games.shvaSoundSwitch.instructions.tapReplay')}</span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          aria-label={t('games.shvaSoundSwitch.instructions.tapRetry')}
          onClick={handleRetry}
          disabled={sessionCompleted || inputPaused}
        >
          <span aria-hidden="true">↻</span>
          <span style={visuallyHiddenStyle}>{t('games.shvaSoundSwitch.instructions.tapRetry')}</span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          aria-label={t('games.shvaSoundSwitch.instructions.tapHint')}
          onClick={handleHint}
          disabled={sessionCompleted || inputPaused || roundSolved}
        >
          <span aria-hidden="true">💡</span>
          <span style={visuallyHiddenStyle}>{t('games.shvaSoundSwitch.instructions.tapHint')}</span>
        </Button>

        <Button
          variant={roundSolved ? 'primary' : 'ghost'}
          size="lg"
          aria-label={t('games.shvaSoundSwitch.instructions.tapNext')}
          onClick={handleContinue}
          disabled={!roundSolved || sessionCompleted || inputPaused}
        >
          <span aria-hidden="true">{nextGlyph}</span>
          <span style={visuallyHiddenStyle}>{t('games.shvaSoundSwitch.instructions.tapNext')}</span>
        </Button>
      </div>

      <p
        style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {t('games.shvaSoundSwitch.hints.gentleRetry')} · {t('games.shvaSoundSwitch.instructions.tapHint')} {hintsUsedInRound}
      </p>
    </Card>
  );
}
