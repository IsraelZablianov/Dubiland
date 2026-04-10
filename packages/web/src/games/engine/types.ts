import type { Child, Game, GameLevel, GameResult } from '@dubiland/shared';

export type StableRange = '1-3' | '1-5' | '1-10';
export type HintTrend = 'improving' | 'steady' | 'needs_support';

export interface ParentSummaryMetrics {
  highestStableRange: StableRange;
  firstAttemptSuccessRate: number;
  hintTrend: HintTrend;
  ageBand?: '3-4' | '5-6' | '6-7';
  listenParticipation?: number;
  decodeAccuracy?: number;
  sequenceEvidenceScore?: number;
  gatePassed?: boolean;
}

export interface ReadingGateStatus {
  activeBookId: string;
  nextBookId: string | null;
  passed: boolean;
  firstAttemptSuccessRate: number;
  hintRate: number;
  firstTryAccuracyMin: number;
  hintRateMax: number;
}

export interface GameCompletionResult extends GameResult {
  summaryMetrics?: ParentSummaryMetrics;
  roundsCompleted?: number;
  readingGate?: ReadingGateStatus;
}

export interface AudioController {
  /** Queue a sound — waits for any currently-playing audio to finish first. */
  play: (audioPath: string) => Promise<void>;
  /** Play immediately, interrupting current audio and clearing the queue. */
  playNow: (audioPath: string) => Promise<void>;
  /** Play a list of sounds sequentially (queued after any current playback). */
  playSequence: (audioPaths: string[]) => Promise<void>;
  /** Stop current audio and clear the queue. */
  stop: () => void;
}

export interface GameProps {
  game: Game;
  level: GameLevel;
  child: Child;
  onComplete: (result: GameCompletionResult) => void;
  audio: AudioController;
}
