import {
  BLEND_TO_READ_EPISODE_ORDER,
  BLEND_TO_READ_VIDEO_SHORTS_EPISODES,
  type BlendToReadEpisodeContract,
  type BlendToReadEpisodeId,
} from '../../content/blendToReadVideoShorts';

import {
  type BlendCheckpointScene,
  type BlendEpisode,
  type BlendEpisodeTimeline,
  type BlendToReadVideoProps,
  type CheckpointCue,
  type SceneKey,
} from './types';

const TRANSITION_IN_FRAMES = 12;
const RESPONSE_PAUSE_IN_FRAMES = 78;

const HOLD_IN_FRAMES: Record<SceneKey, number> = {
  intro: 30,
  modelBlend: 28,
  checkpointOne: 16,
  checkpointTwo: 16,
  checkpointThree: 16,
  recap: 24,
  celebration: 42,
};

export const DEFAULT_AUDIO_IN_FRAMES: Record<SceneKey, number> = {
  intro: 120,
  modelBlend: 140,
  checkpointOne: 110,
  checkpointTwo: 110,
  checkpointThree: 110,
  recap: 120,
  celebration: 110,
};

const SCENE_ORDER: SceneKey[] = [
  'intro',
  'modelBlend',
  'checkpointOne',
  'checkpointTwo',
  'checkpointThree',
  'recap',
  'celebration',
];

const CHECKPOINT_SCENES = ['checkpointOne', 'checkpointTwo', 'checkpointThree'] as const;

type CheckpointSceneKey = (typeof CHECKPOINT_SCENES)[number];

const CHECKPOINT_SCENE_TO_INDEX: Record<CheckpointSceneKey, 0 | 1 | 2> = {
  checkpointOne: 0,
  checkpointTwo: 1,
  checkpointThree: 2,
};

const LEVEL_LABELS: Record<BlendToReadEpisodeContract['level'], string> = {
  level1: 'Level 1 - Sound Join Basics',
  level2: 'Level 2 - Blend Variations',
  level3: 'Level 3 - Word Transfer',
};

const createEmptyScenes = (): Record<SceneKey, { durationInFrames: number; audioDurationInFrames: number }> => ({
  intro: { durationInFrames: 1, audioDurationInFrames: 1 },
  modelBlend: { durationInFrames: 1, audioDurationInFrames: 1 },
  checkpointOne: { durationInFrames: 1, audioDurationInFrames: 1 },
  checkpointTwo: { durationInFrames: 1, audioDurationInFrames: 1 },
  checkpointThree: { durationInFrames: 1, audioDurationInFrames: 1 },
  recap: { durationInFrames: 1, audioDurationInFrames: 1 },
  celebration: { durationInFrames: 1, audioDurationInFrames: 1 },
});

const getContract = (episodeId: BlendToReadEpisodeId): BlendToReadEpisodeContract => {
  const contract = BLEND_TO_READ_VIDEO_SHORTS_EPISODES.find((entry) => entry.id === episodeId);

  if (!contract) {
    throw new Error(`Missing blend-to-read episode contract for ${episodeId}`);
  }

  return contract;
};

const getAudioPath = (episodeId: BlendToReadEpisodeId, clip: string): string => {
  return `audio/he/videos/blend-to-read/${episodeId}/${clip}.mp3`;
};

const buildOptions = (
  contract: BlendToReadEpisodeContract,
  type: BlendCheckpointScene['type'],
): { options: string[]; answer: string } => {
  const fallbackOption = contract.blendSource[0] ?? contract.targetBlend;
  const bridgedOption = `${contract.targetBlend}${contract.blendSource.at(-1) ?? ''}`;

  if (type === 'chooseWord') {
    return {
      answer: contract.transferWord,
      options: [contract.transferWord, bridgedOption, contract.targetBlend],
    };
  }

  if (type === 'tapAudio') {
    return {
      answer: contract.targetBlend,
      options: [contract.targetBlend, fallbackOption, contract.transferWord],
    };
  }

  return {
    answer: contract.targetBlend,
    options: [contract.targetBlend, bridgedOption, fallbackOption],
  };
};

const buildCheckpointPrompt = (type: BlendCheckpointScene['type'], targetBlend: string, transferWord: string): string => {
  if (type === 'tapAudio') {
    return `Tap the sound for ${targetBlend}`;
  }

  if (type === 'chooseWord') {
    return `Choose the pointed word ${transferWord}`;
  }

  return `Choose the built syllable ${targetBlend}`;
};

const buildCheckpointScene = (
  contract: BlendToReadEpisodeContract,
  id: BlendCheckpointScene['id'],
  type: BlendCheckpointScene['type'],
): BlendCheckpointScene => {
  const { options, answer } = buildOptions(contract, type);

  return {
    id,
    type,
    prompt: buildCheckpointPrompt(type, contract.targetBlend, contract.transferWord),
    options,
    answer,
  };
};

