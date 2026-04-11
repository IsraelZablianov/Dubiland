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

test('protected route is split into shell boundary + deferred auth gate', () => {
  const source = read('src/components/ProtectedRoute.tsx');

  assert.match(source, /function\s+ProtectedShellBoundary\s*\(/, 'Expected ProtectedShellBoundary definition');
  assert.match(source, /function\s+AuthBootstrapGate\s*\(/, 'Expected AuthBootstrapGate definition');
  assert.match(source, /requestIdleCallback/, 'Expected deferred auth scheduling via requestIdleCallback');
  assert.match(
    source,
    /if\s*\(!user\)\s*\{\s*return\s*<Navigate\s+to="\/login"\s+replace\s*\/>;\s*\}/s,
    'Expected unauthenticated users to redirect to /login',
  );
});

test('protected-shell migration files no longer statically import supabase runtime', () => {
  const paths = [
    'src/pages/ProfilePicker.tsx',
    'src/pages/ParentDashboard.tsx',
    'src/hooks/useChildProgress.ts',
    'src/lib/catalogRepository.ts',
    'src/lib/gameAttemptPersistence.ts',
  ];

  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(
      source,
      /from\s+['"]@\/lib\/supabase['"]/,
      `Expected no static supabase import in ${path}`,
    );
  }
});
