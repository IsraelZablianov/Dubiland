import { fitText } from '@remotion/layout-utils';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { createFallbackEpisode, DEFAULT_TIMELINE } from './defaults';
import { type LetterEpisode, type LettersLessonProps } from './types';

const FONT_STACK = 'Rubik, "Noto Sans Hebrew", "Arial", sans-serif';

const Card: React.FC<{
  children: React.ReactNode;
  background: string;
  width?: number;
  padding?: number;
}> = ({ children, background, width = 760, padding = 34 }) => {
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        padding,
        borderRadius: 36,
        border: '4px solid rgba(255, 255, 255, 0.95)',
        background,
        boxShadow: '0 24px 50px rgba(93, 58, 26, 0.2)',
      }}
    >
      {children}
    </div>
  );
};

const DubiMascot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wave = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 90, mass: 0.7 },
  });

  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.75) * 6;

  return (
    <div
      style={{
        position: 'absolute',
        right: 110,
        bottom: 62,
        transform: `translateY(${bob}px)`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 320,
          height: 320,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 26,
            right: 210,
            width: 74,
            height: 74,
            borderRadius: '50%',
            background: '#A66D3D',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 26,
            right: 34,
            width: 74,
            height: 74,
            borderRadius: '50%',
            background: '#A66D3D',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 42,
            borderRadius: '50%',
            background: '#B77745',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 115,
            top: 132,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#35221A',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 180,
            top: 132,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#35221A',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 122,
            top: 176,
            width: 80,
            height: 56,
            borderRadius: 30,
            background: '#F5D7B8',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 152,
            top: 190,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#4A2A1A',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 124,
            top: 234,
            width: 82,
            height: 62,
            borderRadius: 26,
            background: '#5B95EB',
            border: '3px solid #3D6BBB',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 182,
            top: 122,
            width: 34,
            height: 116,
            borderRadius: 18,
            background: '#B77745',
            transformOrigin: 'top right',
            transform: `rotate(${interpolate(wave, [0, 1], [26, -8])}deg)`,
          }}
        />
      </div>
    </div>
  );
};

const SceneShell: React.FC<{
  episode: LetterEpisode;
  children: React.ReactNode;
}> = ({ children, episode }) => {
  return (
    <AbsoluteFill
      style={{
        direction: 'rtl',
        fontFamily: FONT_STACK,
        color: '#402419',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '70px 420px 70px 96px',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 80,
          fontSize: 38,
          color: '#7A4C2A',
          fontWeight: 700,
        }}
      >
        {episode.seriesTitle}
      </div>
      <DubiMascot />
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ episode: LetterEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 95, mass: 0.8 },
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.intro)} />
      <div
        style={{
          transform: `translateY(${interpolate(reveal, [0, 1], [38, 0])}px)`,
          opacity: interpolate(reveal, [0, 1], [0, 1]),
        }}
      >
        <Card background="rgba(255, 245, 225, 0.95)">
          <div style={{ fontSize: 46, fontWeight: 800, marginBottom: 12 }}>
            {episode.seriesSubtitle}
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, marginBottom: 16 }}>{episode.symbol}</div>
          <div style={{ fontSize: 42, lineHeight: 1.35 }}>{episode.script.intro}</div>
        </Card>
      </div>
    </SceneShell>
  );
};

const PronunciationScene: React.FC<{ episode: LetterEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 9, stiffness: 140, mass: 0.7 },
  });

  const { fontSize } = fitText({
    text: episode.symbol,
    withinWidth: 660,
    fontFamily: FONT_STACK,
    fontWeight: '700',
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.pronunciation)} />
      <div
        style={{
          transform: `scale(${interpolate(pop, [0, 1], [0.45, 1])})`,
          opacity: interpolate(pop, [0, 1], [0, 1]),
        }}
      >
        <Card background="rgba(245, 255, 250, 0.95)">
          <div style={{ fontSize: Math.min(fontSize, 320), lineHeight: 1, fontWeight: 700, marginBottom: 18 }}>
            {episode.symbol}
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, marginBottom: 14 }}>{episode.letterName}</div>
          <div style={{ fontSize: 40, lineHeight: 1.35 }}>{episode.script.pronunciation}</div>
        </Card>
      </div>
    </SceneShell>
  );
};

