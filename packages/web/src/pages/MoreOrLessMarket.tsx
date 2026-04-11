import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { MoreOrLessMarketGame } from '@/games/numbers/MoreOrLessMarketGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const MORE_OR_LESS_MARKET_GAME: Game = {
  id: 'local-more-or-less-market',
  topicId: 'numbers',
  ageGroupId: '5-6',
  slug: 'moreOrLessMarket',
  nameKey: 'games.moreOrLessMarket.title',
  descriptionKey: 'games.moreOrLessMarket.subtitle',
  gameType: 'match',
  componentKey: 'MoreOrLessMarketGame',
  difficulty: 3,
  sortOrder: 2,
  thumbnailUrl: '/images/games/thumbnails/moreOrLessMarket/thumb-16x10.webp',
  audioUrl: '/audio/he/games/more-or-less-market/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const MORE_OR_LESS_MARKET_LEVEL: GameLevel = {
  id: 'local-more-or-less-market-level-1',
  gameId: MORE_OR_LESS_MARKET_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 9,
  },
  sortOrder: 1,
};

export default function MoreOrLessMarketPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
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

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: MORE_OR_LESS_MARKET_GAME,
    level: MORE_OR_LESS_MARKET_LEVEL,
  });

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.moreOrLessMarket.title')}
        subtitle={t('games.moreOrLessMarket.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <MoreOrLessMarketGame
        game={MORE_OR_LESS_MARKET_GAME}
        level={MORE_OR_LESS_MARKET_LEVEL}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult && syncState === 'error' && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('errors.generic')}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
              {t('profile.retry')}
            </Button>
          </div>
        </Card>
      )}
    </ChildRouteScaffold>
  );
}
