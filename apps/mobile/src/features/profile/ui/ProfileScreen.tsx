import { ALLERGEN_CODES, type AllergenCode } from '@panelada/allergen-rules/rules';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../shared/theme';
import {
  ALLERGEN_LABELS,
  AllergenScopeBanner,
  Button,
  Chip,
  Icon,
  LastSync,
  LoadingScreen,
  Notice,
  RemovableChip,
} from '../../../shared/ui';
import type { ProfileSnapshot } from '../domain/profile-snapshot';
import type { RegisterRestrictions, RestrictionsRetry } from '../domain/register-restrictions';
import type { RevokeRestriction, RevokeRetry } from '../domain/revoke-restriction';
import type { CuisineOption, SavePreferencesResult } from '../domain/save-culinary-preferences';
import { AddRestrictionSheet } from './AddRestrictionSheet';
import { PROFILE_COPY } from './copy';
import { RemoveRestrictionSheet } from './RemoveRestrictionSheet';
import type { SheetError } from './sheet-error';

export interface ProfileScreenProps {
  readonly readProfile: () => Promise<ProfileSnapshot>;
  readonly listCuisines: () => Promise<readonly CuisineOption[]>;
  readonly registerRestrictions: RegisterRestrictions;
  readonly revokeRestriction: RevokeRestriction;
  /** Sends the whole list, empty included: unchecking the last cuisine must reach the server. */
  readonly savePreferences: (cuisineIds: readonly string[]) => Promise<SavePreferencesResult>;
}

type Load =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly profile: ProfileSnapshot }
  | { readonly kind: 'failed' };

interface RemoveState {
  readonly code: string;
  readonly busy: boolean;
  readonly error: SheetError | null;
}

interface AddState {
  readonly picked: readonly AllergenCode[];
  readonly consent: boolean;
  readonly consentInvalid: boolean;
  readonly busy: boolean;
  readonly error: SheetError | null;
  /** Resumes an offline attempt; dropped as soon as the selection changes. */
  readonly retry?: RestrictionsRetry;
}

const EMPTY_ADD: AddState = {
  picked: [],
  consent: false,
  consentInvalid: false,
  busy: false,
  error: null,
};

/**
 * Profile tab (US09, RN09, RN10): active restrictions with removal, culinary preferences and the
 * account line. Every change goes to the server first and the screen re-reads the local copy only
 * after it is confirmed (ADR-008 Stage 1), so an offline attempt leaves everything as it was.
 */
