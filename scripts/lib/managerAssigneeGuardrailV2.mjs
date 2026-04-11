/**
 * Reference implementation: manager-assignee guardrail v2 (DUB-639 / DUB-635).
 * Port into Paperclip issue create/update paths; wire feature flag managerAssigneeGuardrailRoleAwareV2.
 *
 * @see docs/architecture/2026-04-11-dub-635-manager-assignee-role-aware-routing.md
 */

/** @typedef {'frontend'|'backend'|'qa'|'performance'|'unclassified'} LaneClassification */
/** @typedef {'rerouted'|'override_preserved'|'unclassified_preserve'} SelectionReason */

export const GUARDRAIL_VERSION = 'manager_assignee_v2';

export const DUBLAND_AGENT_IDS = {
  backendEngineer: '234deff3-03d1-4f9b-82d0-9abcdf74963a',
  performanceExpert: '56affc7e-e580-4c71-b1e2-49ebbc03c84a',
  fedPool: [
    'afb1aaf8-04b5-45f7-80d1-fd401ae14510',
    '0dad1b67-3702-4a03-b08b-3342247d371b',
    'aa97a097-c8e5-47e6-9075-e7f8fb5d3709',
  ],
  qaPool: [
    'e11728f3-bb90-417d-842a-9a1bb633eed4',
    'bef56e46-8b5a-48fc-bbce-acb9ea364c8a',
  ],
};

/** urlKey ascending tie-break — must match server agent registry */
export const DUBLAND_URL_KEYS_BY_ID = {
  'afb1aaf8-04b5-45f7-80d1-fd401ae14510': 'fed-engineer',
  '0dad1b67-3702-4a03-b08b-3342247d371b': 'fed-engineer-2',
  'aa97a097-c8e5-47e6-9075-e7f8fb5d3709': 'fed-engineer-3',
  '234deff3-03d1-4f9b-82d0-9abcdf74963a': 'backend-engineer',
  '56affc7e-e580-4c71-b1e2-49ebbc03c84a': 'performance-expert',
  'e11728f3-bb90-417d-842a-9a1bb633eed4': 'qa-engineer',
  'bef56e46-8b5a-48fc-bbce-acb9ea364c8a': 'qa-engineer-2',
  '5f7a9323-368f-439d-b3a8-62cda910830b': 'architect',
  '9ba06101-670c-4da3-9d57-56fdc8d67b03': 'pm',
  '83f9ecfd-1c49-4ad7-8378-1e7726e7c2a7': 'co-founder',
  'd4223d85-1b35-4fc3-82e6-84eb71f8f194': 'children-learning-pm',
  '99c2b859-5ab3-4632-a8fa-3da66f2d813a': 'reading-pm',
  '99a6a12f-c2c1-4eec-a923-59567b339e18': 'cmo',
};

/** Assignees in this set should not own implementation lanes without override */
export const MANAGER_ASSIGNNEE_URL_KEYS = new Set([
  'pm',
  'co-founder',
  'architect',
  'children-learning-pm',
  'reading-pm',
  'cmo',
]);

const RE = {
  /** performance before qa (lighthouse overlaps "test") */
  performance: /\b(lighthouse|lcp|cls|fid|bundle|bundlesize|perf(ormance)?|rendering\s+budget|core\s+web\s+vitals|web\s+vitals)\b/i,
  qa: /\b(qa\b|quality\s+assurance|accessibility|a11y|\bwcag\b|regression\s+test|verification|smoke\s+test|test\s+plan)\b/i,
  backend: /\b(backend|schema|migrations?\b|supabase|edge\s+functions?|postgres|row\s+level\s+security|\brls\b|api\s+contract|server[- ]side)\b/i,
  frontend: /\b(fed\b|frontend|front[- ]end|\bui\b|\bux\b|react|vite|component|rtl|hebrew\s+layout|layout|page\b|router|storybook|\bgame\b|interactive\w*game|\.tsx\b|\bhandbook\b|handbook\s+player|illustrat)\b/i,
};

/**
 * @param {{ title?: string|null, description?: string|null, labels?: string[] }} issue
 * @returns {LaneClassification}
 */
export function classifyImplementationLane(issue) {
  const title = issue.title ?? '';
  const description = issue.description ?? '';
  const labels = (issue.labels ?? []).join(' ');
  const blob = `${title}\n${description}\n${labels}`;

  if (RE.performance.test(blob)) return 'performance';
  if (RE.qa.test(blob)) return 'qa';
  if (RE.backend.test(blob)) return 'backend';
  if (RE.frontend.test(blob)) return 'frontend';
  return 'unclassified';
}

/**
 * @param {string} agentId
 * @param {Record<string, string>} [urlKeyById]
 */
export function isManagerClassAssignee(agentId, urlKeyById = DUBLAND_URL_KEYS_BY_ID) {
  const key = urlKeyById[agentId];
  if (!key) return false;
  return MANAGER_ASSIGNNEE_URL_KEYS.has(key);
}

