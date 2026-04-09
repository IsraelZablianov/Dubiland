import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, StarRating } from '@/components/design-system';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { disableGuestMode, getActiveChildProfile } from '@/lib/session';

interface ChildProgressRow {
  id: string;
  name: string;
  emoji: string;
  gamesPlayed: number;
  learningMinutes: number;
  streak: number;
  stars: number;
}

export default function ParentDashboard() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [error, setError] = useState('');

  const activeChild = getActiveChildProfile();

  const children = useMemo<ChildProgressRow[]>(() => {
    const primaryName = activeChild?.name ?? t('profile.guestName');
    const primaryEmoji = activeChild?.emoji ?? '🧒';

    return [
      {
        id: 'primary',
        name: primaryName,
        emoji: primaryEmoji,
        gamesPlayed: 8,
        learningMinutes: 31,
        streak: 5,
        stars: 3,
      },
      {
        id: 'maya',
        name: 'Maya',
        emoji: '🦊',
        gamesPlayed: 6,
        learningMinutes: 22,
        streak: 3,
        stars: 2,
      },
    ];
  }, [activeChild?.emoji, activeChild?.name, t]);

  const totals = useMemo(() => {
    return children.reduce(
      (acc, child) => {
        acc.gamesPlayed += child.gamesPlayed;
        acc.learningMinutes += child.learningMinutes;
        acc.streak = Math.max(acc.streak, child.streak);
        return acc;
      },
      { gamesPlayed: 0, learningMinutes: 0, streak: 0 },
    );
  }, [children]);

  const handleLogout = async () => {
    setError('');

    disableGuestMode();

    if (isSupabaseConfigured) {
      try {
        await signOut();
      } catch {
        setError(t('errors.generic'));
        return;
      }
    }

    navigate('/login');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1080px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-md)',
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
              {t('parentDashboard.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('parentDashboard.subtitle')}</p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="md" onClick={() => navigate('/profiles')}>
              {t('parentDashboard.manageChildren')}
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/home')}>
              {t('nav.home')}
            </Button>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.gamesPlayed')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.gamesPlayed}
            </strong>
          </Card>

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.learningMinutes')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.learningMinutes}
            </strong>
          </Card>

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.streak')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.streak}
            </strong>
          </Card>

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.todayActivity')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              72%
            </strong>
          </Card>
        </div>

        <section style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.weeklyProgress')}
          </h2>

          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {children.map((child) => (
              <Card key={child.id} padding="md">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                  }}
                >
                  <Avatar name={child.name} emoji={child.emoji} size="lg" />
                  <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{child.name}</strong>
                    <StarRating value={child.stars} max={3} size="sm" />
                  </div>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.gamesPlayed')}: {child.gamesPlayed}
                  </span>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('home.minutes', { count: child.learningMinutes })}
                  </span>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.streak')}: {child.streak}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <footer style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="md">
            {t('parentDashboard.viewReports')}
          </Button>
          <Button variant="secondary" size="md">
            {t('parentDashboard.audioSettings')}
          </Button>
          <Button variant="danger" size="md" onClick={handleLogout}>
            {t('parentDashboard.logout')}
          </Button>
        </footer>

        {error ? (
          <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        ) : null}
      </section>
    </main>
  );
}
