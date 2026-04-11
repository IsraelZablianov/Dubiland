import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const commonPath = path.join(root, 'packages/web/src/i18n/locales/he/common.json');
const manifestPath = path.join(root, 'packages/web/public/audio/he/manifest.json');
const scenesPath = path.join(root, 'packages/web/src/games/reading/letterStoryV2IllustrationManifest.ts');

const common = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const scenesSource = fs.readFileSync(scenesPath, 'utf8');

const letterMatches = scenesSource.matchAll(/letterId:\s*'([a-z]+)'/g);
const letterIds = [...new Set(Array.from(letterMatches, (match) => match[1]))];

const baseKeys = [
  'games.letterStorybook.instructions.intro',
  'games.letterStorybook.instructions.tapReplay',
  'games.letterStorybook.instructions.tapRetry',
  'games.letterStorybook.instructions.tapHint',
  'games.letterStorybook.instructions.matchAssociation',
  'games.letterStorybook.controls.replay',
  'games.letterStorybook.controls.retry',
  'games.letterStorybook.controls.hint',
  'games.letterStorybook.controls.next',
  'games.letterStorybook.controls.iconCueHint',
  'games.letterStorybook.controls.iconCueNext',
  'games.letterStorybook.controls.iconCueReplay',
  'games.letterStorybook.controls.iconCueRetry',
  'games.letterStorybook.transitions.checkpoint',
  'games.letterStorybook.transitions.celebration',
  'games.letterStorybook.transitions.nextLetter',
  'games.letterStorybook.guards.rapidTapPause',
  'games.letterStorybook.guards.rapidTapReset',
  'games.letterStorybook.feedback.encouragement.v1',
  'games.letterStorybook.feedback.success.v2',
  'games.letterStorybook.feedback.success.v3',
  'games.letterStorybook.completion.title',
  'games.letterStorybook.completion.summary',
  'games.letterStorybook.checkpoints.one.cueNoImage',
  'games.letterStorybook.checkpoints.one.intro',
  'games.letterStorybook.checkpoints.one.prompt',
  'games.letterStorybook.checkpoints.one.retry',
  'games.letterStorybook.checkpoints.one.success',
  'games.letterStorybook.checkpoints.one.hint1',
  'games.letterStorybook.checkpoints.one.hint2',
  'games.letterStorybook.checkpoints.two.intro',
  'games.letterStorybook.checkpoints.two.prompt',
  'games.letterStorybook.checkpoints.two.retry',
  'games.letterStorybook.checkpoints.two.success',
  'games.letterStorybook.checkpoints.two.hint1',
  'games.letterStorybook.checkpoints.two.hint2',
  'games.letterStorybook.checkpoints.three.intro',
  'games.letterStorybook.checkpoints.three.prompt',
  'games.letterStorybook.checkpoints.three.retry',
  'games.letterStorybook.checkpoints.three.success',
  'games.letterStorybook.checkpoints.three.hint1',
  'games.letterStorybook.checkpoints.three.hint2',
  'parentDashboard.games.letterStorybook.progressSummary',
  'parentDashboard.games.letterStorybook.nextStep',
  'parentDashboard.curriculum.trends.improving',
  'parentDashboard.curriculum.trends.steady',
  'parentDashboard.curriculum.trends.needs_support',
];

const generatedKeys = [];
for (const letterId of letterIds) {
  generatedKeys.push(
    `games.letterStorybook.letters.${letterId}.story`,
    `games.letterStorybook.letters.${letterId}.sound`,
    `games.letterStorybook.letters.${letterId}.prompt`,
    `games.letterStorybook.letters.${letterId}.retry`,
    `games.letterStorybook.letters.${letterId}.success`,
    `games.letterStorybook.letters.${letterId}.hint1`,
    `games.letterStorybook.letters.${letterId}.hint2`,
    `games.letterStorybook.letters.${letterId}.symbol`,
    `games.letterStorybook.letters.${letterId}.word`,
    `games.letterStorybook.letters.${letterId}.imageAlt`,
  );
}

const keys = [...new Set([...baseKeys, ...generatedKeys])].sort();

function getNested(obj, dottedKey) {
  return dottedKey.split('.').reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

const missingLocale = [];
const missingAudioManifest = [];
const missingAudioFile = [];

for (const key of keys) {
  const localeValue = getNested(common, key);
  if (typeof localeValue !== 'string') {
    missingLocale.push(key);
  }

  const manifestKey = `common.${key}`;
  const audioPath = manifest[manifestKey];
  if (typeof audioPath !== 'string' || audioPath.length === 0) {
    missingAudioManifest.push(key);
    continue;
  }

  const audioFilePath = path.join(root, 'packages/web/public', audioPath.replace(/^\//, ''));
  if (!fs.existsSync(audioFilePath)) {
    missingAudioFile.push({ key, audioPath });
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  totalKeys: keys.length,
  totalLetters: letterIds.length,
  missingLocaleCount: missingLocale.length,
  missingAudioManifestCount: missingAudioManifest.length,
  missingAudioFileCount: missingAudioFile.length,
  missingLocale,
  missingAudioManifest,
  missingAudioFile,
};

console.log(JSON.stringify(report, null, 2));
