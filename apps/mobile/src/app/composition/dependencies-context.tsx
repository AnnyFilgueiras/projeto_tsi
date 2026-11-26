import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MobileDependencies } from './index';

const DependenciesContext = createContext<MobileDependencies | null>(null);

export interface DependenciesProviderProps {
  /** Builds the dependency graph once (the real composition root, or fakes in tests). */
  readonly create: () => Promise<MobileDependencies>;
  readonly loading: ReactNode;
  /** `retry` builds the graph again (e.g. the encrypted database could not be opened). */
  readonly renderError: (error: Error, retry: () => void) => ReactNode;
  readonly children: ReactNode;
}

/**
 * Holds the one dependency graph for the app's lifetime (A8: no module-level singletons).
 * Rendering waits for the encrypted database to open and migrate, so screens can assume it.
 */
export function DependenciesProvider({
  create,
  loading,
  renderError,
  children,
}: DependenciesProviderProps) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'ready'; deps: MobileDependencies }
    | { kind: 'error'; error: Error }
  >({ kind: 'loading' });
  // StrictMode runs effects twice in development; opening the database twice would race.
  const started = useRef(-1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    create()
      .then((deps) => {
        setState({ kind: 'ready', deps });
        void deps.syncInBackground();
      })
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      );
  }, [create, attempt]);

  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((current) => current + 1);
  };

  if (state.kind === 'loading') return <>{loading}</>;
  if (state.kind === 'error') return <>{renderError(state.error, retry)}</>;
  return <DependenciesContext.Provider value={state.deps}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): MobileDependencies {
  const deps = useContext(DependenciesContext);
  if (!deps) {
    throw new Error('useDependencies must be used inside <DependenciesProvider>.');
  }
  return deps;
}
