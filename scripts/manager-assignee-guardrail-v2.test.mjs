import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyImplementationLane,
  candidatePoolForClassification,
  pickLeastLoadedByUrlKey,
  resolveManagerAssigneeGuardrailV2,
  validateManagerAssigneeOverride,
  DUBLAND_AGENT_IDS,
} from './lib/managerAssigneeGuardrailV2.mjs';

const ARCHITECT = '5f7a9323-368f-439d-b3a8-62cda910830b';

test('DUB-441 title classifies as frontend (never Backend fallback target)', () => {
  const title = 'Implement working handbook player in InteractiveHandbookGame';
  assert.equal(classifyImplementationLane({ title, description: '', labels: [] }), 'frontend');
});

test('deterministic tie-break: equal loads → fed-engineer before fed-engineer-2', () => {
  const [a, b, c] = DUBLAND_AGENT_IDS.fedPool;
  const loads = { [a]: 2, [b]: 2, [c]: 2 };
  const { selectedAgentId } = pickLeastLoadedByUrlKey(DUBLAND_AGENT_IDS.fedPool, loads);
  assert.equal(selectedAgentId, a);
});

test('tie-break defers to lowest load, then urlKey', () => {
  const [fed1, fed2, fed3] = DUBLAND_AGENT_IDS.fedPool;
  const loads = { [fed1]: 5, [fed2]: 1, [fed3]: 1 };
  const { selectedAgentId } = pickLeastLoadedByUrlKey(DUBLAND_AGENT_IDS.fedPool, loads);
  assert.equal(selectedAgentId, fed2);
});

test('manager + frontend lane → FED pool (Architect assignee rerouted)', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: '[FED] Fix RTL shell in Home.tsx',
    description: '',
    labels: [],
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: Object.fromEntries(DUBLAND_AGENT_IDS.fedPool.map((id) => [id, 0])),
  });
  assert.equal(r.guardrailApplied, true);
  assert.equal(r.metadata.classification, 'frontend');
  assert.equal(r.metadata.selectionReason, 'rerouted');
  assert.ok(DUBLAND_AGENT_IDS.fedPool.includes(r.assigneeAgentId));
});

test('override without rationale fails validation', () => {
  const v = validateManagerAssigneeOverride(true, '   ');
  assert.equal(v.ok, false);
});

test('override with rationale preserves manager assignee', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'React game shell',
    requestedAssigneeAgentId: ARCHITECT,
    managerAssigneeOverride: true,
    managerAssigneeOverrideRationale: 'CTO owns sequencing for launch gate',
    loadByAgentId: {},
  });
  assert.equal(r.assigneeAgentId, ARCHITECT);
  assert.equal(r.metadata.selectionReason, 'override_preserved');
  assert.equal(r.metadata.overrideUsed, true);
});

test('unclassified lane preserves manager assignee', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'Untitled coordination thread',
    description: 'No implementation signals',
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: {},
  });
  assert.equal(r.assigneeAgentId, ARCHITECT);
  assert.equal(r.metadata.selectionReason, 'unclassified_preserve');
});

test('backend lane routes to Backend Engineer', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'Add RLS policy for child_progress',
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: { [DUBLAND_AGENT_IDS.backendEngineer]: 0 },
  });
  assert.equal(r.metadata.classification, 'backend');
  assert.equal(r.assigneeAgentId, DUBLAND_AGENT_IDS.backendEngineer);
});

test('qa lane routes to QA pool with stable ordering', () => {
  const loads = {
    [DUBLAND_AGENT_IDS.qaPool[0]]: 3,
    [DUBLAND_AGENT_IDS.qaPool[1]]: 3,
  };
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'QA: accessibility verification matrix',
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: loads,
  });
  assert.equal(r.metadata.classification, 'qa');
  assert.equal(r.assigneeAgentId, DUBLAND_AGENT_IDS.qaPool[0]);
});

test('performance lane routes to Performance Expert', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'Lighthouse regression on handbook route',
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: { [DUBLAND_AGENT_IDS.performanceExpert]: 0 },
  });
  assert.equal(r.metadata.classification, 'performance');
  assert.equal(r.assigneeAgentId, DUBLAND_AGENT_IDS.performanceExpert);
});

test('feature flag off → no reroute', () => {
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: false,
    title: 'React',
    requestedAssigneeAgentId: ARCHITECT,
    loadByAgentId: {},
  });
  assert.equal(r.guardrailApplied, false);
  assert.equal(r.assigneeAgentId, ARCHITECT);
});

test('IC assignee unchanged (non-manager)', () => {
  const fed = DUBLAND_AGENT_IDS.fedPool[0];
  const r = resolveManagerAssigneeGuardrailV2({
    featureFlagEnabled: true,
    title: 'React game',
    requestedAssigneeAgentId: fed,
    loadByAgentId: {},
  });
  assert.equal(r.guardrailApplied, false);
  assert.equal(r.assigneeAgentId, fed);
});
