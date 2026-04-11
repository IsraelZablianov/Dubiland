#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://127.0.0.1:4173',
    routesPath: null,
    outDir: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--base-url') {
      args.baseUrl = argv[i + 1] ?? args.baseUrl;
      i += 1;
    } else if (token === '--routes') {
      args.routesPath = argv[i + 1] ?? args.routesPath;
      i += 1;
    } else if (token === '--out-dir') {
      args.outDir = argv[i + 1] ?? args.outDir;
      i += 1;
    }
  }

  if (!args.routesPath || !args.outDir) {
    throw new Error('Usage: node run-pa11y-route-matrix.mjs --routes <routes.json> --out-dir <dir> [--base-url <url>]');
  }

  return args;
}

function routeToSlug(route) {
  if (route === '/') return 'root';
  return route
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '__')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'route';
}

function buildProtectedActions(baseUrl, route) {
  return [
    `navigate to ${new URL('/login', baseUrl).toString()}`,
    'wait for path to be /login',
    'wait for element .login-page__guest-cta button to be visible',
    'click element .login-page__guest-cta button',
    'wait for path to be /profiles',
    'wait for element footer button:last-child to be visible',
    'click element footer button:last-child',
    'wait for path to be /games',
    `navigate to ${new URL(route, baseUrl).toString()}`,
    `wait for path to be ${route}`,
  ];
}

function runCommand(program, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(program, args, {
      cwd,
      env: process.env,
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

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const routesData = JSON.parse(await fs.readFile(args.routesPath, 'utf8'));

  const allRoutes = [
    ...(routesData.public || []).map((route) => ({ route, routeType: 'public' })),
    ...(routesData.protected || []).map((route) => ({ route, routeType: 'protected' })),
  ];

  const outDir = path.resolve(args.outDir);
  const configDir = path.join(outDir, 'configs');
  const pa11yCiDir = path.join(outDir, 'pa11y-ci');
  const pa11yAxeDir = path.join(outDir, 'pa11y-axe');

  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(pa11yCiDir, { recursive: true });
  await fs.mkdir(pa11yAxeDir, { recursive: true });

  const results = [];

  for (const { route, routeType } of allRoutes) {
    const slug = routeToSlug(route);
    const url = new URL(route, args.baseUrl).toString();
    const actions = routeType === 'protected' ? buildProtectedActions(args.baseUrl, route) : undefined;

    const pa11yCiConfig = {
      defaults: {
        standard: 'WCAG2AA',
        timeout: 120000,
        wait: 250,
        ...(actions ? { actions } : {}),
      },
      urls: [url],
    };

    const pa11yConfig = {
      standard: 'WCAG2AA',
      timeout: 120000,
      wait: 250,
      ...(actions ? { actions } : {}),
    };

    const pa11yCiConfigPath = path.join(configDir, `${slug}.pa11y-ci.config.json`);
    const pa11yConfigPath = path.join(configDir, `${slug}.pa11y.config.json`);
    await fs.writeFile(pa11yCiConfigPath, JSON.stringify(pa11yCiConfig, null, 2));
    await fs.writeFile(pa11yConfigPath, JSON.stringify(pa11yConfig, null, 2));

    const pa11yCiRun = await runCommand('npx', ['--yes', 'pa11y-ci', '--config', pa11yCiConfigPath], process.cwd());
    const pa11yCiLogPath = path.join(pa11yCiDir, `${slug}.log`);
    await fs.writeFile(
      pa11yCiLogPath,
      `$ npx --yes pa11y-ci --config ${pa11yCiConfigPath}\n${pa11yCiRun.stdout}${pa11yCiRun.stderr}`,
      'utf8',
    );

    const pa11yAxeRun = await runCommand(
      'npx',
      ['--yes', 'pa11y', url, '--config', pa11yConfigPath, '--runner', 'axe', '--reporter', 'json'],
      process.cwd(),
    );

    const pa11yAxeLogPath = path.join(pa11yAxeDir, `${slug}.log`);
    await fs.writeFile(
      pa11yAxeLogPath,
      `$ npx --yes pa11y ${url} --config ${pa11yConfigPath} --runner axe --reporter json\n${pa11yAxeRun.stderr}`,
      'utf8',
    );

    let pa11yAxeIssues = null;
    try {
      pa11yAxeIssues = JSON.parse(pa11yAxeRun.stdout);
    } catch {
      pa11yAxeIssues = null;
    }

    const pa11yAxeJsonPath = path.join(pa11yAxeDir, `${slug}.json`);
    if (pa11yAxeIssues !== null) {
      await fs.writeFile(pa11yAxeJsonPath, JSON.stringify(pa11yAxeIssues, null, 2));
    } else {
      await fs.writeFile(pa11yAxeJsonPath, pa11yAxeRun.stdout || '[]', 'utf8');
    }

    const issueCount = Array.isArray(pa11yAxeIssues) ? pa11yAxeIssues.length : null;

    results.push({
      route,
      routeType,
      url,
      pa11yCiExitCode: pa11yCiRun.code,
      pa11yAxeExitCode: pa11yAxeRun.code,
      pa11yAxeIssueCount: issueCount,
      pa11yCiLogPath,
      pa11yAxeLogPath,
      pa11yAxeJsonPath,
      ok: pa11yCiRun.code === 0 && pa11yAxeRun.code === 0,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    routeCount: results.length,
    pa11yCiFailures: results.filter((item) => item.pa11yCiExitCode !== 0).map((item) => item.route),
    pa11yAxeFailures: results.filter((item) => item.pa11yAxeExitCode !== 0).map((item) => item.route),
    failingRoutes: results.filter((item) => !item.ok).map((item) => item.route),
    results,
  };

  const summaryPath = path.join(outDir, 'pa11y-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify({ summaryPath, routeCount: results.length })}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
