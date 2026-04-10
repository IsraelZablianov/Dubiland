export type FinalFormsPairId = 'kaf' | 'mem' | 'nun' | 'pe' | 'tsadi';

export interface FinalFormsPairSpec {
  id: FinalFormsPairId;
  pairLabelKey: string;
  narrationKey: string;
  checkpointPromptKey: string;
  wordExampleKey: string;
}

const FINAL_FORMS_WORD_KEYS: Record<FinalFormsPairId, string> = {
  kaf: 'melekh',
  mem: 'lehem',
  nun: 'gan',
  pe: 'af',
  tsadi: 'ets',
};

const buildPair = (
  id: FinalFormsPairId,
  narrationKey: string,
  checkpointPromptKey: string,
): FinalFormsPairSpec => ({
  id,
  pairLabelKey: `common.letters.baseAndFinal.${id}`,
  narrationKey: `common.videos.finalForms.narration.${narrationKey}`,
  checkpointPromptKey: `common.videos.finalForms.checkpoints.${checkpointPromptKey}`,
  wordExampleKey: `common.words.pronunciation.${FINAL_FORMS_WORD_KEYS[id]}`,
});

export const FINAL_FORMS_VIDEO_PAIRS: FinalFormsPairSpec[] = [
  buildPair('kaf', 'pairKaf', 'chooseKaf'),
  buildPair('mem', 'pairMem', 'chooseMem'),
  buildPair('nun', 'pairNun', 'chooseNun'),
  buildPair('pe', 'pairPe', 'choosePe'),
  buildPair('tsadi', 'pairTsadi', 'chooseTsadi'),
];

export const FINAL_FORMS_VIDEO_KEYSET = {
  titleKey: 'common.videos.finalForms.title',
  subtitleKey: 'common.videos.finalForms.subtitle',
  instructionIntroKey: 'common.videos.finalForms.instructions.intro',
  instructionTapCheckpointKey: 'common.videos.finalForms.instructions.tapCheckpoint',
  instructionTapReplayKey: 'common.videos.finalForms.instructions.tapReplay',
  instructionPrepareTransferKey: 'common.videos.finalForms.instructions.prepareTransfer',
  narrationOverviewKey: 'common.videos.finalForms.narration.overview',
  narrationRecapKey: 'common.videos.finalForms.narration.recap',
  narrationNextGameKey: 'common.videos.finalForms.narration.nextGame',
  checkpointBaseOrFinalKey: 'common.videos.finalForms.checkpoints.baseOrFinal',
  hintListenAgainKey: 'common.videos.finalForms.hints.listenAgain',
  hintFinalAtEndKey: 'common.videos.finalForms.hints.finalAtEnd',
  hintComparePairKey: 'common.videos.finalForms.hints.comparePair',
  hintModeledExampleKey: 'common.videos.finalForms.hints.modeledExample',
  feedbackSuccessCorrectKey: 'common.videos.finalForms.feedback.success.correct',
  feedbackSuccessRuleUseKey: 'common.videos.finalForms.feedback.success.ruleUse',
  feedbackSuccessKeepGoingKey: 'common.videos.finalForms.feedback.success.keepGoing',
  feedbackRetryGentleKey: 'common.videos.finalForms.feedback.retry.gentle',
  feedbackRetryFocusEndKey: 'common.videos.finalForms.feedback.retry.focusEnd',
  feedbackRetryReplayModelKey: 'common.videos.finalForms.feedback.retry.replayModel',
  parentProgressSummaryKey: 'common.parentDashboard.videos.finalForms.progressSummary',
  parentNextStepKey: 'common.parentDashboard.videos.finalForms.nextStep',
} as const;
