interface RecordLike {
  [key: string]: unknown;
}

export const BLEND_TO_READ_EPISODE_ORDER = [
  'episode-01-cv-patah',
  'episode-02-cv-segol',
  'episode-03-cv-hirik',
  'episode-04-cvc-bridge',
  'episode-05-word-transfer',
  'episode-06-challenge',
] as const;

export type BlendToReadEpisodeId = (typeof BLEND_TO_READ_EPISODE_ORDER)[number];
export type BlendToReadCheckpointType = 'tapAudio' | 'chooseSyllable' | 'chooseWord';
export type BlendToReadCheckpointId = 'one' | 'two' | 'three';
export type BlendToReadCheckpointScene = 'checkpointOne' | 'checkpointTwo' | 'checkpointThree';

export interface BlendToReadCheckpointCue {
  id: BlendToReadCheckpointId;
  type: BlendToReadCheckpointType;
  scene: BlendToReadCheckpointScene;
  sceneStartFrame: number;
  responseStartFrame: number;
  responseEndFrame: number;
}

export interface BlendToReadChoice {
  id: string;
  textKey: string;
  audioKey: string;
  isCorrect: boolean;
}

export interface BlendToReadRuntimeCheckpoint {
  id: BlendToReadCheckpointId;
  type: BlendToReadCheckpointType;
  promptKey: string;
  cue: BlendToReadCheckpointCue;
  choices: [BlendToReadChoice, BlendToReadChoice, BlendToReadChoice];
  reducedChoices: [BlendToReadChoice, BlendToReadChoice];
}

export interface BlendToReadRuntimeEpisode {
  id: BlendToReadEpisodeId;
  compositionId: string;
  videoUrl: string;
  titleKey: string;
  focusPatternKey: string;
  recapNarrationKey: string;
  checkpoints: [BlendToReadRuntimeCheckpoint, BlendToReadRuntimeCheckpoint, BlendToReadRuntimeCheckpoint];
}

export interface BlendToReadRuntimeConfig {
  fps: number;
  episodes: BlendToReadRuntimeEpisode[];
  shared: {
    titleKey: string;
    replayPromptKey: string;
    checkpointPromptKey: string;
    recapPromptKey: string;
    hints: {
      replaySegmentKey: string;
      pathHighlightKey: string;
      reducedChoicesKey: string;
    };
    feedback: {
      successKey: string;
      retryKey: string;
    };
  };
}

interface EpisodeLexicon {
  syllableKey: string;
  wordKey: string;
  focusPatternKey: string;
  checkpointTypes: [BlendToReadCheckpointType, BlendToReadCheckpointType, BlendToReadCheckpointType];
}

const SHARED_KEYS = {
  titleKey: 'videos.blendToRead.title',
  replayPromptKey: 'videos.blendToRead.instructions.replayPrompt',
  checkpointPromptKey: 'videos.blendToRead.instructions.checkpointPrompt',
  recapPromptKey: 'videos.blendToRead.instructions.recapPrompt',
  hints: {
    replaySegmentKey: 'videos.blendToRead.hints.replaySegment',
    pathHighlightKey: 'videos.blendToRead.hints.pathHighlight',
    reducedChoicesKey: 'videos.blendToRead.hints.reducedChoices',
  },
  feedback: {
    successKey: 'videos.blendToRead.feedback.success.default',
    retryKey: 'videos.blendToRead.feedback.retry.default',
  },
} as const;

