import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlProgressGradient, rtlReplayGlyph } from '@/lib/rtlChrome';

type StageId = 'L1' | 'L2A' | 'L2B' | 'L3A' | 'L3B';
type ActionMode = 'match' | 'missing' | 'order';
type StatusTone = 'neutral' | 'hint' | 'success' | 'error';
type PointingProfile = 'full' | 'partial' | 'mostly';
type WordPronunciationKey = `words.pronunciation.${string}`;
type SentencePronunciationKey = `sentences.pronunciation.${string}`;

interface StageRoundTemplate {
  sentenceKey: SentencePronunciationKey;
  targetWordKey: WordPronunciationKey;
  action?: ActionMode;
  orderWordKeys?: WordPronunciationKey[];
}

interface TokenAttemptRecord {
  firstTryCorrect: boolean;
  hintPressCount: number;
}

interface TokenPolicyState {
  exposures: number;
  restoreRemaining: number;
  fadedMissesInBlock: number;
  recentPointedAttempts: TokenAttemptRecord[];
}

interface StageTracker {
  total: number;
  correct: number;
  stage2PlusHints: number;
  stage3Hints: number;
  partialTargetTotal: number;
  partialTargetCorrect: number;
  fadedTargetTotal: number;
  fadedTargetCorrect: number;
}

interface ProfileTracker {
  total: number;
  correct: number;
}

interface CompletionBreakdown {
  fullPointingAccuracy: number;
  partialPointingAccuracy: number;
  mostlyUnpointedAccuracy: number;
}

export interface PointingFadeBridgeCompletion extends GameCompletionResult {
  independentRate?: number;
  pointingProfileBreakdown?: CompletionBreakdown;
}

interface ParsedToken {
  raw: string;
  core: string;
  suffix: string;
  signature: string;
}

const STAGE_ORDER: StageId[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B'];

const STAGE_ROUND_TARGETS: Record<StageId, number> = {
  L1: 10,
  L2A: 10,
  L2B: 20,
  L3A: 5,
  L3B: 15,
};

const BASE_OPTION_COUNT: Record<StageId, number> = {
  L1: 2,
  L2A: 3,
  L2B: 3,
  L3A: 4,
  L3B: 4,
};

const STAGE_PROFILE: Record<StageId, PointingProfile> = {
  L1: 'full',
  L2A: 'partial',
  L2B: 'partial',
  L3A: 'mostly',
  L3B: 'mostly',
};

const STAGE_PROMPT_KEY: Record<StageId, string> = {
  L1: 'games.pointingFadeBridge.prompts.stages.l1FullyPointed',
  L2A: 'games.pointingFadeBridge.prompts.stages.l2aControlledPartial',
  L2B: 'games.pointingFadeBridge.prompts.stages.l2bDeeperPartial',
  L3A: 'games.pointingFadeBridge.prompts.stages.l3aMostlyUnpointed',
  L3B: 'games.pointingFadeBridge.prompts.stages.l3bMixedAction',
};

const STAGE_GATE_AUDIO_KEY: Record<Exclude<StageId, 'L3B'>, string> = {
  L1: 'games.pointingFadeBridge.progression.gates.l1ToL2a',
  L2A: 'games.pointingFadeBridge.progression.gates.l2aToL2b',
  L2B: 'games.pointingFadeBridge.progression.gates.l2bToL3a',
  L3A: 'games.pointingFadeBridge.progression.gates.l3aToL3b',
};

const SUCCESS_KEYS = [
  'games.pointingFadeBridge.feedback.success.decodeWithoutFullPointing',
  'games.pointingFadeBridge.feedback.success.trackedTarget',
  'games.pointingFadeBridge.feedback.success.independentRead',
] as const;

const WORD_POOL: WordPronunciationKey[] = [
  'words.pronunciation.dubi',
  'words.pronunciation.kore',
  'words.pronunciation.bagan',
  'words.pronunciation.haver',
  'words.pronunciation.halach',
  'words.pronunciation.shaar',
  'words.pronunciation.mila',
  'words.pronunciation.hadasha',
  'words.pronunciation.mispat',
  'words.pronunciation.katsar',
  'words.pronunciation.hasera',
  'words.pronunciation.milim',
  'words.pronunciation.ets',
  'words.pronunciation.ratzef',
  'words.pronunciation.seder',
];

const STAGE_TEMPLATES: Record<StageId, StageRoundTemplate[]> = {
  L1: [
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL1Set1',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL1Set1',
      targetWordKey: 'words.pronunciation.kore',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL1Set2',
      targetWordKey: 'words.pronunciation.haver',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL1Set2',
      targetWordKey: 'words.pronunciation.dubi',
    },
  ],
  L2A: [
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2aSet1',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2aSet1',
      targetWordKey: 'words.pronunciation.kore',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2aSet2',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2aSet2',
      targetWordKey: 'words.pronunciation.halach',
    },
  ],
  L2B: [
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2bSet1',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2bSet1',
      targetWordKey: 'words.pronunciation.kore',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2bSet2',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL2bSet2',
      targetWordKey: 'words.pronunciation.halach',
    },
  ],
  L3A: [
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3aSet1',
      targetWordKey: 'words.pronunciation.dubi',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3aSet1',
      targetWordKey: 'words.pronunciation.kore',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3aSet2',
      targetWordKey: 'words.pronunciation.mila',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3aSet2',
      targetWordKey: 'words.pronunciation.hadasha',
    },
  ],
  L3B: [
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3bSet1',
      targetWordKey: 'words.pronunciation.mispat',
      action: 'match',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3bSet1',
      targetWordKey: 'words.pronunciation.hasera',
      action: 'missing',
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3bSet2',
      targetWordKey: 'words.pronunciation.milim',
      action: 'order',
      orderWordKeys: ['words.pronunciation.dubi', 'words.pronunciation.milim', 'words.pronunciation.seder'],
    },
    {
      sentenceKey: 'sentences.pronunciation.pointingFadeBridgeL3bSet2',
      targetWordKey: 'words.pronunciation.seder',
      action: 'match',
    },
  ],
};

const EMPTY_STAGE_TRACKER: StageTracker = {
  total: 0,
  correct: 0,
  stage2PlusHints: 0,
  stage3Hints: 0,
  partialTargetTotal: 0,
  partialTargetCorrect: 0,
  fadedTargetTotal: 0,
  fadedTargetCorrect: 0,
};

const EMPTY_PROFILE_TRACKER: ProfileTracker = {
  total: 0,
  correct: 0,
};

const DEFAULT_TOKEN_POLICY: TokenPolicyState = {
  exposures: 0,
  restoreRemaining: 0,
  fadedMissesInBlock: 0,
  recentPointedAttempts: [],
};

const ANTI_RANDOM = {
  tier1TapThreshold: 4,
  tier1WindowMs: 1500,
  tier1PauseMs: 900,
  tier2TapThreshold: 6,
  tier2TapWindowMs: 2500,
  tier2MissThreshold: 3,
  tier2MissWindowMs: 20000,
  tier2PauseMs: 1200,
  reducedOptionsRounds: 2,
} as const;

