import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, GameTopBar } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, ReadingGateStatus, StableRange } from '@/games/engine';
import { HandbookPageRenderer, type HandbookMediaAssetSlot } from '@/games/reading/HandbookPageRenderer';
import type {
  HandbookRuntimeChoice,
  HandbookRuntimeContent,
  HandbookRuntimeInteraction,
} from '@/games/reading/handbookRuntimeAdapter';
import {
  READING_DEFAULT_AGE_BAND_BY_BOOK,
  READING_LADDER_BOOK_BY_AGE_BAND,
  READING_RUNTIME_MATRIX,
  isReadingAgeBand,
  type ReadingAntiGuessGuard,
  type ReadingAgeBand,
  type ReadingLadderBookId,
} from '@/games/reading/readingRuntimeMatrix';
import { assetUrl } from '@/lib/assetUrl';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';

type HandbookMode = 'readToMe' | 'readAndPlay' | 'calmReplay';
type StatusTone = 'neutral' | 'hint' | 'success' | 'error';
type HintTrend = ParentSummaryMetrics['hintTrend'];
type AgeBand = ReadingAgeBand;
type LadderBookId = ReadingLadderBookId;
type LaunchSlotAlias =
  | 'bouncy-balloon'
  | 'magic-letter-map'
  | 'syllable-box'
  | 'star-message'
  | 'secret-clock'
  | 'class-newspaper'
  | 'root-family-lab';
type PageTurnDirection = 'forward' | 'backward';
type ReadingHighlightMode = 'narration' | 'prompt';
type PageId =
  | 'p01'
  | 'p02'
  | 'p03'
  | 'p04'
  | 'p05'
  | 'p06'
  | 'p07'
  | 'p08'
  | 'p09'
  | 'p10'
  | 'p11'
  | 'p12';

interface ChoiceDefinition {
  id: string;
  labelKey: string;
  isCorrect: boolean;
  audioKey?: string;
}

type AgeBandNumericPolicy = Partial<Record<AgeBand, number>>;

interface InteractionDefinition {
  id: string;
  required: boolean;
  promptKey: string;
  hintKey: string;
  successKey: string;
  retryKey: string;
  isScored: boolean;
  requiresTextActionBeforeChoice: boolean;
  allowImageBeforeAnswer: boolean;
  choiceLockUntilTextAction: boolean;
  hintTriggerByBand: AgeBandNumericPolicy;
  maxChoicesByBand: AgeBandNumericPolicy;
  choices: ChoiceDefinition[];
}

interface HandbookPageDefinition {
  id: PageId;
  narrationKey: string;
  promptKey: string;
  interaction?: InteractionDefinition;
  blocks?: unknown;
  mediaAssets?: HandbookMediaAssetSlot[];
}

interface CompletionSummary {
  metrics: ParentSummaryMetrics;
  firstAttemptRate: number;
  hintRate: number;
  hints: HintTrend;
  visitedCount: number;
  readingGate: ReadingGateStatus;
}

interface ReadingHighlightState {
  pageId: PageId;
  mode: ReadingHighlightMode;
}

type HandbookControlIconKind = 'replay' | 'play' | 'pause' | 'retry' | 'hint' | 'previous' | 'next' | 'complete';

interface HandbookControlIconProps {
  kind: HandbookControlIconKind;
  isRtl?: boolean;
}

