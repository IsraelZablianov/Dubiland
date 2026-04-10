import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHandbookRendererBlocks } from '../src/games/reading/HandbookPageRenderer.tsx';
import {
  buildFallbackRendererBlocks,
  mergeRuntimePageDefinitions,
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

test('runtime interaction overrides align page question and choices with runtime payload', () => {
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
    'handbooks.mikaSoundGarden.interactions.literalChoice.prompt',
    'runtime page question should drive visible prompt key',
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
  assert.equal(targetBlocks.length, 2);
});
