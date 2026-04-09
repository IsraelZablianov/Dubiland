import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AudioController } from '@/games/engine';

interface QueueItem {
  path: string;
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

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
  const queueRef = useRef<QueueItem[]>([]);
  const drainingRef = useRef(false);
  const unmountedRef = useRef(false);

  const stopCurrent = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.onended = null;
    audioRef.current.onerror = null;
    audioRef.current = null;
  }, []);

  const clearQueue = useCallback(() => {
    const pending = queueRef.current.splice(0);
    for (const item of pending) {
      item.resolve();
    }
  }, []);

  const drain = useCallback(() => {
    if (drainingRef.current || unmountedRef.current) return;

    const next = queueRef.current[0];
    if (!next) return;

    drainingRef.current = true;

    stopCurrent();

    const el = new Audio(next.path);
    el.preload = 'auto';
    audioRef.current = el;

    el.onended = () => {
      queueRef.current.shift();
      next.resolve();
      drainingRef.current = false;
      drain();
    };

    el.onerror = () => {
      queueRef.current.shift();
      next.resolve();
      drainingRef.current = false;
      drain();
    };

    el.play().catch(() => {
      queueRef.current.shift();
      next.resolve();
      drainingRef.current = false;
      drain();
    });
  }, [stopCurrent]);

  const enqueue = useCallback(
    (path: string): Promise<void> => {
      if (!path) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        queueRef.current.push({ path, resolve, reject });
        if (!drainingRef.current) {
          drain();
        }
      });
    },
    [drain],
  );

  const play = useCallback((audioPath: string) => enqueue(audioPath), [enqueue]);

  const playNow = useCallback(
    (audioPath: string): Promise<void> => {
      stopCurrent();
      clearQueue();
      drainingRef.current = false;
      return enqueue(audioPath);
    },
    [stopCurrent, clearQueue, enqueue],
  );

  const playSequence = useCallback(
    async (audioPaths: string[]): Promise<void> => {
      for (const p of audioPaths) {
        await enqueue(p);
      }
    },
    [enqueue],
  );

  const stop = useCallback(() => {
    stopCurrent();
    clearQueue();
    drainingRef.current = false;
  }, [stopCurrent, clearQueue]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      stopCurrent();
      clearQueue();
      drainingRef.current = false;
    };
  }, [stopCurrent, clearQueue]);

  return useMemo(
    () => ({ play, playNow, playSequence, stop }),
    [play, playNow, playSequence, stop],
  );
}
