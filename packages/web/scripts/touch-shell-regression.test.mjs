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

function extractCssBlock(source, selector) {
  const selectorAnchor = `${selector} {`;
  const selectorIndex = source.indexOf(selectorAnchor);
  assert.notEqual(selectorIndex, -1, `Missing CSS selector: ${selector}`);

  const blockStart = source.indexOf('{', selectorIndex);
  assert.notEqual(blockStart, -1, `Missing opening brace for selector: ${selector}`);

  let depth = 1;
  let cursor = blockStart + 1;

  while (cursor < source.length && depth > 0) {
    const char = source[cursor];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }
    cursor += 1;
  }

  assert.equal(depth, 0, `Unterminated CSS block for selector: ${selector}`);
  return source.slice(blockStart + 1, cursor - 1);
}

test('touch token floor aliases remain defined', () => {
  const tokens = read('src/components/design-system/tokens.css');
  assert.match(tokens, /--touch-min-secondary:\s*44px;/, 'Expected --touch-min-secondary floor token');
  assert.match(tokens, /--touch-min-primary:\s*60px;/, 'Expected --touch-min-primary floor token');
});

test('public header shell keeps touch-floor contract', () => {
  const headerSource = read('src/components/layout/PublicHeader.tsx');
  const logoBlock = extractCssBlock(headerSource, '.public-header__logo');
  const navLinkBlock = extractCssBlock(headerSource, '.public-header__nav-link');
  const ctaRowBlock = extractCssBlock(headerSource, '.public-header__public-actions');

  assert.match(
    logoBlock,
    /min-inline-size:\s*var\(--touch-min-primary\);/,
    'Public header logo must keep primary inline floor',
  );
  assert.match(
    logoBlock,
    /min-block-size:\s*var\(--touch-min-primary\);/,
    'Public header logo must keep primary block floor',
  );
  assert.match(
    navLinkBlock,
    /min-block-size:\s*max\(var\(--touch-min-secondary\),\s*var\(--touch-min\)\);/,
    'Public header nav links must keep secondary floor',
  );
  assert.match(
    ctaRowBlock,
    /gap:\s*max\(12px,\s*var\(--space-sm\)\);/,
    'Public header CTA spacing must stay at least 12px',
  );
});

test('public footer shell keeps touch-floor contract', () => {
  const footerSource = read('src/components/layout/PublicFooter.tsx');
  const logoBlock = extractCssBlock(footerSource, '.public-footer__logo');
  const linksBlock = extractCssBlock(footerSource, '.public-footer__links a');

  assert.match(
    logoBlock,
    /min-block-size:\s*var\(--touch-min-secondary\);/,
    'Public footer logo must keep secondary floor',
  );
  assert.match(
    linksBlock,
    /min-block-size:\s*var\(--touch-min-secondary\);/,
    'Public footer links must keep secondary floor',
  );
});