const CHOICE_ICON: Record<ActionMode, string> = {
  match: '🎯',
  missing: '🧩',
  order: '🔢',
};

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  inlineSize: 1,
  blockSize: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  border: 0,
};

function createStageTrackerMap(): Record<StageId, StageTracker> {
  return {
    L1: { ...EMPTY_STAGE_TRACKER },
    L2A: { ...EMPTY_STAGE_TRACKER },
    L2B: { ...EMPTY_STAGE_TRACKER },
    L3A: { ...EMPTY_STAGE_TRACKER },
    L3B: { ...EMPTY_STAGE_TRACKER },
  };
}

function createProfileTrackerMap(): Record<PointingProfile, ProfileTracker> {
  return {
    full: { ...EMPTY_PROFILE_TRACKER },
    partial: { ...EMPTY_PROFILE_TRACKER },
    mostly: { ...EMPTY_PROFILE_TRACKER },
  };
}

function stripNikud(value: string): string {
  return value.normalize('NFC').replace(/[\u0591-\u05C7]/g, '');
}

function normalizeSignature(value: string): string {
  return stripNikud(value).replace(/[^א-ת]/g, '');
}

function parseSentenceTokens(sentence: string): ParsedToken[] {
  return sentence
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => {
      const match = token.match(/^(.*?)([.!,?:;]+)?$/u);
      const core = match?.[1] ?? token;
      const suffix = match?.[2] ?? '';
      return {
        raw: token,
        core,
        suffix,
        signature: normalizeSignature(core),
      };
    });
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function deterministicOrder<T>(items: readonly T[], seedKey: string, toKey: (item: T) => string): T[] {
  return [...items].sort((left, right) => {
    const leftHash = hashSeed(`${seedKey}:${toKey(left)}`);
    const rightHash = hashSeed(`${seedKey}:${toKey(right)}`);
    if (leftHash === rightHash) {
      return toKey(left).localeCompare(toKey(right));
    }
    return leftHash - rightHash;
  });
}

function toStableRangeFromAccuracy(accuracy: number): StableRange {
  if (accuracy >= 85) {
    return '1-10';
  }

  if (accuracy >= 70) {
    return '1-5';
  }

  return '1-3';
}

function toHintTrend(stage3HintRounds: number, totalRounds: number): HintTrend {
  if (totalRounds <= 0) {
    return 'steady';
  }

  const ratio = stage3HintRounds / totalRounds;
  if (ratio <= 0.08) {
    return 'improving';
  }

  if (ratio <= 0.2) {
    return 'steady';
  }

  return 'needs_support';
}

function toStars(accuracy: number, independentRate: number): 1 | 2 | 3 {
  if (accuracy >= 85 && independentRate >= 75) {
    return 3;
  }

  if (accuracy >= 70 && independentRate >= 55) {
    return 2;
  }

  return 1;
}

function isTargetEligibleForFade(state: TokenPolicyState): boolean {
  if (state.exposures < 2) {
    return false;
  }

  if (state.restoreRemaining > 0) {
    return false;
  }

  const recentAttempts = state.recentPointedAttempts.slice(-3);
  if (recentAttempts.length < 3) {
    return false;
  }

  const firstTryCorrect = recentAttempts.filter((attempt) => attempt.firstTryCorrect).length;
  const hintPressCount = recentAttempts.reduce((sum, attempt) => sum + attempt.hintPressCount, 0);

  return firstTryCorrect >= 2 && hintPressCount <= 1;
}

function nextStageId(stage: StageId): StageId | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index === -1 || index === STAGE_ORDER.length - 1) {
    return null;
  }

  return STAGE_ORDER[index + 1] ?? null;
}

function previousStageId(stage: StageId): StageId {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) {
    return 'L1';
  }

  return STAGE_ORDER[index - 1] ?? 'L1';
}

function evaluateGate(stage: StageId, tracker: StageTracker): boolean {
  if (stage === 'L1') {
    return tracker.correct >= 8 && tracker.stage2PlusHints <= 2;
  }

  if (stage === 'L2A') {
    const partialAccuracy = tracker.partialTargetTotal > 0
      ? tracker.partialTargetCorrect / tracker.partialTargetTotal
      : tracker.correct / Math.max(1, tracker.total);
    return tracker.correct >= 7 && partialAccuracy >= 0.75;
  }

  if (stage === 'L2B') {
    const fadedAccuracy = tracker.fadedTargetTotal > 0
      ? tracker.fadedTargetCorrect / tracker.fadedTargetTotal
      : tracker.correct / Math.max(1, tracker.total);
    return tracker.correct >= 16 && fadedAccuracy >= 0.8;
  }

  if (stage === 'L3A') {
    return tracker.correct >= 4 && tracker.stage2PlusHints <= 1;
  }

  return tracker.correct >= 12 && tracker.stage3Hints <= 1;
}

