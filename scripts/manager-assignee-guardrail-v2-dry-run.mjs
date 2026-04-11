#!/usr/bin/env node
/**
 * Dry-run migration report for Guardrail v2 (DUB-639).
 * Lists open issues assigned to Backend Engineer where lane classification is not `backend`
 * — v1 incorrectly fell back to Backend; v2 would target FED/QA/Performance pools.
 *
 * Usage:
 *   PAPERCLIP_API_URL=http://127.0.0.1:3100 PAPERCLIP_API_KEY=... node scripts/manager-assignee-guardrail-v2-dry-run.mjs
 *
 * Writes: docs/agents/backend-engineer/evidence/dub-639/migration-dry-run-<timestamp>.json
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyImplementationLane,
  candidatePoolForClassification,
  pickLeastLoadedByUrlKey,
  DUBLAND_AGENT_IDS,
} from './lib/managerAssigneeGuardrailV2.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs/agents/backend-engineer/evidence/dub-639');

const COMPANY_ID = '107038ed-546d-4c3f-afca-26feea951289';
const BACKEND_ID = DUBLAND_AGENT_IDS.backendEngineer;
const ACTIVE = ['todo', 'in_progress', 'in_review', 'blocked'];

function env(name, fallback = '') {
  return process.env[name] ?? fallback;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${url}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

async function main() {
  const base = env('PAPERCLIP_API_URL', 'http://127.0.0.1:3100').replace(/\/$/, '');
  const token = env('PAPERCLIP_API_KEY');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const agents = await fetchJson(`${base}/api/companies/${COMPANY_ID}/agents`, headers);
  const list = Array.isArray(agents) ? agents : agents.agents ?? [];
  const urlKeyById = Object.fromEntries(
    list.filter((a) => a.id && a.urlKey).map((a) => [a.id, a.urlKey]),
  );

  /** @type {Record<string, number>} */
  const loadByAgentId = {};
  for (const a of list) loadByAgentId[a.id] = 0;

  for (const status of ACTIVE) {
    const qs = new URLSearchParams({ status, limit: '200' });
    const chunk = await fetchJson(`${base}/api/companies/${COMPANY_ID}/issues?${qs}`, headers);
    const issues = Array.isArray(chunk) ? chunk : chunk.issues ?? [];
    for (const iss of issues) {
      const aid = iss.assigneeAgentId;
      if (aid && loadByAgentId[aid] !== undefined) loadByAgentId[aid]++;
    }
  }

  const mismatches = [];
  for (const status of ACTIVE) {
    const qs = new URLSearchParams({
      status,
      assigneeAgentId: BACKEND_ID,
      limit: '200',
    });
    const chunk = await fetchJson(`${base}/api/companies/${COMPANY_ID}/issues?${qs}`, headers);
    const issues = Array.isArray(chunk) ? chunk : chunk.issues ?? [];
    for (const iss of issues) {
      const classification = classifyImplementationLane({
        title: iss.title,
        description: iss.description,
        labels: iss.labels ?? [],
      });
      if (classification === 'backend' || classification === 'unclassified') continue;

      const pool = candidatePoolForClassification(classification);
      const { selectedAgentId, candidateAgentIdsOrdered } = pickLeastLoadedByUrlKey(
        pool,
        loadByAgentId,
        urlKeyById,
      );

      mismatches.push({
        issueId: iss.id,
        identifier: iss.identifier,
        status: iss.status,
        title: iss.title,
        currentAssigneeAgentId: iss.assigneeAgentId,
        classification,
        v2SuggestedAssigneeAgentId: selectedAgentId,
        candidateAgentIdsOrdered,
        loadSnapshot: Object.fromEntries(candidateAgentIdsOrdered.map((id) => [id, loadByAgentId[id] ?? 0])),
        note:
          'Dry-run only: issue is on Backend but text signals suggest non-backend domain; v2 would route manager assignee to IC pool — verify history before auto-correct.',
      });
    }
  }

  const dub441Replay = {
    issueIdentifier: 'DUB-441',
    title: 'Implement working handbook player in InteractiveHandbookGame',
    classification: classifyImplementationLane({
      title: 'Implement working handbook player in InteractiveHandbookGame',
      description: '',
      labels: [],
    }),
    simulatedManagerAssigneeArchitect: (() => {
      const pool = candidatePoolForClassification(
        classifyImplementationLane({
          title: 'Implement working handbook player in InteractiveHandbookGame',
          description: '',
          labels: [],
        }),
      );
      return pickLeastLoadedByUrlKey(pool, loadByAgentId, urlKeyById);
    })(),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    companyId: COMPANY_ID,
    guardrailVersion: 'manager_assignee_v2',
    selectionPolicy: 'least_active_then_urlkey',
    summary: {
      activeStatusesScanned: ACTIVE,
      backendAssigneeOpenIssuesNonBackendClassification: mismatches.length,
    },
    mismatches,
    dub441Replay,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = join(OUT_DIR, `migration-dry-run-${stamp}.json`);
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
