import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { FloatingElement } from '@/components/motion';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useAuth } from '@/hooks/useAuth';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { childAvatarToEmoji } from '@/lib/childAvatarEmoji';
import { resolveAgeBandFromBirthDate, type ChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { trackParentFunnelEvent } from '@/lib/parentFunnelInstrumentation';
import {
  getActiveChildProfile,
  isGuestModeEnabled,
  setActiveChildProfile,
  type ActiveChildProfile,
} from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

function cardIsSelected(selectedId: string | null, profileId: string) {
  return selectedId === profileId;
}

function resolveCommonAudioPath(rawKey: string): string {
  return resolveAudioPathFromKey(rawKey, 'common');
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
type AgeBandLabelKey =
  | 'contentFilters.age.band.3_4'
  | 'contentFilters.age.band.4_5'
  | 'contentFilters.age.band.5_6'
  | 'contentFilters.age.band.6_7';

const NAVIGATION_AUDIO_LEAD_MS = 140;
const AGE_BAND_OPTIONS: ReadonlyArray<{ value: ChildAgeBand; labelKey: AgeBandLabelKey }> = [
  { value: '3-4', labelKey: 'contentFilters.age.band.3_4' },
  { value: '4-5', labelKey: 'contentFilters.age.band.4_5' },
  { value: '5-6', labelKey: 'contentFilters.age.band.5_6' },
  { value: '6-7', labelKey: 'contentFilters.age.band.6_7' },
];

interface HostedChildProfileRow {
  id: string;
  name: string;
  avatar: string | null;
  birth_date: string | null;
}

function isChildAgeBand(value: string): value is ChildAgeBand {
  return value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7';
}

function toAgeBandLabelKey(ageBand: ChildAgeBand): AgeBandLabelKey {
  if (ageBand === '3-4') return 'contentFilters.age.band.3_4';
  if (ageBand === '4-5') return 'contentFilters.age.band.4_5';
  if (ageBand === '5-6') return 'contentFilters.age.band.5_6';
  return 'contentFilters.age.band.6_7';
}

function toBirthDateFromAgeBand(ageBand: ChildAgeBand, now: Date = new Date()): string {
  const yearsByBand: Record<ChildAgeBand, number> = {
    '3-4': 4,
    '4-5': 5,
    '5-6': 6,
    '6-7': 7,
  };
  const birthYear = now.getUTCFullYear() - yearsByBand[ageBand];
  const birthDate = new Date(Date.UTC(birthYear, 0, 1));
  return birthDate.toISOString().slice(0, 10);
}

function toHostedActiveProfile(row: HostedChildProfileRow): ActiveChildProfile {
  return {
    id: row.id,
    name: row.name,
    emoji: childAvatarToEmoji(row.avatar),
    ageBand: resolveAgeBandFromBirthDate(row.birth_date) ?? undefined,
  };
}

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
  const [newChildAgeBand, setNewChildAgeBand] = useState<ChildAgeBand>('3-4');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');
  const [childrenReloadNonce, setChildrenReloadNonce] = useState(0);

  const handleNewChildAgeBandChange = useCallback(
    (value: string) => {
      if (!isChildAgeBand(value)) {
        return;
      }
      setNewChildAgeBand(value);
      playCommonAudioNow(toAgeBandLabelKey(value));
    },
    [playCommonAudioNow],
  );

  useEffect(() => {
    if (!useHostedChildProfiles) {
      setDbProfiles(null);
      setChildrenError('');
      return;
    }

    let cancelled = false;
    setChildrenLoading(true);
    setChildrenError('');

    void (async () => {
      const supabase = await loadSupabaseRuntime();
      if (!supabase) {
        if (cancelled) return;
        setChildrenLoading(false);
        setChildrenError(t('errors.generic'));
        setDbProfiles([]);
        return;
      }

      const { data, error } = await supabase
        .from('children')
        .select('id, name, avatar, birth_date')
        .order('created_at', { ascending: true });

      if (cancelled) return;
      setChildrenLoading(false);
      if (error) {
        setChildrenError(t('errors.generic'));
        setDbProfiles([]);
        return;
      }

      setDbProfiles((data ?? []).map((row) => toHostedActiveProfile(row)));
    })();

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

    trackParentFunnelEvent('profile_entry_completed', {
      sourcePath: '/profiles',
      targetPath: '/games',
      entryMethod: useHostedChildProfiles ? 'authenticated_profile_continue' : 'guest_profile_continue',
      authMode: useHostedChildProfiles ? 'authenticated' : 'guest',
      metadata: {
        selectedProfileId: selectedProfile.id,
        selectedProfileType: useHostedChildProfiles
          ? 'hosted_child'
          : selectedProfile.id === 'guest'
            ? 'guest'
            : 'demo_profile',
      },
    });

    setActiveChildProfile(selectedProfile);
    navigateWithLeadAudio('/games', 'profile.continue');
  }, [navigateWithLeadAudio, selectedProfile, useHostedChildProfiles]);

  const handleAddChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name || !useHostedChildProfiles) return;
    setAddBusy(true);
    setAddError('');

    const supabase = await loadSupabaseRuntime();
    if (!supabase) {
      setAddError(t('errors.generic'));
      setAddBusy(false);
      return;
    }

    const { data: fam, error: famErr } = await supabase.from('families').select('id').maybeSingle();
    if (famErr || !fam?.id) {
      setAddError(t('errors.generic'));
      setAddBusy(false);
      return;
    }
    const ins = await supabase
      .from('children')
      .insert({
        family_id: fam.id,
        name,
        avatar: 'bear',
        birth_date: toBirthDateFromAgeBand(newChildAgeBand),
      })
      .select('id, name, avatar, birth_date')
      .single();

    if (ins.error || !ins.data) {
      setAddError(t('errors.generic'));
      setAddBusy(false);
      return;
    }

    const profile = toHostedActiveProfile(ins.data);
    setDbProfiles((prev) => [...(prev ?? []), profile]);
    setSelectedProfileId(profile.id);
    setNewChildName('');
    setNewChildAgeBand('3-4');
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
      <ChildRouteScaffold
        width="narrow"
        gap="var(--space-lg)"
        mainStyle={{
          background: 'var(--color-theme-bg)',
          padding: 'var(--space-xl)',
        }}
      >
        <div
          style={{
            inlineSize: '100%',
            maxInlineSize: '480px',
            justifySelf: 'center',
            display: 'grid',
            gap: 'var(--space-lg)',
          }}
        >
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
            <label htmlFor="profile-picker-age-band-empty" style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {t('contentFilters.age.title')}
              </span>
              <select
                id="profile-picker-age-band-empty"
                value={newChildAgeBand}
                onChange={(event) => handleNewChildAgeBandChange(event.target.value)}
                aria-label={t('contentFilters.age.title')}
                style={{
                  minHeight: 'var(--touch-min)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-bg-secondary)',
                  padding: '0 var(--space-md)',
                  fontSize: 'var(--font-size-md)',
                  fontFamily: 'var(--font-family-primary)',
                  background: 'var(--color-surface-primary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {AGE_BAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
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
        </div>
      </ChildRouteScaffold>
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
          gap: 'var(--space-sm)',
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 'var(--space-sm)',
            alignItems: 'end',
          }}
        >
          <label htmlFor="profile-picker-age-band-inline" style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('contentFilters.age.title')}
            </span>
            <select
              id="profile-picker-age-band-inline"
              value={newChildAgeBand}
              onChange={(event) => handleNewChildAgeBandChange(event.target.value)}
              aria-label={t('contentFilters.age.title')}
              style={{
                minHeight: 'var(--touch-min)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-bg-secondary)',
                padding: '0 var(--space-md)',
                fontSize: 'var(--font-size-md)',
                fontFamily: 'var(--font-family-primary)',
                background: 'var(--color-surface-primary)',
                color: 'var(--color-text-primary)',
              }}
            >
              {AGE_BAND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={!newChildName.trim() || addBusy}
          >
            {t('profile.addChild')}
          </Button>
        </div>
      </form>
      {addError ? (
        <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{addError}</p>
      ) : null}
    </Card>
  ) : null;

  return (
    <ChildRouteScaffold
      width="narrow"
      gap="var(--space-lg)"
      mainStyle={{
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-xl)',
      }}
    >
      <div data-picker-state={pickerState} style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <ChildRouteHeader
        title={t('profile.whoPlaysToday')}
        subtitle={t('profile.subtitle')}
        trailing={
          <FloatingElement>
            <MascotIllustration variant="hero" size={112} />
          </FloatingElement>
        }
        headingStyle={{ gap: 'var(--space-xs)' }}
        titleStyle={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
          color: 'var(--color-text-primary)',
        }}
        subtitleStyle={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}
      />

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
          >
            {t('profile.parentZone')}
          </Button>

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
      </div>
    </ChildRouteScaffold>
  );
}
