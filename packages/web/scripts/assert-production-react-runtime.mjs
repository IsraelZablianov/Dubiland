#!/usr/bin/env node

import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const LEAK_PATTERNS = [
  {
    key: 'jsxDEV',
    description: 'Found jsxDEV references in emitted bundle code',
    regex: /\bjsxDEV\b/,
  },
  {
    key: 'jsx-source-metadata',
    description: 'Found JSX source metadata (fileName) in emitted bundle code',
    regex: /\bfileName:\s*"/,
  },
  {
    key: 'jsx-dev-runtime-import',
    description: 'Found react-jsx-dev-runtime import in emitted bundle code',
    regex: /react-jsx-dev-runtime/i,
  },
  {
    key: 'react-development-bundle',
    description: 'Found React development bundle path in emitted bundle code',
    regex: /react(?:-dom)?\.development\.js/i,
  },
];

function parseArgs(argv) {
  const parsed = {
    distDir: path.resolve('dist'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dist') {
      parsed.distDir = path.resolve(argv[index + 1] ?? '');
      index += 1;
    }
  }

  return parsed;
}

async function collectJavaScriptFiles(directory) {
  const files = [];
  const queue = [directory];

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await fsp.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && path.extname(entry.name) === '.js') {
        files.push(fullPath);
      }
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const assetsDir = path.join(args.distDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Missing dist assets directory: ${assetsDir}`);
  }

  const jsFiles = await collectJavaScriptFiles(assetsDir);
  if (jsFiles.length === 0) {
    throw new Error(`No JavaScript assets found under: ${assetsDir}`);
  }

  const findings = [];

  for (const filePath of jsFiles) {
    const content = await fsp.readFile(filePath, 'utf8');
    const matches = LEAK_PATTERNS.filter((pattern) => pattern.regex.test(content));
    if (matches.length === 0) {
      continue;
    }

    findings.push({
      filePath,
      matches,
    });
  }

  if (findings.length > 0) {
    process.stderr.write('Production runtime guard failed: dev-runtime signatures found in dist assets.\n');
    for (const finding of findings) {
      const relativePath = path.relative(process.cwd(), finding.filePath);
      const descriptions = finding.matches.map((match) => match.description).join('; ');
      process.stderr.write(`- ${relativePath}: ${descriptions}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Production runtime guard passed: scanned ${jsFiles.length} JS assets in ${path.relative(process.cwd(), assetsDir)}.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
