import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlReplayGlyph } from '@/lib/rtlChrome';

type RuntimeAudioEvent =
  | 'decode_gate_pre_unlock_tap'
  | 'anti_random_tap_pause_replay'
  | 'control_replay_tap'
  | 'control_retry_tap'
  | 'control_hint_tap'
  | 'control_next_tap'
  | 'mission_transition_next_page'
  | 'mission_transition_checkpoint'
  | 'mission_transition_next_mission';

type MessageTone = 'neutral' | 'hint' | 'success' | 'error';
type MissionId = 'lanternPath' | 'clusterAPartialPointing' | 'clusterBSequenceBridge';
type PageId = 'p01' | 'p02' | 'p03';
type ClusterId = 'base' | 'clusterA' | 'clusterB';
type PassType = 'independent-pass' | 'supported-pass';
type ComprehensionMode = 'select' | 'sequence';
type PronunciationKey = `words.pronunciation.${string}` | `phrases.pronunciation.${string}`;

type MissionBreakdown = {
  independentPass: number;
  supportedPass: number;
  stage3Hints: number;
};

type DecodableStoryMissionCompletion = GameCompletionResult & {
  missionBreakdown?: MissionBreakdown;
};

interface ComprehensionChoice {
  id: string;
  labelKey: PronunciationKey;
  icon: string;
  isCorrect: boolean;
}

interface SequenceStep {
  id: string;
  labelKey: PronunciationKey;
}

interface MissionPageConfig {
  id: PageId;
  decodeChoices: PronunciationKey[];
  decodeTarget: PronunciationKey;
  comprehensionMode: ComprehensionMode;
  comprehensionChoices: ComprehensionChoice[];
  sequenceSteps?: SequenceStep[];
}

interface MissionConfig {
  id: MissionId;
  cluster: ClusterId;
  pages: MissionPageConfig[];
}

interface MissionOutcome {
  missionId: MissionId;
  passType: PassType;
  decodeFirstAccuracy: number;
  firstTryDecodeAccuracy: number;
  literalComprehensionAccuracy: number;
  stage3Hints: number;
  roundsCompleted: number;
  isRecovery: boolean;
}

const EVENT_AUDIO_KEY_MAP: Record<RuntimeAudioEvent, string> = {
  decode_gate_pre_unlock_tap: 'games.decodableStoryMissions.feedback.retry.preUnlockNudge',
  anti_random_tap_pause_replay: 'games.decodableStoryMissions.feedback.retry.antiRandomTapPauseReplay',
  control_replay_tap: 'games.decodableStoryMissions.controls.replay',
  control_retry_tap: 'games.decodableStoryMissions.controls.retry',
  control_hint_tap: 'games.decodableStoryMissions.controls.hint',
  control_next_tap: 'games.decodableStoryMissions.controls.next',
  mission_transition_next_page: 'games.decodableStoryMissions.feedback.success.transition.toNextPage',
  mission_transition_checkpoint: 'games.decodableStoryMissions.feedback.success.transition.checkpointUnlocked',
  mission_transition_next_mission: 'games.decodableStoryMissions.feedback.success.transition.toNextMission',
};

