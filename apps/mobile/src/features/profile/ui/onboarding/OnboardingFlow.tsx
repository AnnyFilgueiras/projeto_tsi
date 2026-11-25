import type { AllergenCode } from '@panelada/allergen-rules/rules';
import { useEffect, useState } from 'react';
import type { RegisterRestrictions, RestrictionsRetry } from '../../domain/register-restrictions';
import type {
  CuisineOption,
  SaveCulinaryPreferences,
} from '../../domain/save-culinary-preferences';
import { PreferencesStep } from './PreferencesStep';
import { RestrictionsStep } from './RestrictionsStep';
import type { StepError } from './step-error';
import { WelcomeStep } from './WelcomeStep';

export interface OnboardingFlowProps {
  /** Anonymous account + first download set (ADR-007); `offline` keeps the user on step 1. */
  readonly prepareAccount: () => Promise<'ready' | 'offline'>;
  readonly registerRestrictions: RegisterRestrictions;
  readonly listCuisines: () => Promise<readonly CuisineOption[]>;
  readonly saveCulinaryPreferences: SaveCulinaryPreferences;
  /** Marks onboarding done and leaves for Descobrir; injected by the route (A8). */
  readonly onFinish: () => Promise<void>;
}

/**
 * First-launch onboarding (UX-01A, US09): welcome → restrictions with LGPD consent → optional
 * cuisines. Every effect arrives through props, so this layer never touches data/ or core/.
 */
export function OnboardingFlow(props: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StepError | null>(null);

  const [picked, setPicked] = useState<readonly AllergenCode[]>([]);
  const [consent, setConsent] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);
  const [retry, setRetry] = useState<RestrictionsRetry | undefined>(undefined);

  const [cuisines, setCuisines] = useState<readonly CuisineOption[] | null>(null);
  const [chosen, setChosen] = useState<readonly string[]>([]);

  const { listCuisines } = props;
  useEffect(() => {
    if (step !== 3 || cuisines !== null) return;
    let active = true;
    listCuisines()
      .then((list) => active && setCuisines(list))
      .catch(() => active && setCuisines([]));
    return () => {
      active = false;
    };
  }, [step, cuisines, listCuisines]);

  function goTo(next: 1 | 2 | 3) {
    setError(null);
    setStep(next);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    run(async () => {
      if ((await props.prepareAccount()) === 'offline') setError('offline');
      else goTo(2);
    });

  // RN09: withdrawn consent ends the pending attempt too, so a later acceptance gets its own
  // consentAt instead of the one from the failed save.
  function clearConsent() {
    setConsent(false);
    setConsentInvalid(false);
    setRetry(undefined);
  }

  function toggleAllergen(code: AllergenCode) {
    const next = picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code];
    setPicked(next);
    // No consent is kept without data to consent to.
    if (next.length === 0) clearConsent();
  }

  function changeConsent(accepted: boolean) {
    if (!accepted) {
      clearConsent();
      return;
    }
    setConsent(true);
    setConsentInvalid(false);
  }

  function skipRestrictions() {
    setPicked([]);
    clearConsent();
    goTo(3);
  }

  function saveRestrictions() {
    if (!consent) {
      setConsentInvalid(true);
      return;
    }
    void run(async () => {
      const result = await props.registerRestrictions({ codes: picked, consented: true, retry });
      switch (result.status) {
        case 'saved':
          setRetry(undefined);
          goTo(3);
          return;
        case 'unavailable':
          setRetry(result.retry);
          setError('offline');
          return;
        case 'consent-required':
          setConsentInvalid(true);
          return;
        case 'rejected':
          setError('failed');
      }
    });
  }

  function toggleCuisine(id: string) {
    setChosen(chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]);
  }

  const finish = (save: boolean) =>
    run(async () => {
      if (save && (await props.saveCulinaryPreferences(chosen)) === 'unavailable') {
        setError('offline');
        return;
      }
      await props.onFinish();
    });

  if (step === 1) return <WelcomeStep busy={busy} error={error} onStart={start} />;

  if (step === 2)
    return (
      <RestrictionsStep
        picked={picked}
        consent={consent}
        consentInvalid={consentInvalid}
        busy={busy}
        error={error}
        onToggle={toggleAllergen}
        onConsentChange={changeConsent}
        onNone={skipRestrictions}
        onSave={saveRestrictions}
        onBack={() => goTo(1)}
      />
    );

  return (
    <PreferencesStep
      cuisines={cuisines}
      chosen={chosen}
      busy={busy}
      error={error}
      onToggle={toggleCuisine}
      onConfirm={() => void finish(true)}
      onSkip={() => void finish(false)}
      onBack={() => goTo(2)}
    />
  );
}
