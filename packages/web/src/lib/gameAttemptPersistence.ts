import { FunctionsHttpError, type Session } from '@supabase/supabase-js';
import type { Game, GameLevel } from '@dubiland/shared';
import type { GameCompletionResult } from '@/games/engine';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { buildParentMetricsV1 } from '@/lib/parentMetricsAdapter';
import { isSupabaseConfigured, supabaseConfig } from '@/lib/supabaseConfig';

type PersistableAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
type PersistSkipReason = 'supabase_not_configured' | 'child_not_persistable';

interface PersistGameAttemptParams {
  childId: string;
  childAgeBand?: PersistableAgeBand;
  game: Pick<Game, 'id' | 'slug'> & Partial<Pick<Game, 'topicId'>>;
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

/** Use after `persistGameAttempt`: skips that mean nothing reached Supabase should show the error/retry UI. */
export function persistOutcomeRequiresErrorUi(outcome: PersistGameAttemptOutcome): boolean {
  if (outcome.status === 'failed') {
    return true;
  }
  return outcome.status === 'skipped' && outcome.reason === 'child_not_persistable';
}

function devWarnPersistSkipped(reason: PersistSkipReason, context: { childId: string; gameSlug: string }) {
  if (!import.meta.env.DEV) {
    return;
  }

  if (reason === 'supabase_not_configured') {
    console.warn(
      '[Dubiland] persistGameAttempt skipped (no HTTP): Supabase env missing for this dev server. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (repo root .env).',
      context,
    );
    return;
  }

  console.warn(
    '[Dubiland] persistGameAttempt skipped (no submit-game-attempt): active child id must be a UUID from the children table. Open /profiles and pick your child, or clear stale dubiland:active-child in localStorage.',
    context,
  );
}

interface SubmitGameAttemptResponse {
  sessionId?: string;
  attemptId?: string;
  error?: string;
}

type SupabaseRuntime = NonNullable<Awaited<ReturnType<typeof loadSupabaseRuntime>>>;

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

async function resolvePersistedGameId(
  supabase: SupabaseRuntime,
  game: Pick<Game, 'id' | 'slug'>,
): Promise<string | null> {
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
  supabase: SupabaseRuntime,
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

/** Decode JWT payload (no signature verify) — browser only. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function projectRefFromSupabaseUrl(rawUrl: string): string | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    const m = /^([a-z0-9-]+)\.supabase\.co$/.exec(host);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function projectRefFromJwtIssuer(iss: string): string | null {
  const m = /^https:\/\/([a-z0-9-]+)\.supabase\.co\/auth\/v1\/?$/i.exec(iss.trim());
  return m?.[1] ?? null;
}

async function edgeFunctionFailureMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const json = (await error.context.clone().json()) as { message?: string };
      if (typeof json.message === 'string' && json.message.trim()) {
        return json.message.trim();
      }
    } catch {
      // ignore parse errors
    }
    return `Edge function HTTP ${error.context.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

function isFunctionsHttp401(error: unknown): boolean {
  return (
    error instanceof FunctionsHttpError &&
    error.context instanceof Response &&
    error.context.status === 401
  );
}

export async function persistGameAttempt(params: PersistGameAttemptParams): Promise<PersistGameAttemptOutcome> {
  const devContext = { childId: params.childId, gameSlug: params.game.slug };

  if (!isSupabaseConfigured) {
    devWarnPersistSkipped('supabase_not_configured', devContext);
    return { status: 'skipped', reason: 'supabase_not_configured' };
  }

  if (!isUuid(params.childId)) {
    devWarnPersistSkipped('child_not_persistable', devContext);
    return { status: 'skipped', reason: 'child_not_persistable' };
  }

  try {
    const supabase = await loadSupabaseRuntime();
    if (!supabase) {
      devWarnPersistSkipped('supabase_not_configured', devContext);
      return { status: 'skipped', reason: 'supabase_not_configured' };
    }

    const gameId = await resolvePersistedGameId(supabase, params.game);
    if (!gameId) {
      return {
        status: 'failed',
        errorMessage: 'Game row was not found for telemetry persistence.',
      };
    }

    const levelId = await resolvePersistedLevelId(supabase, gameId, params.level);
    const attemptId = isUuid(params.attemptId) ? params.attemptId : createGameAttemptId();
    const parentMetricsV1 = buildParentMetricsV1({
      game: params.game,
      completion: params.completion,
      childAgeBand: params.childAgeBand,
    });

    // Edge function uses verify_jwt=true: gateway validates Authorization Bearer (user access_token).
    // Do not override apikey here — let the Supabase client merge defaults; overriding broke some prod setups.
    const { error: userError } = await supabase.auth.getUser();
    let session: Session | null = null;
    if (userError) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) {
        return {
          status: 'failed',
          errorMessage:
            'Sign-in session is invalid or expired (Invalid JWT). Sign out, sign in with Google again, then open /profiles. If it persists, your browser session may be for a different Supabase project than VITE_SUPABASE_URL in .env.',
        };
      }
      session = refreshed.session;
    } else {
      const { data: sessionData, error: sessionReadError } = await supabase.auth.getSession();
      if (sessionReadError) {
        return {
          status: 'failed',
          errorMessage: `Could not read auth session (${sessionReadError.message}). Try signing out and in again.`,
        };
      }
      session = sessionData.session;
    }
    if (session?.expires_at) {
      const expiresAtMs = session.expires_at * 1000;
      if (expiresAtMs < Date.now() + 120_000) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed.session) {
          session = refreshed.session;
        }
      }
    }

    const accessToken = session?.access_token?.trim() ?? '';
    if (!accessToken) {
      return {
        status: 'failed',
        errorMessage:
          'Progress sync needs a signed-in parent. Open /login, sign in with Google, then continue from /profiles.',
      };
    }

    const configuredRef = projectRefFromSupabaseUrl(supabaseConfig.url ?? '');
    const payload = decodeJwtPayload(accessToken);
    const iss = typeof payload?.iss === 'string' ? payload.iss : '';
    const refClaim = typeof payload?.ref === 'string' ? payload.ref.trim().toLowerCase() : null;
    const jwtRefFromIss = projectRefFromJwtIssuer(iss);
    const jwtRef = refClaim ?? jwtRefFromIss;
    if (configuredRef && jwtRef && configuredRef !== jwtRef) {
      return {
        status: 'failed',
        errorMessage: `Supabase project mismatch: this build uses "${configuredRef}" but your session is for "${jwtRef}". Sign out, update VITE_SUPABASE_URL / anon key to that project (or sign into the matching account), then sign in again.`,
      };
    }

    // Long play sessions: access token can expire before onComplete; refresh immediately before invoke.
    const { data: rotated, error: rotateErr } = await supabase.auth.refreshSession();
    if (!rotateErr && rotated.session?.access_token) {
      session = rotated.session;
    }
    const tokenForInvoke = session?.access_token?.trim() ?? '';
    if (!tokenForInvoke) {
      return {
        status: 'failed',
        errorMessage: 'Could not obtain a valid access token after refresh. Sign out and sign in again.',
      };
    }

    const invokeBody = {
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
          parentMetricsV1,
        },
      },
    };

    const invokeSubmit = (bearer: string) =>
      supabase.functions.invoke<SubmitGameAttemptResponse>('submit-game-attempt', {
        headers: { Authorization: `Bearer ${bearer}` },
        body: invokeBody,
      });

    let { data, error } = await invokeSubmit(tokenForInvoke);

    if (error && isFunctionsHttp401(error)) {
      const { data: retrySession, error: retryErr } = await supabase.auth.refreshSession();
      const retryToken = retrySession.session?.access_token?.trim();
      if (!retryErr && retryToken) {
        ({ data, error } = await invokeSubmit(retryToken));
      }
    }

    if (error) {
      return { status: 'failed', errorMessage: await edgeFunctionFailureMessage(error) };
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