const MISSION_ORDER: MissionConfig[] = [
  {
    id: 'lanternPath',
    cluster: 'base',
    pages: [
      {
        id: 'p01',
        decodeChoices: ['words.pronunciation.panas', 'words.pronunciation.mafteah', 'words.pronunciation.bayit'],
        decodeTarget: 'words.pronunciation.panas',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'lantern-near-gate',
            labelKey: 'phrases.pronunciation.hapanasDolekLeyadHashaar',
            icon: '🏮',
            isCorrect: true,
          },
          {
            id: 'just-door',
            labelKey: 'words.pronunciation.delet',
            icon: '🚪',
            isCorrect: false,
          },
          {
            id: 'just-home',
            labelKey: 'words.pronunciation.bayit',
            icon: '🏠',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'p02',
        decodeChoices: ['words.pronunciation.lifnei', 'words.pronunciation.aharei', 'words.pronunciation.seder'],
        decodeTarget: 'words.pronunciation.lifnei',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'read-then-answer',
            labelKey: 'phrases.pronunciation.korimKodemVeazOnim',
            icon: '📖',
            isCorrect: true,
          },
          {
            id: 'arrange-then-choose',
            labelKey: 'phrases.pronunciation.korimMesadrimVeazBoharim',
            icon: '🧩',
            isCorrect: false,
          },
          {
            id: 'mission-only',
            labelKey: 'words.pronunciation.mashima',
            icon: '🎯',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'p03',
        decodeChoices: ['words.pronunciation.pinuah', 'words.pronunciation.aharei', 'words.pronunciation.mafteah'],
        decodeTarget: 'words.pronunciation.pinuah',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'gate-after-decode',
            labelKey: 'phrases.pronunciation.rakAhareiHapinuahHashaarNiftah',
            icon: '🚪',
            isCorrect: true,
          },
          {
            id: 'answer-before-decode',
            labelKey: 'phrases.pronunciation.kodemPinuahVeazTshuva',
            icon: '🔒',
            isCorrect: false,
          },
          {
            id: 'order-only',
            labelKey: 'words.pronunciation.seder',
            icon: '🪜',
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    id: 'clusterAPartialPointing',
    cluster: 'clusterA',
    pages: [
      {
        id: 'p01',
        decodeChoices: ['words.pronunciation.pinuah', 'words.pronunciation.hizuk', 'words.pronunciation.matana'],
        decodeTarget: 'words.pronunciation.pinuah',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'pointed-word',
            labelKey: 'words.pronunciation.pinuah',
            icon: '🔎',
            isCorrect: true,
          },
          {
            id: 'support-word',
            labelKey: 'words.pronunciation.hizuk',
            icon: '💪',
            isCorrect: false,
          },
          {
            id: 'gift-word',
            labelKey: 'words.pronunciation.matana',
            icon: '🎁',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'p02',
        decodeChoices: ['words.pronunciation.seder', 'words.pronunciation.ratzef', 'words.pronunciation.aharei'],
        decodeTarget: 'words.pronunciation.seder',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'pattern-kept',
            labelKey: 'words.pronunciation.seder',
            icon: '🧭',
            isCorrect: true,
          },
          {
            id: 'sequence-shifted',
            labelKey: 'words.pronunciation.ratzef',
            icon: '🌀',
            isCorrect: false,
          },
          {
            id: 'after-only',
            labelKey: 'words.pronunciation.aharei',
            icon: '➡️',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'p03',
        decodeChoices: ['words.pronunciation.ratzef', 'words.pronunciation.lifnei', 'words.pronunciation.aharei'],
        decodeTarget: 'words.pronunciation.ratzef',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'literal-stays',
            labelKey: 'words.pronunciation.ratzef',
            icon: '🧩',
            isCorrect: true,
          },
          {
            id: 'before-only',
            labelKey: 'words.pronunciation.lifnei',
            icon: '⬅️',
            isCorrect: false,
          },
          {
            id: 'after-only-2',
            labelKey: 'words.pronunciation.aharei',
            icon: '➡️',
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    id: 'clusterBSequenceBridge',
    cluster: 'clusterB',
    pages: [
      {
        id: 'p01',
        decodeChoices: ['words.pronunciation.lifnei', 'words.pronunciation.aharei', 'words.pronunciation.seder'],
        decodeTarget: 'words.pronunciation.lifnei',
        comprehensionMode: 'select',
        comprehensionChoices: [
          {
            id: 'first-before',
            labelKey: 'words.pronunciation.lifnei',
            icon: '1️⃣',
            isCorrect: true,
          },
          {
            id: 'after-choice',
            labelKey: 'words.pronunciation.aharei',
            icon: '2️⃣',
            isCorrect: false,
          },
          {
            id: 'order-choice',
            labelKey: 'words.pronunciation.seder',
            icon: '🧩',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'p02',
        decodeChoices: ['words.pronunciation.aharei', 'words.pronunciation.lifnei', 'words.pronunciation.mashima'],
        decodeTarget: 'words.pronunciation.aharei',
        comprehensionMode: 'sequence',
        comprehensionChoices: [],
        sequenceSteps: [
          { id: 'before', labelKey: 'words.pronunciation.lifnei' },
          { id: 'decode', labelKey: 'words.pronunciation.pinuah' },
          { id: 'after', labelKey: 'words.pronunciation.aharei' },
        ],
      },
      {
        id: 'p03',
        decodeChoices: ['words.pronunciation.seder', 'words.pronunciation.ratzef', 'words.pronunciation.panas'],
        decodeTarget: 'words.pronunciation.seder',
        comprehensionMode: 'sequence',
        comprehensionChoices: [],
        sequenceSteps: [
          { id: 'read', labelKey: 'phrases.pronunciation.korimKodemVeazOnim' },
          { id: 'arrange', labelKey: 'phrases.pronunciation.korimMesadrimVeazBoharim' },
        ],
      },
    ],
  },
];

const MISSION_COUNT = MISSION_ORDER.length;
const DECODE_GATE_PASS_THRESHOLD = 80;
const FIRST_TRY_RECOVERY_THRESHOLD = 70;
const MAX_STAGE3_HINTS_FOR_INDEPENDENT = 1;
const RANDOM_TAP_THRESHOLD = 4;
const RANDOM_TAP_WINDOW_MS = 2000;
const QUICK_RESPONSE_THRESHOLD = 3;
const QUICK_RESPONSE_WINDOW_MS = 600;
const ANTI_RANDOM_PAUSE_MS = 900;
const HOTSPOT_HINT_THRESHOLD = 2;
const INACTIVITY_HINT_MS = 8000;
const CLUSTER_A_POINTING_FADE_MAX = 0.1;

function keyToAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function createPageRecord<TValue>(pages: MissionPageConfig[], value: TValue): Record<PageId, TValue> {
  return pages.reduce<Record<PageId, TValue>>(
    (acc, page) => ({ ...acc, [page.id]: value }),
    {} as Record<PageId, TValue>,
  );
}

function toHintTrend(values: number[]): HintTrend {
  if (values.length <= 1) {
    return values[0] && values[0] > 0 ? 'needs_support' : 'steady';
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = values.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf === firstHalf) return 'steady';
  return 'needs_support';
}

function toStableRange(value: number): StableRange {
  if (value >= 85) return '1-10';
  if (value >= 60) return '1-5';
  return '1-3';
}

function toStars(score: number, stage3Hints: number): 1 | 2 | 3 {
  if (score >= 85 && stage3Hints <= 2) return 3;
  if (score >= 65) return 2;
  return 1;
}

function toMessageClassName(tone: MessageTone): string {
  if (tone === 'hint') return 'decodable-missions__message decodable-missions__message--hint';
  if (tone === 'success') return 'decodable-missions__message decodable-missions__message--success';
  if (tone === 'error') return 'decodable-missions__message decodable-missions__message--error';
  return 'decodable-missions__message';
}

export function DecodableStoryMissionsGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);

  const [missionIndex, setMissionIndex] = useState(0);
  const [isRecoveryMission, setIsRecoveryMission] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [messageTone, setMessageTone] = useState<MessageTone>('neutral');
  const [messageKey, setMessageKey] = useState('games.decodableStoryMissions.instructions.intro');
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [clusterAUnlocked, setClusterAUnlocked] = useState(false);

  const [decodeSolvedByPage, setDecodeSolvedByPage] = useState<Record<PageId, boolean>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, false),
  );
  const [comprehensionSolvedByPage, setComprehensionSolvedByPage] = useState<Record<PageId, boolean>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, false),
  );
  const [decodeAttemptsByPage, setDecodeAttemptsByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [comprehensionAttemptsByPage, setComprehensionAttemptsByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [textInteractionsByPage, setTextInteractionsByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [decodeAttemptSignalsByPage, setDecodeAttemptSignalsByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [hotspotLockedTapCountByPage, setHotspotLockedTapCountByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [inactivityHintUsedByPage, setInactivityHintUsedByPage] = useState<Record<PageId, boolean>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, false),
  );
  const [optionReductionByPage, setOptionReductionByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );
  const [pageMissesByPage, setPageMissesByPage] = useState<Record<PageId, number>>(() =>
    createPageRecord(MISSION_ORDER[0].pages, 0),
  );

  const [hintStage, setHintStage] = useState(0);
  const [stage3HintCountForMission, setStage3HintCountForMission] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [sequenceProgress, setSequenceProgress] = useState<string[]>([]);
  const [pageReadyForNext, setPageReadyForNext] = useState(false);
  const [interactionNonce, setInteractionNonce] = useState(0);

  const [missionOutcomes, setMissionOutcomes] = useState<MissionOutcome[]>([]);

  const completionSentRef = useRef(false);
  const recoveryInsertedByMissionRef = useRef<Record<number, boolean>>({});
  const pendingRecoverySourceMissionRef = useRef<number | null>(null);
  const preArmStage1OnNextPageRef = useRef(false);
  const stage3HintUsedOnPageRef = useRef(false);

  const timeoutIdsRef = useRef<number[]>([]);
  const nonTargetTapTimesRef = useRef<number[]>([]);
  const quickResponseStreakRef = useRef(0);
  const lastResponseAtRef = useRef<number | null>(null);

  const activeMission = MISSION_ORDER[Math.min(missionIndex, MISSION_ORDER.length - 1)] ?? MISSION_ORDER[0];
  const activePage = activeMission.pages[Math.min(pageIndex, activeMission.pages.length - 1)] ?? activeMission.pages[0];

  const missionTitleKey = useMemo(
    () => `games.decodableStoryMissions.missions.${activeMission.id}.title`,
    [activeMission.id],
  );
  const narrationKey = useMemo(
    () => `games.decodableStoryMissions.missions.${activeMission.id}.narration.${activePage.id}`,
    [activeMission.id, activePage.id],
  );
  const decodePromptKey = useMemo(
    () => `games.decodableStoryMissions.missions.${activeMission.id}.decodePrompt.${activePage.id}`,
    [activeMission.id, activePage.id],
  );
  const comprehensionQuestionKey = useMemo(
    () => `games.decodableStoryMissions.missions.${activeMission.id}.comprehension.${activePage.id}Question`,
    [activeMission.id, activePage.id],
  );
  const comprehensionCorrectKey = useMemo(
    () => `games.decodableStoryMissions.missions.${activeMission.id}.comprehension.${activePage.id}Correct`,
    [activeMission.id, activePage.id],
  );
  const comprehensionRetryKey = useMemo(() => {
    const candidate = `games.decodableStoryMissions.missions.${activeMission.id}.comprehension.${activePage.id}Retry`;
    return i18n.exists(candidate, { ns: 'common' }) ? candidate : 'games.decodableStoryMissions.feedback.retry.gentle';
  }, [activeMission.id, activePage.id, i18n]);

  const decodeSolved = decodeSolvedByPage[activePage.id] ?? false;
  const comprehensionSolved = comprehensionSolvedByPage[activePage.id] ?? false;
  const hotspotsUnlocked =
    (textInteractionsByPage[activePage.id] ?? 0) > 0 && (decodeAttemptSignalsByPage[activePage.id] ?? 0) > 0;
  const showHotspotGuideArrow = (hotspotLockedTapCountByPage[activePage.id] ?? 0) >= HOTSPOT_HINT_THRESHOLD;
  const gateStateToken = decodeSolved ? '✅' : '🔒';

  const clusterLabelKey =
    activeMission.cluster === 'clusterA'
      ? 'games.decodableStoryMissions.level3.clusterA.label'
      : activeMission.cluster === 'clusterB'
        ? 'games.decodableStoryMissions.level3.clusterB.label'
        : null;
  const clusterCoachKey =
    activeMission.cluster === 'clusterA'
      ? 'games.decodableStoryMissions.level3.clusterA.coachCue'
      : activeMission.cluster === 'clusterB'
        ? 'games.decodableStoryMissions.level3.clusterB.coachCue'
        : null;
  const clusterPointingProfileKey =
    activeMission.cluster === 'clusterA'
      ? 'games.decodableStoryMissions.level3.clusterA.pointingProfile'
      : activeMission.cluster === 'clusterB'
        ? 'games.decodableStoryMissions.level3.clusterB.pointingProfile'
        : null;

  const missionStage3HintBadge = t('games.decodableStoryMissions.status.stage3HintsUsed', {
    count: stage3HintCountForMission,
  });

  const pointingFade = activeMission.cluster === 'clusterA' ? 1 - CLUSTER_A_POINTING_FADE_MAX : 1;

  const playKey = useCallback(
    (key: string, interrupt = false) => {
      if (audioPlaybackFailed) {
        return;
      }

      const audioPath = keyToAudioPath(key);
      const playback = interrupt ? audio.playNow(audioPath) : audio.play(audioPath);
      void playback.catch(() => {
        setAudioPlaybackFailed(true);
      });
    },
    [audio, audioPlaybackFailed],
  );

  const playEvent = useCallback(
    (event: RuntimeAudioEvent, interrupt = false) => {
      playKey(EVENT_AUDIO_KEY_MAP[event], interrupt);
    },
    [playKey],
  );

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const resetAntiRandomCounters = useCallback(() => {
    nonTargetTapTimesRef.current = [];
    quickResponseStreakRef.current = 0;
    lastResponseAtRef.current = null;
  }, []);

  const bumpInteraction = useCallback(() => {
    setInteractionNonce((previous) => previous + 1);
  }, []);

  const incrementTextInteraction = useCallback((pageId: PageId) => {
    setTextInteractionsByPage((previous) => ({
      ...previous,
      [pageId]: (previous[pageId] ?? 0) + 1,
    }));
  }, []);

  const incrementDecodeAttemptSignal = useCallback((pageId: PageId) => {
    setDecodeAttemptSignalsByPage((previous) => ({
      ...previous,
      [pageId]: (previous[pageId] ?? 0) + 1,
    }));
  }, []);

  const resetPageState = useCallback(
    (mission: MissionConfig, keepAttemptCounters = true) => {
      const pages = mission.pages;
      setDecodeSolvedByPage(createPageRecord(pages, false));
      setComprehensionSolvedByPage(createPageRecord(pages, false));
      setTextInteractionsByPage(createPageRecord(pages, 0));
      setDecodeAttemptSignalsByPage(createPageRecord(pages, 0));
      setHotspotLockedTapCountByPage(createPageRecord(pages, 0));
      setInactivityHintUsedByPage(createPageRecord(pages, false));
      setOptionReductionByPage(createPageRecord(pages, 0));
      setPageMissesByPage(createPageRecord(pages, 0));
      setSelectedChoiceId(null);
      setSequenceProgress([]);
      setHintStage(preArmStage1OnNextPageRef.current ? 1 : 0);
      setPageReadyForNext(false);
      setMessageTone('neutral');
      setMessageKey('games.decodableStoryMissions.instructions.decodeFirst');
      setInputLocked(false);
      stage3HintUsedOnPageRef.current = false;
      if (!keepAttemptCounters) {
        setDecodeAttemptsByPage(createPageRecord(pages, 0));
        setComprehensionAttemptsByPage(createPageRecord(pages, 0));
      }
      preArmStage1OnNextPageRef.current = false;
      resetAntiRandomCounters();
    },
    [resetAntiRandomCounters],
  );

  const playCurrentInstruction = useCallback(
    (interrupt = true) => {
      playKey(messageKey, interrupt);
    },
    [messageKey, playKey],
  );

  const playNarrationAndDecode = useCallback(
    (interrupt = true) => {
      playKey(narrationKey, interrupt);
      playKey(decodePromptKey);
    },
    [decodePromptKey, narrationKey, playKey],
  );

  const advanceHintByMiss = useCallback(
    (pageId: PageId) => {
      setPageMissesByPage((previous) => {
        const nextMisses = (previous[pageId] ?? 0) + 1;

        if (nextMisses === 1) {
          setHintStage((current) => Math.max(current, 1));
          setMessageTone('hint');
          setMessageKey('games.decodableStoryMissions.hints.stage1.afterFirstMiss');
          playKey('games.decodableStoryMissions.hints.stage1.afterFirstMiss', true);
        } else if (nextMisses === 2) {
          setHintStage((current) => Math.max(current, 2));
          setMessageTone('hint');
          setMessageKey('games.decodableStoryMissions.hints.stage2.chunkFocus');
          playKey('games.decodableStoryMissions.hints.stage2.chunkFocus', true);
        } else {
          setHintStage(3);
          setMessageTone('hint');
          setMessageKey('games.decodableStoryMissions.hints.stage3.oneMoreWithTwoChoices');
          setStage3HintCountForMission((count) => count + 1);
          stage3HintUsedOnPageRef.current = true;
          setOptionReductionByPage((optionPrevious) => ({
            ...optionPrevious,
            [pageId]: Math.max(optionPrevious[pageId] ?? 0, 1),
          }));
          playKey('games.decodableStoryMissions.hints.stage3.oneMoreWithTwoChoices', true);
        }

        return {
          ...previous,
          [pageId]: nextMisses,
        };
      });
    },
    [playKey],
  );

  const triggerAntiRandomTapGate = useCallback(() => {
    setInputLocked(true);
    setMessageTone('hint');
    setMessageKey(EVENT_AUDIO_KEY_MAP.anti_random_tap_pause_replay);
    playEvent('anti_random_tap_pause_replay', true);
    setOptionReductionByPage((previous) => ({
      ...previous,
      [activePage.id]: (previous[activePage.id] ?? 0) + 1,
    }));

    scheduleTimeout(() => {
      setInputLocked(false);
      setMessageTone('neutral');
      setMessageKey('games.decodableStoryMissions.instructions.decodeFirst');
      playKey(decodePromptKey, true);
    }, ANTI_RANDOM_PAUSE_MS);
  }, [activePage.id, decodePromptKey, playEvent, playKey, scheduleTimeout]);

  const registerResponseTiming = useCallback(
    (isTarget: boolean) => {
      const now = performance.now();

      if (!isTarget) {
        nonTargetTapTimesRef.current = nonTargetTapTimesRef.current
          .filter((timestamp) => now - timestamp <= RANDOM_TAP_WINDOW_MS)
          .concat(now);
      }

      const responseGap = lastResponseAtRef.current === null ? Number.POSITIVE_INFINITY : now - lastResponseAtRef.current;
      quickResponseStreakRef.current = responseGap < QUICK_RESPONSE_WINDOW_MS ? quickResponseStreakRef.current + 1 : 1;
      lastResponseAtRef.current = now;

      const rapidTapTriggered = nonTargetTapTimesRef.current.length >= RANDOM_TAP_THRESHOLD;
      const quickResponseTriggered = quickResponseStreakRef.current >= QUICK_RESPONSE_THRESHOLD;

      if (rapidTapTriggered || quickResponseTriggered) {
        resetAntiRandomCounters();
        triggerAntiRandomTapGate();
      }
    },
    [resetAntiRandomCounters, triggerAntiRandomTapGate],
  );

  const handleDecodeTap = useCallback(
    (choiceKey: PronunciationKey) => {
      if (inputLocked || sessionCompleted || pageReadyForNext) {
        return;
      }

      incrementTextInteraction(activePage.id);
      incrementDecodeAttemptSignal(activePage.id);
      bumpInteraction();

      setDecodeAttemptsByPage((previous) => {
        const nextAttempts = (previous[activePage.id] ?? 0) + 1;
        return {
          ...previous,
          [activePage.id]: nextAttempts,
        };
      });

      const isCorrect = choiceKey === activePage.decodeTarget;
      registerResponseTiming(isCorrect);
      playKey(choiceKey, true);

      if (isCorrect) {
        setDecodeSolvedByPage((previous) => ({
          ...previous,
          [activePage.id]: true,
        }));
        setMessageTone('success');
        setMessageKey('games.decodableStoryMissions.feedback.success.decodeSolved');
        playKey('games.decodableStoryMissions.feedback.success.decodeSolved');
        return;
      }

      setMessageTone('error');
      setMessageKey('games.decodableStoryMissions.feedback.retry.focusChunk');
      playKey('games.decodableStoryMissions.feedback.retry.focusChunk', true);
      advanceHintByMiss(activePage.id);
    },
    [
      activePage.decodeTarget,
      activePage.id,
      advanceHintByMiss,
      bumpInteraction,
      incrementDecodeAttemptSignal,
      incrementTextInteraction,
      inputLocked,
      pageReadyForNext,
      playKey,
      registerResponseTiming,
      sessionCompleted,
    ],
  );

  const handlePreUnlockTap = useCallback(() => {
    setMessageTone('hint');
    setMessageKey(EVENT_AUDIO_KEY_MAP.decode_gate_pre_unlock_tap);
    playEvent('decode_gate_pre_unlock_tap', true);
    playKey(decodePromptKey);
  }, [decodePromptKey, playEvent, playKey]);

  const handleHotspotLockedTap = useCallback(() => {
    setHotspotLockedTapCountByPage((previous) => ({
      ...previous,
      [activePage.id]: (previous[activePage.id] ?? 0) + 1,
    }));

    setMessageTone('hint');
    setMessageKey('games.decodableStoryMissions.feedback.retry.decodeBeforeComprehension');
    playKey('games.decodableStoryMissions.feedback.retry.decodeBeforeComprehension', true);
  }, [activePage.id, playKey]);

  const markComprehensionSolved = useCallback(() => {
    setComprehensionSolvedByPage((previous) => ({
      ...previous,
      [activePage.id]: true,
    }));
    setMessageTone('success');
    setMessageKey(comprehensionCorrectKey);
    playKey(comprehensionCorrectKey, true);
    setShowCelebration(true);
    setPageReadyForNext(true);
    scheduleTimeout(() => {
      setShowCelebration(false);
    }, 750);
  }, [activePage.id, comprehensionCorrectKey, playKey, scheduleTimeout]);

  const handleComprehensionSelect = useCallback(
    (choice: ComprehensionChoice) => {
      if (inputLocked || sessionCompleted || pageReadyForNext) {
        return;
      }

      bumpInteraction();

      if (!hotspotsUnlocked) {
        handleHotspotLockedTap();
        return;
      }

      if (!decodeSolved) {
        handlePreUnlockTap();
        return;
      }

      setComprehensionAttemptsByPage((previous) => ({
        ...previous,
        [activePage.id]: (previous[activePage.id] ?? 0) + 1,
      }));
      setSelectedChoiceId(choice.id);
      registerResponseTiming(choice.isCorrect);
      playKey(choice.labelKey, true);

      if (choice.isCorrect) {
        markComprehensionSolved();
        return;
      }

      setMessageTone('error');
      setMessageKey(comprehensionRetryKey);
      playKey(comprehensionRetryKey, true);
      advanceHintByMiss(activePage.id);
    },
    [
      activePage.id,
      advanceHintByMiss,
      bumpInteraction,
      comprehensionRetryKey,
      decodeSolved,
      handleHotspotLockedTap,
      handlePreUnlockTap,
      hotspotsUnlocked,
      inputLocked,
      markComprehensionSolved,
      pageReadyForNext,
      playKey,
      registerResponseTiming,
      sessionCompleted,
    ],
  );

  const handleSequenceStepTap = useCallback(
    (step: SequenceStep) => {
      if (inputLocked || sessionCompleted || pageReadyForNext) {
        return;
      }

      bumpInteraction();

      if (!hotspotsUnlocked) {
        handleHotspotLockedTap();
        return;
      }

      if (!decodeSolved) {
        handlePreUnlockTap();
        return;
      }

      const expectedSequence = activePage.sequenceSteps ?? [];
      if (expectedSequence.length === 0) {
        return;
      }

      const nextSequenceIndex = sequenceProgress.length;
      const expectedStep = expectedSequence[nextSequenceIndex];

      setComprehensionAttemptsByPage((previous) => ({
        ...previous,
        [activePage.id]: (previous[activePage.id] ?? 0) + 1,
      }));

      const isCorrectStep = expectedStep?.id === step.id;
      registerResponseTiming(isCorrectStep);
      playKey(step.labelKey, true);

      if (!isCorrectStep) {
        setSequenceProgress([]);
        setMessageTone('error');
        setMessageKey(comprehensionRetryKey);
        playKey(comprehensionRetryKey);
        advanceHintByMiss(activePage.id);
        return;
      }

      const nextProgress = [...sequenceProgress, step.id];
      setSequenceProgress(nextProgress);
      if (nextProgress.length === expectedSequence.length) {
        markComprehensionSolved();
      }
    },
    [
      activePage.id,
      activePage.sequenceSteps,
      advanceHintByMiss,
      bumpInteraction,
      comprehensionRetryKey,
      decodeSolved,
      handleHotspotLockedTap,
      handlePreUnlockTap,
      hotspotsUnlocked,
      inputLocked,
      markComprehensionSolved,
      pageReadyForNext,
      playKey,
      registerResponseTiming,
      sequenceProgress,
      sessionCompleted,
    ],
  );

  const getOutcomeAndAdvanceMission = useCallback(() => {
    const totalPages = activeMission.pages.length;
    const decodeWithinTwo = activeMission.pages.filter((page) => (decodeAttemptsByPage[page.id] ?? 0) <= 2).length;
    const decodeFirstTry = activeMission.pages.filter((page) => (decodeAttemptsByPage[page.id] ?? 0) <= 1).length;
    const comprehensionFirstTry = activeMission.pages.filter((page) => (comprehensionAttemptsByPage[page.id] ?? 0) <= 1).length;

    const decodeFirstAccuracy = Math.round((decodeWithinTwo / Math.max(1, totalPages)) * 100);
    const firstTryDecodeAccuracy = Math.round((decodeFirstTry / Math.max(1, totalPages)) * 100);
    const literalComprehensionAccuracy = Math.round((comprehensionFirstTry / Math.max(1, totalPages)) * 100);

    const passType: PassType =
      decodeFirstAccuracy >= DECODE_GATE_PASS_THRESHOLD && stage3HintCountForMission <= MAX_STAGE3_HINTS_FOR_INDEPENDENT
        ? 'independent-pass'
        : 'supported-pass';

    const recoveryTrigger =
      stage3HintCountForMission >= 2 ||
      firstTryDecodeAccuracy < FIRST_TRY_RECOVERY_THRESHOLD ||
      passType === 'supported-pass';

    const outcome: MissionOutcome = {
      missionId: activeMission.id,
      passType,
      decodeFirstAccuracy,
      firstTryDecodeAccuracy,
      literalComprehensionAccuracy,
      stage3Hints: stage3HintCountForMission,
      roundsCompleted: totalPages,
      isRecovery: isRecoveryMission,
    };

    setMissionOutcomes((previous) => [...previous, outcome]);

    if (!isRecoveryMission && activeMission.cluster === 'clusterA') {
      setClusterAUnlocked(true);
    }

    const shouldQueueRecovery =
      !isRecoveryMission &&
      recoveryTrigger &&
      !recoveryInsertedByMissionRef.current[missionIndex];

    if (shouldQueueRecovery) {
      recoveryInsertedByMissionRef.current[missionIndex] = true;
      pendingRecoverySourceMissionRef.current = missionIndex;
      setMessageTone('hint');
      setMessageKey('games.decodableStoryMissions.feedback.success.transition.recoveryMissionQueued');
      playKey('games.decodableStoryMissions.feedback.success.transition.recoveryMissionQueued', true);
      setIsRecoveryMission(true);
      setPageIndex(0);
      setStage3HintCountForMission(0);
      resetPageState(activeMission, false);
      return;
    }

    const sourceMissionIndex =
      isRecoveryMission && pendingRecoverySourceMissionRef.current !== null
        ? pendingRecoverySourceMissionRef.current
        : missionIndex;
    const nextMissionIndex = sourceMissionIndex + 1;

    if (nextMissionIndex >= MISSION_COUNT) {
      setSessionCompleted(true);
      setInputLocked(true);
      return;
    }

    if (nextMissionIndex === 2 && !clusterAUnlocked && activeMission.cluster !== 'clusterA') {
      setMessageTone('hint');
      setMessageKey('games.decodableStoryMissions.feedback.success.transition.checkpointUnlocked');
      playEvent('mission_transition_checkpoint', true);
      return;
    }

    pendingRecoverySourceMissionRef.current = null;
    setIsRecoveryMission(false);
    setMissionIndex(nextMissionIndex);
    setPageIndex(0);
    setStage3HintCountForMission(0);
    setMessageTone('success');
    setMessageKey(EVENT_AUDIO_KEY_MAP.mission_transition_next_mission);
    playEvent('mission_transition_next_mission', true);
  }, [
    activeMission,
    clusterAUnlocked,
    comprehensionAttemptsByPage,
    decodeAttemptsByPage,
    isRecoveryMission,
    missionIndex,
    playEvent,
    playKey,
    resetPageState,
    stage3HintCountForMission,
  ]);

  const handleControlNext = useCallback(() => {
    if (inputLocked || sessionCompleted) {
      return;
    }

    playEvent('control_next_tap', true);

    if (!pageReadyForNext) {
      if (!decodeSolved) {
        handlePreUnlockTap();
      }
      return;
    }

    if (stage3HintUsedOnPageRef.current) {
      preArmStage1OnNextPageRef.current = true;
    }

    if (pageIndex < activeMission.pages.length - 1) {
      const nextPageNumber = pageIndex + 2;
      const checkpointTransition = nextPageNumber % 2 === 1;
      setPageIndex((previous) => Math.min(previous + 1, activeMission.pages.length - 1));
      setPageReadyForNext(false);
      setSelectedChoiceId(null);
      setSequenceProgress([]);
      setHintStage(preArmStage1OnNextPageRef.current ? 1 : 0);
      stage3HintUsedOnPageRef.current = false;
      setMessageTone('neutral');
      setMessageKey('games.decodableStoryMissions.instructions.decodeFirst');
      if (checkpointTransition) {
        playEvent('mission_transition_checkpoint');
      } else {
        playEvent('mission_transition_next_page');
      }
      return;
    }

    getOutcomeAndAdvanceMission();
  }, [
    activeMission.pages.length,
    decodeSolved,
    getOutcomeAndAdvanceMission,
    handlePreUnlockTap,
    inputLocked,
    pageIndex,
    pageReadyForNext,
    playEvent,
    sessionCompleted,
  ]);

  const handleControlReplay = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    playEvent('control_replay_tap', true);
    incrementTextInteraction(activePage.id);
    bumpInteraction();
    playCurrentInstruction(false);
    playNarrationAndDecode(false);
  }, [
    activePage.id,
    bumpInteraction,
    incrementTextInteraction,
    playCurrentInstruction,
    playEvent,
    playNarrationAndDecode,
    sessionCompleted,
  ]);

  const handleControlRetry = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    playEvent('control_retry_tap', true);
    setMessageTone('neutral');
    setMessageKey('games.decodableStoryMissions.feedback.retry.gentle');
    playKey('games.decodableStoryMissions.feedback.retry.gentle');
    setSelectedChoiceId(null);
    setSequenceProgress([]);
    setPageReadyForNext(false);
    setInputLocked(false);
  }, [playEvent, playKey, sessionCompleted]);

  const handleControlHint = useCallback(() => {
    if (inputLocked || sessionCompleted) {
      return;
    }

    playEvent('control_hint_tap', true);

    const nextHintStage = Math.min(3, hintStage + 1);
    setHintStage(nextHintStage);

    if (nextHintStage === 1) {
      setMessageTone('hint');
      setMessageKey('games.decodableStoryMissions.hints.stage1.replayCue');
      playKey('games.decodableStoryMissions.hints.stage1.replayCue');
      return;
    }

    if (nextHintStage === 2) {
      setMessageTone('hint');
      setMessageKey('games.decodableStoryMissions.hints.stage2.graphemeFocus');
      playKey('games.decodableStoryMissions.hints.stage2.graphemeFocus');
      return;
    }

    setMessageTone('hint');
    setMessageKey('games.decodableStoryMissions.hints.stage3.reducedOptionsModel');
    setStage3HintCountForMission((count) => count + 1);
    stage3HintUsedOnPageRef.current = true;
    setOptionReductionByPage((previous) => ({
      ...previous,
      [activePage.id]: Math.max(previous[activePage.id] ?? 0, 1),
    }));
    playKey('games.decodableStoryMissions.hints.stage3.reducedOptionsModel');
  }, [activePage.id, hintStage, inputLocked, playEvent, playKey, sessionCompleted]);

  const visibleComprehensionChoices = useMemo(() => {
    if (activePage.comprehensionMode !== 'select') {
      return activePage.comprehensionChoices;
    }

    const reductionSteps = optionReductionByPage[activePage.id] ?? 0;
    if (reductionSteps <= 0) {
      return activePage.comprehensionChoices;
    }

    const minimumChoices = isRecoveryMission ? 2 : 1;
    const desiredCount = Math.max(minimumChoices, activePage.comprehensionChoices.length - reductionSteps);

    const correctChoice = activePage.comprehensionChoices.find((choice) => choice.isCorrect);
    const distractors = activePage.comprehensionChoices.filter((choice) => !choice.isCorrect);
    if (!correctChoice) {
      return activePage.comprehensionChoices.slice(0, desiredCount);
    }

    return [correctChoice, ...distractors.slice(0, Math.max(0, desiredCount - 1))];
  }, [activePage, isRecoveryMission, optionReductionByPage]);

  useEffect(() => {
    resetPageState(activeMission, false);
    setMessageTone('neutral');
    setMessageKey('games.decodableStoryMissions.instructions.decodeFirst');
    playKey('games.decodableStoryMissions.instructions.decodeFirst', true);
    playNarrationAndDecode(false);
  }, [activeMission, playKey, playNarrationAndDecode, resetPageState]);

  useEffect(() => {
    if (sessionCompleted) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (decodeSolved && comprehensionSolved) {
        return;
      }

      if (inactivityHintUsedByPage[activePage.id]) {
        return;
      }

      setHintStage((current) => Math.max(current, 1));
      setInactivityHintUsedByPage((previous) => ({
        ...previous,
        [activePage.id]: true,
      }));
      setMessageTone('hint');
      setMessageKey('games.decodableStoryMissions.hints.stage1.afterInactivity');
      playKey('games.decodableStoryMissions.hints.stage1.afterInactivity', true);
    }, INACTIVITY_HINT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activePage.id,
    comprehensionSolved,
    decodeSolved,
    inactivityHintUsedByPage,
    interactionNonce,
    playKey,
    sessionCompleted,
  ]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!sessionCompleted || completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    setMessageTone('success');
    setMessageKey('games.decodableStoryMissions.completion.summary');
    playKey('games.decodableStoryMissions.completion.title', true);
    playKey('games.decodableStoryMissions.completion.nextStep');

    const gradedOutcomes = missionOutcomes.filter((outcome) => !outcome.isRecovery);
    const independentPass = gradedOutcomes.filter((outcome) => outcome.passType === 'independent-pass').length;
    const supportedPass = gradedOutcomes.filter((outcome) => outcome.passType === 'supported-pass').length;
    const stage3Hints = gradedOutcomes.reduce((sum, outcome) => sum + outcome.stage3Hints, 0);

    const decodeFirstAccuracy =
      gradedOutcomes.length === 0
        ? 0
        : Math.round(
            gradedOutcomes.reduce((sum, outcome) => sum + outcome.decodeFirstAccuracy, 0) / gradedOutcomes.length,
          );
    const literalComprehensionAccuracy =
      gradedOutcomes.length === 0
        ? 0
        : Math.round(
            gradedOutcomes.reduce((sum, outcome) => sum + outcome.literalComprehensionAccuracy, 0) / gradedOutcomes.length,
          );

    const hintTrend = toHintTrend(gradedOutcomes.map((outcome) => outcome.stage3Hints));
    const totalRounds = missionOutcomes.reduce((sum, outcome) => sum + outcome.roundsCompleted, 0);

    const completion: DecodableStoryMissionCompletion = {
      completed: true,
      score: Math.round((decodeFirstAccuracy + literalComprehensionAccuracy) / 2),
      stars: toStars(Math.round((decodeFirstAccuracy + literalComprehensionAccuracy) / 2), stage3Hints),
      roundsCompleted: totalRounds,
      summaryMetrics: {
        highestStableRange: toStableRange(decodeFirstAccuracy),
        firstAttemptSuccessRate: decodeFirstAccuracy,
        hintTrend,
        ageBand: '6-7',
        decodeAccuracy: decodeFirstAccuracy,
        sequenceEvidenceScore: literalComprehensionAccuracy,
        gatePassed: supportedPass === 0,
      },
      missionBreakdown: {
        independentPass,
        supportedPass,
        stage3Hints,
      },
    };

    onComplete(completion);
  }, [missionOutcomes, onComplete, playKey, sessionCompleted]);

  const instructionLine = sessionCompleted
    ? t('games.decodableStoryMissions.completion.summary')
    : t(messageKey as any);

  return (
    <Card padding="lg" className="decodable-missions__shell">
      {showCelebration && <SuccessCelebration className="decodable-missions__celebration" />}

      <header className="decodable-missions__header">
        <div className="decodable-missions__header-copy">
          <h2 className="decodable-missions__title">{t('games.decodableStoryMissions.title')}</h2>
          <p className="decodable-missions__subtitle">{t('games.decodableStoryMissions.subtitle')}</p>
          <p className="decodable-missions__mission-title">{t(missionTitleKey as any)}</p>
          {clusterLabelKey ? <p className="decodable-missions__cluster-label">{t(clusterLabelKey as any)}</p> : null}
        </div>
        <div className="decodable-missions__coach" aria-hidden="true">
          <MascotIllustration variant={sessionCompleted ? 'success' : messageTone === 'error' ? 'hint' : 'hero'} size={56} />
        </div>
      </header>

      {clusterCoachKey ? (
        <section className="decodable-missions__cluster-card" aria-live="polite">
          <div className="decodable-missions__line-with-audio">
            <p>{t(clusterCoachKey as any)}</p>
            <button
              type="button"
              className="decodable-missions__audio-inline"
              onClick={() => {
                incrementTextInteraction(activePage.id);
                bumpInteraction();
                playKey(clusterCoachKey, true);
              }}
              aria-label={t('games.decodableStoryMissions.controls.replay')}
            >
              {replayIcon}
            </button>
          </div>
          {clusterPointingProfileKey ? <p className="decodable-missions__cluster-note">{t(clusterPointingProfileKey as any)}</p> : null}
        </section>
      ) : null}

      <section className="decodable-missions__status-strip" aria-live="polite">
        <p>
          {t('games.decodableStoryMissions.status.pageLabel', {
            current: Math.min(pageIndex + 1, activeMission.pages.length),
            total: activeMission.pages.length,
          })}
        </p>
        <p>{t('games.decodableStoryMissions.status.decodeGate', { state: gateStateToken })}</p>
        <p>{missionStage3HintBadge}</p>
      </section>

      {audioPlaybackFailed ? (
        <p className="decodable-missions__audio-fallback" aria-live="polite">
          {t('games.decodableStoryMissions.instructions.tapReplay')}
        </p>
      ) : null}

      {!sessionCompleted ? (
        <>
          <section className="decodable-missions__story-card">
            <div className="decodable-missions__line-with-audio">
              <p>{t(narrationKey as any)}</p>
              <button
                type="button"
                className="decodable-missions__audio-inline"
                onClick={() => {
                  incrementTextInteraction(activePage.id);
                  bumpInteraction();
                  playKey(narrationKey, true);
                }}
                aria-label={t('games.decodableStoryMissions.controls.replay')}
              >
                {replayIcon}
              </button>
            </div>

            <div className="decodable-missions__line-with-audio">
              <p>{t(decodePromptKey as any)}</p>
              <button
                type="button"
                className="decodable-missions__audio-inline"
                onClick={() => {
                  incrementTextInteraction(activePage.id);
                  bumpInteraction();
                  playKey(decodePromptKey, true);
                }}
                aria-label={t('games.decodableStoryMissions.controls.replay')}
              >
                {replayIcon}
              </button>
            </div>

            <div className="decodable-missions__decode-grid" role="group" aria-label={t('games.decodableStoryMissions.instructions.decodeFirst')}>
              {activePage.decodeChoices.map((choiceKey, index) => {
                const isTarget = choiceKey === activePage.decodeTarget;
                return (
                  <button
                    key={`${activeMission.id}-${activePage.id}-${choiceKey}`}
                    type="button"
                    className={`decodable-missions__decode-chip ${decodeSolved && isTarget ? 'is-target' : ''}`}
                    onClick={() => handleDecodeTap(choiceKey)}
                    style={{
                      opacity: activeMission.cluster === 'clusterA' && index % 2 === 0 ? pointingFade : 1,
                    }}
                    disabled={inputLocked || sessionCompleted}
                  >
                    {t(choiceKey as any)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="decodable-missions__status-panel">
            <div className="decodable-missions__line-with-audio">
              <p className={toMessageClassName(messageTone)}>{instructionLine}</p>
              <button
                type="button"
                className="decodable-missions__audio-inline"
                onClick={() => {
                  incrementTextInteraction(activePage.id);
                  bumpInteraction();
                  playCurrentInstruction(true);
                }}
                aria-label={t('games.decodableStoryMissions.controls.replay')}
              >
                {replayIcon}
              </button>
            </div>

            <div className="decodable-missions__icon-controls" role="group" aria-label={t('games.decodableStoryMissions.instructions.tapNext')}>
              <button
                type="button"
                className="decodable-missions__icon-button"
                aria-label={t('games.decodableStoryMissions.controls.replay')}
                onClick={handleControlReplay}
              >
                {replayIcon}
              </button>
              <button
                type="button"
                className="decodable-missions__icon-button"
                aria-label={t('games.decodableStoryMissions.controls.retry')}
                onClick={handleControlRetry}
              >
                ↻
              </button>
              <button
                type="button"
                className="decodable-missions__icon-button"
                aria-label={t('games.decodableStoryMissions.controls.hint')}
                onClick={handleControlHint}
                disabled={inputLocked}
              >
                💡
              </button>
              <button
                type="button"
                className="decodable-missions__icon-button"
                aria-label={t('games.decodableStoryMissions.controls.next')}
                onClick={handleControlNext}
                disabled={inputLocked || sessionCompleted}
              >
                →
              </button>
            </div>

            <div className="decodable-missions__comprehension-card" aria-live="polite">
              <div className="decodable-missions__line-with-audio">
                <p>{t(comprehensionQuestionKey as any)}</p>
                <button
                  type="button"
                  className="decodable-missions__audio-inline"
                  onClick={() => {
                    incrementTextInteraction(activePage.id);
                    bumpInteraction();
                    playKey(comprehensionQuestionKey, true);
                  }}
                  aria-label={t('games.decodableStoryMissions.controls.replay')}
                >
                  {replayIcon}
                </button>
              </div>

              {!hotspotsUnlocked ? (
                <button
                  type="button"
                  className="decodable-missions__hotspot-lock"
                  onClick={handleHotspotLockedTap}
                  disabled={inputLocked}
                  aria-label={t('games.decodableStoryMissions.feedback.retry.decodeBeforeComprehension')}
                >
                  <span aria-hidden="true">🖼️</span>
                  {showHotspotGuideArrow ? <span className="decodable-missions__hotspot-arrow">{isRtl ? '⬅️' : '➡️'}</span> : null}
                </button>
              ) : activePage.comprehensionMode === 'select' ? (
                <div className="decodable-missions__hotspot-grid" role="group" aria-label={t('games.decodableStoryMissions.instructions.decodeFirst')}>
                  {visibleComprehensionChoices.map((choice) => {
                    const isSelected = selectedChoiceId === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        className={`decodable-missions__hotspot ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleComprehensionSelect(choice)}
                        aria-pressed={isSelected}
                        aria-disabled={!decodeSolved}
                        disabled={inputLocked || pageReadyForNext}
                      >
                        <span aria-hidden="true">{choice.icon}</span>
                        <span>{t(choice.labelKey as any)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="decodable-missions__sequence-grid" role="group" aria-label={t('games.decodableStoryMissions.instructions.decodeFirst')}>
                  {(activePage.sequenceSteps ?? []).map((step, index) => {
                    const isDone = sequenceProgress.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        className={`decodable-missions__sequence-step ${isDone ? 'is-done' : ''}`}
                        onClick={() => handleSequenceStepTap(step)}
                        disabled={inputLocked || pageReadyForNext}
                        aria-label={t(step.labelKey as any)}
                      >
                        <span aria-hidden="true">{isDone ? '✅' : `${index + 1}`}</span>
                        <span>{t(step.labelKey as any)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="decodable-missions__completion" aria-live="polite">
          <h3>{t('games.decodableStoryMissions.completion.title')}</h3>
          <p>{t('games.decodableStoryMissions.completion.summary')}</p>
          <p>{t('games.decodableStoryMissions.completion.nextStep')}</p>
        </section>
      )}

      <style>{`
        .decodable-missions__shell {
          direction: rtl;
          display: grid;
          gap: var(--space-md);
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--color-theme-secondary) 24%, transparent), transparent 44%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%) 0%, var(--color-bg-card) 100%);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 35%, transparent);
        }

        .decodable-missions__celebration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .decodable-missions__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md);
        }

        .decodable-missions__header-copy {
          display: grid;
          gap: var(--space-2xs);
        }

        .decodable-missions__title,
        .decodable-missions__subtitle,
        .decodable-missions__mission-title,
        .decodable-missions__cluster-label,
        .decodable-missions__cluster-note {
          margin: 0;
        }

        .decodable-missions__title {
          color: var(--color-text-primary);
          font-size: clamp(1.32rem, 1rem + 1.1vw, 1.9rem);
        }

        .decodable-missions__subtitle,
        .decodable-missions__mission-title,
        .decodable-missions__cluster-note {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .decodable-missions__cluster-label {
          inline-size: fit-content;
          padding-block: var(--space-2xs);
          padding-inline: var(--space-sm);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 24%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
        }

        .decodable-missions__coach {
          inline-size: 68px;
          block-size: 68px;
          border-radius: var(--radius-full);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 88%, white 12%);
          display: grid;
          place-items: center;
          box-shadow: var(--shadow-sm);
        }

        .decodable-missions__cluster-card,
        .decodable-missions__story-card,
        .decodable-missions__status-panel,
        .decodable-missions__comprehension-card,
        .decodable-missions__completion {
          display: grid;
          gap: var(--space-sm);
          background: color-mix(in srgb, var(--color-bg-card) 92%, white 8%);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 26%, transparent);
          border-radius: var(--radius-xl);
          padding: var(--space-md);
        }

        .decodable-missions__status-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-xs);
        }

        .decodable-missions__status-strip p {
          margin: 0;
          min-block-size: 48px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 28%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 84%, white 16%);
          display: grid;
          place-items: center;
          text-align: center;
          padding-inline: var(--space-sm);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .decodable-missions__line-with-audio {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: var(--space-xs);
        }

        .decodable-missions__line-with-audio p {
          margin: 0;
          color: var(--color-text-primary);
        }

        .decodable-missions__audio-inline,
        .decodable-missions__icon-button {
          min-inline-size: 48px;
          min-block-size: 48px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 84%, white 16%);
          color: var(--color-text-primary);
          font-size: 1.05rem;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .decodable-missions__audio-inline:hover,
        .decodable-missions__icon-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .decodable-missions__audio-inline:disabled,
        .decodable-missions__icon-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .decodable-missions__decode-grid,
        .decodable-missions__hotspot-grid,
        .decodable-missions__sequence-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-xs);
        }

        .decodable-missions__decode-chip,
        .decodable-missions__hotspot,
        .decodable-missions__sequence-step {
          min-block-size: 52px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 84%, white 16%);
          color: var(--color-text-primary);
          display: grid;
          align-content: center;
          justify-items: center;
          gap: var(--space-2xs);
          text-align: center;
          padding-block: var(--space-xs);
          padding-inline: var(--space-xs);
          cursor: pointer;
        }

        .decodable-missions__decode-chip.is-target,
        .decodable-missions__hotspot.is-selected,
        .decodable-missions__sequence-step.is-done {
          border-color: var(--color-accent-success);
          background: color-mix(in srgb, var(--color-accent-success) 18%, var(--color-bg-card));
        }

        .decodable-missions__hotspot-lock {
          min-block-size: 112px;
          border-radius: var(--radius-lg);
          border: 1px dashed color-mix(in srgb, var(--color-theme-secondary) 40%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 86%, white 14%);
          color: var(--color-text-secondary);
          display: grid;
          place-items: center;
          gap: var(--space-xs);
          font-size: 1.4rem;
          cursor: pointer;
        }

        .decodable-missions__hotspot-arrow {
          font-size: 1.15rem;
          animation: decodable-missions-arrow-pulse 900ms ease-in-out infinite;
        }

        .decodable-missions__icon-controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(48px, max-content));
          justify-content: flex-start;
          gap: var(--space-xs);
        }

        .decodable-missions__message {
          margin: 0;
          padding-block: var(--space-xs);
          padding-inline: var(--space-sm);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 24%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 88%, white 12%);
          color: var(--color-text-primary);
        }

        .decodable-missions__message--hint {
          border-color: color-mix(in srgb, var(--color-accent-warning) 54%, transparent);
          background: color-mix(in srgb, var(--color-accent-warning) 14%, var(--color-bg-card));
        }

        .decodable-missions__message--success {
          border-color: color-mix(in srgb, var(--color-accent-success) 54%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 14%, var(--color-bg-card));
        }

        .decodable-missions__message--error {
          border-color: color-mix(in srgb, var(--color-accent-error) 54%, transparent);
          background: color-mix(in srgb, var(--color-accent-error) 12%, var(--color-bg-card));
        }

        .decodable-missions__audio-fallback {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .decodable-missions__completion h3,
        .decodable-missions__completion p {
          margin: 0;
          color: var(--color-text-primary);
        }

        @media (max-width: 760px) {
          .decodable-missions__decode-grid,
          .decodable-missions__hotspot-grid,
          .decodable-missions__sequence-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .decodable-missions__status-strip {
            grid-template-columns: 1fr;
          }

          .decodable-missions__header {
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .decodable-missions__hotspot-arrow {
            animation: none;
          }

          .decodable-missions__audio-inline,
          .decodable-missions__icon-button {
            transition: none;
          }
        }

        @keyframes decodable-missions-arrow-pulse {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-3px);
          }
        }
      `}</style>
    </Card>
  );
}
