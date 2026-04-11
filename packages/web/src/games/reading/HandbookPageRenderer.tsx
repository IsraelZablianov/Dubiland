import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_HOTSPOT_X_PCT = 36;
const DEFAULT_HOTSPOT_Y_PCT = 26;
const DEFAULT_HOTSPOT_WIDTH_PCT = 28;
const DEFAULT_HOTSPOT_HEIGHT_PCT = 30;

type BlockType = 'illustration' | 'text' | 'hotspot' | 'badge';
type TextRole = 'narration' | 'prompt' | 'target' | 'body';
type TextAlign = 'start' | 'center';
type BadgeTone = 'neutral' | 'success' | 'hint';
type IllustrationFit = 'cover' | 'contain';

export interface HandbookMediaAssetSlot {
  id?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
}

export interface HandbookPageRendererProps {
  blocks: unknown;
  mediaAssets?: HandbookMediaAssetSlot[] | null;
  narrationFallbackKey: string;
  promptFallbackKey: string;
  activeInteractionId?: string | null;
  solvedInteractionIds?: ReadonlySet<string>;
  onHotspotPress?: (interactionId: string) => void;
  onAudioKeyPress?: (audioKey: string) => void;
  className?: string;
}

interface NormalizedBlockBase {
  stableKey: string;
  type: BlockType;
  sourceIndex: number;
  sortOrder: number;
}

interface IllustrationBlock extends NormalizedBlockBase {
  type: 'illustration';
  mediaAssetId: string | null;
  mediaPath: string | null;
  src: string | null;
  fallbackSrc: string | null;
  altKey: string | null;
  fit: IllustrationFit;
  xPct: number | null;
  yPct: number | null;
  widthPct: number | null;
  heightPct: number | null;
}

interface TextBlock extends NormalizedBlockBase {
  type: 'text';
  textKey: string;
  audioKey: string;
  role: TextRole;
  align: TextAlign;
}

