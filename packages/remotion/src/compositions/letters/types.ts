export const LETTER_SERIES_ORDER = ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav'] as const;

export type LetterEpisodeSlug = (typeof LETTER_SERIES_ORDER)[number];

export type SceneKey =
  | 'intro'
  | 'pronunciation'
  | 'exampleWord'
  | 'practiceCue'
  | 'celebration';

export interface EpisodeScript {
  intro: string;
  pronunciation: string;
  exampleWord: string;
  celebration: string;
}

export interface EpisodeAudio {
  intro: string;
  pronunciation: string;
  exampleWord: string;
  practiceCue: string;
  celebration: string;
}

export interface LetterEpisode {
  slug: LetterEpisodeSlug;
  seriesTitle: string;
  seriesSubtitle: string;
  practiceCueText: string;
  symbol: string;
  letterName: string;
  sampleWord: string;
  script: EpisodeScript;
  audio: EpisodeAudio;
}

export interface SceneTiming {
  durationInFrames: number;
  audioDurationInFrames: number;
}

export interface LetterLessonTimeline {
  transitionInFrames: number;
  scenes: Record<SceneKey, SceneTiming>;
  totalDurationInFrames: number;
}

export interface LettersLessonProps {
  letter: LetterEpisodeSlug;
  episode?: LetterEpisode;
  timeline?: LetterLessonTimeline;
  [key: string]: unknown;
}
