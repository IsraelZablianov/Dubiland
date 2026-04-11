import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { ShapeSafariGame } from '@/games/numbers/ShapeSafariGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const SHAPE_SAFARI_GAME: Game = {
  id: 'local-shape-safari',
  topicId: 'numbers',
  ageGroupId: '3-6',
  slug: 'shapeSafari',
  nameKey: 'games.shapeSafari.title',
  descriptionKey: 'games.shapeSafari.subtitle',
  gameType: 'drag_drop',
  componentKey: 'ShapeSafariGame',
  difficulty: 2,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/shape-safari/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const SHAPE_SAFARI_LEVEL: GameLevel = {
  id: 'local-shape-safari-level-1',
  gameId: SHAPE_SAFARI_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 6,
  },
  sortOrder: 1,
};

export default function ShapeSafariPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = toChildAgeBand(activeProfile?.ageBand) ?? undefined;
  const child = useMemo<Child>(
    () => ({
      id: activeProfile?.id ?? 'guest',
      familyId: 'local-family',
      name: activeProfile?.name ?? t('profile.guestName'),
      avatar: activeProfile?.emoji ?? '🧒',
      theme: 'bear',
      birthDate: null,
      createdAt: '2026-04-10T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );
  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...SHAPE_SAFARI_LEVEL,
      configJson: {
        ...(SHAPE_SAFARI_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const handleComplete = useCallback((result: GameCompletionResult) => {
    setCompletionResult(result);
    setSyncState('syncing');

    window.setTimeout(() => {
      setSyncState('synced');
    }, 450);
  }, []);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.shapeSafari.title')}
        subtitle={t('games.shapeSafari.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <ShapeSafariGame
          game={SHAPE_SAFARI_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t(syncState === 'syncing' ? 'feedback.keepGoing' : 'feedback.excellent')}
            </p>
          </Card>
        )}
    </ChildRouteScaffold>
  );
}
