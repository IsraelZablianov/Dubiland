import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { HintTrend, PatternAccuracyKey } from '@/games/engine';
import { PatternTrainGame } from '@/games/numbers/PatternTrainGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type PatternMisconception = 'rule-skip' | 'distractor-bias' | 'attribute-confusion';

const PATTERN_TRAIN_GAME: Game = {
  id: 'local-pattern-train',
  topicId: 'math',
  ageGroupId: '4-5',
  slug: 'patternTrain',
  nameKey: 'games.patternTrain.title',
  descriptionKey: 'games.patternTrain.subtitle',
  gameType: 'drag_drop',
  componentKey: 'PatternTrainGame',
  difficulty: 2,
  sortOrder: 40,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/pattern-train/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const PATTERN_TRAIN_LEVEL: GameLevel = {
  id: 'local-pattern-train-level-1',
  gameId: PATTERN_TRAIN_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 10,
    promotionGates: {
      level1To2: {
        firstAttemptSuccessPct: 75,
        recentRounds: 8,
      },
      level2To3: {
        firstAttemptSuccessPct: 80,
        hintUsageMaxPct: 30,
        recentRounds: 10,
      },
    },
    misconceptionTags: ['rule-skip', 'distractor-bias', 'attribute-confusion'],
  },
  sortOrder: 1,
};

const PATTERN_LABEL_KEY: Record<PatternAccuracyKey, string> = {
  AB: 'games.patternTrain.patternTypes.AB',
  AAB: 'games.patternTrain.patternTypes.AAB',
  ABC: 'games.patternTrain.patternTypes.ABC',
  repair: 'games.patternTrain.patternTypes.repair',
};

const MISCONCEPTION_LABEL_KEY: Record<PatternMisconception, string> = {
  'rule-skip': 'games.patternTrain.misconceptions.ruleSkip',
  'distractor-bias': 'games.patternTrain.misconceptions.distractorBias',
  'attribute-confusion': 'games.patternTrain.misconceptions.attributeConfusion',
};

function estimateHintReliance(trend: HintTrend | undefined): number {
  if (trend === 'improving') {
    return 20;
  }
  if (trend === 'needs_support') {
    return 45;
  }
  return 30;
}

function resolveFocusPattern(
  accuracyByPatternType: Partial<Record<PatternAccuracyKey, number>> | undefined,
): PatternAccuracyKey {
  if (!accuracyByPatternType) {
    return 'AB';
  }

  const entries = Object.entries(accuracyByPatternType) as Array<[PatternAccuracyKey, number | undefined]>;
  const filtered = entries.filter((entry): entry is [PatternAccuracyKey, number] => typeof entry[1] === 'number');
  if (filtered.length === 0) {
    return 'AB';
  }

  filtered.sort((left, right) => left[1] - right[1]);
  return filtered[0][0];
}

function resolveTopMisconception(
  misconceptionTrend: Partial<Record<PatternMisconception, number>> | undefined,
): PatternMisconception {
  if (!misconceptionTrend) {
    return 'rule-skip';
  }

  const entries = Object.entries(misconceptionTrend) as Array<[PatternMisconception, number | undefined]>;
  const filtered = entries.filter((entry): entry is [PatternMisconception, number] => typeof entry[1] === 'number');
  if (filtered.length === 0) {
    return 'rule-skip';
  }

  filtered.sort((left, right) => right[1] - left[1]);
  return filtered[0][0];
}

export default function PatternTrainPage() {
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
      createdAt: '2026-04-11T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...PATTERN_TRAIN_LEVEL,
      configJson: {
        ...(PATTERN_TRAIN_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: PATTERN_TRAIN_GAME,
    level: runtimeLevel,
  });

  const accuracyByPatternType = completionResult?.summaryMetrics?.accuracyByPatternType;
  const misconceptionTrend = completionResult?.summaryMetrics?.misconceptionTrend as
    | Partial<Record<PatternMisconception, number>>
    | undefined;

  const focusPattern = resolveFocusPattern(accuracyByPatternType);
  const topMisconception = resolveTopMisconception(misconceptionTrend);
  const firstTryRate = completionResult?.summaryMetrics?.firstAttemptSuccessRate ?? 0;
  const hintReliance = estimateHintReliance(completionResult?.summaryMetrics?.hintTrend);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.patternTrain.title')}
        subtitle={t('games.patternTrain.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <PatternTrainGame
        game={PATTERN_TRAIN_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.patternTrain.progressSummary', {
              firstTryRate: `${Math.round(firstTryRate)}%`,
              hintReliance: `${hintReliance}%`,
              topMisconception: t(MISCONCEPTION_LABEL_KEY[topMisconception] as any),
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.patternTrain.patternBreakdown', {
              focusPattern: t(PATTERN_LABEL_KEY[focusPattern] as any),
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('parentDashboard.games.patternTrain.nextStep')}</p>

          {syncState === 'error' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
                {t('profile.retry')}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </ChildRouteScaffold>
  );
}
