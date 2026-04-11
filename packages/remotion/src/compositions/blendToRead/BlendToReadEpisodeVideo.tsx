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

import { DEFAULT_TIMELINE, createFallbackEpisode } from './defaults';
import {
  type BlendCheckpointScene,
  type BlendEpisode,
  type BlendEpisodeTimeline,
  type BlendToReadVideoProps,
  type CheckpointCue,
} from './types';

const FONT_STACK = 'Rubik, "Noto Sans Hebrew", "Arial", sans-serif';

const surfaceShadow = '0 22px 48px rgba(44, 65, 90, 0.2)';

const Card: React.FC<{
  children: React.ReactNode;
  background: string;
  width?: number;
  padding?: number;
}> = ({ children, background, width = 860, padding = 34 }) => {
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        borderRadius: 34,
        border: '4px solid rgba(255,255,255,0.92)',
        background,
        padding,
        boxShadow: surfaceShadow,
      }}
    >
      {children}
    </div>
  );
};

const IconBadge: React.FC<{ symbol: string; label: string }> = ({ symbol, label }) => {
  return (
    <div
      style={{
        minWidth: 128,
        height: 56,
        borderRadius: 28,
        border: '2px solid rgba(66, 98, 135, 0.28)',
        background: 'rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 700,
        color: '#2A4260',
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{symbol}</span>
      <span style={{ fontSize: 21 }}>{label}</span>
    </div>
  );
};

const DubiGuide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 96, mass: 0.8 },
  });

  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.6) * 8;

  return (
    <div
      style={{
        position: 'absolute',
        left: 78,
        bottom: 48,
        transform: `translateY(${bob}px) scale(${interpolate(entrance, [0, 1], [0.88, 1])})`,
        transformOrigin: 'bottom center',
      }}
    >
      <div
        style={{
          width: 276,
          height: 276,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 18,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#B37843',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 18,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#B37843',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '36px 26px 30px',
            borderRadius: '50%',
            background: '#C78652',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 106,
            left: 92,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#342319',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 106,
            right: 92,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#342319',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 142,
            left: 95,
            width: 86,
            height: 54,
            borderRadius: 28,
            background: '#F2D6B7',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 156,
            left: 128,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#4B2A1A',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 94,
            bottom: 12,
            width: 88,
            height: 62,
            borderRadius: 24,
            background: '#5897EB',
            border: '3px solid #3D6FBD',
          }}
        />
      </div>
    </div>
  );
};