const EPISODE_LEXICON: Record<BlendToReadEpisodeId, EpisodeLexicon> = {
  'episode-01-cv-patah': {
    syllableKey: 'syllables.pronunciation.maPatah',
    wordKey: 'words.pronunciation.matana',
    focusPatternKey: 'videos.blendToRead.episodes.episode-01-cv-patah.title',
    checkpointTypes: ['tapAudio', 'chooseSyllable', 'chooseWord'],
  },
  'episode-02-cv-segol': {
    syllableKey: 'syllables.pronunciation.leSegol',
    wordKey: 'words.pronunciation.lehem',
    focusPatternKey: 'videos.blendToRead.episodes.episode-02-cv-segol.title',
    checkpointTypes: ['tapAudio', 'chooseSyllable', 'chooseWord'],
  },
  'episode-03-cv-hirik': {
    syllableKey: 'syllables.pronunciation.shiHirik',
    wordKey: 'words.pronunciation.shir',
    focusPatternKey: 'videos.blendToRead.episodes.episode-03-cv-hirik.title',
    checkpointTypes: ['tapAudio', 'chooseSyllable', 'chooseWord'],
  },
  'episode-04-cvc-bridge': {
    syllableKey: 'syllables.pronunciation.sal',
    wordKey: 'words.pronunciation.sala',
    focusPatternKey: 'videos.blendToRead.episodes.episode-04-cvc-bridge.title',
    checkpointTypes: ['chooseSyllable', 'tapAudio', 'chooseWord'],
  },
  'episode-05-word-transfer': {
    syllableKey: 'syllables.pronunciation.bat',
    wordKey: 'words.pronunciation.bayit',
    focusPatternKey: 'videos.blendToRead.episodes.episode-05-word-transfer.title',
    checkpointTypes: ['chooseWord', 'chooseSyllable', 'tapAudio'],
  },
  'episode-06-challenge': {
    syllableKey: 'syllables.pronunciation.gil',
    wordKey: 'words.pronunciation.gil',
    focusPatternKey: 'videos.blendToRead.episodes.episode-06-challenge.title',
    checkpointTypes: ['chooseWord', 'tapAudio', 'chooseSyllable'],
  },
};

const CHECKPOINT_ID_ORDER: BlendToReadCheckpointId[] = ['one', 'two', 'three'];

const SYLLABLE_POOL = [
  'syllables.pronunciation.maPatah',
  'syllables.pronunciation.leSegol',
  'syllables.pronunciation.shiHirik',
  'syllables.pronunciation.sal',
  'syllables.pronunciation.bat',
  'syllables.pronunciation.gil',
] as const;

const WORD_POOL = [
  'words.pronunciation.matana',
  'words.pronunciation.lehem',
  'words.pronunciation.shir',
  'words.pronunciation.sala',
  'words.pronunciation.bayit',
  'words.pronunciation.gil',
  'words.pronunciation.sal',
] as const;

const TRANSITION_IN_FRAMES = 12;
const RESPONSE_PAUSE_IN_FRAMES = 78;

const HOLD_IN_FRAMES = {
  intro: 30,
  modelBlend: 28,
  checkpointOne: 16,
  checkpointTwo: 16,
  checkpointThree: 16,
  recap: 24,
  celebration: 42,
} as const;

const DEFAULT_AUDIO_IN_FRAMES = {
  intro: 120,
  modelBlend: 140,
  checkpointOne: 110,
  checkpointTwo: 110,
  checkpointThree: 110,
  recap: 120,
  celebration: 110,
} as const;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEpisodeId(value: unknown): value is BlendToReadEpisodeId {
  return typeof value === 'string' && (BLEND_TO_READ_EPISODE_ORDER as readonly string[]).includes(value);
}

function isCheckpointType(value: unknown): value is BlendToReadCheckpointType {
  return value === 'tapAudio' || value === 'chooseSyllable' || value === 'chooseWord';
}

function isCheckpointScene(value: unknown): value is BlendToReadCheckpointScene {
  return value === 'checkpointOne' || value === 'checkpointTwo' || value === 'checkpointThree';
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.round(value);
  return normalized >= 0 ? normalized : null;
}

function buildPromptKey(episodeId: BlendToReadEpisodeId, checkpointId: BlendToReadCheckpointId): string {
  return `videos.blendToRead.episodes.${episodeId}.checkpoints.${checkpointId}.prompt`;
}

function buildTitleKey(episodeId: BlendToReadEpisodeId): string {
  return `videos.blendToRead.episodes.${episodeId}.title`;
}

