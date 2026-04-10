import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useAuth } from '@/hooks/useAuth';
import { childAvatarToEmoji } from '@/lib/childAvatarEmoji';
import {
  getActiveChildProfile,
  isGuestModeEnabled,
  setActiveChildProfile,
  type ActiveChildProfile,
} from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function cardIsSelected(selectedId: string | null, profileId: string) {
  return selectedId === profileId;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function resolveCommonAudioPath(rawKey: string): string {
  return `/audio/he/${rawKey.split('.').map(toKebabCase).join('/')}.mp3`;
}

function resolveProfileSelectionAudioKey(profile: ActiveChildProfile): string {
  if (profile.id === 'guest') {
    return 'profile.guestName';
  }

  if (profile.id === 'maya' || profile.id === 'noam' || profile.id === 'liel') {
    return `profile.defaultNames.${profile.id}`;
  }

  return 'profile.title';
}

type PickerState = 'ftue_collapsed' | 'ftue_expanded_demo' | 'profile_selected';
const NAVIGATION_AUDIO_LEAD_MS = 140;

export default function ProfilePicker() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();
  const { user } = useAuth();
  const pendingNavigationTimeoutRef = useRef<number | null>(null);

  const clearPendingNavigation = useCallback(() => {
    if (pendingNavigationTimeoutRef.current !== null) {
      window.clearTimeout(pendingNavigationTimeoutRef.current);
      pendingNavigationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingNavigation, [clearPendingNavigation]);

  const playCommonAudioNow = useCallback(
    (audioKey: string) => {
      void audio.playNow(resolveCommonAudioPath(audioKey));
    },
    [audio],
  );

  const navigateWithLeadAudio = useCallback(
    (route: string, audioKey: string) => {
      playCommonAudioNow(audioKey);
      clearPendingNavigation();
      pendingNavigationTimeoutRef.current = window.setTimeout(() => {
        pendingNavigationTimeoutRef.current = null;
        navigate(route);
      }, NAVIGATION_AUDIO_LEAD_MS);
    },
    [clearPendingNavigation, navigate, playCommonAudioNow],
  );

  const guestProfile = useMemo<ActiveChildProfile>(
    () => ({ id: 'guest', name: t('profile.guestName'), emoji: '🧒' }),
    [t],
  );

  const demoProfiles = useMemo<ActiveChildProfile[]>(
    () => [
      { id: 'maya', name: t('profile.defaultNames.maya'), emoji: '🦊', ageBand: '3-4' },
      { id: 'noam', name: t('profile.defaultNames.noam'), emoji: '🐯', ageBand: '4-5' },
      { id: 'liel', name: t('profile.defaultNames.liel'), emoji: '🐼', ageBand: '5-6' },
    ],
    [t],
  );

  const guestProfiles = useMemo<ActiveChildProfile[]>(
    () => [guestProfile, ...demoProfiles],
    [demoProfiles, guestProfile],
  );

  const useHostedChildProfiles =
    isSupabaseConfigured && Boolean(user) && !isGuestModeEnabled();

  const [dbProfiles, setDbProfiles] = useState<ActiveChildProfile[] | null>(null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');
  const [childrenReloadNonce, setChildrenReloadNonce] = useState(0);

  useEffect(() => {
    if (!useHostedChildProfiles) {
      setDbProfiles(null);
      setChildrenError('');
      return;
    }

    let cancelled = false;
    setChildrenLoading(true);
    setChildrenError('');

    void supabase
      .from('children')
      .select('id, name, avatar')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setChildrenLoading(false);
        if (error) {
          setChildrenError(t('errors.generic'));
          setDbProfiles([]);
          return;
        }
        setDbProfiles(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            emoji: childAvatarToEmoji(row.avatar),
          })),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [childrenReloadNonce, t, useHostedChildProfiles]);

  const rememberedProfileId = getActiveChildProfile()?.id;
  const rememberedProfileExists = guestProfiles.some((profile) => profile.id === rememberedProfileId);
  const initialSelectedProfileId =
    rememberedProfileExists && rememberedProfileId ? rememberedProfileId : guestProfile.id;
  const initialDemoSheetExpanded = rememberedProfileExists && rememberedProfileId !== guestProfile.id;

  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialSelectedProfileId);
  const [isDemoSheetExpanded, setIsDemoSheetExpanded] = useState<boolean>(initialDemoSheetExpanded);

  useEffect(() => {
    if (!useHostedChildProfiles || !dbProfiles?.length) return;
    setSelectedProfileId((prev) => (dbProfiles.some((p) => p.id === prev) ? prev : dbProfiles[0].id));
  }, [dbProfiles, useHostedChildProfiles]);

  const profiles = useMemo<ActiveChildProfile[]>(
    () => (useHostedChildProfiles ? (dbProfiles ?? []) : guestProfiles),
    [dbProfiles, guestProfiles, useHostedChildProfiles],
  );

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? guestProfile;
  const pickerState: PickerState = useHostedChildProfiles
    ? 'profile_selected'
    : isDemoSheetExpanded
      ? 'ftue_expanded_demo'
      : selectedProfile.id === guestProfile.id
        ? 'ftue_collapsed'
        : 'profile_selected';

  const handleSelectProfile = useCallback(
    (profile: ActiveChildProfile, collapseDemoSheet = false) => {
      setSelectedProfileId(profile.id);
      if (collapseDemoSheet) {
        setIsDemoSheetExpanded(false);
      }
      playCommonAudioNow(resolveProfileSelectionAudioKey(profile));
    },
    [playCommonAudioNow],
  );

  const handleContinue = useCallback(() => {
    if (!selectedProfile) return;
    setActiveChildProfile(selectedProfile);
    navigateWithLeadAudio('/home', 'profile.continue');
  }, [navigateWithLeadAudio, selectedProfile]);

  const handleAddChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name || !useHostedChildProfiles) return;
    setAddBusy(true);
    setAddError('');
    const { data: fam, error: famErr } = await supabase.from('families').select('id').maybeSingle();
    if (famErr || !fam?.id) {
      setAddError(t('errors.generic'));
      setAddBusy(false);
      return;
    }
    const ins = await supabase
      .from('children')
      .insert({ family_id: fam.id, name, avatar: 'bear' })
      .select('id, name, avatar')
      .single();

    if (ins.error || !ins.data) {
      setAddError(t('errors.generic'));
      setAddBusy(false);
      return;
    }

    const profile: ActiveChildProfile = {
      id: ins.data.id,
      name: ins.data.name,
      emoji: childAvatarToEmoji(ins.data.avatar),
    };
    setDbProfiles((prev) => [...(prev ?? []), profile]);
    setSelectedProfileId(profile.id);
    setNewChildName('');
    setAddBusy(false);
  };

  if (useHostedChildProfiles && (childrenLoading || dbProfiles === null)) {
    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          background: 'var(--color-theme-bg)',
        }}
      >
        <MascotIllustration variant="loading" size={120} className="floating-element" />
      </main>
    );
  }

  if (useHostedChildProfiles && childrenError) {
    return (
      <main
        style={{
          flex: 1,
          background: 'var(--color-theme-bg)',
          padding: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card padding="lg" style={{ maxWidth: '440px', display: 'grid', gap: 'var(--space-md)' }}>
          <p style={{ color: 'var(--color-accent-danger)', textAlign: 'center' }}>{childrenError}</p>
          <Button
            variant="primary"
            size="lg"
            type="button"
            onClick={() => setChildrenReloadNonce((n) => n + 1)}
          >
            {t('profile.retry')}
          </Button>
        </Card>
      </main>
    );
  }

  if (useHostedChildProfiles && dbProfiles?.length === 0) {
    return (
      <main
        style={{
          flex: 1,
          background: 'var(--color-theme-bg)',
          padding: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <section style={{ width: 'min(480px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
          <header style={{ display: 'grid', gap: 'var(--space-sm)', textAlign: 'center' }}>
            <FloatingElement>
              <MascotIllustration variant="hero" size={112} />
            </FloatingElement>
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
              {t('profile.noChildrenYet')}
            </p>
          </header>
          <form onSubmit={handleAddChild} style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder={t('profile.childNamePlaceholder')}
              aria-label={t('profile.childNamePlaceholder')}
              autoComplete="nickname"
              style={{
                minHeight: 'var(--touch-min)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-bg-secondary)',
                padding: '0 var(--space-md)',
                fontSize: 'var(--font-size-md)',
                fontFamily: 'var(--font-family-primary)',
              }}
            />
            {addError ? (
              <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{addError}</p>
            ) : null}
            <Button variant="primary" size="lg" type="submit" disabled={!newChildName.trim() || addBusy}>
              {t('profile.addChild')}
            </Button>
          </form>
          <Button variant="secondary" size="md" type="button" onClick={() => navigate('/parent')}>
            {t('profile.parentZone')}
          </Button>
        </section>
      </main>
    );
  }

  const hostedAddChildForm = useHostedChildProfiles ? (
    <Card
      padding="md"
      style={{
        display: 'grid',
        gap: 'var(--space-sm)',
        border: '1px solid var(--color-bg-secondary)',
      }}
    >
      <form
        onSubmit={handleAddChild}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 'var(--space-sm)',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={newChildName}
          onChange={(e) => setNewChildName(e.target.value)}
          placeholder={t('profile.childNamePlaceholder')}
          aria-label={t('profile.childNamePlaceholder')}
          autoComplete="nickname"
          style={{
            minHeight: 'var(--touch-min)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-bg-secondary)',
            padding: '0 var(--space-md)',
            fontSize: 'var(--font-size-md)',
            fontFamily: 'var(--font-family-primary)',
          }}
        />
        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={!newChildName.trim() || addBusy}
          style={{ minHeight: 'var(--touch-min)' }}
        >
          {t('profile.addChild')}
        </Button>
      </form>
      {addError ? (
        <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{addError}</p>
      ) : null}
    </Card>
  ) : null;

  return (
    <main
      style={{
        flex: 1,
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section
        data-picker-state={pickerState}
        style={{ width: 'min(960px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}
      >
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
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

          <FloatingElement>
            <MascotIllustration variant="hero" size={112} />
          </FloatingElement>
        </header>

        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          <Card
            interactive
            onClick={() => handleSelectProfile(selectedProfile)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSelectProfile(selectedProfile);
              }
            }}
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 'var(--space-sm)',
              minHeight: '180px',
              border: '3px solid var(--color-theme-primary)',
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: 'var(--shadow-lg)',
            }}
            aria-label={selectedProfile.name}
            aria-pressed
          >
            <Avatar
              name={selectedProfile.name}
              emoji={selectedProfile.emoji}
              size="xl"
              style={{ border: '4px solid var(--color-accent-secondary)' }}
            />
            <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
              {selectedProfile.name}
            </strong>
          </Card>

          {!useHostedChildProfiles ? (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsDemoSheetExpanded((value) => !value)}
                aria-expanded={isDemoSheetExpanded}
                aria-controls="profile-picker-demo-sheet"
                style={{
                  justifySelf: 'end',
                  minHeight: 'var(--touch-min)',
                  minWidth: 'max-content',
                }}
              >
                {t('profile.moreDemoProfiles')}
              </Button>

              <div
                id="profile-picker-demo-sheet"
                aria-hidden={!isDemoSheetExpanded}
                style={{
                  display: 'grid',
                  overflow: 'hidden',
                  maxHeight: isDemoSheetExpanded ? '420px' : '0px',
                  opacity: isDemoSheetExpanded ? 1 : 0,
                  transform: isDemoSheetExpanded ? 'translateY(0)' : 'translateY(-8px)',
                  pointerEvents: isDemoSheetExpanded ? 'auto' : 'none',
                  transition:
                    'max-height var(--motion-duration-slow) var(--motion-ease-entrance), opacity var(--motion-duration-normal) var(--motion-ease-standard), transform var(--motion-duration-normal) var(--motion-ease-standard)',
                }}
              >
                <Card
                  padding="md"
                  style={{
                    display: 'grid',
                    gap: 'var(--space-md)',
                    border: '1px solid var(--color-bg-secondary)',
                  }}
                >
                  <strong style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
                    {t('profile.demoSheetTitle')}
                  </strong>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 'var(--space-md)',
                    }}
                  >
                    {demoProfiles.map((profile) => {
                      const isSelected = cardIsSelected(selectedProfileId, profile.id);

                      return (
                        <Card
                          key={profile.id}
                          interactive={isDemoSheetExpanded}
                          onClick={() => handleSelectProfile(profile, true)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleSelectProfile(profile, true);
                            }
                          }}
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            gap: 'var(--space-sm)',
                            minHeight: '120px',
                            border: isSelected
                              ? '3px solid var(--color-theme-primary)'
                              : '2px solid transparent',
                            transform: isSelected ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                            boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-card)',
                          }}
                          aria-label={profile.name}
                          aria-pressed={isSelected}
                        >
                          <Avatar
                            name={profile.name}
                            emoji={profile.emoji}
                            size="lg"
                            style={{
                              border: isSelected
                                ? '3px solid var(--color-accent-secondary)'
                                : '2px solid var(--color-bg-secondary)',
                            }}
                          />
                          <strong style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
                            {profile.name}
                          </strong>
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          ) : profiles.length > 1 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 'var(--space-md)',
              }}
            >
              {profiles.map((profile) => {
                const isSelected = cardIsSelected(selectedProfileId, profile.id);
                return (
                  <Card
                    key={profile.id}
                    interactive
                    onClick={() => handleSelectProfile(profile)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectProfile(profile);
                      }
                    }}
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      gap: 'var(--space-sm)',
                      minHeight: '120px',
                      border: isSelected ? '3px solid var(--color-theme-primary)' : '2px solid transparent',
                      boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-card)',
                    }}
                    aria-label={profile.name}
                    aria-pressed={isSelected}
                  >
                    <Avatar
                      name={profile.name}
                      emoji={profile.emoji}
                      size="lg"
                      style={{
                        border: isSelected
                          ? '3px solid var(--color-accent-secondary)'
                          : '2px solid var(--color-bg-secondary)',
                      }}
                    />
                    <strong style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
                      {profile.name}
                    </strong>
                  </Card>
                );
              })}
            </div>
          ) : null}

          {hostedAddChildForm}
        </div>

        <footer
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/parent')}
            style={{ minHeight: 'var(--touch-min)' }}
          >
            {t('profile.parentZone')}
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedProfile}
            aria-label={t('profile.continue')}
            style={{ minHeight: 'var(--touch-primary-action)' }}
          >
            {t('profile.continue')}
          </Button>
        </footer>
      </section>
    </main>
  );
}
