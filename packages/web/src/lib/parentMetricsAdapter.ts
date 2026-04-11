import type { Game } from '@dubiland/shared';
import type { GameCompletionResult, HintTrend, StableRange } from '@/games/engine';

export type ParentMetricsDomain = 'math' | 'letters' | 'reading';
export type ParentMetricsAgeBand = '3-4' | '4-5' | '5-6' | '6-7';

export interface ParentMetricsV1 {
  contractVersion: 'parent-metrics.v1';
  domain: ParentMetricsDomain;
  skillKey: string;
  accuracyPct: number;
  hintTrend: HintTrend;
  independenceTrend: HintTrend;
  progressionBand: StableRange;
  ageBand?: ParentMetricsAgeBand;
  gatePassed?: boolean;
  decodeAccuracyPct?: number;
  sequenceEvidenceScore?: number;
  listenParticipationPct?: number;
}

interface BuildParentMetricsV1Params {
  game: Pick<Game, 'slug'> & Partial<Pick<Game, 'topicId'>>;
  completion: GameCompletionResult;
  childAgeBand?: ParentMetricsAgeBand;
}

const CONTRACT_VERSION: ParentMetricsV1['contractVersion'] = 'parent-metrics.v1';

const DOMAIN_BY_TOPIC_KEY: Record<string, ParentMetricsDomain> = {
  math: 'math',
  numbers: 'math',
  letters: 'letters',
  reading: 'reading',
};

const DOMAIN_BY_GAME_KEY: Record<string, ParentMetricsDomain> = {
  countingpicnic: 'math',
  moreorlessmarket: 'math',
  numberlinejumps: 'math',
  lettersoundmatch: 'letters',
  picturetowordbuilder: 'reading',
  interactivehandbook: 'reading',
  letterstorybook: 'reading',
};

const AGE_BAND_VALUES = new Set<ParentMetricsAgeBand>(['3-4', '4-5', '5-6', '6-7']);
const HINT_TREND_VALUES = new Set<HintTrend>(['improving', 'steady', 'needs_support']);
const PROGRESSION_BAND_VALUES = new Set<StableRange>(['1-3', '1-5', '1-10']);

function toLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number') {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function clampPct(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

function roundPct(value: number): number {
  return Math.round(value * 100) / 100;
}

function toPercentOrUndefined(value: unknown): number | undefined {
  const numeric = toFiniteNumber(value);
  if (numeric == null) {
    return undefined;
  }

  return roundPct(clampPct(numeric));
}

function isHintTrend(value: unknown): value is HintTrend {
  return typeof value === 'string' && HINT_TREND_VALUES.has(value as HintTrend);
}

function isStableRange(value: unknown): value is StableRange {
  return typeof value === 'string' && PROGRESSION_BAND_VALUES.has(value as StableRange);
}

function isAgeBand(value: unknown): value is ParentMetricsAgeBand {
  return typeof value === 'string' && AGE_BAND_VALUES.has(value as ParentMetricsAgeBand);
}

function resolveDomain(game: Pick<Game, 'slug'> & Partial<Pick<Game, 'topicId'>>): ParentMetricsDomain | null {
  const topicKey = game.topicId ? toLookupKey(game.topicId) : '';
  if (topicKey && DOMAIN_BY_TOPIC_KEY[topicKey]) {
    return DOMAIN_BY_TOPIC_KEY[topicKey];
  }

  const gameKey = toLookupKey(game.slug);
  return DOMAIN_BY_GAME_KEY[gameKey] ?? null;
}

function toSkillKey(slug: string): string | null {
  const trimmed = slug.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.slice(0, 96);
}

export function buildParentMetricsV1(params: BuildParentMetricsV1Params): ParentMetricsV1 | null {
  const summary = params.completion.summaryMetrics;
  if (!summary) {
    return null;
  }

  const domain = resolveDomain(params.game);
  if (!domain) {
    return null;
  }

  const skillKey = toSkillKey(params.game.slug);
  if (!skillKey) {
    return null;
  }

  const accuracyRaw = toFiniteNumber(summary.firstAttemptSuccessRate);
  if (accuracyRaw == null) {
    return null;
  }

  const hintTrendRaw = summary.hintTrend;
  const progressionBandRaw = summary.highestStableRange;
  if (!isHintTrend(hintTrendRaw) || !isStableRange(progressionBandRaw)) {
    return null;
  }

  const result: ParentMetricsV1 = {
    contractVersion: CONTRACT_VERSION,
    domain,
    skillKey,
    accuracyPct: roundPct(clampPct(accuracyRaw)),
    hintTrend: hintTrendRaw,
    independenceTrend: hintTrendRaw,
    progressionBand: progressionBandRaw,
  };

  const resolvedAgeBand = params.childAgeBand ?? summary.ageBand;
  if (isAgeBand(resolvedAgeBand)) {
    result.ageBand = resolvedAgeBand;
  }

  const gatePassed = params.completion.readingGate?.passed ?? summary.gatePassed;
  if (typeof gatePassed === 'boolean') {
    result.gatePassed = gatePassed;
  }

  const decodeAccuracyPct = toPercentOrUndefined(summary.decodeAccuracy);
  if (decodeAccuracyPct !== undefined) {
    result.decodeAccuracyPct = decodeAccuracyPct;
  }

  const sequenceEvidenceScore = toPercentOrUndefined(summary.sequenceEvidenceScore);
  if (sequenceEvidenceScore !== undefined) {
    result.sequenceEvidenceScore = sequenceEvidenceScore;
  }

  const listenParticipationPct = toPercentOrUndefined(summary.listenParticipation);
  if (listenParticipationPct !== undefined) {
    result.listenParticipationPct = listenParticipationPct;
  }

  return result;
}