const buildEpisodeFromContract = (contract: BlendToReadEpisodeContract): BlendEpisode => {
  return {
    id: contract.id,
    title: 'Blend to Read',
    subtitle: contract.focusPattern,
    levelLabel: LEVEL_LABELS[contract.level],
    focusPattern: contract.focusPattern,
    blendSource: contract.blendSource,
    targetBlend: contract.targetBlend,
    transferWord: contract.transferWord,
    script: {
      intro: `Dubi introduces pattern ${contract.focusPattern}`,
      modelBlend: `We blend ${contract.blendSource.join(' + ')} to make ${contract.targetBlend}`,
      recap: `Recap: ${contract.targetBlend} appears inside ${contract.transferWord}`,
      celebration: 'Great blending! Keep the same strategy in the next checkpoint.',
    },
    checkpoints: [
      buildCheckpointScene(contract, 'one', contract.checkpointTypes[0]),
      buildCheckpointScene(contract, 'two', contract.checkpointTypes[1]),
      buildCheckpointScene(contract, 'three', contract.checkpointTypes[2]),
    ],
    audio: {
      intro: getAudioPath(contract.id, 'intro'),
      modelBlend: getAudioPath(contract.id, 'model-blend'),
      checkpointOne: getAudioPath(contract.id, 'checkpoint-one'),
      checkpointTwo: getAudioPath(contract.id, 'checkpoint-two'),
      checkpointThree: getAudioPath(contract.id, 'checkpoint-three'),
      recap: getAudioPath(contract.id, 'recap'),
      celebration: getAudioPath(contract.id, 'celebration'),
    },
  };
};

const createTimelineCues = (
  scenes: Record<SceneKey, { durationInFrames: number; audioDurationInFrames: number }>,
  checkpoints: BlendEpisode['checkpoints'],
  responsePauseInFrames: number,
): [CheckpointCue, CheckpointCue, CheckpointCue] => {
  let sceneStartFrame = 0;
  const cues: CheckpointCue[] = [];

  SCENE_ORDER.forEach((scene, index) => {
    const currentScene = scenes[scene];

    if (CHECKPOINT_SCENES.includes(scene as CheckpointSceneKey)) {
      const checkpointScene = scene as CheckpointSceneKey;
      const checkpointIndex = CHECKPOINT_SCENE_TO_INDEX[checkpointScene];
      const checkpoint = checkpoints[checkpointIndex];

      const responseStartFrame =
        sceneStartFrame + currentScene.audioDurationInFrames + HOLD_IN_FRAMES[scene];

      cues.push({
        id: checkpoint.id,
        type: checkpoint.type,
        prompt: checkpoint.prompt,
        scene: checkpointScene,
        sceneStartFrame,
        responseStartFrame,
        responseEndFrame: responseStartFrame + responsePauseInFrames,
      });
    }

    if (index < SCENE_ORDER.length - 1) {
      sceneStartFrame += currentScene.durationInFrames - TRANSITION_IN_FRAMES;
    }
  });

  return cues as [CheckpointCue, CheckpointCue, CheckpointCue];
};

export const buildTimelineFromAudioFrames = (
  audioDurationInFrames: Record<SceneKey, number>,
  checkpoints: BlendEpisode['checkpoints'],
  responsePauseInFrames = RESPONSE_PAUSE_IN_FRAMES,
): BlendEpisodeTimeline => {
  const scenes = createEmptyScenes();

  SCENE_ORDER.forEach((scene, index) => {
    const isLast = index === SCENE_ORDER.length - 1;
    const isCheckpoint = CHECKPOINT_SCENES.includes(scene as CheckpointSceneKey);
    const transitionPad = isLast ? 0 : TRANSITION_IN_FRAMES;
    const responsePad = isCheckpoint ? responsePauseInFrames : 0;
    const audioFrames = Math.max(1, audioDurationInFrames[scene]);

    scenes[scene] = {
      audioDurationInFrames: audioFrames,
      durationInFrames: audioFrames + HOLD_IN_FRAMES[scene] + responsePad + transitionPad,
    };
  });

  const totalDurationInFrames =
    SCENE_ORDER.reduce((sum, scene) => sum + scenes[scene].durationInFrames, 0) -
    TRANSITION_IN_FRAMES * (SCENE_ORDER.length - 1);

  return {
    transitionInFrames: TRANSITION_IN_FRAMES,
    responsePauseInFrames,
    scenes,
    checkpoints: createTimelineCues(scenes, checkpoints, responsePauseInFrames),
    totalDurationInFrames,
  };
};

export const createFallbackEpisode = (episodeId: BlendToReadEpisodeId): BlendEpisode => {
  return buildEpisodeFromContract(getContract(episodeId));
};

export const DEFAULT_TIMELINE = buildTimelineFromAudioFrames(
  DEFAULT_AUDIO_IN_FRAMES,
  createFallbackEpisode(BLEND_TO_READ_EPISODE_ORDER[0]).checkpoints,
);

export const createFallbackProps = (episodeId: BlendToReadEpisodeId): BlendToReadVideoProps => {
  const episode = createFallbackEpisode(episodeId);

  return {
    episodeId,
    episode,
    timeline: buildTimelineFromAudioFrames(DEFAULT_AUDIO_IN_FRAMES, episode.checkpoints),
  };
};
