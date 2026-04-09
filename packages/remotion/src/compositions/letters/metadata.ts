import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { staticFile, type CalculateMetadataFunction } from 'remotion';
import audioManifestJson from '../../../../web/public/audio/he/manifest.json';
import commonJson from '../../../../web/src/i18n/locales/he/common.json';

import { buildTimelineFromAudioFrames } from './defaults';
import {
  type EpisodeScript,
  type LetterEpisode,
  type LettersLessonProps,
  type LetterEpisodeSlug,
  type SceneKey,
} from './types';

interface LettersSeriesCommon {
  videos: {
    lettersSeries: {
      title: string;
      subtitle: string;
      transitions: {
        nextLetter: string;
      };
      episodes: Record<LetterEpisodeSlug, EpisodeScript>;
    };
  };
  letters: {
    symbols: Record<LetterEpisodeSlug, string>;
    pronunciation: Record<LetterEpisodeSlug, string>;
    sampleWords: Record<LetterEpisodeSlug, string>;
  };
}

const audioDurationCache = new Map<string, number>();
const common = commonJson as LettersSeriesCommon;
const audioManifest = audioManifestJson as Record<string, string>;

const removeLeadingSlash = (path: string): string =>
  path.startsWith('/') ? path.slice(1) : path;

const getAudioPath = (manifest: Record<string, string>, key: string): string => {
  const assetPath = manifest[key];

  if (!assetPath) {
    throw new Error(`Missing audio manifest key: ${key}`);
  }

  return removeLeadingSlash(assetPath);
};

const resolveEpisode = (letter: LetterEpisodeSlug): LetterEpisode => {
  const series = common.videos.lettersSeries;
  const episode = series.episodes[letter];

  if (!episode) {
    throw new Error(`Missing letters series episode copy for ${letter}`);
  }

  return {
    slug: letter,
    seriesTitle: series.title,
    seriesSubtitle: series.subtitle,
    practiceCueText: series.transitions.nextLetter,
    symbol: common.letters.symbols[letter],
    letterName: common.letters.pronunciation[letter],
    sampleWord: common.letters.sampleWords[letter],
    script: episode,
    audio: {
      intro: getAudioPath(audioManifest, `common.videos.lettersSeries.episodes.${letter}.intro`),
      pronunciation: getAudioPath(audioManifest, `common.videos.lettersSeries.episodes.${letter}.pronunciation`),
      exampleWord: getAudioPath(audioManifest, `common.videos.lettersSeries.episodes.${letter}.exampleWord`),
      practiceCue: getAudioPath(audioManifest, 'common.videos.lettersSeries.transitions.nextLetter'),
      celebration: getAudioPath(audioManifest, `common.videos.lettersSeries.episodes.${letter}.celebration`),
    },
  };
};

const getDurationInFrames = async (assetPath: string, fps: number): Promise<number> => {
  const cached = audioDurationCache.get(assetPath);

  if (cached) {
    return Math.max(1, Math.ceil(cached * fps));
  }

  const durationInSeconds = await getAudioDurationInSeconds(staticFile(assetPath));
  audioDurationCache.set(assetPath, durationInSeconds);

  return Math.max(1, Math.ceil(durationInSeconds * fps));
};

const buildMeasuredAudioFrames = async (
  episode: LetterEpisode,
  fps: number,
): Promise<Record<SceneKey, number>> => {
  const [intro, pronunciation, exampleWord, practiceCue, celebration] = await Promise.all([
    getDurationInFrames(episode.audio.intro, fps),
    getDurationInFrames(episode.audio.pronunciation, fps),
    getDurationInFrames(episode.audio.exampleWord, fps),
    getDurationInFrames(episode.audio.practiceCue, fps),
    getDurationInFrames(episode.audio.celebration, fps),
  ]);

  return {
    intro,
    pronunciation,
    exampleWord,
    practiceCue,
    celebration,
  };
};

export const calculateLettersLessonMetadata: CalculateMetadataFunction<LettersLessonProps> = async ({
  props,
}) => {
  const fps = 30;
  const episode = resolveEpisode(props.letter);
  const measuredAudioInFrames = await buildMeasuredAudioFrames(episode, fps);
  const timeline = buildTimelineFromAudioFrames(measuredAudioInFrames);

  return {
    durationInFrames: timeline.totalDurationInFrames,
    props: {
      ...props,
      episode,
      timeline,
    },
    defaultOutName: `letters-series-${props.letter}`,
  };
};