function HandbookControlIcon({ kind, isRtl = false }: HandbookControlIconProps) {
  if (kind === 'replay') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M16.8 7.2C15.6 6 13.9 5.2 12 5.2C8.2 5.2 5.2 8.2 5.2 12C5.2 15.8 8.2 18.8 12 18.8C15.8 18.8 18.8 15.8 18.8 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.8 7.2V10.8M18.8 7.2H15.2M18.8 7.2L15.8 10.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 9.1L14.7 12L10 14.9V9.1Z" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'play') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 6.5L18 12L8 17.5V6.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'pause') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="7" y="6" width="3.5" height="12" rx="1.2" fill="currentColor" />
        <rect x="13.5" y="6" width="3.5" height="12" rx="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'retry') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M18 9.2V5.6M18 5.6H14.4M18 5.6L14.9 8.7M18.2 12.1C18.2 15.5 15.4 18.2 12 18.2C8.6 18.2 5.8 15.5 5.8 12.1C5.8 8.7 8.6 5.9 12 5.9C13.8 5.9 15.4 6.7 16.5 7.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'hint') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 4.8C8.9 4.8 6.4 7.3 6.4 10.4C6.4 12.4 7.4 14.1 9 15.1C9.4 15.4 9.6 15.8 9.6 16.2V16.8H14.4V16.2C14.4 15.8 14.6 15.4 15 15.1C16.6 14.1 17.6 12.4 17.6 10.4C17.6 7.3 15.1 4.8 12 4.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 19H14M10.7 21H13.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'previous') {
    return (
      <svg
        className="interactive-handbook__icon-svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        style={{ transform: isRtl ? 'none' : 'scaleX(-1)' }}
      >
        <path
          d="M5.5 12H18.5M13.5 7L18.5 12L13.5 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'next') {
    return (
      <svg
        className="interactive-handbook__icon-svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }}
      >
        <path
          d="M5.5 12H18.5M13.5 7L18.5 12L13.5 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'complete') {
    return (
      <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M8.2 12.4L10.9 15.1L15.8 9.9M12 21C7 21 3 17 3 12S7 3 12 3S21 7 21 12S17 21 12 21Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="interactive-handbook__icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4.5 9V15H8.5L13.2 18.5V5.5L8.5 9H4.5ZM16 9C17.4 10.3 17.4 13.7 16 15M17.8 7.2C19.9 9.3 19.9 14.7 17.8 16.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HANDBOOK_CHOICE_ICON_VARIANTS = ['circle', 'diamond', 'triangle', 'square', 'star'] as const;
type HandbookChoiceIconVariant = (typeof HANDBOOK_CHOICE_ICON_VARIANTS)[number];

function resolveChoiceIconVariant(choiceId: string): HandbookChoiceIconVariant {
  let hash = 0;

  for (let index = 0; index < choiceId.length; index += 1) {
    hash = (hash * 33 + choiceId.charCodeAt(index)) % 10_007;
  }

  return HANDBOOK_CHOICE_ICON_VARIANTS[Math.abs(hash) % HANDBOOK_CHOICE_ICON_VARIANTS.length] ?? 'circle';
}

function HandbookChoiceIcon({ choiceId }: { choiceId: string }) {
  const variant = resolveChoiceIconVariant(choiceId);

  if (variant === 'diamond') {
    return (
      <svg className="interactive-handbook__choice-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 4.8L19.2 12L12 19.2L4.8 12L12 4.8Z" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'triangle') {
    return (
      <svg className="interactive-handbook__choice-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5.4L19 18H5L12 5.4Z" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'square') {
    return (
      <svg className="interactive-handbook__choice-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="6.5" y="6.5" width="11" height="11" rx="2.3" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'star') {
    return (
      <svg className="interactive-handbook__choice-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 4.9L14 9.1L18.6 9.7L15.2 12.9L16.1 17.5L12 15.2L7.9 17.5L8.8 12.9L5.4 9.7L10 9.1L12 4.9Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg className="interactive-handbook__choice-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="6.2" fill="currentColor" />
    </svg>
  );
}

export interface InteractiveHandbookPageProgress {
  visited: boolean;
  solved: boolean;
}

export interface InteractiveHandbookProgressSnapshot {
  furthestPageNumber: number;
  completed: boolean;
  pageCompletion: Record<string, InteractiveHandbookPageProgress>;
}

interface InteractiveHandbookGameProps extends GameProps {
  initialProgress?: InteractiveHandbookProgressSnapshot | null;
  onProgressChange?: (snapshot: InteractiveHandbookProgressSnapshot) => void;
  preloadManifest?: HandbookPreloadManifest | null;
  runtimeContent?: HandbookRuntimeContent | null;
  onRequestBack?: () => void;
}

export interface HandbookPreloadManifest {
  version?: number;
  critical: string[];
  pages: Record<string, string[]>;
}

interface HandbookIllustrationAsset {
  png: string;
  webp: string;
  webpCompact: string;
  width: number;
  height: number;
}

type HandbookSlug =
  | 'mikaSoundGarden'
  | 'yoavLetterMap'
  | 'naamaSyllableBox'
  | 'oriBreadMarket'
  | 'tamarWordTower'
  | 'saharSecretClock'
  | 'guyClassNewspaper'
  | 'almaRootFamilies'
  | 'magicLetterMap';
type StoryDepthHandbookSlug = 'mikaSoundGarden' | 'yoavLetterMap' | 'tamarWordTower';
type StoryArcChapterId = 'chapterA' | 'chapterB' | 'chapterC';
type InteractionChoicePresetId =
  | 'letters_bet'
  | 'letters_pe'
  | 'words_gan'
  | 'words_dubi'
  | 'numbers_four'
  | 'baskets_fruit'
  | 'recap_letters'
  | 'recap_counting'
  | 'market_words_chalah'
  | 'final_form_mem'
  | 'market_stall_bread'
  | 'final_form_contrast'
  | 'sequence_market'
  | 'neutral_label_bread'
  | 'literal_bread_delivery'
  | 'recap_final_forms'
  | 'root_pattern_katav'
  | 'root_sort_shamar'
  | 'context_family_michtav'
  | 'contrast_family_shorashim'
  | 'strategy_repeat_letters'
  | 'build_sentence_ketiva'
  | 'literal_lab_goal'
  | 'transfer_family_kotevet'
  | 'final_family_decision'
  | 'time_decode_clue'
  | 'time_marker_match'
  | 'time_sequence_first_next'
  | 'time_mixed_pointing'
  | 'time_strategy_replay'
  | 'time_cause_effect'
  | 'time_timeline_order'
  | 'time_dual_prompt'
  | 'time_evidence'
  | 'time_literal_question'
  | 'time_recap_skill'
  | 'syllable_build_cv'
  | 'syllable_pick_word'
  | 'syllable_fix_order'
  | 'syllable_confusable'
  | 'syllable_read_phrase'
  | 'syllable_text_object'
  | 'syllable_transfer'
  | 'syllable_literal'
  | 'syllable_recap'
  | 'headline_main_story'
  | 'fact_report_note'
  | 'section_order_intro'
  | 'stamina_two_sentences'
  | 'strategy_text_evidence'
  | 'literal_class_report'
  | 'sequence_newsroom'
  | 'inference_anchored_clue'
  | 'evidence_quote'
  | 'headline_final_check'
  | 'recap_newsroom_skill';

const ALL_PAGE_IDS: PageId[] = ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12'];
const PAGE_IDS_BY_BOOK: Record<LadderBookId, PageId[]> = {
  book1: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08'],
  book4: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10'],
  book5: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10'],
  book6: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10'],
  book7: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12'],
  book8: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12'],
  book9: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12'],
  book10: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10'],
};
const PAGE_ID_SET = new Set<PageId>(ALL_PAGE_IDS);
const SWIPE_GESTURE_MIN_DISTANCE_PX = 56;
const SWIPE_GESTURE_MAX_VERTICAL_DRIFT_PX = 64;
const CONTROL_ROW_VIEWPORT_INSET_PX = 16;
const CONTROL_ROW_REALIGN_SHORT_DELAY_MS = 300;
const CONTROL_ROW_REALIGN_AFTER_PAGE_TURN_MS = 520;
const LADDER_BOOK_SEQUENCE: LadderBookId[] = ['book1', 'book4', 'book5', 'book6', 'book7', 'book8', 'book9', 'book10'];
const AGE_BAND_TO_BOOK: Record<AgeBand, LadderBookId> = READING_LADDER_BOOK_BY_AGE_BAND;
const LAUNCH_ALIAS_TO_HANDBOOK_SLUG: Record<LaunchSlotAlias, HandbookSlug> = {
  'bouncy-balloon': 'mikaSoundGarden',
  'magic-letter-map': 'magicLetterMap',
  'syllable-box': 'naamaSyllableBox',
  'star-message': 'tamarWordTower',
  'secret-clock': 'saharSecretClock',
  'class-newspaper': 'guyClassNewspaper',
  'root-family-lab': 'almaRootFamilies',
};
const BOOK_TO_LAUNCH_ALIAS: Record<LadderBookId, LaunchSlotAlias> = {
  book1: 'bouncy-balloon',
  book4: 'magic-letter-map',
  book5: 'syllable-box',
  book6: 'magic-letter-map',
  book7: 'star-message',
  book8: 'secret-clock',
  book9: 'class-newspaper',
  book10: 'root-family-lab',
};
const BOOK_TO_HANDBOOK_SLUG: Record<LadderBookId, HandbookSlug> = {
  book1: 'mikaSoundGarden',
  book4: 'magicLetterMap',
  book5: 'naamaSyllableBox',
  book6: 'oriBreadMarket',
  book7: 'tamarWordTower',
  book8: 'saharSecretClock',
  book9: 'guyClassNewspaper',
  book10: 'almaRootFamilies',
};
const HANDBOOK_SLUG_TO_BOOK: Record<HandbookSlug, LadderBookId> = {
  mikaSoundGarden: 'book1',
  yoavLetterMap: 'book4',
  naamaSyllableBox: 'book5',
  oriBreadMarket: 'book6',
  tamarWordTower: 'book7',
  saharSecretClock: 'book8',
  guyClassNewspaper: 'book9',
  almaRootFamilies: 'book10',
  magicLetterMap: 'book4',
};
const BOOK_TO_DEFAULT_AGE_BAND: Record<LadderBookId, AgeBand> = READING_DEFAULT_AGE_BAND_BY_BOOK;
const STORY_DEPTH_SLUG_BY_BOOK: Partial<Record<LadderBookId, StoryDepthHandbookSlug>> = {
  book1: 'mikaSoundGarden',
  book7: 'tamarWordTower',
};
const STORY_ARC_CHAPTER_PAGES: Partial<Record<LadderBookId, Record<StoryArcChapterId, PageId[]>>> = {
  book1: {
    chapterA: ['p01', 'p02', 'p03'],
    chapterB: ['p04', 'p05', 'p06'],
    chapterC: ['p07', 'p08'],
  },
  book4: {
    chapterA: ['p01', 'p02', 'p03'],
    chapterB: ['p04', 'p05', 'p06', 'p07'],
    chapterC: ['p08', 'p09', 'p10'],
  },
  book7: {
    chapterA: ['p01', 'p02', 'p03', 'p04'],
    chapterB: ['p05', 'p06', 'p07', 'p08'],
    chapterC: ['p09', 'p10', 'p11', 'p12'],
  },
};
const DEFAULT_QUALITY_GATE_BY_BOOK: Record<LadderBookId, { firstTryAccuracyMin: number; hintRateMax: number }> = {
  book1: { firstTryAccuracyMin: 60, hintRateMax: 55 },
  book4: { firstTryAccuracyMin: 80, hintRateMax: 35 },
  book5: { firstTryAccuracyMin: 80, hintRateMax: 35 },
  book6: { firstTryAccuracyMin: 82, hintRateMax: 35 },
  book7: { firstTryAccuracyMin: 78, hintRateMax: 30 },
  book8: { firstTryAccuracyMin: 75, hintRateMax: 35 },
  book9: { firstTryAccuracyMin: 75, hintRateMax: 32 },
  book10: { firstTryAccuracyMin: 75, hintRateMax: 35 },
};
const PROMPT_KEY_ORDER_BY_BOOK: Record<LadderBookId, string[]> = {
  book1: ['firstSound', 'trackLetter', 'findSpeaker', 'choosePicture'],
  book4: ['decodeWord', 'chooseNikud', 'contrastLetters', 'readThenAnswer'],
  book5: [
    'buildCV',
    'pickDecodedWord',
    'fixSyllableOrder',
    'confusableSyllable',
    'readShortPhrase',
    'textToObject',
    'transferBlend',
    'literalQuestion',
    'recapChoice',
  ],
  book6: ['readSignWord', 'spotFinalForm', 'textLinkedCount', 'sortWordToStall', 'sequenceByPhrase', 'literalQuestion'],
  book7: ['decodePhrase', 'bridgePhrase', 'sequenceCheck', 'evidenceTap'],
  book8: [
    'decodeClue',
    'matchTimeMarker',
    'firstNextCheck',
    'mixedPointingRead',
    'strategyReplay',
    'causeEffectChoice',
    'timelineOrder',
    'dualTimePrompt',
    'tapEvidence',
    'literalQuestion',
    'recapChoice',
  ],
  book9: [
    'headlineMatch',
    'findFact',
    'orderSections',
    'twoSentenceRead',
    'strategyPrompt',
    'literalChoice',
    'eventSequence',
    'anchoredInference',
    'tapEvidence',
    'headlineCheckFinal',
    'recapChoice',
  ],
  book10: [
    'spotRootPattern',
    'sortByRoot',
    'contextFamilyChoice',
    'contrastFamilies',
    'strategyHint',
    'buildSentenceWord',
    'literalQuestion',
    'transferWord',
    'tapEvidence',
    'finalFamilyDecision',
  ],
};
const HANDBOOKS_WITH_ILLUSTRATIONS = new Set<HandbookSlug>(['magicLetterMap']);
const MAGIC_LETTER_MAP_EXPOSURE_INTERACTION_IDS = new Set<string>([
  'decodePointedWord',
  'chooseWordByNikud',
  'confusableContrast',
  'literalAfterDecoding',
  // Legacy id kept to protect old runtime payloads.
  'literalComprehension',
]);
const ILLUSTRATION_WIDTH = 1600;
const ILLUSTRATION_HEIGHT = 1000;
const STARTUP_NARRATION_DELAY_MS = 320;
const POST_NARRATION_PROMPT_DELAY_MS = 220;
const INTERACTION_FLOW_BY_BOOK: Record<
  LadderBookId,
  Array<{ pageId: PageId; interactionId: string; presetId: InteractionChoicePresetId; required?: boolean }>
> = {
  book1: [
    { pageId: 'p02', interactionId: 'firstSoundTap', presetId: 'letters_bet' },
    { pageId: 'p04', interactionId: 'letterPath', presetId: 'letters_pe' },
    { pageId: 'p06', interactionId: 'literalChoice', presetId: 'words_dubi' },
  ],
  book4: [
    { pageId: 'p02', interactionId: 'decodePointedWord', presetId: 'words_gan' },
    { pageId: 'p04', interactionId: 'chooseWordByNikud', presetId: 'words_dubi' },
    { pageId: 'p06', interactionId: 'confusableContrast', presetId: 'letters_pe' },
    { pageId: 'p08', interactionId: 'literalAfterDecoding', presetId: 'literal_bread_delivery' },
  ],
  book5: [
    { pageId: 'p02', interactionId: 'buildCV', presetId: 'syllable_build_cv' },
    { pageId: 'p03', interactionId: 'pickDecodedWord', presetId: 'syllable_pick_word' },
    { pageId: 'p04', interactionId: 'fixSyllableOrder', presetId: 'syllable_fix_order' },
    { pageId: 'p05', interactionId: 'confusableSyllable', presetId: 'syllable_confusable', required: false },
    { pageId: 'p06', interactionId: 'readShortPhrase', presetId: 'syllable_read_phrase' },
    { pageId: 'p07', interactionId: 'textToObject', presetId: 'syllable_text_object' },
    { pageId: 'p08', interactionId: 'transferBlend', presetId: 'syllable_transfer', required: false },
    { pageId: 'p09', interactionId: 'literalQuestion', presetId: 'syllable_literal' },
    { pageId: 'p10', interactionId: 'recapChoice', presetId: 'syllable_recap', required: false },
  ],
  book6: [
    { pageId: 'p02', interactionId: 'readSignWord', presetId: 'market_words_chalah' },
    { pageId: 'p03', interactionId: 'spotFinalForm', presetId: 'final_form_mem' },
    { pageId: 'p04', interactionId: 'textLinkedCount', presetId: 'numbers_four' },
    { pageId: 'p05', interactionId: 'sortWordToStall', presetId: 'market_stall_bread' },
    { pageId: 'p06', interactionId: 'finalFormContrast', presetId: 'final_form_contrast' },
    { pageId: 'p07', interactionId: 'sequenceByPhrase', presetId: 'sequence_market' },
    { pageId: 'p08', interactionId: 'neutralImageDecode', presetId: 'neutral_label_bread', required: false },
    { pageId: 'p09', interactionId: 'literalQuestion', presetId: 'literal_bread_delivery' },
    { pageId: 'p10', interactionId: 'recapChoice', presetId: 'recap_final_forms' },
  ],
  book7: [
    { pageId: 'p02', interactionId: 'decodePhraseA', presetId: 'words_gan' },
    { pageId: 'p03', interactionId: 'chooseExactPhrase', presetId: 'words_dubi' },
    { pageId: 'p04', interactionId: 'orderEvents', presetId: 'sequence_market' },
    { pageId: 'p05', interactionId: 'connectorMeaning', presetId: 'sequence_market' },
    { pageId: 'p07', interactionId: 'buildPhrase', presetId: 'recap_letters' },
    { pageId: 'p08', interactionId: 'tapEvidence', presetId: 'literal_bread_delivery' },
    { pageId: 'p09', interactionId: 'bridgePhrase', presetId: 'numbers_four', required: false },
    { pageId: 'p11', interactionId: 'literalQuestion', presetId: 'literal_bread_delivery' },
  ],
  book8: [
    { pageId: 'p02', interactionId: 'decodeClue', presetId: 'time_decode_clue' },
    { pageId: 'p03', interactionId: 'matchTimeMarker', presetId: 'time_marker_match' },
    { pageId: 'p04', interactionId: 'firstNextCheck', presetId: 'time_sequence_first_next', required: false },
    { pageId: 'p05', interactionId: 'mixedPointingRead', presetId: 'time_mixed_pointing' },
    { pageId: 'p06', interactionId: 'strategyReplay', presetId: 'time_strategy_replay', required: false },
    { pageId: 'p07', interactionId: 'causeEffectChoice', presetId: 'time_cause_effect' },
    { pageId: 'p08', interactionId: 'timelineOrder', presetId: 'time_timeline_order' },
    { pageId: 'p09', interactionId: 'dualTimePrompt', presetId: 'time_dual_prompt', required: false },
    { pageId: 'p10', interactionId: 'tapEvidence', presetId: 'time_evidence' },
    { pageId: 'p11', interactionId: 'literalQuestion', presetId: 'time_literal_question' },
    { pageId: 'p12', interactionId: 'recapChoice', presetId: 'time_recap_skill', required: false },
  ],
  book9: [
    { pageId: 'p02', interactionId: 'headlineMatch', presetId: 'headline_main_story' },
    { pageId: 'p03', interactionId: 'findFact', presetId: 'fact_report_note' },
    { pageId: 'p04', interactionId: 'orderSections', presetId: 'section_order_intro' },
    { pageId: 'p05', interactionId: 'twoSentenceRead', presetId: 'stamina_two_sentences', required: false },
    { pageId: 'p06', interactionId: 'strategyPrompt', presetId: 'strategy_text_evidence', required: false },
    { pageId: 'p07', interactionId: 'literalChoice', presetId: 'literal_class_report' },
    { pageId: 'p08', interactionId: 'eventSequence', presetId: 'sequence_newsroom' },
    { pageId: 'p09', interactionId: 'anchoredInference', presetId: 'inference_anchored_clue' },
    { pageId: 'p10', interactionId: 'tapEvidence', presetId: 'evidence_quote' },
    { pageId: 'p11', interactionId: 'headlineCheckFinal', presetId: 'headline_final_check' },
    { pageId: 'p12', interactionId: 'recapChoice', presetId: 'recap_newsroom_skill' },
  ],
  book10: [
    { pageId: 'p02', interactionId: 'spotRootPattern', presetId: 'root_pattern_katav' },
    { pageId: 'p03', interactionId: 'sortByRoot', presetId: 'root_sort_shamar' },
    { pageId: 'p04', interactionId: 'contextFamilyChoice', presetId: 'context_family_michtav' },
    { pageId: 'p05', interactionId: 'contrastFamilies', presetId: 'contrast_family_shorashim' },
    { pageId: 'p06', interactionId: 'strategyHint', presetId: 'strategy_repeat_letters', required: false },
    { pageId: 'p07', interactionId: 'buildSentenceWord', presetId: 'build_sentence_ketiva' },
    { pageId: 'p08', interactionId: 'literalQuestion', presetId: 'literal_lab_goal' },
    { pageId: 'p09', interactionId: 'transferWord', presetId: 'transfer_family_kotevet' },
    { pageId: 'p10', interactionId: 'finalFamilyDecision', presetId: 'final_family_decision' },
  ],
};
const CHOICE_PRESETS: Record<InteractionChoicePresetId, ChoiceDefinition[]> = {
  letters_bet: [
    { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: true },
    { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
    { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: false },
  ],
  letters_pe: [
    { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: true },
    { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: false },
    { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
  ],
  words_gan: [
    { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: true },
    { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
    { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: false },
  ],
  words_dubi: [
    { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: true },
    { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
    { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: false },
  ],
  numbers_four: [
    { id: 'two', labelKey: 'games.interactiveHandbook.choices.numbers.two', isCorrect: false },
    { id: 'four', labelKey: 'games.interactiveHandbook.choices.numbers.four', isCorrect: true },
    { id: 'six', labelKey: 'games.interactiveHandbook.choices.numbers.six', isCorrect: false },
  ],
  baskets_fruit: [
    { id: 'fruit', labelKey: 'games.interactiveHandbook.choices.baskets.fruit', isCorrect: true },
    { id: 'fish', labelKey: 'games.interactiveHandbook.choices.baskets.fish', isCorrect: false },
    { id: 'flowers', labelKey: 'games.interactiveHandbook.choices.baskets.flowers', isCorrect: false },
  ],
  recap_letters: [
    { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: false },
    { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: false },
    { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recap.letters', isCorrect: true },
  ],
  recap_counting: [
    { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: true },
    { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: false },
    { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recap.letters', isCorrect: false },
  ],
  syllable_build_cv: [
    { id: 'cv_na', labelKey: 'games.interactiveHandbook.choices.syllableCv.na', isCorrect: true },
    { id: 'cv_ma', labelKey: 'games.interactiveHandbook.choices.syllableCv.ma', isCorrect: false },
    { id: 'cv_sa', labelKey: 'games.interactiveHandbook.choices.syllableCv.sa', isCorrect: false },
  ],
  syllable_pick_word: [
    { id: 'word_naama', labelKey: 'games.interactiveHandbook.choices.syllableWords.naama', isCorrect: true },
    { id: 'word_shaon', labelKey: 'games.interactiveHandbook.choices.syllableWords.shaon', isCorrect: false },
    { id: 'word_dag', labelKey: 'games.interactiveHandbook.choices.syllableWords.dag', isCorrect: false },
  ],
  syllable_fix_order: [
    { id: 'order_na_ma', labelKey: 'games.interactiveHandbook.choices.syllableOrder.naMa', isCorrect: true },
    { id: 'order_ma_na', labelKey: 'games.interactiveHandbook.choices.syllableOrder.maNa', isCorrect: false },
    { id: 'order_na_na', labelKey: 'games.interactiveHandbook.choices.syllableOrder.naNa', isCorrect: false },
  ],
  syllable_confusable: [
    { id: 'conf_na', labelKey: 'games.interactiveHandbook.choices.syllableConfusable.na', isCorrect: true },
    { id: 'conf_ra', labelKey: 'games.interactiveHandbook.choices.syllableConfusable.ra', isCorrect: false },
    { id: 'conf_la', labelKey: 'games.interactiveHandbook.choices.syllableConfusable.la', isCorrect: false },
  ],
  syllable_read_phrase: [
    { id: 'phrase_open_box', labelKey: 'games.interactiveHandbook.choices.syllablePhrase.openBox', isCorrect: true },
    { id: 'phrase_close_door', labelKey: 'games.interactiveHandbook.choices.syllablePhrase.closeDoor', isCorrect: false },
    { id: 'phrase_draw_sun', labelKey: 'games.interactiveHandbook.choices.syllablePhrase.drawSun', isCorrect: false },
  ],
  syllable_text_object: [
    { id: 'obj_key', labelKey: 'games.interactiveHandbook.choices.syllableObjects.key', isCorrect: true },
    { id: 'obj_ball', labelKey: 'games.interactiveHandbook.choices.syllableObjects.ball', isCorrect: false },
    { id: 'obj_flower', labelKey: 'games.interactiveHandbook.choices.syllableObjects.flower', isCorrect: false },
  ],
  syllable_transfer: [
    { id: 'transfer_nama', labelKey: 'games.interactiveHandbook.choices.syllableTransfer.nama', isCorrect: true },
    { id: 'transfer_dubi', labelKey: 'games.interactiveHandbook.choices.syllableTransfer.dubi', isCorrect: false },
    { id: 'transfer_lehem', labelKey: 'games.interactiveHandbook.choices.syllableTransfer.lehem', isCorrect: false },
  ],
  syllable_literal: [
    { id: 'literal_found_key', labelKey: 'games.interactiveHandbook.choices.syllableLiteral.foundKey', isCorrect: true },
    { id: 'literal_found_cloud', labelKey: 'games.interactiveHandbook.choices.syllableLiteral.foundCloud', isCorrect: false },
    { id: 'literal_found_fish', labelKey: 'games.interactiveHandbook.choices.syllableLiteral.foundFish', isCorrect: false },
  ],
  syllable_recap: [
    { id: 'recap_blend', labelKey: 'games.interactiveHandbook.choices.syllableRecap.blend', isCorrect: true },
    { id: 'recap_color', labelKey: 'games.interactiveHandbook.choices.syllableRecap.color', isCorrect: false },
    { id: 'recap_count', labelKey: 'games.interactiveHandbook.choices.syllableRecap.count', isCorrect: false },
  ],
  market_words_chalah: [
    { id: 'chalah', labelKey: 'games.interactiveHandbook.choices.marketWords.chalah', isCorrect: true },
    { id: 'kadur', labelKey: 'games.interactiveHandbook.choices.marketWords.kadur', isCorrect: false },
    { id: 'dag', labelKey: 'games.interactiveHandbook.choices.marketWords.dag', isCorrect: false },
  ],
  final_form_mem: [
    { id: 'mem_sofit', labelKey: 'games.interactiveHandbook.choices.finalForms.memSofit', isCorrect: true },
    { id: 'mem_regular', labelKey: 'games.interactiveHandbook.choices.finalForms.memRegular', isCorrect: false },
    { id: 'nun_sofit', labelKey: 'games.interactiveHandbook.choices.finalForms.nunSofit', isCorrect: false },
  ],
  market_stall_bread: [
    { id: 'bread', labelKey: 'games.interactiveHandbook.choices.marketStalls.bread', isCorrect: true },
    { id: 'fruit', labelKey: 'games.interactiveHandbook.choices.marketStalls.fruit', isCorrect: false },
    { id: 'fish', labelKey: 'games.interactiveHandbook.choices.marketStalls.fish', isCorrect: false },
  ],
  final_form_contrast: [
    { id: 'nun_sofit', labelKey: 'games.interactiveHandbook.choices.finalForms.nunSofit', isCorrect: true },
    { id: 'nun_regular', labelKey: 'games.interactiveHandbook.choices.finalForms.nunRegular', isCorrect: false },
    { id: 'mem_regular', labelKey: 'games.interactiveHandbook.choices.finalForms.memRegular', isCorrect: false },
  ],
  sequence_market: [
    { id: 'first_read', labelKey: 'games.interactiveHandbook.choices.sequence.firstRead', isCorrect: true },
    { id: 'then_count', labelKey: 'games.interactiveHandbook.choices.sequence.thenCount', isCorrect: false },
    { id: 'then_deliver', labelKey: 'games.interactiveHandbook.choices.sequence.thenDeliver', isCorrect: false },
  ],
  neutral_label_bread: [
    { id: 'bread_tag', labelKey: 'games.interactiveHandbook.choices.neutralLabels.breadTag', isCorrect: true },
    { id: 'flower_tag', labelKey: 'games.interactiveHandbook.choices.neutralLabels.flowerTag', isCorrect: false },
    { id: 'toy_tag', labelKey: 'games.interactiveHandbook.choices.neutralLabels.toyTag', isCorrect: false },
  ],
  literal_bread_delivery: [
    { id: 'deliver_two', labelKey: 'games.interactiveHandbook.choices.literal.deliveryTwo', isCorrect: true },
    { id: 'deliver_four', labelKey: 'games.interactiveHandbook.choices.literal.deliveryFour', isCorrect: false },
    { id: 'deliver_five', labelKey: 'games.interactiveHandbook.choices.literal.deliveryFive', isCorrect: false },
  ],
  recap_final_forms: [
    { id: 'final_forms', labelKey: 'games.interactiveHandbook.choices.recap.finalForms', isCorrect: true },
    { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: false },
    { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: false },
  ],
  root_pattern_katav: [
    { id: 'root_katav', labelKey: 'games.interactiveHandbook.choices.rootFamilies.katav', isCorrect: true },
    { id: 'root_shamar', labelKey: 'games.interactiveHandbook.choices.rootFamilies.shamar', isCorrect: false },
    { id: 'root_achal', labelKey: 'games.interactiveHandbook.choices.rootFamilies.achal', isCorrect: false },
  ],
  root_sort_shamar: [
    { id: 'root_katav', labelKey: 'games.interactiveHandbook.choices.rootFamilies.katav', isCorrect: false },
    { id: 'root_shamar', labelKey: 'games.interactiveHandbook.choices.rootFamilies.shamar', isCorrect: true },
    { id: 'root_achal', labelKey: 'games.interactiveHandbook.choices.rootFamilies.achal', isCorrect: false },
  ],
  context_family_michtav: [
    { id: 'michtav', labelKey: 'games.interactiveHandbook.choices.rootWords.michtav', isCorrect: true },
    { id: 'shmira', labelKey: 'games.interactiveHandbook.choices.rootWords.shmira', isCorrect: false },
    { id: 'achila', labelKey: 'games.interactiveHandbook.choices.rootWords.achila', isCorrect: false },
  ],
  contrast_family_shorashim: [
    { id: 'shomer', labelKey: 'games.interactiveHandbook.choices.rootWords.shomer', isCorrect: true },
    { id: 'kotev', labelKey: 'games.interactiveHandbook.choices.rootWords.kotev', isCorrect: false },
    { id: 'ochel', labelKey: 'games.interactiveHandbook.choices.rootWords.ochel', isCorrect: false },
  ],
  strategy_repeat_letters: [
    { id: 'repeat_letters', labelKey: 'games.interactiveHandbook.choices.rootStrategies.repeatLetters', isCorrect: true },
    { id: 'image_only', labelKey: 'games.interactiveHandbook.choices.rootStrategies.imageOnly', isCorrect: false },
    { id: 'guess_fast', labelKey: 'games.interactiveHandbook.choices.rootStrategies.guessFast', isCorrect: false },
  ],
  build_sentence_ketiva: [
    { id: 'ketiva', labelKey: 'games.interactiveHandbook.choices.rootWords.ketiva', isCorrect: true },
    { id: 'shmira', labelKey: 'games.interactiveHandbook.choices.rootWords.shmira', isCorrect: false },
    { id: 'achila', labelKey: 'games.interactiveHandbook.choices.rootWords.achila', isCorrect: false },
  ],
  literal_lab_goal: [
    { id: 'find_family', labelKey: 'games.interactiveHandbook.choices.rootLiteral.findFamily', isCorrect: true },
    { id: 'count_stars', labelKey: 'games.interactiveHandbook.choices.rootLiteral.countStars', isCorrect: false },
    { id: 'paint_wall', labelKey: 'games.interactiveHandbook.choices.rootLiteral.paintWall', isCorrect: false },
  ],
  transfer_family_kotevet: [
    { id: 'kotevet', labelKey: 'games.interactiveHandbook.choices.rootWords.kotevet', isCorrect: true },
    { id: 'shomeret', labelKey: 'games.interactiveHandbook.choices.rootWords.shomeret', isCorrect: false },
    { id: 'ochelet', labelKey: 'games.interactiveHandbook.choices.rootWords.ochelet', isCorrect: false },
  ],
  final_family_decision: [
    { id: 'katav_family', labelKey: 'games.interactiveHandbook.choices.rootFamilies.katav', isCorrect: true },
    { id: 'shamar_family', labelKey: 'games.interactiveHandbook.choices.rootFamilies.shamar', isCorrect: false },
    { id: 'achal_family', labelKey: 'games.interactiveHandbook.choices.rootFamilies.achal', isCorrect: false },
  ],
  time_decode_clue: [
    { id: 'clue_after_song', labelKey: 'games.interactiveHandbook.choices.timeClues.afterSong', isCorrect: true },
    { id: 'clue_before_song', labelKey: 'games.interactiveHandbook.choices.timeClues.beforeSong', isCorrect: false },
    { id: 'clue_no_song', labelKey: 'games.interactiveHandbook.choices.timeClues.noSong', isCorrect: false },
  ],
  time_marker_match: [
    { id: 'marker_after', labelKey: 'games.interactiveHandbook.choices.timeMarkers.after', isCorrect: true },
    { id: 'marker_before', labelKey: 'games.interactiveHandbook.choices.timeMarkers.before', isCorrect: false },
    { id: 'marker_now', labelKey: 'games.interactiveHandbook.choices.timeMarkers.now', isCorrect: false },
  ],
  time_sequence_first_next: [
    { id: 'seq_read_then_turn', labelKey: 'games.interactiveHandbook.choices.timeSequence.readThenTurn', isCorrect: true },
    { id: 'seq_turn_then_read', labelKey: 'games.interactiveHandbook.choices.timeSequence.turnThenRead', isCorrect: false },
    { id: 'seq_sleep_then_read', labelKey: 'games.interactiveHandbook.choices.timeSequence.sleepThenRead', isCorrect: false },
  ],
  time_mixed_pointing: [
    { id: 'word_clue', labelKey: 'games.interactiveHandbook.choices.timeWords.clue', isCorrect: true },
    { id: 'word_bread', labelKey: 'games.interactiveHandbook.choices.timeWords.bread', isCorrect: false },
    { id: 'word_ball', labelKey: 'games.interactiveHandbook.choices.timeWords.ball', isCorrect: false },
  ],
  time_strategy_replay: [
    { id: 'strategy_find_marker', labelKey: 'games.interactiveHandbook.choices.timeStrategies.findMarker', isCorrect: true },
    { id: 'strategy_guess_picture', labelKey: 'games.interactiveHandbook.choices.timeStrategies.guessPicture', isCorrect: false },
    { id: 'strategy_skip_line', labelKey: 'games.interactiveHandbook.choices.timeStrategies.skipLine', isCorrect: false },
  ],
  time_cause_effect: [
    { id: 'cause_opened_compartment', labelKey: 'games.interactiveHandbook.choices.timeCauseEffect.openedCompartment', isCorrect: true },
    { id: 'cause_closed_book', labelKey: 'games.interactiveHandbook.choices.timeCauseEffect.closedBook', isCorrect: false },
    { id: 'cause_lost_clue', labelKey: 'games.interactiveHandbook.choices.timeCauseEffect.lostClue', isCorrect: false },
  ],
  time_timeline_order: [
    { id: 'timeline_read_first', labelKey: 'games.interactiveHandbook.choices.timeTimeline.readFirst', isCorrect: true },
    { id: 'timeline_draw_first', labelKey: 'games.interactiveHandbook.choices.timeTimeline.drawFirst', isCorrect: false },
    { id: 'timeline_jump_first', labelKey: 'games.interactiveHandbook.choices.timeTimeline.jumpFirst', isCorrect: false },
  ],
  time_dual_prompt: [
    { id: 'dual_before_after', labelKey: 'games.interactiveHandbook.choices.timeDualMarkers.beforeAfter', isCorrect: true },
    { id: 'dual_color_only', labelKey: 'games.interactiveHandbook.choices.timeDualMarkers.colorOnly', isCorrect: false },
    { id: 'dual_number_only', labelKey: 'games.interactiveHandbook.choices.timeDualMarkers.numberOnly', isCorrect: false },
  ],
  time_evidence: [
    { id: 'evidence_after_word', labelKey: 'games.interactiveHandbook.choices.timeEvidence.afterWord', isCorrect: true },
    { id: 'evidence_picture_only', labelKey: 'games.interactiveHandbook.choices.timeEvidence.pictureOnly', isCorrect: false },
    { id: 'evidence_blank_line', labelKey: 'games.interactiveHandbook.choices.timeEvidence.blankLine', isCorrect: false },
  ],
  time_literal_question: [
    { id: 'literal_find_time', labelKey: 'games.interactiveHandbook.choices.timeLiteral.findTime', isCorrect: true },
    { id: 'literal_count_clouds', labelKey: 'games.interactiveHandbook.choices.timeLiteral.countClouds', isCorrect: false },
    { id: 'literal_paint_clock', labelKey: 'games.interactiveHandbook.choices.timeLiteral.paintClock', isCorrect: false },
  ],
  time_recap_skill: [
    { id: 'recap_time_markers', labelKey: 'games.interactiveHandbook.choices.timeRecap.timeMarkers', isCorrect: true },
    { id: 'recap_only_colors', labelKey: 'games.interactiveHandbook.choices.timeRecap.onlyColors', isCorrect: false },
    { id: 'recap_only_counting', labelKey: 'games.interactiveHandbook.choices.timeRecap.onlyCounting', isCorrect: false },
  ],
  headline_main_story: [
    { id: 'headline_science_club', labelKey: 'games.interactiveHandbook.choices.newspaperHeadlines.scienceClub', isCorrect: true },
    { id: 'headline_silent_hall', labelKey: 'games.interactiveHandbook.choices.newspaperHeadlines.silentHall', isCorrect: false },
    { id: 'headline_sleep_corner', labelKey: 'games.interactiveHandbook.choices.newspaperHeadlines.sleepCorner', isCorrect: false },
  ],
  fact_report_note: [
    { id: 'fact_printed_friday', labelKey: 'games.interactiveHandbook.choices.newspaperFacts.printedFriday', isCorrect: true },
    { id: 'fact_zero_pages', labelKey: 'games.interactiveHandbook.choices.newspaperFacts.zeroPages', isCorrect: false },
    { id: 'fact_closed_room', labelKey: 'games.interactiveHandbook.choices.newspaperFacts.closedRoom', isCorrect: false },
  ],
  section_order_intro: [
    { id: 'section_intro', labelKey: 'games.interactiveHandbook.choices.newspaperSections.intro', isCorrect: true },
    { id: 'section_body', labelKey: 'games.interactiveHandbook.choices.newspaperSections.body', isCorrect: false },
    { id: 'section_closing', labelKey: 'games.interactiveHandbook.choices.newspaperSections.closing', isCorrect: false },
  ],
  stamina_two_sentences: [
    { id: 'stamina_two_sentences', labelKey: 'games.interactiveHandbook.choices.newspaperStamina.twoSentences', isCorrect: true },
    { id: 'stamina_one_word', labelKey: 'games.interactiveHandbook.choices.newspaperStamina.oneWord', isCorrect: false },
    { id: 'stamina_image_only', labelKey: 'games.interactiveHandbook.choices.newspaperStamina.imageOnly', isCorrect: false },
  ],
  strategy_text_evidence: [
    { id: 'strategy_find_evidence', labelKey: 'games.interactiveHandbook.choices.newspaperStrategies.findEvidence', isCorrect: true },
    { id: 'strategy_guess_image', labelKey: 'games.interactiveHandbook.choices.newspaperStrategies.guessImage', isCorrect: false },
    { id: 'strategy_read_title_only', labelKey: 'games.interactiveHandbook.choices.newspaperStrategies.readTitleOnly', isCorrect: false },
  ],
  literal_class_report: [
    { id: 'literal_lina_report', labelKey: 'games.interactiveHandbook.choices.newspaperLiteral.linaReport', isCorrect: true },
    { id: 'literal_or_report', labelKey: 'games.interactiveHandbook.choices.newspaperLiteral.orReport', isCorrect: false },
    { id: 'literal_noam_report', labelKey: 'games.interactiveHandbook.choices.newspaperLiteral.noamReport', isCorrect: false },
  ],
  sequence_newsroom: [
    { id: 'event_first_interview', labelKey: 'games.interactiveHandbook.choices.newspaperEvents.firstInterview', isCorrect: true },
    { id: 'event_then_print', labelKey: 'games.interactiveHandbook.choices.newspaperEvents.thenPrint', isCorrect: false },
    { id: 'event_then_sleep', labelKey: 'games.interactiveHandbook.choices.newspaperEvents.thenSleep', isCorrect: false },
  ],
  inference_anchored_clue: [
    { id: 'inference_team_excited', labelKey: 'games.interactiveHandbook.choices.newspaperInference.teamExcited', isCorrect: true },
    { id: 'inference_team_bored', labelKey: 'games.interactiveHandbook.choices.newspaperInference.teamBored', isCorrect: false },
    { id: 'inference_team_absent', labelKey: 'games.interactiveHandbook.choices.newspaperInference.teamAbsent', isCorrect: false },
  ],
  evidence_quote: [
    { id: 'evidence_quote_excited', labelKey: 'games.interactiveHandbook.choices.newspaperEvidence.quoteExcited', isCorrect: true },
    { id: 'evidence_quote_rain', labelKey: 'games.interactiveHandbook.choices.newspaperEvidence.quoteRain', isCorrect: false },
    { id: 'evidence_quote_quiet', labelKey: 'games.interactiveHandbook.choices.newspaperEvidence.quoteQuiet', isCorrect: false },
  ],
  headline_final_check: [
    { id: 'headline_final_team', labelKey: 'games.interactiveHandbook.choices.newspaperFinalHeadline.teamEdition', isCorrect: true },
    { id: 'headline_final_empty', labelKey: 'games.interactiveHandbook.choices.newspaperFinalHeadline.emptyEdition', isCorrect: false },
    { id: 'headline_final_sleep', labelKey: 'games.interactiveHandbook.choices.newspaperFinalHeadline.sleepEdition', isCorrect: false },
  ],
  recap_newsroom_skill: [
    { id: 'recap_read_from_text', labelKey: 'games.interactiveHandbook.choices.newspaperRecap.readFromText', isCorrect: true },
    { id: 'recap_guess_only', labelKey: 'games.interactiveHandbook.choices.newspaperRecap.guessOnly', isCorrect: false },
    { id: 'recap_skip_lines', labelKey: 'games.interactiveHandbook.choices.newspaperRecap.skipLines', isCorrect: false },
  ],
};

const RUNTIME_INTERACTION_PRESET_FALLBACKS: Partial<
  Record<HandbookSlug, Partial<Record<string, InteractionChoicePresetId>>>
> = {
  magicLetterMap: {
    firstSound: 'letters_bet',
    chooseLetter: 'letters_pe',
    simpleAdd: 'numbers_four',
    decodePointedWord: 'words_gan',
    literalComprehension: 'words_dubi',
    sortObjects: 'baskets_fruit',
    recapSkill: 'recap_letters',
  },
};

function isHandbookSlug(value: unknown): value is HandbookSlug {
  return (
    value === 'mikaSoundGarden' ||
    value === 'yoavLetterMap' ||
    value === 'naamaSyllableBox' ||
    value === 'oriBreadMarket' ||
    value === 'tamarWordTower' ||
    value === 'saharSecretClock' ||
    value === 'guyClassNewspaper' ||
    value === 'almaRootFamilies' ||
    value === 'magicLetterMap'
  );
}

function handbookMetaKey(slug: HandbookSlug, field: 'title' | 'subtitle' | 'estimatedDuration'): string {
  if (slug === 'magicLetterMap') {
    return `games.interactiveHandbook.handbooks.magicLetterMap.cover.${field}`;
  }
  return `handbooks.${slug}.meta.${field}`;
}

function handbookScriptKey(
  slug: HandbookSlug,
  section: 'narration' | 'prompts' | 'hints' | 'retry' | 'praise',
  key: string,
): string {
  return `handbooks.${slug}.scriptPackage.${section}.${key}`;
}

function handbookSentenceKey(slug: HandbookSlug, group: string, key: string): string {
  if (slug === 'magicLetterMap') {
    return `games.interactiveHandbook.handbooks.magicLetterMap.pages.${key}.narration`;
  }
  return `handbooks.${slug}.sentenceBank.${group}.${key}`;
}

function resolveStoryDepthSlugForBook(activeBookId: LadderBookId, handbookSlug: HandbookSlug): StoryDepthHandbookSlug | null {
  const bookSpecificSlug = STORY_DEPTH_SLUG_BY_BOOK[activeBookId];
  if (bookSpecificSlug) {
    return bookSpecificSlug;
  }

  if (handbookSlug === 'mikaSoundGarden' || handbookSlug === 'yoavLetterMap' || handbookSlug === 'tamarWordTower') {
    return handbookSlug;
  }

  return null;
}

function resolveStoryDepthSlugForRuntime(handbookSlug: HandbookSlug): StoryDepthHandbookSlug | null {
  if (handbookSlug === 'mikaSoundGarden' || handbookSlug === 'yoavLetterMap' || handbookSlug === 'tamarWordTower') {
    return handbookSlug;
  }

  return null;
}

function storyPageToken(pageId: PageId): string {
  return `page${pageId.slice(1)}`;
}

function handbookStoryPageKey(
  slug: StoryDepthHandbookSlug,
  pageId: PageId,
  field: 'narration' | 'cta',
): string {
  return `handbooks.${slug}.pages.${storyPageToken(pageId)}.${field}`;
}

function handbookStoryArcKey(
  slug: StoryDepthHandbookSlug,
  chapterId: StoryArcChapterId,
  field: 'title' | 'transition',
): string {
  return `handbooks.${slug}.storyArc.${chapterId}.${field}`;
}

function handbookChapterRecapKey(
  slug: StoryDepthHandbookSlug,
  field: 'title' | 'summary' | 'nextStep',
): string {
  return `handbooks.${slug}.chapterRecap.${field}`;
}

function resolveStoryArcChapterId(activeBookId: LadderBookId, pageId: PageId): StoryArcChapterId | null {
  const chapterPagesById = STORY_ARC_CHAPTER_PAGES[activeBookId];
  if (!chapterPagesById) {
    return null;
  }

  if (chapterPagesById.chapterA.includes(pageId)) return 'chapterA';
  if (chapterPagesById.chapterB.includes(pageId)) return 'chapterB';
  if (chapterPagesById.chapterC.includes(pageId)) return 'chapterC';
  return null;
}

function countCompletedStoryArcChapters(activeBookId: LadderBookId, visitedPages: Set<PageId>): number {
  const chapterPagesById = STORY_ARC_CHAPTER_PAGES[activeBookId];
  if (!chapterPagesById) {
    return 0;
  }

  const chapterIds: StoryArcChapterId[] = ['chapterA', 'chapterB', 'chapterC'];
  return chapterIds.filter((chapterId) => chapterPagesById[chapterId].every((pageId) => visitedPages.has(pageId))).length;
}

function isStoryDepthPageKey(
  key: string,
  slug: StoryDepthHandbookSlug,
  field?: 'narration' | 'cta',
): boolean {
  if (!key.startsWith(`handbooks.${slug}.pages.page`)) {
    return false;
  }

  if (!field) {
    return key.endsWith('.narration') || key.endsWith('.cta');
  }

  return key.endsWith(`.${field}`);
}

const INTERACTION_KEY_ALIAS_BY_SLUG: Partial<Record<HandbookSlug, Record<string, string>>> = {
  tamarWordTower: {
    decodePhraseA: 'decodePointedPhrase',
    chooseExactPhrase: 'decodePointedPhrase',
    orderEvents: 'sequenceOrder',
    connectorMeaning: 'decodeBridgePhrase',
    buildPhrase: 'decodeBridgePhrase',
    tapEvidence: 'textEvidenceTap',
    bridgePhrase: 'decodeBridgePhrase',
    literalQuestion: 'textEvidenceTap',
  },
  magicLetterMap: {
    // Legacy ids still arrive from older flow/runtime payloads.
    chooseWordByNikud: 'decodePointedWord',
    literalAfterDecoding: 'literalComprehension',
  },
};

function resolveInteractionKeyAlias(slug: HandbookSlug, interactionId: string): string {
  const slugAliases = INTERACTION_KEY_ALIAS_BY_SLUG[slug];
  if (!slugAliases) {
    return interactionId;
  }

  return slugAliases[interactionId] ?? interactionId;
}

function handbookInteractionKey(slug: HandbookSlug, interactionId: string, field: 'prompt' | 'hint' | 'success' | 'retry'): string {
  const normalizedInteractionId = resolveInteractionKeyAlias(slug, interactionId);
  if (slug === 'magicLetterMap') {
    return `games.interactiveHandbook.handbooks.magicLetterMap.interactions.${normalizedInteractionId}.${field}`;
  }
  return `handbooks.${slug}.interactions.${normalizedInteractionId}.${field}`;
}

function normalizeRuntimeInteractionTextKey(
  slug: HandbookSlug,
  interactionId: string,
  field: 'prompt' | 'hint' | 'success' | 'retry',
  rawKey: string | null | undefined,
): string | null {
  if (typeof rawKey !== 'string') {
    return null;
  }

  const textKey = rawKey.trim();
  if (textKey.length === 0) {
    return null;
  }

  const normalizedInteractionId = resolveInteractionKeyAlias(slug, interactionId);
  if (normalizedInteractionId === interactionId) {
    return textKey;
  }

  const segments = textKey.split('.');
  const interactionsIndex = segments.lastIndexOf('interactions');
  if (interactionsIndex < 0 || interactionsIndex + 2 !== segments.length - 1) {
    return textKey;
  }

  const keyInteractionId = segments[interactionsIndex + 1] ?? '';
  const keyField = segments[interactionsIndex + 2] ?? '';
  if (keyInteractionId !== interactionId || keyField !== field) {
    return textKey;
  }

  segments[interactionsIndex + 1] = normalizedInteractionId;
  return segments.join('.');
}

function normalizeRuntimePromptBlockKey(slug: HandbookSlug, rawKey: string | null): string | null {
  if (!rawKey) {
    return rawKey;
  }

  const segments = rawKey.split('.');
  const interactionsIndex = segments.lastIndexOf('interactions');
  if (interactionsIndex < 0 || interactionsIndex + 2 !== segments.length - 1) {
    return rawKey;
  }

  const field = segments[interactionsIndex + 2] ?? '';
  if (field !== 'prompt' && field !== 'hint' && field !== 'success' && field !== 'retry') {
    return rawKey;
  }

  const interactionId = segments[interactionsIndex + 1] ?? '';
  const normalizedInteractionId = resolveInteractionKeyAlias(slug, interactionId);
  if (normalizedInteractionId === interactionId) {
    return rawKey;
  }

  segments[interactionsIndex + 1] = normalizedInteractionId;
  return segments.join('.');
}

function parentHandbookKey(
  slug: HandbookSlug,
  field:
    | 'progressSummary'
    | 'nextStep'
    | 'readingSignal'
    | 'confusionFocus'
    | 'storyEngagement'
    | 'decodeInStoryAccuracy'
    | 'evidenceReading'
    | 'independenceTrend',
): string {
  if (slug === 'magicLetterMap') {
    if (field === 'progressSummary' || field === 'nextStep') {
      return `parentDashboard.games.interactiveHandbook.${field}`;
    }
    return `parentDashboard.handbooks.yoavLetterMap.${field}`;
  }
  return `parentDashboard.handbooks.${slug}.${field}`;
}

function completionPraiseKey(slug: HandbookSlug, activeBookId: LadderBookId): string {
  const storyDepthSlug = resolveStoryDepthSlugForBook(activeBookId, slug);
  if (storyDepthSlug) {
    return handbookChapterRecapKey(storyDepthSlug, 'title');
  }

  if (slug === 'magicLetterMap') {
    return 'games.interactiveHandbook.handbooks.magicLetterMap.completion.title';
  }
  if (activeBookId === 'book1') return handbookScriptKey(slug, 'praise', 'teamwork');
  if (activeBookId === 'book4') return handbookScriptKey(slug, 'praise', 'greatProgress');
  if (activeBookId === 'book5') return handbookScriptKey(slug, 'praise', 'blendStrategy');
  if (activeBookId === 'book6') return handbookScriptKey(slug, 'praise', 'focused');
  if (activeBookId === 'book8') return handbookScriptKey(slug, 'praise', 'timeDetective');
  if (activeBookId === 'book9') return handbookScriptKey(slug, 'praise', 'newsroom');
  if (activeBookId === 'book10') return handbookScriptKey(slug, 'praise', 'patternSpotter');
  return handbookScriptKey(slug, 'praise', 'independent');
}

function completionSummaryKey(slug: HandbookSlug, activeBookId: LadderBookId): string {
  const storyDepthSlug = resolveStoryDepthSlugForBook(activeBookId, slug);
  if (storyDepthSlug) {
    return handbookChapterRecapKey(storyDepthSlug, 'summary');
  }

  return parentHandbookKey(slug, 'progressSummary');
}

function completionNextStepKey(slug: HandbookSlug, activeBookId: LadderBookId): string {
  const storyDepthSlug = resolveStoryDepthSlugForBook(activeBookId, slug);
  if (storyDepthSlug) {
    return handbookChapterRecapKey(storyDepthSlug, 'nextStep');
  }

  return parentHandbookKey(slug, 'nextStep');
}

function buildNarrationSentenceKeys(
  activeBookId: LadderBookId,
  handbookSlug: HandbookSlug,
  pageIds: PageId[],
): string[] {
  const storyDepthSlug = resolveStoryDepthSlugForBook(activeBookId, handbookSlug);
  if (storyDepthSlug) {
    return pageIds.map((pageId) => handbookStoryPageKey(storyDepthSlug, pageId, 'narration'));
  }

  if (activeBookId === 'book1') {
    return [
      handbookScriptKey(handbookSlug, 'narration', 'intro'),
      handbookScriptKey(handbookSlug, 'narration', 'checkpoint'),
      handbookScriptKey(handbookSlug, 'narration', 'transition'),
      handbookScriptKey(handbookSlug, 'narration', 'outro'),
      ...['p01', 'p02', 'p03', 'p04'].map((id) => handbookSentenceKey(handbookSlug, 'modeledPhrases', id)),
    ];
  }

  if (activeBookId === 'book4') {
    return ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08'].map((id) =>
      handbookSentenceKey(handbookSlug, 'pointedPhrases', id),
    );
  }

  if (activeBookId === 'book5') {
    return pageIds.map((pageId) => handbookSentenceKey(handbookSlug, 'pointedPhrases', pageId));
  }

  if (activeBookId === 'book6') {
    return pageIds.map((pageId) => handbookSentenceKey(handbookSlug, 'pointedPhrases', pageId));
  }

  if (activeBookId === 'book8') {
    return pageIds.map((pageId) => handbookSentenceKey(handbookSlug, 'pointedPhrases', pageId));
  }

  if (activeBookId === 'book9') {
    return pageIds.map((pageId) => handbookSentenceKey(handbookSlug, 'pointedPhrases', pageId));
  }

  if (activeBookId === 'book10') {
    return pageIds.map((pageId) => handbookSentenceKey(handbookSlug, 'pointedPhrases', pageId));
  }

  if (activeBookId === 'book7') {
    return [
      handbookScriptKey(handbookSlug, 'narration', 'intro'),
      ...['p01', 'p02', 'p03', 'p04', 'p05'].map((id) => handbookSentenceKey(handbookSlug, 'pointedPhrases', id)),
      ...['b01', 'b02', 'b03', 'b04', 'b05'].map((id) => handbookSentenceKey(handbookSlug, 'bridgePhrases', id)),
      handbookScriptKey(handbookSlug, 'narration', 'outro'),
    ];
  }

  return [
    ...['p01', 'p02', 'p03', 'p04', 'p05'].map((id) => handbookSentenceKey(handbookSlug, 'pointedPhrases', id)),
    ...['b01', 'b02', 'b03', 'b04', 'b05'].map((id) => handbookSentenceKey(handbookSlug, 'bridgePhrases', id)),
  ];
}

function buildInteractionDefinition(
  handbookSlug: HandbookSlug,
  interactionId: string,
  presetId: InteractionChoicePresetId,
  required = true,
): InteractionDefinition {
  return {
    id: interactionId,
    required,
    promptKey: handbookInteractionKey(handbookSlug, interactionId, 'prompt'),
    hintKey: handbookInteractionKey(handbookSlug, interactionId, 'hint'),
    successKey: handbookInteractionKey(handbookSlug, interactionId, 'success'),
    retryKey: handbookInteractionKey(handbookSlug, interactionId, 'retry'),
    isScored: false,
    requiresTextActionBeforeChoice: false,
    allowImageBeforeAnswer: true,
    choiceLockUntilTextAction: false,
    hintTriggerByBand: {},
    maxChoicesByBand: {},
    choices: CHOICE_PRESETS[presetId],
  };
}

function buildPageDefinitions(activeBookId: LadderBookId, handbookSlug: HandbookSlug): HandbookPageDefinition[] {
  const pageIds = PAGE_IDS_BY_BOOK[activeBookId];
  const interactionFlow = INTERACTION_FLOW_BY_BOOK[activeBookId];
  const storyDepthSlug = resolveStoryDepthSlugForBook(activeBookId, handbookSlug);
  const interactionSlug: HandbookSlug = storyDepthSlug ?? handbookSlug;
  const interactionByPage = new Map(
    interactionFlow.map((item) => [
      item.pageId,
      buildInteractionDefinition(interactionSlug, item.interactionId, item.presetId, item.required ?? true),
    ]),
  );

  if (storyDepthSlug) {
    return pageIds.map((pageId) => ({
      id: pageId,
      narrationKey: handbookStoryPageKey(storyDepthSlug, pageId, 'narration'),
      promptKey: handbookStoryPageKey(storyDepthSlug, pageId, 'cta'),
      interaction: interactionByPage.get(pageId),
    }));
  }

  if (activeBookId === 'book4' && handbookSlug === 'magicLetterMap') {
    return pageIds.map((pageId) => ({
      id: pageId,
      narrationKey: `games.interactiveHandbook.handbooks.magicLetterMap.pages.${pageId}.narration`,
      promptKey: `games.interactiveHandbook.handbooks.magicLetterMap.pages.${pageId}.prompt`,
      interaction: interactionByPage.get(pageId),
    }));
  }

  const narrationKeys = buildNarrationSentenceKeys(activeBookId, handbookSlug, pageIds).slice(0, pageIds.length);
  const promptTokens = PROMPT_KEY_ORDER_BY_BOOK[activeBookId];
  return narrationKeys.map((narrationKey, index) => {
    const pageId = pageIds[index] as PageId;
    const interaction = interactionByPage.get(pageId);
    const promptToken = promptTokens[index % promptTokens.length] ?? promptTokens[0];

    return {
      id: pageId,
      narrationKey,
      promptKey: interaction?.promptKey ?? handbookScriptKey(handbookSlug, 'prompts', promptToken),
      interaction,
    };
  });
}

export function mergeRuntimePageDefinitions(
  basePages: HandbookPageDefinition[],
  runtimeContent: HandbookRuntimeContent | null | undefined,
  handbookSlug: HandbookSlug,
): HandbookPageDefinition[] {
  if (!runtimeContent || runtimeContent.pages.length === 0) {
    return basePages;
  }

  const basePageById = new Map(basePages.map((page) => [page.id, page]));
  const sharedMediaAssets = runtimeContent.mediaAssets.length > 0 ? runtimeContent.mediaAssets : undefined;
  const storyDepthSlug = resolveStoryDepthSlugForRuntime(handbookSlug);
  const interactionSlug = storyDepthSlug ?? handbookSlug;
  const runtimeDrivenPages = runtimeContent.pages.reduce<HandbookPageDefinition[]>((acc, runtimePage) => {
      const runtimePageId = PAGE_ID_SET.has(runtimePage.pageId as PageId)
        ? (runtimePage.pageId as PageId)
        : null;
      if (!runtimePageId) {
        return acc;
      }

      const basePage = basePageById.get(runtimePageId);
      const runtimeInteraction = mergeRuntimeInteractionDefinition(
        basePage?.interaction,
        runtimePage.interactions,
        interactionSlug,
      );
      const normalizedRuntimeInteraction =
        handbookSlug === 'magicLetterMap' &&
        runtimeInteraction &&
        runtimeInteraction.required &&
        !basePage?.interaction &&
        isFinalPageForHandbook(handbookSlug, runtimePageId)
          ? {
              ...runtimeInteraction,
              required: false,
            }
          : runtimeInteraction;
      const runtimePromptKey = normalizeRuntimePromptBlockKey(
        interactionSlug,
        extractPromptKeyFromRuntimeBlocks(runtimePage.blocks),
      );
      const hasRuntimeContractData =
        Boolean(runtimePage.narrationKey) ||
        Boolean(runtimePromptKey) ||
        runtimePage.blocks.length > 0 ||
        runtimePage.interactions.length > 0;

      if (!hasRuntimeContractData && basePage) {
        acc.push(
          sharedMediaAssets
            ? {
                ...basePage,
                interaction: normalizedRuntimeInteraction,
                mediaAssets: sharedMediaAssets,
              }
            : {
                ...basePage,
                interaction: normalizedRuntimeInteraction,
              },
        );
        return acc;
      }

      const narrationKey = storyDepthSlug
        ? runtimePage.narrationKey && isStoryDepthPageKey(runtimePage.narrationKey, storyDepthSlug, 'narration')
          ? runtimePage.narrationKey
          : basePage?.narrationKey ?? null
        : runtimePage.narrationKey ?? basePage?.narrationKey ?? null;
      const promptKey = storyDepthSlug
        ? runtimePromptKey && isStoryDepthPageKey(runtimePromptKey, storyDepthSlug, 'cta')
          ? runtimePromptKey
          : basePage?.promptKey ?? normalizedRuntimeInteraction?.promptKey ?? null
        : runtimePromptKey ?? normalizedRuntimeInteraction?.promptKey ?? basePage?.promptKey ?? null;

      if (!narrationKey || !promptKey) {
        if (!basePage) {
          return acc;
        }

        acc.push({
          ...basePage,
          interaction: normalizedRuntimeInteraction,
          mediaAssets: sharedMediaAssets ?? basePage.mediaAssets,
        });
        return acc;
      }

      acc.push({
        id: runtimePageId,
        narrationKey,
        promptKey,
        blocks: runtimePage.blocks,
        interaction: normalizedRuntimeInteraction,
        mediaAssets: sharedMediaAssets,
      } satisfies HandbookPageDefinition);
      return acc;
    }, []);

  if (runtimeDrivenPages.length === 0) {
    return basePages;
  }

  const runtimePageIdSet = new Set(runtimeDrivenPages.map((page) => page.id));
  const missingBasePages = basePages
    .filter((basePage) => !runtimePageIdSet.has(basePage.id))
    .map((basePage) => (sharedMediaAssets ? { ...basePage, mediaAssets: sharedMediaAssets } : basePage));

  return [...runtimeDrivenPages, ...missingBasePages].sort(
    (left, right) => pageIdToPageNumber(left.id) - pageIdToPageNumber(right.id),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toChoiceDefinition(runtimeChoice: HandbookRuntimeChoice): ChoiceDefinition {
  return {
    id: runtimeChoice.id,
    labelKey: runtimeChoice.labelKey,
    isCorrect: runtimeChoice.isCorrect,
    audioKey: runtimeChoice.audioKey,
  };
}

function hasPolicyEntries(policy: AgeBandNumericPolicy | undefined): boolean {
  return Boolean(policy && Object.keys(policy).length > 0);
}

function resolveRuntimeFallbackChoices(handbookSlug: HandbookSlug, interactionId: string): ChoiceDefinition[] {
  const presetId = RUNTIME_INTERACTION_PRESET_FALLBACKS[handbookSlug]?.[interactionId];
  if (!presetId) {
    return [];
  }

  return (CHOICE_PRESETS[presetId] ?? []).map((choice) => ({ ...choice }));
}

function buildRuntimeInteractionDefinition(
  runtimeInteraction: HandbookRuntimeInteraction,
  handbookSlug: HandbookSlug,
  baseInteraction: InteractionDefinition | undefined,
): InteractionDefinition {
  const fallbackInteractionId = baseInteraction?.id ?? runtimeInteraction.id;
  const runtimePromptKey = normalizeRuntimeInteractionTextKey(
    handbookSlug,
    runtimeInteraction.id,
    'prompt',
    runtimeInteraction.promptKey,
  );
  const runtimeHintKey = normalizeRuntimeInteractionTextKey(
    handbookSlug,
    runtimeInteraction.id,
    'hint',
    runtimeInteraction.hintKey,
  );
  const runtimeSuccessKey = normalizeRuntimeInteractionTextKey(
    handbookSlug,
    runtimeInteraction.id,
    'success',
    runtimeInteraction.successKey,
  );
  const runtimeRetryKey = normalizeRuntimeInteractionTextKey(
    handbookSlug,
    runtimeInteraction.id,
    'retry',
    runtimeInteraction.retryKey,
  );
  const choiceDefinitions = runtimeInteraction.choices.length > 0
    ? runtimeInteraction.choices.map(toChoiceDefinition)
    : (
      baseInteraction?.choices ??
      resolveRuntimeFallbackChoices(handbookSlug, runtimeInteraction.id)
    );
  const hasActionableChoices = choiceDefinitions.length > 0;

  return {
    id: runtimeInteraction.id,
    required: runtimeInteraction.required && hasActionableChoices,
    promptKey:
      runtimePromptKey ?? baseInteraction?.promptKey ?? handbookInteractionKey(handbookSlug, fallbackInteractionId, 'prompt'),
    hintKey:
      runtimeHintKey ?? baseInteraction?.hintKey ?? handbookInteractionKey(handbookSlug, fallbackInteractionId, 'hint'),
    successKey:
      runtimeSuccessKey ?? baseInteraction?.successKey ?? handbookInteractionKey(handbookSlug, fallbackInteractionId, 'success'),
    retryKey:
      runtimeRetryKey ?? baseInteraction?.retryKey ?? handbookInteractionKey(handbookSlug, fallbackInteractionId, 'retry'),
    isScored: runtimeInteraction.isScored ?? baseInteraction?.isScored ?? false,
    requiresTextActionBeforeChoice:
      runtimeInteraction.requiresTextActionBeforeChoice ?? baseInteraction?.requiresTextActionBeforeChoice ?? false,
    allowImageBeforeAnswer: runtimeInteraction.allowImageBeforeAnswer ?? baseInteraction?.allowImageBeforeAnswer ?? true,
    choiceLockUntilTextAction:
      runtimeInteraction.choiceLockUntilTextAction ?? baseInteraction?.choiceLockUntilTextAction ?? false,
    hintTriggerByBand: hasPolicyEntries(runtimeInteraction.hintTriggerByBand)
      ? runtimeInteraction.hintTriggerByBand
      : (baseInteraction?.hintTriggerByBand ?? {}),
    maxChoicesByBand: hasPolicyEntries(runtimeInteraction.maxChoicesByBand)
      ? runtimeInteraction.maxChoicesByBand
      : (baseInteraction?.maxChoicesByBand ?? {}),
    choices: choiceDefinitions,
  };
}

function mergeRuntimeInteractionDefinition(
  baseInteraction: InteractionDefinition | undefined,
  runtimeInteractions: HandbookRuntimeInteraction[] | undefined,
  handbookSlug: HandbookSlug,
): InteractionDefinition | undefined {
  if (!runtimeInteractions || runtimeInteractions.length === 0) {
    return baseInteraction;
  }

  const runtimeMatch = baseInteraction
    ? runtimeInteractions.find((candidate) => {
      if (candidate.id === baseInteraction.id) {
        return true;
      }

      return (
        resolveInteractionKeyAlias(handbookSlug, candidate.id) ===
        resolveInteractionKeyAlias(handbookSlug, baseInteraction.id)
      );
    }) ?? runtimeInteractions[0]
    : runtimeInteractions[0];

  if (!runtimeMatch) {
    return baseInteraction;
  }

  return buildRuntimeInteractionDefinition(runtimeMatch, handbookSlug, baseInteraction);
}

function isFinalPageForHandbook(slug: HandbookSlug, pageId: PageId): boolean {
  const bookId = HANDBOOK_SLUG_TO_BOOK[slug];
  const pageIds = PAGE_IDS_BY_BOOK[bookId];
  return pageIds[pageIds.length - 1] === pageId;
}

export function extractPromptKeyFromRuntimeBlocks(blocks: unknown[] | undefined): string | null {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  let firstTextKey: string | null = null;

  for (const rawBlock of blocks) {
    if (!isRecord(rawBlock)) {
      continue;
    }

    const textKey =
      asTrimmedString(rawBlock.questionKey) ??
      asTrimmedString(rawBlock.promptKey) ??
      asTrimmedString(rawBlock.textKey) ??
      asTrimmedString(rawBlock.key) ??
      asTrimmedString(rawBlock.i18nKey);
    if (!textKey) {
      continue;
    }

    const rawType = asTrimmedString(rawBlock.type)?.toLowerCase().replace(/-/g, '_');
    const rawRole = asTrimmedString(rawBlock.role)?.toLowerCase().replace(/-/g, '_');
    const isPromptBlock =
      rawRole === 'prompt' ||
      rawRole === 'question' ||
      rawType === 'prompt' ||
      rawType === 'question' ||
      rawType === 'question_text';
    if (isPromptBlock) {
      return textKey;
    }

    if (!firstTextKey) {
      firstTextKey = textKey;
    }
  }

  return firstTextKey;
}

function isLadderBookId(value: unknown): value is LadderBookId {
  return typeof value === 'string' && LADDER_BOOK_SEQUENCE.includes(value as LadderBookId);
}

function isAgeBand(value: unknown): value is AgeBand {
  return isReadingAgeBand(value);
}

function clampPercent(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveActiveLadderBookId(levelConfig: Record<string, unknown>): LadderBookId {
  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  if (readingLadderConfig && isLadderBookId(readingLadderConfig.activeBook)) {
    return readingLadderConfig.activeBook;
  }

  if (isHandbookSlug(levelConfig.handbookSlug)) {
    return HANDBOOK_SLUG_TO_BOOK[levelConfig.handbookSlug];
  }

  if (isAgeBand(levelConfig.defaultBand)) {
    return AGE_BAND_TO_BOOK[levelConfig.defaultBand];
  }

  return 'book4';
}

function resolveHandbookSlug(levelConfig: Record<string, unknown>, activeBookId: LadderBookId): HandbookSlug {
  const storyDepthSlug = STORY_DEPTH_SLUG_BY_BOOK[activeBookId];
  if (storyDepthSlug) {
    return storyDepthSlug;
  }

  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const booksConfig = readingLadderConfig && isRecord(readingLadderConfig.books) ? readingLadderConfig.books : null;
  const activeBookConfig = booksConfig && isRecord(booksConfig[activeBookId]) ? booksConfig[activeBookId] : null;

  if (activeBookConfig && isHandbookSlug(activeBookConfig.handbookSlug)) {
    return activeBookConfig.handbookSlug;
  }

  if (isHandbookSlug(levelConfig.handbookSlug)) {
    return levelConfig.handbookSlug;
  }

  return BOOK_TO_HANDBOOK_SLUG[activeBookId];
}

function resolveActiveAgeBand(levelConfig: Record<string, unknown>, activeBookId: LadderBookId): AgeBand {
  if (isAgeBand(levelConfig.defaultBand)) {
    return levelConfig.defaultBand;
  }

  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const booksConfig = readingLadderConfig && isRecord(readingLadderConfig.books) ? readingLadderConfig.books : null;
  const activeBookConfig = booksConfig && isRecord(booksConfig[activeBookId]) ? booksConfig[activeBookId] : null;

  if (activeBookConfig && isAgeBand(activeBookConfig.ageBand)) {
    return activeBookConfig.ageBand;
  }

  return BOOK_TO_DEFAULT_AGE_BAND[activeBookId];
}

function applyAgeBandInteractionOverrides(
  pages: HandbookPageDefinition[],
  handbookSlug: HandbookSlug,
  activeAgeBand: AgeBand,
  activeBookId: LadderBookId,
): HandbookPageDefinition[] {
  const handbookRules = READING_RUNTIME_MATRIX[activeAgeBand].handbook;
  const defaultHintPolicy: AgeBandNumericPolicy = {
    '3-4': READING_RUNTIME_MATRIX['3-4'].handbook.hintTriggerMs,
    '5-6': READING_RUNTIME_MATRIX['5-6'].handbook.hintTriggerMs,
    '6-7': READING_RUNTIME_MATRIX['6-7'].handbook.hintTriggerMs,
  };
  const defaultChoicePolicy: AgeBandNumericPolicy = {
    '3-4': READING_RUNTIME_MATRIX['3-4'].handbook.maxChoiceCount,
    '5-6': READING_RUNTIME_MATRIX['5-6'].handbook.maxChoiceCount,
    '6-7': READING_RUNTIME_MATRIX['6-7'].handbook.maxChoiceCount,
  };
  const shouldUseBook4SupportVisibilityMode =
    activeAgeBand === '3-4' &&
    activeBookId === 'book4' &&
    (handbookSlug === 'magicLetterMap' || handbookSlug === 'yoavLetterMap');

  return pages.map((page) => {
    if (!page.interaction) {
      return page;
    }

    const shouldDisableMasteryRequirement = shouldUseBook4SupportVisibilityMode
      ? MAGIC_LETTER_MAP_EXPOSURE_INTERACTION_IDS.has(page.interaction.id) || page.interaction.required
      : false;
    const required = shouldDisableMasteryRequirement ? false : page.interaction.required;
    const isScored = required ? handbookRules.allowsIndependentDecodeScoring : page.interaction.isScored;
    const shouldApplyDecodeFirstLock = isScored && handbookRules.enforceDecodeFirstScoredLock;
    const hintTriggerByBand = hasPolicyEntries(page.interaction.hintTriggerByBand)
      ? page.interaction.hintTriggerByBand
      : defaultHintPolicy;
    const maxChoicesByBand = hasPolicyEntries(page.interaction.maxChoicesByBand)
      ? page.interaction.maxChoicesByBand
      : defaultChoicePolicy;

    return {
      ...page,
      interaction: {
        ...page.interaction,
        required,
        isScored,
        requiresTextActionBeforeChoice: shouldApplyDecodeFirstLock
          ? true
          : page.interaction.requiresTextActionBeforeChoice,
        allowImageBeforeAnswer: shouldApplyDecodeFirstLock
          ? false
          : page.interaction.allowImageBeforeAnswer,
        choiceLockUntilTextAction: shouldApplyDecodeFirstLock
          ? true
          : page.interaction.choiceLockUntilTextAction,
        hintTriggerByBand,
        maxChoicesByBand,
      },
    };
  });
}

function resolveQualityGate(
  levelConfig: Record<string, unknown>,
  activeBookId: LadderBookId,
): { firstTryAccuracyMin: number; hintRateMax: number } {
  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const qualityGateConfig = readingLadderConfig && isRecord(readingLadderConfig.qualityGate)
    ? readingLadderConfig.qualityGate
    : null;
  const defaultQualityGate = DEFAULT_QUALITY_GATE_BY_BOOK[activeBookId];

  return {
    firstTryAccuracyMin: clampPercent(
      qualityGateConfig?.firstTryAccuracyMin,
      defaultQualityGate.firstTryAccuracyMin,
    ),
    hintRateMax: clampPercent(qualityGateConfig?.hintRateMax, defaultQualityGate.hintRateMax),
  };
}

function getNextBookId(activeBookId: LadderBookId): LadderBookId | null {
  const activeIndex = LADDER_BOOK_SEQUENCE.indexOf(activeBookId);
  if (activeIndex < 0 || activeIndex >= LADDER_BOOK_SEQUENCE.length - 1) {
    return null;
  }

  return LADDER_BOOK_SEQUENCE[activeIndex + 1] ?? null;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function keyToAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function normalizeAssetPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function inferAssetType(path: string): 'audio' | 'image' | null {
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(path)) {
    return 'audio';
  }
  if (/\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(path)) {
    return 'image';
  }
  return null;
}

function handbookSlugToImageDirectory(slug: HandbookSlug): string {
  return toKebabCase(slug);
}

function buildIllustrationAsset(slug: HandbookSlug, pageId: PageId): HandbookIllustrationAsset | null {
  if (!HANDBOOKS_WITH_ILLUSTRATIONS.has(slug)) {
    return null;
  }

  const pageNumber = pageId.slice(1);
  const directory = handbookSlugToImageDirectory(slug);
  const basePath = `/images/handbooks/${directory}/page-${pageNumber}`;

  return {
    png: `${basePath}.png`,
    webp: `${basePath}.webp`,
    webpCompact: `${basePath}-960.webp`,
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
  };
}

function pickPromptAssetForPage(pageId: string, preloadManifest: HandbookPreloadManifest | null): string | null {
  if (!preloadManifest) {
    return null;
  }

  const pageAssets = preloadManifest.pages[pageId];
  if (!Array.isArray(pageAssets) || pageAssets.length === 0) {
    return null;
  }

  const audioAssets = pageAssets.filter((assetPath) => /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(assetPath));
  if (audioAssets.length === 0) {
    return null;
  }

  return audioAssets.find((assetPath) => /\/prompt\.mp3(\?|$)/i.test(assetPath)) ?? null;
}

function getHintTrend(pageHintUsage: Record<string, number>, orderedPageIds: PageId[]): HintTrend {
  const values = orderedPageIds.map((pageId) => pageHintUsage[pageId] ?? 0);
  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = values.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }

  if (secondHalf === firstHalf) {
    return 'steady';
  }

  return 'needs_support';
}

function buildStableRange(mandatorySolvedCount: number, mandatoryTotal: number): StableRange {
  if (mandatoryTotal <= 0) {
    return '1-3';
  }

  const completionRatio = mandatorySolvedCount / mandatoryTotal;
  if (completionRatio >= 0.8) {
    return '1-10';
  }

  if (completionRatio >= 0.5) {
    return '1-5';
  }

  return '1-3';
}

function toneClassName(tone: StatusTone): string {
  if (tone === 'hint') return 'interactive-handbook__message interactive-handbook__message--hint';
  if (tone === 'success') return 'interactive-handbook__message interactive-handbook__message--success';
  if (tone === 'error') return 'interactive-handbook__message interactive-handbook__message--error';
  return 'interactive-handbook__message';
}

function shouldHideOptionalInteraction(mode: HandbookMode, interaction: InteractionDefinition | undefined): boolean {
  return mode === 'calmReplay' && interaction?.required === false;
}

function shouldLockChoicesUntilTextAction(interaction: InteractionDefinition | undefined): boolean {
  if (!interaction) {
    return false;
  }

  return interaction.isScored && interaction.requiresTextActionBeforeChoice && interaction.choiceLockUntilTextAction;
}

function resolvePolicyValueByAgeBand(policy: AgeBandNumericPolicy | undefined, activeAgeBand: AgeBand): number | null {
  if (!policy) {
    return null;
  }

  const value = policy[activeAgeBand];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function resolveHintTriggerTimeoutMs(interaction: InteractionDefinition | undefined, activeAgeBand: AgeBand): number | null {
  if (!interaction) {
    return null;
  }

  const threshold = resolvePolicyValueByAgeBand(interaction.hintTriggerByBand, activeAgeBand);
  if (threshold === null || threshold <= 0) {
    return null;
  }

  const interpretedMs = threshold <= 60 ? threshold * 1000 : threshold;
  return Math.round(interpretedMs);
}

interface HandbookAntiGuessTrackerState {
  nonTargetTapTimes: number[];
  quickResponseStreak: number;
  lastResponseAt: number | null;
}

interface HandbookAntiGuessGuardEvaluation {
  nextState: HandbookAntiGuessTrackerState;
  rapidTapGuardTriggered: boolean;
  quickResponseGuardTriggered: boolean;
  shouldPauseAndReplay: boolean;
  shouldForceScaffoldTrial: boolean;
}

function createInitialHandbookAntiGuessTrackerState(): HandbookAntiGuessTrackerState {
  return {
    nonTargetTapTimes: [],
    quickResponseStreak: 0,
    lastResponseAt: null,
  };
}

export function evaluateHandbookAntiGuessGuard(
  guardConfig: ReadingAntiGuessGuard,
  previousState: HandbookAntiGuessTrackerState,
  nowMs: number,
): HandbookAntiGuessGuardEvaluation {
  const rapidTapTimes = previousState.nonTargetTapTimes
    .filter((timestamp) => nowMs - timestamp <= guardConfig.rapidTapWindowMs)
    .concat(nowMs);

  const hasShortResponseGuard = Boolean(
    typeof guardConfig.shortResponseWindowMs === 'number' &&
    guardConfig.shortResponseWindowMs > 0 &&
    typeof guardConfig.shortResponseStreakThreshold === 'number' &&
    guardConfig.shortResponseStreakThreshold > 0,
  );

  let quickResponseStreak = 0;
  if (hasShortResponseGuard) {
    const responseGapMs = previousState.lastResponseAt === null ? Number.POSITIVE_INFINITY : nowMs - previousState.lastResponseAt;
    quickResponseStreak = responseGapMs < (guardConfig.shortResponseWindowMs as number)
      ? previousState.quickResponseStreak + 1
      : 1;
  }

  const rapidTapGuardTriggered = rapidTapTimes.length >= guardConfig.rapidTapCount;
  const quickResponseGuardTriggered = Boolean(
    hasShortResponseGuard &&
    quickResponseStreak >= (guardConfig.shortResponseStreakThreshold as number),
  );
  const shouldPauseAndReplay = rapidTapGuardTriggered || quickResponseGuardTriggered;
  const shouldForceScaffoldTrial = hasShortResponseGuard && shouldPauseAndReplay;

  if (shouldPauseAndReplay) {
    return {
      nextState: createInitialHandbookAntiGuessTrackerState(),
      rapidTapGuardTriggered,
      quickResponseGuardTriggered,
      shouldPauseAndReplay,
      shouldForceScaffoldTrial,
    };
  }

  return {
    nextState: {
      nonTargetTapTimes: rapidTapTimes,
      quickResponseStreak,
      lastResponseAt: nowMs,
    },
    rapidTapGuardTriggered,
    quickResponseGuardTriggered,
    shouldPauseAndReplay,
    shouldForceScaffoldTrial,
  };
}

export function reduceChoicesForRetryScaffold(choices: ChoiceDefinition[], reductionCount: number): ChoiceDefinition[] {
  if (!Number.isFinite(reductionCount) || reductionCount <= 0 || choices.length <= 1) {
    return choices;
  }

  const boundedReductionCount = Math.max(1, Math.floor(reductionCount));
  const targetCount = Math.max(1, choices.length - boundedReductionCount);
  const correctChoice = choices.find((choice) => choice.isCorrect);

  if (!correctChoice) {
    return choices.slice(0, targetCount);
  }

  const distractors = choices.filter((choice) => !choice.isCorrect);
  return [correctChoice, ...distractors].slice(0, targetCount);
}

function applyChoiceCap(choices: ChoiceDefinition[], maxChoices: number): ChoiceDefinition[] {
  if (!Number.isFinite(maxChoices)) {
    return choices;
  }

  const boundedCap = Math.max(1, Math.floor(maxChoices));
  if (choices.length <= boundedCap) {
    return choices;
  }

  const correctChoice = choices.find((choice) => choice.isCorrect);
  const distractors = choices.filter((choice) => !choice.isCorrect);

  if (!correctChoice) {
    return choices.slice(0, boundedCap);
  }

  const capped = [correctChoice, ...distractors.slice(0, Math.max(0, boundedCap - 1))];
  return capped.slice(0, boundedCap);
}

function isPageId(value: string): value is PageId {
  return PAGE_ID_SET.has(value as PageId);
}

function pageIdToPageNumber(pageId: PageId): number {
  return Number.parseInt(pageId.slice(1), 10);
}

function getInitialPageIndex(progress: InteractiveHandbookProgressSnapshot | null | undefined, totalPages: number): number {
  const rawPage = progress?.furthestPageNumber ?? 1;
  const clampedPage = Math.min(Math.max(1, totalPages), Math.max(1, Math.floor(rawPage)));
  return clampedPage - 1;
}

function getInitialVisitedPages(
  progress: InteractiveHandbookProgressSnapshot | null | undefined,
  initialPageId: PageId,
  validPageIds: Set<PageId>,
): Set<PageId> {
  const visited = new Set<PageId>([initialPageId]);
  if (!progress?.pageCompletion) {
    return visited;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.visited || !isPageId(pageId) || !validPageIds.has(pageId)) {
      return;
    }
    visited.add(pageId);
  });

  return visited;
}

function getInitialSolvedPages(
  progress: InteractiveHandbookProgressSnapshot | null | undefined,
  validPageIds: Set<PageId>,
): Set<PageId> {
  const solved = new Set<PageId>();
  if (!progress?.pageCompletion) {
    return solved;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.solved || !isPageId(pageId) || !validPageIds.has(pageId)) {
      return;
    }
    solved.add(pageId);
  });

  return solved;
}

function resolveTargetWordChoice(interaction: InteractionDefinition | undefined): ChoiceDefinition | null {
  if (!interaction || interaction.choices.length === 0) {
    return null;
  }

  return interaction.choices.find((choice) => choice.isCorrect) ?? interaction.choices[0] ?? null;
}

function resolveInteractionReplayTextKey(interaction: InteractionDefinition | undefined): string | null {
  const targetChoice = resolveTargetWordChoice(interaction);
  if (targetChoice) {
    return targetChoice.labelKey;
  }

  return interaction?.promptKey ?? null;
}

function resolveInteractionReplayAudioKey(interaction: InteractionDefinition | undefined): string | null {
  const targetChoice = resolveTargetWordChoice(interaction);
  if (targetChoice) {
    return targetChoice.audioKey ?? targetChoice.labelKey;
  }

  return interaction?.promptKey ?? null;
}

export function buildFallbackRendererBlocks(
  page: HandbookPageDefinition,
  interaction: InteractionDefinition | undefined,
  activeAgeBand: AgeBand,
  showSuccessBadge: boolean,
  illustration: HandbookIllustrationAsset | null,
): Array<Record<string, unknown>> {
  const targetWordChoice = resolveTargetWordChoice(interaction);
  const targetWordTextKey = targetWordChoice?.labelKey ?? null;
  const targetWordAudioKey = targetWordChoice ? targetWordChoice.audioKey ?? targetWordChoice.labelKey : null;
  const shouldUseWordFirstLayout = Boolean(interaction && targetWordTextKey);
  const shouldHideSupportSentence = shouldUseWordFirstLayout && activeAgeBand === '3-4';

  const blocks: Array<Record<string, unknown>> = [
    {
      id: `${page.id}-illustration`,
      type: 'illustration',
      order: 10,
      src: illustration?.webpCompact ?? null,
      fallbackSrc: illustration?.png ?? null,
      altKey: page.narrationKey,
    },
  ];

  if (shouldUseWordFirstLayout) {
    blocks.push({
      id: `${page.id}-target-word`,
      type: 'text',
      order: 20,
      role: 'target',
      key: targetWordTextKey,
      audioKey: targetWordAudioKey ?? targetWordTextKey,
      align: 'start',
    });

    if (!shouldHideSupportSentence) {
      blocks.push({
        id: `${page.id}-support-sentence`,
        type: 'text',
        order: 30,
        role: 'narration',
        key: page.narrationKey,
        audioKey: page.narrationKey,
        align: 'start',
      });
    }

    blocks.push({
      id: `${page.id}-interaction-prompt`,
      type: 'text',
      order: 40,
      role: 'prompt',
      key: interaction?.promptKey ?? page.promptKey,
      audioKey: interaction?.promptKey ?? page.promptKey,
      align: 'start',
    });
  } else {
    blocks.push(
      {
        id: `${page.id}-narration`,
        type: 'text',
        order: 20,
        role: 'narration',
        key: page.narrationKey,
        audioKey: page.narrationKey,
      },
      {
        id: `${page.id}-prompt`,
        type: 'text',
        order: 30,
        role: 'prompt',
        key: page.promptKey,
        audioKey: interaction?.promptKey ?? page.promptKey,
        align: 'center',
      },
    );
  }

  if (interaction) {
    blocks.push({
      id: `${page.id}-${interaction.id}-hotspot`,
      type: 'hotspot',
      order: 40,
      interactionId: interaction.id,
      ariaLabelKey: interaction.promptKey,
      audioKey: targetWordAudioKey ?? interaction.promptKey,
      required: interaction.required,
      xPct: 36,
      yPct: 24,
      widthPct: 28,
      heightPct: 30,
    });
  }

  if (interaction && showSuccessBadge) {
    blocks.push({
      id: `${page.id}-${interaction.id}-badge`,
      type: 'badge',
      order: 50,
      key: interaction.successKey,
      tone: 'success',
    });
  }

  return blocks;
}

export function shouldRepositionControlRowInViewport(input: {
  top: number;
  left: number;
  right: number;
  viewportWidth: number;
  insetPx?: number;
}): boolean {
  const insetPx = input.insetPx ?? CONTROL_ROW_VIEWPORT_INSET_PX;

  if (
    !Number.isFinite(input.top) ||
    !Number.isFinite(input.left) ||
    !Number.isFinite(input.right) ||
    !Number.isFinite(input.viewportWidth)
  ) {
    return false;
  }

  return input.top < insetPx || input.left < insetPx || input.right > input.viewportWidth - insetPx;
}

export function InteractiveHandbookGame({
  level,
  onComplete,
  audio,
  initialProgress = null,
  onProgressChange,
  preloadManifest = null,
  runtimeContent = null,
  onRequestBack,
}: InteractiveHandbookGameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';
  const activeLadderBookId = useMemo(() => resolveActiveLadderBookId(level.configJson), [level.configJson]);
  const activeHandbookSlug = useMemo(
    () => resolveHandbookSlug(level.configJson, activeLadderBookId),
    [activeLadderBookId, level.configJson],
  );
  const activeAgeBand = useMemo(
    () => resolveActiveAgeBand(level.configJson, activeLadderBookId),
    [activeLadderBookId, level.configJson],
  );
  const basePageDefinitions = useMemo(
    () => buildPageDefinitions(activeLadderBookId, activeHandbookSlug),
    [activeHandbookSlug, activeLadderBookId],
  );
  const runtimeMergedPages = useMemo(
    () => mergeRuntimePageDefinitions(basePageDefinitions, runtimeContent, activeHandbookSlug),
    [activeHandbookSlug, basePageDefinitions, runtimeContent],
  );
  const pageDefinitions = useMemo(
    () => applyAgeBandInteractionOverrides(runtimeMergedPages, activeHandbookSlug, activeAgeBand, activeLadderBookId),
    [activeAgeBand, activeHandbookSlug, activeLadderBookId, runtimeMergedPages],
  );
  const pageDefinitionIdSet = useMemo(() => new Set(pageDefinitions.map((page) => page.id)), [pageDefinitions]);
  const totalPages = pageDefinitions.length;
  const initialPageIndex = getInitialPageIndex(initialProgress, totalPages);
  const initialPageId = (pageDefinitions[initialPageIndex]?.id ?? pageDefinitions[0]?.id ?? 'p01') as PageId;

  const [mode, setMode] = useState<HandbookMode>('readToMe');
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [visitedPages, setVisitedPages] = useState<Set<PageId>>(() =>
    getInitialVisitedPages(initialProgress, initialPageId, pageDefinitionIdSet),
  );
  const [solvedPages, setSolvedPages] = useState<Set<PageId>>(() => getInitialSolvedPages(initialProgress, pageDefinitionIdSet));
  const [firstAttemptSuccessPages, setFirstAttemptSuccessPages] = useState<Set<PageId>>(new Set());
  const [pageAttempts, setPageAttempts] = useState<Record<string, number>>({});
  const [pageHintUsage, setPageHintUsage] = useState<Record<string, number>>({});
  const [selectedChoiceByPage, setSelectedChoiceByPage] = useState<Record<string, string>>({});
  const [highlightChoiceByPage, setHighlightChoiceByPage] = useState<Record<string, string>>({});
  const [retryScaffoldByPage, setRetryScaffoldByPage] = useState<Record<string, number>>({});
  const [textActionReadyByPage, setTextActionReadyByPage] = useState<Record<string, boolean>>({});
  const [statusKey, setStatusKey] = useState('games.interactiveHandbook.instructions.intro');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const [isNarrationPaused, setIsNarrationPaused] = useState(false);
  const [isAntiGuessPaused, setIsAntiGuessPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(initialProgress?.completed));
  const [pageTurnDirection, setPageTurnDirection] = useState<PageTurnDirection | null>(null);
  const [readingHighlightState, setReadingHighlightState] = useState<ReadingHighlightState | null>(null);
  const [audioDegraded, setAudioDegraded] = useState(false);

  const completionSentRef = useRef(false);
  const preloadedAssetsRef = useRef<Set<string>>(new Set());
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasPassedStartupNarrationGateRef = useRef(false);
  const chapterTransitionCueRef = useRef<string | null>(null);
  const antiGuessTrackerRef = useRef<HandbookAntiGuessTrackerState>(createInitialHandbookAntiGuessTrackerState());
  const antiGuessPauseTimerRef = useRef<number | null>(null);
  const controlsRowRef = useRef<HTMLDivElement | null>(null);

  const qualityGate = useMemo(
    () => resolveQualityGate(level.configJson, activeLadderBookId),
    [activeLadderBookId, level.configJson],
  );
  const activeStoryDepthSlug = useMemo(
    () => resolveStoryDepthSlugForBook(activeLadderBookId, activeHandbookSlug),
    [activeHandbookSlug, activeLadderBookId],
  );
  const handbookCompletionTitleKey = useMemo(
    () => completionPraiseKey(activeHandbookSlug, activeLadderBookId),
    [activeHandbookSlug, activeLadderBookId],
  );
  const handbookCompletionSummaryKey = useMemo(
    () => completionSummaryKey(activeHandbookSlug, activeLadderBookId),
    [activeHandbookSlug, activeLadderBookId],
  );
  const handbookCompletionNextStepKey = useMemo(
    () => completionNextStepKey(activeHandbookSlug, activeLadderBookId),
    [activeHandbookSlug, activeLadderBookId],
  );
  const isMagicLetterMapListenExploreMode = activeHandbookSlug === 'magicLetterMap' && activeAgeBand === '3-4';
  const isMagicLetterMapStretchMode = activeHandbookSlug === 'magicLetterMap' && activeAgeBand === '6-7';
  const handbookAntiGuessGuard = READING_RUNTIME_MATRIX[activeAgeBand].handbook.antiGuessGuard;

  const currentPage = (pageDefinitions[currentPageIndex] ?? pageDefinitions[0]) as HandbookPageDefinition;
  const nextPage = (pageDefinitions[currentPageIndex + 1] ?? null) as HandbookPageDefinition | null;
  const currentStoryArcChapterId = useMemo(
    () => resolveStoryArcChapterId(activeLadderBookId, currentPage.id),
    [activeLadderBookId, currentPage.id],
  );
  const chapterTransitionKey = useMemo(
    () =>
      activeStoryDepthSlug && currentStoryArcChapterId
        ? handbookStoryArcKey(activeStoryDepthSlug, currentStoryArcChapterId, 'transition')
        : null,
    [activeStoryDepthSlug, currentStoryArcChapterId],
  );
  const currentIllustration = useMemo(
    () => buildIllustrationAsset(activeHandbookSlug, currentPage.id),
    [activeHandbookSlug, currentPage.id],
  );
  const activeInteraction = useMemo(() => {
    if (shouldHideOptionalInteraction(mode, currentPage.interaction)) {
      return undefined;
    }

    return currentPage.interaction;
  }, [currentPage.interaction, mode]);
  const activeInteractionReplayTextKey = resolveInteractionReplayTextKey(activeInteraction);
  const activeInteractionReplayAudioKey = resolveInteractionReplayAudioKey(activeInteraction);
  const activeInteractionRequiresTextActionLock = shouldLockChoicesUntilTextAction(activeInteraction);
  const isDecodeFirstChoiceLocked =
    activeInteractionRequiresTextActionLock && !Boolean(textActionReadyByPage[currentPage.id]);
  const isChoiceLocked = isDecodeFirstChoiceLocked || isAntiGuessPaused;

  const currentPromptPreloadPath = useMemo(
    () => {
      if (activeInteraction && activeInteractionReplayAudioKey) {
        return keyToAudioPath(activeInteractionReplayAudioKey);
      }

      return pickPromptAssetForPage(currentPage.id, preloadManifest) ?? keyToAudioPath(currentPage.promptKey);
    },
    [activeInteraction, activeInteractionReplayAudioKey, currentPage.id, currentPage.promptKey, preloadManifest],
  );
  const nextPromptPrefetchPath = useMemo(
    () => {
      if (!nextPage) {
        return null;
      }

      const nextPageInteraction = shouldHideOptionalInteraction(mode, nextPage.interaction) ? undefined : nextPage.interaction;
      const nextReplayAudioKey = resolveInteractionReplayAudioKey(nextPageInteraction);
      if (nextPageInteraction && nextReplayAudioKey) {
        return keyToAudioPath(nextReplayAudioKey);
      }

      return pickPromptAssetForPage(nextPage.id, preloadManifest) ?? keyToAudioPath(nextPage.promptKey);
    },
    [mode, nextPage, preloadManifest],
  );
  const startupNarrationPreloadPath = useMemo(
    () => keyToAudioPath((pageDefinitions[initialPageIndex] ?? pageDefinitions[0] ?? currentPage).narrationKey),
    [currentPage, initialPageIndex, pageDefinitions],
  );

  const mandatoryPageIds = useMemo(
    () => pageDefinitions.filter((page) => page.interaction?.required).map((page) => page.id),
    [pageDefinitions],
  );

  const mandatorySolvedCount = useMemo(
    () => mandatoryPageIds.filter((pageId) => solvedPages.has(pageId)).length,
    [mandatoryPageIds, solvedPages],
  );
  const solvedInteractionIds = useMemo(() => {
    const solvedInteractionIdSet = new Set<string>();

    pageDefinitions.forEach((page) => {
      if (!page.interaction || !solvedPages.has(page.id)) {
        return;
      }

      solvedInteractionIdSet.add(page.interaction.id);
    });

    return solvedInteractionIdSet;
  }, [pageDefinitions, solvedPages]);

  const canAdvanceCurrentPage = !activeInteraction || solvedPages.has(currentPage.id) || !activeInteraction.required;
  const canReturnToPreviousPage = currentPageIndex > 0 && canAdvanceCurrentPage;
  const isLastPage = currentPageIndex === totalPages - 1;
  const isNarrationHighlightActive =
    readingHighlightState?.pageId === currentPage.id && readingHighlightState.mode === 'narration';
  const isPromptHighlightActive = readingHighlightState?.pageId === currentPage.id && readingHighlightState.mode === 'prompt';
  const storyFlipClassName = [
    'interactive-handbook__story-flip',
    pageTurnDirection ? `interactive-handbook__story-flip--${pageTurnDirection}` : '',
    isRtl ? 'is-rtl' : 'is-ltr',
  ]
    .filter(Boolean)
    .join(' ');

  const progressSnapshot = useMemo<InteractiveHandbookProgressSnapshot>(() => {
    const pageCompletion: Record<string, InteractiveHandbookPageProgress> = {};
    let furthestPageNumber = currentPageIndex + 1;

    pageDefinitions.forEach((page) => {
      const visited = visitedPages.has(page.id);
      const solved = solvedPages.has(page.id);
      if (!visited && !solved) {
        return;
      }

      furthestPageNumber = Math.max(furthestPageNumber, pageIdToPageNumber(page.id));
      pageCompletion[page.id] = { visited, solved };
    });

    return {
      furthestPageNumber,
      completed: isCompleted,
      pageCompletion,
    };
  }, [currentPageIndex, isCompleted, pageDefinitions, solvedPages, visitedPages]);

  const preloadAsset = useCallback(
    (
      path: string,
      options: {
        mode?: 'preload' | 'prefetch';
        priority?: 'high' | 'low';
      } = {},
    ) => {
      const mode = options.mode ?? 'preload';
      const priority = options.priority ?? 'low';
      const normalizedPath = normalizeAssetPath(path);
      const href = normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')
        ? normalizedPath
        : assetUrl(normalizedPath);
      const kind = inferAssetType(normalizedPath);
      const dedupeKey = href;

      if (!kind || preloadedAssetsRef.current.has(dedupeKey) || typeof document === 'undefined') {
        return;
      }

      preloadedAssetsRef.current.add(dedupeKey);

      const link = document.createElement('link');
      link.rel = mode;
      link.href = href;
      link.as = kind;
      link.setAttribute('data-interactive-handbook-preload', `${mode}:${kind}`);
      if (mode === 'preload' && kind === 'audio') {
        link.type = 'audio/mpeg';
      }
      if (mode === 'preload' && priority === 'high') {
        link.setAttribute('fetchpriority', 'high');
      }
      document.head.append(link);
    },
    [],
  );

  useEffect(() => {
    const shouldAvoidStartupPriority =
      !hasPassedStartupNarrationGateRef.current && currentPageIndex === initialPageIndex;

    preloadAsset(currentPromptPreloadPath, {
      mode: 'preload',
      priority: shouldAvoidStartupPriority ? 'low' : 'high',
    });
  }, [currentPageIndex, currentPromptPreloadPath, initialPageIndex, preloadAsset]);

  useEffect(() => {
    if (hasPassedStartupNarrationGateRef.current) {
      return;
    }

    preloadAsset(startupNarrationPreloadPath, { mode: 'prefetch', priority: 'low' });
  }, [preloadAsset, startupNarrationPreloadPath]);

  useEffect(() => {
    if (!nextPromptPrefetchPath) {
      return;
    }

    const timer = window.setTimeout(() => {
      preloadAsset(nextPromptPrefetchPath, { mode: 'prefetch' });
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [nextPromptPrefetchPath, preloadAsset]);

  const handleAudioPlaybackFailure = useCallback(() => {
    setAudioDegraded((current) => {
      if (current) {
        return current;
      }
      setStatusKey('feedback.keepGoing');
      setStatusTone('hint');
      setReadingHighlightState(null);
      return true;
    });
  }, []);

  const playAudioKey = useCallback(
    (key: string, interrupt = false) => {
      if (audioDegraded) {
        return;
      }
      const audioPath = keyToAudioPath(key);
      const playbackPromise = interrupt
        ? audio.playNow(audioPath)
        : audio.play(audioPath);
      if (interrupt) {
        void playbackPromise.catch(() => {
          handleAudioPlaybackFailure();
        });
      } else {
        void playbackPromise.catch(() => {
          handleAudioPlaybackFailure();
        });
      }
    },
    [audio, audioDegraded, handleAudioPlaybackFailure],
  );
  const clearAntiGuessPauseTimer = useCallback(() => {
    if (antiGuessPauseTimerRef.current !== null) {
      window.clearTimeout(antiGuessPauseTimerRef.current);
      antiGuessPauseTimerRef.current = null;
    }
  }, []);
  const resetAntiGuessTracker = useCallback(() => {
    antiGuessTrackerRef.current = createInitialHandbookAntiGuessTrackerState();
  }, []);
  useEffect(() => {
    return () => {
      clearAntiGuessPauseTimer();
    };
  }, [clearAntiGuessPauseTimer]);
  useEffect(() => {
    clearAntiGuessPauseTimer();
    setIsAntiGuessPaused(false);
    resetAntiGuessTracker();
  }, [clearAntiGuessPauseTimer, currentPage.id, resetAntiGuessTracker]);
  const markTextActionReady = useCallback((pageId: PageId) => {
    setTextActionReadyByPage((previous) => {
      if (previous[pageId]) {
        return previous;
      }

      return {
        ...previous,
        [pageId]: true,
      };
    });
  }, []);
  const playRendererAudioKey = useCallback(
    (audioKey: string) => {
      if (activeInteractionRequiresTextActionLock) {
        markTextActionReady(currentPage.id);
      }
      playAudioKey(audioKey, true);
    },
    [activeInteractionRequiresTextActionLock, currentPage.id, markTextActionReady, playAudioKey],
  );
  const handleRendererHotspotPress = useCallback(
    (interactionId: string) => {
      if (!activeInteraction || activeInteraction.id !== interactionId) {
        return;
      }

      const replayTextKey = activeInteractionReplayTextKey ?? activeInteraction.promptKey;
      const replayAudioKey = activeInteractionReplayAudioKey ?? activeInteraction.promptKey;

      const shouldBlockImageFirstTap =
        shouldLockChoicesUntilTextAction(activeInteraction) &&
        !activeInteraction.allowImageBeforeAnswer &&
        !textActionReadyByPage[currentPage.id];
      if (shouldBlockImageFirstTap) {
        setStatusKey(activeInteraction.hintKey);
        setStatusTone('hint');
        setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
        playAudioKey(activeInteraction.hintKey, true);

        window.setTimeout(() => {
          setStatusKey(replayTextKey);
          setStatusTone('neutral');
          setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
          playAudioKey(replayAudioKey);
        }, 180);
        return;
      }

      if (shouldLockChoicesUntilTextAction(activeInteraction)) {
        markTextActionReady(currentPage.id);
      }

      setStatusKey(replayTextKey);
      setStatusTone('neutral');
      setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
      playAudioKey(replayAudioKey, true);
    },
    [
      activeInteraction,
      activeInteractionReplayAudioKey,
      activeInteractionReplayTextKey,
      currentPage.id,
      markTextActionReady,
      playAudioKey,
      textActionReadyByPage,
    ],
  );
  const rendererBlocks = useMemo(() => {
    if (Array.isArray(currentPage.blocks) && currentPage.blocks.length > 0) {
      return currentPage.blocks;
    }

    return buildFallbackRendererBlocks(
      currentPage,
      activeInteraction,
      activeAgeBand,
      Boolean(activeInteraction && solvedPages.has(currentPage.id)),
      currentIllustration,
    );
  }, [activeAgeBand, activeInteraction, currentPage, currentIllustration, solvedPages]);

  const markPageVisited = useCallback((pageId: PageId) => {
    setVisitedPages((previous) => {
      if (previous.has(pageId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(pageId);
      return next;
    });
  }, []);

  const applyHint = useCallback(
    (autoTriggered: boolean) => {
      if (!activeInteraction) {
        return;
      }

      const pageId = currentPage.id;
      const correctChoiceId =
        activeInteraction.choices.find((choice) => choice.isCorrect)?.id ?? activeInteraction.choices[0]?.id ?? '';

      setPageHintUsage((previous) => ({
        ...previous,
        [pageId]: (previous[pageId] ?? 0) + 1,
      }));

      setHighlightChoiceByPage((previous) => ({
        ...previous,
        [pageId]: correctChoiceId,
      }));

      setStatusKey(activeInteraction.hintKey);
      setStatusTone('hint');
      setReadingHighlightState({ pageId, mode: 'prompt' });
      playAudioKey(activeInteraction.hintKey, autoTriggered);
    },
    [activeInteraction, currentPage.id, playAudioKey],
  );

  const replayCurrentPrompt = useCallback(() => {
    if (activeInteraction) {
      const replayTextKey = activeInteractionReplayTextKey ?? activeInteraction.promptKey;
      const replayAudioKey = activeInteractionReplayAudioKey ?? activeInteraction.promptKey;
      setStatusKey(replayTextKey);
      setStatusTone('neutral');
      setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
      playAudioKey(replayAudioKey, true);
      return;
    }

    setStatusKey(currentPage.promptKey);
    setStatusTone('neutral');
    setReadingHighlightState({ pageId: currentPage.id, mode: 'narration' });
    playAudioKey(currentPage.narrationKey, true);
  }, [
    activeInteraction,
    activeInteractionReplayAudioKey,
    activeInteractionReplayTextKey,
    currentPage.id,
    currentPage.narrationKey,
    currentPage.promptKey,
    playAudioKey,
  ]);

  const toggleNarrationPause = useCallback(() => {
    if (isNarrationPaused) {
      setIsNarrationPaused(false);
      setStatusKey('games.interactiveHandbook.status.interactionResume');
      setStatusTone('neutral');
      replayCurrentPrompt();
      return;
    }

    setIsNarrationPaused(true);
    audio.stop();
    setReadingHighlightState(null);
    setStatusKey('games.interactiveHandbook.status.interactionPause');
    setStatusTone('hint');
  }, [audio, isNarrationPaused, replayCurrentPrompt]);

  const retryCurrentInteraction = useCallback(() => {
    if (!activeInteraction) {
      return;
    }

    const pageId = currentPage.id;

    setSelectedChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[pageId];
      return next;
    });

    setHighlightChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[pageId];
      return next;
    });
    setRetryScaffoldByPage((previous) => {
      if (!(pageId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[pageId];
      return next;
    });
    clearAntiGuessPauseTimer();
    setIsAntiGuessPaused(false);
    resetAntiGuessTracker();

    setStatusKey('games.interactiveHandbook.controls.retryCue');
    setStatusTone('neutral');
    setReadingHighlightState({ pageId, mode: 'prompt' });
    playAudioKey('games.interactiveHandbook.controls.retryCue', true);

    window.setTimeout(() => {
      const replayTextKey = activeInteractionReplayTextKey ?? activeInteraction.promptKey;
      const replayAudioKey = activeInteractionReplayAudioKey ?? activeInteraction.promptKey;
      setStatusKey(replayTextKey);
      setReadingHighlightState({ pageId, mode: 'prompt' });
      playAudioKey(replayAudioKey);
    }, 180);
  }, [
    activeInteraction,
    activeInteractionReplayAudioKey,
    activeInteractionReplayTextKey,
    clearAntiGuessPauseTimer,
    currentPage.id,
    playAudioKey,
    resetAntiGuessTracker,
  ]);

  const resolveCompletion = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    const allPagesVisited = pageDefinitions.every((page) => visitedPages.has(page.id));
    const allMandatorySolved = mandatoryPageIds.every((pageId) => solvedPages.has(pageId));

    if (!allPagesVisited || !allMandatorySolved) {
      setStatusKey('games.interactiveHandbook.status.completeInteractionFirst');
      setStatusTone('error');
      playAudioKey('games.interactiveHandbook.status.completeInteractionFirst', true);
      return;
    }

    const firstAttemptRate = mandatoryPageIds.length
      ? Math.round(
          (mandatoryPageIds.filter((pageId) => firstAttemptSuccessPages.has(pageId)).length / mandatoryPageIds.length) *
            100,
        )
      : 100;
    const mandatoryHintCount = mandatoryPageIds.reduce((sum, pageId) => sum + (pageHintUsage[pageId] ?? 0), 0);
    const hintRate = mandatoryPageIds.length ? Math.round((mandatoryHintCount / mandatoryPageIds.length) * 100) : 0;

    const hintTrend = getHintTrend(pageHintUsage, pageDefinitions.map((page) => page.id));
    const metrics: ParentSummaryMetrics = {
      highestStableRange: buildStableRange(mandatorySolvedCount, mandatoryPageIds.length),
      firstAttemptSuccessRate: firstAttemptRate,
      hintTrend,
    };
    const gatePassed = firstAttemptRate >= qualityGate.firstTryAccuracyMin && hintRate <= qualityGate.hintRateMax;
    const readingGate: ReadingGateStatus = {
      activeBookId: activeLadderBookId,
      nextBookId: gatePassed ? getNextBookId(activeLadderBookId) : null,
      passed: gatePassed,
      firstAttemptSuccessRate: firstAttemptRate,
      hintRate,
      firstTryAccuracyMin: qualityGate.firstTryAccuracyMin,
      hintRateMax: qualityGate.hintRateMax,
    };

    const optionalSolved = pageDefinitions.filter((page) => page.interaction && !page.interaction.required).filter(
      (page) => solvedPages.has(page.id),
    ).length;
    const visitedCount = pageDefinitions.filter((page) => visitedPages.has(page.id)).length;

    const score = mandatorySolvedCount * 35 + optionalSolved * 12 + firstAttemptRate + (gatePassed ? 45 : 0);
    const stars = firstAttemptRate >= 85 ? 3 : firstAttemptRate >= 65 ? 2 : 1;

    completionSentRef.current = true;

    setCompletionSummary({
      metrics,
      firstAttemptRate,
      hintRate,
      hints: hintTrend,
      visitedCount,
      readingGate,
    });
    setIsCompleted(true);
    setReadingHighlightState(null);

    setStatusKey(handbookCompletionTitleKey);
    setStatusTone('success');

    playAudioKey(handbookCompletionTitleKey, true);

    onComplete({
      stars,
      score,
      completed: true,
      roundsCompleted: visitedCount,
      summaryMetrics: metrics,
      readingGate,
    });
  }, [
    activeLadderBookId,
    firstAttemptSuccessPages,
    handbookCompletionTitleKey,
    mandatoryPageIds,
    mandatorySolvedCount,
    onComplete,
    pageHintUsage,
    pageDefinitions,
    playAudioKey,
    qualityGate.firstTryAccuracyMin,
    qualityGate.hintRateMax,
    solvedPages,
    visitedPages,
  ]);

  const chooseInteractionOption = useCallback(
    (choice: ChoiceDefinition) => {
      if (!activeInteraction) {
        return;
      }

      if (isAntiGuessPaused) {
        return;
      }

      if (isChoiceLocked) {
        setStatusKey(activeInteraction.hintKey);
        setStatusTone('hint');
        setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
        playAudioKey(activeInteraction.hintKey, true);
        return;
      }

      const pageId = currentPage.id;
      const nextAttempts = (pageAttempts[pageId] ?? 0) + 1;
      const hasRetryScaffold = (retryScaffoldByPage[pageId] ?? 0) > 0;

      setPageAttempts((previous) => ({
        ...previous,
        [pageId]: nextAttempts,
      }));
      if (hasRetryScaffold) {
        setRetryScaffoldByPage((previous) => {
          const currentTrials = previous[pageId] ?? 0;
          if (currentTrials <= 0) {
            return previous;
          }

          const next = { ...previous };
          if (currentTrials <= 1) {
            delete next[pageId];
          } else {
            next[pageId] = currentTrials - 1;
          }
          return next;
        });
      }

      setSelectedChoiceByPage((previous) => ({
        ...previous,
        [pageId]: choice.id,
      }));

      setHighlightChoiceByPage((previous) => {
        const next = { ...previous };
        delete next[pageId];
        return next;
      });

      playAudioKey(choice.audioKey ?? choice.labelKey);

      if (choice.isCorrect) {
        clearAntiGuessPauseTimer();
        setIsAntiGuessPaused(false);
        resetAntiGuessTracker();
        setRetryScaffoldByPage((previous) => {
          if (!(pageId in previous)) {
            return previous;
          }

          const next = { ...previous };
          delete next[pageId];
          return next;
        });
        setSolvedPages((previous) => {
          if (previous.has(pageId)) {
            return previous;
          }
          const next = new Set(previous);
          next.add(pageId);
          return next;
        });

        if (nextAttempts === 1 && activeInteraction.required) {
          setFirstAttemptSuccessPages((previous) => {
            if (previous.has(pageId)) {
              return previous;
            }
            const next = new Set(previous);
            next.add(pageId);
            return next;
          });
        }

        setStatusKey(activeInteraction.successKey);
        setStatusTone('success');
        playAudioKey(activeInteraction.successKey, true);
        return;
      }

      const guardEvaluation = evaluateHandbookAntiGuessGuard(
        handbookAntiGuessGuard,
        antiGuessTrackerRef.current,
        performance.now(),
      );
      antiGuessTrackerRef.current = guardEvaluation.nextState;

      if (guardEvaluation.shouldPauseAndReplay) {
        const shouldApplyRetryScaffold = activeAgeBand === '5-6' || guardEvaluation.shouldForceScaffoldTrial;
        if (shouldApplyRetryScaffold) {
          setRetryScaffoldByPage((previous) => ({
            ...previous,
            [pageId]: Math.max(previous[pageId] ?? 0, 1),
          }));
        }

        clearAntiGuessPauseTimer();
        setIsAntiGuessPaused(true);
        setStatusKey(activeInteraction.hintKey);
        setStatusTone('hint');
        setReadingHighlightState({ pageId, mode: 'prompt' });
        playAudioKey(activeInteraction.hintKey, true);

        const replayTextKey = activeInteractionReplayTextKey ?? activeInteraction.promptKey;
        const replayAudioKey = activeInteractionReplayAudioKey ?? activeInteraction.promptKey;

        antiGuessPauseTimerRef.current = window.setTimeout(() => {
          antiGuessPauseTimerRef.current = null;
          setIsAntiGuessPaused(false);
          setSelectedChoiceByPage((previous) => {
            const next = { ...previous };
            delete next[pageId];
            return next;
          });
          setHighlightChoiceByPage((previous) => {
            const next = { ...previous };
            delete next[pageId];
            return next;
          });
          setStatusKey(replayTextKey);
          setStatusTone('neutral');
          setReadingHighlightState({ pageId, mode: 'prompt' });
          playAudioKey(replayAudioKey, true);
        }, handbookAntiGuessGuard.pauseMs);

        return;
      }

      setStatusKey(activeInteraction.retryKey);
      setStatusTone(isMagicLetterMapListenExploreMode ? 'hint' : 'error');
      playAudioKey(activeInteraction.retryKey, true);

      if (nextAttempts >= 2) {
        applyHint(false);
        playAudioKey(activeInteractionReplayAudioKey ?? activeInteraction.promptKey);
      }
    },
    [
      activeInteraction,
      activeInteractionReplayAudioKey,
      applyHint,
      activeAgeBand,
      clearAntiGuessPauseTimer,
      currentPage.id,
      handbookAntiGuessGuard,
      isAntiGuessPaused,
      isChoiceLocked,
      isMagicLetterMapListenExploreMode,
      pageAttempts,
      playAudioKey,
      resetAntiGuessTracker,
      retryScaffoldByPage,
    ],
  );

  const goToNextPage = useCallback(() => {
    if (activeInteraction?.required && !solvedPages.has(currentPage.id)) {
      setStatusKey('games.interactiveHandbook.status.completeInteractionFirst');
      setStatusTone('error');
      playAudioKey('games.interactiveHandbook.status.completeInteractionFirst', true);
      return;
    }

    playAudioKey('games.interactiveHandbook.controls.nextCue', true);

    if (isLastPage) {
      resolveCompletion();
      return;
    }

    const nextIndex = Math.min(currentPageIndex + 1, totalPages - 1);
    const nextPage = pageDefinitions[nextIndex] as HandbookPageDefinition;

    setPageTurnDirection('forward');
    markPageVisited(nextPage.id);
    setCurrentPageIndex(nextIndex);
  }, [
    activeInteraction,
    currentPage.id,
    currentPageIndex,
    isLastPage,
    markPageVisited,
    pageDefinitions,
    playAudioKey,
    resolveCompletion,
    solvedPages,
    totalPages,
  ]);

  const goToPreviousPage = useCallback(() => {
    if (activeInteraction?.required && !solvedPages.has(currentPage.id)) {
      setStatusKey('games.interactiveHandbook.status.completeInteractionFirst');
      setStatusTone('error');
      playAudioKey('games.interactiveHandbook.status.completeInteractionFirst', true);
      return;
    }

    if (currentPageIndex <= 0) {
      return;
    }

    const previousIndex = Math.max(currentPageIndex - 1, 0);
    const previousPage = pageDefinitions[previousIndex] as HandbookPageDefinition;

    playAudioKey('nav.back', true);
    setPageTurnDirection('backward');
    markPageVisited(previousPage.id);
    setCurrentPageIndex(previousIndex);
  }, [activeInteraction, currentPage.id, currentPageIndex, markPageVisited, pageDefinitions, playAudioKey, solvedPages]);

  const clearSwipeGesture = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  const handleStoryPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  const handleStoryPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;

      if (!start || isCompleted) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = Math.abs(event.clientY - start.y);

      if (Math.abs(deltaX) < SWIPE_GESTURE_MIN_DISTANCE_PX || deltaY > SWIPE_GESTURE_MAX_VERTICAL_DRIFT_PX) {
        return;
      }

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      const swipedLeft = deltaX < 0;

      if (isRtl) {
        if (swipedLeft) {
          goToNextPage();
          return;
        }

        goToPreviousPage();
        return;
      }

      if (swipedLeft) {
        goToPreviousPage();
        return;
      }

      goToNextPage();
    },
    [goToNextPage, goToPreviousPage, isCompleted, isRtl],
  );

  const visibleChoices = useMemo(() => {
    if (!activeInteraction) {
      return [];
    }

    const policyChoiceCap =
      resolvePolicyValueByAgeBand(activeInteraction.maxChoicesByBand, activeAgeBand) ??
      READING_RUNTIME_MATRIX[activeAgeBand].handbook.maxChoiceCount;
    let choices = applyChoiceCap(activeInteraction.choices, policyChoiceCap);
    const retryScaffoldReductionCount = retryScaffoldByPage[currentPage.id] ?? 0;
    if (retryScaffoldReductionCount > 0) {
      choices = reduceChoicesForRetryScaffold(choices, retryScaffoldReductionCount);
    }
    const attempts = pageAttempts[currentPage.id] ?? 0;
    const shouldReduceChoices = isMagicLetterMapListenExploreMode || attempts >= 2;
    if (shouldReduceChoices && choices.length > 2) {
      const correct = choices.find((choice) => choice.isCorrect);
      const fallback = choices.find((choice) => !choice.isCorrect);
      choices = [correct, fallback].filter((choice): choice is ChoiceDefinition => Boolean(choice));
    }

    return choices;
  }, [activeAgeBand, activeInteraction, currentPage.id, isMagicLetterMapListenExploreMode, pageAttempts, retryScaffoldByPage]);

  useEffect(() => {
    if (typeof window === 'undefined' || isCompleted) {
      return;
    }

    const controlsRowNode = controlsRowRef.current;
    if (!controlsRowNode) {
      return;
    }

    const alignControlsRowInViewport = () => {
      const controlsRect = controlsRowNode.getBoundingClientRect();
      const shouldReposition = shouldRepositionControlRowInViewport({
        top: controlsRect.top,
        left: controlsRect.left,
        right: controlsRect.right,
        viewportWidth: window.innerWidth,
      });

      if (!shouldReposition) {
        return;
      }

      controlsRowNode.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'auto',
      });
    };

    const frame = window.requestAnimationFrame(() => {
      alignControlsRowInViewport();
    });
    const shortDelayedRealign = window.setTimeout(() => {
      alignControlsRowInViewport();
    }, CONTROL_ROW_REALIGN_SHORT_DELAY_MS);
    const delayedRealign = window.setTimeout(() => {
      alignControlsRowInViewport();
    }, CONTROL_ROW_REALIGN_AFTER_PAGE_TURN_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(shortDelayedRealign);
      window.clearTimeout(delayedRealign);
    };
  }, [currentPage.id, isCompleted]);

  useEffect(() => {
    markPageVisited(currentPage.id);
    const shouldAnnounceChapterTransition = Boolean(chapterTransitionKey) && chapterTransitionCueRef.current !== chapterTransitionKey;
    chapterTransitionCueRef.current = chapterTransitionKey;
    setStatusKey(shouldAnnounceChapterTransition ? chapterTransitionKey ?? currentPage.promptKey : activeInteractionReplayTextKey ?? currentPage.promptKey);
    setStatusTone('neutral');
    setReadingHighlightState(null);
    setHighlightChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[currentPage.id];
      return next;
    });

    if (isNarrationPaused) {
      return;
    }

    let firstPaintFrame: number | null = null;
    let secondPaintFrame: number | null = null;
    let narrationTimer: number | null = null;
    let interactionPromptTimer: number | null = null;

    const playNarration = () => {
      hasPassedStartupNarrationGateRef.current = true;
      setReadingHighlightState({ pageId: currentPage.id, mode: 'narration' });
      playAudioKey(currentPage.narrationKey, true);

      if (!activeInteraction) {
        return;
      }

      interactionPromptTimer = window.setTimeout(() => {
        setStatusKey(activeInteractionReplayTextKey ?? activeInteraction.promptKey);
        setReadingHighlightState({ pageId: currentPage.id, mode: 'prompt' });
        playAudioKey(activeInteractionReplayAudioKey ?? activeInteraction.promptKey);
      }, POST_NARRATION_PROMPT_DELAY_MS);
    };

    if (!hasPassedStartupNarrationGateRef.current) {
      firstPaintFrame = window.requestAnimationFrame(() => {
        secondPaintFrame = window.requestAnimationFrame(() => {
          narrationTimer = window.setTimeout(playNarration, STARTUP_NARRATION_DELAY_MS);
        });
      });
    } else {
      narrationTimer = window.setTimeout(playNarration, 0);
    }

    return () => {
      if (firstPaintFrame !== null) {
        window.cancelAnimationFrame(firstPaintFrame);
      }
      if (secondPaintFrame !== null) {
        window.cancelAnimationFrame(secondPaintFrame);
      }
      if (narrationTimer !== null) {
        window.clearTimeout(narrationTimer);
      }
      if (interactionPromptTimer !== null) {
        window.clearTimeout(interactionPromptTimer);
      }
      setReadingHighlightState((previous) => (previous?.pageId === currentPage.id ? null : previous));
    };
  }, [
    activeInteraction,
    activeInteractionReplayAudioKey,
    activeInteractionReplayTextKey,
    chapterTransitionKey,
    currentPage.id,
    currentPage.narrationKey,
    currentPage.promptKey,
    isNarrationPaused,
    markPageVisited,
    playAudioKey,
  ]);

  useEffect(() => {
    if (!activeInteraction || solvedPages.has(currentPage.id) || isNarrationPaused) {
      return;
    }

    const policyTimeoutMs = resolveHintTriggerTimeoutMs(activeInteraction, activeAgeBand);
    let timeoutMs = policyTimeoutMs ?? (mode === 'readToMe' ? 4200 : mode === 'readAndPlay' ? 6200 : 7200);

    if (policyTimeoutMs === null) {
      if (isMagicLetterMapListenExploreMode) {
        timeoutMs = Math.max(2400, timeoutMs - 1700);
      } else if (isMagicLetterMapStretchMode) {
        timeoutMs += 2000;
      }
    }

    const timer = window.setTimeout(() => {
      applyHint(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeInteraction,
    activeAgeBand,
    applyHint,
    currentPage.id,
    isMagicLetterMapListenExploreMode,
    isMagicLetterMapStretchMode,
    isNarrationPaused,
    mode,
    solvedPages,
  ]);

  useEffect(() => {
    onProgressChange?.(progressSnapshot);
  }, [onProgressChange, progressSnapshot]);

  const summaryHintKey = completionSummary
    ? completionSummary.hints === 'improving'
      ? 'games.interactiveHandbook.summary.hintTrend.improving'
      : completionSummary.hints === 'steady'
        ? 'games.interactiveHandbook.summary.hintTrend.steady'
        : 'games.interactiveHandbook.summary.hintTrend.needsSupport'
    : null;
  const parentSummarySlug: HandbookSlug = activeStoryDepthSlug ?? activeHandbookSlug;
  const storyArcChaptersTotal = activeStoryDepthSlug ? 3 : 0;
  const storyArcChaptersCompleted = activeStoryDepthSlug ? countCompletedStoryArcChapters(activeLadderBookId, visitedPages) : 0;
  const independenceTrendLabel = summaryHintKey ? t(summaryHintKey as any) : '';
  const coachVariant = completionSummary || statusTone === 'success' ? 'success' : 'hint';

  return (
    <Card padding="lg" className="interactive-handbook">
      <GameTopBar
        isRtl={isRtl}
        subtitle={t(handbookMetaKey(parentSummarySlug, 'subtitle') as any)}
        progressLabel={t('games.interactiveHandbook.reader.pageLabel', {
          current: currentPageIndex + 1,
          total: totalPages,
        })}
        progressAriaLabel={t('games.interactiveHandbook.reader.pageLabel', {
          current: currentPageIndex + 1,
          total: totalPages,
        })}
        currentStep={currentPageIndex + 1}
        totalSteps={totalPages}
        onReplayInstruction={replayCurrentPrompt}
        replayAriaLabel={t('games.interactiveHandbook.controls.replay')}
        onBack={onRequestBack}
        backAriaLabel={t('nav.back')}
        rightSlot={
          <div className="interactive-handbook__mode-switch" role="group" aria-label={t('games.interactiveHandbook.controls.modeGroup')}>
            <button
              type="button"
              className={`interactive-handbook__mode-button ${mode === 'readToMe' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('readToMe');
                playAudioKey('games.interactiveHandbook.modes.readToMe', true);
              }}
              aria-label={t('games.interactiveHandbook.modes.readToMe')}
            >
              {t('games.interactiveHandbook.modes.readToMe')}
            </button>
            <button
              type="button"
              className={`interactive-handbook__mode-button ${mode === 'readAndPlay' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('readAndPlay');
                playAudioKey('games.interactiveHandbook.modes.readAndPlay', true);
              }}
              aria-label={t('games.interactiveHandbook.modes.readAndPlay')}
            >
              {t('games.interactiveHandbook.modes.readAndPlay')}
            </button>
            <button
              type="button"
              className={`interactive-handbook__mode-button ${mode === 'calmReplay' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('calmReplay');
                playAudioKey('games.interactiveHandbook.modes.calmReplay', true);
              }}
              aria-label={t('games.interactiveHandbook.modes.calmReplay')}
            >
              {t('games.interactiveHandbook.modes.calmReplay')}
            </button>
          </div>
        }
      />

      <div className="interactive-handbook__stage">
        <div key={currentPage.id} className={storyFlipClassName}>
          <div
            className={[
              'interactive-handbook__story-card',
              isNarrationHighlightActive ? 'is-reading-narration' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="group"
            dir={isRtl ? 'rtl' : 'ltr'}
            aria-label={t(currentPage.narrationKey as any)}
            onPointerDown={handleStoryPointerDown}
            onPointerUp={handleStoryPointerUp}
            onPointerCancel={clearSwipeGesture}
          >
            <p className="interactive-handbook__page-chip">
              {t('games.interactiveHandbook.reader.pageLabel', {
                current: currentPageIndex + 1,
                total: totalPages,
              })}
            </p>
            <HandbookPageRenderer
              blocks={rendererBlocks}
              mediaAssets={currentPage.mediaAssets}
              narrationFallbackKey={currentPage.narrationKey}
              promptFallbackKey={currentPage.promptKey}
              activeInteractionId={activeInteraction?.id ?? null}
              solvedInteractionIds={solvedInteractionIds}
              onHotspotPress={handleRendererHotspotPress}
              onAudioKeyPress={playRendererAudioKey}
            />
          </div>
        </div>

        <div className={`interactive-handbook__status-row ${isPromptHighlightActive ? 'is-reading-prompt' : ''}`}>
          <p className={toneClassName(statusTone)}>{t(statusKey as any)}</p>
        </div>
        <div className="interactive-handbook__coach" aria-hidden="true">
          <MascotIllustration variant={coachVariant} size={50} />
        </div>

        {audioDegraded ? (
          <p className="interactive-handbook__audio-fallback" aria-live="polite">
            <span aria-hidden="true">🔇</span>
            <span>{t('feedback.keepGoing')}</span>
          </p>
        ) : null}

        <div className="interactive-handbook__controls" ref={controlsRowRef}>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={replayCurrentPrompt}
            aria-label={t('games.interactiveHandbook.controls.replay')}
          >
            <HandbookControlIcon kind="replay" />
          </button>
          <button
            type="button"
            className={`interactive-handbook__icon-button ${isNarrationPaused ? 'is-active' : ''}`}
            onClick={toggleNarrationPause}
            aria-label={
              isNarrationPaused ? t('handbooks.reader.controls.playNarration') : t('handbooks.reader.controls.pauseNarration')
            }
            aria-pressed={isNarrationPaused}
          >
            <HandbookControlIcon kind={isNarrationPaused ? 'play' : 'pause'} />
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={retryCurrentInteraction}
            disabled={!activeInteraction}
            aria-label={t('games.interactiveHandbook.controls.retry')}
          >
            <HandbookControlIcon kind="retry" />
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={() => applyHint(false)}
            disabled={!activeInteraction}
            aria-label={t('games.interactiveHandbook.controls.hint')}
          >
            <HandbookControlIcon kind="hint" />
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={goToPreviousPage}
            disabled={!canReturnToPreviousPage}
            aria-label={t('nav.back')}
          >
            <HandbookControlIcon kind="previous" isRtl={isRtl} />
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={goToNextPage}
            disabled={!canAdvanceCurrentPage && !isLastPage}
            aria-label={isLastPage ? t('games.interactiveHandbook.instructions.completion') : t('games.interactiveHandbook.controls.next')}
          >
            <HandbookControlIcon kind={isLastPage ? 'complete' : 'next'} isRtl={isRtl} />
          </button>
        </div>

        {activeInteraction && (
          <div
            className={`interactive-handbook__interaction-card ${isPromptHighlightActive ? 'is-reading-prompt' : ''}`}
            aria-live="polite"
          >
            <p className="interactive-handbook__interaction-title">{t(activeInteraction.promptKey as any)}</p>
            <div className="interactive-handbook__choices-grid" role="group" aria-label={t('games.interactiveHandbook.instructions.tapChoice')}>
              {visibleChoices.map((choice) => {
                const selected = selectedChoiceByPage[currentPage.id] === choice.id;
                const highlighted = highlightChoiceByPage[currentPage.id] === choice.id;
                const choiceLabel = t(choice.labelKey as any);

                return (
                  <button
                    key={`${currentPage.id}-${choice.id}`}
                    type="button"
                    className={[
                      'interactive-handbook__choice',
                      selected ? 'is-selected' : '',
                      highlighted ? 'is-highlighted' : '',
                    ].join(' ')}
                    onClick={() => chooseInteractionOption(choice)}
                    aria-label={choiceLabel}
                    disabled={isChoiceLocked}
                  >
                    <span className="interactive-handbook__choice-icon" aria-hidden="true">
                      <HandbookChoiceIcon choiceId={choice.id} />
                    </span>
                    <span className="interactive-handbook__choice-label">{choiceLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {completionSummary && (
          <div className="interactive-handbook__completion">
            <SuccessCelebration dense />
            <h3 className="interactive-handbook__completion-title">{t(handbookCompletionTitleKey as any)}</h3>
            <p className="interactive-handbook__completion-line">
              {t(handbookCompletionSummaryKey as any, {
                successRate: completionSummary.firstAttemptRate,
                pagesVisited: completionSummary.visitedCount,
                chaptersCompleted: storyArcChaptersCompleted,
                chaptersTotal: storyArcChaptersTotal,
              })}
            </p>
            {activeStoryDepthSlug ? (
              <>
                <p className="interactive-handbook__completion-line">
                  {t(parentHandbookKey(parentSummarySlug, 'storyEngagement') as any, {
                    chaptersCompleted: storyArcChaptersCompleted,
                    chaptersTotal: storyArcChaptersTotal,
                  })}
                </p>
                <p className="interactive-handbook__completion-line">
                  {t(parentHandbookKey(parentSummarySlug, 'decodeInStoryAccuracy') as any, {
                    decodeAccuracy: completionSummary.firstAttemptRate,
                  })}
                </p>
                <p className="interactive-handbook__completion-line">
                  {t(parentHandbookKey(parentSummarySlug, 'evidenceReading') as any, {
                    evidenceAccuracy: completionSummary.metrics.sequenceEvidenceScore ?? completionSummary.firstAttemptRate,
                  })}
                </p>
                <p className="interactive-handbook__completion-line">
                  {t(parentHandbookKey(parentSummarySlug, 'independenceTrend') as any, {
                    independenceTrend: independenceTrendLabel,
                  })}
                </p>
              </>
            ) : null}
            <p className="interactive-handbook__completion-line">
              {t(
                completionSummary.readingGate.passed
                  ? 'games.interactiveHandbook.gates.qualityPassed'
                  : 'games.interactiveHandbook.gates.qualityNeedsSupport',
                {
                  book: t(`games.interactiveHandbook.ladderBooks.${completionSummary.readingGate.activeBookId}` as any),
                  firstAttemptRate: completionSummary.firstAttemptRate,
                  hintRate: completionSummary.hintRate,
                },
              )}
            </p>
            <p className="interactive-handbook__completion-line">
              {t('games.interactiveHandbook.gates.thresholds', {
                firstTryThreshold: completionSummary.readingGate.firstTryAccuracyMin,
                hintRateThreshold: completionSummary.readingGate.hintRateMax,
              })}
            </p>
            {summaryHintKey && !activeStoryDepthSlug && <p className="interactive-handbook__completion-line">{t(summaryHintKey as any)}</p>}
            <p className="interactive-handbook__completion-line">
              {completionSummary.readingGate.nextBookId
                ? t('games.interactiveHandbook.gates.nextBookReady', {
                    nextBook: t(`games.interactiveHandbook.ladderBooks.${completionSummary.readingGate.nextBookId}` as any),
                  })
                : t('games.interactiveHandbook.gates.replayCurrentBook')}
            </p>
            <p className="interactive-handbook__completion-line">{t(handbookCompletionNextStepKey as any)}</p>
          </div>
        )}
      </div>

      <style>{`
        .interactive-handbook {
          display: grid;
          gap: var(--space-md);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent);
          background:
            radial-gradient(circle at 85% 18%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 40%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, var(--color-theme-bg) 8%), var(--color-bg-card));
        }

        .interactive-handbook__mode-switch {
          display: grid;
          grid-auto-flow: column;
          gap: var(--space-2xs);
        }

        .interactive-handbook__mode-button {
          min-height: var(--handbook-control-min-height);
          min-width: max(var(--handbook-control-min-height), 104px);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          line-height: var(--line-height-tight);
          cursor: pointer;
          padding: 0 var(--space-sm);
        }

        .interactive-handbook__mode-button.is-active {
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
          color: var(--color-text-primary);
          background: color-mix(in srgb, var(--color-theme-primary) 16%, var(--color-surface));
        }

        .interactive-handbook__stage {
          display: grid;
          gap: var(--space-sm);
        }

        .interactive-handbook__story-flip {
          display: grid;
        }

        .interactive-handbook__story-flip--forward.is-ltr {
          animation: interactive-handbook-page-enter-forward-ltr var(--handbook-page-turn-duration) var(--motion-ease-standard);
        }

        .interactive-handbook__story-flip--forward.is-rtl {
          animation: interactive-handbook-page-enter-forward-rtl var(--handbook-page-turn-duration) var(--motion-ease-standard);
        }

        .interactive-handbook__story-flip--backward.is-ltr {
          animation: interactive-handbook-page-enter-backward-ltr var(--handbook-page-turn-duration) var(--motion-ease-standard);
        }

        .interactive-handbook__story-flip--backward.is-rtl {
          animation: interactive-handbook-page-enter-backward-rtl var(--handbook-page-turn-duration) var(--motion-ease-standard);
        }

        .interactive-handbook__story-card {
          min-height: 220px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
          padding: var(--space-md);
          display: grid;
          gap: var(--space-sm);
          touch-action: pan-y;
          background:
            linear-gradient(145deg, color-mix(in srgb, var(--color-theme-bg) 72%, var(--color-bg-card) 28%), var(--color-bg-card));
        }

        .interactive-handbook__story-card.is-reading-narration {
          border-color: color-mix(in srgb, var(--color-theme-primary) 68%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
        }

        .interactive-handbook__story-card.is-reading-narration .interactive-handbook__page-chip {
          background: color-mix(in srgb, var(--color-theme-primary) 28%, var(--color-bg-card));
        }

        .interactive-handbook__story-card.is-reading-narration .interactive-handbook__text-strip {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-theme-primary) 14%, var(--color-bg-card)),
              color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-bg) 10%)
            );
        }

        .interactive-handbook__page-chip {
          margin: 0;
          justify-self: start;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 26%, var(--color-bg-card));
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }

        .interactive-handbook__page-renderer {
          display: grid;
        }

        .interactive-handbook__page-frame {
          border-radius: var(--handbook-frame-radius);
          border: var(--handbook-frame-border);
          box-shadow: var(--handbook-frame-shadow);
          overflow: hidden;
          display: grid;
          grid-template-rows:
            minmax(var(--handbook-illustration-min-height), 58fr)
            minmax(var(--handbook-text-min-height), 42fr);
          background: var(--gradient-game-surface-warm);
        }

        .interactive-handbook__illustration-stage {
          position: relative;
          min-block-size: var(--handbook-illustration-min-height);
          overflow: hidden;
          background:
            radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--color-theme-secondary) 28%, transparent), transparent 38%),
            radial-gradient(circle at 84% 72%, color-mix(in srgb, var(--color-theme-primary) 18%, transparent), transparent 42%),
            var(--gradient-game-surface-cool);
        }

        .interactive-handbook__illustration-node {
          margin: 0;
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }

        .interactive-handbook__illustration-node--base {
          position: relative;
          inset: auto;
          inline-size: 100%;
          block-size: 100%;
        }

        .interactive-handbook__illustration-media {
          inline-size: 100%;
          block-size: 100%;
          display: block;
        }

        .interactive-handbook__illustration-fallback {
          inline-size: 100%;
          block-size: 100%;
          background:
            radial-gradient(circle at 26% 30%, color-mix(in srgb, var(--color-theme-secondary) 24%, transparent), transparent 42%),
            radial-gradient(circle at 74% 64%, color-mix(in srgb, var(--color-theme-primary) 20%, transparent), transparent 40%),
            var(--gradient-game-surface-warm);
        }

        .interactive-handbook__illustration-fallback--empty {
          min-block-size: var(--handbook-illustration-min-height);
        }

        .interactive-handbook__interaction-zone {
          position: absolute;
          min-inline-size: var(--handbook-hotspot-min-size);
          min-block-size: var(--handbook-hotspot-min-size);
          border-radius: var(--radius-full);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 52%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          z-index: 2;
          transition:
            transform var(--motion-duration-quick) var(--motion-ease-standard),
            border-color var(--motion-duration-quick) var(--motion-ease-standard),
            background-color var(--motion-duration-quick) var(--motion-ease-standard);
        }

        .interactive-handbook__interaction-zone.is-active {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
          animation: interactive-handbook-hotspot-pulse 900ms var(--motion-ease-standard) infinite alternate;
        }

        .interactive-handbook__interaction-zone.is-solved {
          border-color: color-mix(in srgb, var(--color-accent-success) 70%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 20%, transparent);
        }

        .interactive-handbook__interaction-zone-ring {
          inline-size: 56%;
          block-size: 56%;
          border-radius: var(--radius-full);
          border: 2px dashed color-mix(in srgb, var(--color-text-inverse) 90%, transparent);
        }

        .interactive-handbook__badge-layer {
          position: absolute;
          inset: 0;
          padding: var(--space-sm);
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
          pointer-events: none;
          z-index: 3;
        }

        .interactive-handbook__badge-block {
          margin: 0;
          min-height: var(--touch-min);
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-border) 74%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 92%, var(--color-theme-bg) 8%);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: var(--space-sm);
          pointer-events: auto;
        }

        .interactive-handbook__badge-block--success {
          border-color: color-mix(in srgb, var(--color-accent-success) 64%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 16%, var(--color-bg-card));
        }

        .interactive-handbook__badge-block--hint {
          border-color: color-mix(in srgb, var(--color-theme-secondary) 64%, transparent);
          background: color-mix(in srgb, var(--color-theme-secondary) 18%, var(--color-bg-card));
        }

        .interactive-handbook__badge-block--button {
          cursor: pointer;
        }

        .interactive-handbook__text-strip {
          min-block-size: var(--handbook-text-min-height);
          display: grid;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md) var(--space-md);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-bg) 16%), var(--color-bg-card));
        }

        .interactive-handbook__text-strip.is-word-focus {
          gap: var(--handbook-word-stack-gap);
        }

        .interactive-handbook__text-block {
          margin: 0;
          text-align: start;
          color: var(--color-text-primary);
          line-height: var(--handbook-text-line-height);
        }

        .interactive-handbook__text-block--center {
          text-align: center;
        }

        .interactive-handbook__text-block--narration {
          font-size: var(--handbook-text-size);
          font-weight: var(--font-weight-medium);
        }

        .interactive-handbook__text-block--target {
          font-size: var(--handbook-word-hero-font-size);
          line-height: var(--handbook-word-hero-line-height);
          letter-spacing: var(--handbook-word-hero-letter-spacing);
          font-weight: var(--font-weight-bold);
          color: color-mix(in srgb, var(--color-theme-secondary) 72%, var(--color-text-primary));
        }

        .interactive-handbook__text-block--prompt {
          font-size: 1.25rem;
          font-weight: var(--font-weight-semibold);
          line-height: 1.5;
          color: color-mix(in srgb, var(--color-theme-primary) 80%, var(--color-text-primary));
        }

        .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-block--narration,
        .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-block--body {
          font-size: var(--handbook-support-font-size);
          line-height: var(--handbook-support-line-height);
          opacity: var(--handbook-support-emphasis-opacity);
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: var(--handbook-support-max-lines);
          overflow: hidden;
        }

        .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-replay.interactive-handbook__text-block--narration,
        .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-replay.interactive-handbook__text-block--body {
          opacity: 1;
        }

        .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-block--prompt {
          font-size: 1.25rem;
          font-weight: var(--font-weight-semibold);
          line-height: 1.5;
          color: var(--color-text-primary);
        }

        .interactive-handbook__text-replay {
          inline-size: 100%;
          min-height: var(--touch-min);
          border-radius: var(--radius-md);
          border: 2px solid var(--color-border);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          cursor: pointer;
          padding: var(--space-xs) var(--space-sm);
          transition: transform var(--motion-duration-quick) var(--motion-ease-standard);
        }

        .interactive-handbook__text-replay:active {
          transform: scale(0.99);
        }

        .interactive-handbook__status-row {
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 84%, transparent);
          padding: var(--space-sm);
          min-height: max(60px, var(--touch-primary-action));
          display: flex;
          align-items: center;
        }

        .interactive-handbook__status-row.is-reading-prompt {
          border-color: color-mix(in srgb, var(--color-theme-secondary) 64%, transparent);
          background: color-mix(in srgb, var(--color-theme-secondary) 16%, var(--color-surface-muted));
        }

        .interactive-handbook__coach {
          justify-self: end;
          inline-size: 66px;
          block-size: 66px;
          border-radius: var(--radius-full);
          display: grid;
          place-items: center;
          pointer-events: none;
          background: color-mix(in srgb, var(--color-bg-card) 90%, white);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 34%, transparent);
          box-shadow: var(--shadow-sm);
          animation: interactive-handbook-coach-float 1500ms ease-in-out infinite;
        }

        .interactive-handbook__coach,
        .interactive-handbook__coach * {
          pointer-events: none;
        }

        .interactive-handbook__audio-fallback {
          margin: 0;
          min-height: var(--touch-min);
          border-radius: var(--radius-md);
          border: 1px dashed color-mix(in srgb, var(--color-accent-warning) 52%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 90%, var(--color-accent-warning) 10%);
          color: var(--color-text-primary);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2xs);
          padding-inline: var(--space-sm);
        }

        .interactive-handbook__message {
          margin: 0;
          color: var(--color-text-primary);
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .interactive-handbook__message--hint {
          color: color-mix(in srgb, var(--color-accent-warning) 84%, var(--color-text-primary));
        }

        .interactive-handbook__message--success {
          color: color-mix(in srgb, var(--color-accent-success) 86%, var(--color-text-primary));
        }

        .interactive-handbook__message--error {
          color: color-mix(in srgb, var(--color-accent-danger) 80%, var(--color-text-primary));
        }

        .interactive-handbook__controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(var(--handbook-control-min-height), 1fr));
          gap: var(--space-xs);
        }

        .interactive-handbook__icon-button {
          min-height: var(--handbook-control-min-height);
          min-width: var(--handbook-control-min-height);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: 1.3rem;
          cursor: pointer;
          transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
        }

        .interactive-handbook__icon-svg {
          inline-size: 24px;
          block-size: 24px;
          display: block;
          margin-inline: auto;
        }

        .interactive-handbook__icon-button:active:not(:disabled) {
          transform: scale(0.96);
        }

        .interactive-handbook__icon-button.is-active {
          border-color: color-mix(in srgb, var(--color-theme-primary) 64%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 12%, var(--color-surface));
        }

        .interactive-handbook__icon-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .interactive-handbook__interaction-card {
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 44%, transparent);
          background: color-mix(in srgb, var(--color-surface) 84%, var(--color-theme-bg));
          padding: var(--space-lg);
          display: grid;
          gap: var(--space-sm);
        }

        .interactive-handbook__interaction-card.is-reading-prompt {
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-theme-primary) 16%, transparent);
        }

        .interactive-handbook__interaction-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--handbook-prompt-font-size);
          line-height: var(--line-height-normal);
          font-weight: var(--font-weight-semibold);
        }

        .interactive-handbook__choices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-xs);
        }

        .interactive-handbook__choice {
          min-height: max(60px, var(--touch-primary-action));
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          justify-items: start;
          gap: var(--space-xs);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          line-height: 1.35;
          text-align: start;
          cursor: pointer;
          padding: var(--space-xs) var(--space-sm);
          transition:
            transform var(--motion-duration-fast) var(--motion-ease-standard),
            box-shadow var(--motion-duration-fast) var(--motion-ease-standard);
          touch-action: manipulation;
        }

        .interactive-handbook__choice-icon {
          inline-size: 34px;
          block-size: 34px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 32%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 14%, var(--color-bg-card));
          color: color-mix(in srgb, var(--color-text-primary) 90%, black);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .interactive-handbook__choice-icon-svg {
          inline-size: 18px;
          block-size: 18px;
          display: block;
        }

        .interactive-handbook__choice-label {
          justify-self: start;
        }

        .interactive-handbook__choice.is-selected {
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 14%, var(--color-bg-card));
        }

        .interactive-handbook__choice.is-selected .interactive-handbook__choice-icon {
          border-color: color-mix(in srgb, var(--color-theme-primary) 68%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 22%, var(--color-bg-card));
        }

        .interactive-handbook__choice.is-highlighted {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-warning) 40%, transparent);
        }

        .interactive-handbook__choice:active:not(:disabled) {
          transform: scale(0.985);
        }

        .interactive-handbook__completion {
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 58%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 10%, var(--color-bg-card));
          padding: var(--space-md);
          display: grid;
          gap: var(--space-xs);
        }

        .interactive-handbook__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .interactive-handbook__completion-line {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        @keyframes interactive-handbook-page-enter-forward-ltr {
          from {
            opacity: 0.6;
            transform: translateX(-34px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes interactive-handbook-page-enter-forward-rtl {
          from {
            opacity: 0.6;
            transform: translateX(34px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes interactive-handbook-page-enter-backward-ltr {
          from {
            opacity: 0.62;
            transform: translateX(30px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes interactive-handbook-page-enter-backward-rtl {
          from {
            opacity: 0.62;
            transform: translateX(-30px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes interactive-handbook-hotspot-pulse {
          from {
            transform: scale(0.96);
          }
          to {
            transform: scale(1.02);
          }
        }

        @keyframes interactive-handbook-coach-float {
          0% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }

          100% {
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .interactive-handbook__story-flip--forward.is-ltr,
          .interactive-handbook__story-flip--forward.is-rtl,
          .interactive-handbook__story-flip--backward.is-ltr,
          .interactive-handbook__story-flip--backward.is-rtl {
            animation: none;
          }

          .interactive-handbook__interaction-zone.is-active {
            animation: none;
          }

          .interactive-handbook__interaction-zone,
          .interactive-handbook__icon-button,
          .interactive-handbook__text-replay {
            transition: none;
          }

          .interactive-handbook__icon-button {
            animation: none;
          }

          .interactive-handbook__coach {
            animation: none;
          }
        }

        @media (max-width: 960px) {
          .interactive-handbook__mode-switch {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .interactive-handbook__page-frame {
            grid-template-rows:
              minmax(220px, 56fr)
              minmax(112px, 44fr);
          }

          .interactive-handbook__interaction-zone {
            min-inline-size: max(60px, var(--touch-primary-action));
            min-block-size: max(60px, var(--touch-primary-action));
          }

          .interactive-handbook__text-strip.is-word-focus .interactive-handbook__text-block--narration {
            display: none;
          }
        }
      `}</style>
    </Card>
  );
}
