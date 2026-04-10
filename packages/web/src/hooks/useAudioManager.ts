import { useEffect, useMemo } from 'react';
import type { AudioController } from '@/games/engine';
import { assetUrl } from '@/lib/assetUrl';
import { createAudioPlaybackQueueController } from './audioPlaybackQueue';

/**
 * Queue-based audio controller for games.
 *
 * `play()` enqueues a clip — it won't start until the previous clip ends.
 * `playNow()` interrupts immediately (clears the queue first).
 * `playSequence()` enqueues multiple clips that play one after another.
 * `stop()` halts playback and drains the queue.
 */
const sharedAudioController = createAudioPlaybackQueueController({
  resolveAudioSrc: (path) => assetUrl(path),
});

let activeConsumerCount = 0;

export function useAudioManager(): AudioController {
  useEffect(() => {
    activeConsumerCount += 1;

    return () => {
      activeConsumerCount = Math.max(0, activeConsumerCount - 1);
      if (activeConsumerCount === 0) {
        sharedAudioController.stop();
      }
    };
  }, []);

  return useMemo(() => sharedAudioController, []);
}
