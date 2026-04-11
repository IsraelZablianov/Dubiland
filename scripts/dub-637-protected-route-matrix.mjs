#!/usr/bin/env node
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const DEFAULT_ROUTES = [
  '/games',
  '/profiles',
  '/parent',
  '/games/reading/interactive-handbook',
];

const DEFAULT_PROFILES = ['guest_shell', 'anonymous_redirect', 'authenticated'];

const ROUTE_BUDGETS = {
  '/games': {
    lcp_ms: 2500,
    fcp_ms: 1800,
    max_long_task_ms: 200,
    total_transfer_bytes: 230000,
  },
  '/profiles': {
    lcp_ms: 2500,
    fcp_ms: 1800,
    max_long_task_ms: 200,
    total_transfer_bytes: 220000,
  },
  '/parent': {
    lcp_ms: 2500,
    fcp_ms: 1800,
    max_long_task_ms: 200,
    total_transfer_bytes: 230000,
  },
  '/games/reading/interactive-handbook': {
    lcp_ms: 2500,
    fcp_ms: 1800,
    max_long_task_ms: 200,
    total_transfer_bytes: 240000,
  },
};

const DEFAULT_BASELINE = path.resolve(
  'docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json',
);
const ENFORCED_NODE_ENV = 'production';

function withProductionNodeEnv(env = process.env) {
  return {
    ...env,
    NODE_ENV: ENFORCED_NODE_ENV,
  };
}

function parseArgs(argv) {
  const args = {
    outDir: null,
    baseUrl: 'http://127.0.0.1:4196',
    previewPort: 4196,
    skipBuild: false,
    profiles: [...DEFAULT_PROFILES],
    routes: [...DEFAULT_ROUTES],
    baselinePath: DEFAULT_BASELINE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--out-dir') {
      args.outDir = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === '--base-url') {
      args.baseUrl = argv[index + 1] ?? args.baseUrl;
      index += 1;
      continue;
    }

    if (token === '--preview-port') {
      args.previewPort = Number.parseInt(argv[index + 1] ?? '', 10) || args.previewPort;
      index += 1;
      continue;
    }

    if (token === '--skip-build') {
      args.skipBuild = true;
      continue;
    }

    if (token === '--profiles') {
      const raw = argv[index + 1] ?? '';
      args.profiles = raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (token === '--routes') {
      const raw = argv[index + 1] ?? '';
      args.routes = raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (token === '--baseline') {
      args.baselinePath = path.resolve(argv[index + 1] ?? '');
      index += 1;
    }
  }

  if (!args.outDir) {
    throw new Error('Missing required flag: --out-dir <directory>');
  }

  args.outDir = path.resolve(args.outDir);
  return args;
}

function formatCommand(program, cmdArgs) {
  return `${program} ${cmdArgs.map((part) => JSON.stringify(part)).join(' ')}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoggedCommand(program, cmdArgs, options) {
  const { cwd, env = withProductionNodeEnv(process.env), logPath } = options;
  await fsp.mkdir(path.dirname(logPath), { recursive: true });
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  logStream.write(`$ ${formatCommand(program, cmdArgs)}\n`);

  await new Promise((resolve, reject) => {
    const child = spawn(program, cmdArgs, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      logStream.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      logStream.write(chunk);
    });

    child.on('error', (error) => {
      logStream.end();
      reject(error);
    });

    child.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${program} exited with code ${code}`));
      }
    });
  });
}

async function startPreviewServer({ port, cwd, logPath }) {
  await fsp.mkdir(path.dirname(logPath), { recursive: true });
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  const args = ['workspace', '@dubiland/web', 'preview', '--host', '127.0.0.1', '--port', String(port)];
  logStream.write(`$ yarn ${args.map((part) => JSON.stringify(part)).join(' ')}\n`);

  const child = spawn('yarn', args, {
    cwd,
    env: withProductionNodeEnv(process.env),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => logStream.write(chunk));
  child.stderr.on('data', (chunk) => logStream.write(chunk));

  return { child, logStream };
}

async function stopPreviewServer(preview) {
  const { child, logStream } = preview;

  await new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }

    child.once('close', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 2500);
  });

  logStream.end();
}

