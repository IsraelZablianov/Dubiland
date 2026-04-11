import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHandbookRendererBlocks } from '../src/games/reading/HandbookPageRenderer.tsx';
import {
  buildFallbackRendererBlocks,
  evaluateHandbookAntiGuessGuard,
  mergeRuntimePageDefinitions,
  reduceChoicesForRetryScaffold,
} from '../src/games/reading/InteractiveHandbookGame.tsx';

test('renderer normalizes target-word and question block aliases', () => {
  const normalized = normalizeHandbookRendererBlocks(
    [
      {
        id: 'target-word',
        type: 'target-word',
        targetWordKey: 'handbooks.mikaSoundGarden.sentenceBank.modeledWords.dag',
        order: 10,
      },
      {
        id: 'question',
        type: 'question',
        questionKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
        order: 20,
      },
    ],
    'handbooks.mikaSoundGarden.scriptPackage.narration.intro',
    'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
  );

  const textBlocks = normalized.filter((block) => block.type === 'text');
  const targetBlock = textBlocks.find((block) => block.role === 'target');
  const promptBlock = textBlocks.find(
    (block) => block.role === 'prompt' && block.textKey === 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
  );

  assert.ok(targetBlock, 'expected target-word block to normalize to text role="target"');
  assert.ok(promptBlock, 'expected question block to normalize to prompt text');
});