const SceneShell: React.FC<{
  episode: BlendEpisode;
  children: React.ReactNode;
}> = ({ children, episode }) => {
  return (
    <AbsoluteFill
      style={{
        direction: 'rtl',
        fontFamily: FONT_STACK,
        color: '#24374D',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '86px 120px 86px 360px',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          top: 38,
          right: 86,
          display: 'flex',
          alignItems: 'baseline',
          gap: 18,
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 800 }}>{episode.title}</span>
        <span style={{ fontSize: 30, fontWeight: 700, color: '#4E6882' }}>{episode.subtitle}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 96,
          right: 92,
          fontSize: 22,
          fontWeight: 700,
          color: '#5A7794',
        }}
      >
        {episode.levelLabel}
      </div>
      <DubiGuide />
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ episode: BlendEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 92, mass: 0.82 },
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.intro)} />
      <div
        style={{
          transform: `translateY(${interpolate(reveal, [0, 1], [40, 0])}px)`,
          opacity: interpolate(reveal, [0, 1], [0, 1]),
        }}
      >
        <Card background="rgba(252, 245, 230, 0.95)">
          <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 10 }}>{episode.focusPattern}</div>
          <div style={{ fontSize: 36, lineHeight: 1.34, marginBottom: 16 }}>{episode.script.intro}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {episode.blendSource.map((unit) => (
              <div
                key={`intro-${unit}`}
                style={{
                  minWidth: 84,
                  minHeight: 84,
                  borderRadius: 22,
                  background: '#FFFFFF',
                  border: '3px solid #C7DBF0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                  fontWeight: 700,
                  color: '#2B4462',
                }}
              >
                {unit}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SceneShell>
  );
};

const ModelBlendScene: React.FC<{ episode: BlendEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settle = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 88, mass: 0.9 },
  });

  const unitOffset = 170;

  const { fontSize } = fitText({
    text: episode.targetBlend,
    withinWidth: 420,
    fontFamily: FONT_STACK,
    fontWeight: '700',
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.modelBlend)} />
      <Card background="rgba(236, 246, 255, 0.95)">
        <div style={{ fontSize: 34, marginBottom: 24 }}>{episode.script.modelBlend}</div>
        <div
          style={{
            position: 'relative',
            height: 210,
          }}
        >
          {episode.blendSource.map((unit, index) => {
            const sourceX = (index - (episode.blendSource.length - 1) / 2) * unitOffset;
            const x = interpolate(settle, [0, 1], [sourceX, 0]);
            const y = interpolate(settle, [0, 1], [0, index % 2 === 0 ? -8 : 8]);

            return (
              <div
                key={`blend-unit-${unit}-${index}`}
                style={{
                  position: 'absolute',
                  right: '50%',
                  top: 24,
                  transform: `translate(${x}px, ${y}px)`,
                  marginRight: -44,
                  width: 88,
                  height: 88,
                  borderRadius: 20,
                  background: '#FFFFFF',
                  border: '3px solid #AFCBE6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 54,
                  fontWeight: 700,
                }}
              >
                {unit}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 260,
            minHeight: 104,
            borderRadius: 26,
            padding: '8px 24px',
            border: '3px solid #7FB1E7',
            background: 'rgba(255,255,255,0.95)',
            fontSize: Math.min(fontSize, 110),
            fontWeight: 800,
            color: '#1E4D84',
          }}
        >
          {episode.targetBlend}
        </div>
      </Card>
    </SceneShell>
  );
};

