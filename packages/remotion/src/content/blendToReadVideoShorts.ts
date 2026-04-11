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

interface EpisodeKeyFamilies {
  titleKey: string;
  introNarrationKey: string;
  modelNarrationKey: string;
  checkpointPromptKeys: [string, string, string];
  recapNarrationKey: string;
  celebrationNarrationKey: string;
}

interface EpisodeAudioManifestKeys {
  intro: string;
  model: string;
  checkpointOne: string;
  checkpointTwo: string;
  checkpointThree: string;
  recap: string;
  celebration: string;
}

export interface BlendToReadEpisodeContract {
  id: BlendToReadEpisodeId;
  level: 'level1' | 'level2' | 'level3';
  focusPattern: string;
  blendSource: string[];
  targetBlend: string;
  transferWord: string;
  checkpointTypes: [BlendToReadCheckpointType, BlendToReadCheckpointType, BlendToReadCheckpointType];
  i18n: EpisodeKeyFamilies;
  audioManifest: EpisodeAudioManifestKeys;
  runtimeCheckpointSlug: string;
  expectedVideoPath: string;
}

const baseI18nKey = (episodeId: BlendToReadEpisodeId): string => `videos.blendToRead.episodes.${episodeId}`;
const baseAudioManifestKey = (episodeId: BlendToReadEpisodeId): string =>
  `common.videos.blendToRead.episodes.${episodeId}`;

const buildContract = (
  id: BlendToReadEpisodeId,
  level: BlendToReadEpisodeContract['level'],
  focusPattern: string,
  blendSource: string[],
  targetBlend: string,
  transferWord: string,
  checkpointTypes: BlendToReadEpisodeContract['checkpointTypes'],
  runtimeCheckpointSlug: string,
): BlendToReadEpisodeContract => {
  const i18nRoot = baseI18nKey(id);
  const audioRoot = baseAudioManifestKey(id);

  return {
    id,
    level,
    focusPattern,
    blendSource,
    targetBlend,
    transferWord,
    checkpointTypes,
    runtimeCheckpointSlug,
    expectedVideoPath: `public/video/he/blend-to-read/${id}.mp4`,
    i18n: {
      titleKey: `${i18nRoot}.title`,
      introNarrationKey: `${i18nRoot}.narration.intro`,
      modelNarrationKey: `${i18nRoot}.narration.model`,
      checkpointPromptKeys: [
        `${i18nRoot}.checkpoints.one.prompt`,
        `${i18nRoot}.checkpoints.two.prompt`,
        `${i18nRoot}.checkpoints.three.prompt`,
      ],
      recapNarrationKey: `${i18nRoot}.narration.recap`,
      celebrationNarrationKey: `${i18nRoot}.narration.celebration`,
    },
    audioManifest: {
      intro: `${audioRoot}.narration.intro`,
      model: `${audioRoot}.narration.model`,
      checkpointOne: `${audioRoot}.checkpoints.one.prompt`,
      checkpointTwo: `${audioRoot}.checkpoints.two.prompt`,
      checkpointThree: `${audioRoot}.checkpoints.three.prompt`,
      recap: `${audioRoot}.narration.recap`,
      celebration: `${audioRoot}.narration.celebration`,
    },
  };
};

export const BLEND_TO_READ_VIDEO_SHORTS_EPISODES: BlendToReadEpisodeContract[] = [
  buildContract(
    'episode-01-cv-patah',
    'level1',
    'CV + patah',
    ['מ', 'ַ'],
    'מַ',
    'מַתָּנָה',
    ['tapAudio', 'chooseSyllable', 'chooseWord'],
    'cv-patah-intro',
  ),
  buildContract(
    'episode-02-cv-segol',
    'level1',
    'CV + segol',
    ['ל', 'ֶ'],
    'לֶ',
    'לֶחֶם',
    ['tapAudio', 'chooseSyllable', 'chooseWord'],
    'cv-segol-core',
  ),
  buildContract(
    'episode-03-cv-hirik',
    'level2',
    'CV + hirik',
    ['ש', 'ִ'],
    'שִ',
    'שִיר',
    ['tapAudio', 'chooseSyllable', 'chooseWord'],
    'cv-hirik-core',
  ),
  buildContract(
    'episode-04-cvc-bridge',
    'level2',
    'CVC bridge',
    ['ס', 'ַ', 'ל'],
    'סַל',
    'סַלָּה',
    ['chooseSyllable', 'tapAudio', 'chooseWord'],
    'cvc-bridge',
  ),
  buildContract(
    'episode-05-word-transfer',
    'level3',
    'Word transfer',
    ['ב', 'ַ', 'ת'],
    'בַּת',
    'בַּיִת',
    ['chooseWord', 'chooseSyllable', 'tapAudio'],
    'word-transfer',
  ),
  buildContract(
    'episode-06-challenge',
    'level3',
    'Mixed challenge',
    ['ג', 'ִ', 'ל'],
    'גִּל',
    'גִּיל',
    ['chooseWord', 'tapAudio', 'chooseSyllable'],
    'challenge-low-cue',
  ),
];

export const BLEND_TO_READ_SHARED_KEYS = {
  titleKey: 'videos.blendToRead.title',
  instructions: {
    replayPromptKey: 'videos.blendToRead.instructions.replayPrompt',
    checkpointPromptKey: 'videos.blendToRead.instructions.checkpointPrompt',
    recapPromptKey: 'videos.blendToRead.instructions.recapPrompt',
  },
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
