#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const defaultBudgetsPath = path.join(webRoot, 'perf', 'ci-budgets.json');
const defaultDistAssetsPath = path.join(webRoot, 'dist', 'assets');
const defaultOutputPath = path.join(
  repoRoot,
  'artifacts',
  'perf',
  'bundle-results.json',
);

function parseArgs(argv) {
  const options = {};
  const knownFlags = new Set(['--budgets', '--dist-assets', '--output']);

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

    if (flag === '--dist-assets') {
      options.distAssetsPath = value;
      continue;
    }

    if (flag === '--output') {
      options.outputPath = value;
      continue;
    }
  }

  return options;
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
  return Number(value).toLocaleString('en-US');
}

function usage() {
  return [
    'Usage:',
    '  node ./scripts/check-ci-bundle-budgets.mjs [options]',
    '',
    'Options:',
    '  --budgets <path>      Path to ci-budgets.json',
    '  --dist-assets <path>  Dist assets directory (default: packages/web/dist/assets)',
    '  --output <path>       JSON output path (default: artifacts/perf/bundle-results.json)',
  ].join('\n');
}

async function readBudgets(budgetsPath) {
  const raw = await fs.readFile(budgetsPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed?.bundleBudgets) {
    throw new Error(`Missing bundleBudgets in ${budgetsPath}`);
  }

  const { index, react, i18n, totalJsBytesMax } = parsed.bundleBudgets;
  if (!index || !react || !i18n || typeof totalJsBytesMax !== 'number') {
    throw new Error(`Invalid bundleBudgets shape in ${budgetsPath}`);
  }

  return {
    index,
    react,
    i18n,
    totalJsBytesMax,
  };
}

async function collectJsAssets(distAssetsPath) {
  const entries = await fs.readdir(distAssetsPath, { withFileTypes: true });
  const jsEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));

  const assets = await Promise.all(
    jsEntries.map(async (entry) => {
      const filePath = path.join(distAssetsPath, entry.name);
      const [buffer, stat] = await Promise.all([
        fs.readFile(filePath),
        fs.stat(filePath),
      ]);

      return {
        fileName: entry.name,
        filePath,
        rawBytes: stat.size,
        gzipBytes: gzipSync(buffer, { level: 9 }).length,
      };
    }),
  );

  assets.sort((left, right) => left.fileName.localeCompare(right.fileName));
  return assets;
}

function chooseAssetByPrefix(assets, prefix) {
  const matched = assets.filter((asset) => asset.fileName.startsWith(prefix));
  if (matched.length === 0) {
    return { matched, selected: null };
  }

  const selected = [...matched].sort((left, right) => right.rawBytes - left.rawBytes)[0];
  return { matched, selected };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const budgetsPath = toAbsolutePath(options.budgetsPath, defaultBudgetsPath);
  const distAssetsPath = toAbsolutePath(options.distAssetsPath, defaultDistAssetsPath);
  const outputPath = toAbsolutePath(options.outputPath, defaultOutputPath);

  const bundleBudgets = await readBudgets(budgetsPath);
  const assets = await collectJsAssets(distAssetsPath);

  if (assets.length === 0) {
    throw new Error(`No JavaScript assets found in ${distAssetsPath}`);
  }

  const chunkBudgetMap = {
    index: bundleBudgets.index,
    react: bundleBudgets.react,
    i18n: bundleBudgets.i18n,
  };

  const chunkResults = {};
  const violations = [];

  for (const [chunkKey, chunkBudget] of Object.entries(chunkBudgetMap)) {
    const { matched, selected } = chooseAssetByPrefix(assets, chunkBudget.assetPrefix);

    if (!selected) {
      chunkResults[chunkKey] = {
        assetPrefix: chunkBudget.assetPrefix,
        budgetGzipBytesMax: chunkBudget.gzipBytesMax,
        pass: false,
        matchedFiles: [],
        reason: 'missing_asset_prefix_match',
      };

      violations.push({
        kind: 'missing_chunk',
        chunk: chunkKey,
        assetPrefix: chunkBudget.assetPrefix,
      });
      continue;
    }

    const pass = selected.gzipBytes <= chunkBudget.gzipBytesMax;

    chunkResults[chunkKey] = {
      assetPrefix: chunkBudget.assetPrefix,
      budgetGzipBytesMax: chunkBudget.gzipBytesMax,
      measuredGzipBytes: selected.gzipBytes,
      measuredRawBytes: selected.rawBytes,
      assetFile: selected.fileName,
      matchedFiles: matched.map((asset) => asset.fileName),
      pass,
    };

    if (!pass) {
      violations.push({
        kind: 'chunk_gzip_over_budget',
        chunk: chunkKey,
        assetFile: selected.fileName,
        measuredGzipBytes: selected.gzipBytes,
        budgetGzipBytesMax: chunkBudget.gzipBytesMax,
      });
    }
  }

  const totalJsBytes = assets.reduce((sum, asset) => sum + asset.rawBytes, 0);
  const totalJsPass = totalJsBytes <= bundleBudgets.totalJsBytesMax;
  if (!totalJsPass) {
    violations.push({
      kind: 'total_js_over_budget',
      measuredBytes: totalJsBytes,
      budgetBytesMax: bundleBudgets.totalJsBytesMax,
    });
  }

  const pass = violations.length === 0;

  const output = {
    generatedAt: new Date().toISOString(),
    budgetsPath: path.relative(repoRoot, budgetsPath),
    distAssetsPath: path.relative(repoRoot, distAssetsPath),
    pass,
    chunks: chunkResults,
    totalJs: {
      measuredBytes: totalJsBytes,
      budgetBytesMax: bundleBudgets.totalJsBytesMax,
      fileCount: assets.length,
      pass: totalJsPass,
    },
    violations,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  process.stdout.write('[perf:bundle] measured gzip budgets from dist assets\n');
  for (const [chunkKey, result] of Object.entries(chunkResults)) {
    if (!result.assetFile) {
      process.stdout.write(
        `[perf:bundle] ${chunkKey}: FAIL missing chunk with prefix "${result.assetPrefix}"\n`,
      );
      continue;
    }

    process.stdout.write(
      `[perf:bundle] ${chunkKey}: ${result.assetFile} gzip ${formatInteger(result.measuredGzipBytes)} / ${formatInteger(result.budgetGzipBytesMax)} (${result.pass ? 'PASS' : 'FAIL'})\n`,
    );
  }

  process.stdout.write(
    `[perf:bundle] total JS: ${formatInteger(totalJsBytes)} / ${formatInteger(bundleBudgets.totalJsBytesMax)} (${totalJsPass ? 'PASS' : 'FAIL'})\n`,
  );
  process.stdout.write(
    `[perf:bundle] report: ${path.relative(repoRoot, outputPath)}\n`,
  );

  if (!pass) {
    process.stdout.write(`[perf:bundle] FAIL (${violations.length} violation(s))\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write('[perf:bundle] PASS\n');
}

main().catch((error) => {
  process.stderr.write(`[perf:bundle] failed: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
