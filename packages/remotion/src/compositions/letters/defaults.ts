import {
  type LetterEpisode,
  type LetterEpisodeSlug,
  type LetterLessonTimeline,
  type LettersLessonProps,
  type SceneKey,
} from './types';

const TRANSITION_IN_FRAMES = 12;

const HOLD_IN_FRAMES: Record<SceneKey, number> = {
  intro: 24,
  pronunciation: 18,
  exampleWord: 20,
  practiceCue: 18,
  celebration: 42,
};

const DEFAULT_AUDIO_IN_FRAMES: Record<SceneKey, number> = {
  intro: 100,
  pronunciation: 90,
  exampleWord: 90,
  practiceCue: 75,
  celebration: 95,
};

const SCENE_ORDER: SceneKey[] = [
  'intro',
  'pronunciation',
  'exampleWord',
  'practiceCue',
  'celebration',
];

export const buildTimelineFromAudioFrames = (
  audioDurationInFrames: Record<SceneKey, number>,
): LetterLessonTimeline => {
  const scenes = SCENE_ORDER.reduce<Record<SceneKey, { durationInFrames: number; audioDurationInFrames: number }>>(
    (acc, scene, index) => {
      const isLast = index === SCENE_ORDER.length - 1;
      const transitionPad = isLast ? 0 : TRANSITION_IN_FRAMES;
      const audioFrames = Math.max(1, audioDurationInFrames[scene]);

      acc[scene] = {
        audioDurationInFrames: audioFrames,
        durationInFrames: audioFrames + HOLD_IN_FRAMES[scene] + transitionPad,
      };

      return acc;
    },
    {
      intro: { durationInFrames: 1, audioDurationInFrames: 1 },
      pronunciation: { durationInFrames: 1, audioDurationInFrames: 1 },
      exampleWord: { durationInFrames: 1, audioDurationInFrames: 1 },
      practiceCue: { durationInFrames: 1, audioDurationInFrames: 1 },
      celebration: { durationInFrames: 1, audioDurationInFrames: 1 },
    },
  );

  const totalDurationInFrames = SCENE_ORDER.reduce(
    (sum, scene) => sum + scenes[scene].durationInFrames,
    0,
  ) - TRANSITION_IN_FRAMES * (SCENE_ORDER.length - 1);

  return {
    transitionInFrames: TRANSITION_IN_FRAMES,
    scenes,
    totalDurationInFrames,
  };
};

export const createFallbackEpisode = (letter: LetterEpisodeSlug): LetterEpisode => {
  return {
    slug: letter,
    seriesTitle: 'Dubiland Letters Series',
    seriesSubtitle: 'Episode metadata is loading',
    practiceCueText: 'Get ready for the next letter',
    symbol: letter.toUpperCase(),
    letterName: letter,
    sampleWord: letter,
    script: {
      intro: '',
      pronunciation: '',
      exampleWord: '',
      celebration: '',
    },
    audio: {
      intro: 'audio/he/videos/letters-series/title.mp3',
      pronunciation: 'audio/he/videos/letters-series/title.mp3',
      exampleWord: 'audio/he/videos/letters-series/title.mp3',
      practiceCue: 'audio/he/videos/letters-series/title.mp3',
      celebration: 'audio/he/videos/letters-series/title.mp3',
    },
  };
};

export const DEFAULT_TIMELINE = buildTimelineFromAudioFrames(DEFAULT_AUDIO_IN_FRAMES);

export const createFallbackProps = (letter: LetterEpisodeSlug): LettersLessonProps => ({
  letter,
  episode: createFallbackEpisode(letter),
  timeline: DEFAULT_TIMELINE,
});
