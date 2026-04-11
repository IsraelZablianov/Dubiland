import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import {
  LETTER_STORY_V2_ILLUSTRATION_SCENES,
  type LetterStoryV2ChapterId,
  type LetterStoryV2IllustrationScene,
  type LetterStoryV2LetterId,
} from '@/games/reading/letterStoryV2IllustrationManifest';
import { resolveReadingRoutingContext, type ReadingRoutingAgeBand } from '@/games/reading/readingProgressionRouting';
import { assetUrl } from '@/lib/assetUrl';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type Tone = 'neutral' | 'hint' | 'success';

type StoryStep = LetterStoryStep | CheckpointStoryStep | CelebrationStoryStep;

interface StoryStepBase {
  id: string;
  chapter: LetterStoryV2ChapterId;
  requiresInteraction: boolean;
}

interface LetterStoryStep extends StoryStepBase {
  kind: 'letter';
  scene: LetterStoryV2IllustrationScene;
}

interface CheckpointStoryStep extends StoryStepBase {
  kind: 'checkpoint';
  checkpointId: LetterStoryV2ChapterId;
  targetLetterId: LetterStoryV2LetterId;
}

interface CelebrationStoryStep extends StoryStepBase {
  kind: 'celebration';
}

interface ChoiceOption {
  id: string;
  primaryKey: string;
  secondaryKey?: string;
  audioKey: string;
  isCorrect: boolean;
}

interface StatusMessage {
  key: string;
  tone: Tone;
}

const DOT_WINDOW_SIZE = 5;
const SWIPE_THRESHOLD_PX = 56;
const SWIPE_VERTICAL_DRIFT_PX = 64;
const RAPID_TAP_WRONG_COUNT = 3;
const RAPID_TAP_WINDOW_MS = 2000;
const RAPID_TAP_PAUSE_MS = 900;
const INACTIVITY_HINT1_MS = 6000;
const INACTIVITY_HINT2_MS = 12000;

const CHOICE_COUNT_BY_AGE_BAND: Record<ReadingRoutingAgeBand, number> = {
  '3-4': 2,
  '4-5': 3,
  '5-6': 3,
  '6-7': 4,
};

const CHAPTER_SLOT_COUNT: Record<ReadingRoutingAgeBand, number> = {
  '3-4': 3,
  '4-5': 4,
  '5-6': 4,
  '6-7': 5,
};

const CHECKPOINT_TARGET_BY_CHAPTER: Record<LetterStoryV2ChapterId, LetterStoryV2LetterId> = {
  one: 'het',
  two: 'samekh',
  three: 'tav',
};

