import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult, GameProps, HintTrend } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlReplayGlyph } from '@/lib/rtlChrome';
import {
  BLEND_TO_READ_EPISODE_ORDER,
  buildBlendToReadRuntimeConfig,
  type BlendToReadCheckpointId,
  type BlendToReadChoice,
  type BlendToReadEpisodeId,
} from './blendToReadRuntimeAdapter';

type StatusTone = 'neutral' | 'success' | 'hint' | 'error';

type HintStage = 0 | 1 | 2 | 3;

type CueMode = 'timeline' | 'checkpointOnly';

export interface BlendToReadCompletionResult extends GameCompletionResult {
  blendToReadMetrics: {
    accuracyPct: number;
    replayTrend: HintTrend;
    focusEpisodeId: BlendToReadEpisodeId;
    focusEpisodeAccuracyPct: number;
    nextEpisodeId: BlendToReadEpisodeId;
  };
}

interface EpisodeProgress {
  attemptsByCheckpoint: Record<BlendToReadCheckpointId, number>;
  solvedByCheckpoint: Record<BlendToReadCheckpointId, boolean>;
  firstTrySuccessByCheckpoint: Record<BlendToReadCheckpointId, boolean>;
  hintsByCheckpoint: Record<BlendToReadCheckpointId, number>;
  replayCount: number;
}

const EMPTY_CHECKPOINT_COUNTS: Record<BlendToReadCheckpointId, number> = {
  one: 0,
  two: 0,
  three: 0,
};

const EMPTY_CHECKPOINT_FLAGS: Record<BlendToReadCheckpointId, boolean> = {
  one: false,
  two: false,
  three: false,
};

const HINT_AUDIO_KEY_BY_STAGE: Record<Exclude<HintStage, 0>, string> = {
  1: 'videos.blendToRead.hints.replaySegment',
  2: 'videos.blendToRead.hints.pathHighlight',
  3: 'videos.blendToRead.hints.reducedChoices',
};

function createEpisodeProgress(): EpisodeProgress {
  return {
    attemptsByCheckpoint: { ...EMPTY_CHECKPOINT_COUNTS },
    solvedByCheckpoint: { ...EMPTY_CHECKPOINT_FLAGS },
    firstTrySuccessByCheckpoint: { ...EMPTY_CHECKPOINT_FLAGS },
    hintsByCheckpoint: { ...EMPTY_CHECKPOINT_COUNTS },
    replayCount: 0,
  };
}

function createProgressMap(): Record<BlendToReadEpisodeId, EpisodeProgress> {
  return BLEND_TO_READ_EPISODE_ORDER.reduce(
    (acc, episodeId) => {
      acc[episodeId] = createEpisodeProgress();
      return acc;
    },
    {} as Record<BlendToReadEpisodeId, EpisodeProgress>,
  );
}

function toReplayTrend(firstEpisodeReplayCount: number, lastEpisodeReplayCount: number): HintTrend {
  if (lastEpisodeReplayCount <= Math.max(0, firstEpisodeReplayCount * 0.75)) {
    return 'improving';
  }

  if (lastEpisodeReplayCount <= Math.max(1, firstEpisodeReplayCount * 1.1)) {
    return 'steady';
  }

  return 'needs_support';
}

function toStarCount(accuracyPct: number): number {
  if (accuracyPct >= 85) return 3;
  if (accuracyPct >= 70) return 2;
  return 1;
}

function toStableRange(accuracyPct: number): '1-3' | '1-5' | '1-10' {
  if (accuracyPct >= 85) return '1-10';
  if (accuracyPct >= 70) return '1-5';
  return '1-3';
}