function buildRecapKey(episodeId: BlendToReadEpisodeId): string {
  return `videos.blendToRead.episodes.${episodeId}.narration.recap`;
}

function rotateChoices<T>(choices: [T, T, T], steps: number): [T, T, T] {
  const offset = ((steps % 3) + 3) % 3;
  if (offset === 0) {
    return choices;
  }

  if (offset === 1) {
    return [choices[2], choices[0], choices[1]];
  }

  return [choices[1], choices[2], choices[0]];
}

function buildOptionKeys(answerKey: string, pool: readonly string[]): [string, string, string] {
  const distractors = pool.filter((entry) => entry !== answerKey).slice(0, 2);
  const firstDistractor = distractors[0] ?? answerKey;
  const secondDistractor = distractors[1] ?? firstDistractor;

  return [answerKey, firstDistractor, secondDistractor];
}

function buildChoiceSet(
  answerKey: string,
  type: BlendToReadCheckpointType,
  seed: number,
): {
  choices: [BlendToReadChoice, BlendToReadChoice, BlendToReadChoice];
  reducedChoices: [BlendToReadChoice, BlendToReadChoice];
} {
  const pool = type === 'chooseWord' ? WORD_POOL : SYLLABLE_POOL;
  const optionKeys = buildOptionKeys(answerKey, pool);
  const rotatedOptionKeys = rotateChoices(optionKeys, seed);

  const choices = rotatedOptionKeys.map((textKey) => ({
    id: textKey,
    textKey,
    audioKey: textKey,
    isCorrect: textKey === answerKey,
  })) as [BlendToReadChoice, BlendToReadChoice, BlendToReadChoice];

  const firstIncorrect = choices.find((choice) => !choice.isCorrect) ?? choices[1];
  const reducedChoices =
    choices[0].isCorrect
      ? [choices[0], firstIncorrect]
      : [choices.find((choice) => choice.isCorrect) ?? choices[0], firstIncorrect];

  return {
    choices,
    reducedChoices: reducedChoices as [BlendToReadChoice, BlendToReadChoice],
  };
}

function buildFallbackCues(
  checkpointTypes: [BlendToReadCheckpointType, BlendToReadCheckpointType, BlendToReadCheckpointType],
): [BlendToReadCheckpointCue, BlendToReadCheckpointCue, BlendToReadCheckpointCue] {
  const scenes = {
    intro: {
      durationInFrames: DEFAULT_AUDIO_IN_FRAMES.intro + HOLD_IN_FRAMES.intro + TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.intro,
    },
    modelBlend: {
      durationInFrames: DEFAULT_AUDIO_IN_FRAMES.modelBlend + HOLD_IN_FRAMES.modelBlend + TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.modelBlend,
    },
    checkpointOne: {
      durationInFrames:
        DEFAULT_AUDIO_IN_FRAMES.checkpointOne +
        HOLD_IN_FRAMES.checkpointOne +
        RESPONSE_PAUSE_IN_FRAMES +
        TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.checkpointOne,
    },
    checkpointTwo: {
      durationInFrames:
        DEFAULT_AUDIO_IN_FRAMES.checkpointTwo +
        HOLD_IN_FRAMES.checkpointTwo +
        RESPONSE_PAUSE_IN_FRAMES +
        TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.checkpointTwo,
    },
    checkpointThree: {
      durationInFrames:
        DEFAULT_AUDIO_IN_FRAMES.checkpointThree +
        HOLD_IN_FRAMES.checkpointThree +
        RESPONSE_PAUSE_IN_FRAMES +
        TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.checkpointThree,
    },
    recap: {
      durationInFrames: DEFAULT_AUDIO_IN_FRAMES.recap + HOLD_IN_FRAMES.recap + TRANSITION_IN_FRAMES,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.recap,
    },
    celebration: {
      durationInFrames: DEFAULT_AUDIO_IN_FRAMES.celebration + HOLD_IN_FRAMES.celebration,
      audioDurationInFrames: DEFAULT_AUDIO_IN_FRAMES.celebration,
    },
  };

  let sceneStartFrame = 0;
  const cues: BlendToReadCheckpointCue[] = [];

  const sceneOrder = [
    'intro',
    'modelBlend',
    'checkpointOne',
    'checkpointTwo',
    'checkpointThree',
    'recap',
    'celebration',
  ] as const;

  sceneOrder.forEach((scene, index) => {
    const currentScene = scenes[scene];

    if (scene === 'checkpointOne' || scene === 'checkpointTwo' || scene === 'checkpointThree') {
      const checkpointIndex = scene === 'checkpointOne' ? 0 : scene === 'checkpointTwo' ? 1 : 2;
      const responseStartFrame =
        sceneStartFrame + currentScene.audioDurationInFrames + HOLD_IN_FRAMES[scene];

      cues.push({
        id: CHECKPOINT_ID_ORDER[checkpointIndex],
        type: checkpointTypes[checkpointIndex],
        scene,
        sceneStartFrame,
        responseStartFrame,
        responseEndFrame: responseStartFrame + RESPONSE_PAUSE_IN_FRAMES,
      });
    }

    if (index < sceneOrder.length - 1) {
      sceneStartFrame += currentScene.durationInFrames - TRANSITION_IN_FRAMES;
    }
  });

  return cues as [BlendToReadCheckpointCue, BlendToReadCheckpointCue, BlendToReadCheckpointCue];
}

