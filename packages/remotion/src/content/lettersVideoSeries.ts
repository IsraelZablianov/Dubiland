export type LetterVideoEpisodeId =
  | 'alef'
  | 'bet'
  | 'gimel'
  | 'dalet'
  | 'he'
  | 'vav';

export interface LetterVideoEpisodeScriptKeys {
  introKey: string;
  pronunciationKey: string;
  exampleWordLineKey: string;
  celebrationKey: string;
}

export interface LetterVideoEpisodeSpec {
  id: LetterVideoEpisodeId;
  letterSymbolKey: string;
  letterPronunciationKey: string;
  letterExampleWordKey: string;
  script: LetterVideoEpisodeScriptKeys;
}

const buildEpisode = (id: LetterVideoEpisodeId): LetterVideoEpisodeSpec => ({
  id,
  letterSymbolKey: `common.letters.symbols.${id}`,
  letterPronunciationKey: `common.letters.pronunciation.${id}`,
  letterExampleWordKey: `common.letters.sampleWords.${id}`,
  script: {
    introKey: `common.videos.lettersSeries.episodes.${id}.intro`,
    pronunciationKey: `common.videos.lettersSeries.episodes.${id}.pronunciation`,
    exampleWordLineKey: `common.videos.lettersSeries.episodes.${id}.exampleWord`,
    celebrationKey: `common.videos.lettersSeries.episodes.${id}.celebration`,
  },
});

export const LETTERS_VIDEO_SERIES_EPISODES: LetterVideoEpisodeSpec[] = [
  buildEpisode('alef'),
  buildEpisode('bet'),
  buildEpisode('gimel'),
  buildEpisode('dalet'),
  buildEpisode('he'),
  buildEpisode('vav'),
];

export const LETTERS_VIDEO_SERIES_KEYSET = {
  titleKey: 'common.videos.lettersSeries.title',
  subtitleKey: 'common.videos.lettersSeries.subtitle',
  nextLetterTransitionKey: 'common.videos.lettersSeries.transitions.nextLetter',
  seriesOutroKey: 'common.videos.lettersSeries.transitions.seriesOutro',
} as const;
