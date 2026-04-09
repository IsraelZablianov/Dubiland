export interface Topic {
  id: string;
  slug: string;
  nameKey: string;
  icon: string;
  sortOrder: number;
}

export interface AgeGroup {
  id: string;
  labelKey: string;
  minAge: number;
  maxAge: number;
}

export interface Game {
  id: string;
  topicId: string;
  ageGroupId: string;
  slug: string;
  nameKey: string;
  descriptionKey: string | null;
  gameType: string;
  componentKey: string;
  difficulty: number;
  sortOrder: number;
  thumbnailUrl: string | null;
  audioUrl: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface GameLevel {
  id: string;
  gameId: string;
  levelNumber: number;
  configJson: Record<string, unknown>;
  sortOrder: number;
}

export interface Video {
  id: string;
  topicId: string;
  ageGroupId: string;
  nameKey: string;
  descriptionKey: string | null;
  videoType: 'explainer' | 'song' | 'interactive';
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}