const CheckpointScene: React.FC<{
  episode: BlendEpisode;
  checkpoint: BlendCheckpointScene;
  cue: CheckpointCue;
  timeline: BlendEpisodeTimeline;
  audioPath: string;
}> = ({ episode, checkpoint, cue, timeline, audioPath }) => {
  const frame = useCurrentFrame();

  const localResponseStart = Math.max(0, cue.responseStartFrame - cue.sceneStartFrame);
  const localResponseEnd = Math.max(localResponseStart + 1, cue.responseEndFrame - cue.sceneStartFrame);

  const responseProgress = interpolate(frame, [localResponseStart, localResponseEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(audioPath)} />
      <Card background="rgba(255, 253, 242, 0.96)">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3B5A79' }}>
            Checkpoint {checkpoint.id} • {checkpoint.type}
          </div>
          <IconBadge symbol="▶" label="Replay" />
        </div>

        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.3, marginBottom: 18 }}>{checkpoint.prompt}</div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          {checkpoint.options.map((option) => {
            const isAnswer = option === checkpoint.answer;
            return (
              <div
                key={`${checkpoint.id}-${option}`}
                style={{
                  minHeight: 84,
                  borderRadius: 22,
                  border: `3px solid ${isAnswer ? '#9FD2A5' : '#C7D8EA'}`,
                  background: isAnswer ? 'rgba(229, 247, 232, 0.88)' : 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 54,
                  fontWeight: 800,
                  color: '#274665',
                }}
              >
                {option}
              </div>
            );
          })}
        </div>

        <div
          style={{
            borderRadius: 14,
            background: 'rgba(210, 226, 241, 0.65)',
            overflow: 'hidden',
            height: 16,
          }}
        >
          <div
            style={{
              width: `${Math.round(responseProgress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7AC58A 0%, #5AA7EA 100%)',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <IconBadge symbol="↻" label="Retry" />
          <IconBadge symbol="💡" label="Hint" />
        </div>

        <div style={{ marginTop: 10, fontSize: 20, color: '#5D7891' }}>
          Response window: {(timeline.responsePauseInFrames / 30).toFixed(1)} sec
        </div>
      </Card>
    </SceneShell>
  );
};

const RecapScene: React.FC<{ episode: BlendEpisode }> = ({ episode }) => {
  const { fontSize } = fitText({
    text: episode.transferWord,
    withinWidth: 560,
    fontFamily: FONT_STACK,
    fontWeight: '700',
  });

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.recap)} />
      <Card background="rgba(242, 255, 248, 0.95)">
        <div style={{ fontSize: 36, lineHeight: 1.35, marginBottom: 16 }}>{episode.script.recap}</div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 360,
            minHeight: 108,
            padding: '6px 20px',
            borderRadius: 24,
            border: '3px solid #9CD0AE',
            background: '#FFFFFF',
            fontSize: Math.min(fontSize, 112),
            fontWeight: 800,
            color: '#1F6C39',
          }}
        >
          {episode.transferWord}
        </div>
      </Card>
    </SceneShell>
  );
};

const CelebrationScene: React.FC<{ episode: BlendEpisode }> = ({ episode }) => {
  const frame = useCurrentFrame();

  const bursts = [
    { top: 120, left: 460, delay: 0 },
    { top: 204, left: 540, delay: 8 },
    { top: 190, left: 920, delay: 14 },
    { top: 330, left: 570, delay: 22 },
    { top: 354, left: 980, delay: 26 },
  ];

  return (
    <SceneShell episode={episode}>
      <Audio src={staticFile(episode.audio.celebration)} />
      <Card background="rgba(238, 250, 236, 0.96)">
        <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>{episode.script.celebration}</div>
        <div style={{ fontSize: 68, fontWeight: 800, color: '#2D7A3A' }}>{episode.targetBlend}</div>
      </Card>

      {bursts.map((burst, index) => {
        const localFrame = Math.max(0, frame - burst.delay);
        const rise = spring({
          frame: localFrame,
          fps: 30,
          config: { damping: 11, stiffness: 130, mass: 0.65 },
        });

        return (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`burst-${index}`}
            style={{
              position: 'absolute',
              top: burst.top,
              left: burst.left,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#F6C43A',
              opacity: interpolate(rise, [0, 1], [0, 1]),
              transform: `scale(${interpolate(rise, [0, 1], [0.2, 1.15])})`,
            }}
          />
        );
      })}
    </SceneShell>
  );
};

export const BlendToReadEpisodeVideo: React.FC<BlendToReadVideoProps> = ({
  episodeId,
  episode,
  timeline,
}) => {
  const resolvedEpisode = episode ?? createFallbackEpisode(episodeId);
  const resolvedTimeline = timeline ?? DEFAULT_TIMELINE;

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const background = interpolateColors(
    frame,
    [0, durationInFrames * 0.42, durationInFrames],
    ['#F8EFE3', '#E4F1FF', '#F0FAE7'],
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
            'radial-gradient(circle at 16% 16%, rgba(255, 255, 255, 0.62), transparent 48%), radial-gradient(circle at 88% 78%, rgba(233, 247, 255, 0.72), transparent 50%)',
        }}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.intro.durationInFrames}>
          <IntroScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.modelBlend.durationInFrames}>
          <ModelBlendScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.checkpointOne.durationInFrames}>
          <CheckpointScene
            episode={resolvedEpisode}
            checkpoint={resolvedEpisode.checkpoints[0]}
            cue={resolvedTimeline.checkpoints[0]}
            timeline={resolvedTimeline}
            audioPath={resolvedEpisode.audio.checkpointOne}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.checkpointTwo.durationInFrames}>
          <CheckpointScene
            episode={resolvedEpisode}
            checkpoint={resolvedEpisode.checkpoints[1]}
            cue={resolvedTimeline.checkpoints[1]}
            timeline={resolvedTimeline}
            audioPath={resolvedEpisode.audio.checkpointTwo}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.checkpointThree.durationInFrames}>
          <CheckpointScene
            episode={resolvedEpisode}
            checkpoint={resolvedEpisode.checkpoints[2]}
            cue={resolvedTimeline.checkpoints[2]}
            timeline={resolvedTimeline}
            audioPath={resolvedEpisode.audio.checkpointThree}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.recap.durationInFrames}>
          <RecapScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

        <TransitionSeries.Sequence durationInFrames={resolvedTimeline.scenes.celebration.durationInFrames}>
          <CelebrationScene episode={resolvedEpisode} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
