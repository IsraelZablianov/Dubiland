import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AudioController } from '@/games/engine';
import { assetUrl } from '@/lib/assetUrl';

type VoidFn = () => void;

/**
 * Queue-based audio controller for games.
 *
 * `play()` enqueues a clip — it won't start until the previous clip ends.
 * `playNow()` interrupts immediately (clears the queue first).
 * `playSequence()` enqueues multiple clips that play one after another.
 * `stop()` halts playback and drains the queue.
 */
export function useAudioManager(): AudioController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueTailRef = useRef<Promise<void>>(Promise.resolve());
  const queueGenerationRef = useRef(0);
  const currentSettleRef = useRef<VoidFn | null>(null);
  const unmountedRef = useRef(false);

  const clearPlaybackHandlers = useCallback((audio: HTMLAudioElement) => {
    audio.onended = null;
    audio.onerror = null;
  }, []);

  const settleActivePlayback = useCallback(() => {
    const settle = currentSettleRef.current;
    if (!settle) return;
    currentSettleRef.current = null;
    settle();
  }, []);

  const stopCurrent = useCallback(() => {
    const activeAudio = audioRef.current;
    if (activeAudio) {
      clearPlaybackHandlers(activeAudio);
      activeAudio.pause();
      activeAudio.currentTime = 0;
      audioRef.current = null;
    }
    settleActivePlayback();
  }, [clearPlaybackHandlers, settleActivePlayback]);

  const clearQueue = useCallback(() => {
    queueGenerationRef.current += 1;
    queueTailRef.current = Promise.resolve();
  }, []);

  const playClip = useCallback(
    (path: string, generation: number): Promise<void> =>
      new Promise<void>((resolve) => {
        if (!path || unmountedRef.current || generation !== queueGenerationRef.current) {
          resolve();
          return;
        }

        const audio = new Audio(assetUrl(path));
        audio.preload = 'auto';
        audioRef.current = audio;

        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          clearPlaybackHandlers(audio);
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          if (currentSettleRef.current === settle) {
            currentSettleRef.current = null;
          }
          resolve();
        };

        currentSettleRef.current = settle;
        audio.onended = settle;
        audio.onerror = settle;

        try {
          const playbackPromise = audio.play();
          playbackPromise?.catch(() => {
            settle();
          });
        } catch {
          settle();
        }
      }),
    [clearPlaybackHandlers],
  );

  const enqueue = useCallback(
    (path: string): Promise<void> => {
      if (!path || unmountedRef.current) return Promise.resolve();

      const generation = queueGenerationRef.current;
      const run = () => playClip(path, generation);
      const next = queueTailRef.current.then(run, run);
      queueTailRef.current = next.catch(() => undefined);
      return next;
    },
    [playClip],
  );

  const play = useCallback((audioPath: string) => enqueue(audioPath), [enqueue]);

  const playNow = useCallback(
    (audioPath: string): Promise<void> => {
      stopCurrent();
      clearQueue();
      return enqueue(audioPath);
    },
    [stopCurrent, clearQueue, enqueue],
  );

  const playSequence = useCallback(
    (audioPaths: string[]): Promise<void> => {
      if (audioPaths.length === 0) {
        return Promise.resolve();
      }

      let last: Promise<void> = Promise.resolve();
      for (const path of audioPaths) {
        last = enqueue(path);
      }
      return last;
    },
    [enqueue],
  );

  const stop = useCallback(() => {
    stopCurrent();
    clearQueue();
  }, [stopCurrent, clearQueue]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      stop();
    };
  }, [stop]);

  return useMemo(
    () => ({ play, playNow, playSequence, stop }),
    [play, playNow, playSequence, stop],
  );
}