export function LearningVideoCheckpointGame({ game, level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const runtime = useMemo(() => buildBlendToReadRuntimeConfig(level.configJson), [level.configJson]);
  const isRtl = isRtlDirection(i18n.dir(i18n.language));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [startedEpisode, setStartedEpisode] = useState(false);
  const [episodeComplete, setEpisodeComplete] = useState(false);
  const [cueMode, setCueMode] = useState<CueMode>('timeline');
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number | null>(null);
  const [hintStage, setHintStage] = useState<HintStage>(0);
  const [statusKey, setStatusKey] = useState<string>('videos.blendToRead.instructions.checkpointPrompt');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const [progressByEpisode, setProgressByEpisode] = useState<Record<BlendToReadEpisodeId, EpisodeProgress>>(() =>
    createProgressMap(),
  );

  const episode = runtime.episodes[episodeIndex] ?? runtime.episodes[0];
  const episodeProgress = progressByEpisode[episode.id] ?? createEpisodeProgress();

  const firstUnsolvedCheckpointIndex = useMemo(() => {
    return episode.checkpoints.findIndex((checkpoint) => !episodeProgress.solvedByCheckpoint[checkpoint.id]);
  }, [episode.checkpoints, episodeProgress.solvedByCheckpoint]);

  const activeCheckpoint =
    activeCheckpointIndex !== null && activeCheckpointIndex >= 0
      ? episode.checkpoints[activeCheckpointIndex] ?? null
      : null;

  const activeChoices = useMemo(() => {
    if (!activeCheckpoint) {
      return [] as BlendToReadChoice[];
    }

    return hintStage >= 2 ? activeCheckpoint.reducedChoices : activeCheckpoint.choices;
  }, [activeCheckpoint, hintStage]);

  const playAudioKey = useCallback(
    async (audioKey: string, mode: 'queue' | 'interrupt' = 'queue') => {
      const path = resolveAudioPathFromKey(audioKey, 'common');
      if (mode === 'interrupt') {
        await audio.playNow(path);
        return;
      }

      await audio.play(path);
    },
    [audio],
  );

  const translateKey = useCallback((key: string) => t(key as any), [t]);

  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current !== null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const updateEpisodeProgress = useCallback(
    (
      episodeId: BlendToReadEpisodeId,
      updater: (current: EpisodeProgress) => EpisodeProgress,
    ) => {
      setProgressByEpisode((current) => ({
        ...current,
        [episodeId]: updater(current[episodeId] ?? createEpisodeProgress()),
      }));
    },
    [],
  );

  const openNextCheckpoint = useCallback(() => {
    const pendingIndex = episode.checkpoints.findIndex(
      (checkpoint) => !episodeProgress.solvedByCheckpoint[checkpoint.id],
    );

    if (pendingIndex >= 0) {
      setActiveCheckpointIndex(pendingIndex);
      setHintStage(0);
      setStatusKey(episode.checkpoints[pendingIndex].promptKey);
      setStatusTone('neutral');
      void playAudioKey(episode.checkpoints[pendingIndex].promptKey, 'interrupt');
      return;
    }

    setActiveCheckpointIndex(null);
    setEpisodeComplete(true);
    setStatusKey(runtime.shared.recapPromptKey);
    setStatusTone('success');
    void playAudioKey(episode.recapNarrationKey, 'interrupt');
  }, [episode, episodeProgress.solvedByCheckpoint, playAudioKey, runtime.shared.recapPromptKey]);

  useEffect(() => {
    setStartedEpisode(false);
    setEpisodeComplete(false);
    setCueMode('timeline');
    setActiveCheckpointIndex(null);
    setHintStage(0);
    setStatusKey(runtime.shared.checkpointPromptKey);
    setStatusTone('neutral');
    clearResumeTimeout();

    return () => {
      clearResumeTimeout();
    };
  }, [clearResumeTimeout, episode.id, runtime.shared.checkpointPromptKey]);

  useEffect(() => {
    if (!startedEpisode) {
      return;
    }

    if (cueMode !== 'checkpointOnly') {
      return;
    }

    if (activeCheckpointIndex !== null) {
      return;
    }

    if (episodeComplete) {
      return;
    }

    openNextCheckpoint();
  }, [activeCheckpointIndex, cueMode, episodeComplete, openNextCheckpoint, startedEpisode]);

  const summarizeCompletion = useCallback((): BlendToReadCompletionResult => {
    const checkpointCount = runtime.episodes.length * 3;

    let firstTrySuccessCount = 0;
    let totalReplayCount = 0;

    const episodeAccuracyById = runtime.episodes.reduce(
      (acc, runtimeEpisode) => {
        const episodeProgressEntry = progressByEpisode[runtimeEpisode.id] ?? createEpisodeProgress();

        const episodeFirstTrySuccess = runtimeEpisode.checkpoints.reduce(
          (sum, checkpoint) => sum + (episodeProgressEntry.firstTrySuccessByCheckpoint[checkpoint.id] ? 1 : 0),
          0,
        );

        firstTrySuccessCount += episodeFirstTrySuccess;
        totalReplayCount += episodeProgressEntry.replayCount;

        acc[runtimeEpisode.id] = Math.round((episodeFirstTrySuccess / 3) * 100);
        return acc;
      },
      {} as Record<BlendToReadEpisodeId, number>,
    );

    const accuracyPct = Math.round((firstTrySuccessCount / Math.max(checkpointCount, 1)) * 100);

    const focusEpisodeId = runtime.episodes.reduce((currentMin, runtimeEpisode) => {
      if (episodeAccuracyById[runtimeEpisode.id] < episodeAccuracyById[currentMin]) {
        return runtimeEpisode.id;
      }

      return currentMin;
    }, runtime.episodes[0].id);

    const focusEpisodeIndex = runtime.episodes.findIndex((entry) => entry.id === focusEpisodeId);
    const nextEpisodeId =
      runtime.episodes[Math.min(runtime.episodes.length - 1, Math.max(0, focusEpisodeIndex + 1))].id;

    const firstEpisodeReplayCount = progressByEpisode[BLEND_TO_READ_EPISODE_ORDER[0]]?.replayCount ?? 0;
    const lastEpisodeReplayCount =
      progressByEpisode[BLEND_TO_READ_EPISODE_ORDER[BLEND_TO_READ_EPISODE_ORDER.length - 1]]?.replayCount ?? 0;

    const replayTrend = toReplayTrend(firstEpisodeReplayCount, lastEpisodeReplayCount);

    return {
      stars: toStarCount(accuracyPct),
      score: accuracyPct,
      completed: true,
      roundsCompleted: checkpointCount,
      summaryMetrics: {
        highestStableRange: toStableRange(accuracyPct),
        firstAttemptSuccessRate: accuracyPct,
        hintTrend: replayTrend,
      },
      blendToReadMetrics: {
        accuracyPct,
        replayTrend,
        focusEpisodeId,
        focusEpisodeAccuracyPct: episodeAccuracyById[focusEpisodeId],
        nextEpisodeId,
      },
    };
  }, [progressByEpisode, runtime.episodes]);

  const handleStartEpisode = useCallback(() => {
    setStartedEpisode(true);
    setEpisodeComplete(false);
    setStatusKey(runtime.shared.checkpointPromptKey);
    setStatusTone('neutral');

    const video = videoRef.current;
    if (!video) {
      setCueMode('checkpointOnly');
      return;
    }

    video.currentTime = 0;
    void video
      .play()
      .then(() => {
        setCueMode('timeline');
      })
      .catch(() => {
        setCueMode('checkpointOnly');
        video.pause();
      });
  }, [runtime.shared.checkpointPromptKey]);

  const handleReplayTap = useCallback(() => {
    updateEpisodeProgress(episode.id, (current) => ({
      ...current,
      replayCount: current.replayCount + 1,
    }));

    if (!activeCheckpoint) {
      void playAudioKey(runtime.shared.replayPromptKey, 'interrupt');
      return;
    }

    const video = videoRef.current;
    if (video && cueMode === 'timeline') {
      video.currentTime = activeCheckpoint.cue.sceneStartFrame / runtime.fps;
      void video.play().catch(() => {
        setCueMode('checkpointOnly');
      });
    }

    void playAudioKey(activeCheckpoint.promptKey, 'interrupt');
  }, [
    activeCheckpoint,
    cueMode,
    episode.id,
    playAudioKey,
    runtime.fps,
    runtime.shared.replayPromptKey,
    updateEpisodeProgress,
  ]);

  const handleHintTap = useCallback(() => {
    if (!activeCheckpoint) {
      return;
    }

    const nextHintStage = Math.min(3, hintStage + 1) as HintStage;
    setHintStage(nextHintStage);

    updateEpisodeProgress(episode.id, (current) => ({
      ...current,
      hintsByCheckpoint: {
        ...current.hintsByCheckpoint,
        [activeCheckpoint.id]: current.hintsByCheckpoint[activeCheckpoint.id] + 1,
      },
    }));

    const hintAudioKey = HINT_AUDIO_KEY_BY_STAGE[nextHintStage as Exclude<HintStage, 0>];
    setStatusKey(hintAudioKey);
    setStatusTone('hint');
    void playAudioKey(hintAudioKey, 'interrupt');

    if (nextHintStage === 1 && cueMode === 'timeline') {
      const video = videoRef.current;
      if (video) {
        video.currentTime = activeCheckpoint.cue.sceneStartFrame / runtime.fps;
        void video.play().catch(() => {
          setCueMode('checkpointOnly');
        });
      }
    }
  }, [
    activeCheckpoint,
    cueMode,
    episode.id,
    hintStage,
    playAudioKey,
    runtime.fps,
    updateEpisodeProgress,
  ]);

  const handleRetryTap = useCallback(() => {
    if (!activeCheckpoint) {
      return;
    }

    setStatusKey(runtime.shared.hints.replaySegmentKey);
    setStatusTone('neutral');

    if (cueMode === 'timeline') {
      const video = videoRef.current;
      if (video) {
        video.currentTime = activeCheckpoint.cue.responseStartFrame / runtime.fps;
        void video.play().catch(() => {
          setCueMode('checkpointOnly');
        });
      }
    }

    void playAudioKey(activeCheckpoint.promptKey, 'interrupt');
  }, [
    activeCheckpoint,
    cueMode,
    playAudioKey,
    runtime.fps,
    runtime.shared.hints.replaySegmentKey,
  ]);

  const handleChoiceTap = useCallback(
    (choice: BlendToReadChoice) => {
      if (!activeCheckpoint) {
        return;
      }

      const checkpointId = activeCheckpoint.id;
      const nextAttempt = (episodeProgress.attemptsByCheckpoint[checkpointId] ?? 0) + 1;
      const solvedNow = choice.isCorrect;

      updateEpisodeProgress(episode.id, (current) => ({
        ...current,
        attemptsByCheckpoint: {
          ...current.attemptsByCheckpoint,
          [checkpointId]: current.attemptsByCheckpoint[checkpointId] + 1,
        },
        solvedByCheckpoint: {
          ...current.solvedByCheckpoint,
          [checkpointId]: current.solvedByCheckpoint[checkpointId] || solvedNow,
        },
        firstTrySuccessByCheckpoint: {
          ...current.firstTrySuccessByCheckpoint,
          [checkpointId]:
            current.firstTrySuccessByCheckpoint[checkpointId] || (solvedNow && nextAttempt === 1),
        },
      }));

      void playAudioKey(choice.audioKey, 'interrupt');

      if (!solvedNow) {
        setStatusKey(runtime.shared.feedback.retryKey);
        setStatusTone('hint');
        void playAudioKey(runtime.shared.feedback.retryKey, 'queue');
        return;
      }

      setStatusKey(runtime.shared.feedback.successKey);
      setStatusTone('success');
      setHintStage(0);
      void playAudioKey(runtime.shared.feedback.successKey, 'queue');

      if (cueMode === 'checkpointOnly') {
        setActiveCheckpointIndex(null);
        const hasPendingCheckpoint = episode.checkpoints.some(
          (checkpoint) => !episodeProgress.solvedByCheckpoint[checkpoint.id] && checkpoint.id !== checkpointId,
        );

        if (!hasPendingCheckpoint) {
          setEpisodeComplete(true);
          setStatusKey(runtime.shared.recapPromptKey);
          setStatusTone('success');
          void playAudioKey(episode.recapNarrationKey, 'interrupt');
        }
        return;
      }

      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(
          video.currentTime,
          activeCheckpoint.cue.responseEndFrame / runtime.fps,
        );
      }

      setActiveCheckpointIndex(null);
      clearResumeTimeout();
      resumeTimeoutRef.current = window.setTimeout(() => {
        const nextVideo = videoRef.current;
        if (nextVideo) {
          void nextVideo.play().catch(() => {
            setCueMode('checkpointOnly');
          });
        }
      }, 280);
    },
    [
      activeCheckpoint,
      clearResumeTimeout,
      cueMode,
      episode.checkpoints,
      episode.id,
      episodeProgress.attemptsByCheckpoint,
      episodeProgress.solvedByCheckpoint,
      playAudioKey,
      runtime.fps,
      runtime.shared.feedback.retryKey,
      runtime.shared.feedback.successKey,
      runtime.shared.recapPromptKey,
      updateEpisodeProgress,
    ],
  );

  const handleVideoError = useCallback(() => {
    setCueMode('checkpointOnly');
    setStatusKey(runtime.shared.checkpointPromptKey);
    setStatusTone('hint');
  }, [runtime.shared.checkpointPromptKey]);

  const handleVideoEnded = useCallback(() => {
    if (episodeComplete) {
      return;
    }

    const hasPendingCheckpoint = episode.checkpoints.some(
      (checkpoint) => !episodeProgress.solvedByCheckpoint[checkpoint.id],
    );

    if (hasPendingCheckpoint) {
      setCueMode('checkpointOnly');
      openNextCheckpoint();
      return;
    }

    setEpisodeComplete(true);
    setStatusKey(runtime.shared.recapPromptKey);
    setStatusTone('success');
    void playAudioKey(episode.recapNarrationKey, 'interrupt');
  }, [
    episode.checkpoints,
    episode.recapNarrationKey,
    episodeComplete,
    episodeProgress.solvedByCheckpoint,
    openNextCheckpoint,
    playAudioKey,
    runtime.shared.recapPromptKey,
  ]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (!startedEpisode || episodeComplete || cueMode !== 'timeline') {
      return;
    }

    if (activeCheckpointIndex !== null) {
      return;
    }

    if (firstUnsolvedCheckpointIndex < 0) {
      return;
    }

    const checkpoint = episode.checkpoints[firstUnsolvedCheckpointIndex];
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const currentFrame = Math.round(video.currentTime * runtime.fps);
    if (currentFrame < checkpoint.cue.responseStartFrame) {
      return;
    }

    video.pause();
    setActiveCheckpointIndex(firstUnsolvedCheckpointIndex);
    setHintStage(0);
    setStatusKey(checkpoint.promptKey);
    setStatusTone('neutral');
    void playAudioKey(checkpoint.promptKey, 'interrupt');
  }, [
    activeCheckpointIndex,
    cueMode,
    episode.checkpoints,
    episodeComplete,
    firstUnsolvedCheckpointIndex,
    playAudioKey,
    runtime.fps,
    startedEpisode,
  ]);

  const handleNextEpisode = useCallback(() => {
    if (episodeIndex >= runtime.episodes.length - 1) {
      onComplete(summarizeCompletion());
      return;
    }

    setEpisodeIndex((current) => Math.min(runtime.episodes.length - 1, current + 1));
  }, [episodeIndex, onComplete, runtime.episodes.length, summarizeCompletion]);

  return (
    <div className="learning-video-checkpoint" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card
        padding="md"
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          border: '2px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent)',
          background:
            'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%), var(--color-bg-card))',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-text-primary)' }}>
            {translateKey(runtime.shared.titleKey)}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {translateKey(episode.titleKey)}
          </p>
        </div>

        <div className="learning-video-checkpoint__stage">
          <video
            ref={videoRef}
            className="learning-video-checkpoint__video"
            src={episode.videoUrl}
            playsInline
            preload="metadata"
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            aria-label={translateKey(episode.titleKey)}
          />

          {!startedEpisode ? (
            <div className="learning-video-checkpoint__cover">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartEpisode}
                aria-label={t('games.play')}
              >
                {rtlReplayGlyph(isRtl)} {t('games.play')}
              </Button>
            </div>
          ) : null}

          {activeCheckpoint ? (
            <div className="learning-video-checkpoint__overlay" role="dialog" aria-live="polite" aria-modal="false">
              <Card
                padding="md"
                style={{
                  display: 'grid',
                  gap: 'var(--space-sm)',
                  background:
                    'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%), var(--color-bg-card))',
                  border: '2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent)',
                }}
              >
                <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 'var(--font-size-md)' }}>
                  {translateKey(activeCheckpoint.promptKey)}
                </p>

                <div className="learning-video-checkpoint__choices">
                  {activeChoices.map((choice) => (
                    <button
                      key={`${activeCheckpoint.id}-${choice.id}`}
                      type="button"
                      onClick={() => handleChoiceTap(choice)}
                      className="learning-video-checkpoint__choice"
                      aria-label={translateKey(choice.textKey)}
                    >
                      <span className="learning-video-checkpoint__choice-text">{translateKey(choice.textKey)}</span>
                    </button>
                  ))}
                </div>

                <div className="learning-video-checkpoint__actions" role="group" aria-label={translateKey(runtime.shared.checkpointPromptKey)}>
                  <button
                    type="button"
                    className="learning-video-checkpoint__icon-button"
                    onClick={handleReplayTap}
                    aria-label={translateKey(runtime.shared.replayPromptKey)}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="learning-video-checkpoint__icon-button"
                    onClick={handleRetryTap}
                    aria-label={translateKey(runtime.shared.hints.replaySegmentKey)}
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    className="learning-video-checkpoint__icon-button"
                    onClick={handleHintTap}
                    aria-label={translateKey(runtime.shared.hints.pathHighlightKey)}
                  >
                    💡
                  </button>
                </div>
              </Card>
            </div>
          ) : null}

          {episodeComplete ? (
            <div className="learning-video-checkpoint__cover">
              <Card
                padding="md"
                style={{
                  display: 'grid',
                  gap: 'var(--space-xs)',
                  justifyItems: 'center',
                  textAlign: 'center',
                  maxInlineSize: '560px',
                }}
              >
                <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                  {translateKey(episode.recapNarrationKey)}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextEpisode}
                  aria-label={t('games.play')}
                >
                  ▶ {t('games.play')}
                </Button>
              </Card>
            </div>
          ) : null}
        </div>

        <Card
          padding="sm"
          style={{
            display: 'grid',
            gap: 'var(--space-2xs)',
            border: '1px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent)',
          }}
        >
          <p
            style={{
              margin: 0,
              color:
                statusTone === 'success'
                  ? 'var(--color-accent-success)'
                  : statusTone === 'hint'
                    ? 'var(--color-accent-warning)'
                    : statusTone === 'error'
                      ? 'var(--color-accent-danger)'
                      : 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
            }}
          >
            {translateKey(statusKey)}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
            {translateKey(runtime.shared.checkpointPromptKey)}
          </p>
        </Card>
      </Card>

      <style>{`
        .learning-video-checkpoint {
          display: grid;
          gap: var(--space-md);
        }

        .learning-video-checkpoint__stage {
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: color-mix(in srgb, var(--color-bg-secondary) 82%, var(--color-theme-bg) 18%);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
          min-block-size: 320px;
        }

        .learning-video-checkpoint__video {
          inline-size: 100%;
          block-size: clamp(260px, 44vw, 430px);
          display: block;
          background: #111;
          object-fit: contain;
        }

        .learning-video-checkpoint__cover {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--color-bg-card) 70%, transparent);
          padding: var(--space-md);
        }

        .learning-video-checkpoint__overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: var(--space-md);
          background: color-mix(in srgb, var(--color-bg-card) 76%, transparent);
        }

        .learning-video-checkpoint__choices {
          display: grid;
          gap: var(--space-xs);
          grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
        }

        .learning-video-checkpoint__choice {
          min-block-size: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-md);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 88%, white 12%);
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          display: grid;
          place-items: center;
          cursor: pointer;
          touch-action: manipulation;
          transition:
            transform var(--motion-duration-normal) var(--motion-ease-standard),
            box-shadow var(--motion-duration-normal) var(--motion-ease-standard);
        }

        .learning-video-checkpoint__choice:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-soft);
        }

        .learning-video-checkpoint__choice-text {
          line-height: 1.15;
        }

        .learning-video-checkpoint__actions {
          display: flex;
          gap: var(--space-xs);
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .learning-video-checkpoint__icon-button {
          min-inline-size: 48px;
          min-block-size: 48px;
          inline-size: 48px;
          block-size: 48px;
          border-radius: var(--radius-full);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 82%, white 18%);
          color: var(--color-text-primary);
          font-size: 1.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: manipulation;
        }

        @media (max-width: 820px) {
          .learning-video-checkpoint__video {
            block-size: clamp(230px, 52vw, 360px);
          }

          .learning-video-checkpoint__choices {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

export default LearningVideoCheckpointGame;
