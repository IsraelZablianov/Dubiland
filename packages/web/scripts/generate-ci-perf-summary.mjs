#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const defaultArtifactsDirectory = path.join(repoRoot, 'artifacts', 'perf');
const defaultBundleInputPath = path.join(defaultArtifactsDirectory, 'bundle-results.json');
const defaultLighthouseInputPath = path.join(
  defaultArtifactsDirectory,
  'lighthouse-results.json',
);
const defaultSummaryJsonPath = path.join(defaultArtifactsDirectory, 'summary.json');
const defaultSummaryMarkdownPath = path.join(defaultArtifactsDirectory, 'summary.md');

function parseArgs(argv) {
  const options = {};
  const knownFlags = new Set([
    '--bundle',
    '--lighthouse',
    '--output-json',
    '--output-markdown',
  ]);

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

    if (flag === '--bundle') {
      options.bundlePath = value;
      continue;
    }

    if (flag === '--lighthouse') {
      options.lighthousePath = value;
      continue;
    }

    if (flag === '--output-json') {
      options.summaryJsonPath = value;
      continue;
    }

    if (flag === '--output-markdown') {
      options.summaryMarkdownPath = value;
    }
  }

  return options;
}

function usage() {
  return [
    'Usage:',
    '  node ./scripts/generate-ci-perf-summary.mjs [options]',
    '',
    'Options:',
    '  --bundle <path>           Bundle gate JSON (default: artifacts/perf/bundle-results.json)',
    '  --lighthouse <path>       Lighthouse gate JSON (default: artifacts/perf/lighthouse-results.json)',
    '  --output-json <path>      Summary JSON output path',
    '  --output-markdown <path>  Summary markdown output path',
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

function formatInteger(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return Number(value).toLocaleString('en-US');
}

function formatCls(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return Number(value).toFixed(3);
}

async function readJsonIfPresent(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function getBundleRows(bundleResult) {
  if (!bundleResult?.chunks) {
    return [];
  }

  const chunkRows = Object.entries(bundleResult.chunks).map(([chunkKey, chunk]) => ({
    label: chunkKey,
    assetFile: chunk.assetFile ?? '(missing)',
    measured: chunk.measuredGzipBytes,
    budget: chunk.budgetGzipBytesMax,
    pass: Boolean(chunk.pass),
  }));

  return [
    ...chunkRows,
    {
      label: 'total-js',
      assetFile: `${bundleResult.totalJs?.fileCount ?? 0} files`,
      measured: bundleResult.totalJs?.measuredBytes,
      budget: bundleResult.totalJs?.budgetBytesMax,
      pass: Boolean(bundleResult.totalJs?.pass),
    },
  ];
}

function getLighthouseRows(lighthouseResult) {
  if (!lighthouseResult?.routes) {
    return [];
  }

  return Object.entries(lighthouseResult.routes).map(([routePath, routeResult]) => ({
    routePath,
    performance: routeResult?.metrics?.performanceScore,
    performanceMin: routeResult?.budgets?.performanceMin,
    lcpMs: routeResult?.metrics?.lcpMs,
    lcpMsMax: routeResult?.budgets?.lcpMsMax,
    cls: routeResult?.metrics?.cls,
    clsMax: routeResult?.budgets?.clsMax,
    pass: Boolean(routeResult?.pass),
  }));
}

function createMarkdown({ bundleResult, lighthouseResult, summary }) {
  const lines = [];

  lines.push('# CI Performance Gates');
  lines.push('');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Overall status: **${summary.pass ? 'PASS' : 'FAIL'}**`);
  lines.push('');

  lines.push('## Bundle Budget Gate');
  lines.push('');
  if (!bundleResult) {
    lines.push('- Missing input: `bundle-results.json` not found.');
  } else {
    const rows = getBundleRows(bundleResult);
    lines.push('| Metric | Asset | Measured | Budget | Status |');
    lines.push('|---|---|---:|---:|---|');
    for (const row of rows) {
      lines.push(
        `| ${row.label} | ${row.assetFile} | ${formatInteger(row.measured)} | ${formatInteger(row.budget)} | ${row.pass ? 'PASS' : 'FAIL'} |`,
      );
    }
    lines.push('');
    lines.push(`- Gate status: **${bundleResult.pass ? 'PASS' : 'FAIL'}**`);
    lines.push(`- Violations: ${bundleResult.violations?.length ?? 0}`);
  }
  lines.push('');

  lines.push('## Lighthouse Gate');
  lines.push('');
  if (!lighthouseResult) {
    lines.push('- Missing input: `lighthouse-results.json` not found.');
  } else {
    const rows = getLighthouseRows(lighthouseResult);
    lines.push('| Route | Perf (actual/min) | LCP ms (actual/max) | CLS (actual/max) | Status |');
    lines.push('|---|---:|---:|---:|---|');
    for (const row of rows) {
      lines.push(
        `| ${row.routePath} | ${formatInteger(row.performance)} / ${formatInteger(row.performanceMin)} | ${formatInteger(row.lcpMs)} / ${formatInteger(row.lcpMsMax)} | ${formatCls(row.cls)} / ${formatCls(row.clsMax)} | ${row.pass ? 'PASS' : 'FAIL'} |`,
      );
    }
    lines.push('');
    lines.push(`- Gate status: **${lighthouseResult.pass ? 'PASS' : 'FAIL'}**`);
    lines.push(`- Violations: ${lighthouseResult.violations?.length ?? 0}`);
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const bundlePath = toAbsolutePath(options.bundlePath, defaultBundleInputPath);
  const lighthousePath = toAbsolutePath(
    options.lighthousePath,
    defaultLighthouseInputPath,
  );
  const summaryJsonPath = toAbsolutePath(
    options.summaryJsonPath,
    defaultSummaryJsonPath,
  );
  const summaryMarkdownPath = toAbsolutePath(
    options.summaryMarkdownPath,
    defaultSummaryMarkdownPath,
  );

  const [bundleResult, lighthouseResult] = await Promise.all([
    readJsonIfPresent(bundlePath),
    readJsonIfPresent(lighthousePath),
  ]);

  const pass =
    Boolean(bundleResult?.pass) &&
    Boolean(lighthouseResult?.pass);

  const summary = {
    generatedAt: new Date().toISOString(),
    pass,
    inputs: {
      bundle: path.relative(repoRoot, bundlePath),
      lighthouse: path.relative(repoRoot, lighthousePath),
    },
    bundle: bundleResult
      ? {
          pass: Boolean(bundleResult.pass),
          violations: bundleResult.violations?.length ?? 0,
        }
      : {
          pass: false,
          missing: true,
        },
    lighthouse: lighthouseResult
      ? {
          pass: Boolean(lighthouseResult.pass),
          violations: lighthouseResult.violations?.length ?? 0,
        }
      : {
          pass: false,
          missing: true,
        },
  };

  const markdown = createMarkdown({
    bundleResult,
    lighthouseResult,
    summary,
  });

  await fs.mkdir(path.dirname(summaryJsonPath), { recursive: true });
  await fs.mkdir(path.dirname(summaryMarkdownPath), { recursive: true });
  await fs.writeFile(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await fs.writeFile(summaryMarkdownPath, markdown, 'utf8');

  process.stdout.write(
    `[perf:summary] summary json: ${path.relative(repoRoot, summaryJsonPath)}\n`,
  );
  process.stdout.write(
    `[perf:summary] summary markdown: ${path.relative(repoRoot, summaryMarkdownPath)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`[perf:summary] failed: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
