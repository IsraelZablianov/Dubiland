export interface GameProgress {
  id: string;
  childId: string;
  gameId: string;
  levelId: string | null;
  stars: number;
  score: number;
  attempts: number;
  completed: boolean;
  lastPlayed: string;
  createdAt: string;
}

export interface GameResult {
  stars: number;
  score: number;
  completed: boolean;
}

export interface VideoProgress {
  id: string;
  childId: string;
  videoId: string;
  watched: boolean;
  watchTimeSec: number;
  lastWatched: string;
}
