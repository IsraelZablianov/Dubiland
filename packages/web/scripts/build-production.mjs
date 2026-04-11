#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';

const ENFORCED_NODE_ENV = 'production';

const STEPS = [
  { command: 'yarn', args: ['images:pipeline'] },
  { command: 'yarn', args: ['tsc', '-b'] },
  { command: 'yarn', args: ['vite', 'build', '--mode', 'production'] },
  { command: 'yarn', args: ['generate:crawl-assets:dist'] },
  { command: 'node', args: ['./scripts/generate-seo-route-html.mjs'] },
  { command: 'node', args: ['./scripts/assert-production-react-runtime.mjs'] },
];

function formatCommand(command, args) {
  return `${command} ${args.map((arg) => JSON.stringify(arg)).join(' ')}`;
}

async function runStep(step) {
  process.stdout.write(`$ ${formatCommand(step.command, step.args)}\n`);

  await new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: ENFORCED_NODE_ENV,
      },
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${step.command} exited with code ${code}`));
    });
  });
}

async function main() {
  for (const step of STEPS) {
    await runStep(step);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