const ExampleWordScene: React.FC<{ episode: LetterEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();

  const inX = interpolate(frame, [0, 20], [120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const { fontSize } = fitText({
    text: episode.sampleWord,
    withinWidth: 580,
    fontFamily: FONT_STACK,
    fontWeight: '700',
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.exampleWord)} />
      <div style={{ transform: `translateX(${inX}px)` }}>
        <Card background="rgba(240, 250, 255, 0.95)">
          <div style={{ fontSize: 40, marginBottom: 16 }}>{episode.script.exampleWord}</div>
          <div
            style={{
              display: 'inline-block',
              minWidth: 420,
              padding: '16px 28px',
              borderRadius: 24,
              background: '#FFFFFF',
              border: '3px solid #9CC4FF',
              fontSize: Math.min(fontSize, 130),
              fontWeight: 800,
              color: '#2A4C8E',
            }}
          >
            {episode.sampleWord}
          </div>
        </Card>
      </div>
    </SceneShell>
  );
};

const PracticeCueScene: React.FC<{ episode: LetterEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 7), [-1, 1], [0.9, 1.05]);

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.practiceCue)} />
      <div style={{ transform: `scale(${pulse})` }}>
        <Card background="rgba(255, 249, 235, 0.96)">
          <div style={{ fontSize: 52, fontWeight: 800, marginBottom: 14 }}>{episode.practiceCueText}</div>
          <div style={{ fontSize: 36, lineHeight: 1.4 }}>{episode.symbol} • {episode.letterName}</div>
        </Card>
      </div>
    </SceneShell>
  );
};

const CelebrationScene: React.FC<{ episode: LetterEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();

  const stars = [
    { top: 130, right: 470, delay: 0 },
    { top: 170, right: 980, delay: 8 },
    { top: 360, right: 540, delay: 14 },
    { top: 420, right: 940, delay: 22 },
    { top: 250, right: 1120, delay: 28 },
  ];

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.celebration)} />
      <Card background="rgba(237, 252, 233, 0.96)">
        <div style={{ fontSize: 44, marginBottom: 16 }}>{episode.script.celebration}</div>
        <div style={{ fontSize: 66, fontWeight: 800, color: '#3A7C2E' }}>
          {episode.symbol} • {episode.sampleWord}
        </div>
      </Card>

      {stars.map((star, index) => {
        const localFrame = Math.max(0, frame - star.delay);
        const burst = spring({
          frame: localFrame,
          fps: 30,
          config: { damping: 11, stiffness: 120, mass: 0.6 },
        });

        return (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`star-${index}`}
            style={{
              position: 'absolute',
              top: star.top,
              right: star.right,
              fontSize: 74,
              opacity: interpolate(burst, [0, 1], [0, 1]),
              transform: `scale(${interpolate(burst, [0, 1], [0.2, 1])})`,
            }}
          >
            ⭐
          </div>
        );
      })}
    </SceneShell>
  );
};

export const LettersLessonVideo: React.FC<LettersLessonProps> = ({ letter, episode, timeline }) => {
  const resolvedEpisode = episode ?? createFallbackEpisode(letter);
  const resolvedTimeline = timeline ?? DEFAULT_TIMELINE;

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const background = interpolateColors(
    frame,
    [0, durationInFrames * 0.45, durationInFrames],
    ['#FFF6E6', '#E8F6FF', '#FFF1DB'],
  );

  const transitionTiming = linearTiming({
    durationInFrames: resolvedTimeline.transitionInFrames,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.65), transparent 48%), radial-gradient(circle at 82% 82%, rgba(255, 236, 204, 0.65), transparent 50%)',
        }}
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.intro.durationInFrames}>
          <IntroScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.pronunciation.durationInFrames}>
          <PronunciationScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.exampleWord.durationInFrames}>
          <ExampleWordScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.practiceCue.durationInFrames}>
          <PracticeCueScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.celebration.durationInFrames}>
          <CelebrationScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
