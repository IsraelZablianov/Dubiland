import type { BlendToReadCheckpointType, BlendToReadEpisodeId } from '../../content/blendToReadVideoShorts';

export {
  BLEND_TO_READ_EPISODE_ORDER,
  type BlendToReadCheckpointType,
  type BlendToReadEpisodeId,
} from '../../content/blendToReadVideoShorts';

export type SceneKey =
  | 'intro'
  | 'modelBlend'
  | 'checkpointOne'
  | 'checkpointTwo'
  | 'checkpointThree'
  | 'recap'
  | 'celebration';

export interface BlendCheckpointScene {
  id: 'one' | 'two' | 'three';
  type: BlendToReadCheckpointType;
  prompt: string;
  options: string[];
  answer: string;
}

export interface BlendEpisodeScript {
  intro: string;
  modelBlend: string;
  recap: string;
  celebration: string;
}

export interface BlendEpisodeAudio {
  intro: string;
  modelBlend: string;
  checkpointOne: string;
  checkpointTwo: string;
  checkpointThree: string;
  recap: string;
  celebration: string;
}

export interface BlendEpisode {
  id: BlendToReadEpisodeId;
  title: string;
  subtitle: string;
  levelLabel: string;
  focusPattern: string;
  blendSource: string[];
  targetBlend: string;
  transferWord: string;
  script: BlendEpisodeScript;
  checkpoints: [BlendCheckpointScene, BlendCheckpointScene, BlendCheckpointScene];
  audio: BlendEpisodeAudio;
}

export interface SceneTiming {
  durationInFrames: number;
  audioDurationInFrames: number;
}

export interface CheckpointCue {
  id: BlendCheckpointScene['id'];
  type: BlendToReadCheckpointType;
  prompt: string;
  scene: 'checkpointOne' | 'checkpointTwo' | 'checkpointThree';
  sceneStartFrame: number;
  responseStartFrame: number;
  responseEndFrame: number;
}

export interface BlendEpisodeTimeline {
  transitionInFrames: number;
  responsePauseInFrames: number;
  scenes: Record<SceneKey, SceneTiming>;
  checkpoints: [CheckpointCue, CheckpointCue, CheckpointCue];
  totalDurationInFrames: number;
}

export interface BlendToReadVideoProps {
  episodeId: BlendToReadEpisodeId;
  episode?: BlendEpisode;
  timeline?: BlendEpisodeTimeline;
  [key: string]: unknown;
}
