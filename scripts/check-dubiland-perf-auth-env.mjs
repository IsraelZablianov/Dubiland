#!/usr/bin/env node
/**
 * Exit 0 when DUBILAND_PERF_EMAIL and DUBILAND_PERF_PASSWORD are non-empty.
 * Does not print secret values (only presence + length sanity).
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function main() {
  const fromFile = process.argv.includes('--load-dotenv');
  if (fromFile) {
    loadEnvFile(path.join(projectRoot, '.env'));
  }

  const email = process.env.DUBILAND_PERF_EMAIL?.trim() ?? '';
  const password = process.env.DUBILAND_PERF_PASSWORD?.trim() ?? '';
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() ?? '';

  const ok = email.length > 0 && password.length > 0;
  const refOk = projectRef.length > 0;

  process.stdout.write(
    JSON.stringify(
      {
        dubiland_perf_email_present: email.length > 0,
        dubiland_perf_password_present: password.length > 0,
        supabase_project_ref_present: refOk,
        ok: ok && refOk,
      },
      null,
      2,
    ) + '\n',
  );

  if (!ok || !refOk) {
    process.exitCode = 1;
  }
}

main();