interface HotspotBlock extends NormalizedBlockBase {
  type: 'hotspot';
  interactionId: string;
  ariaLabelKey: string | null;
  audioKey: string | null;
  required: boolean;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

interface BadgeBlock extends NormalizedBlockBase {
  type: 'badge';
  labelKey: string;
  audioKey: string;
  tone: BadgeTone;
  xPct: number | null;
  yPct: number | null;
}

type NormalizedBlock = IllustrationBlock | TextBlock | HotspotBlock | BadgeBlock;

interface MediaLookup {
  byId: Map<string, HandbookMediaAssetSlot>;
  byPath: Map<string, HandbookMediaAssetSlot>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value !== 'boolean') {
    return null;
  }

  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizePath(rawPath: string): string {
  if (/^(https?:)?\/\//.test(rawPath) || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath;
  }

  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

function maybePercent(value: unknown, fallback: number | null, min = 0, max = 100): number | null {
  const parsed = asNumber(value);
  if (parsed === null) {
    return fallback;
  }

  return clamp(parsed, min, max);
}

function buildMediaLookup(mediaAssets: HandbookMediaAssetSlot[] | null | undefined): MediaLookup {
  const byId = new Map<string, HandbookMediaAssetSlot>();
  const byPath = new Map<string, HandbookMediaAssetSlot>();

  (mediaAssets ?? []).forEach((asset) => {
    const id = asString(asset.id);
    if (id) {
      byId.set(id, asset);
    }

    const storagePath = asString(asset.storagePath);
    if (storagePath) {
      byPath.set(normalizePath(storagePath), asset);
    }
  });

  return { byId, byPath };
}

function resolveMediaSource(block: IllustrationBlock, lookup: MediaLookup): string | null {
  const src = asString(block.src);
  if (src) {
    return normalizePath(src);
  }

  const mediaAssetId = asString(block.mediaAssetId);
  if (mediaAssetId) {
    const mediaAsset = lookup.byId.get(mediaAssetId);
    const mediaAssetUrl = asString(mediaAsset?.publicUrl) ?? asString(mediaAsset?.storagePath);
    if (mediaAssetUrl) {
      return normalizePath(mediaAssetUrl);
    }
  }

  const mediaPath = asString(block.mediaPath);
  if (!mediaPath) {
    return null;
  }

  const normalizedPath = normalizePath(mediaPath);
  const mediaAsset = lookup.byPath.get(normalizedPath);
  const mediaAssetUrl = asString(mediaAsset?.publicUrl) ?? asString(mediaAsset?.storagePath);

  if (mediaAssetUrl) {
    return normalizePath(mediaAssetUrl);
  }

  return normalizedPath;
}

function normalizeTextRole(value: unknown, fallback: TextRole = 'body'): TextRole {
  const normalized = asString(value)?.toLowerCase().replace(/-/g, '_');
  if (normalized === 'narration' || normalized === 'story' || normalized === 'main') {
    return 'narration';
  }

  if (normalized === 'prompt' || normalized === 'question') {
    return 'prompt';
  }

  if (normalized === 'target' || normalized === 'target_word' || normalized === 'main_word' || normalized === 'word') {
    return 'target';
  }

  if (normalized === 'body') {
    return normalized;
  }

  return fallback;
}

function normalizeTextAlign(value: unknown, fallback: TextAlign = 'start'): TextAlign {
  const normalized = asString(value)?.toLowerCase();
  if (normalized === 'start' || normalized === 'center') {
    return normalized;
  }

  return fallback;
}

function normalizeBadgeTone(value: unknown, fallback: BadgeTone = 'neutral'): BadgeTone {
  const normalized = asString(value)?.toLowerCase();
  if (normalized === 'success' || normalized === 'hint' || normalized === 'neutral') {
    return normalized;
  }

  return fallback;
}

function normalizeIllustrationFit(value: unknown): IllustrationFit {
  return asString(value)?.toLowerCase() === 'contain' ? 'contain' : 'cover';
}

function normalizeType(value: unknown): BlockType | null {
  const normalized = asString(value)?.toLowerCase().replace(/-/g, '_');
  if (
    normalized === 'illustration' ||
    normalized === 'image' ||
    normalized === 'media' ||
    normalized === 'picture'
  ) {
    return 'illustration';
  }

  if (
    normalized === 'text' ||
    normalized === 'prompt' ||
    normalized === 'question' ||
    normalized === 'question_text' ||
    normalized === 'target_word' ||
    normalized === 'targetword' ||
    normalized === 'main_word' ||
    normalized === 'mainword' ||
    normalized === 'word'
  ) {
    return 'text';
  }

  if (normalized === 'hotspot' || normalized === 'interaction_zone' || normalized === 'tap_zone') {
    return 'hotspot';
  }

  if (normalized === 'badge' || normalized === 'chip' || normalized === 'label') {
    return 'badge';
  }

  return null;
}

function parseSortOrder(block: Record<string, unknown>, sourceIndex: number): number {
  const sortOrder = asNumber(block.order) ?? asNumber(block.sortOrder);
  if (sortOrder === null) {
    return sourceIndex;
  }

  return sortOrder;
}

function parseStableKey(type: BlockType, block: Record<string, unknown>, sourceIndex: number, sortOrder: number): string {
  const explicitId = asString(block.id);
  if (explicitId) {
    return explicitId;
  }

  return `${type}-${sortOrder}-${sourceIndex}`;
}

function normalizeBlock(raw: unknown, sourceIndex: number): NormalizedBlock | null {
  if (!isRecord(raw)) {
    return null;
  }

  const rawType = asString(raw.type)?.toLowerCase().replace(/-/g, '_');
  const type = normalizeType(raw.type);
  if (!type) {
    return null;
  }

  const sortOrder = parseSortOrder(raw, sourceIndex);
  const stableKey = parseStableKey(type, raw, sourceIndex, sortOrder);

  if (type === 'illustration') {
    return {
      type,
      stableKey,
      sourceIndex,
      sortOrder,
      mediaAssetId: asString(raw.mediaAssetId) ?? asString(raw.assetId),
      mediaPath: asString(raw.mediaPath) ?? asString(raw.storagePath) ?? asString(raw.path),
      src: asString(raw.src) ?? asString(raw.url),
      fallbackSrc: asString(raw.fallbackSrc) ?? asString(raw.fallbackUrl),
      altKey: asString(raw.altKey) ?? asString(raw.ariaLabelKey),
      fit: normalizeIllustrationFit(raw.fit),
      xPct: maybePercent(raw.xPct ?? raw.x, null),
      yPct: maybePercent(raw.yPct ?? raw.y, null),
      widthPct: maybePercent(raw.widthPct ?? raw.width, null, 8, 100),
      heightPct: maybePercent(raw.heightPct ?? raw.height, null, 8, 100),
    };
  }

  if (type === 'text') {
    const textKey =
      asString(raw.key) ??
      asString(raw.textKey) ??
      asString(raw.i18nKey) ??
      asString(raw.promptKey) ??
      asString(raw.questionKey) ??
      asString(raw.targetWordKey) ??
      asString(raw.mainWordKey) ??
      asString(raw.wordKey);
    if (!textKey) {
      return null;
    }

    const inferredFallbackRole: TextRole = rawType === 'target_word' || rawType === 'main_word' || rawType === 'word'
      ? 'target'
      : rawType === 'question' || rawType === 'question_text' || rawType === 'prompt'
        ? 'prompt'
        : 'body';
    const role = normalizeTextRole(raw.role ?? raw.textRole, inferredFallbackRole);

    return {
      type,
      stableKey,
      sourceIndex,
      sortOrder,
      textKey,
      audioKey: asString(raw.audioKey) ?? textKey,
      role,
      align: normalizeTextAlign(raw.align, role === 'prompt' ? 'center' : 'start'),
    };
  }

  if (type === 'hotspot') {
    const interactionId = asString(raw.interactionId) ?? asString(raw.targetInteractionId) ?? asString(raw.interaction);
    if (!interactionId) {
      return null;
    }

    return {
      type,
      stableKey,
      sourceIndex,
      sortOrder,
      interactionId,
      ariaLabelKey: asString(raw.ariaLabelKey) ?? asString(raw.labelKey) ?? asString(raw.promptKey),
      audioKey: asString(raw.audioKey),
      required: asBoolean(raw.required) ?? true,
      xPct: maybePercent(raw.xPct ?? raw.x, DEFAULT_HOTSPOT_X_PCT) ?? DEFAULT_HOTSPOT_X_PCT,
      yPct: maybePercent(raw.yPct ?? raw.y, DEFAULT_HOTSPOT_Y_PCT) ?? DEFAULT_HOTSPOT_Y_PCT,
      widthPct: maybePercent(raw.widthPct ?? raw.width, DEFAULT_HOTSPOT_WIDTH_PCT, 8, 100) ?? DEFAULT_HOTSPOT_WIDTH_PCT,
      heightPct: maybePercent(raw.heightPct ?? raw.height, DEFAULT_HOTSPOT_HEIGHT_PCT, 8, 100) ?? DEFAULT_HOTSPOT_HEIGHT_PCT,
    };
  }

  const labelKey = asString(raw.key) ?? asString(raw.labelKey) ?? asString(raw.textKey);
  if (!labelKey) {
    return null;
  }

  return {
    type,
    stableKey,
    sourceIndex,
    sortOrder,
    labelKey,
    audioKey: asString(raw.audioKey) ?? labelKey,
    tone: normalizeBadgeTone(raw.tone),
    xPct: maybePercent(raw.xPct ?? raw.x, null),
    yPct: maybePercent(raw.yPct ?? raw.y, null),
  };
}

function normalizeBlocks(rawBlocks: unknown, narrationFallbackKey: string, promptFallbackKey: string): NormalizedBlock[] {
  const sourceBlocks = Array.isArray(rawBlocks) ? rawBlocks : [];

  const normalizedBlocks = sourceBlocks
    .map((block, sourceIndex) => normalizeBlock(block, sourceIndex))
    .filter((block): block is NormalizedBlock => Boolean(block));

  const hasNarrationText = normalizedBlocks.some((block) => block.type === 'text' && block.role === 'narration');
  const hasPromptText = normalizedBlocks.some((block) => block.type === 'text' && block.role === 'prompt');

  if (!hasNarrationText) {
    normalizedBlocks.push({
      type: 'text',
      stableKey: 'fallback-narration',
      sourceIndex: 10_000,
      sortOrder: 10_000,
      textKey: narrationFallbackKey,
      audioKey: narrationFallbackKey,
      role: 'narration',
      align: 'start',
    });
  }

  if (!hasPromptText) {
    normalizedBlocks.push({
      type: 'text',
      stableKey: 'fallback-prompt',
      sourceIndex: 10_001,
      sortOrder: 10_001,
      textKey: promptFallbackKey,
      audioKey: promptFallbackKey,
      role: 'prompt',
      align: 'center',
    });
  }

  return normalizedBlocks.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.sourceIndex - right.sourceIndex;
  });
}

