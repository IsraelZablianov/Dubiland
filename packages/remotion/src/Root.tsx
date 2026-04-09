import React from 'react';
import { Composition } from 'remotion';

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
