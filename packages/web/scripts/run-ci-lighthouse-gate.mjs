#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const defaultBudgetsPath = path.join(webRoot, 'perf', 'ci-budgets.json');
const defaultOutputPath = path.join(
  repoRoot,
  'artifacts',
  'perf',
  'lighthouse-results.json',
);
const defaultReportsDirectory = path.join(
  repoRoot,
  'artifacts',
  'perf',
  'lighthouse',
  'raw',
);
const defaultBaseUrl = 'http://127.0.0.1:4173';

function parseArgs(argv) {
  const options = {};
  const knownFlags = new Set(['--budgets', '--base-url', '--output', '--reports-dir']);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      options.help = true;
      continue;
    }

    const [flag, valueFromEquals] = token.split('=', 2);
    if (!knownFlags.has(flag)) {
      throw new Error(`Unknown argument: ${token}`);
    }

    const value = valueFromEquals ?? argv[index + 1];
    if (!value) {
      throw new Error(`Missing value for ${flag}`);
    }

    if (valueFromEquals == null) {
      index += 1;
    }

    if (flag === '--budgets') {
      options.budgetsPath = value;
      continue;
    }

    if (flag === '--base-url') {
      options.baseUrl = value;
      continue;
    }

    if (flag === '--output') {
      options.outputPath = value;
      continue;
    }

    if (flag === '--reports-dir') {
      options.reportsDirectory = value;
    }
  }

  return options;
}

function usage() {
  return [
    'Usage:',
    '  node ./scripts/run-ci-lighthouse-gate.mjs [options]',
    '',
    'Options:',
    '  --budgets <path>      Path to ci-budgets.json',
    '  --base-url <url>      Dist server base URL (default: http://127.0.0.1:4173)',
    '  --output <path>       JSON output path (default: artifacts/perf/lighthouse-results.json)',
    '  --reports-dir <path>  Raw Lighthouse JSON output directory',
  ].join('\n');
}