async function waitForUrl(url, timeoutMs = 45000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for preview URL: ${url}`);
}

function deriveSupabaseStorageKey() {
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? '';
  if (!projectRef) {
    return null;
  }
  return `sb-${projectRef}-auth-token`;
}

async function resetBrowserStorage(page) {
  await page.evaluate(async () => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }

    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
    } catch {
      // ignore
    }

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch {
      // ignore
    }

    try {
      if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases
            .map((db) => db.name)
            .filter((name) => typeof name === 'string' && name.length > 0)
            .map(
              (name) =>
                new Promise((resolve) => {
                  try {
                    const request = indexedDB.deleteDatabase(name);
                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                    request.onblocked = () => resolve();
                  } catch {
                    resolve();
                  }
                }),
            ),
        );
      }
    } catch {
      // ignore
    }
  });
}

async function hasSupabaseSessionHint(page) {
  return page.evaluate(() => {
    try {
      const keys = Object.keys(window.localStorage);
      return keys.some((key) => key.startsWith('sb-') && key.endsWith('-auth-token') && Boolean(window.localStorage.getItem(key)));
    } catch {
      return false;
    }
  });
}

async function prepareAuthenticatedSession(page, baseUrl, profileLogs) {
  const email = process.env.DUBILAND_PERF_EMAIL;
  const password = process.env.DUBILAND_PERF_PASSWORD;
  const storageKey = deriveSupabaseStorageKey();

  if (!email || !password || !storageKey) {
    profileLogs.push('authenticated profile skipped: missing DUBILAND_PERF_EMAIL/DUBILAND_PERF_PASSWORD or SUPABASE_PROJECT_REF');
    return { status: 'skipped', reason: 'missing_credentials' };
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.login-page__content', { timeout: 8000 }).catch(() => null);

  let emailInput = await page.$('form input[type="email"]');
  if (!emailInput) {
    const toggleIndex = await page.$$eval('.login-page__content button[type="button"]', (buttons) => {
      const labeledIndex = buttons.findIndex((button) => /email|e-mail|אימייל/i.test(button.textContent ?? ''));
      if (labeledIndex >= 0) {
        return labeledIndex;
      }
      return buttons.length > 0 ? buttons.length - 1 : -1;
    }).catch(() => -1);

    if (toggleIndex >= 0) {
      const candidateButtons = await page.$$('.login-page__content button[type="button"]');
      const toggleButton = candidateButtons[toggleIndex];
      if (toggleButton) {
        await toggleButton.click();
        await page.waitForSelector('form input[type="email"]', { timeout: 3000 }).catch(() => null);
      }
    } else {
      await sleep(250);
    }

    emailInput = await page.$('form input[type="email"]');
    if (emailInput) {
      profileLogs.push('authenticated profile: email form opened for credential entry');
    } else {
      const currentPath = await page.evaluate(() => window.location.pathname).catch(() => 'unknown');
      profileLogs.push(`authenticated profile: email form still missing on path "${currentPath}"`);
    }

    if (!emailInput) {
      emailInput = await page.$('form input[type="email"]');
    }
  }

  if (!emailInput) {
    profileLogs.push('authenticated profile failed: email form not found on /login');
    return { status: 'error', reason: 'email_form_not_found' };
  }

  await page.focus('form input[type="email"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('form input[type="email"]', email, { delay: 12 });

  await page.focus('form input[type="password"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('form input[type="password"]', password, { delay: 12 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 9000 }).catch(() => null),
    page.click('form button[type="submit"]'),
  ]);

  await sleep(800);

  let hasSession = await hasSupabaseSessionHint(page);
  if (!hasSession) {
    profileLogs.push('authenticated sign-in did not create session hint; attempting sign-up then sign-in retry');

    const toggleButtons = await page.$$('form button[type="button"]');
    if (toggleButtons.length > 0) {
      await toggleButtons[toggleButtons.length - 1].click();
      await sleep(250);
      await page.click('form button[type="submit"]');
      await sleep(900);

      const toggleButtonsBack = await page.$$('form button[type="button"]');
      if (toggleButtonsBack.length > 0) {
        await toggleButtonsBack[toggleButtonsBack.length - 1].click();
        await sleep(250);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 9000 }).catch(() => null),
          page.click('form button[type="submit"]'),
        ]);
        await sleep(800);
        hasSession = await hasSupabaseSessionHint(page);
      }
    }
  }

  if (!hasSession) {
    profileLogs.push('authenticated profile skipped: login/signup flow did not produce a persisted supabase session');
    return { status: 'skipped', reason: 'login_failed' };
  }

  profileLogs.push('authenticated profile prepared: persisted Supabase session detected');
  return { status: 'ready' };
}

async function prepareProfileState({ profile, route, baseUrl, userDataDir }) {
  const profileLogs = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await resetBrowserStorage(page);

    if (profile === 'guest_shell') {
      await page.evaluate(() => {
        window.localStorage.setItem('dubiland:guest-mode', 'true');
        window.localStorage.setItem(
          'dubiland:active-child',
          JSON.stringify({ id: 'guest', name: 'Guest', emoji: '\ud83e\uddd2', ageBand: '5-6' }),
        );
      });
      profileLogs.push('guest_shell profile prepared: guest mode enabled with active child seed');
      return { status: 'ready', logs: profileLogs, extra: {} };
    }

    if (profile === 'anonymous_redirect') {
      await page.evaluate(() => {
        window.localStorage.removeItem('dubiland:guest-mode');
        window.localStorage.removeItem('dubiland:active-child');
      });

      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await sleep(8000);
      const resolvedHref = await page.evaluate(() => window.location.href);
      const resolvedPath = await page.evaluate(() => window.location.pathname);

      profileLogs.push('anonymous_redirect profile prepared: guest/session hints removed');
      return {
        status: 'ready',
        logs: profileLogs,
        extra: {
          anonymous_resolved_href: resolvedHref,
          anonymous_resolved_path: resolvedPath,
        },
      };
    }

    if (profile === 'authenticated') {
      const result = await prepareAuthenticatedSession(page, baseUrl, profileLogs);
      return { ...result, logs: profileLogs, extra: {} };
    }

    return {
      status: 'error',
      reason: `unsupported_profile:${profile}`,
      logs: profileLogs,
      extra: {},
    };
  } finally {
    await browser.close();
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sumTransferBytes(networkItems) {
  return networkItems.reduce((sum, item) => {
    const transferSize = Number(item.transferSize ?? 0);
    return sum + (Number.isFinite(transferSize) ? transferSize : 0);
  }, 0);
}

function maxLongTaskMs(longTasks) {
  return longTasks.reduce((max, task) => {
    const duration = Number(task.duration ?? 0);
    return Math.max(max, Number.isFinite(duration) ? duration : 0);
  }, 0);
}

function routeAlias(route) {
  if (route === '/games/reading/interactive-handbook') return 'handbook';
  if (route === '/games') return 'games';
  if (route === '/profiles') return 'profiles';
  if (route === '/parent') return 'parent';
  return route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function extractResult({ profile, route, lhPath, prepStatus }) {
  if (prepStatus.status !== 'ready') {
    return {
      profile,
      path: route,
      status: prepStatus.status,
      reason: prepStatus.reason ?? null,
      metadata: {
        auth_profile: profile,
        cache_mode: 'cold',
        route_entry_mode: 'direct_document_navigation',
      },
      notes: prepStatus.logs ?? [],
      ...(prepStatus.extra ?? {}),
    };
  }

  const json = readJson(lhPath);
  const audits = json.audits ?? {};
  const networkItems = audits['network-requests']?.details?.items ?? [];
  const longTasks = audits['long-tasks']?.details?.items ?? [];

  const totalByteWeight = Number(audits['total-byte-weight']?.numericValue);
  const totalTransferBytes = Number.isFinite(totalByteWeight)
    ? totalByteWeight
    : sumTransferBytes(networkItems);

  const finalUrl = typeof json.finalUrl === 'string' ? json.finalUrl : null;

  return {
    profile,
    path: route,
    status: 'ok',
    performance: Math.round(Number((json.categories?.performance?.score ?? 0) * 100)),
    fcp_ms: Number(audits['first-contentful-paint']?.numericValue ?? 0),
    lcp_ms: Number(audits['largest-contentful-paint']?.numericValue ?? 0),
    tbt_ms: Number(audits['total-blocking-time']?.numericValue ?? 0),
    cls: Number(audits['cumulative-layout-shift']?.numericValue ?? 0),
    speed_index_ms: Number(audits['speed-index']?.numericValue ?? 0),
    max_potential_fid_ms: Number(audits['max-potential-fid']?.numericValue ?? 0),
    max_long_task_ms: maxLongTaskMs(longTasks),
    total_transfer_bytes: totalTransferBytes,
    login_chunk_requested: networkItems.some((item) => /\/assets\/login-[^/]+\.js$/i.test(String(item.url ?? ''))),
    supabase_chunk_requested: networkItems.some((item) => /\/assets\/supabase-[^/]+\.js$/i.test(String(item.url ?? ''))),
    final_url: finalUrl,
    metadata: {
      auth_profile: profile,
      cache_mode: 'cold',
      route_entry_mode: 'direct_document_navigation',
    },
    notes: prepStatus.logs ?? [],
    ...(prepStatus.extra ?? {}),
  };
}

function evaluateGuestOrAuthenticatedBudget(result) {
  const budget = ROUTE_BUDGETS[result.path];
  if (!budget) {
    return { pass: false, checks: { missing_budget: false } };
  }

  const checks = {
    lcp_ms: result.lcp_ms <= budget.lcp_ms,
    fcp_ms: result.fcp_ms <= budget.fcp_ms,
    max_long_task_ms: result.max_long_task_ms <= budget.max_long_task_ms,
    total_transfer_bytes: result.total_transfer_bytes <= budget.total_transfer_bytes,
    login_chunk_requested: result.login_chunk_requested === false,
    supabase_chunk_requested: result.supabase_chunk_requested === false,
  };

  return {
    pass: Object.values(checks).every(Boolean),
    checks,
  };
}

function evaluateAnonymousRedirectBudget(result) {
  const finalPath = result.final_url ? new URL(result.final_url).pathname : null;
  const resolvedPath = typeof result.anonymous_resolved_path === 'string'
    ? result.anonymous_resolved_path
    : null;
  const checks = {
    redirects_to_login: (resolvedPath ?? finalPath) === '/login',
  };

  return {
    pass: Object.values(checks).every(Boolean),
    checks: {
      ...checks,
      redirect_probe_source: resolvedPath ? 'browser_probe' : 'lighthouse_final_url',
    },
  };
}

function buildBudgetSummary(results) {
  const byProfile = {
    guest_shell: [],
    anonymous_redirect: [],
    authenticated: [],
  };

  for (const result of results) {
    if (result.profile in byProfile) {
      byProfile[result.profile].push(result);
    }
  }

  const evaluations = [];

  for (const [profile, profileResults] of Object.entries(byProfile)) {
    for (const result of profileResults) {
      if (result.status !== 'ok') {
        evaluations.push({
          profile,
          path: result.path,
          status: result.status,
          reason: result.reason ?? null,
          pass: null,
          checks: {},
        });
        continue;
      }

      const evaluation = profile === 'anonymous_redirect'
        ? evaluateAnonymousRedirectBudget(result)
        : evaluateGuestOrAuthenticatedBudget(result);

      evaluations.push({
        profile,
        path: result.path,
        status: result.status,
        reason: null,
        pass: evaluation.pass,
        checks: evaluation.checks,
      });
    }
  }

  const failed = evaluations.filter((item) => item.pass === false);
  const skipped = evaluations.filter((item) => item.status === 'skipped');
  const hardErrors = evaluations.filter((item) => item.status === 'error');
  const pass = failed.length === 0 && hardErrors.length === 0;

  return {
    pass,
    evaluations,
    failed,
    skipped,
    hardErrors,
  };
}

function loadBaselineRoutes(baselinePath) {
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    return { baselinePath, routes: [] };
  }

  const raw = readJson(baselinePath);
  const routes = Array.isArray(raw.routes)
    ? raw.routes.filter((route) => typeof route?.path === 'string')
    : [];

  return { baselinePath, routes };
}

function buildPrePostDelta({ baselineRoutes, currentResults }) {
  const currentGuest = currentResults.filter((result) => result.profile === 'guest_shell' && result.status === 'ok');

  const baselineByPath = new Map(
    baselineRoutes.map((route) => [route.path, route]),
  );

  const deltas = currentGuest.map((current) => {
    const baseline = baselineByPath.get(current.path);
    if (!baseline) {
      return {
        path: current.path,
        baseline_present: false,
      };
    }

    const numericDelta = (value, previous) => {
      const nextValue = Number(value ?? 0);
      const prevValue = Number(previous ?? 0);
      if (!Number.isFinite(nextValue) || !Number.isFinite(prevValue)) {
        return null;
      }
      return Number((nextValue - prevValue).toFixed(3));
    };

    return {
      path: current.path,
      baseline_present: true,
      performance_delta: numericDelta(current.performance, baseline.performance),
      fcp_ms_delta: numericDelta(current.fcp_ms, baseline.fcp_ms),
      lcp_ms_delta: numericDelta(current.lcp_ms, baseline.lcp_ms),
      max_long_task_ms_delta: numericDelta(current.max_long_task_ms, baseline.max_long_task_ms),
      total_transfer_bytes_delta: numericDelta(current.total_transfer_bytes, baseline.total_transfer_bytes),
      login_chunk_requested_before: Boolean(baseline.login_chunk_requested),
      login_chunk_requested_after: Boolean(current.login_chunk_requested),
      supabase_chunk_requested_before: Boolean(baseline.supabase_chunk_requested),
      supabase_chunk_requested_after: Boolean(current.supabase_chunk_requested),
    };
  });

  return {
    compared_profile: 'guest_shell',
    deltas,
  };
}

function buildMarkdownSummary({ args, matrix, budgetSummary, prePostDelta }) {
  const lines = [];

  lines.push('# DUB-637 Protected Route Matrix Summary');
  lines.push('');
  lines.push(`- Generated: ${matrix.generated_at}`);
  lines.push(`- Base URL: ${args.baseUrl}`);
  lines.push(`- Cache mode: cold`);
  lines.push(`- Route entry mode: direct document navigation`);
  lines.push('');

  for (const profile of args.profiles) {
    lines.push(`## Profile: ${profile}`);
    lines.push('');
    lines.push('| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |');
    lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |');

    const profileResults = matrix.results.filter((result) => result.profile === profile);
    for (const result of profileResults) {
      if (result.status !== 'ok') {
        lines.push(`| ${result.path} | ${result.status}${result.reason ? ` (${result.reason})` : ''} | - | - | - | - | - | - | - | - |`);
        continue;
      }

      lines.push(
        `| ${result.path} | ok | ${result.performance} | ${Math.round(result.fcp_ms)} | ${Math.round(result.lcp_ms)} | ${Math.round(result.max_long_task_ms)} | ${Math.round(result.total_transfer_bytes)} | ${result.login_chunk_requested} | ${result.supabase_chunk_requested} | ${result.final_url ?? '-'} |`,
      );
    }

    lines.push('');
  }

  lines.push('## Budget Verdict');
  lines.push('');
  lines.push(`- Overall pass: ${budgetSummary.pass}`);
  lines.push(`- Failed checks: ${budgetSummary.failed.length}`);
  lines.push(`- Skipped checks: ${budgetSummary.skipped.length}`);
  lines.push('');

  if (budgetSummary.failed.length > 0) {
    lines.push('### Failed checks');
    lines.push('');
    for (const failure of budgetSummary.failed) {
      const failedKeys = Object.entries(failure.checks)
        .filter(([, passed]) => passed === false)
        .map(([key]) => key)
        .join(', ');
      lines.push(`- ${failure.profile} ${failure.path}: ${failedKeys}`);
    }
    lines.push('');
  }

  lines.push('## Pre/Post Delta (Guest Profile)');
  lines.push('');
  lines.push(`- Baseline source: ${matrix.baseline_source ?? 'none'}`);
  lines.push('');
  lines.push('| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |');
  lines.push('| --- | ---: | ---: | ---: | ---: | --- | --- |');

  for (const delta of prePostDelta.deltas) {
    if (!delta.baseline_present) {
      lines.push(`| ${delta.path} | n/a | n/a | n/a | n/a | n/a | n/a |`);
      continue;
    }

    lines.push(
      `| ${delta.path} | ${delta.lcp_ms_delta} | ${delta.fcp_ms_delta} | ${delta.max_long_task_ms_delta} | ${delta.total_transfer_bytes_delta} | ${delta.login_chunk_requested_before} -> ${delta.login_chunk_requested_after} | ${delta.supabase_chunk_requested_before} -> ${delta.supabase_chunk_requested_after} |`,
    );
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rootDir = path.resolve('.');
  const lighthouseDir = path.join(args.outDir, 'lighthouse');
  await fsp.mkdir(lighthouseDir, { recursive: true });

  if (!args.skipBuild) {
    await runLoggedCommand('yarn', ['workspace', '@dubiland/web', 'build'], {
      cwd: rootDir,
      logPath: path.join(args.outDir, 'build.log'),
    });
  }

  await runLoggedCommand('node', ['packages/web/scripts/assert-production-react-runtime.mjs'], {
    cwd: rootDir,
    logPath: path.join(args.outDir, 'runtime-guard.log'),
  });

  const preview = await startPreviewServer({
    port: args.previewPort,
    cwd: rootDir,
    logPath: path.join(args.outDir, 'preview.log'),
  });

  const results = [];

  try {
    await waitForUrl(args.baseUrl, 60000);

    for (const profile of args.profiles) {
      for (const route of args.routes) {
        const alias = routeAlias(route);
        const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), `dub637-${profile}-${alias}-`));
        const profilePrep = await prepareProfileState({
          profile,
          route,
          baseUrl: args.baseUrl,
          userDataDir,
        });

        const profileLighthouseDir = path.join(lighthouseDir, profile);
        await fsp.mkdir(profileLighthouseDir, { recursive: true });
        const lhPath = path.join(profileLighthouseDir, `${alias}.json`);

        if (profilePrep.status === 'ready') {
          await runLoggedCommand(
            'npx',
            [
              'lighthouse',
              `${args.baseUrl}${route}`,
              '--quiet',
              '--disable-storage-reset',
              '--only-categories=performance',
              '--preset=perf',
              '--output=json',
              `--output-path=${lhPath}`,
              `--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --user-data-dir=${userDataDir}`,
            ],
            {
              cwd: rootDir,
              logPath: path.join(args.outDir, 'lighthouse.log'),
            },
          );
        }

        const result = extractResult({
          profile,
          route,
          lhPath,
          prepStatus: profilePrep,
        });

        results.push(result);

        await fsp.rm(userDataDir, { recursive: true, force: true });
      }
    }
  } finally {
    await stopPreviewServer(preview);
  }

  const baseline = loadBaselineRoutes(args.baselinePath);
  const prePostDelta = buildPrePostDelta({
    baselineRoutes: baseline.routes,
    currentResults: results,
  });

  const budgetSummary = buildBudgetSummary(results);

  const matrix = {
    generated_at: new Date().toISOString(),
    tool: 'scripts/dub-637-protected-route-matrix.mjs',
    base_url: args.baseUrl,
    cache_mode: 'cold',
    route_entry_mode: 'direct_document_navigation',
    profiles: args.profiles,
    routes: args.routes,
    baseline_source: fs.existsSync(args.baselinePath) ? args.baselinePath : null,
    results,
  };

  await fsp.writeFile(
    path.join(args.outDir, 'matrix.json'),
    JSON.stringify(matrix, null, 2),
  );

  await fsp.writeFile(
    path.join(args.outDir, 'budget-verdict.json'),
    JSON.stringify(budgetSummary, null, 2),
  );

  await fsp.writeFile(
    path.join(args.outDir, 'pre-post-delta.json'),
    JSON.stringify(prePostDelta, null, 2),
  );

  const summaryMarkdown = buildMarkdownSummary({
    args,
    matrix,
    budgetSummary,
    prePostDelta,
  });

  await fsp.writeFile(path.join(args.outDir, 'summary.md'), summaryMarkdown);

  process.stdout.write(`Matrix written to ${args.outDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