export function PointingFadeBridgeGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');

  const tr = useCallback((key: string): string => String(t(key as any)), [t]);

  const [currentStage, setCurrentStage] = useState<StageId>('L1');
  const [stageRoundIndex, setStageRoundIndex] = useState(0);
  const [stageTrackers, setStageTrackers] = useState<Record<StageId, StageTracker>>(() => createStageTrackerMap());
  const [profileTrackers, setProfileTrackers] = useState<Record<PointingProfile, ProfileTracker>>(() => createProfileTrackerMap());
  const [tokenPolicy, setTokenPolicy] = useState<Record<string, TokenPolicyState>>({});

  const [roundMisses, setRoundMisses] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(false);
  const [roundResolved, setRoundResolved] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [hintStage, setHintStage] = useState(0);
  const [hintPressCount, setHintPressCount] = useState(0);
  const [stage2PlusHintUsed, setStage2PlusHintUsed] = useState(false);
  const [stage3HintUsed, setStage3HintUsed] = useState(false);
  const [decodeAttempted, setDecodeAttempted] = useState(false);
  const [targetRevealUsed, setTargetRevealUsed] = useState(false);
  const [targetRevealActive, setTargetRevealActive] = useState(false);
  const [forcePointedRound, setForcePointedRound] = useState(false);
  const [roundStartedFaded, setRoundStartedFaded] = useState(false);
  const [orderProgress, setOrderProgress] = useState<string[]>([]);

  const [reducedOptionsRoundsRemaining, setReducedOptionsRoundsRemaining] = useState(0);
  const [guidedRoundsRemaining, setGuidedRoundsRemaining] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [statusKey, setStatusKey] = useState('games.pointingFadeBridge.instructions.intro');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const [showCelebration, setShowCelebration] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const completionSentRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const incorrectTapTimesRef = useRef<number[]>([]);
  const missTimesRef = useRef<number[]>([]);
  const rollingAccuracyRef = useRef<boolean[]>([]);

  const isRtl = isRtlDirection(i18n.dir());
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);

  const activeStageTemplates = STAGE_TEMPLATES[currentStage];
  const activeTemplate = activeStageTemplates[stageRoundIndex % activeStageTemplates.length] ?? activeStageTemplates[0];

  const sentenceText = tr(activeTemplate.sentenceKey);
  const parsedTokens = useMemo(() => parseSentenceTokens(sentenceText), [sentenceText]);

  const targetPointedWord = tr(activeTemplate.targetWordKey);
  const targetPlainWord = stripNikud(targetPointedWord);
  const targetSignature = normalizeSignature(targetPointedWord);

  const targetTokenIndex = useMemo(() => {
    const byExact = parsedTokens.findIndex((token) => token.signature === targetSignature);
    if (byExact >= 0) {
      return byExact;
    }

    const bySuffix = parsedTokens.findIndex(
      (token) => token.signature.endsWith(targetSignature) || targetSignature.endsWith(token.signature),
    );

    if (bySuffix >= 0) {
      return bySuffix;
    }

    return 0;
  }, [parsedTokens, targetSignature]);

  const targetPolicyState = tokenPolicy[targetSignature] ?? DEFAULT_TOKEN_POLICY;
  const stageAllowsFade = currentStage !== 'L1';
  const shouldForcePointedByGuide = guidedRoundsRemaining > 0;

  const targetCanFade = stageAllowsFade
    && !shouldForcePointedByGuide
    && !forcePointedRound
    && isTargetEligibleForFade(targetPolicyState);

  const targetDisplayedAsFaded = roundStartedFaded && !targetRevealActive && !forcePointedRound && !shouldForcePointedByGuide;

  const actionMode: ActionMode = currentStage === 'L3B'
    ? activeTemplate.action ?? (stageRoundIndex % 3 === 0 ? 'match' : stageRoundIndex % 3 === 1 ? 'missing' : 'order')
    : 'match';

  const effectiveOptionCount = Math.max(
    2,
    BASE_OPTION_COUNT[currentStage] - (reducedOptionsRoundsRemaining > 0 ? 1 : 0),
  );

  const optionWordKeys = useMemo(() => {
    const pool = WORD_POOL.filter((wordKey) => wordKey !== activeTemplate.targetWordKey);
    const desiredDistractorCount = Math.max(1, effectiveOptionCount - 1);
    const orderedPool = deterministicOrder(pool, `${currentStage}:${stageRoundIndex}:${targetSignature}`, (item) => item);
    const distractors = orderedPool.slice(0, desiredDistractorCount);

    return deterministicOrder(
      [activeTemplate.targetWordKey, ...distractors],
      `options:${currentStage}:${stageRoundIndex}`,
      (item) => item,
    );
  }, [activeTemplate.targetWordKey, currentStage, effectiveOptionCount, stageRoundIndex, targetSignature]);

  const orderWordKeys = useMemo<WordPronunciationKey[]>(() => {
    const explicit = activeTemplate.orderWordKeys;
    if (explicit && explicit.length >= 2) {
      return explicit;
    }

    const fallback = [activeTemplate.targetWordKey, ...optionWordKeys.filter((key) => key !== activeTemplate.targetWordKey)]
      .slice(0, 3);

    return fallback as WordPronunciationKey[];
  }, [activeTemplate.orderWordKeys, activeTemplate.targetWordKey, optionWordKeys]);

  const orderExpectedSignatures = useMemo(
    () => orderWordKeys.map((wordKey) => normalizeSignature(tr(wordKey))),
    [orderWordKeys, tr],
  );

  const orderButtons = useMemo(
    () => deterministicOrder(orderWordKeys, `order:${currentStage}:${stageRoundIndex}`, (item) => item),
    [currentStage, orderWordKeys, stageRoundIndex],
  );

  const sentenceDisplayTokens = useMemo(() => {
    return parsedTokens.map((token, index) => {
      if (index !== targetTokenIndex) {
        return token.raw;
      }

      const displayCore = targetDisplayedAsFaded ? targetPlainWord : targetPointedWord;
      return `${displayCore}${token.suffix}`;
    });
  }, [parsedTokens, targetDisplayedAsFaded, targetPlainWord, targetPointedWord, targetTokenIndex]);

  const bridgeMeterPercent = useMemo(() => {
    const totalRoundTarget = STAGE_ORDER.reduce((sum, stage) => sum + STAGE_ROUND_TARGETS[stage], 0);
    const completedRounds = STAGE_ORDER.reduce((sum, stage) => {
      if (stage === currentStage) {
        return sum + stageRoundIndex;
      }

      if (STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf(currentStage)) {
        return sum + STAGE_ROUND_TARGETS[stage];
      }

      return sum;
    }, 0);

    return Math.round((completedRounds / Math.max(1, totalRoundTarget)) * 100);
  }, [currentStage, stageRoundIndex]);

  const stagePromptKey = STAGE_PROMPT_KEY[currentStage];
  const stageRoundTarget = STAGE_ROUND_TARGETS[currentStage];

  const playKey = useCallback(
    async (key: string, interrupt = false) => {
      const audioPath = resolveAudioPathFromKey(key, 'common');
      try {
        if (interrupt) {
          await audio.playNow(audioPath);
        } else {
          await audio.play(audioPath);
        }
      } catch (error) {
        console.warn('PointingFadeBridge audio playback failed', { key, error });
        setAudioPlaybackFailed(true);
      }
    },
    [audio],
  );

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const registerValidDecodeAction = useCallback(() => {
    incorrectTapTimesRef.current = [];
  }, []);

  const triggerTier1AntiRandom = useCallback(() => {
    if (inputLocked || sessionCompleted) {
      return;
    }

    setInputLocked(true);
    setStatusTone('hint');
    setStatusKey('games.pointingFadeBridge.hints.antiRandomTapTier1');
    void playKey('games.pointingFadeBridge.hints.antiRandomTapTier1', true);

    scheduleTimeout(() => {
      setInputLocked(false);
      void playKey(activeTemplate.sentenceKey, true);
    }, ANTI_RANDOM.tier1PauseMs);
  }, [activeTemplate.sentenceKey, inputLocked, playKey, scheduleTimeout, sessionCompleted]);

  const triggerTier2AntiRandom = useCallback(() => {
    if (inputLocked || sessionCompleted) {
      return;
    }

    setInputLocked(true);
    setReducedOptionsRoundsRemaining((previous) => Math.max(previous, ANTI_RANDOM.reducedOptionsRounds));
    setTargetRevealActive(true);
    setTargetRevealUsed(true);
    setStage2PlusHintUsed(true);
    setStage3HintUsed(true);
    setHintStage(3);
    setHintPressCount((previous) => previous + 1);
    setStatusTone('hint');
    setStatusKey('games.pointingFadeBridge.hints.antiRandomTapTier2');
    void playKey('games.pointingFadeBridge.hints.antiRandomTapTier2', true);

    scheduleTimeout(() => {
      setInputLocked(false);
      void playKey('games.pointingFadeBridge.feedback.retry.modeledReadThenTry', true);
      void playKey(activeTemplate.targetWordKey, false);
    }, ANTI_RANDOM.tier2PauseMs);
  }, [activeTemplate.targetWordKey, inputLocked, playKey, scheduleTimeout, sessionCompleted]);

  const registerInvalidInteraction = useCallback(
    (isMiss: boolean) => {
      const now = performance.now();

      incorrectTapTimesRef.current = incorrectTapTimesRef.current.filter(
        (timestamp) => now - timestamp <= ANTI_RANDOM.tier2TapWindowMs,
      );
      incorrectTapTimesRef.current.push(now);

      if (isMiss) {
        missTimesRef.current = missTimesRef.current.filter((timestamp) => now - timestamp <= ANTI_RANDOM.tier2MissWindowMs);
        missTimesRef.current.push(now);
      }

      const tier2TapCount = incorrectTapTimesRef.current.filter(
        (timestamp) => now - timestamp <= ANTI_RANDOM.tier2TapWindowMs,
      ).length;
      const tier1TapCount = incorrectTapTimesRef.current.filter(
        (timestamp) => now - timestamp <= ANTI_RANDOM.tier1WindowMs,
      ).length;
      const tier2MissCount = missTimesRef.current.filter(
        (timestamp) => now - timestamp <= ANTI_RANDOM.tier2MissWindowMs,
      ).length;

      if (tier2TapCount >= ANTI_RANDOM.tier2TapThreshold || tier2MissCount >= ANTI_RANDOM.tier2MissThreshold) {
        triggerTier2AntiRandom();
        return;
      }

      if (tier1TapCount >= ANTI_RANDOM.tier1TapThreshold) {
        triggerTier1AntiRandom();
      }
    },
    [triggerTier1AntiRandom, triggerTier2AntiRandom],
  );

  useEffect(() => {
    if (sessionCompleted) {
      return;
    }

    setRoundMisses(0);
    setFirstTryCorrect(false);
    setRoundResolved(false);
    setRoundCorrect(false);
    setHintStage(0);
    setHintPressCount(0);
    setStage2PlusHintUsed(false);
    setStage3HintUsed(false);
    setDecodeAttempted(false);
    setTargetRevealUsed(false);
    setTargetRevealActive(false);
    setForcePointedRound(guidedRoundsRemaining > 0);
    setOrderProgress([]);
    setRoundStartedFaded(targetCanFade);

    if (stageRoundIndex === 0) {
      setStatusKey(stagePromptKey);
      setStatusTone('neutral');
      void playKey(stagePromptKey, true);
    } else {
      setStatusKey('games.pointingFadeBridge.prompts.decodeAttempt.readThenChoose');
      setStatusTone('neutral');
      void playKey('games.pointingFadeBridge.prompts.decodeAttempt.readThenChoose', true);
    }

    void playKey(activeTemplate.sentenceKey, false);
  }, [
    activeTemplate.sentenceKey,
    guidedRoundsRemaining,
    playKey,
    sessionCompleted,
    stagePromptKey,
    stageRoundIndex,
    targetCanFade,
  ]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = [];
    };
  }, []);

  const completeRoundWithResult = useCallback(
    (isCorrect: boolean) => {
      setRoundResolved(true);
      setRoundCorrect(isCorrect);

      if (isCorrect) {
        setFirstTryCorrect(roundMisses === 0);
        const successKey = SUCCESS_KEYS[(stageRoundIndex + STAGE_ORDER.indexOf(currentStage)) % SUCCESS_KEYS.length] ?? SUCCESS_KEYS[0];
        setStatusTone('success');
        setStatusKey(successKey);
        void playKey(successKey, true);
        setShowCelebration(true);
        scheduleTimeout(() => {
          setShowCelebration(false);
        }, 650);
      } else {
        setStatusTone('error');
        setStatusKey('games.pointingFadeBridge.feedback.retry.modeledReadThenTry');
        void playKey('games.pointingFadeBridge.feedback.retry.modeledReadThenTry', true);
      }
    },
    [currentStage, playKey, roundMisses, scheduleTimeout, stageRoundIndex],
  );

  const registerMiss = useCallback(() => {
    const nextMisses = roundMisses + 1;
    setRoundMisses(nextMisses);
    setStatusTone('error');
    registerInvalidInteraction(true);

    if (nextMisses === 1) {
      setHintStage((previous) => Math.max(previous, 1));
      setHintPressCount((previous) => previous + 1);
      setStatusKey('games.pointingFadeBridge.hints.stage1ReplaySentence');
      void playKey('games.pointingFadeBridge.hints.stage1ReplaySentence', true);
      void playKey(activeTemplate.sentenceKey, false);
      return;
    }

    if (nextMisses === 2) {
      setHintStage((previous) => Math.max(previous, 2));
      setHintPressCount((previous) => previous + 1);
      setStage2PlusHintUsed(true);
      setStatusKey('games.pointingFadeBridge.hints.stage2HighlightBoundary');
      void playKey('games.pointingFadeBridge.hints.stage2HighlightBoundary', true);
      return;
    }

    setHintStage(3);
    setHintPressCount((previous) => previous + 1);
    setStage2PlusHintUsed(true);
    setStage3HintUsed(true);
    setTargetRevealActive(true);
    completeRoundWithResult(false);
  }, [
    activeTemplate.sentenceKey,
    completeRoundWithResult,
    playKey,
    registerInvalidInteraction,
    roundMisses,
  ]);

  const handleMatchChoice = useCallback(
    (wordKey: WordPronunciationKey) => {
      if (inputLocked || sessionCompleted || roundResolved) {
        return;
      }

      setDecodeAttempted(true);
      void playKey(wordKey, true);

      if (wordKey === activeTemplate.targetWordKey) {
        registerValidDecodeAction();
        completeRoundWithResult(true);
        return;
      }

      registerMiss();
    },
    [
      activeTemplate.targetWordKey,
      completeRoundWithResult,
      inputLocked,
      playKey,
      registerMiss,
      registerValidDecodeAction,
      roundResolved,
      sessionCompleted,
    ],
  );

  const handleOrderChoice = useCallback(
    (wordKey: WordPronunciationKey) => {
      if (inputLocked || sessionCompleted || roundResolved) {
        return;
      }

      const signature = normalizeSignature(tr(wordKey));
      const expectedSignature = orderExpectedSignatures[orderProgress.length] ?? '';

      setDecodeAttempted(true);
      void playKey(wordKey, true);

      if (signature !== expectedSignature) {
        setOrderProgress([]);
        registerMiss();
        return;
      }

      const nextProgress = [...orderProgress, signature];
      setOrderProgress(nextProgress);
      registerValidDecodeAction();

      if (nextProgress.length >= orderExpectedSignatures.length) {
        completeRoundWithResult(true);
      }
    },
    [
      completeRoundWithResult,
      inputLocked,
      orderExpectedSignatures,
      orderProgress,
      playKey,
      registerMiss,
      registerValidDecodeAction,
      roundResolved,
      sessionCompleted,
      tr,
    ],
  );

  const handleControlReplay = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    setStatusTone('neutral');
    setStatusKey('games.pointingFadeBridge.controls.replayCue');
    void playKey('games.pointingFadeBridge.controls.replayCue', true);
    void playKey(activeTemplate.sentenceKey, false);
  }, [activeTemplate.sentenceKey, playKey, sessionCompleted]);

  const handleControlRetry = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    setInputLocked(false);
    setRoundMisses(0);
    setFirstTryCorrect(false);
    setRoundResolved(false);
    setRoundCorrect(false);
    setHintStage(0);
    setHintPressCount(0);
    setStage2PlusHintUsed(false);
    setStage3HintUsed(false);
    setDecodeAttempted(false);
    setTargetRevealUsed(false);
    setTargetRevealActive(false);
    setForcePointedRound(true);
    setRoundStartedFaded(false);
    setOrderProgress([]);
    setStatusTone('hint');
    setStatusKey('games.pointingFadeBridge.feedback.retry.gentle');
    void playKey('games.pointingFadeBridge.controls.retryCue', true);
    void playKey('games.pointingFadeBridge.feedback.retry.gentle', false);
    void playKey(activeTemplate.sentenceKey, false);
  }, [activeTemplate.sentenceKey, playKey, sessionCompleted]);

  const handleControlHint = useCallback(() => {
    if (inputLocked || sessionCompleted || roundResolved) {
      return;
    }

    void playKey('games.pointingFadeBridge.controls.hintCue', true);

    const nextStage = Math.min(3, hintStage + 1);
    if (nextStage === 3 && !decodeAttempted) {
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.hints.decodeAttemptFirst');
      registerInvalidInteraction(false);
      void playKey('games.pointingFadeBridge.hints.decodeAttemptFirst', true);
      return;
    }

    if (nextStage === 3 && targetRevealUsed) {
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.hints.revealOncePerRound');
      void playKey('games.pointingFadeBridge.hints.revealOncePerRound', true);
      return;
    }

    setHintStage(nextStage);
    setHintPressCount((previous) => previous + 1);

    if (nextStage >= 2) {
      setStage2PlusHintUsed(true);
    }

    if (nextStage === 1) {
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.hints.stage1ReplaySentence');
      void playKey('games.pointingFadeBridge.hints.stage1ReplaySentence', true);
      void playKey(activeTemplate.sentenceKey, false);
      return;
    }

    if (nextStage === 2) {
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.hints.stage2HighlightBoundary');
      void playKey('games.pointingFadeBridge.hints.stage2HighlightBoundary', true);
      return;
    }

    setStage3HintUsed(true);
    setTargetRevealUsed(true);
    setTargetRevealActive(true);
    setStatusTone('hint');
    setStatusKey('games.pointingFadeBridge.hints.stage3RevealOneToken');
    void playKey('games.pointingFadeBridge.hints.stage3RevealOneToken', true);
  }, [
    activeTemplate.sentenceKey,
    decodeAttempted,
    hintStage,
    inputLocked,
    playKey,
    registerInvalidInteraction,
    roundResolved,
    sessionCompleted,
    targetRevealUsed,
  ]);

  const finalizeCompletion = useCallback(
    (
      nextStageTrackers: Record<StageId, StageTracker>,
      nextProfileTrackers: Record<PointingProfile, ProfileTracker>,
    ) => {
      const totalRounds = Object.values(nextStageTrackers).reduce((sum, tracker) => sum + tracker.total, 0);
      const totalCorrect = Object.values(nextStageTrackers).reduce((sum, tracker) => sum + tracker.correct, 0);
      const totalStage3Hints = Object.values(nextStageTrackers).reduce((sum, tracker) => sum + tracker.stage3Hints, 0);
      const independentRounds = Object.values(nextStageTrackers).reduce(
        (sum, tracker) => sum + Math.max(0, tracker.correct - tracker.stage2PlusHints),
        0,
      );

      const accuracy = Math.round((totalCorrect / Math.max(1, totalRounds)) * 100);
      const independentRate = Math.round((independentRounds / Math.max(1, totalRounds)) * 100);

      const fullPointingAccuracy = Math.round(
        (nextProfileTrackers.full.correct / Math.max(1, nextProfileTrackers.full.total)) * 100,
      );
      const partialPointingAccuracy = Math.round(
        (nextProfileTrackers.partial.correct / Math.max(1, nextProfileTrackers.partial.total)) * 100,
      );
      const mostlyUnpointedAccuracy = Math.round(
        (nextProfileTrackers.mostly.correct / Math.max(1, nextProfileTrackers.mostly.total)) * 100,
      );

      const completion: PointingFadeBridgeCompletion = {
        completed: true,
        score: accuracy,
        stars: toStars(accuracy, independentRate),
        roundsCompleted: totalRounds,
        summaryMetrics: {
          highestStableRange: toStableRangeFromAccuracy(accuracy),
          firstAttemptSuccessRate: accuracy,
          hintTrend: toHintTrend(totalStage3Hints, totalRounds),
          ageBand: '6-7',
          decodeAccuracy: accuracy,
          sequenceEvidenceScore: independentRate,
          gatePassed: true,
        },
        independentRate,
        pointingProfileBreakdown: {
          fullPointingAccuracy,
          partialPointingAccuracy,
          mostlyUnpointedAccuracy,
        },
      };

      setStatusTone('success');
      setStatusKey('games.pointingFadeBridge.completion.summary');
      setSessionCompleted(true);
      setInputLocked(true);
      void playKey('games.pointingFadeBridge.completion.title', true);
      void playKey('games.pointingFadeBridge.completion.nextStep', false);

      if (!completionSentRef.current) {
        completionSentRef.current = true;
        onComplete(completion);
      }
    },
    [onComplete, playKey],
  );

  const handleControlNext = useCallback(() => {
    if (sessionCompleted || inputLocked) {
      return;
    }

    void playKey('games.pointingFadeBridge.controls.nextCue', true);

    if (!roundResolved) {
      setStatusTone('hint');
      if (!decodeAttempted) {
        setStatusKey('games.pointingFadeBridge.prompts.decodeAttempt.tryBeforeHint');
        void playKey('games.pointingFadeBridge.prompts.decodeAttempt.tryBeforeHint', true);
      } else {
        setStatusKey('games.pointingFadeBridge.feedback.retry.replayThenTry');
        void playKey('games.pointingFadeBridge.feedback.retry.replayThenTry', true);
      }
      registerInvalidInteraction(false);
      return;
    }

    const currentTracker = stageTrackers[currentStage];
    const nextTracker: StageTracker = {
      ...currentTracker,
      total: currentTracker.total + 1,
      correct: currentTracker.correct + (roundCorrect ? 1 : 0),
      stage2PlusHints: currentTracker.stage2PlusHints + (stage2PlusHintUsed ? 1 : 0),
      stage3Hints: currentTracker.stage3Hints + (stage3HintUsed ? 1 : 0),
      partialTargetTotal: currentTracker.partialTargetTotal + (roundStartedFaded && currentStage !== 'L1' ? 1 : 0),
      partialTargetCorrect:
        currentTracker.partialTargetCorrect + (roundStartedFaded && currentStage !== 'L1' && roundCorrect ? 1 : 0),
      fadedTargetTotal: currentTracker.fadedTargetTotal + (roundStartedFaded && currentStage === 'L2B' ? 1 : 0),
      fadedTargetCorrect:
        currentTracker.fadedTargetCorrect + (roundStartedFaded && currentStage === 'L2B' && roundCorrect ? 1 : 0),
    };

    const nextStageTrackers = {
      ...stageTrackers,
      [currentStage]: nextTracker,
    };

    const currentProfile = STAGE_PROFILE[currentStage];
    const nextProfileTrackers = {
      ...profileTrackers,
      [currentProfile]: {
        total: profileTrackers[currentProfile].total + 1,
        correct: profileTrackers[currentProfile].correct + (roundCorrect ? 1 : 0),
      },
    };

    const tokenState = tokenPolicy[targetSignature] ?? DEFAULT_TOKEN_POLICY;
    const updatedTokenState: TokenPolicyState = {
      exposures: tokenState.exposures + 1,
      restoreRemaining: tokenState.restoreRemaining,
      fadedMissesInBlock: tokenState.fadedMissesInBlock,
      recentPointedAttempts: [...tokenState.recentPointedAttempts],
    };

    if (roundStartedFaded && !roundCorrect) {
      updatedTokenState.fadedMissesInBlock += 1;
      if (updatedTokenState.fadedMissesInBlock >= 2) {
        updatedTokenState.restoreRemaining = 3;
        updatedTokenState.fadedMissesInBlock = 0;
        setStatusTone('hint');
        setStatusKey('games.pointingFadeBridge.hints.restorePointingAfterMisses');
        void playKey('games.pointingFadeBridge.hints.restorePointingAfterMisses', true);
      }
    }

    if (!roundStartedFaded || forcePointedRound || shouldForcePointedByGuide) {
      updatedTokenState.recentPointedAttempts = [
        ...updatedTokenState.recentPointedAttempts,
        {
          firstTryCorrect,
          hintPressCount,
        },
      ].slice(-3);
    }

    if (updatedTokenState.restoreRemaining > 0) {
      updatedTokenState.restoreRemaining -= 1;
    }

    const nextTokenPolicy = {
      ...tokenPolicy,
      [targetSignature]: updatedTokenState,
    };

    rollingAccuracyRef.current = [...rollingAccuracyRef.current, roundCorrect].slice(-6);
    const rollingAccuracy = rollingAccuracyRef.current.filter(Boolean).length / Math.max(1, rollingAccuracyRef.current.length);
    const shouldTriggerGuidedRecovery =
      rollingAccuracyRef.current.length >= 6
      && rollingAccuracy < 0.6
      && currentStage !== 'L1'
      && guidedRoundsRemaining === 0;

    if (shouldTriggerGuidedRecovery) {
      setGuidedRoundsRemaining(3);
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.progression.recovery.accuracyDropStepBack');
      void playKey('games.pointingFadeBridge.progression.recovery.accuracyDropStepBack', true);
    }

    const nextRoundCounter = stageRoundIndex + 1;
    const completedStage = nextRoundCounter >= stageRoundTarget;
    const nextReducedOptionsRounds = Math.max(0, reducedOptionsRoundsRemaining - 1);
    const nextGuidedRounds = Math.max(0, guidedRoundsRemaining - 1);

    setStageTrackers(nextStageTrackers);
    setProfileTrackers(nextProfileTrackers);
    setTokenPolicy(nextTokenPolicy);
    setReducedOptionsRoundsRemaining(nextReducedOptionsRounds);
    setGuidedRoundsRemaining(nextGuidedRounds);

    if (!completedStage) {
      setStageRoundIndex(nextRoundCounter);
      return;
    }

    if (!evaluateGate(currentStage, nextTracker)) {
      setStageTrackers((previous) => ({
        ...previous,
        [currentStage]: { ...EMPTY_STAGE_TRACKER },
      }));
      setStageRoundIndex(0);
      setGuidedRoundsRemaining(3);
      setStatusTone('hint');
      setStatusKey('games.pointingFadeBridge.progression.recovery.familyReset');
      void playKey('games.pointingFadeBridge.progression.recovery.familyReset', true);
      return;
    }

    const nextStage = nextStageId(currentStage);
    if (!nextStage) {
      finalizeCompletion(nextStageTrackers, nextProfileTrackers);
      return;
    }

    setCurrentStage(nextStage);
    setStageRoundIndex(0);

    setTokenPolicy((previous) => {
      const resetPolicy: Record<string, TokenPolicyState> = {};
      Object.entries(previous).forEach(([signature, state]) => {
        resetPolicy[signature] = {
          ...state,
          fadedMissesInBlock: 0,
        };
      });
      return resetPolicy;
    });

    setStatusTone('success');
    setStatusKey('games.pointingFadeBridge.feedback.success.transition.nextStage');
    void playKey('games.pointingFadeBridge.feedback.success.transition.nextStage', true);

    if (currentStage in STAGE_GATE_AUDIO_KEY) {
      const gateAudioKey = STAGE_GATE_AUDIO_KEY[currentStage as Exclude<StageId, 'L3B'>];
      if (gateAudioKey) {
        void playKey(gateAudioKey, false);
      }
    }

    if (nextGuidedRounds > 0) {
      setCurrentStage(previousStageId(nextStage));
    }
  }, [
    currentStage,
    decodeAttempted,
    finalizeCompletion,
    firstTryCorrect,
    forcePointedRound,
    guidedRoundsRemaining,
    hintPressCount,
    inputLocked,
    playKey,
    profileTrackers,
    reducedOptionsRoundsRemaining,
    registerInvalidInteraction,
    roundCorrect,
    roundResolved,
    roundStartedFaded,
    sessionCompleted,
    shouldForcePointedByGuide,
    stage2PlusHintUsed,
    stage3HintUsed,
    stageRoundIndex,
    stageRoundTarget,
    stageTrackers,
    targetSignature,
    tokenPolicy,
  ]);

  const instructionText = sessionCompleted ? tr('games.pointingFadeBridge.completion.summary') : tr(statusKey);

  return (
    <Card padding="lg" className="pointing-bridge__shell">
      {showCelebration ? <SuccessCelebration className="pointing-bridge__celebration" /> : null}

      <header className="pointing-bridge__header">
        <div className="pointing-bridge__headline">
          <h2>{tr('games.pointingFadeBridge.title')}</h2>
          <p>{tr('games.pointingFadeBridge.subtitle')}</p>
          <div className="pointing-bridge__stage-chip" aria-live="polite">
            <span>{tr(stagePromptKey)}</span>
            <button
              type="button"
              className="pointing-bridge__audio-inline"
              aria-label={tr('games.pointingFadeBridge.controls.replay')}
              onClick={() => {
                void playKey(stagePromptKey, true);
              }}
            >
              {replayIcon}
            </button>
          </div>
        </div>

        <div className="pointing-bridge__mascot" aria-hidden="true">
          <MascotIllustration variant={sessionCompleted ? 'success' : statusTone === 'error' ? 'hint' : 'hero'} size={56} />
        </div>
      </header>

      <section className="pointing-bridge__meter" aria-label={tr('games.pointingFadeBridge.prompts.transition.bridgeMeterUp')}>
        <div className="pointing-bridge__meter-bar" style={{ ['--bridge-meter' as string]: `${bridgeMeterPercent}%` }}>
          <span>{bridgeMeterPercent}%</span>
        </div>
        <p>
          {tr('games.pointingFadeBridge.prompts.decodeAttempt.rtlOrder')} · {stageRoundIndex + 1}/{stageRoundTarget}
        </p>
      </section>

      {audioPlaybackFailed ? (
        <p className="pointing-bridge__audio-fallback" aria-live="polite">
          {tr('games.pointingFadeBridge.instructions.tapReplay')}
        </p>
      ) : null}

      {!sessionCompleted ? (
        <>
          <section className="pointing-bridge__sentence-card" aria-live="polite">
            <div className="pointing-bridge__line-with-audio">
              <p>{tr('games.pointingFadeBridge.prompts.decodeAttempt.readThenChoose')}</p>
              <button
                type="button"
                className="pointing-bridge__audio-inline"
                aria-label={tr('games.pointingFadeBridge.controls.replay')}
                onClick={() => {
                  void playKey('games.pointingFadeBridge.prompts.decodeAttempt.readThenChoose', true);
                }}
              >
                {replayIcon}
              </button>
            </div>

            <div className="pointing-bridge__line-with-audio">
              <p className="pointing-bridge__sentence" dir="rtl">
                {sentenceDisplayTokens.map((token, index) => {
                  const isTarget = index === targetTokenIndex;
                  const isMissingToken = actionMode === 'missing' && isTarget;
                  return (
                    <span
                      key={`${index}:${token}`}
                      className={`pointing-bridge__token ${isTarget ? 'is-target' : ''} ${hintStage >= 2 && isTarget ? 'is-highlighted' : ''}`}
                    >
                      {isMissingToken ? '____' : token}
                    </span>
                  );
                })}
              </p>
              <button
                type="button"
                className="pointing-bridge__audio-inline"
                aria-label={tr('games.pointingFadeBridge.controls.replay')}
                onClick={() => {
                  void playKey(activeTemplate.sentenceKey, true);
                }}
              >
                {replayIcon}
              </button>
            </div>
          </section>

          <section className="pointing-bridge__status-card">
            <div className="pointing-bridge__line-with-audio">
              <p className={`pointing-bridge__status-text is-${statusTone}`}>{instructionText}</p>
              <button
                type="button"
                className="pointing-bridge__audio-inline"
                aria-label={tr('games.pointingFadeBridge.controls.replay')}
                onClick={() => {
                  void playKey(statusKey, true);
                }}
              >
                {replayIcon}
              </button>
            </div>

            {actionMode === 'order' ? (
              <div className="pointing-bridge__order-grid" role="group" aria-label={tr('games.pointingFadeBridge.instructions.decodeFirst')}>
                {orderButtons.map((wordKey) => {
                  const wordText = tr(wordKey);
                  const signature = normalizeSignature(wordText);
                  const isDone = orderProgress.includes(signature);
                  const icon = isDone ? '✅' : CHOICE_ICON.order;
                  return (
                    <button
                      key={wordKey}
                      type="button"
                      className={`pointing-bridge__choice ${isDone ? 'is-done' : ''}`}
                      onClick={() => handleOrderChoice(wordKey)}
                      disabled={inputLocked || roundResolved || isDone}
                    >
                      <span className="pointing-bridge__choice-icon" aria-hidden="true">
                        {icon}
                      </span>
                      <span className="pointing-bridge__choice-label">{wordText}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="pointing-bridge__choice-grid" role="group" aria-label={tr('games.pointingFadeBridge.instructions.decodeFirst')}>
                {optionWordKeys.map((wordKey) => {
                  const pointed = tr(wordKey);
                  const plain = stripNikud(pointed);
                  const isTarget = wordKey === activeTemplate.targetWordKey;
                  const label = isTarget && targetDisplayedAsFaded ? plain : pointed;
                  const icon = actionMode === 'missing' ? CHOICE_ICON.missing : CHOICE_ICON.match;
                  return (
                    <button
                      key={wordKey}
                      type="button"
                      className={`pointing-bridge__choice ${isTarget ? 'is-target-choice' : ''}`}
                      onClick={() => handleMatchChoice(wordKey)}
                      disabled={inputLocked || roundResolved}
                    >
                      <span className="pointing-bridge__choice-icon" aria-hidden="true">
                        {icon}
                      </span>
                      <span className="pointing-bridge__choice-label">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pointing-bridge__controls" role="group" aria-label={tr('games.pointingFadeBridge.instructions.tapContinue')}>
              <button
                type="button"
                className="pointing-bridge__icon-button"
                aria-label={tr('games.pointingFadeBridge.controls.replay')}
                onClick={handleControlReplay}
              >
                {replayIcon}
                <span style={visuallyHiddenStyle}>{tr('games.pointingFadeBridge.controls.replay')}</span>
              </button>

              <button
                type="button"
                className="pointing-bridge__icon-button"
                aria-label={tr('games.pointingFadeBridge.controls.retry')}
                onClick={handleControlRetry}
              >
                ↻
                <span style={visuallyHiddenStyle}>{tr('games.pointingFadeBridge.controls.retry')}</span>
              </button>

              <button
                type="button"
                className="pointing-bridge__icon-button"
                aria-label={tr('games.pointingFadeBridge.controls.hint')}
                onClick={handleControlHint}
                disabled={inputLocked || roundResolved}
              >
                💡
                <span style={visuallyHiddenStyle}>{tr('games.pointingFadeBridge.controls.hint')}</span>
              </button>

              <button
                type="button"
                className="pointing-bridge__icon-button"
                aria-label={tr('games.pointingFadeBridge.controls.next')}
                onClick={handleControlNext}
                disabled={inputLocked}
              >
                {nextIcon}
                <span style={visuallyHiddenStyle}>{tr('games.pointingFadeBridge.controls.next')}</span>
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="pointing-bridge__completion" aria-live="polite">
          <h3>{tr('games.pointingFadeBridge.completion.title')}</h3>
          <p>{tr('games.pointingFadeBridge.completion.summary')}</p>
          <p>{tr('games.pointingFadeBridge.completion.nextStep')}</p>
        </section>
      )}

      <style>{`
        .pointing-bridge__shell {
          direction: rtl;
          display: grid;
          gap: var(--space-md);
          position: relative;
          overflow: hidden;
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 35%, transparent);
          background:
            radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 42%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 95%, white 5%) 0%, var(--color-bg-card) 100%);
        }

        .pointing-bridge__celebration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .pointing-bridge__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-md);
        }

        .pointing-bridge__headline {
          display: grid;
          gap: var(--space-2xs);
        }

        .pointing-bridge__headline h2,
        .pointing-bridge__headline p {
          margin: 0;
        }

        .pointing-bridge__headline h2 {
          color: var(--color-text-primary);
          font-size: clamp(1.26rem, 1.02rem + 0.92vw, 1.82rem);
        }

        .pointing-bridge__headline p {
          color: var(--color-text-secondary);
          font-size: 0.99rem;
        }

        .pointing-bridge__stage-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2xs);
          justify-self: flex-start;
          border: 1px dashed color-mix(in srgb, var(--color-theme-primary) 42%, transparent);
          border-radius: var(--radius-pill);
          padding: 0.4rem 0.72rem;
          background: color-mix(in srgb, var(--color-theme-primary) 12%, white 88%);
          color: var(--color-text-primary);
          font-weight: 700;
          font-size: 0.9rem;
        }

        .pointing-bridge__audio-inline {
          min-inline-size: 48px;
          min-block-size: 48px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 42%, transparent);
          background: var(--color-bg-surface);
          color: var(--color-text-primary);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
        }

        .pointing-bridge__audio-inline:focus-visible,
        .pointing-bridge__icon-button:focus-visible,
        .pointing-bridge__choice:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--color-theme-primary) 55%, transparent);
          outline-offset: 2px;
        }

        .pointing-bridge__meter {
          display: grid;
          gap: var(--space-2xs);
        }

        .pointing-bridge__meter-bar {
          position: relative;
          block-size: 16px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-border) 60%, transparent);
          overflow: hidden;
        }

        .pointing-bridge__meter-bar::before {
          content: '';
          position: absolute;
          inset-block: 0;
          inset-inline-start: 0;
          inline-size: var(--bridge-meter);
          max-inline-size: 100%;
          background: ${rtlProgressGradient(isRtl, 'var(--color-theme-primary)', 'var(--color-theme-secondary)')};
          transition: inline-size 220ms ease;
        }

        .pointing-bridge__meter-bar span {
          position: absolute;
          inset-inline-end: 0.5rem;
          inset-block-start: 50%;
          transform: translateY(-50%);
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--color-text-primary);
          mix-blend-mode: multiply;
        }

        .pointing-bridge__meter p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.88rem;
        }

        .pointing-bridge__audio-fallback {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.88rem;
        }

        .pointing-bridge__sentence-card,
        .pointing-bridge__status-card,
        .pointing-bridge__completion {
          display: grid;
          gap: var(--space-sm);
          border-radius: var(--radius-xl);
          border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
          background: color-mix(in srgb, var(--color-bg-surface) 96%, white 4%);
          padding: clamp(var(--space-sm), 2.8vw, var(--space-md));
        }

        .pointing-bridge__line-with-audio {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: var(--space-xs);
          align-items: start;
        }

        .pointing-bridge__line-with-audio p {
          margin: 0;
          color: var(--color-text-primary);
        }

        .pointing-bridge__sentence {
          display: flex;
          flex-wrap: wrap;
          gap: 0.38rem;
          line-height: 1.9;
          font-size: clamp(1.28rem, 0.95rem + 1.02vw, 1.82rem);
        }

        .pointing-bridge__token {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: 0.34rem;
          border-radius: var(--radius-sm);
          transition: background-color 160ms ease, color 160ms ease;
        }

        .pointing-bridge__token.is-target {
          background: color-mix(in srgb, var(--color-theme-secondary) 24%, transparent);
        }

        .pointing-bridge__token.is-highlighted {
          animation: pointing-bridge-target-pulse 650ms ease-in-out infinite alternate;
        }

        @keyframes pointing-bridge-target-pulse {
          from {
            background: color-mix(in srgb, var(--color-theme-secondary) 18%, transparent);
          }
          to {
            background: color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
          }
        }

        .pointing-bridge__status-text {
          font-weight: 700;
          line-height: 1.55;
        }

        .pointing-bridge__status-text.is-neutral {
          color: var(--color-text-primary);
        }

        .pointing-bridge__status-text.is-hint {
          color: color-mix(in srgb, var(--color-theme-secondary) 72%, black 28%);
        }

        .pointing-bridge__status-text.is-success {
          color: color-mix(in srgb, var(--color-success) 82%, black 18%);
        }

        .pointing-bridge__status-text.is-error {
          color: color-mix(in srgb, var(--color-error) 82%, black 18%);
        }

        .pointing-bridge__choice-grid,
        .pointing-bridge__order-grid {
          display: grid;
          gap: var(--space-xs);
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .pointing-bridge__choice {
          min-block-size: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.48rem;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-bg-surface);
          color: var(--color-text-primary);
          font-size: 1.02rem;
          font-weight: 700;
          padding: 0.65rem 0.72rem;
          cursor: pointer;
          transition: transform 130ms ease, border-color 130ms ease;
          touch-action: manipulation;
        }

        .pointing-bridge__choice-icon {
          inline-size: 1.3rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 1rem;
        }

        .pointing-bridge__choice-label {
          line-height: 1.2;
        }

        .pointing-bridge__choice:disabled {
          opacity: 0.68;
          cursor: not-allowed;
        }

        .pointing-bridge__choice:not(:disabled):active {
          transform: scale(0.98);
        }

        .pointing-bridge__choice.is-target-choice {
          border-style: dashed;
          border-color: color-mix(in srgb, var(--color-theme-primary) 46%, transparent);
        }

        .pointing-bridge__choice.is-done {
          border-color: color-mix(in srgb, var(--color-success) 60%, transparent);
          background: color-mix(in srgb, var(--color-success) 14%, white 86%);
        }

        .pointing-bridge__controls {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--space-xs);
          flex-wrap: wrap;
        }

        .pointing-bridge__icon-button {
          min-inline-size: 52px;
          min-block-size: 52px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 44%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 12%, white 88%);
          color: var(--color-text-primary);
          font-size: 1.15rem;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
        }

        .pointing-bridge__icon-button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .pointing-bridge__completion h3,
        .pointing-bridge__completion p {
          margin: 0;
        }

        .pointing-bridge__completion h3 {
          color: var(--color-text-primary);
          font-size: clamp(1.18rem, 1rem + 0.86vw, 1.56rem);
        }

        .pointing-bridge__completion p {
          color: var(--color-text-secondary);
        }

        @media (max-width: 820px) {
          .pointing-bridge__header {
            flex-direction: column;
          }

          .pointing-bridge__choice-grid,
          .pointing-bridge__order-grid {
            grid-template-columns: 1fr;
          }

          .pointing-bridge__controls {
            justify-content: space-between;
          }
        }
      `}</style>
    </Card>
  );
}
