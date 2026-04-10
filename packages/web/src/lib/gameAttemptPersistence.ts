import type { Game, GameLevel } from '@dubiland/shared';
import type { GameCompletionResult } from '@/games/engine';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type PersistableAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
type PersistSkipReason = 'supabase_not_configured' | 'child_not_persistable';

interface PersistGameAttemptParams {
  childId: string;
  childAgeBand?: PersistableAgeBand;
  game: Pick<Game, 'id' | 'slug'>;
  level?: Pick<GameLevel, 'id' | 'levelNumber'> | null;
  completion: GameCompletionResult;
  clientSessionId: string;
  startedAt: string;
  durationMs?: number | null;
  attemptIndex: number;
  attemptId?: string;
}

export type PersistGameAttemptOutcome =
  | {
      status: 'persisted';
      sessionId: string;
      attemptId: string;
    }
  | {
      status: 'skipped';
      reason: PersistSkipReason;
    }
  | {
      status: 'failed';
      errorMessage: string;
    };

interface SubmitGameAttemptResponse {
  sessionId?: string;
  attemptId?: string;
  error?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gameIdBySlugCache = new Map<string, string>();
const levelIdByGameAndNumberCache = new Map<string, string>();

function isUuid(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  return UUID_PATTERN.test(value);
}

function randomBytes(size: number): Uint8Array {
  const buffer = new Uint8Array(size);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(buffer);
    return buffer;
  }

  for (let index = 0; index < buffer.length; index += 1) {
    buffer[index] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

function generateUuidV4(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createGameSessionId(): string {
  return generateUuidV4();
}

export function createGameAttemptId(): string {
  return generateUuidV4();
}

async function resolvePersistedGameId(game: Pick<Game, 'id' | 'slug'>): Promise<string | null> {
  if (isUuid(game.id)) {
    return game.id;
  }

  const cached = gameIdBySlugCache.get(game.slug);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from('games')
    .select('id')
    .eq('slug', game.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  gameIdBySlugCache.set(game.slug, data.id);
  return data.id;
}

async function resolvePersistedLevelId(
  gameId: string,
  level: Pick<GameLevel, 'id' | 'levelNumber'> | null | undefined,
): Promise<string | null> {
  if (!level) {
    return null;
  }

  if (isUuid(level.id)) {
    return level.id;
  }

  const cacheKey = `${gameId}:${level.levelNumber}`;
  const cached = levelIdByGameAndNumberCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await supabase
    .from('game_levels')
    .select('id')
    .eq('game_id', gameId)
    .eq('level_number', level.levelNumber)
    .maybeSingle();

  if (!data?.id) {
    return null;
  }

  levelIdByGameAndNumberCache.set(cacheKey, data.id);
  return data.id;
}

function normalizeAttemptIndex(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export async function persistGameAttempt(params: PersistGameAttemptParams): Promise<PersistGameAttemptOutcome> {
  if (!isSupabaseConfigured) {
    return { status: 'skipped', reason: 'supabase_not_configured' };
  }

  if (!isUuid(params.childId)) {
    return { status: 'skipped', reason: 'child_not_persistable' };
  }

  try {
    const gameId = await resolvePersistedGameId(params.game);
    if (!gameId) {
      return {
        status: 'failed',
        errorMessage: 'Game row was not found for telemetry persistence.',
      };
    }

    const levelId = await resolvePersistedLevelId(gameId, params.level);
    const attemptId = isUuid(params.attemptId) ? params.attemptId : createGameAttemptId();

    const { data, error } = await supabase.functions.invoke<SubmitGameAttemptResponse>('submit-game-attempt', {
      body: {
        childId: params.childId,
        gameId,
        clientSessionId: params.clientSessionId,
        levelId,
        startedAt: params.startedAt,
        ageBand: params.childAgeBand ?? null,
        attempt: {
          attemptId,
          attemptIndex: normalizeAttemptIndex(params.attemptIndex),
          score: params.completion.score,
          stars: params.completion.stars,
          durationMs: params.durationMs ?? null,
          payload: {
            source: 'web-game-route',
            gameSlug: params.game.slug,
            levelNumber: params.level?.levelNumber ?? null,
            completed: params.completion.completed,
            roundsCompleted: params.completion.roundsCompleted ?? null,
            summaryMetrics: params.completion.summaryMetrics ?? null,
          },
        },
      },
    });

    if (error) {
      return { status: 'failed', errorMessage: error.message };
    }

    if (typeof data?.error === 'string') {
      return { status: 'failed', errorMessage: data.error };
    }

    if (!data?.sessionId || !data?.attemptId) {
      return {
        status: 'failed',
        errorMessage: 'Attempt persistence response was missing identifiers.',
      };
    }

    return {
      status: 'persisted',
      sessionId: data.sessionId,
      attemptId: data.attemptId,
    };
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Attempt persistence failed unexpectedly.',
    };
  }
}
