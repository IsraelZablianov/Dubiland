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

function extractCssPxToken(source, tokenName) {
  const escapedToken = tokenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedToken}:\\s*(\\d+)px;`));
  assert.ok(match, `Missing CSS token: ${tokenName}`);

  const value = Number.parseInt(match[1], 10);
  assert.ok(Number.isFinite(value), `Invalid CSS token value: ${tokenName}`);
  return value;
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

function extractKeyframesBlock(source, keyframeName) {
  const keyframesAnchor = `@keyframes ${keyframeName} {`;
  const keyframesIndex = source.indexOf(keyframesAnchor);
  assert.notEqual(keyframesIndex, -1, `Missing keyframes block: ${keyframeName}`);

  const blockStart = source.indexOf('{', keyframesIndex);
  assert.notEqual(blockStart, -1, `Missing opening brace for keyframes: ${keyframeName}`);

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

  assert.equal(depth, 0, `Unterminated keyframes block: ${keyframeName}`);
  return source.slice(blockStart + 1, cursor - 1);
}

test('touch token floor aliases remain defined', () => {
  const tokens = read('src/components/design-system/tokens.css');
  const secondaryFloor = extractCssPxToken(tokens, '--touch-min-secondary');
  const primaryFloor = extractCssPxToken(tokens, '--touch-min-primary');

  assert.ok(secondaryFloor >= 48, `Expected --touch-min-secondary to be at least 48px, got ${secondaryFloor}px`);
  assert.ok(primaryFloor >= 60, `Expected --touch-min-primary to be at least 60px, got ${primaryFloor}px`);
});

test('public header shell keeps touch-floor contract', () => {
  const headerSource = read('src/components/layout/PublicHeader.tsx');
  const logoBlock = extractCssBlock(headerSource, '.public-header__logo');
  const navLinkBlock = extractCssBlock(headerSource, '.public-header__nav-link');
  const ctaRowBlock = extractCssBlock(headerSource, '.public-header__public-actions');

  assert.match(
    logoBlock,
    /min-inline-size:\s*var\(--(?:public-header-logo-touch-min|touch-min-primary)\);/,
    'Public header logo must keep primary inline floor',
  );
  assert.match(
    logoBlock,
    /min-block-size:\s*var\(--(?:public-header-logo-touch-min|touch-min-primary)\);/,
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

test('app shell route transition avoids horizontal overflow bounce', () => {
  const globalCss = read('src/styles/global.css');
  const appShellBlock = extractCssBlock(globalCss, '.animated-page--shell-app');
  const appShellKeyframes = extractKeyframesBlock(globalCss, 'dubi-page-enter-block');

  assert.match(
    appShellBlock,
    /animation-name:\s*dubi-page-enter-block;/,
    'App shell should use dedicated block-axis enter keyframes',
  );
  assert.match(
    appShellBlock,
    /overflow-x:\s*clip;/,
    'App shell should clip horizontal overflow during transition',
  );
  assert.doesNotMatch(
    appShellKeyframes,
    /translateX\(/,
    'App shell keyframes must avoid translateX to prevent transient scroll width growth',
  );
});

test('child route scaffold avoids nested main landmarks in app shells', () => {
  const source = read('src/components/layout/ChildRouteLayout.tsx');

  assert.doesNotMatch(
    source,
    /<main\b/,
    'ChildRouteScaffold should not render a main landmark because app shells already render main',
  );
  assert.match(
    source,
    /<div\b/,
    'ChildRouteScaffold should use a neutral container element',
  );
});
