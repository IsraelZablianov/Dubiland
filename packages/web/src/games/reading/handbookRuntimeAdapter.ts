import type { HandbookMediaAssetSlot } from '@/games/reading/HandbookPageRenderer';

const DEFAULT_LAYOUT_KIND = 'picture_book';

export interface HandbookRuntimePageRow {
  page_number: number | null;
  layout_kind: string | null;
  blocks_json: unknown;
  interactions_json: unknown;
  narration_key: string | null;
  estimated_read_sec: number | null;
}

export interface HandbookRuntimeMediaAssetRow {
  id: string | null;
  storage_path: string | null;
  sort_order: number | null;
}

export interface HandbookRuntimeChoice {
  id: string;
  labelKey: string;
  isCorrect: boolean;
  audioKey?: string;
}

export interface HandbookRuntimeInteraction {
  id: string;
  required: boolean;
  promptKey: string | null;
  hintKey: string | null;
  successKey: string | null;
  retryKey: string | null;
  choices: HandbookRuntimeChoice[];
}

export interface HandbookRuntimePage {
  pageId: string;
  pageNumber: number;
  layoutKind: string;
  narrationKey: string | null;
  estimatedReadSec: number | null;
  blocks: unknown[];
  interactions: HandbookRuntimeInteraction[];
}