export function normalizeHandbookRendererBlocks(
  rawBlocks: unknown,
  narrationFallbackKey: string,
  promptFallbackKey: string,
): NormalizedBlock[] {
  return normalizeBlocks(rawBlocks, narrationFallbackKey, promptFallbackKey);
}

function illustrationPlacementStyle(block: IllustrationBlock): CSSProperties | undefined {
  const hasPlacement =
    block.xPct !== null || block.yPct !== null || block.widthPct !== null || block.heightPct !== null;

  if (!hasPlacement) {
    return undefined;
  }

  return {
    insetInlineEnd: `${block.xPct ?? 0}%`,
    insetBlockStart: `${block.yPct ?? 0}%`,
    inlineSize: `${block.widthPct ?? 100}%`,
    blockSize: `${block.heightPct ?? 100}%`,
  };
}

function hotspotPlacementStyle(block: HotspotBlock): CSSProperties {
  return {
    insetInlineEnd: `${block.xPct}%`,
    insetBlockStart: `${block.yPct}%`,
    inlineSize: `${block.widthPct}%`,
    blockSize: `${block.heightPct}%`,
  };
}

function badgePlacementStyle(block: BadgeBlock): CSSProperties | undefined {
  if (block.xPct === null || block.yPct === null) {
    return undefined;
  }

  return {
    position: 'absolute',
    insetInlineEnd: `${block.xPct}%`,
    insetBlockStart: `${block.yPct}%`,
  };
}