test('runtime interaction choices override while story-depth prompt stays on base CTA flow', () => {
  const basePages = [
    {
      id: 'p01',
      narrationKey: 'handbooks.mikaSoundGarden.scriptPackage.narration.intro',
      promptKey: 'handbooks.mikaSoundGarden.scriptPackage.prompts.firstSound',
      interaction: {
        id: 'literalChoice',
        required: true,
        promptKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
        hintKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.hint',
        successKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.success',
        retryKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.retry',
        choices: [
          { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: true },
          { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
        ],
      },
    },
  ];

  const runtimeContent = {
    pages: [
      {
        pageId: 'p01',
        pageNumber: 1,
        layoutKind: 'picture_book',
        narrationKey: null,
        estimatedReadSec: null,
        blocks: [
          {
            type: 'question',
            questionKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
          },
        ],
        interactions: [
          {
            id: 'literalChoice',
            required: true,
            promptKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
            hintKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.hint',
            successKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.success',
            retryKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.retry',
            choices: [
              { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: true },
              { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: false },
            ],
          },
        ],
      },
    ],
    mediaAssets: [],
  };

  const mergedPages = mergeRuntimePageDefinitions(basePages, runtimeContent, 'mikaSoundGarden');
  const mergedPage = mergedPages[0];

  assert.equal(
    mergedPage.promptKey,
    'handbooks.mikaSoundGarden.scriptPackage.prompts.firstSound',
    'story-depth pages should keep base prompt key when runtime blocks use legacy question keys',
  );
  assert.equal(mergedPage.interaction?.choices[0]?.id, 'dag', 'runtime choices should override static fallback choices');
});

test('fallback renderer includes target-word text blocks for interaction choices', () => {
  const blocks = buildFallbackRendererBlocks(
    {
      id: 'p02',
      narrationKey: 'handbooks.mikaSoundGarden.sentenceBank.modeledPhrases.p02',
      promptKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
      interaction: undefined,
    },
    {
      id: 'literalChoice',
      required: true,
      promptKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
      hintKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.hint',
      successKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.success',
      retryKey: 'handbooks.mikaSoundGarden.interactions.literalChoice.retry',
      choices: [
        { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: true },
        { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: false },
      ],
    },
    false,
    null,
  );

  const targetBlocks = blocks.filter(
    (block) => block.type === 'text' && block.role === 'target',
  );
  assert.equal(targetBlocks.length, 1);
});

test('story-depth pages keep chaptered narration/cta keys when runtime rows still carry legacy narration keys', () => {
  const basePages = [
    {
      id: 'p01',
      narrationKey: 'handbooks.yoavLetterMap.pages.page01.narration',
      promptKey: 'handbooks.yoavLetterMap.pages.page01.cta',
      interaction: {
        id: 'decodePointedWord',
        required: true,
        promptKey: 'handbooks.yoavLetterMap.interactions.decodePointedWord.prompt',
        hintKey: 'handbooks.yoavLetterMap.interactions.decodePointedWord.hint',
        successKey: 'handbooks.yoavLetterMap.interactions.decodePointedWord.success',
        retryKey: 'handbooks.yoavLetterMap.interactions.decodePointedWord.retry',
        choices: [
          { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: true },
          { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: false },
        ],
      },
    },
  ];

  const runtimeContent = {
    pages: [
      {
        pageId: 'p01',
        pageNumber: 1,
        layoutKind: 'picture_book',
        narrationKey: 'handbooks.yoavLetterMap.scriptPackage.narration.intro',
        estimatedReadSec: 40,
        blocks: [
          {
            type: 'question',
            questionKey: 'handbooks.yoavLetterMap.interactions.decodePointedWord.prompt',
          },
        ],
        interactions: [],
      },
    ],
    mediaAssets: [],
  };

  const mergedPages = mergeRuntimePageDefinitions(basePages, runtimeContent, 'yoavLetterMap');
  assert.equal(mergedPages[0].narrationKey, basePages[0].narrationKey);
  assert.equal(mergedPages[0].promptKey, basePages[0].promptKey);
});

test('magic-letter-map runtime interactions with no choices use preset fallbacks', () => {
  const basePages = [
    {
      id: 'p03',
      narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.narration',
      promptKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.prompt',
      interaction: undefined,
    },
  ];

  const runtimeContent = {
    pages: [
      {
        pageId: 'p03',
        pageNumber: 3,
        layoutKind: 'picture_book',
        narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.narration',
        estimatedReadSec: 45,
        blocks: [],
        interactions: [
          {
            id: 'chooseLetter',
            required: true,
            promptKey: null,
            hintKey: null,
            successKey: null,
            retryKey: null,
            isScored: false,
            requiresTextActionBeforeChoice: false,
            allowImageBeforeAnswer: true,
            choiceLockUntilTextAction: false,
            hintTriggerByBand: {},
            maxChoicesByBand: {},
            choices: [],
          },
        ],
      },
    ],
    mediaAssets: [],
  };

  const [mergedPage] = mergeRuntimePageDefinitions(basePages, runtimeContent, 'magicLetterMap');
  assert.ok(mergedPage?.interaction, 'expected runtime interaction to be merged');
  assert.equal(mergedPage.interaction.required, true, 'interaction should stay required when fallback choices exist');
  assert.equal(mergedPage.interaction.choices.length, 3, 'fallback should provide actionable choices');
  assert.equal(mergedPage.interaction.choices[0].id, 'pe');
});

test('magic-letter-map legacy chooseWordByNikud interaction falls back to localized decode-pointed-word keys', () => {
  const basePages = [
    {
      id: 'p04',
      narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p04.narration',
      promptKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p04.prompt',
      interaction: undefined,
    },
  ];

  const runtimeContent = {
    pages: [
      {
        pageId: 'p04',
        pageNumber: 4,
        layoutKind: 'picture_book',
        narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p04.narration',
        estimatedReadSec: 45,
        blocks: [],
        interactions: [
          {
            id: 'chooseWordByNikud',
            required: true,
            promptKey: null,
            hintKey: null,
            successKey: null,
            retryKey: null,
            isScored: false,
            requiresTextActionBeforeChoice: false,
            allowImageBeforeAnswer: true,
            choiceLockUntilTextAction: false,
            hintTriggerByBand: {},
            maxChoicesByBand: {},
            choices: [],
          },
        ],
      },
    ],
    mediaAssets: [],
  };

  const [mergedPage] = mergeRuntimePageDefinitions(basePages, runtimeContent, 'magicLetterMap');
  assert.ok(mergedPage?.interaction, 'expected runtime interaction to be merged');
  assert.equal(
    mergedPage.interaction.promptKey,
    'games.interactiveHandbook.handbooks.magicLetterMap.interactions.decodePointedWord.prompt',
  );
  assert.equal(
    mergedPage.interaction.hintKey,
    'games.interactiveHandbook.handbooks.magicLetterMap.interactions.decodePointedWord.hint',
  );
  assert.equal(
    mergedPage.interaction.successKey,
    'games.interactiveHandbook.handbooks.magicLetterMap.interactions.decodePointedWord.success',
  );
  assert.equal(
    mergedPage.interaction.retryKey,
    'games.interactiveHandbook.handbooks.magicLetterMap.interactions.decodePointedWord.retry',
  );
});

test('magic-letter-map runtime-only final-page interaction stays optional for deterministic completion transition', () => {
  const basePages = [
    {
      id: 'p10',
      narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p10.narration',
      promptKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p10.prompt',
      interaction: undefined,
    },
  ];

  const runtimeContent = {
    pages: [
      {
        pageId: 'p10',
        pageNumber: 10,
        layoutKind: 'picture_book',
        narrationKey: 'games.interactiveHandbook.handbooks.magicLetterMap.pages.p10.narration',
        estimatedReadSec: 45,
        blocks: [],
        interactions: [
          {
            id: 'pickLearnedConcept',
            required: true,
            promptKey: 'games.interactiveHandbook.handbooks.magicLetterMap.interactions.recapSkill.prompt',
            hintKey: 'games.interactiveHandbook.handbooks.magicLetterMap.interactions.recapSkill.hint',
            successKey: 'games.interactiveHandbook.handbooks.magicLetterMap.interactions.recapSkill.success',
            retryKey: 'games.interactiveHandbook.handbooks.magicLetterMap.interactions.recapSkill.retry',
            isScored: false,
            requiresTextActionBeforeChoice: true,
            allowImageBeforeAnswer: true,
            choiceLockUntilTextAction: true,
            hintTriggerByBand: {},
            maxChoicesByBand: {},
            choices: [
              { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recapSkills.letters', isCorrect: true },
              { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recapSkills.colors', isCorrect: false },
            ],
          },
        ],
      },
    ],
    mediaAssets: [],
  };

  const [mergedPage] = mergeRuntimePageDefinitions(basePages, runtimeContent, 'magicLetterMap');
  assert.ok(mergedPage?.interaction, 'expected runtime final-page interaction to be merged');
  assert.equal(
    mergedPage.interaction.required,
    false,
    'runtime-only final-page interaction should be optional so completion transition is reachable',
  );
});

test('3-4 anti-guess guard triggers on rapid non-target taps and resets tracker for recovery', () => {
  const guardConfig = {
    rapidTapCount: 3,
    rapidTapWindowMs: 2000,
    pauseMs: 800,
  };

  let state = {
    nonTargetTapTimes: [],
    quickResponseStreak: 0,
    lastResponseAt: null,
  };

  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 100).nextState;
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 600).nextState;
  const trigger = evaluateHandbookAntiGuessGuard(guardConfig, state, 1100);

  assert.equal(trigger.rapidTapGuardTriggered, true);
  assert.equal(trigger.shouldPauseAndReplay, true);
  assert.equal(trigger.shouldForceScaffoldTrial, false);
  assert.deepEqual(trigger.nextState, {
    nonTargetTapTimes: [],
    quickResponseStreak: 0,
    lastResponseAt: null,
  });

  const recovery = evaluateHandbookAntiGuessGuard(guardConfig, trigger.nextState, 1700);
  assert.equal(recovery.shouldPauseAndReplay, false);
  assert.equal(recovery.nextState.nonTargetTapTimes.length, 1);
});

test('6-7 anti-guess guard triggers forced scaffold on short-response streaks and rapid taps', () => {
  const guardConfig = {
    rapidTapCount: 4,
    rapidTapWindowMs: 2000,
    pauseMs: 1000,
    shortResponseStreakThreshold: 3,
    shortResponseWindowMs: 600,
  };

  let state = {
    nonTargetTapTimes: [],
    quickResponseStreak: 0,
    lastResponseAt: null,
  };
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 0).nextState;
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 350).nextState;
  const shortResponseTrigger = evaluateHandbookAntiGuessGuard(guardConfig, state, 700);

  assert.equal(shortResponseTrigger.quickResponseGuardTriggered, true);
  assert.equal(shortResponseTrigger.shouldPauseAndReplay, true);
  assert.equal(shortResponseTrigger.shouldForceScaffoldTrial, true);

  state = {
    nonTargetTapTimes: [],
    quickResponseStreak: 0,
    lastResponseAt: null,
  };
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 0).nextState;
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 700).nextState;
  state = evaluateHandbookAntiGuessGuard(guardConfig, state, 1400).nextState;
  const rapidTapTrigger = evaluateHandbookAntiGuessGuard(guardConfig, state, 1900);

  assert.equal(rapidTapTrigger.rapidTapGuardTriggered, true);
  assert.equal(rapidTapTrigger.shouldPauseAndReplay, true);
  assert.equal(rapidTapTrigger.shouldForceScaffoldTrial, true);
});

test('retry scaffold choice reduction removes one option while preserving the correct answer', () => {
  const choices = [
    { id: 'correct', labelKey: 'choices.correct', isCorrect: true },
    { id: 'foil-a', labelKey: 'choices.foilA', isCorrect: false },
    { id: 'foil-b', labelKey: 'choices.foilB', isCorrect: false },
  ];

  const reduced = reduceChoicesForRetryScaffold(choices, 1);
  assert.equal(reduced.length, 2);
  assert.ok(reduced.some((choice) => choice.id === 'correct' && choice.isCorrect), 'expected correct option to remain');

  const unchanged = reduceChoicesForRetryScaffold(choices, 0);
  assert.equal(unchanged.length, choices.length);
});