const STATUS_COLOR_BY_TONE: Record<Tone, string> = {
  neutral: 'var(--color-text-primary)',
  hint: 'var(--color-accent-warning-strong, var(--color-accent-warning))',
  success: 'var(--color-accent-success)',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function toStableRange(score: number): StableRange {
  if (score >= 85) return '1-10';
  if (score >= 65) return '1-5';
  return '1-3';
}

function toHintTrend(values: number[]): ParentSummaryMetrics['hintTrend'] {
  if (values.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = values.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf === firstHalf) return 'steady';
  return 'needs_support';
}

function toStars(score: number): number {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

function isLetterStep(step: StoryStep): step is LetterStoryStep {
  return step.kind === 'letter';
}

function isCheckpointStep(step: StoryStep): step is CheckpointStoryStep {
  return step.kind === 'checkpoint';
}

function buildStorySteps(): StoryStep[] {
  const steps: StoryStep[] = [];

  for (const scene of LETTER_STORY_V2_ILLUSTRATION_SCENES) {
    steps.push({
      id: `letter-${scene.letterId}`,
      kind: 'letter',
      chapter: scene.chapter,
      requiresInteraction: true,
      scene,
    });

    if (scene.order === 8) {
      steps.push({
        id: 'checkpoint-one',
        kind: 'checkpoint',
        chapter: 'one',
        checkpointId: 'one',
        requiresInteraction: true,
        targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.one,
      });
    }

    if (scene.order === 15) {
      steps.push({
        id: 'checkpoint-two',
        kind: 'checkpoint',
        chapter: 'two',
        checkpointId: 'two',
        requiresInteraction: true,
        targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.two,
      });
    }

    if (scene.order === 22) {
      steps.push({
        id: 'checkpoint-three',
        kind: 'checkpoint',
        chapter: 'three',
        checkpointId: 'three',
        requiresInteraction: true,
        targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.three,
      });
    }
  }

  steps.push({
    id: 'celebration',
    kind: 'celebration',
    chapter: 'three',
    requiresInteraction: false,
  });

  return steps;
}

function toPromptKey(step: StoryStep): string {
  if (isLetterStep(step)) {
    return `games.letterStorybook.letters.${step.scene.letterId}.prompt`;
  }

  if (isCheckpointStep(step)) {
    return `games.letterStorybook.checkpoints.${step.checkpointId}.prompt`;
  }

  return 'games.letterStorybook.completion.summary';
}

function toRetryKey(step: StoryStep): string {
  if (isLetterStep(step)) {
    return `games.letterStorybook.letters.${step.scene.letterId}.retry`;
  }

  if (isCheckpointStep(step)) {
    return `games.letterStorybook.checkpoints.${step.checkpointId}.retry`;
  }

  return 'games.letterStorybook.instructions.tapRetry';
}

function toHintKey(step: StoryStep, hintStep: number): string {
  const normalizedHintStep = clamp(hintStep, 1, 3);

  if (isLetterStep(step)) {
    return `games.letterStorybook.letters.${step.scene.letterId}.hint${normalizedHintStep}`;
  }

  if (isCheckpointStep(step)) {
    return `games.letterStorybook.checkpoints.${step.checkpointId}.hint${normalizedHintStep}`;
  }

  return 'games.letterStorybook.instructions.tapHint';
}

function toSuccessKey(step: StoryStep): string {
  if (isLetterStep(step)) {
    return `games.letterStorybook.letters.${step.scene.letterId}.success`;
  }

  if (isCheckpointStep(step)) {
    return `games.letterStorybook.checkpoints.${step.checkpointId}.success`;
  }

  return 'games.letterStorybook.completion.title';
}

function toTransitionKey(nextStep: StoryStep): string {
  if (isCheckpointStep(nextStep)) {
    return 'games.letterStorybook.transitions.checkpoint';
  }

  if (nextStep.kind === 'celebration') {
    return 'games.letterStorybook.transitions.celebration';
  }

  return 'games.letterStorybook.transitions.nextLetter';
}

function toChapterTitleKey(chapter: LetterStoryV2ChapterId): string {
  if (chapter === 'one') {
    return 'games.letterStorybook.checkpoints.one.intro';
  }
  if (chapter === 'two') {
    return 'games.letterStorybook.checkpoints.two.intro';
  }
  return 'games.letterStorybook.checkpoints.three.intro';
}

function resolveChoiceCount(
  ageBand: ReadingRoutingAgeBand,
  supportMode: boolean,
): number {
  const baseline = CHOICE_COUNT_BY_AGE_BAND[ageBand];
  return supportMode ? Math.max(2, baseline - 1) : baseline;
}

function toParentSummaryAgeBand(ageBand: ReadingRoutingAgeBand): ParentSummaryMetrics['ageBand'] {
  if (ageBand === '3-4' || ageBand === '4-5') {
    return '3-4';
  }
  if (ageBand === '5-6') {
    return '5-6';
  }
  return '6-7';
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function rotateIds(ids: string[], shiftBy: number): string[] {
  if (ids.length <= 1) {
    return ids;
  }

  const normalizedShift = ((shiftBy % ids.length) + ids.length) % ids.length;
  return [...ids.slice(normalizedShift), ...ids.slice(0, normalizedShift)];
}

export function LetterStorybookV2Game({ level: runtimeLevel, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const previousIcon = isRtl ? '→' : '←';

  const levelConfig = useMemo(
    () => (runtimeLevel.configJson as Record<string, unknown>) ?? {},
    [runtimeLevel.configJson],
  );

  const routingContext = useMemo(
    () =>
      resolveReadingRoutingContext(levelConfig, 2, {
        baseLevelByAgeBand: {
          '3-4': 1,
          '4-5': 1,
          '5-6': 2,
          '6-7': 3,
        },
      }),
    [levelConfig],
  );

  const antiRandomWrongTapCount = Math.round(
    toPositiveNumber((levelConfig.antiRandomTapGuard as Record<string, unknown> | undefined)?.wrongTapCount, RAPID_TAP_WRONG_COUNT),
  );
  const antiRandomWindowMs = toPositiveNumber(
    (levelConfig.antiRandomTapGuard as Record<string, unknown> | undefined)?.windowMs,
    RAPID_TAP_WINDOW_MS,
  );
  const antiRandomPauseMs = toPositiveNumber(
    (levelConfig.antiRandomTapGuard as Record<string, unknown> | undefined)?.pauseMs,
    RAPID_TAP_PAUSE_MS,
  );

  const storySteps = useMemo(() => buildStorySteps(), []);
  const totalSteps = storySteps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<StatusMessage>({
    key: 'games.letterStorybook.instructions.intro',
    tone: 'neutral',
  });
  const [solvedStepIds, setSolvedStepIds] = useState<Set<string>>(new Set());
  const [attemptsByStep, setAttemptsByStep] = useState<Record<string, number>>({});
  const [hintsByStep, setHintsByStep] = useState<Record<string, number>>({});
  const [firstTrySuccessByStep, setFirstTrySuccessByStep] = useState<Record<string, boolean>>({});
  const [supportModeByStep, setSupportModeByStep] = useState<Record<string, boolean>>({});
  const [selectedChoiceByStep, setSelectedChoiceByStep] = useState<Record<string, string>>({});
  const [replayTapCount, setReplayTapCount] = useState(0);
  const [pauseUntil, setPauseUntil] = useState(0);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [imageLoadErrorByStepId, setImageLoadErrorByStepId] = useState<Record<string, boolean>>({});
  const [interactionTick, setInteractionTick] = useState(0);

  const completionSentRef = useRef(false);
  const wrongTapTimestampsRef = useRef<number[]>([]);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const inactivityHint1TimeoutRef = useRef<number | null>(null);
  const inactivityHint2TimeoutRef = useRef<number | null>(null);

  const currentStep = storySteps[stepIndex] ?? storySteps[0]!;
  const currentPromptKey = toPromptKey(currentStep);
  const currentStepSolved = solvedStepIds.has(currentStep.id);
  const isSupportBand = routingContext.ageBand === '3-4';
  const interactionRequired = currentStep.requiresInteraction;
  const interactionLocked = interactionRequired && !currentStepSolved && !isSupportBand;

  const canGoPrevious = stepIndex > 0;
  const canGoNext = stepIndex < totalSteps - 1 && !interactionLocked;
  const isFinalStep = stepIndex >= totalSteps - 1;

  const chapterSlotCount = CHAPTER_SLOT_COUNT[routingContext.ageBand];

  const currentChapter = currentStep.chapter;

  const chapterProgress = useMemo(() => {
    const chapterLetterStepIds = storySteps
      .filter((step) => isLetterStep(step) && step.chapter === currentChapter)
      .map((step) => step.id);
    const checkpointId = `checkpoint-${currentChapter}`;
    const solvedLetters = chapterLetterStepIds.filter((id) => solvedStepIds.has(id)).length;
    const solvedCheckpoint = solvedStepIds.has(checkpointId) ? 1 : 0;
    const solvedUnits = solvedLetters + solvedCheckpoint;
    const totalUnits = chapterLetterStepIds.length + 1;

    return clamp(Math.round((solvedUnits / Math.max(totalUnits, 1)) * chapterSlotCount), 0, chapterSlotCount);
  }, [chapterSlotCount, currentChapter, solvedStepIds, storySteps]);

  const dotWindow = useMemo(() => {
    if (totalSteps <= DOT_WINDOW_SIZE) {
      return storySteps.map((_, index) => index);
    }

    const start = clamp(stepIndex - Math.floor(DOT_WINDOW_SIZE / 2), 0, totalSteps - DOT_WINDOW_SIZE);
    return Array.from({ length: DOT_WINDOW_SIZE }, (_, offset) => start + offset);
  }, [stepIndex, storySteps, totalSteps]);

  const activeChoiceOptions = useMemo<ChoiceOption[]>(() => {
    if (!interactionRequired) {
      return [];
    }

    if (isLetterStep(currentStep)) {
      const sceneIndex = LETTER_STORY_V2_ILLUSTRATION_SCENES.findIndex(
        (scene) => scene.letterId === currentStep.scene.letterId,
      );
      const supportMode = Boolean(supportModeByStep[currentStep.id]);
      const optionCount = resolveChoiceCount(routingContext.ageBand, supportMode);
      const distractorOffsets = [1, 3, 5, 7, 9];

      const distractorIds = distractorOffsets
        .map((offset) => {
          const index = (sceneIndex + offset + LETTER_STORY_V2_ILLUSTRATION_SCENES.length) % LETTER_STORY_V2_ILLUSTRATION_SCENES.length;
          return LETTER_STORY_V2_ILLUSTRATION_SCENES[index]?.letterId;
        })
        .filter((candidate): candidate is LetterStoryV2LetterId => Boolean(candidate) && candidate !== currentStep.scene.letterId)
        .slice(0, Math.max(0, optionCount - 1));

      const ids = [currentStep.scene.letterId, ...distractorIds];
      const rotatedIds = rotateIds(ids, currentStep.scene.order % Math.max(ids.length, 1));

      return rotatedIds.map((letterId) => ({
        id: `option-${currentStep.id}-${letterId}`,
        primaryKey: `games.letterStorybook.letters.${letterId}.symbol`,
        secondaryKey: `games.letterStorybook.letters.${letterId}.word`,
        audioKey: `games.letterStorybook.letters.${letterId}.sound`,
        isCorrect: letterId === currentStep.scene.letterId,
      }));
    }

    if (!isCheckpointStep(currentStep)) {
      return [];
    }

    const chapterLetterIds = LETTER_STORY_V2_ILLUSTRATION_SCENES
      .filter((scene) => scene.chapter === currentStep.chapter)
      .map((scene) => scene.letterId);

    const supportMode = Boolean(supportModeByStep[currentStep.id]);
    const optionCount = resolveChoiceCount(routingContext.ageBand, supportMode);

    const targetLetterId = currentStep.targetLetterId;
    const targetIndex = chapterLetterIds.indexOf(targetLetterId);
    const distractorIds = [
      chapterLetterIds[(targetIndex + 1 + chapterLetterIds.length) % chapterLetterIds.length],
      chapterLetterIds[(targetIndex + 3 + chapterLetterIds.length) % chapterLetterIds.length],
      chapterLetterIds[(targetIndex + 5 + chapterLetterIds.length) % chapterLetterIds.length],
    ]
      .filter((candidate): candidate is LetterStoryV2LetterId => Boolean(candidate) && candidate !== targetLetterId)
      .slice(0, Math.max(0, optionCount - 1));

    const ids = rotateIds([targetLetterId, ...distractorIds], stepIndex % Math.max(optionCount, 1));

    return ids.map((letterId) => ({
      id: `option-${currentStep.id}-${letterId}`,
      primaryKey: `games.letterStorybook.letters.${letterId}.symbol`,
      secondaryKey: undefined,
      audioKey: `games.letterStorybook.letters.${letterId}.sound`,
      isCorrect: letterId === targetLetterId,
    }));
  }, [currentStep, interactionRequired, routingContext.ageBand, stepIndex, supportModeByStep]);

  const playAudio = useCallback(
    async (key: string, mode: 'queue' | 'interrupt' = 'queue') => {
      if (audioPlaybackFailed) {
        return;
      }

      try {
        if (mode === 'interrupt') {
          await audio.playNow(toAudioPath(key));
          return;
        }

        await audio.play(toAudioPath(key));
      } catch {
        setAudioPlaybackFailed((current) => current || true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const setStatusWithAudio = useCallback(
    (key: string, tone: Tone, mode: 'queue' | 'interrupt' = 'interrupt') => {
      setStatus({ key, tone });
      void playAudio(key, mode);
    },
    [playAudio],
  );

  const playNarrationForStep = useCallback(
    async (step: StoryStep) => {
      if (audioPlaybackFailed) {
        return;
      }

      setIsNarrationPlaying(true);

      try {
        if (isLetterStep(step)) {
          const prefix = `games.letterStorybook.letters.${step.scene.letterId}`;
          await playAudio(`${prefix}.story`, 'interrupt');
          await playAudio(`${prefix}.sound`, 'queue');
          await playAudio(`${prefix}.prompt`, 'queue');
          return;
        }

        if (isCheckpointStep(step)) {
          const prefix = `games.letterStorybook.checkpoints.${step.checkpointId}`;
          await playAudio(`${prefix}.intro`, 'interrupt');
          await playAudio(`${prefix}.prompt`, 'queue');
          return;
        }

        await playAudio('games.letterStorybook.completion.title', 'interrupt');
        await playAudio('games.letterStorybook.completion.summary', 'queue');
      } finally {
        setIsNarrationPlaying(false);
      }
    },
    [audioPlaybackFailed, playAudio],
  );

  const clearInactivityTimeouts = useCallback(() => {
    if (inactivityHint1TimeoutRef.current !== null) {
      window.clearTimeout(inactivityHint1TimeoutRef.current);
      inactivityHint1TimeoutRef.current = null;
    }

    if (inactivityHint2TimeoutRef.current !== null) {
      window.clearTimeout(inactivityHint2TimeoutRef.current);
      inactivityHint2TimeoutRef.current = null;
    }
  }, []);

  const registerSolvedStep = useCallback(
    (stepId: string, wasFirstTry: boolean, statusKey: string) => {
      setSolvedStepIds((previous) => {
        const next = new Set(previous);
        next.add(stepId);
        return next;
      });
      setFirstTrySuccessByStep((previous) => ({
        ...previous,
        [stepId]: wasFirstTry,
      }));
      setStatusWithAudio(statusKey, 'success', 'interrupt');
    },
    [setStatusWithAudio],
  );

  const registerWrongTap = useCallback(() => {
    const now = Date.now();
    const recent = wrongTapTimestampsRef.current.filter((timestamp) => now - timestamp <= antiRandomWindowMs);
    recent.push(now);
    wrongTapTimestampsRef.current = recent;

    if (recent.length < antiRandomWrongTapCount) {
      return false;
    }

    setPauseUntil(now + antiRandomPauseMs);
    wrongTapTimestampsRef.current = [];
    setStatusWithAudio('games.letterStorybook.guards.rapidTapPause', 'hint', 'interrupt');
    return true;
  }, [antiRandomPauseMs, antiRandomWindowMs, antiRandomWrongTapCount, setStatusWithAudio]);

  const buildCompletionResult = useCallback((): GameCompletionResult => {
    const interactiveStepIds = storySteps.filter((step) => step.requiresInteraction).map((step) => step.id);
    const solvedInteractiveStepIds = interactiveStepIds.filter((stepId) => solvedStepIds.has(stepId));
    const firstTryCount = solvedInteractiveStepIds.filter((stepId) => firstTrySuccessByStep[stepId]).length;

    const firstAttemptSuccessRate = Math.round(
      (firstTryCount / Math.max(solvedInteractiveStepIds.length, 1)) * 100,
    );

    const hintsBySolvedStep = solvedInteractiveStepIds.map((stepId) => hintsByStep[stepId] ?? 0);
    const hintTrend = toHintTrend(hintsBySolvedStep);

    const checkpointStepIds = storySteps.filter(isCheckpointStep).map((step) => step.id);
    const checkpointFirstTryCount = checkpointStepIds.filter((stepId) => firstTrySuccessByStep[stepId]).length;
    const checkpointAccuracy = Math.round(
      (checkpointFirstTryCount / Math.max(checkpointStepIds.length, 1)) * 100,
    );

    const supportAssistCount = solvedInteractiveStepIds.filter((stepId) => supportModeByStep[stepId]).length;
    const supportAssistPenalty = supportAssistCount * 5;

    const listenParticipation = Math.round(
      clamp((replayTapCount / Math.max(totalSteps, 1)) * 100, 0, 100),
    );

    const score = Math.round(
      clamp(
        firstAttemptSuccessRate * 0.68 +
          checkpointAccuracy * 0.2 +
          (100 - hintsBySolvedStep.reduce((sum, value) => sum + value, 0) * 4) * 0.12 -
          supportAssistPenalty,
        0,
        100,
      ),
    );

    return {
      completed: true,
      score,
      stars: toStars(score),
      roundsCompleted: solvedInteractiveStepIds.length,
      summaryMetrics: {
        highestStableRange: toStableRange(score),
        firstAttemptSuccessRate,
        hintTrend,
        ageBand: toParentSummaryAgeBand(routingContext.ageBand),
        listenParticipation,
      },
    };
  }, [
    firstTrySuccessByStep,
    hintsByStep,
    replayTapCount,
    routingContext.ageBand,
    solvedStepIds,
    storySteps,
    supportModeByStep,
    totalSteps,
  ]);

  const handleComplete = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    const completionResult = buildCompletionResult();
    onComplete(completionResult);
    setStatus({ key: 'games.letterStorybook.completion.title', tone: 'success' });
    void playAudio('games.letterStorybook.completion.title', 'interrupt');
  }, [buildCompletionResult, onComplete, playAudio]);

  useEffect(() => {
    setStepIndex(0);
    setStatus({ key: 'games.letterStorybook.instructions.intro', tone: 'neutral' });
    setSolvedStepIds(new Set());
    setAttemptsByStep({});
    setHintsByStep({});
    setFirstTrySuccessByStep({});
    setSupportModeByStep({});
    setSelectedChoiceByStep({});
    setReplayTapCount(0);
    setPauseUntil(0);
    setAudioPlaybackFailed(false);
    setIsNarrationPlaying(false);
    setImageLoadErrorByStepId({});
    setInteractionTick(0);
    completionSentRef.current = false;
    wrongTapTimestampsRef.current = [];
  }, [runtimeLevel.id]);

  useEffect(() => {
    setStatus({ key: currentPromptKey, tone: 'neutral' });
    void playNarrationForStep(currentStep);
  }, [currentPromptKey, currentStep, playNarrationForStep]);

  useEffect(() => {
    if (currentStep.kind !== 'celebration') {
      return;
    }

    handleComplete();
  }, [currentStep.kind, handleComplete]);

  useEffect(() => {
    clearInactivityTimeouts();

    if (!interactionRequired || currentStepSolved || pauseUntil > Date.now()) {
      return;
    }

    inactivityHint1TimeoutRef.current = window.setTimeout(() => {
      const hintKey = toHintKey(currentStep, 1);
      setStatusWithAudio(hintKey, 'hint', 'interrupt');
    }, INACTIVITY_HINT1_MS);

    inactivityHint2TimeoutRef.current = window.setTimeout(() => {
      const hintKey = toHintKey(currentStep, 2);
      setStatusWithAudio(hintKey, 'hint', 'interrupt');
      void playAudio(currentPromptKey, 'queue');
    }, INACTIVITY_HINT2_MS);

    return clearInactivityTimeouts;
  }, [
    clearInactivityTimeouts,
    currentPromptKey,
    currentStep,
    currentStepSolved,
    interactionRequired,
    interactionTick,
    pauseUntil,
    playAudio,
    setStatusWithAudio,
  ]);

  const handleReplay = useCallback(() => {
    setReplayTapCount((currentCount) => currentCount + 1);
    setInteractionTick((value) => value + 1);
    setStatus({ key: currentPromptKey, tone: 'neutral' });
    void playNarrationForStep(currentStep);
  }, [currentPromptKey, currentStep, playNarrationForStep]);

  const handleRetry = useCallback(() => {
    if (!interactionRequired) {
      return;
    }

    setSelectedChoiceByStep((previous) => ({
      ...previous,
      [currentStep.id]: '',
    }));
    setInteractionTick((value) => value + 1);
    setStatusWithAudio(toRetryKey(currentStep), 'hint', 'interrupt');
  }, [currentStep, interactionRequired, setStatusWithAudio]);

  const handleHint = useCallback(() => {
    if (!interactionRequired) {
      return;
    }

    const nextHintStep = clamp((hintsByStep[currentStep.id] ?? 0) + 1, 1, 3);
    setHintsByStep((previous) => ({
      ...previous,
      [currentStep.id]: nextHintStep,
    }));
    setInteractionTick((value) => value + 1);
    setStatusWithAudio(toHintKey(currentStep, nextHintStep), 'hint', 'interrupt');
  }, [currentStep, hintsByStep, interactionRequired, setStatusWithAudio]);

  const handleChoiceSelect = useCallback(
    (option: ChoiceOption) => {
      if (!interactionRequired || currentStepSolved || currentStep.kind === 'celebration') {
        return;
      }

      const now = Date.now();
      if (now < pauseUntil) {
        setStatusWithAudio('games.letterStorybook.guards.rapidTapReset', 'hint', 'interrupt');
        return;
      }

      setSelectedChoiceByStep((previous) => ({
        ...previous,
        [currentStep.id]: option.id,
      }));

      const currentAttempts = attemptsByStep[currentStep.id] ?? 0;
      const nextAttempts = currentAttempts + 1;
      setAttemptsByStep((previous) => ({
        ...previous,
        [currentStep.id]: nextAttempts,
      }));
      setInteractionTick((value) => value + 1);
      void playAudio(option.audioKey, 'interrupt');

      if (option.isCorrect) {
        registerSolvedStep(currentStep.id, nextAttempts === 1, toSuccessKey(currentStep));
        return;
      }

      const rapidTapGuardTriggered = registerWrongTap();
      if (rapidTapGuardTriggered) {
        return;
      }

      if (nextAttempts >= 2) {
        setSupportModeByStep((previous) => ({
          ...previous,
          [currentStep.id]: true,
        }));
      }

      if (isSupportBand && nextAttempts >= 2) {
        registerSolvedStep(currentStep.id, false, 'games.letterStorybook.feedback.success.v3');
        return;
      }

      if (nextAttempts >= 3) {
        registerSolvedStep(currentStep.id, false, 'games.letterStorybook.feedback.success.v2');
        return;
      }

      setStatusWithAudio('games.letterStorybook.feedback.encouragement.v1', 'hint', 'interrupt');
    },
    [
      attemptsByStep,
      currentStep,
      currentStepSolved,
      interactionRequired,
      isSupportBand,
      pauseUntil,
      playAudio,
      registerSolvedStep,
      registerWrongTap,
      setStatusWithAudio,
    ],
  );

  const handleGoPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    setStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
    setInteractionTick((value) => value + 1);
    setStatusWithAudio('games.letterStorybook.instructions.tapReplay', 'neutral', 'queue');
  }, [canGoPrevious, setStatusWithAudio]);

  const handleGoNext = useCallback(() => {
    if (isFinalStep) {
      handleComplete();
      return;
    }

    if (!canGoNext) {
      setStatusWithAudio('games.letterStorybook.instructions.tapHint', 'hint', 'interrupt');
      return;
    }

    const nextStep = storySteps[stepIndex + 1];
    if (nextStep) {
      setStatusWithAudio(toTransitionKey(nextStep), 'neutral', 'queue');
    }

    setStepIndex((currentIndex) => Math.min(currentIndex + 1, totalSteps - 1));
    setInteractionTick((value) => value + 1);
  }, [canGoNext, handleComplete, isFinalStep, setStatusWithAudio, stepIndex, storySteps, totalSteps]);

  const handleScenePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleScenePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pointerStart = pointerStartRef.current;
      pointerStartRef.current = null;

      if (!pointerStart || currentStep.kind === 'celebration') {
        return;
      }

      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dy) > SWIPE_VERTICAL_DRIFT_PX) {
        return;
      }

      if (dx < 0) {
        handleGoNext();
        return;
      }

      handleGoPrevious();
    },
    [currentStep.kind, handleGoNext, handleGoPrevious],
  );

  const activeSceneImage = isLetterStep(currentStep) ? currentStep.scene : null;
  const activeSceneImageBasePath = activeSceneImage?.runtimeBasePath ?? null;
  const activeSceneImageFailed = activeSceneImage ? Boolean(imageLoadErrorByStepId[currentStep.id]) : true;

  const progressLabel = t('games.letterStorybook.controls.iconCueNext');

  const completionProgress = Math.round(((stepIndex + 1) / Math.max(totalSteps, 1)) * 100);

  return (
    <Card padding="md" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)' as unknown as number, color: 'var(--color-text-primary)' }}>
            {t(toChapterTitleKey(currentChapter) as never)}
          </p>
          <span
            style={{
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-subtle)',
              paddingInline: 'var(--space-sm)',
              paddingBlock: 'var(--space-2xs)',
              minInlineSize: '9.5rem',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionProgress}
          style={{
            inlineSize: '100%',
            blockSize: '10px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-bg-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              inlineSize: `${completionProgress}%`,
              blockSize: '100%',
              borderRadius: 'inherit',
              background: 'var(--color-accent-primary)',
              transition: 'inline-size var(--transition-base)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2xs)', alignItems: 'center', justifyContent: 'center' }}>
          {dotWindow.map((dotIndex) => {
            const isActive = dotIndex === stepIndex;
            const isDone = dotIndex < stepIndex;
            return (
              <span
                key={`dot-${dotIndex}`}
                aria-hidden
                style={{
                  inlineSize: isActive ? '14px' : '10px',
                  blockSize: isActive ? '14px' : '10px',
                  borderRadius: '999px',
                  background: isActive
                    ? 'var(--color-accent-primary)'
                    : isDone
                      ? 'color-mix(in srgb, var(--color-accent-primary) 55%, var(--color-bg-subtle) 45%)'
                      : 'var(--color-border-subtle)',
                  transition: 'inline-size var(--transition-base), block-size var(--transition-base), background var(--transition-base)',
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        onPointerDown={handleScenePointerDown}
        onPointerUp={handleScenePointerUp}
        style={{
          minBlockSize: 'clamp(220px, 44vh, 420px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          background:
            'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-secondary) 86%, white 14%) 0%, color-mix(in srgb, var(--color-bg-primary) 90%, var(--color-theme-secondary) 10%) 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {activeSceneImage && activeSceneImageBasePath && !activeSceneImageFailed ? (
          <picture>
            <source srcSet={assetUrl(`${activeSceneImageBasePath}.avif`)} type="image/avif" />
            <source srcSet={assetUrl(`${activeSceneImageBasePath}.webp`)} type="image/webp" />
            <img
              src={assetUrl(`${activeSceneImageBasePath}.png`)}
              alt={t(`games.letterStorybook.letters.${activeSceneImage.letterId}.imageAlt` as never)}
              onError={() => {
                setImageLoadErrorByStepId((previous) => ({
                  ...previous,
                  [currentStep.id]: true,
                }));
              }}
              style={{
                display: 'block',
                inlineSize: '100%',
                blockSize: '100%',
                objectFit: 'cover',
              }}
            />
          </picture>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              alignItems: 'center',
              justifyItems: 'center',
              blockSize: '100%',
              padding: 'var(--space-md)',
            }}
          >
            <MascotIllustration variant="hint" size={120} />
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              {t('games.letterStorybook.instructions.matchAssociation')}
            </p>
          </div>
        )}

        {isLetterStep(currentStep) ? (
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 'var(--space-md)',
              insetBlockEnd: 'var(--space-md)',
              display: 'grid',
              gap: 'var(--space-2xs)',
              background: 'color-mix(in srgb, var(--color-bg-primary) 88%, transparent 12%)',
              border: '1px solid color-mix(in srgb, var(--color-border-subtle) 80%, transparent 20%)',
              borderRadius: 'var(--radius-md)',
              paddingInline: 'var(--space-sm)',
              paddingBlock: 'var(--space-2xs)',
              maxInlineSize: 'min(92%, 22rem)',
            }}
          >
            <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)' as unknown as number, color: 'var(--color-text-primary)' }}>
              {t(`games.letterStorybook.letters.${currentStep.scene.letterId}.symbol` as never)}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t(`games.letterStorybook.letters.${currentStep.scene.letterId}.word` as never)}
            </p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleReplay}
        aria-label={t('games.letterStorybook.controls.replay')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          minBlockSize: '96px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-subtle)',
          paddingInline: 'var(--space-md)',
          textAlign: 'start',
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            inlineSize: '60px',
            blockSize: '60px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'color-mix(in srgb, var(--color-theme-secondary) 24%, var(--color-bg-primary) 76%)',
            fontSize: '1.35rem',
          }}
        >
          {replayIcon}
        </span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' as unknown as number }}>
          {t(currentPromptKey as never)}
        </span>
      </button>

      <div
        aria-live="polite"
        style={{
          paddingInline: 'var(--space-sm)',
          paddingBlock: 'var(--space-xs)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          background: 'color-mix(in srgb, var(--color-bg-secondary) 88%, var(--color-bg-primary) 12%)',
        }}
      >
        <p style={{ margin: 0, color: STATUS_COLOR_BY_TONE[status.tone], fontWeight: 'var(--font-weight-medium)' as unknown as number }}>
          {t(status.key as never)}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        {interactionRequired ? (
          <div style={{ display: 'grid', gap: 'var(--space-sm)', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {activeChoiceOptions.map((option) => {
              const isSelected = selectedChoiceByStep[currentStep.id] === option.id;
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => handleChoiceSelect(option)}
                  disabled={Date.now() < pauseUntil}
                  aria-label={option.secondaryKey ? t(option.secondaryKey as never) : t(option.primaryKey as never)}
                  style={{
                    minBlockSize: '60px',
                    display: 'grid',
                    gap: 'var(--space-3xs)',
                    justifyItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{t(option.primaryKey as never)}</span>
                  {option.secondaryKey ? (
                    <span style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{t(option.secondaryKey as never)}</span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <SuccessCelebration />
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{t('games.letterStorybook.completion.summary')}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleGoPrevious}
            disabled={!canGoPrevious}
            aria-label={t('nav.back')}
            style={{ minBlockSize: '60px', minInlineSize: '88px' }}
          >
            <span aria-hidden>{previousIcon}</span>
            {t('nav.back')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplay}
            aria-label={t('games.letterStorybook.controls.replay')}
            style={{ minBlockSize: '60px', minInlineSize: '88px' }}
          >
            <span aria-hidden>{replayIcon}</span>
            {t('games.letterStorybook.controls.replay')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRetry}
            disabled={!interactionRequired}
            aria-label={t('games.letterStorybook.controls.retry')}
            style={{ minBlockSize: '60px', minInlineSize: '88px' }}
          >
            <span aria-hidden>↻</span>
            {t('games.letterStorybook.controls.retry')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleHint}
            disabled={!interactionRequired}
            aria-label={t('games.letterStorybook.controls.hint')}
            style={{ minBlockSize: '60px', minInlineSize: '88px' }}
          >
            <span aria-hidden>💡</span>
            {t('games.letterStorybook.controls.hint')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleGoNext}
            aria-label={isFinalStep ? t('nav.finish') : t('games.letterStorybook.controls.next')}
            style={{ minBlockSize: '60px', minInlineSize: '104px' }}
          >
            <span aria-hidden>{nextIcon}</span>
            {isFinalStep ? t('nav.finish') : t('games.letterStorybook.controls.next')}
          </Button>
        </div>

        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t('games.letterStorybook.controls.iconCueHint')}
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t('games.letterStorybook.controls.iconCueNext')}
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t('games.letterStorybook.checkpoints.one.cueNoImage')}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t('games.letterStorybook.controls.iconCueReplay')} {isNarrationPlaying ? `(${t('feedback.keepGoing')})` : ''}
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t('games.letterStorybook.controls.iconCueRetry')}
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {chapterProgress}/{chapterSlotCount}
        </p>
      </div>
    </Card>
  );
}
