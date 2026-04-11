import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { staticFile, type CalculateMetadataFunction } from 'remotion';

import {
  DEFAULT_AUDIO_IN_FRAMES,
  buildTimelineFromAudioFrames,
  createFallbackEpisode,
} from './defaults';
import { type BlendEpisode, type BlendToReadVideoProps, type SceneKey } from './types';

const FPS = 30;
const SAFE_FALLBACK_AUDIO = 'audio/he/videos/letters-series/title.mp3';

const audioDurationCache = new Map<string, number>();

const removeLeadingSlash = (path: string): string => {
  return path.startsWith('/') ? path.slice(1) : path;
};

interface DurationMeasurement {
  durationInFrames: number;
  measured: boolean;
}

const getMeasuredDurationInFrames = async (
  assetPath: string,
  fallbackFrames: number,
): Promise<DurationMeasurement> => {
  const normalizedAssetPath = removeLeadingSlash(assetPath);

  const cached = audioDurationCache.get(normalizedAssetPath);

  if (cached) {
    return {
      durationInFrames: Math.max(1, Math.ceil(cached * FPS)),
      measured: true,
    };
  }

  try {
    const durationInSeconds = await getAudioDurationInSeconds(staticFile(normalizedAssetPath));
    audioDurationCache.set(normalizedAssetPath, durationInSeconds);

    return {
      durationInFrames: Math.max(1, Math.ceil(durationInSeconds * FPS)),
      measured: true,
    };
  } catch {
    return {
      durationInFrames: fallbackFrames,
      measured: false,
    };
  }
};

interface MeasuredAudioResult {
  safeAssetPath: string;
  durationInFrames: number;
}

const measureSceneAudio = async (
  preferredPath: string,
  fallbackFrames: number,
): Promise<MeasuredAudioResult> => {
  const normalizedPath = removeLeadingSlash(preferredPath);
  const measurement = await getMeasuredDurationInFrames(normalizedPath, fallbackFrames);

  if (measurement.measured || normalizedPath === SAFE_FALLBACK_AUDIO) {
    return {
      safeAssetPath: normalizedPath,
      durationInFrames: measurement.durationInFrames,
    };
  }

  const safeDuration = await getMeasuredDurationInFrames(
    SAFE_FALLBACK_AUDIO,
    DEFAULT_AUDIO_IN_FRAMES.intro,
  );

  return {
    safeAssetPath: SAFE_FALLBACK_AUDIO,
    durationInFrames: safeDuration.durationInFrames,
  };
};

const withSafeAudio = async (episode: BlendEpisode) => {
  const [intro, modelBlend, checkpointOne, checkpointTwo, checkpointThree, recap, celebration] =
    await Promise.all([
      measureSceneAudio(episode.audio.intro, DEFAULT_AUDIO_IN_FRAMES.intro),
      measureSceneAudio(episode.audio.modelBlend, DEFAULT_AUDIO_IN_FRAMES.modelBlend),
      measureSceneAudio(episode.audio.checkpointOne, DEFAULT_AUDIO_IN_FRAMES.checkpointOne),
      measureSceneAudio(episode.audio.checkpointTwo, DEFAULT_AUDIO_IN_FRAMES.checkpointTwo),
      measureSceneAudio(episode.audio.checkpointThree, DEFAULT_AUDIO_IN_FRAMES.checkpointThree),
      measureSceneAudio(episode.audio.recap, DEFAULT_AUDIO_IN_FRAMES.recap),
      measureSceneAudio(episode.audio.celebration, DEFAULT_AUDIO_IN_FRAMES.celebration),
    ]);

  const timelineAudioFrames: Record<SceneKey, number> = {
    intro: intro.durationInFrames,
    modelBlend: modelBlend.durationInFrames,
    checkpointOne: checkpointOne.durationInFrames,
    checkpointTwo: checkpointTwo.durationInFrames,
    checkpointThree: checkpointThree.durationInFrames,
    recap: recap.durationInFrames,
    celebration: celebration.durationInFrames,
  };

  const safeEpisode: BlendEpisode = {
    ...episode,
    audio: {
      intro: intro.safeAssetPath,
      modelBlend: modelBlend.safeAssetPath,
      checkpointOne: checkpointOne.safeAssetPath,
      checkpointTwo: checkpointTwo.safeAssetPath,
      checkpointThree: checkpointThree.safeAssetPath,
      recap: recap.safeAssetPath,
      celebration: celebration.safeAssetPath,
    },
  };

  return {
    safeEpisode,
    timelineAudioFrames,
  };
};

export const calculateBlendToReadMetadata: CalculateMetadataFunction<BlendToReadVideoProps> = async ({
  props,
}) => {
  const episode = props.episode ?? createFallbackEpisode(props.episodeId);
  const { safeEpisode, timelineAudioFrames } = await withSafeAudio(episode);
  const timeline = buildTimelineFromAudioFrames(timelineAudioFrames, safeEpisode.checkpoints);

  return {
    durationInFrames: timeline.totalDurationInFrames,
    props: {
      ...props,
      episode: safeEpisode,
      timeline,
    },
    defaultOutName: `blend-to-read-${props.episodeId}`,
  };
};
