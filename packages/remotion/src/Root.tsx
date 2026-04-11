import React from 'react';
import { Composition } from 'remotion';

import {
  BLEND_TO_READ_EPISODE_ORDER,
  BlendToReadEpisodeVideo,
  calculateBlendToReadMetadata,
  createFallbackProps as createBlendToReadFallbackProps,
} from './compositions/blendToRead';
import {
  calculateLettersLessonMetadata,
  createFallbackProps,
  LETTER_SERIES_ORDER,
  LettersLessonVideo,
} from './compositions/letters';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const FALLBACK_DURATION = 300;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BlendToReadTemplate"
        component={BlendToReadEpisodeVideo}
        durationInFrames={FALLBACK_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={createBlendToReadFallbackProps(BLEND_TO_READ_EPISODE_ORDER[0])}
        calculateMetadata={calculateBlendToReadMetadata}
      />

      {BLEND_TO_READ_EPISODE_ORDER.map((episodeId) => {
        return (
          <Composition
            key={episodeId}
            id={`BlendToRead-${episodeId}`}
            component={BlendToReadEpisodeVideo}
            durationInFrames={FALLBACK_DURATION}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={createBlendToReadFallbackProps(episodeId)}
            calculateMetadata={calculateBlendToReadMetadata}
          />
        );
      })}

      <Composition
        id="LettersSeriesTemplate"
        component={LettersLessonVideo}
        durationInFrames={FALLBACK_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={createFallbackProps('alef')}
        calculateMetadata={calculateLettersLessonMetadata}
      />

      {LETTER_SERIES_ORDER.map((letter) => {
        return (
          <Composition
            key={letter}
            id={`LettersSeries-${letter}`}
            component={LettersLessonVideo}
            durationInFrames={FALLBACK_DURATION}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={createFallbackProps(letter)}
            calculateMetadata={calculateLettersLessonMetadata}
          />
        );
      })}
    </>
  );
};
