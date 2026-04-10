import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { LetterSoundMatchGame } from '@/games/letters/LetterSoundMatchGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const LETTER_SOUND_MATCH_GAME: Game = {
  id: 'local-letter-sound-match',
  topicId: 'letters',
  ageGroupId: '4-6',
  slug: 'letterSoundMatch',
  nameKey: 'games.letterSoundMatch.title',
  descriptionKey: 'games.letterSoundMatch.subtitle',
  gameType: 'match',
  componentKey: 'LetterSoundMatchGame',
  difficulty: 3,
  sortOrder: 1,
  thumbnailUrl: '/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp',
  audioUrl: '/audio/he/games/letter-sound-match/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const LETTER_SOUND_MATCH_LEVEL: GameLevel = {
  id: 'local-letter-sound-match-level-1',
  gameId: LETTER_SOUND_MATCH_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 6,
  },
  sortOrder: 1,
};

export default function LetterSoundMatchPage() {
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

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const handleComplete = useCallback((result: GameCompletionResult) => {
    setCompletionResult(result);
    setSyncState('syncing');

    window.setTimeout(() => {
      setSyncState('synced');
    }, 450);
  }, []);

  const confusedPairFallback = useMemo(() => {
    const alef = Array.from(t('letters.pronunciation.alef'))[0] ?? t('letters.pronunciation.alef');
    const ayin = Array.from(t('letters.pronunciation.ayin'))[0] ?? t('letters.pronunciation.ayin');
    return `${alef}/${ayin}`;
  }, [t]);

  return (
    <main
      style={{
        flex: 1,
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1180px, 100%)', display: 'grid', gap: 'var(--space-md)' }}>
        <header
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.letterSoundMatch.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.letterSoundMatch.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <LetterSoundMatchGame
          game={LETTER_SOUND_MATCH_GAME}
          level={LETTER_SOUND_MATCH_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.letterSoundMatch.progressSummary', {
                accuracy: completionResult.summaryMetrics.firstAttemptSuccessRate,
                confusedPair: confusedPairFallback,
              })}
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
