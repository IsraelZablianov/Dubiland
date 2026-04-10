import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioPlaybackQueueController } from '../src/hooks/audioPlaybackQueue.ts';

class FakeAudio {
  static instances = [];

  static behaviors = [];

  static reset() {
    FakeAudio.instances = [];
    FakeAudio.behaviors = [];
  }

  static queueBehaviors(behaviors) {
    FakeAudio.behaviors.push(...behaviors);
  }

  constructor(src) {
    this.src = src;
    this.preload = '';
    this.currentTime = 0;
    this.onended = null;
    this.onerror = null;
    this.pauseCallCount = 0;
    this.behavior = FakeAudio.behaviors.shift() ?? 'auto-end';
    FakeAudio.instances.push(this);
  }

  play() {
    if (this.behavior === 'reject') {
      return Promise.reject(new Error('simulated play rejection'));
    }

    if (this.behavior === 'auto-error') {
      queueMicrotask(() => this.onerror?.(new Event('error')));
      return Promise.resolve();
    }

    if (this.behavior === 'manual-end') {
      return Promise.resolve();
    }

    queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }

  pause() {
    this.pauseCallCount += 1;
  }

  finish() {
    this.onended?.();
  }
}

function flushMicrotasks() {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}

function createController() {
  return createAudioPlaybackQueueController({
    resolveAudioSrc: (path) => `/resolved${path}`,
    createAudio: (src) => new FakeAudio(src),
    maxPlaybackAttempts: 2,
  });
}

test('queues playback sequentially and avoids overlap', async () => {
  FakeAudio.reset();
  FakeAudio.queueBehaviors(['manual-end', 'auto-end']);
  const controller = createController();

  const firstPlayback = controller.play('/clip-a.mp3');
  const secondPlayback = controller.play('/clip-b.mp3');

  await flushMicrotasks();
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].src, '/resolved/clip-a.mp3');

  FakeAudio.instances[0].finish();

  await Promise.all([firstPlayback, secondPlayback]);
  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(FakeAudio.instances[1].src, '/resolved/clip-b.mp3');
});

test('retries a failed playback once before resolving', async () => {
  FakeAudio.reset();
  FakeAudio.queueBehaviors(['reject', 'auto-end']);
  const controller = createController();

  await controller.play('/retry-me.mp3');

  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(FakeAudio.instances[0].src, '/resolved/retry-me.mp3');
  assert.equal(FakeAudio.instances[1].src, '/resolved/retry-me.mp3');
});

test('skips clip after retry failure and continues queue', async () => {
  FakeAudio.reset();
  FakeAudio.queueBehaviors(['reject', 'reject', 'auto-end']);
  const controller = createController();

  await Promise.all([controller.play('/broken.mp3'), controller.play('/next.mp3')]);

  assert.equal(FakeAudio.instances.length, 3);
  assert.equal(FakeAudio.instances[0].src, '/resolved/broken.mp3');
  assert.equal(FakeAudio.instances[1].src, '/resolved/broken.mp3');
  assert.equal(FakeAudio.instances[2].src, '/resolved/next.mp3');
});

test('playNow interrupts active playback and clears queued clips', async () => {
  FakeAudio.reset();
  FakeAudio.queueBehaviors(['manual-end', 'auto-end', 'auto-end']);
  const controller = createController();

  const firstPlayback = controller.play('/first.mp3');
  void controller.play('/queued.mp3');

  await flushMicrotasks();
  assert.equal(FakeAudio.instances.length, 1);
  const firstAudio = FakeAudio.instances[0];

  await controller.playNow('/priority.mp3');
  await firstPlayback;

  assert.equal(firstAudio.pauseCallCount, 1);
  assert.equal(firstAudio.currentTime, 0);
  assert.equal(FakeAudio.instances.some((audio) => audio.src === '/resolved/queued.mp3'), false);
  assert.equal(FakeAudio.instances.some((audio) => audio.src === '/resolved/priority.mp3'), true);
});
