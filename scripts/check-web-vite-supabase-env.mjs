#!/usr/bin/env node
/**
 * Ensures the Vite web app can talk to Supabase (progress, catalog, auth).
 * Loads repo-root .env into process.env (does not print secret values).
 *
 * Opt out: SKIP_WEB_VITE_ENV_CHECK=1
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
    return false;
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
  return true;
}

function isPlaceholderUrl(url) {
  const u = url.trim().toLowerCase();
  return (
    u.includes('your_project_ref') ||
    u.includes('placeholder') ||
    !u.startsWith('https://') ||
    u.length < 24
  );
}

function isPlaceholderAnonKey(key) {
  const k = key.trim().toLowerCase();
  return k === 'your_supabase_anon_key' || k.includes('your_supabase_anon');
}

function main() {
  if (process.env.SKIP_WEB_VITE_ENV_CHECK === '1') {
    process.stderr.write('[check-web-vite-supabase-env] skipped (SKIP_WEB_VITE_ENV_CHECK=1)\n');
    return;
  }

  const envPath = path.join(projectRoot, '.env');
  const examplePath = path.join(projectRoot, '.env.example');

  if (!loadEnvFile(envPath)) {
    process.stderr.write(
      `\n[check-web-vite-supabase-env] Missing ${path.relative(process.cwd(), envPath) || '.env'} at repo root.\n` +
        `  Create it from the template:\n` +
        `    cp .env.example .env\n` +
        `  Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase → Project Settings → API).\n` +
        `  Restart yarn dev.\n\n`,
    );
    process.exitCode = 1;
    return;
  }

  const url = process.env.VITE_SUPABASE_URL?.trim() ?? '';
  const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  const problems = [];
  if (!url) {
    problems.push('VITE_SUPABASE_URL is empty');
  } else if (isPlaceholderUrl(url)) {
    problems.push('VITE_SUPABASE_URL still looks like a placeholder (use your real https://….supabase.co URL)');
  }

  if (!anon) {
    problems.push('VITE_SUPABASE_ANON_KEY is empty');
  } else if (isPlaceholderAnonKey(anon)) {
    problems.push('VITE_SUPABASE_ANON_KEY still looks like a placeholder (use the anon public key from the dashboard)');
  }

  if (problems.length > 0) {
    process.stderr.write('\n[check-web-vite-supabase-env] Web + Supabase will not work until this is fixed:\n');
    for (const p of problems) {
      process.stderr.write(`  - ${p}\n`);
    }
    process.stderr.write(`\n  Edit: ${envPath}\n`);
    if (fs.existsSync(examplePath)) {
      process.stderr.write(`  Reference: ${examplePath}\n`);
    }
    process.stderr.write('  Then restart yarn dev.\n');
    process.stderr.write('  (To skip this check: SKIP_WEB_VITE_ENV_CHECK=1 yarn dev)\n\n');
    process.exitCode = 1;
  }
}

main();