function parseCueFromPayload(
  payloadEpisode: RecordLike | null,
  expected: BlendToReadCheckpointCue,
): BlendToReadCheckpointCue {
  if (!payloadEpisode) {
    return expected;
  }

  const rawTimeline = isRecord(payloadEpisode.timeline) ? payloadEpisode.timeline : payloadEpisode;
  const rawCheckpointList = Array.isArray(rawTimeline.checkpoints) ? rawTimeline.checkpoints : null;

  if (!rawCheckpointList) {
    return expected;
  }

  const rawCue = rawCheckpointList.find(
    (entry) => isRecord(entry) && entry.id === expected.id,
  ) as RecordLike | undefined;

  if (!rawCue) {
    return expected;
  }

  const cueType = isCheckpointType(rawCue.type) ? rawCue.type : expected.type;
  const cueScene = isCheckpointScene(rawCue.scene) ? rawCue.scene : expected.scene;
  const sceneStartFrame = toPositiveInteger(rawCue.sceneStartFrame);
  const responseStartFrame = toPositiveInteger(rawCue.responseStartFrame);
  const responseEndFrame = toPositiveInteger(rawCue.responseEndFrame);

  if (
    sceneStartFrame === null ||
    responseStartFrame === null ||
    responseEndFrame === null ||
    responseEndFrame <= responseStartFrame
  ) {
    return expected;
  }

  return {
    id: expected.id,
    type: cueType,
    scene: cueScene,
    sceneStartFrame,
    responseStartFrame,
    responseEndFrame,
  };
}

function parsePayloadEpisodes(configJson: Record<string, unknown> | undefined): Map<BlendToReadEpisodeId, RecordLike> {
  if (!configJson || !isRecord(configJson)) {
    return new Map();
  }

  const runtime = isRecord(configJson.blendToReadRuntime)
    ? configJson.blendToReadRuntime
    : isRecord(configJson.runtime)
      ? configJson.runtime
      : null;

  if (!runtime || !Array.isArray(runtime.episodes)) {
    return new Map();
  }

  const byEpisode = new Map<BlendToReadEpisodeId, RecordLike>();

  runtime.episodes.forEach((entry) => {
    if (!isRecord(entry) || !isEpisodeId(entry.id)) {
      return;
    }

    byEpisode.set(entry.id, entry);
  });

  return byEpisode;
}

