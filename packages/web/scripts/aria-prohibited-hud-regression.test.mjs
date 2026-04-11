import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const hudChecks = [
  {
    file: 'src/games/colors/ColorGardenGame.tsx',
    prohibitedClassNames: ['color-garden__progress', 'color-garden__stars'],
  },
  {
    file: 'src/games/numbers/ShapeSafariGame.tsx',
    prohibitedClassNames: ['shape-safari__progress'],
  },
  {
    file: 'src/games/numbers/CountingPicnicGame.tsx',
    prohibitedClassNames: ['counting-picnic__round-progress', 'counting-picnic__score-pill', 'counting-picnic__stars'],
  },
  {
    file: 'src/games/numbers/MoreOrLessMarketGame.tsx',
    prohibitedClassNames: ['more-less-market__progress', 'more-less-market__score-pill'],
  },
  {
    file: 'src/games/numbers/NumberLineJumpsGame.tsx',
    prohibitedClassNames: ['number-line-jumps__progress'],
  },
  {
    file: 'src/games/letters/LetterSoundMatchGame.tsx',
    prohibitedClassNames: ['letter-sound-match__progress', 'letter-sound-match__metric-pill', 'letter-sound-match__stamps'],
  },
  {
    file: 'src/games/letters/LetterTracingTrailGame.tsx',
    prohibitedClassNames: ['letter-tracing-trail__progress', 'letter-tracing-trail__metric-pill', 'letter-tracing-trail__stars'],
  },
  {
    file: 'src/games/letters/LetterSkyCatcherGame.tsx',
    prohibitedClassNames: ['letter-sky-catcher__progress'],
  },
  {
    file: 'src/games/reading/LetterStorybookGame.tsx',
    prohibitedClassNames: ['letter-storybook__progress-row'],
  },
];

for (const check of hudChecks) {
  test(`DUB-736: ${check.file} should not put aria-label on HUD div/span wrappers`, async () => {
    const source = await readFile(path.join(webRoot, check.file), 'utf8');

    for (const className of check.prohibitedClassNames) {
      const prohibitedPattern = new RegExp(
        `<(?:div|span)\\b[^>]*className="[^"]*${className}[^"]*"[^>]*aria-label=`,
      );

      assert.equal(
        prohibitedPattern.test(source),
        false,
        `Expected ${check.file} to avoid aria-label on ${className} wrappers`,
      );
    }
  });
}