export function ProfileScreen(props: ProfileScreenProps) {
  const { readProfile, listCuisines } = props;
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [cuisines, setCuisines] = useState<readonly CuisineOption[]>([]);
  const [remove, setRemove] = useState<RemoveState | null>(null);
  const [add, setAdd] = useState<AddState | null>(null);
  const [savingCuisine, setSavingCuisine] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<SheetError | null>(null);
  // Kept per code across sheet openings: a resent revoke must reuse its opId (idempotency key).
  const revokeRetries = useRef(new Map<string, RevokeRetry>());

  const refresh = useCallback(async () => {
    try {
      setLoad({ kind: 'ready', profile: await readProfile() });
    } catch {
      setLoad({ kind: 'failed' });
    }
  }, [readProfile]);

  useEffect(() => {
    void refresh();
    listCuisines()
      .then(setCuisines)
      .catch(() => setCuisines([]));
  }, [refresh, listCuisines]);

  if (load.kind === 'loading') return <LoadingScreen />;

  if (load.kind === 'failed') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header />
        <View style={styles.content}>
          <Notice type="error" message={PROFILE_COPY.loadFailed} onRetry={() => void refresh()} />
        </View>
      </SafeAreaView>
    );
  }

  const { profile } = load;
  const hasRestrictions = profile.restrictions.length > 0;

  async function confirmRemove() {
    if (!remove || remove.busy) return;
    const { code } = remove;
    setRemove({ code, busy: true, error: null });
    let error: SheetError | null = null;
    try {
      const result = await props.revokeRestriction({
        code,
        retry: revokeRetries.current.get(code),
      });
      if (result.status === 'unavailable') {
        revokeRetries.current.set(code, result.retry);
        error = 'offline';
      } else {
        revokeRetries.current.delete(code);
        if (result.status === 'rejected') error = 'failed';
      }
    } catch {
      error = 'failed';
    }
    if (error) {
      setRemove({ code, busy: false, error });
      return;
    }
    setRemove(null);
    await refresh();
  }

  async function saveAdd() {
    if (!add || add.busy || add.picked.length === 0) return;
    // An active restriction means the consent is already on record (RN09); ask only when none.
    const consented = hasRestrictions || add.consent;
    if (!consented) {
      setAdd({ ...add, consentInvalid: true });
      return;
    }
    setAdd({ ...add, busy: true, error: null, consentInvalid: false });
    try {
      const result = await props.registerRestrictions({
        codes: add.picked,
        consented,
        retry: add.retry,
      });
      if (result.status === 'saved') {
        setAdd(null);
        await refresh();
        return;
      }
      setAdd({
        ...add,
        busy: false,
        consentInvalid: result.status === 'consent-required',
        error:
          result.status === 'unavailable'
            ? 'offline'
            : result.status === 'rejected'
              ? 'failed'
              : null,
        retry: result.status === 'unavailable' ? result.retry : undefined,
      });
    } catch {
      setAdd({ ...add, busy: false, error: 'failed' });
    }
  }

  function toggleAddCode(code: AllergenCode) {
    if (!add || add.busy) return;
    const picked = add.picked.includes(code)
      ? add.picked.filter((item) => item !== code)
      : [...add.picked, code];
    // A different selection is a new request: the old retry must not resend stale operations.
    setAdd({ ...add, picked, error: null, retry: undefined });
  }

  async function toggleCuisine(id: string) {
    if (savingCuisine !== null) return;
    const before = profile.preferences;
    const next = before.includes(id) ? before.filter((item) => item !== id) : [...before, id];
    setSavingCuisine(id);
    setPreferencesError(null);
    // Optimistic chip, rolled back if the server does not take it. Only `preferences` is touched:
    // a restriction removed while the save is pending must not come back with the rollback.
    const setPreferences = (preferences: readonly string[]) =>
      setLoad((current) =>
        current.kind === 'ready'
          ? { kind: 'ready', profile: { ...current.profile, preferences } }
          : current,
      );
    setPreferences(next);
    let result: SavePreferencesResult | 'failed';
    try {
      result = await props.savePreferences(next);
    } catch {
      result = 'failed';
    }
    setSavingCuisine(null);
    if (result === 'saved') return;
    setPreferencesError(result === 'unavailable' ? 'offline' : 'failed');
    setPreferences(before);
  }

  const lastRemaining = profile.restrictions.length === 1;

  return (
    <SafeAreaView style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {PROFILE_COPY.restrictions}
          </Text>
          {hasRestrictions ? (
            <>
              <View style={styles.chips}>
                {profile.restrictions.map((code) => (
                  <RemovableChip
                    key={code}
                    label={labelOf(code)}
                    onRemove={() => setRemove({ code, busy: false, error: null })}
                    testID={`restriction-${code}`}
                  />
                ))}
              </View>
              {profile.consentAt ? (
                <View style={styles.consent}>
                  <Icon name="lock" size={14} color={colors.textMuted} />
                  <Text style={styles.consentText}>{PROFILE_COPY.consent(profile.consentAt)}</Text>
                </View>
              ) : null}
              <AllergenScopeBanner size="compact" />
              <Button
                label={PROFILE_COPY.add}
                icon="plus"
                variant="secondary"
                onPress={() => setAdd(EMPTY_ADD)}
              />
            </>
          ) : (
            <>
              <Notice type="info" message={PROFILE_COPY.emptyRestrictions} />
              <Button
                label={PROFILE_COPY.addRestriction}
                icon="plus"
                variant="secondary"
                onPress={() => setAdd(EMPTY_ADD)}
              />
            </>
          )}
        </View>

        {cuisines.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {PROFILE_COPY.cuisines}
            </Text>
            <View style={styles.chips}>
              {cuisines.map((cuisine) => (
                <Chip
                  key={cuisine.id}
                  label={cuisine.name}
                  selected={profile.preferences.includes(cuisine.id)}
                  onPress={() => void toggleCuisine(cuisine.id)}
                  disabled={savingCuisine !== null}
                  fill
                  testID={`cuisine-${cuisine.id}`}
                />
              ))}
            </View>
            {preferencesError ? (
              <Notice
                type={preferencesError === 'offline' ? 'offline' : 'error'}
                message={
                  preferencesError === 'offline' ? PROFILE_COPY.offline : PROFILE_COPY.failed
                }
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {PROFILE_COPY.account}
          </Text>
          <Text style={styles.accountText}>{PROFILE_COPY.anonymous}</Text>
          {profile.lastSyncAt ? <LastSync syncedAt={profile.lastSyncAt} /> : null}
        </View>
      </ScrollView>

      <RemoveRestrictionSheet
        label={remove ? labelOf(remove.code) : null}
        isLast={lastRemaining}
        busy={remove?.busy ?? false}
        error={remove?.error ?? null}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemove(null)}
      />

      <AddRestrictionSheet
        visible={add !== null}
        active={profile.restrictions.filter(isAllergenCode)}
        picked={add?.picked ?? []}
        needsConsent={!hasRestrictions}
        consent={add?.consent ?? false}
        consentInvalid={add?.consentInvalid ?? false}
        busy={add?.busy ?? false}
        error={add?.error ?? null}
        onToggle={toggleAddCode}
        onConsentChange={(consent) => add && setAdd({ ...add, consent, consentInvalid: false })}
        onSave={() => void saveAdd()}
        onCancel={() => setAdd(null)}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {PROFILE_COPY.title}
      </Text>
    </View>
  );
}

function isAllergenCode(code: string): code is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(code);
}

// The server only accepts the controlled codes (A7), but a newer catalog could send one this
// build does not know yet: show the raw code rather than crash.
function labelOf(code: string): string {
  return isAllergenCode(code) ? ALLERGEN_LABELS[code].label : code;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  content: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  consent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  consentText: { ...typography.overline, flexShrink: 1, color: colors.textMuted },
  accountText: { ...typography.body, color: colors.textSecondary },
});