function parseRuntimeFps(configJson: Record<string, unknown> | undefined): number {
  if (!configJson || !isRecord(configJson)) {
    return 30;
  }

  const runtime = isRecord(configJson.blendToReadRuntime)
    ? configJson.blendToReadRuntime
    : isRecord(configJson.runtime)
      ? configJson.runtime
      : null;

  const rawFps = runtime && typeof runtime.fps === 'number' ? runtime.fps : 30;
  return Number.isFinite(rawFps) && rawFps >= 1 ? Math.round(rawFps) : 30;
}

export function buildBlendToReadRuntimeConfig(
  configJson: Record<string, unknown> | undefined,
): BlendToReadRuntimeConfig {
  const payloadEpisodes = parsePayloadEpisodes(configJson);
  const fps = parseRuntimeFps(configJson);

  const episodes = BLEND_TO_READ_EPISODE_ORDER.map((episodeId, episodeIndex) => {
    const lexicon = EPISODE_LEXICON[episodeId];
    const payloadEpisode = payloadEpisodes.get(episodeId) ?? null;

    const fallbackCues = buildFallbackCues(lexicon.checkpointTypes);

    const checkpoints = CHECKPOINT_ID_ORDER.map((checkpointId, checkpointIndex) => {
      const checkpointType = lexicon.checkpointTypes[checkpointIndex];
      const answerKey = checkpointType === 'chooseWord' ? lexicon.wordKey : lexicon.syllableKey;
      const seed = episodeIndex + checkpointIndex;
      const { choices, reducedChoices } = buildChoiceSet(answerKey, checkpointType, seed);

      const cue = parseCueFromPayload(payloadEpisode, fallbackCues[checkpointIndex]);

      return {
        id: checkpointId,
        type: checkpointType,
        promptKey: buildPromptKey(episodeId, checkpointId),
        cue,
        choices,
        reducedChoices,
      } as BlendToReadRuntimeCheckpoint;
    }) as [BlendToReadRuntimeCheckpoint, BlendToReadRuntimeCheckpoint, BlendToReadRuntimeCheckpoint];

    const payloadCompositionId = payloadEpisode && typeof payloadEpisode.compositionId === 'string'
      ? payloadEpisode.compositionId
      : null;
    const payloadVideoUrl = payloadEpisode && typeof payloadEpisode.videoUrl === 'string'
      ? payloadEpisode.videoUrl
      : null;

    return {
      id: episodeId,
      compositionId: payloadCompositionId ?? `BlendToRead-${episodeId}`,
      videoUrl: payloadVideoUrl ?? `/video/he/blend-to-read/${episodeId}.mp4`,
      titleKey: buildTitleKey(episodeId),
      focusPatternKey: lexicon.focusPatternKey,
      recapNarrationKey: buildRecapKey(episodeId),
      checkpoints,
    } satisfies BlendToReadRuntimeEpisode;
  });

  return {
    fps,
    episodes,
    shared: {
      titleKey: SHARED_KEYS.titleKey,
      replayPromptKey: SHARED_KEYS.replayPromptKey,
      checkpointPromptKey: SHARED_KEYS.checkpointPromptKey,
      recapPromptKey: SHARED_KEYS.recapPromptKey,
      hints: {
        replaySegmentKey: SHARED_KEYS.hints.replaySegmentKey,
        pathHighlightKey: SHARED_KEYS.hints.pathHighlightKey,
        reducedChoicesKey: SHARED_KEYS.hints.reducedChoicesKey,
      },
      feedback: {
        successKey: SHARED_KEYS.feedback.successKey,
        retryKey: SHARED_KEYS.feedback.retryKey,
      },
    },
  };
}

export function createBlendToReadRuntimeSeedConfig(): Record<string, unknown> {
  return {
    blendToReadRuntime: {
      fps: 30,
      episodes: BLEND_TO_READ_EPISODE_ORDER.map((episodeId) => ({
        id: episodeId,
        compositionId: `BlendToRead-${episodeId}`,
        videoUrl: `/video/he/blend-to-read/${episodeId}.mp4`,
      })),
    },
  };
}
