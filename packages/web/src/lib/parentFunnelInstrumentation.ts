import type { SupabaseClient } from '@supabase/supabase-js';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

export type ParentFunnelEventName =
  | 'landing_page_view'
  | 'landing_primary_cta_click'
  | 'parents_page_view'
  | 'parents_to_login_cta_click'
  | 'login_page_view'
  | 'login_entry_action'
  | 'profile_entry_completed';

export type ParentFunnelAuthMode = 'guest' | 'authenticated' | 'unknown';

interface ParentFunnelEventMetadata {
  [key: string]: unknown;
}

interface ParentFunnelEventPayload {
  sourcePath: string;
  targetPath?: string | null;
  ctaId?: string | null;
  entryMethod?: string | null;
  authMode?: ParentFunnelAuthMode;
  metadata?: ParentFunnelEventMetadata;
}

interface QueuedParentFunnelEvent {
  clientEventId: string;
  sessionId: string;
  eventName: ParentFunnelEventName;
  sourcePath: string;
  targetPath: string | null;
  ctaId: string | null;
  entryMethod: string | null;
  authMode: ParentFunnelAuthMode;
  metadata: ParentFunnelEventMetadata;
  occurredAt: string;
}

const QUEUE_SESSION_STORAGE_KEY = 'dubiland.parentFunnelEventQueue.v1';
const SESSION_ID_STORAGE_KEY = 'dubiland.parentFunnelSessionId.v1';
const SINK_DISABLED_SESSION_STORAGE_KEY = 'dubiland.parentFunnelSinkDisabled.v1';
const MAX_QUEUE_SIZE = 64;
const FLUSH_BATCH_SIZE = 25;

let activeFlushPromise: Promise<void> | null = null;

function isParentFunnelRemoteSinkDisabled(): boolean {
  if (!canUseSessionStorage()) {
    return false;
  }
  try {
    return window.sessionStorage.getItem(SINK_DISABLED_SESSION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function disableParentFunnelRemoteSinkForSession() {
  if (!canUseSessionStorage()) {
    return;
  }
  try {
    window.sessionStorage.setItem(SINK_DISABLED_SESSION_STORAGE_KEY, '1');
  } catch {
    // Ignore storage quota / private-mode failures.
  }
}

function isMissingParentFunnelEventsSink(
  error: { code?: string; message?: string } | null,
  status: number,
): boolean {
  if (status === 404) {
    return true;
  }
  if (!error) {
    return false;
  }
  const code = error.code ?? '';
  if (code === 'PGRST205' || code === '42P01') {
    return true;
  }
  const message = typeof error.message === 'string' ? error.message : '';
  if (!message) {
    return false;
  }
  if (message.includes('parent_funnel_events')) {
    return true;
  }
  return /could not find the table/i.test(message) && /parent_funnel/i.test(message);
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
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

function resolveQueue(): QueuedParentFunnelEvent[] {
  if (!canUseSessionStorage()) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(QUEUE_SESSION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as QueuedParentFunnelEvent[];
  } catch {
    return [];
  }
}

function persistQueue(queue: QueuedParentFunnelEvent[]) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    if (queue.length === 0) {
      window.sessionStorage.removeItem(QUEUE_SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(QUEUE_SESSION_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota / private-mode failures.
  }
}

function getOrCreateSessionId(): string {
  if (!canUseSessionStorage()) {
    return generateUuidV4();
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    return generateUuidV4();
  }

  const created = generateUuidV4();
  try {
    window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, created);
  } catch {
    // Ignore storage quota / private-mode failures.
  }
  return created;
}

function normalizeMetadata(metadata: ParentFunnelEventPayload['metadata']): ParentFunnelEventMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}

function enqueueEvent(event: QueuedParentFunnelEvent) {
  const queue = resolveQueue();
  queue.push(event);
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }
  persistQueue(queue);
}

async function flushQueueOnce() {
  if (!isSupabaseConfigured) {
    return;
  }

  if (isParentFunnelRemoteSinkDisabled()) {
    persistQueue([]);
    return;
  }

  const queue = resolveQueue();
  if (queue.length === 0) {
    return;
  }

  const supabase = await loadSupabaseRuntime();
  if (!supabase) {
    return;
  }

  const batch = queue.slice(0, FLUSH_BATCH_SIZE);
  const rows = batch.map((event) => ({
    client_event_id: event.clientEventId,
    session_id: event.sessionId,
    event_name: event.eventName,
    source_path: event.sourcePath,
    target_path: event.targetPath,
    cta_id: event.ctaId,
    entry_method: event.entryMethod,
    auth_mode: event.authMode,
    metadata: event.metadata,
    occurred_at: event.occurredAt,
  }));

  const rawClient = supabase as unknown as SupabaseClient;
  const { error, status } = await rawClient
    .from('parent_funnel_events')
    .upsert(rows, { onConflict: 'client_event_id', ignoreDuplicates: true });

  if (error) {
    if (isMissingParentFunnelEventsSink(error, status)) {
      disableParentFunnelRemoteSinkForSession();
      persistQueue([]);
    }
    return;
  }

  const persistedIds = new Set(batch.map((event) => event.clientEventId));
  const nextQueue = resolveQueue().filter((event) => !persistedIds.has(event.clientEventId));
  persistQueue(nextQueue);

  if (nextQueue.length > 0) {
    await flushQueueOnce();
  }
}

export function trackParentFunnelEvent(eventName: ParentFunnelEventName, payload: ParentFunnelEventPayload) {
  if (isSupabaseConfigured && isParentFunnelRemoteSinkDisabled()) {
    return;
  }

  const queuedEvent: QueuedParentFunnelEvent = {
    clientEventId: generateUuidV4(),
    sessionId: getOrCreateSessionId(),
    eventName,
    sourcePath: payload.sourcePath,
    targetPath: payload.targetPath ?? null,
    ctaId: payload.ctaId ?? null,
    entryMethod: payload.entryMethod ?? null,
    authMode: payload.authMode ?? 'unknown',
    metadata: normalizeMetadata(payload.metadata),
    occurredAt: new Date().toISOString(),
  };

  enqueueEvent(queuedEvent);
  void flushParentFunnelEventQueue();
}

export async function flushParentFunnelEventQueue() {
  if (activeFlushPromise) {
    await activeFlushPromise;
    return;
  }

  activeFlushPromise = flushQueueOnce().finally(() => {
    activeFlushPromise = null;
  });

  await activeFlushPromise;
}
