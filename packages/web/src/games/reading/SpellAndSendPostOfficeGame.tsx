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
import type { GameCompletionResult, GameProps } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';
import {
  FINAL_FORM_FAMILIES,
  FINAL_FORM_FAMILY_LABEL_KEY,
  L1_WORD_IDS,
  L2A_WORD_IDS,
  L3A_WORD_IDS,
  L3B_CONTEXT_WORD_IDS,
  L3B_TARGET_WORD_IDS,
  STAGE_TARGET_ROUNDS,
  WORD_DEFINITIONS,
  buildL2BBlock,
  evaluateAntiGuessTier,
  evaluateStageBlock,
  nextStage,
  previousStage,
  resolveBaseDecoyCount,
  resolveDecoyCount,
  resolveFinalFormFamily,
  toHintTrend,
  toLetterTilesFromWord,
  toStableRange,
  toStars,
  type FinalFormFamily,
  type L2BBlockPointers,
  type L2BBlockRound,
  type RoundTelemetry,
  type SpellStage,
  type WordId,
} from './spellAndSendEncodingCore';

type Tone = 'neutral' | 'success' | 'hint' | 'error';

type AudioMode = 'queue' | 'interrupt';

interface ActiveRound {
  stage: SpellStage;
  wordId: WordId;
  wordKey: (typeof WORD_DEFINITIONS)[WordId]['wordKey'];
  segmentedPart1Key: (typeof WORD_DEFINITIONS)[WordId]['segmentedPart1Key'];
  segmentedPart2Key: (typeof WORD_DEFINITIONS)[WordId]['segmentedPart2Key'];
  letters: string[];
  bankLetters: string[];
  finalFormTarget: boolean;
  finalFormFamily: FinalFormFamily | null;
  phraseContextWordId: WordId | null;
}

interface SpellAndSendCompletionResult extends GameCompletionResult {
  independentPassCount: number;
  supportedPassCount: number;
  firstTrySlotAccuracy: number;
  finalFormAccuracy: number;
  focusFamily: string;
}

const STAGE_PROMPT_KEY: Readonly<Record<SpellStage, string>> = {
  L1: 'games.spellAndSendPostOffice.prompts.stages.l1Warmup',
  L2A: 'games.spellAndSendPostOffice.prompts.stages.l2aLengthUp',
  L2B: 'games.spellAndSendPostOffice.prompts.stages.l2bFinalFormFocus',
  L3A: 'games.spellAndSendPostOffice.prompts.stages.l3aFiveLetters',
  L3B: 'games.spellAndSendPostOffice.prompts.stages.l3bPhraseBridge',
};

const SUCCESS_ROTATION: readonly string[] = [
  'games.spellAndSendPostOffice.feedback.success.accurateSpelling',
  'games.spellAndSendPostOffice.feedback.success.sequencePraise',
  'games.spellAndSendPostOffice.feedback.success.transition.nextWord',
];

const LETTER_AUDIO_KEY_BY_CHAR: Readonly<Record<string, string>> = {
  '\u05D0': 'letters.pronunciation.alef',
  '\u05D1': 'letters.pronunciation.bet',
  '\u05D2': 'letters.pronunciation.gimel',
  '\u05D3': 'letters.pronunciation.dalet',
  '\u05D4': 'letters.pronunciation.he',
  '\u05D5': 'letters.pronunciation.vav',
  '\u05D6': 'letters.pronunciation.zayin',
  '\u05D7': 'letters.pronunciation.het',
  '\u05D8': 'letters.pronunciation.tet',
  '\u05D9': 'letters.pronunciation.yod',
  '\u05DB': 'letters.pronunciation.kaf',
  '\u05DA': 'letters.pronunciation.kaf',
  '\u05DC': 'letters.pronunciation.lamed',
  '\u05DE': 'letters.pronunciation.mem',
  '\u05DD': 'letters.pronunciation.mem',
  '\u05E0': 'letters.pronunciation.nun',
  '\u05DF': 'letters.pronunciation.nun',
  '\u05E1': 'letters.pronunciation.samekh',
  '\u05E2': 'letters.pronunciation.ayin',
  '\u05E4': 'letters.pronunciation.pe',
  '\u05E3': 'letters.pronunciation.pe',
  '\u05E6': 'letters.pronunciation.tsadi',
  '\u05E5': 'letters.pronunciation.tsadi',
  '\u05E7': 'letters.pronunciation.qof',
  '\u05E8': 'letters.pronunciation.resh',
  '\u05E9': 'letters.pronunciation.shin',
  '\u05EA': 'letters.pronunciation.tav',
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

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function toPercent(successes: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((successes / total) * 100)));
}

function toLetterAudioKey(letter: string): string {
  return LETTER_AUDIO_KEY_BY_CHAR[letter] ?? 'games.spellAndSendPostOffice.prompts.listen.targetWord';
}

