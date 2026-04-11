#!/usr/bin/env node
/**
 * DUB-726: Create or rotate a dedicated non-production Supabase Auth user for
 * `scripts/dub-637-protected-route-matrix.mjs` (authenticated Lighthouse profile).
 *
 * Requires (script-only, never in Vite):
 *   - VITE_SUPABASE_URL or SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   - DUBILAND_PERF_EMAIL (default: dubiland-perf-matrix@example.com)
 *   - DUBILAND_PERF_PASSWORD (default: generated and printed once)
 *
 * Rollback: delete the auth user in Supabase Dashboard → Authentication, or via Admin API.
 */

import crypto from 'node:crypto';
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

function normalizeSupabaseUrl(url) {
  return String(url ?? '')
    .trim()
    .replace(/\/+$/, '');
}

function randomPassword() {
  return crypto.randomBytes(18).toString('base64url');
}

async function adminFetch(supabaseUrl, serviceKey, pathname, init) {
  const url = `${supabaseUrl}${pathname}`;
  const headers = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
    ...init.headers,
  };
  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { response, json };
}

async function createUser(supabaseUrl, serviceKey, email, password) {
  return adminFetch(supabaseUrl, serviceKey, '/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { dubiland_account_kind: 'perf_automation' },
    }),
  });
}

async function listUsersPage(supabaseUrl, serviceKey, page, perPage) {
  return adminFetch(
    supabaseUrl,
    serviceKey,
    `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
    { method: 'GET' },
  );
}

async function findUserIdByEmail(supabaseUrl, serviceKey, email) {
  const perPage = 200;
  for (let page = 1; page <= 25; page += 1) {
    const { response, json } = await listUsersPage(supabaseUrl, serviceKey, page, perPage);
    if (!response.ok) {
      throw new Error(
        `Failed to list auth users (page ${page}): ${response.status} ${JSON.stringify(json)}`,
      );
    }
    const users = Array.isArray(json?.users) ? json.users : [];
    const hit = users.find((u) => u.email === email);
    if (hit?.id) {
      return hit.id;
    }
    if (users.length < perPage) {
      break;
    }
  }
  return null;
}

async function updateUserPassword(supabaseUrl, serviceKey, userId, password) {
  return adminFetch(supabaseUrl, serviceKey, `/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}

async function main() {
  loadEnvFile(path.join(projectRoot, '.env'));

  const supabaseUrl = normalizeSupabaseUrl(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceKey) {
    process.stderr.write(
      '[provision-dubiland-perf-auth-user] Missing VITE_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.\n',
    );
    process.stderr.write(
      'Add SUPABASE_SERVICE_ROLE_KEY to repo-root .env (script-only; never expose to the web bundle).\n',
    );
    process.exitCode = 1;
    return;
  }

  const email =
    process.env.DUBILAND_PERF_EMAIL?.trim() || 'dubiland-perf-matrix@example.com';
  const password =
    process.env.DUBILAND_PERF_PASSWORD?.trim() || randomPassword();

  const { response: createRes, json: createJson } = await createUser(
    supabaseUrl,
    serviceKey,
    email,
    password,
  );

  if (createRes.ok) {
    process.stdout.write(
      `[provision-dubiland-perf-auth-user] Created auth user for ${email}\n`,
    );
  } else {
    const duplicate =
      createRes.status === 422 ||
      String(createJson?.msg ?? createJson?.message ?? '').toLowerCase().includes('already');
    if (!duplicate) {
      process.stderr.write(
        `[provision-dubiland-perf-auth-user] Create failed: ${createRes.status} ${JSON.stringify(createJson)}\n`,
      );
      process.exitCode = 1;
      return;
    }

    const userId = await findUserIdByEmail(supabaseUrl, serviceKey, email);
    if (!userId) {
      process.stderr.write(
        `[provision-dubiland-perf-auth-user] User exists but could not resolve id for ${email}\n`,
      );
      process.exitCode = 1;
      return;
    }

    const { response: updRes, json: updJson } = await updateUserPassword(
      supabaseUrl,
      serviceKey,
      userId,
      password,
    );
    if (!updRes.ok) {
      process.stderr.write(
        `[provision-dubiland-perf-auth-user] Password update failed: ${updRes.status} ${JSON.stringify(updJson)}\n`,
      );
      process.exitCode = 1;
      return;
    }
    process.stdout.write(
      `[provision-dubiland-perf-auth-user] Updated password for existing user ${email}\n`,
    );
  }

  process.stdout.write('\nAdd these to the Paperclip/workspace .env used for perf heartbeats (never commit):\n\n');
  process.stdout.write(`DUBILAND_PERF_EMAIL=${email}\n`);
  process.stdout.write(`DUBILAND_PERF_PASSWORD=${password}\n`);
  process.stdout.write(
    '\nEnsure SUPABASE_PROJECT_REF matches this project so Puppeteer session keys align (see scripts/dub-637-protected-route-matrix.mjs).\n',
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