export interface HandbookRuntimeContent {
  pages: HandbookRuntimePage[];
  mediaAssets: HandbookMediaAssetSlot[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAssetPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function normalizePageNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.floor(value);
  if (rounded < 1) {
    return null;
  }

  return rounded;
}

function toPageId(pageNumber: number): string {
  return `p${String(pageNumber).padStart(2, '0')}`;
}

function normalizeBlocks(rawBlocks: unknown): unknown[] {
  if (!Array.isArray(rawBlocks)) {
    return [];
  }

  return rawBlocks.filter((block) => isRecord(block));
}

function normalizeInteraction(rawInteraction: unknown): HandbookRuntimeInteraction | null {
  if (!isRecord(rawInteraction)) {
    return null;
  }

  const interactionId =
    asTrimmedString(rawInteraction.id) ??
    asTrimmedString(rawInteraction.interactionId) ??
    asTrimmedString(rawInteraction.interaction);

  if (!interactionId) {
    return null;
  }

  const required = typeof rawInteraction.required === 'boolean' ? rawInteraction.required : true;
  const promptKey =
    asTrimmedString(rawInteraction.promptKey) ??
    asTrimmedString(rawInteraction.questionKey) ??
    asTrimmedString(rawInteraction.prompt);
  const hintKey = asTrimmedString(rawInteraction.hintKey) ?? asTrimmedString(rawInteraction.hint);
  const successKey = asTrimmedString(rawInteraction.successKey) ?? asTrimmedString(rawInteraction.success);
  const retryKey = asTrimmedString(rawInteraction.retryKey) ?? asTrimmedString(rawInteraction.retry);
  const rawChoices = Array.isArray(rawInteraction.choices)
    ? rawInteraction.choices
    : Array.isArray(rawInteraction.options)
      ? rawInteraction.options
      : [];
  let choices = normalizeChoices(rawChoices);
  const targetWordKey =
    asTrimmedString(rawInteraction.targetWordKey) ??
    asTrimmedString(rawInteraction.wordKey) ??
    asTrimmedString(rawInteraction.mainWordKey);
  const targetWordAudioKey =
    asTrimmedString(rawInteraction.targetWordAudioKey) ??
    asTrimmedString(rawInteraction.wordAudioKey) ??
    asTrimmedString(rawInteraction.mainWordAudioKey);

  if (targetWordKey) {
    const hasTargetWordChoice = choices.some((choice) => choice.labelKey === targetWordKey);
    if (!hasTargetWordChoice) {
      const fallbackChoiceId =
        asTrimmedString(rawInteraction.targetWordId) ??
        asTrimmedString(rawInteraction.wordId) ??
        'target-word';
      choices = [
        {
          id: fallbackChoiceId,
          labelKey: targetWordKey,
          isCorrect: true,
          audioKey: targetWordAudioKey ?? undefined,
        },
        ...choices,
      ];
    } else {
      choices = choices.map((choice) =>
        choice.labelKey === targetWordKey
          ? {
              ...choice,
              isCorrect: true,
              audioKey: choice.audioKey ?? targetWordAudioKey ?? undefined,
            }
          : choice,
      );
    }
  }

  return {
    id: interactionId,
    required,
    promptKey,
    hintKey,
    successKey,
    retryKey,
    choices,
  };
}

function normalizeInteractions(rawInteractions: unknown): HandbookRuntimeInteraction[] {
  if (!Array.isArray(rawInteractions)) {
    return [];
  }

  const byId = new Map<string, HandbookRuntimeInteraction>();

  rawInteractions.forEach((rawInteraction) => {
    const normalized = normalizeInteraction(rawInteraction);
    if (!normalized || byId.has(normalized.id)) {
      return;
    }
    byId.set(normalized.id, normalized);
  });

  return Array.from(byId.values());
}

function normalizeChoice(rawChoice: unknown): HandbookRuntimeChoice | null {
  if (!isRecord(rawChoice)) {
    return null;
  }

  const choiceId =
    asTrimmedString(rawChoice.id) ??
    asTrimmedString(rawChoice.choiceId) ??
    asTrimmedString(rawChoice.value);
  const labelKey =
    asTrimmedString(rawChoice.labelKey) ??
    asTrimmedString(rawChoice.textKey) ??
    asTrimmedString(rawChoice.key) ??
    asTrimmedString(rawChoice.i18nKey) ??
    asTrimmedString(rawChoice.wordKey);
  if (!choiceId || !labelKey) {
    return null;
  }

  const isCorrect = typeof rawChoice.isCorrect === 'boolean'
    ? rawChoice.isCorrect
    : typeof rawChoice.correct === 'boolean'
      ? rawChoice.correct
      : typeof rawChoice.isTarget === 'boolean'
        ? rawChoice.isTarget
        : false;

  return {
    id: choiceId,
    labelKey,
    isCorrect,
    audioKey: asTrimmedString(rawChoice.audioKey) ?? undefined,
  };
}

function normalizeChoices(rawChoices: unknown[]): HandbookRuntimeChoice[] {
  const byId = new Map<string, HandbookRuntimeChoice>();
  rawChoices.forEach((rawChoice) => {
    const normalized = normalizeChoice(rawChoice);
    if (!normalized || byId.has(normalized.id)) {
      return;
    }
    byId.set(normalized.id, normalized);
  });

  return Array.from(byId.values());
}

function normalizeEstimatedReadSeconds(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

function normalizePages(rows: HandbookRuntimePageRow[]): HandbookRuntimePage[] {
  const normalizedRows = rows
    .map((row) => {
      const pageNumber = normalizePageNumber(row.page_number);
      if (!pageNumber) {
        return null;
      }

      return {
        pageId: toPageId(pageNumber),
        pageNumber,
        layoutKind: asTrimmedString(row.layout_kind) ?? DEFAULT_LAYOUT_KIND,
        narrationKey: asTrimmedString(row.narration_key),
        estimatedReadSec: normalizeEstimatedReadSeconds(row.estimated_read_sec),
        blocks: normalizeBlocks(row.blocks_json),
        interactions: normalizeInteractions(row.interactions_json),
      };
    })
    .filter((row): row is HandbookRuntimePage => Boolean(row));

  normalizedRows.sort((left, right) => left.pageNumber - right.pageNumber);
  return normalizedRows;
}

function normalizeSortOrder(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return value;
}

function normalizeMediaAssets(rows: HandbookRuntimeMediaAssetRow[]): HandbookMediaAssetSlot[] {
  const sortedRows = [...rows].sort((left, right) => {
    const leftOrder = normalizeSortOrder(left.sort_order);
    const rightOrder = normalizeSortOrder(right.sort_order);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftPath = asTrimmedString(left.storage_path) ?? '';
    const rightPath = asTrimmedString(right.storage_path) ?? '';
    if (leftPath !== rightPath) {
      return leftPath.localeCompare(rightPath);
    }

    const leftId = asTrimmedString(left.id) ?? '';
    const rightId = asTrimmedString(right.id) ?? '';
    return leftId.localeCompare(rightId);
  });

  const dedupeKeys = new Set<string>();
  const normalized: HandbookMediaAssetSlot[] = [];

  sortedRows.forEach((row) => {
    const id = asTrimmedString(row.id);
    const storagePath = asTrimmedString(row.storage_path);

    if (!id && !storagePath) {
      return;
    }

    const normalizedStoragePath = storagePath ? normalizeAssetPath(storagePath) : null;
    const dedupeKey = id ?? normalizedStoragePath;

    if (!dedupeKey || dedupeKeys.has(dedupeKey)) {
      return;
    }

    dedupeKeys.add(dedupeKey);
    normalized.push({
      id: id ?? null,
      storagePath: normalizedStoragePath,
      publicUrl: null,
    });
  });

  return normalized;
}

export function normalizeHandbookRuntimeContent(input: {
  pages: HandbookRuntimePageRow[] | null | undefined;
  mediaAssets: HandbookRuntimeMediaAssetRow[] | null | undefined;
}): HandbookRuntimeContent | null {
  const normalizedPages = normalizePages(input.pages ?? []);
  if (normalizedPages.length === 0) {
    return null;
  }

  return {
    pages: normalizedPages,
    mediaAssets: normalizeMediaAssets(input.mediaAssets ?? []),
  };
}
