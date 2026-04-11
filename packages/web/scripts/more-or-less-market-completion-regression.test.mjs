import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const WEB_ROOT = resolve(SCRIPT_DIR, '..');

function read(relativePath) {
  return readFileSync(resolve(WEB_ROOT, relativePath), 'utf8');
}

test('DUB-723: MoreOrLessMarket page does not render duplicate completion summary metrics', () => {
  const source = read('src/pages/MoreOrLessMarket.tsx');

  assert.doesNotMatch(
    source,
    /parentDashboard\.games\.moreOrLessMarket\.progressSummary/,
    'Page-level completion summary copy should not be rendered when game owns the summary view',
  );
});

test('DUB-723: MoreOrLessMarket page still exposes retry affordance for sync errors', () => {
  const source = read('src/pages/MoreOrLessMarket.tsx');

  assert.match(source, /syncState === 'error'/, 'Expected an explicit sync error branch');
  assert.match(source, /onClick=\{retryLastSync\}/, 'Expected retry button to call retryLastSync');
});