/**
 * @param {string[]} candidateAgentIds
 * @param {Record<string, number>} loadByAgentId — active issue counts (todo|in_progress|in_review|blocked)
 * @param {Record<string, string>} [urlKeyById]
 * @returns {{ selectedAgentId: string, candidateAgentIdsOrdered: string[] }}
 */
export function pickLeastLoadedByUrlKey(candidateAgentIds, loadByAgentId, urlKeyById = DUBLAND_URL_KEYS_BY_ID) {
  const unique = [...new Set(candidateAgentIds)];
  const ordered = [...unique].sort((a, b) => {
    const ka = urlKeyById[a] ?? a;
    const kb = urlKeyById[b] ?? b;
    return ka.localeCompare(kb, 'en');
  });

  let best = ordered[0];
  let bestLoad = loadByAgentId[best] ?? 0;
  for (const id of ordered) {
    const load = loadByAgentId[id] ?? 0;
    if (load < bestLoad) {
      best = id;
      bestLoad = load;
    }
  }
  return { selectedAgentId: best, candidateAgentIdsOrdered: ordered };
}

/**
 * @param {LaneClassification} classification
 * @returns {string[]}
 */
export function candidatePoolForClassification(classification) {
  switch (classification) {
    case 'frontend':
      return [...DUBLAND_AGENT_IDS.fedPool];
    case 'backend':
      return [DUBLAND_AGENT_IDS.backendEngineer];
    case 'qa':
      return [...DUBLAND_AGENT_IDS.qaPool];
    case 'performance':
      return [DUBLAND_AGENT_IDS.performanceExpert];
    default:
      return [];
  }
}

/**
 * @param {{
 *   featureFlagEnabled: boolean,
 *   title?: string|null,
 *   description?: string|null,
 *   labels?: string[],
 *   requestedAssigneeAgentId: string,
 *   managerAssigneeOverride?: boolean,
 *   managerAssigneeOverrideRationale?: string|null,
 *   loadByAgentId: Record<string, number>,
 *   urlKeyById?: Record<string, string>,
 * }} input
 */
export function resolveManagerAssigneeGuardrailV2(input) {
  const urlKeyById = input.urlKeyById ?? DUBLAND_URL_KEYS_BY_ID;
  const fromAgentId = input.requestedAssigneeAgentId;

  const baseMeta = {
    guardrailVersion: GUARDRAIL_VERSION,
    selectionPolicy: 'least_active_then_urlkey',
    fromAgentId,
    overrideUsed: false,
    overrideRationale: null,
    featureFlagEnabled: input.featureFlagEnabled,
  };

  if (!input.featureFlagEnabled) {
    return {
      assigneeAgentId: fromAgentId,
      guardrailApplied: false,
      metadata: { ...baseMeta, selectionReason: null, classification: null, candidateAgentIds: [], selectedAgentId: fromAgentId },
    };
  }

  const rationale = (input.managerAssigneeOverrideRationale ?? '').trim();
  if (input.managerAssigneeOverride === true && rationale.length > 0) {
    return {
      assigneeAgentId: fromAgentId,
      guardrailApplied: true,
      metadata: {
        ...baseMeta,
        classification: classifyImplementationLane(input),
        candidateAgentIds: [],
        selectedAgentId: fromAgentId,
        selectionReason: 'override_preserved',
        overrideUsed: true,
        overrideRationale: rationale,
      },
    };
  }

  if (!isManagerClassAssignee(fromAgentId, urlKeyById)) {
    return {
      assigneeAgentId: fromAgentId,
      guardrailApplied: false,
      metadata: {
        ...baseMeta,
        classification: classifyImplementationLane(input),
        candidateAgentIds: [],
        selectedAgentId: fromAgentId,
        selectionReason: null,
      },
    };
  }

  const classification = classifyImplementationLane(input);
  if (classification === 'unclassified') {
    return {
      assigneeAgentId: fromAgentId,
      guardrailApplied: true,
      metadata: {
        ...baseMeta,
        classification,
        candidateAgentIds: [],
        selectedAgentId: fromAgentId,
        selectionReason: 'unclassified_preserve',
      },
    };
  }

  const pool = candidatePoolForClassification(classification);
  const { selectedAgentId, candidateAgentIdsOrdered } = pickLeastLoadedByUrlKey(pool, input.loadByAgentId, urlKeyById);

  return {
    assigneeAgentId: selectedAgentId,
    guardrailApplied: true,
    metadata: {
      ...baseMeta,
      classification,
      candidateAgentIds: candidateAgentIdsOrdered,
      selectedAgentId,
      toAgentId: selectedAgentId,
      selectionReason: 'rerouted',
    },
  };
}

/** Server should reject PATCH when override=true and rationale empty */
export function validateManagerAssigneeOverride(managerAssigneeOverride, rationale) {
  if (!managerAssigneeOverride) return { ok: true };
  const r = (rationale ?? '').trim();
  if (!r.length) return { ok: false, error: 'managerAssigneeOverrideRationale required when managerAssigneeOverride is true' };
  return { ok: true };
}
