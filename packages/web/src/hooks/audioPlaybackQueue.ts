import type { AudioController } from '@/games/engine';

type VoidFn = () => void;
type PlaybackResult = 'ended' | 'error';

interface AudioLike {
  preload: string;
  currentTime: number;
  onended: HTMLAudioElement['onended'];
  onerror: HTMLAudioElement['onerror'];
  play: () => Promise<void> | void;
  pause: () => void;
}

interface ActivePlayback {
  audio: AudioLike;
  settle: VoidFn;
  cancelAttempt: VoidFn;
}

interface AudioPlaybackQueueOptions {
  resolveAudioSrc: (path: string) => string;
  createAudio?: (src: string) => AudioLike;
  maxPlaybackAttempts?: number;
}

const DEFAULT_MAX_PLAYBACK_ATTEMPTS = 2;

function createBrowserAudio(src: string): AudioLike {
  return new Audio(src);
}

function clearPlaybackHandlers(audio: AudioLike): void {
  audio.onended = null;
  audio.onerror = null;
}

/**
 * Shared queue controller for HTMLAudio playback.
 *
 * - Plays one clip at a time (FIFO queue).
 * - Retries once on load/play failure.
 * - Never blocks the queue on errors (skips gracefully after retries).
 */
export function createAudioPlaybackQueueController(options: AudioPlaybackQueueOptions): AudioController {
  const createAudio = options.createAudio ?? createBrowserAudio;
  const maxPlaybackAttempts = Math.max(1, options.maxPlaybackAttempts ?? DEFAULT_MAX_PLAYBACK_ATTEMPTS);

  let queueTail = Promise.resolve<void>(undefined);
  let queueGeneration = 0;
  let activePlayback: ActivePlayback | null = null;

  const stopCurrent = () => {
    const current = activePlayback;
    if (!current) return;

    activePlayback = null;
    current.cancelAttempt();
    current.audio.pause();
    current.audio.currentTime = 0;
    current.settle();
  };

  const clearQueue = () => {
    queueGeneration += 1;
    queueTail = Promise.resolve<void>(undefined);
  };

  const playClip = (path: string, generation: number): Promise<void> =>
    new Promise<void>((resolve) => {
      if (!path || generation !== queueGeneration) {
        resolve();
        return;
      }

      const src = options.resolveAudioSrc(path);
      if (!src) {
        resolve();
        return;
      }

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      const startAttempt = (attempt: number) => {
        if (generation !== queueGeneration) {
          settle();
          return;
        }

        const audio = createAudio(src);
        audio.preload = 'auto';

        let attemptFinished = false;
        const finishAttempt = (result: PlaybackResult) => {
          if (attemptFinished) return;
          attemptFinished = true;

          clearPlaybackHandlers(audio);

          if (activePlayback?.audio === audio) {
            activePlayback = null;
          }

          if (result === 'ended') {
            settle();
            return;
          }

          if (attempt < maxPlaybackAttempts) {
            startAttempt(attempt + 1);
            return;
          }

          settle();
        };

        const cancelAttempt = () => {
          attemptFinished = true;
          clearPlaybackHandlers(audio);
        };

        activePlayback = { audio, settle, cancelAttempt };

        audio.onended = () => finishAttempt('ended');
        audio.onerror = () => finishAttempt('error');

        try {
          const playPromise = audio.play();
          playPromise?.catch(() => {
            finishAttempt('error');
          });
        } catch {
          finishAttempt('error');
        }
      };

      startAttempt(1);
    });

  const enqueue = (path: string): Promise<void> => {
    if (!path) return Promise.resolve<void>(undefined);

    const generation = queueGeneration;
    const run = () => playClip(path, generation);
    const next = queueTail.then(run, run);
    queueTail = next.catch(() => undefined);
    return next;
  };

  const play = (audioPath: string) => enqueue(audioPath);

  const playNow = (audioPath: string): Promise<void> => {
    stopCurrent();
    clearQueue();
    return enqueue(audioPath);
  };

  const playSequence = (audioPaths: string[]): Promise<void> => {
    if (audioPaths.length === 0) {
      return Promise.resolve<void>(undefined);
    }

    let tail = Promise.resolve<void>(undefined);
    for (const path of audioPaths) {
      tail = enqueue(path);
    }
    return tail;
  };

  const stop = () => {
    stopCurrent();
    clearQueue();
  };

  return { play, playNow, playSequence, stop };
}