export function HandbookPageRenderer({
  blocks,
  mediaAssets,
  narrationFallbackKey,
  promptFallbackKey,
  activeInteractionId = null,
  solvedInteractionIds,
  onHotspotPress,
  onAudioKeyPress,
  className,
}: HandbookPageRendererProps) {
  const { t } = useTranslation('common');

  const mediaLookup = useMemo(() => buildMediaLookup(mediaAssets), [mediaAssets]);

  const normalizedBlocks = useMemo(
    () => normalizeBlocks(blocks, narrationFallbackKey, promptFallbackKey),
    [blocks, narrationFallbackKey, promptFallbackKey],
  );

  const illustrationBlocks = normalizedBlocks.filter((block): block is IllustrationBlock => block.type === 'illustration');
  const textBlocks = useMemo(() => {
    const rawTextBlocks = normalizedBlocks.filter((block): block is TextBlock => block.type === 'text');
    const hasTarget = rawTextBlocks.some((block) => block.role === 'target');
    if (!hasTarget) {
      return rawTextBlocks;
    }

    const rolePriority: Record<TextRole, number> = {
      target: 0,
      narration: 1,
      body: 2,
      prompt: 3,
    };

    return [...rawTextBlocks].sort((left, right) => {
      const priorityDiff = rolePriority[left.role] - rolePriority[right.role];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.sourceIndex - right.sourceIndex;
    });
  }, [normalizedBlocks]);
  const hasTargetWordText = textBlocks.some((block) => block.role === 'target');
  const badgeBlocks = normalizedBlocks.filter((block): block is BadgeBlock => block.type === 'badge');
  const hotspotBlocks = normalizedBlocks.filter((block): block is HotspotBlock => block.type === 'hotspot');

  const effectiveHotspots = useMemo(() => {
    if (!activeInteractionId) {
      return hotspotBlocks;
    }

    const hasActiveHotspot = hotspotBlocks.some((block) => block.interactionId === activeInteractionId);
    if (hasActiveHotspot) {
      return hotspotBlocks;
    }

    return [
      ...hotspotBlocks,
      {
        type: 'hotspot' as const,
        stableKey: `fallback-hotspot-${activeInteractionId}`,
        sourceIndex: 20_000,
        sortOrder: 20_000,
        interactionId: activeInteractionId,
        ariaLabelKey: 'games.interactiveHandbook.instructions.tapChoice',
        audioKey: null,
        required: true,
        xPct: DEFAULT_HOTSPOT_X_PCT,
        yPct: DEFAULT_HOTSPOT_Y_PCT,
        widthPct: DEFAULT_HOTSPOT_WIDTH_PCT,
        heightPct: DEFAULT_HOTSPOT_HEIGHT_PCT,
      },
    ];
  }, [activeInteractionId, hotspotBlocks]);

  const containerClassName = ['interactive-handbook__page-renderer', className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      <div className="interactive-handbook__page-frame">
        <div className="interactive-handbook__illustration-stage">
          {illustrationBlocks.length > 0 ? (
            illustrationBlocks.map((block, blockIndex) => {
              const imageSource = resolveMediaSource(block, mediaLookup);
              const fallbackSource = block.fallbackSrc ? normalizePath(block.fallbackSrc) : null;
              const placementStyle = illustrationPlacementStyle(block);
              const imageAltKey = block.altKey ?? narrationFallbackKey;

              return (
                <figure
                  key={`${block.stableKey}-${block.sourceIndex}`}
                  className={[
                    'interactive-handbook__illustration-node',
                    placementStyle ? 'interactive-handbook__illustration-node--positioned' : '',
                    blockIndex === 0 && !placementStyle ? 'interactive-handbook__illustration-node--base' : '',
                  ].join(' ')}
                  style={placementStyle}
                >
                  {imageSource ? (
                    <img
                      className="interactive-handbook__illustration-media"
                      src={imageSource}
                      alt={t(imageAltKey as any)}
                      width={1600}
                      height={1000}
                      loading={blockIndex === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={blockIndex === 0 ? 'high' : 'low'}
                      onError={(event) => {
                        if (!fallbackSource || event.currentTarget.src.endsWith(fallbackSource)) {
                          return;
                        }
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackSource;
                      }}
                      style={{ objectFit: block.fit }}
                    />
                  ) : (
                    <div className="interactive-handbook__illustration-fallback" aria-label={t(imageAltKey as any)} />
                  )}
                </figure>
              );
            })
          ) : (
            <div
              className="interactive-handbook__illustration-fallback interactive-handbook__illustration-fallback--empty"
              aria-label={t(narrationFallbackKey as any)}
            />
          )}

          {effectiveHotspots.map((block) => {
            const isActive = activeInteractionId !== null && block.interactionId === activeInteractionId;
            const isSolved = solvedInteractionIds?.has(block.interactionId) ?? false;

            return (
              <button
                key={`${block.stableKey}-${block.sourceIndex}`}
                type="button"
                className={[
                  'interactive-handbook__interaction-zone',
                  isActive ? 'is-active' : '',
                  isSolved ? 'is-solved' : '',
                  block.required ? 'is-required' : '',
                ].join(' ')}
                style={hotspotPlacementStyle(block)}
                aria-label={t((block.ariaLabelKey ?? 'games.interactiveHandbook.instructions.tapChoice') as any)}
                onClick={() => {
                  if (onHotspotPress) {
                    onHotspotPress(block.interactionId);
                    return;
                  }

                  if (block.audioKey) {
                    onAudioKeyPress?.(block.audioKey);
                  }
                }}
              >
                <span className="interactive-handbook__interaction-zone-ring" aria-hidden="true" />
              </button>
            );
          })}

          {badgeBlocks.length > 0 && (
            <div className="interactive-handbook__badge-layer">
              {badgeBlocks.map((block) => {
                const badgeClassName = [
                  'interactive-handbook__badge-block',
                  `interactive-handbook__badge-block--${block.tone}`,
                ].join(' ');
                const placementStyle = badgePlacementStyle(block);
                const badgeLabel = t(block.labelKey as any);

                if (!onAudioKeyPress) {
                  return (
                    <p
                      key={`${block.stableKey}-${block.sourceIndex}`}
                      className={badgeClassName}
                      style={placementStyle}
                    >
                      {badgeLabel}
                    </p>
                  );
                }

                return (
                  <button
                    key={`${block.stableKey}-${block.sourceIndex}`}
                    type="button"
                    className={`${badgeClassName} interactive-handbook__badge-block--button`}
                    style={placementStyle}
                    onClick={() => onAudioKeyPress(block.audioKey)}
                    aria-label={badgeLabel}
                  >
                    {badgeLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`interactive-handbook__text-strip ${hasTargetWordText ? 'is-word-focus' : ''}`.trim()}>
          {textBlocks.map((block) => {
            const textContent = t(block.textKey as any);
            const textClassName = [
              'interactive-handbook__text-block',
              `interactive-handbook__text-block--${block.role}`,
              `interactive-handbook__text-block--${block.align}`,
            ].join(' ');

            if (!onAudioKeyPress) {
              return (
                <p key={`${block.stableKey}-${block.sourceIndex}`} className={textClassName}>
                  {textContent}
                </p>
              );
            }

            return (
              <button
                key={`${block.stableKey}-${block.sourceIndex}`}
                type="button"
                className={`${textClassName} interactive-handbook__text-replay`}
                onClick={() => onAudioKeyPress(block.audioKey)}
                aria-label={textContent}
              >
                {textContent}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