function createBootstrapRound(wordText: string, decoyText: string): ActiveRound {
  const letters = toLetterTilesFromWord(wordText);
  const decoys = toLetterTilesFromWord(decoyText);
  const fallbackDecoy = decoys.find((letter) => !letters.includes(letter)) ?? letters[0] ?? '';

  return {
    stage: 'L1',
    wordId: 'dag',
    wordKey: WORD_DEFINITIONS.dag.wordKey,
    segmentedPart1Key: WORD_DEFINITIONS.dag.segmentedPart1Key,
    segmentedPart2Key: WORD_DEFINITIONS.dag.segmentedPart2Key,
    letters,
    bankLetters: shuffleArray([...letters, fallbackDecoy].filter(Boolean)),
    finalFormTarget: false,
    finalFormFamily: null,
    phraseContextWordId: null,
  };
}

export function SpellAndSendPostOfficeGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir());

  const allLetterPool = useMemo(() => {
    const letters = new Set<string>();
    for (const definition of Object.values(WORD_DEFINITIONS)) {
      const word = t(definition.wordKey as never);
      for (const letter of toLetterTilesFromWord(word)) {
        letters.add(letter);
      }
    }
    return Array.from(letters);
  }, [t]);

  const bootstrapRound = useMemo(
    () => createBootstrapRound(t(WORD_DEFINITIONS.dag.wordKey as never), t(WORD_DEFINITIONS.sal.wordKey as never)),
    [t],
  );

  const [currentStage, setCurrentStage] = useState<SpellStage>('L1');
  const [round, setRound] = useState<ActiveRound>(bootstrapRound);
  const [slotValues, setSlotValues] = useState<Array<string | null>>(() => Array(bootstrapRound.letters.length).fill(null));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [roundSolved, setRoundSolved] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [inputPaused, setInputPaused] = useState(false);
  const [statusKey, setStatusKey] = useState('games.spellAndSendPostOffice.instructions.intro');
  const [statusTone, setStatusTone] = useState<Tone>('neutral');
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stage2PlusHintsUsed, setStage2PlusHintsUsed] = useState(0);
  const [stage3HintsUsed, setStage3HintsUsed] = useState(0);
  const [wrongPulseSlotIndex, setWrongPulseSlotIndex] = useState<number | null>(null);
  const [stageRoundCount, setStageRoundCount] = useState(0);
  const [weakBlockStreak, setWeakBlockStreak] = useState(0);
  const [independentPassCount, setIndependentPassCount] = useState(0);
  const [supportedPassCount, setSupportedPassCount] = useState(0);

  const completionSentRef = useRef(false);
  const stageRoundsRef = useRef<RoundTelemetry[]>([]);
  const sessionRoundsRef = useRef<RoundTelemetry[]>([]);
  const successRotationRef = useRef(0);
  const stagePointersRef = useRef<Record<SpellStage, number>>({ L1: 0, L2A: 0, L2B: 0, L3A: 0, L3B: 0 });
  const l2bQueueRef = useRef<L2BBlockRound[]>([]);
  const l2bFamilyPointerRef = useRef(0);
  const l2bPointersRef = useRef<L2BBlockPointers>({ target: 0, filler: 0 });
  const l3bContextPointerRef = useRef(0);
  const decoyPointerRef = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPlacementTimesRef = useRef<number[]>([]);
  const missTimesRef = useRef<number[]>([]);
  const antiGuessCooldownUntilRef = useRef(0);
  const lastInteractionAtRef = useRef(Date.now());
  const slotErrorSetRef = useRef<Set<number>>(new Set());
  const finalSlotWrongRef = useRef(false);
  const firstSlotHintedRef = useRef(false);
  const autoRevealedSlotsRef = useRef(0);
  const roundWrongCountRef = useRef(0);
  const firstTryCorrectSlotsRef = useRef(0);
  const activeL2BFamilyRef = useRef<FinalFormFamily | null>(null);
  const supportModeRef = useRef(false);
  const decoyReductionRoundsRemainingRef = useRef(0);

  const activeSlotIndex = useMemo(() => slotValues.findIndex((value) => value === null), [slotValues]);

  const replayGlyph = rtlReplayGlyph(isRtl);
  const nextGlyph = rtlNextGlyph(isRtl);

  const stageProgressPercent = useMemo(() => {
    const target = STAGE_TARGET_ROUNDS[currentStage];
    if (target <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((stageRoundCount / target) * 100)));
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

  const playSegmentedWord = useCallback(
    async (mode: AudioMode = 'queue') => {
      const firstPath = resolveAudioPathFromKey(round.segmentedPart1Key, 'common');
      const secondPath = resolveAudioPathFromKey(round.segmentedPart2Key, 'common');

      if (mode === 'interrupt') {
        await audio.playNow(firstPath);
        await audio.play(secondPath);
        return;
      }

      await audio.playSequence([firstPath, secondPath]);
    },
    [audio, round.segmentedPart1Key, round.segmentedPart2Key],
  );

  const playTargetWord = useCallback(
    async (mode: AudioMode = 'queue') => {
      const promptPath = resolveAudioPathFromKey('games.spellAndSendPostOffice.prompts.listen.targetWord', 'common');
      const wordPath = resolveAudioPathFromKey(round.wordKey, 'common');

      if (mode === 'interrupt') {
        await audio.playNow(promptPath);
        await audio.play(wordPath);
        return;
      }

      await audio.playSequence([promptPath, wordPath]);
    },
    [audio, round.wordKey],
  );

  const setStatusWithAudio = useCallback(
    (nextStatusKey: string, tone: Tone, mode: AudioMode = 'queue') => {
      setStatusKey(nextStatusKey);
      setStatusTone(tone);
      void playAudioKey(nextStatusKey, mode).catch(() => {
        // Keep the UI responsive even if audio files are unavailable.
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

  const clearWrongPulse = useCallback(() => {
    if (wrongPulseTimerRef.current) {
      clearTimeout(wrongPulseTimerRef.current);
    }

    wrongPulseTimerRef.current = setTimeout(() => {
      setWrongPulseSlotIndex(null);
      wrongPulseTimerRef.current = null;
    }, 260);
  }, []);

  const touchInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now();
  }, []);

  const buildBankLetters = useCallback(
    (letters: readonly string[], stage: SpellStage) => {
      const targetCounts = new Map<string, number>();
      for (const letter of letters) {
        targetCounts.set(letter, (targetCounts.get(letter) ?? 0) + 1);
      }

      const bank: string[] = [];
      for (const [letter, count] of targetCounts.entries()) {
        for (let index = 0; index < count; index += 1) {
          bank.push(letter);
        }
      }

      const baseDecoyCount = resolveBaseDecoyCount(stage);
      const supportAdjustedBase = supportModeRef.current ? Math.max(1, baseDecoyCount - 1) : baseDecoyCount;
      const decoyCount = resolveDecoyCount(supportAdjustedBase, decoyReductionRoundsRemainingRef.current > 0);

      const decoyCandidates = allLetterPool.filter((letter) => !targetCounts.has(letter));
      for (let index = 0; index < decoyCount; index += 1) {
        if (decoyCandidates.length === 0) {
          break;
        }
        const candidate = decoyCandidates[(decoyPointerRef.current + index) % decoyCandidates.length];
        if (candidate) {
          bank.push(candidate);
        }
      }

      decoyPointerRef.current += decoyCount;
      return shuffleArray(bank);
    },
    [allLetterPool],
  );

  const createRound = useCallback(
    (stage: SpellStage): ActiveRound => {
      let wordId: WordId;
      let finalFormTarget = false;
      let finalFormFamily: FinalFormFamily | null = null;
      let phraseContextWordId: WordId | null = null;

      if (stage === 'L1') {
        const pointer = stagePointersRef.current.L1;
        wordId = L1_WORD_IDS[pointer % L1_WORD_IDS.length];
        stagePointersRef.current.L1 += 1;
      } else if (stage === 'L2A') {
        const pointer = stagePointersRef.current.L2A;
        wordId = L2A_WORD_IDS[pointer % L2A_WORD_IDS.length];
        stagePointersRef.current.L2A += 1;
      } else if (stage === 'L2B') {
        if (l2bQueueRef.current.length === 0) {
          const family = FINAL_FORM_FAMILIES[l2bFamilyPointerRef.current % FINAL_FORM_FAMILIES.length];
          l2bFamilyPointerRef.current += 1;
          l2bQueueRef.current = buildL2BBlock(family, l2bPointersRef.current);
        }

        const l2bRound = l2bQueueRef.current.shift();
        if (l2bRound) {
          wordId = l2bRound.wordId;
          finalFormTarget = l2bRound.finalFormTarget;
          finalFormFamily = l2bRound.finalFormFamily;
          activeL2BFamilyRef.current = l2bRound.finalFormFamily;
        } else {
          wordId = L2A_WORD_IDS[stagePointersRef.current.L2A % L2A_WORD_IDS.length];
          stagePointersRef.current.L2A += 1;
        }
      } else if (stage === 'L3A') {
        const pointer = stagePointersRef.current.L3A;
        wordId = L3A_WORD_IDS[pointer % L3A_WORD_IDS.length];
        stagePointersRef.current.L3A += 1;
      } else {
        const pointer = stagePointersRef.current.L3B;
        wordId = L3B_TARGET_WORD_IDS[pointer % L3B_TARGET_WORD_IDS.length];
        stagePointersRef.current.L3B += 1;
        phraseContextWordId = L3B_CONTEXT_WORD_IDS[l3bContextPointerRef.current % L3B_CONTEXT_WORD_IDS.length];
        l3bContextPointerRef.current += 1;
      }

      const definition = WORD_DEFINITIONS[wordId];
      const letters = toLetterTilesFromWord(t(definition.wordKey as never));
      const inferredFamily = resolveFinalFormFamily(letters[letters.length - 1] ?? '');

      return {
        stage,
        wordId,
        wordKey: definition.wordKey,
        segmentedPart1Key: definition.segmentedPart1Key,
        segmentedPart2Key: definition.segmentedPart2Key,
        letters,
        bankLetters: buildBankLetters(letters, stage),
        finalFormTarget,
        finalFormFamily: finalFormTarget ? (finalFormFamily ?? inferredFamily) : null,
        phraseContextWordId,
      };
    },
    [buildBankLetters, t],
  );

  const resetRoundRuntime = useCallback(
    (nextRound: ActiveRound) => {
      setSlotValues(Array(nextRound.letters.length).fill(null));
      setSelectedSlotIndex(0);
      setSelectedTile(null);
      setRoundSolved(false);
      setHintStep(0);
      setHintsUsed(0);
      setStage2PlusHintsUsed(0);
      setStage3HintsUsed(0);
      setWrongPulseSlotIndex(null);
      setInputPaused(false);

      wrongPlacementTimesRef.current = [];
      missTimesRef.current = [];
      slotErrorSetRef.current = new Set();
      finalSlotWrongRef.current = false;
      firstSlotHintedRef.current = false;
      autoRevealedSlotsRef.current = 0;
      roundWrongCountRef.current = 0;
      firstTryCorrectSlotsRef.current = 0;
      lastInteractionAtRef.current = Date.now();

      const promptKey = nextRound.stage === 'L3B'
        ? 'games.spellAndSendPostOffice.prompts.phraseBridge.missingWord'
        : 'games.spellAndSendPostOffice.prompts.encode.placeFirstLetter';

      setStatusWithAudio(promptKey, 'neutral', 'queue');
      if (nextRound.stage === 'L2B') {
        setStatusWithAudio('games.spellAndSendPostOffice.hints.finalFormCue', 'hint', 'queue');
      }
    },
    [setStatusWithAudio],
  );

  const playLetterAudio = useCallback(
    (letter: string) => {
      const key = toLetterAudioKey(letter);
      void playAudioKey(key, 'interrupt').catch(() => {
        // Audio fallback is best-effort only.
      });
    },
    [playAudioKey],
  );

  const registerWrongPlacement = useCallback(
    (slotIndex: number) => {
      const now = Date.now();
      roundWrongCountRef.current += 1;
      missTimesRef.current.push(now);
      wrongPlacementTimesRef.current.push(now);
      slotErrorSetRef.current.add(slotIndex);

      if (slotIndex === round.letters.length - 1) {
        finalSlotWrongRef.current = true;
      }

      setWrongPulseSlotIndex(slotIndex);
      clearWrongPulse();

      if (now < antiGuessCooldownUntilRef.current) {
        setStatusWithAudio('games.spellAndSendPostOffice.feedback.retry.gentle', 'error', 'interrupt');
        return;
      }

      const tier = evaluateAntiGuessTier({
        nowMs: now,
        wrongPlacementTimes: wrongPlacementTimesRef.current,
        missTimes: missTimesRef.current,
      });

      if (tier === 2) {
        antiGuessCooldownUntilRef.current = now + 1600;
        decoyReductionRoundsRemainingRef.current = 2;
        pauseInput(1200);
        setStatusWithAudio('games.spellAndSendPostOffice.hints.antiGuessTier2ModeledRecovery', 'hint', 'interrupt');
        void playSegmentedWord('queue').catch(() => {
          // Keep interaction responsive if segmented clips are missing.
        });
        return;
      }

      if (tier === 1) {
        antiGuessCooldownUntilRef.current = now + 1200;
        pauseInput(900);
        setStatusWithAudio('games.spellAndSendPostOffice.hints.antiGuessTier1Reset', 'hint', 'interrupt');
        void playTargetWord('queue').catch(() => {
          // Keep interaction responsive if target clip is missing.
        });
        return;
      }

      setStatusWithAudio('games.spellAndSendPostOffice.feedback.retry.focusCurrentSlot', 'error', 'interrupt');
    },
    [clearWrongPulse, pauseInput, playSegmentedWord, playTargetWord, round.letters.length, setStatusWithAudio],
  );

  const attemptPlaceTile = useCallback(
    (tile: string, requestedSlotIndex?: number) => {
      if (sessionCompleted || inputPaused || roundSolved) {
        return;
      }

      const slotIndex = typeof requestedSlotIndex === 'number' ? requestedSlotIndex : activeSlotIndex;
      if (slotIndex < 0 || slotIndex >= round.letters.length) {
        return;
      }

      if (slotValues[slotIndex] !== null) {
        return;
      }

      touchInteraction();
      playLetterAudio(tile);

      const expectedLetter = round.letters[slotIndex];
      if (tile !== expectedLetter) {
        registerWrongPlacement(slotIndex);
        return;
      }

      if (!slotErrorSetRef.current.has(slotIndex)) {
        firstTryCorrectSlotsRef.current += 1;
      }

      setSlotValues((previous) => {
        const next = [...previous];
        next[slotIndex] = tile;
        return next;
      });

      setSelectedTile(null);
      setSelectedSlotIndex(Math.min(slotIndex + 1, round.letters.length - 1));

      const solvedAfterPlacement = slotValues.filter((value) => value !== null).length + 1 === round.letters.length;
      if (solvedAfterPlacement) {
        const successKey = SUCCESS_ROTATION[successRotationRef.current % SUCCESS_ROTATION.length];
        successRotationRef.current += 1;
        setRoundSolved(true);
        setStatusWithAudio(successKey, 'success', 'interrupt');
      } else {
        setStatusWithAudio('games.spellAndSendPostOffice.prompts.encode.placeNextLetter', 'neutral', 'queue');
      }
    },
    [
      activeSlotIndex,
      inputPaused,
      playLetterAudio,
      registerWrongPlacement,
      round.letters,
      roundSolved,
      sessionCompleted,
      setStatusWithAudio,
      slotValues,
      touchInteraction,
    ],
  );

  const handleReplay = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    touchInteraction();
    setStatusWithAudio('games.spellAndSendPostOffice.controls.replayCue', 'neutral', 'interrupt');
    void playTargetWord('queue').catch(() => {
      // Keep replay non-blocking.
    });
  }, [playTargetWord, sessionCompleted, setStatusWithAudio, touchInteraction]);

  const handleRetryWord = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    touchInteraction();
    missTimesRef.current.push(Date.now());
    const refreshedRound = createRound(currentStage);
    setRound(refreshedRound);
    resetRoundRuntime(refreshedRound);
    setStatusWithAudio('games.spellAndSendPostOffice.feedback.retry.gentle', 'hint', 'interrupt');
  }, [createRound, currentStage, resetRoundRuntime, sessionCompleted, setStatusWithAudio, touchInteraction]);

  const handleHint = useCallback(() => {
    if (sessionCompleted || roundSolved) {
      return;
    }

    touchInteraction();

    const nextStep = Math.min(3, hintStep + 1);
    setHintStep(nextStep);
    setHintsUsed((value) => value + 1);

    if (nextStep >= 2) {
      setStage2PlusHintsUsed((value) => value + 1);
    }

    if (nextStep === 1) {
      setStatusWithAudio('games.spellAndSendPostOffice.hints.stage1ReplayWord', 'hint', 'interrupt');
      void playTargetWord('queue').catch(() => {
        // Keep hint interactions non-blocking.
      });
      return;
    }

    if (nextStep === 2) {
      if (slotValues[0] === null) {
        firstSlotHintedRef.current = true;
      }
      setStatusWithAudio('games.spellAndSendPostOffice.hints.stage2SegmentedWord', 'hint', 'interrupt');
      void playSegmentedWord('queue').catch(() => {
        // Keep hint interactions non-blocking.
      });
      return;
    }

    setStage3HintsUsed((value) => value + 1);
    const revealSlot = activeSlotIndex >= 0 ? activeSlotIndex : round.letters.length - 1;
    const revealedLetter = round.letters[revealSlot];
    slotErrorSetRef.current.add(revealSlot);
    autoRevealedSlotsRef.current += 1;
    if (revealSlot === 0) {
      firstSlotHintedRef.current = true;
    }

    setSlotValues((previous) => {
      const next = [...previous];
      next[revealSlot] = revealedLetter;
      return next;
    });

    setWrongPulseSlotIndex(revealSlot);
    clearWrongPulse();
    setStatusWithAudio('games.spellAndSendPostOffice.hints.stage3RevealSlot', 'hint', 'interrupt');

    const solvedAfterReveal = slotValues.filter((value) => value !== null).length + 1 === round.letters.length;
    if (solvedAfterReveal) {
      setRoundSolved(true);
      setStatusWithAudio('games.spellAndSendPostOffice.feedback.success.supportedPass', 'success', 'queue');
    }
  }, [
    activeSlotIndex,
    clearWrongPulse,
    hintStep,
    playSegmentedWord,
    playTargetWord,
    round.letters,
    roundSolved,
    sessionCompleted,
    setStatusWithAudio,
    slotValues,
    touchInteraction,
  ]);

  const finalizeSession = useCallback(
    (allRounds: readonly RoundTelemetry[]) => {
      if (completionSentRef.current) {
        return;
      }

      completionSentRef.current = true;
      setSessionCompleted(true);

      const firstTryWordCount = allRounds.filter((entry) => entry.roundFirstTryCorrect).length;
      const firstTryWordRate = toPercent(firstTryWordCount, allRounds.length);
      const firstTrySlotCount = allRounds.reduce((sum, entry) => sum + entry.firstTryCorrectSlots, 0);
      const totalSlots = allRounds.reduce((sum, entry) => sum + entry.totalSlots, 0);
      const firstTrySlotAccuracy = toPercent(firstTrySlotCount, totalSlots);
      const finalFormRounds = allRounds.filter((entry) => entry.finalFormTarget);
      const finalFormCorrect = finalFormRounds.filter((entry) => entry.finalFormCorrect).length;
      const finalFormAccuracy = toPercent(finalFormCorrect, finalFormRounds.length);
      const focusFamily = activeL2BFamilyRef.current
        ? t(FINAL_FORM_FAMILY_LABEL_KEY[activeL2BFamilyRef.current] as never)
        : t('letters.pronunciation.nun');

      const completion: SpellAndSendCompletionResult = {
        completed: true,
        stars: toStars(firstTryWordRate),
        score: firstTryWordRate,
        roundsCompleted: allRounds.length,
        summaryMetrics: {
          highestStableRange: toStableRange(firstTryWordRate),
          firstAttemptSuccessRate: firstTryWordRate,
          hintTrend: toHintTrend(allRounds),
          decodeAccuracy: firstTrySlotAccuracy,
          sequenceEvidenceScore: finalFormAccuracy,
          ageBand: '6-7',
        },
        independentPassCount,
        supportedPassCount,
        firstTrySlotAccuracy,
        finalFormAccuracy,
        focusFamily,
      };

      setStatusWithAudio('games.spellAndSendPostOffice.completion.title', 'success', 'interrupt');
      onComplete(completion);
    },
    [independentPassCount, onComplete, setStatusWithAudio, supportedPassCount, t],
  );

  const commitRoundAndAdvance = useCallback(() => {
    if (!roundSolved || sessionCompleted) {
      return;
    }

    const finalSlotIndex = round.letters.length - 1;
    const telemetry: RoundTelemetry = {
      stage: currentStage,
      firstSlotFirstTry: !slotErrorSetRef.current.has(0) && !firstSlotHintedRef.current,
      roundFirstTryCorrect: roundWrongCountRef.current === 0 && hintsUsed === 0 && autoRevealedSlotsRef.current === 0,
      firstTryCorrectSlots: firstTryCorrectSlotsRef.current,
      totalSlots: round.letters.length,
      hintsUsed,
      stage2PlusHints: stage2PlusHintsUsed,
      stage3Hints: stage3HintsUsed,
      finalFormTarget: round.finalFormTarget,
      finalFormCorrect:
        round.finalFormTarget && !slotErrorSetRef.current.has(finalSlotIndex) && !finalSlotWrongRef.current,
      independentCompletion: hintsUsed === 0 && autoRevealedSlotsRef.current === 0,
    };

    const nextStageRounds = [...stageRoundsRef.current, telemetry];
    const nextSessionRounds = [...sessionRoundsRef.current, telemetry];

    stageRoundsRef.current = nextStageRounds;
    sessionRoundsRef.current = nextSessionRounds;
    setStageRoundCount(nextStageRounds.length);

    if (decoyReductionRoundsRemainingRef.current > 0) {
      decoyReductionRoundsRemainingRef.current = Math.max(0, decoyReductionRoundsRemainingRef.current - 1);
    }

    const stageTarget = STAGE_TARGET_ROUNDS[currentStage];
    if (nextStageRounds.length < stageTarget) {
      const nextRound = createRound(currentStage);
      setRound(nextRound);
      resetRoundRuntime(nextRound);
      return;
    }

    const evaluation = evaluateStageBlock(currentStage, nextStageRounds);

    if (evaluation.passType === 'independent-pass') {
      setIndependentPassCount((value) => value + 1);
      setStatusWithAudio('games.spellAndSendPostOffice.feedback.success.independentPass', 'success', 'interrupt');
    } else {
      setSupportedPassCount((value) => value + 1);
      setStatusWithAudio('games.spellAndSendPostOffice.feedback.success.supportedPass', 'hint', 'interrupt');
    }

    stageRoundsRef.current = [];
    setStageRoundCount(0);

    let nextStageValue = currentStage;
    let nextSupportMode = false;
    let nextWeakStreak = evaluation.weakBlock ? weakBlockStreak + 1 : 0;

    if (evaluation.passed) {
      nextSupportMode = false;
      nextWeakStreak = 0;
      const promotedStage = nextStage(currentStage);
      if (promotedStage) {
        nextStageValue = promotedStage;
        setCurrentStage(promotedStage);
        setStatusWithAudio('games.spellAndSendPostOffice.feedback.success.transition.nextBlock', 'success', 'queue');
      } else {
        finalizeSession(nextSessionRounds);
        return;
      }
    } else {
      nextSupportMode = true;
      if (nextWeakStreak >= 2) {
        nextStageValue = previousStage(currentStage);
        nextWeakStreak = 0;
        setCurrentStage(nextStageValue);
        setStatusWithAudio('games.spellAndSendPostOffice.feedback.retry.modeledSegmentThenTry', 'hint', 'queue');
      }
    }

    supportModeRef.current = nextSupportMode;
    setWeakBlockStreak(nextWeakStreak);

    const nextRound = createRound(nextStageValue);
    setRound(nextRound);
    resetRoundRuntime(nextRound);
  }, [
    createRound,
    currentStage,
    finalizeSession,
    hintsUsed,
    resetRoundRuntime,
    round.finalFormTarget,
    round.letters.length,
    roundSolved,
    sessionCompleted,
    setStatusWithAudio,
    stage2PlusHintsUsed,
    stage3HintsUsed,
    weakBlockStreak,
  ]);

  const handleSlotTap = useCallback(
    (slotIndex: number) => {
      if (sessionCompleted || inputPaused || roundSolved) {
        return;
      }

      touchInteraction();
      if (selectedTile) {
        attemptPlaceTile(selectedTile, slotIndex);
        return;
      }

      setSelectedSlotIndex(slotIndex);
    },
    [attemptPlaceTile, inputPaused, roundSolved, selectedTile, sessionCompleted, touchInteraction],
  );

  const handleTileTap = useCallback(
    (tile: string) => {
      if (sessionCompleted || inputPaused || roundSolved) {
        return;
      }

      touchInteraction();

      if (selectedSlotIndex >= 0 && slotValues[selectedSlotIndex] === null) {
        attemptPlaceTile(tile, selectedSlotIndex);
        return;
      }

      setSelectedTile((current) => (current === tile ? null : tile));
      playLetterAudio(tile);
    },
    [
      attemptPlaceTile,
      inputPaused,
      playLetterAudio,
      roundSolved,
      selectedSlotIndex,
      sessionCompleted,
      slotValues,
      touchInteraction,
    ],
  );

  const handleTileDragStart = useCallback((event: DragEvent<HTMLButtonElement>, tile: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tile);
  }, []);

  const handleSlotDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>, slotIndex: number) => {
      event.preventDefault();
      if (sessionCompleted || inputPaused || roundSolved) {
        return;
      }

      const tile = event.dataTransfer.getData('text/plain');
      if (!tile) {
        return;
      }

      attemptPlaceTile(tile, slotIndex);
    },
    [attemptPlaceTile, inputPaused, roundSolved, sessionCompleted],
  );

  useEffect(() => {
    setStatusWithAudio('games.spellAndSendPostOffice.instructions.intro', 'neutral', 'interrupt');
    void playTargetWord('queue').catch(() => {
      // Startup audio is best-effort.
    });
  }, [playTargetWord, setStatusWithAudio]);

  useEffect(() => {
    resetRoundRuntime(bootstrapRound);
  }, [bootstrapRound, resetRoundRuntime]);

  useEffect(() => {
    if (sessionCompleted || roundSolved || inputPaused) {
      return;
    }

    const timer = setInterval(() => {
      const idleMs = Date.now() - lastInteractionAtRef.current;
      if (idleMs < 6000) {
        return;
      }

      lastInteractionAtRef.current = Date.now();
      setStatusWithAudio('games.spellAndSendPostOffice.prompts.inactivity.replayAfterPause', 'hint', 'interrupt');
      void playTargetWord('queue').catch(() => {
        // Keep idle nudges non-blocking.
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [inputPaused, playTargetWord, roundSolved, sessionCompleted, setStatusWithAudio]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      if (wrongPulseTimerRef.current) {
        clearTimeout(wrongPulseTimerRef.current);
      }
    };
  }, []);

  return (
    <Card padding="lg" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <header className="post-office__header">
        <div>
          <p className="post-office__stage-label">{t(STAGE_PROMPT_KEY[currentStage] as never)}</p>
          <p className={`post-office__status post-office__status--${statusTone}`}>{t(statusKey as never)}</p>
        </div>
        <div className="post-office__progress" aria-live="polite">
          <p className="post-office__progress-label">
            {stageRoundCount}/{STAGE_TARGET_ROUNDS[currentStage]}
          </p>
          <div className="post-office__progress-track" role="presentation" aria-hidden="true">
            <div className="post-office__progress-fill" style={{ inlineSize: `${stageProgressPercent}%` }} />
          </div>
        </div>
      </header>

      {round.stage === 'L3B' && round.phraseContextWordId ? (
        <section className="post-office__phrase" aria-live="polite">
          <p>{t('games.spellAndSendPostOffice.prompts.phraseBridge.readTwoWords')}</p>
          <p>
            {t(`words.pronunciation.${round.phraseContextWordId}` as never)}
            {' '}
            ____
          </p>
        </section>
      ) : null}

      <section className="post-office__slots" dir="rtl" role="group" aria-label={t('games.spellAndSendPostOffice.instructions.fillSlotsRtl')}>
        {round.letters.map((_, slotIndex) => {
          const slotValue = slotValues[slotIndex];
          const isActiveSlot = slotIndex === (activeSlotIndex >= 0 ? activeSlotIndex : selectedSlotIndex);
          const isWrongPulse = wrongPulseSlotIndex === slotIndex;

          return (
            <button
              key={`slot-${round.wordId}-${slotIndex}`}
              type="button"
              className={[
                'post-office__slot',
                slotValue ? 'is-filled' : '',
                isActiveSlot ? 'is-active' : '',
                isWrongPulse ? 'is-wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSlotTap(slotIndex)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => handleSlotDrop(event, slotIndex)}
              aria-label={t('games.spellAndSendPostOffice.instructions.tapSlotThenTile')}
            >
              {slotValue ?? '○'}
            </button>
          );
        })}
      </section>

      <section className="post-office__bank" dir="rtl" role="group" aria-label={t('games.spellAndSendPostOffice.instructions.oneActionPerStep')}>
        {round.bankLetters.map((letter, tileIndex) => (
          <button
            key={`tile-${round.wordId}-${tileIndex}-${letter}`}
            type="button"
            className={['post-office__tile', selectedTile === letter ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => handleTileTap(letter)}
            onDoubleClick={() => attemptPlaceTile(letter)}
            draggable={!sessionCompleted && !inputPaused && !roundSolved}
            onDragStart={(event) => handleTileDragStart(event, letter)}
            aria-label={t(toLetterAudioKey(letter) as never)}
          >
            {letter}
          </button>
        ))}
      </section>

      <footer className="post-office__controls" role="group" aria-label={t('games.spellAndSendPostOffice.title')}>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleReplay}
          disabled={sessionCompleted}
          aria-label={t('games.spellAndSendPostOffice.controls.replay')}
        >
          <span aria-hidden="true">{replayGlyph}</span>
          <span style={visuallyHiddenStyle}>{t('games.spellAndSendPostOffice.controls.replay')}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleRetryWord}
          disabled={sessionCompleted}
          aria-label={t('games.spellAndSendPostOffice.controls.retry')}
        >
          <span aria-hidden="true">↻</span>
          <span style={visuallyHiddenStyle}>{t('games.spellAndSendPostOffice.controls.retry')}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleHint}
          disabled={sessionCompleted || roundSolved}
          aria-label={t('games.spellAndSendPostOffice.controls.hint')}
        >
          <span aria-hidden="true">💡</span>
          <span style={visuallyHiddenStyle}>{t('games.spellAndSendPostOffice.controls.hint')}</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={commitRoundAndAdvance}
          disabled={sessionCompleted || !roundSolved}
          aria-label={t('games.spellAndSendPostOffice.controls.next')}
        >
          <span aria-hidden="true">{nextGlyph}</span>
          <span style={visuallyHiddenStyle}>{t('games.spellAndSendPostOffice.controls.next')}</span>
        </Button>
      </footer>

      <section className="post-office__meta" aria-live="polite">
        <p>
          {t('parentDashboard.games.spellAndSendPostOffice.progressSummary', {
            firstTrySlotAccuracy: `${toPercent(
              sessionRoundsRef.current.reduce((sum, entry) => sum + entry.firstTryCorrectSlots, 0),
              sessionRoundsRef.current.reduce((sum, entry) => sum + entry.totalSlots, 0),
            )}`,
            independentPassRate: `${toPercent(
              sessionRoundsRef.current.filter((entry) => entry.independentCompletion).length,
              sessionRoundsRef.current.length,
            )}`,
          })}
        </p>
        <p>
          {t('parentDashboard.games.spellAndSendPostOffice.finalFormAccuracy', {
            finalFormAccuracy: `${toPercent(
              sessionRoundsRef.current.filter((entry) => entry.finalFormCorrect).length,
              sessionRoundsRef.current.filter((entry) => entry.finalFormTarget).length,
            )}`,
            focusFamily: activeL2BFamilyRef.current
              ? t(FINAL_FORM_FAMILY_LABEL_KEY[activeL2BFamilyRef.current] as never)
              : t('letters.pronunciation.nun'),
          })}
        </p>
      </section>

      <style>{`
        .post-office__header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: var(--space-sm);
          align-items: center;
        }

        .post-office__stage-label {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }

        .post-office__status {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .post-office__status--success {
          color: var(--color-success-700, #117a38);
        }

        .post-office__status--hint {
          color: var(--color-warning-700, #9a5a00);
        }

        .post-office__status--error {
          color: var(--color-danger-700, #9f1239);
        }

        .post-office__progress {
          min-inline-size: 160px;
          display: grid;
          gap: 6px;
        }

        .post-office__progress-label {
          margin: 0;
          text-align: end;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        .post-office__progress-track {
          inline-size: 100%;
          block-size: 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-surface-muted) 70%, transparent);
          overflow: hidden;
        }

        .post-office__progress-fill {
          block-size: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--color-primary-500), var(--color-success-500, #22c55e));
          transition: inline-size 220ms ease;
        }

        .post-office__phrase {
          margin: 0;
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--color-primary-100) 50%, transparent);
          color: var(--color-text-primary);
          display: grid;
          gap: 4px;
        }

        .post-office__phrase p {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
        }

        .post-office__slots {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(52px, 1fr));
          gap: var(--space-sm);
        }

        .post-office__slot {
          min-inline-size: 52px;
          min-block-size: 56px;
          border-radius: var(--radius-md);
          border: 2px dashed color-mix(in srgb, var(--color-primary-400) 55%, transparent);
          background: var(--color-surface-primary);
          color: var(--color-text-primary);
          font-size: 1.6rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }

        .post-office__slot.is-active {
          border-style: solid;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-300) 55%, transparent);
        }

        .post-office__slot.is-filled {
          border-style: solid;
          border-color: color-mix(in srgb, var(--color-success-500, #22c55e) 60%, transparent);
          background: color-mix(in srgb, var(--color-success-100, #dcfce7) 70%, var(--color-surface-primary));
        }

        .post-office__slot.is-wrong {
          border-color: var(--color-danger-500, #ef4444);
          animation: post-office-wrong-pulse 240ms ease;
        }

        .post-office__bank {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
          gap: var(--space-sm);
        }

        .post-office__tile {
          min-inline-size: 58px;
          min-block-size: 58px;
          border-radius: var(--radius-md);
          border: 2px solid color-mix(in srgb, var(--color-primary-400) 55%, transparent);
          background: var(--color-surface-primary);
          color: var(--color-text-primary);
          font-size: 1.6rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
          touch-action: manipulation;
        }

        .post-office__tile:hover,
        .post-office__tile:focus-visible {
          transform: translateY(-1px);
          border-color: var(--color-primary-500);
          box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-300) 30%, transparent);
        }

        .post-office__tile.is-selected {
          border-color: var(--color-primary-600);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-300) 60%, transparent);
        }

        .post-office__controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(44px, 1fr));
          gap: var(--space-sm);
        }

        .post-office__controls :global(button) {
          min-block-size: 52px;
        }

        .post-office__meta {
          display: grid;
          gap: 4px;
          color: var(--color-text-secondary);
          font-size: 0.95rem;
        }

        .post-office__meta p {
          margin: 0;
        }

        @keyframes post-office-wrong-pulse {
          0% {
            transform: translateY(0);
          }
          45% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .post-office__status {
            font-size: 1.05rem;
          }

          .post-office__slot,
          .post-office__tile {
            min-block-size: 54px;
            font-size: 1.45rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .post-office__progress-fill,
          .post-office__slot,
          .post-office__tile {
            transition: none;
          }

          .post-office__slot.is-wrong {
            animation: none;
          }
        }
      `}</style>
    </Card>
  );
}
