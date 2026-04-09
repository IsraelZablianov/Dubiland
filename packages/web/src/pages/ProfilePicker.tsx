import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, useTheme } from '@/components/design-system';
import {
  getActiveChildProfile,
  setActiveChildProfile,
  type ActiveChildProfile,
} from '@/lib/session';

function cardIsSelected(selectedId: string | null, profileId: string) {
  return selectedId === profileId;
}

export default function ProfilePicker() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { themeConfig } = useTheme();

  const profiles = useMemo<ActiveChildProfile[]>(
    () => [
      { id: 'guest', name: t('profile.guestName'), emoji: '🧒' },
      { id: 'maya', name: 'Maya', emoji: '🦊' },
      { id: 'noam', name: 'Noam', emoji: '🐯' },
      { id: 'liel', name: 'Liel', emoji: '🐼' },
    ],
    [t],
  );

  const rememberedProfileId = getActiveChildProfile()?.id ?? profiles[0]?.id ?? null;
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(rememberedProfileId);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  const handleContinue = () => {
    if (!selectedProfile) return;
    setActiveChildProfile(selectedProfile);
    navigate('/home');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(960px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: 'var(--font-size-3xl)' }}>{themeConfig.mascotEmoji}</span>
            <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                  color: 'var(--color-text-primary)',
                }}
              >
                {t('profile.whoPlaysToday')}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
                {t('profile.subtitle')}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/parent')}
            aria-label={t('nav.parentArea')}
          >
            {t('nav.parentArea')}
          </Button>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {profiles.map((profile) => {
            const isSelected = cardIsSelected(selectedProfileId, profile.id);

            return (
              <Card
                key={profile.id}
                interactive
                onClick={() => setSelectedProfileId(profile.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedProfileId(profile.id);
                  }
                }}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  gap: 'var(--space-sm)',
                  minHeight: '168px',
                  border: isSelected
                    ? '3px solid var(--color-theme-primary)'
                    : '2px solid transparent',
                  transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-card)',
                }}
                aria-label={profile.name}
              >
                <Avatar
                  name={profile.name}
                  emoji={profile.emoji}
                  size="xl"
                  style={{
                    border: isSelected
                      ? '4px solid var(--color-accent-secondary)'
                      : '2px solid var(--color-bg-secondary)',
                  }}
                />
                <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
                  {profile.name}
                </strong>
              </Card>
            );
          })}
        </div>

        <footer
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md">
              {t('profile.addChild')}
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/parent')}>
              {t('profile.manageProfiles')}
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedProfile}
            aria-label={t('profile.continue')}
          >
            {t('profile.continue')}
          </Button>
        </footer>
      </section>
    </main>
  );
}
