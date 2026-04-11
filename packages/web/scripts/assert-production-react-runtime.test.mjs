import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const guardScriptPath = path.resolve(scriptDir, 'assert-production-react-runtime.mjs');

async function runGuard(distDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [guardScriptPath, '--dist', distDir], {
      cwd: webRoot,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function createDistFixture(files) {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'dubiland-prod-runtime-'));
  const assetsDirectory = path.join(distDir, 'assets');
  await mkdir(assetsDirectory, { recursive: true });

  for (const [fileName, source] of Object.entries(files)) {
    await writeFile(path.join(assetsDirectory, fileName), source, 'utf8');
  }

  return distDir;
}

test('passes when dist assets have no dev-runtime signatures', async (t) => {
  const distDir = await createDistFixture({
    'index-clean.js': 'export const runtime = "production";\n',
  });
  t.after(async () => {
    await rm(distDir, { recursive: true, force: true });
  });

  const result = await runGuard(distDir);

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Production runtime guard passed:/);
});

test('fails when dist assets contain jsxDEV signatures', async (t) => {
  const distDir = await createDistFixture({
    'index-leaky.js': 'const leak = jsxDEV("div", {}, void 0, false, { fileName: "leak.tsx" }, this);\n',
  });
  t.after(async () => {
    await rm(distDir, { recursive: true, force: true });
  });

  const result = await runGuard(distDir);

  assert.notEqual(result.code, 0, 'Expected runtime guard to fail for jsxDEV leakage');
  assert.match(result.stderr, /Production runtime guard failed:/);
  assert.match(result.stderr, /Found jsxDEV references in emitted bundle code/);
});

test('fails when dist assets directory is missing', async (t) => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'dubiland-prod-runtime-missing-'));
  t.after(async () => {
    await rm(distDir, { recursive: true, force: true });
  });

  const result = await runGuard(distDir);

  assert.notEqual(result.code, 0, 'Expected runtime guard to fail when dist/assets is absent');
  assert.match(result.stderr, /Missing dist assets directory:/);
});