function toAbsolutePath(candidate, fallback) {
  if (!candidate) {
    return fallback;
  }

  if (path.isAbsolute(candidate)) {
    return candidate;
  }

  return path.resolve(process.cwd(), candidate);
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function toRouteKey(routePath) {
  if (routePath === '/') {
    return 'root';
  }

  return routePath.replace(/^\/+/, '').replace(/[^a-z0-9-]/gi, '-') || 'route';
}

function toTargetUrl(baseUrl, routePath) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(routePath.replace(/^\//, ''), normalizedBase).toString();
}

function formatScore(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return String(value);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return value.toLocaleString('en-US');
}

function formatCls(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return value.toFixed(3);
}

async function readBudgets(budgetsPath) {
  const raw = await fs.readFile(budgetsPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed?.lighthouseBudgets || typeof parsed.lighthouseBudgets !== 'object') {
    throw new Error(`Missing lighthouseBudgets in ${budgetsPath}`);
  }

  const entries = Object.entries(parsed.lighthouseBudgets);
  if (entries.length === 0) {
    throw new Error(`No route budgets found in ${budgetsPath}`);
  }

  for (const [route, routeBudget] of entries) {
    if (
      typeof routeBudget?.performanceMin !== 'number' ||
      typeof routeBudget?.lcpMsMax !== 'number' ||
      typeof routeBudget?.clsMax !== 'number'
    ) {
      throw new Error(`Invalid lighthouse budget shape for route "${route}" in ${budgetsPath}`);
    }
  }

  return parsed.lighthouseBudgets;
}

async function loadLighthouseReport(reportPath) {
  const raw = await fs.readFile(reportPath, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed?.lhr ?? parsed;
}

function getRouteMetrics(lhr) {
  const performanceScoreRaw = lhr?.categories?.performance?.score;
  const lcpMs = lhr?.audits?.['largest-contentful-paint']?.numericValue;
  const cls = lhr?.audits?.['cumulative-layout-shift']?.numericValue;

  const performanceScore = Number.isFinite(performanceScoreRaw)
    ? Math.round(performanceScoreRaw * 100)
    : Number.NaN;

  return {
    performanceScore,
    lcpMs,
    cls,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const budgetsPath = toAbsolutePath(options.budgetsPath, defaultBudgetsPath);
  const outputPath = toAbsolutePath(options.outputPath, defaultOutputPath);
  const reportsDirectory = toAbsolutePath(
    options.reportsDirectory,
    defaultReportsDirectory,
  );
  const baseUrl = options.baseUrl ?? defaultBaseUrl;

  const routeBudgets = await readBudgets(budgetsPath);

  await fs.mkdir(reportsDirectory, { recursive: true });

  const routeResults = {};
  const violations = [];

  for (const [routePath, routeBudget] of Object.entries(routeBudgets)) {
    const routeKey = toRouteKey(routePath);
    const targetUrl = toTargetUrl(baseUrl, routePath);
    const reportPath = path.join(reportsDirectory, `${routeKey}.json`);

    try {
      await runCommand('npx', [
        '--yes',
        'lighthouse@12',
        targetUrl,
        '--only-categories=performance',
        '--output=json',
        '--output-path',
        reportPath,
        '--quiet',
        '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
      ]);

      const lhr = await loadLighthouseReport(reportPath);
      const metrics = getRouteMetrics(lhr);

      const checks = {
        performance: metrics.performanceScore >= routeBudget.performanceMin,
        lcp: Number(metrics.lcpMs) <= routeBudget.lcpMsMax,
        cls: Number(metrics.cls) <= routeBudget.clsMax,
      };

      const pass = checks.performance && checks.lcp && checks.cls;

      routeResults[routePath] = {
        route: routePath,
        targetUrl,
        reportPath: path.relative(repoRoot, reportPath),
        budgets: routeBudget,
        metrics,
        checks,
        pass,
      };

      process.stdout.write(
        `[perf:lighthouse] ${routePath} perf ${formatScore(metrics.performanceScore)} / ${formatScore(routeBudget.performanceMin)} (${checks.performance ? 'PASS' : 'FAIL'}) | LCP ${formatNumber(metrics.lcpMs)} / ${formatNumber(routeBudget.lcpMsMax)} (${checks.lcp ? 'PASS' : 'FAIL'}) | CLS ${formatCls(metrics.cls)} / ${formatCls(routeBudget.clsMax)} (${checks.cls ? 'PASS' : 'FAIL'})\n`,
      );

      if (!checks.performance) {
        violations.push({
          route: routePath,
          metric: 'performance',
          measured: metrics.performanceScore,
          expected: `>= ${routeBudget.performanceMin}`,
        });
      }

      if (!checks.lcp) {
        violations.push({
          route: routePath,
          metric: 'lcpMs',
          measured: metrics.lcpMs,
          expected: `<= ${routeBudget.lcpMsMax}`,
        });
      }

      if (!checks.cls) {
        violations.push({
          route: routePath,
          metric: 'cls',
          measured: metrics.cls,
          expected: `<= ${routeBudget.clsMax}`,
        });
      }
    } catch (error) {
      routeResults[routePath] = {
        route: routePath,
        targetUrl,
        reportPath: path.relative(repoRoot, reportPath),
        budgets: routeBudget,
        metrics: null,
        checks: {
          performance: false,
          lcp: false,
          cls: false,
        },
        pass: false,
        error: error.message,
      };

      violations.push({
        route: routePath,
        metric: 'audit',
        measured: 'error',
        expected: 'lighthouse run succeeds',
        message: error.message,
      });

      process.stdout.write(
        `[perf:lighthouse] ${routePath} FAIL lighthouse execution error: ${error.message}\n`,
      );
    }
  }

  const pass = violations.length === 0;
  const output = {
    generatedAt: new Date().toISOString(),
    budgetsPath: path.relative(repoRoot, budgetsPath),
    baseUrl,
    reportsDirectory: path.relative(repoRoot, reportsDirectory),
    pass,
    routes: routeResults,
    violations,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `[perf:lighthouse] report: ${path.relative(repoRoot, outputPath)}\n`,
  );

  if (!pass) {
    process.stdout.write(
      `[perf:lighthouse] FAIL (${violations.length} violation(s))\n`,
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write('[perf:lighthouse] PASS\n');
}

main().catch((error) => {
  process.stderr.write(`[perf:lighthouse] failed: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
